# Road Status App (Sjízdnost Silnic)

A modern web application to view and report road passability in the Czech Republic.

## Features
- Interactive Map (Leaflet + OpenStreetMap)
- Road Status Reporting (Good, Warning, Bad, Ice, Snow, Closed)
- User Authentication (Register/Login)
- Search Municipalities (Radius 10km filter)
- Real-time Weather info
- Local SQLite Database

## Tech Stack
- **Frontend**: React, Vite, TypeScript, Tailwind CSS v4
- **Backend**: Bun, Hono, SQLite
- **State**: Zustand
- **HTTP**: Ky
- **Icons**: Lucide React

## How to Run

### Prerequisites
- [Bun](https://bun.sh) installed.

### 1. Start Backend
```bash
cd server
bun install
bun run src/index.ts
```
Server runs on `http://localhost:3000`.

### 2. Start Frontend
```bash
cd client
bun install
bun run dev
```
Client runs on `http://localhost:5173`.

### Usage
- **View**: Open the app to see markers.
- **Search**: Type a municipality name (e.g., "Prague", "Brno") to fly there and filter markers within 10km.
- **Report**: Login/Register, then click on the map to add a marker.
- **Delete**: Click on your own marker to delete it.
# sjizdnost-silnic
