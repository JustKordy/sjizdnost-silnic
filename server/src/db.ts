import { Database } from "bun:sqlite";
import { join } from "path";

const db = new Database(join(import.meta.dir, "../mydb.sqlite"), { create: true });

db.run(`PRAGMA foreign_keys = ON;`);

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    isAdmin INTEGER DEFAULT 0
  );
`);

db.run(`
  CREATE TABLE IF NOT EXISTS markers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    lat REAL,
    lng REAL,
    type TEXT,
    description TEXT,
    approved INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES users(id)
  );
`);

export default db;
