import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import ky from 'ky';
import { useAuthStore } from '../store/auth.ts';
import { CloudSun, Wind } from 'lucide-react';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import L from 'leaflet';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

type MarkerType = {
  id: number;
  lat: number;
  lng: number;
  type: string;
  description: string;
  userId: number;
  approved: number;
};

type WeatherPayload = {
  current?: {
    temperature_2m: number;
    weather_code: number;
    wind_speed_10m: number;
  };
};

function LocationMarker({ onAdd }: { onAdd: (lat: number, lng: number) => void }) {
  const { username } = useAuthStore();
  useMapEvents({
    click(e) {
      if (username) onAdd(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.flyTo([lat, lng], 12);
  }, [lat, lng, map]);
  return null;
}

export default function MapPage() {
  const { token, id: currentUserId } = useAuthStore();
  const [markers, setMarkers] = useState<MarkerType[]>([]);
  const [searchPos, setSearchPos] = useState<{ lat: number; lng: number } | null>(null);
  const [weather, setWeather] = useState<WeatherPayload | null>(null);

  const [newMarker, setNewMarker] = useState<{ lat: number; lng: number } | null>(null);
  const [newType, setNewType] = useState('good');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    fetchMarkers();
    const defaultLat = 49.8175;
    const defaultLng = 15.473;
    setSearchPos({ lat: defaultLat, lng: defaultLng });
    fetchWeatherForecast(defaultLat, defaultLng);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMarkers = async () => {
    try {
      const data = await ky.get(`${API_BASE}/api/markers`).json<MarkerType[]>();
      setMarkers(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchWeatherForecast = async (lat: number, lng: number) => {
    try {
      const data = await ky
        .get(`${API_BASE}/api/weather`, { searchParams: { lat, lng } })
        .json<WeatherPayload>();
      setWeather(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddMarker = async () => {
    if (!newMarker) return;
    try {
      await ky.post(`${API_BASE}/api/markers`, {
        headers: { Authorization: `Bearer ${token}` },
        json: { lat: newMarker.lat, lng: newMarker.lng, type: newType, description: newDesc },
      });
      setNewMarker(null);
      setNewDesc('');
      setNewType('good');
      fetchMarkers();
    } catch (e) {
      alert('Failed to add marker');
    }
  };

  const handleDelete = async (markerId: number) => {
    if (!confirm('Are you sure?')) return;
    try {
      await ky.delete(`${API_BASE}/api/markers/${markerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchMarkers();
    } catch (e) {
      alert('Failed to delete');
    }
  };

  return (
    <div className="h-full w-full relative bg-slate-900">
      {weather?.current && (
        <div className="absolute top-4 right-4 rounded-2xl bg-white/95 text-slate-900 shadow-xl border border-slate-200/70 p-4 flex items-center gap-3" style={{ zIndex: 1200 }}>
          <CloudSun className="text-amber-500 w-10 h-10" />
          <div>
            <div className="text-xs uppercase font-semibold text-slate-500">Aktuální počasí</div>
            <div className="text-2xl font-bold">{weather.current.temperature_2m}°C</div>
            <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
              <Wind className="w-4 h-4" /> {weather.current.wind_speed_10m} km/h
            </div>
          </div>
        </div>
      )}

      <MapContainer center={[49.8175, 15.473]} zoom={7.5} className="h-full w-full">
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='Map data © <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
        />
        <LocationMarker onAdd={(lat, lng) => setNewMarker({ lat, lng })} />
        {searchPos && <FlyTo lat={searchPos.lat} lng={searchPos.lng} />}

        {markers.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lng]} icon={getColorIcon(m.type)}>
            <Popup>
              <div className="min-w-37.5">
                <strong className="block mb-1 text-lg capitalize">{mapper(m.type)}</strong>
                <p className="text-slate-600 my-1">{m.description || 'No description'}</p>
                <span className="text-xs text-slate-400 block mb-2">ID: {m.id}</span>
                {currentUserId === m.userId && (
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="block w-full bg-red-500 hover:bg-red-600 text-white text-xs py-1.5 rounded transition-colors"
                  >
                    Smazat hlášení
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {newMarker && (
          <Marker position={[newMarker.lat, newMarker.lng]} icon={DefaultIcon}>
            <Popup
              closeButton={true}
              eventHandlers={{ 
                remove: () => {
                  setNewMarker(null);
                  setNewDesc('');
                  setNewType('good');
                }
              }}
            >
              <div className="p-2 min-w-50">
                <b className="block mb-2 text-lg">Nahlásit stav silnice</b>
                <select
                  className="block w-full border border-slate-300 rounded p-1.5 mb-2 bg-white text-slate-800"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                >
                  <option value="good">Sjízdná</option>
                  <option value="medium">Pozor</option>
                  <option value="bad">Špatná</option>
                  <option value="snow">Sníh</option>
                  <option value="ice">Led</option>
                  <option value="closed">Uzavřeno</option>
                </select>
                <textarea
                  className="block w-full border border-slate-300 rounded p-1.5 mb-2 h-20 text-sm"
                  placeholder="Popis situace..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
                <button
                  onClick={handleAddMarker}
                  className="bg-blue-600 hover:bg-blue-700 text-white w-full py-1.5 rounded font-medium transition-colors"
                >
                  Odeslat hlášení
                </button>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

function mapper(type: string) {
  const map: Record<string, string> = {
    good: 'Sjízdná',
    medium: 'Pozor',
    bad: 'Špatná',
    snow: 'Sníh',
    ice: 'Led',
    closed: 'Uzavřeno',
  };
  return map[type] || type;
}

function getColorIcon(type: string) {
  return new L.DivIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color:${getColor(type)}; width:16px; height:16px; border-radius:50%; border:3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

function getColor(type: string) {
  switch (type) {
    case 'good':
      return '#10b981';
    case 'medium':
      return '#f59e0b';
    case 'bad':
      return '#ef4444';
    case 'closed':
      return '#000000';
    case 'snow':
      return '#cbd5e1';
    case 'ice':
      return '#06b6d4';
    default:
      return 'blue';
  }
}
