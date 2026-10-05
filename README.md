# Route Generator

A web application for **designing routes on a map** and **exporting them to a CSV file**. Users drop waypoints by clicking on the map, the app calculates the actual road route between them, and it generates a file containing every node of the route (waypoints and intermediate points).

## Features

- 🗺️ Interactive map built on OpenStreetMap (Leaflet / React-Leaflet), centered by default on the San Sebastián / Donostia area.
- 📍 Add waypoints with a single click on the map. Each point is shown with a numbered marker.
- 🏠 Automatic reverse geocoding (Nominatim): each point stores its address (street, number and city), with an in-memory cache to avoid repeated requests.
- ↕️ Reorder points via drag & drop in the side panel, and delete them individually.
- 🚗 Road route calculation across all points using the [GraphHopper](https://www.graphhopper.com/) API (`car` profile).
- 📄 CSV export (`;` separator, comma decimals and a UTF-8 BOM so Excel opens accented characters correctly).

## How it works

1. Click the **+** icon in the side panel, then click on the map to add a point (repeat for each waypoint).
2. Reorder points by dragging their number, or remove them with the trash icon.
3. Click **Visualize track** to calculate and draw the route (at least 2 points are required).
4. Click **Generate file**, enter a file name, and the CSV will be downloaded.

> Adding, deleting or reordering points discards the calculated route, so you need to click *Visualize track* again before exporting.

### CSV format

Header and columns:

```
node_lat;node_lon;node_alt;pk;pk_details
```

| Column       | Description                                                                              |
| ------------ | ---------------------------------------------------------------------------------------- |
| `node_lat`   | Latitude (6 decimals, comma as decimal separator)                                        |
| `node_lon`   | Longitude (6 decimals, comma as decimal separator)                                       |
| `node_alt`   | Altitude (always `0`)                                                                    |
| `pk`         | Waypoint (`1`, `2`, `3`…) or intermediate route point between two waypoints (`1.1`, `1.2`, `2.1`…) |
| `pk_details` | Address of the waypoint; empty for intermediate points                                   |

## Tech stack

| Area            | Technology                                              |
| --------------- | ------------------------------------------------------- |
| UI              | React 19 + TypeScript                                   |
| Build / dev     | Vite 8                                                  |
| Maps            | Leaflet 1.9 + React-Leaflet 5, OpenStreetMap tiles      |
| Routing         | GraphHopper Routing API                                 |
| Geocoding       | Nominatim (OpenStreetMap)                               |
| Code quality    | ESLint 10 + typescript-eslint                           |
| Deployment      | Docker / Docker Compose, Nginx configuration included   |

## Requirements

- Node.js 20 or later
- npm
- A GraphHopper API key ([get one here](https://www.graphhopper.com/dashboard/))
- (Optional) Docker and Docker Compose

## Installation and usage

### Local

```bash
git clone https://github.com/IgorLekuona/RouteGenerator.git
cd RouteGenerator
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

### With Docker

```bash
docker compose up --build
```

The `rg-front` service exposes the Vite development server on port `5173`.

### Available scripts

| Command           | Description                                                     |
| ----------------- | --------------------------------------------------------------- |
| `npm run dev`     | Development server with HMR                                     |
| `npm run build`   | Type check (`tsc -b`) and production build into `dist/`         |
| `npm run preview` | Serves the production build locally                             |
| `npm run lint`    | Runs ESLint across the project                                  |

## Project structure

```
RouteGenerator/
├── public/                 # Static assets
├── src/
│   ├── main.tsx            # React entry point
│   ├── AppLayout.tsx       # Main component: map, point panel, route and export
│   ├── AppLayout.css       # Layout styles
│   ├── geocodeCache.js     # Reverse geocoding (Nominatim) with in-memory cache
│   └── index.css           # Global styles
├── Dockerfile              # Development image (node:20-alpine + Vite)
├── docker-compose.yml      # rg-front service (Valhalla commented out as an alternative)
├── nginx.conf              # Nginx config to serve the build (SPA fallback, caching, gzip)
├── vite.config.ts
├── eslint.config.js
└── tsconfig*.json
```

## External services

- **GraphHopper** (`graphhopper.com/api/1/route`): road route calculation.
- **Nominatim** (`nominatim.openstreetmap.org`): reverse geocoding. Its [usage policy](https://operations.osmfoundation.org/policies/nominatim/) limits the request rate and requires an identifying `User-Agent`.
- **OpenStreetMap tiles**: base map layer.

## Pending configuration / recommended improvements

- **GraphHopper API key**: it is currently hardcoded in `AppLayout.tsx`. Move it to a Vite environment variable (`VITE_GRAPHHOPPER_API_KEY` in a Git-ignored `.env` file) and **rotate the current key**, since it is exposed in the repository history.
- **Nominatim User-Agent**: replace the `YourAppName/1.0` placeholder with the real application name.
- **Docker Compose**: the `./rg-front:/app` volume points to a folder that does not exist in this repository; if the project lives at the root, it should be `.:/app`.
- **Nginx**: `nginx.conf` is ready to serve the production build, but the current `Dockerfile` only runs the development server. A multi-stage build (`npm run build` → `nginx`) can be added for production.
- **Dead code**: `App.tsx` and the Vite template assets are no longer used (the app boots from `AppLayout.tsx`), and the component contains commented-out blocks from an earlier plain-Leaflet implementation.
- **Typing**: some parameters use implicit or explicit `any` (`reducer`, `reverseGeocode`); migrating `geocodeCache.js` to TypeScript would improve type safety.

## License

No license defined yet. Add a `LICENSE` file to specify the terms of use.
