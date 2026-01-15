import { Hono } from "hono";
import { cors } from "hono/cors";
import { jwt } from "hono/jwt";
import db from "./db";
import { z } from "zod";
import { sign } from "hono/jwt";
// Bun is a global in the Bun runtime; importing it breaks module loading.

const app = new Hono();
const JWT_SECRET = "it-is-a-secret-key-change-me";
const PORT = Number(Bun.env.PORT || 3000) || 3000;

const log = (...args: any[]) => {
  console.log("[api]", ...args);
};

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.nchc.org.tw/api/interpreter",
];
const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";

app.use("/*", cors());

// Schemas
const registerSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

const markerSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  type: z.enum(["good", "medium", "bad", "closed", "ice", "snow"]),
  description: z.string().optional(),
});

// Auth
app.post("/api/auth/register", async (c) => {
  const body = await c.req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);
  
  const { username, password } = parsed.data;
  const hash = await Bun.password.hash(password);
  
  try {
    db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, hash]);
    return c.json({ message: "Registered" });
  } catch (e) {
    return c.json({ error: "Username exists" }, 400);
  }
});

app.post("/api/auth/login", async (c) => {
  const body = await c.req.json();
  const { username, password } = body;
  
  const user = db.query("SELECT * FROM users WHERE username = ?").get(username) as any;
  if (!user) return c.json({ error: "Invalid credentials" }, 401);
  
  const valid = await Bun.password.verify(password, user.password);
  if (!valid) return c.json({ error: "Invalid credentials" }, 401);
  
  const token = await sign({ id: user.id, username: user.username, exp: Math.floor(Date.now()/1000) + 60*60*24 }, JWT_SECRET);
  return c.json({ token, username: user.username, id: user.id, isAdmin: user.isAdmin === 1 });
});

// Public Markers (Only approved)
app.get("/api/markers", (c) => {
  const markers = db.query("SELECT * FROM markers WHERE approved = 1").all();
  return c.json(markers);
});

app.get("/api/markers/search", (c) => {
  const latParam = c.req.query("lat");
  const lngParam = c.req.query("lng");
  const radiusParam = c.req.query("radius");
  const userIdParam = c.req.query("userId");

  // If userId is provided, return all markers for that user
  if (userIdParam) {
    const markers = db.query("SELECT * FROM markers WHERE userId = ? ORDER BY createdAt DESC").all(parseInt(userIdParam));
    return c.json(markers);
  }

  const lat = parseFloat(latParam || "0");
  const lng = parseFloat(lngParam || "0");
  const radius = parseFloat(radiusParam || "10"); // km
  
  if (!latParam || !lngParam) return c.json({ error: "Missing lat/lng" }, 400);

  // Simple bounding box for speed
  const deg = radius / 111;
  const markers = db.query(`
    SELECT * FROM markers 
    WHERE approved = 1
    AND lat BETWEEN ? AND ? 
    AND lng BETWEEN ? AND ?
  `).all(lat - deg, lat + deg, lng - deg, lng + deg) as any[];
  
  // Precise filter
  const filtered = markers.filter(m => {
    const d = getDistanceFromLatLonInKm(lat, lng, m.lat, m.lng);
    return d <= radius;
  });
  
  return c.json(filtered);
});

// Protected Markers API
const protectedRoutes = new Hono();
protectedRoutes.use("/*", jwt({ secret: JWT_SECRET, alg: 'HS256' }));

protectedRoutes.post("/", async (c) => {
  const payload = c.get('jwtPayload');
  const userId = payload.id;
  
  const body = await c.req.json();
  const parsed = markerSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);
  
  const { lat, lng, type, description } = parsed.data;
  
  db.run("INSERT INTO markers (userId, lat, lng, type, description) VALUES (?, ?, ?, ?, ?)", 
    [userId, lat, lng, type, description || ""]);
    
  return c.json({ message: "Added" });
});

protectedRoutes.delete("/:id", (c) => {
   const payload = c.get('jwtPayload');
   const id = c.req.param("id");
   const marker = db.query("SELECT userId FROM markers WHERE id = ?").get(id) as any;
   
   if (!marker) return c.json({error: "Not found"}, 404);
   if (marker.userId !== payload.id) return c.json({error: "Unauthorized"}, 403);
   
   db.run("DELETE FROM markers WHERE id = ?", [id]);
   return c.json({ message: "Deleted" });
});

app.route("/api/markers", protectedRoutes);

// Admin approval routes
const adminRoutes = new Hono();
adminRoutes.use("/*", jwt({ secret: JWT_SECRET, alg: 'HS256' }));

adminRoutes.get("/pending", (c) => {
  const payload = c.get('jwtPayload');
  const user = db.query("SELECT isAdmin FROM users WHERE id = ?").get(payload.id) as any;
  if (!user?.isAdmin) return c.json({ error: "Unauthorized" }, 403);
  
  const pending = db.query("SELECT * FROM markers WHERE approved = 0").all();
  return c.json(pending);
});

adminRoutes.post("/approve/:id", (c) => {
  const payload = c.get('jwtPayload');
  const user = db.query("SELECT isAdmin FROM users WHERE id = ?").get(payload.id) as any;
  if (!user?.isAdmin) return c.json({ error: "Unauthorized" }, 403);
  
  const id = c.req.param("id");
  db.run("UPDATE markers SET approved = 1 WHERE id = ?", [id]);
  return c.json({ message: "Approved" });
});

adminRoutes.delete("/reject/:id", (c) => {
  const payload = c.get('jwtPayload');
  const user = db.query("SELECT isAdmin FROM users WHERE id = ?").get(payload.id) as any;
  if (!user?.isAdmin) return c.json({ error: "Unauthorized" }, 403);
  
  const id = c.req.param("id");
  db.run("DELETE FROM markers WHERE id = ?", [id]);
  return c.json({ message: "Rejected" });
});

app.route("/api/admin", adminRoutes);

// Weather forecast proxy (hourly)
app.get("/api/weather", async (c) => {
  const lat = parseFloat(c.req.query("lat") || "");
  const lng = parseFloat(c.req.query("lng") || "");
  if (Number.isNaN(lat) || Number.isNaN(lng)) return c.json({ error: "Invalid lat/lng" }, 400);

  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    current: "temperature_2m,weather_code,wind_speed_10m",
    hourly: "temperature_2m,precipitation_probability,wind_speed_10m",
    forecast_days: "2",
    timezone: "auto",
  });

  const res = await fetch(`${OPEN_METEO_URL}?${params.toString()}`);
  if (!res.ok) return c.json({ error: "Weather fetch failed" }, 502);
  const data = await res.json();
  return c.json(data);
});

function getDistanceFromLatLonInKm(lat1:number,lon1:number,lat2:number,lon2:number) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1); 
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; 
  return d;
}

function deg2rad(deg:number) {
  return deg * (Math.PI/180)
}

export default {
    port: PORT,
    fetch: app.fetch,
    idleTimeout: 30,
}
