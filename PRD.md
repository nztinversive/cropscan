# CropScan — Drone Crop Health Intelligence Platform

## Overview
CropScan turns drone imagery into actionable crop health insights. Upload RGB or multispectral aerial photos, auto-generate vegetation index maps (NDVI, VARI, ExG), detect stressed zones, and track field health across the growing season. Built for ag drone operators and farm managers who need DroneDeploy-level analysis without the $500/mo lock-in.

## Target Users
- **Ag drone operators** — service providers flying fields for multiple farms
- **Farm managers** — large operations (500+ acres) with their own drone programs
- **Agronomists/crop consultants** — need visual evidence for recommendations

## Core Features

### 1. Field Management
- Create fields with boundaries (draw on map or upload GeoJSON/KML)
- Acreage auto-calculation
- Crop type + planting date metadata
- Multi-season history per field

### 2. Flight Upload & Processing
- Drag-drop upload of drone imagery (JPEG, TIFF, GeoTIFF)
- EXIF GPS extraction for auto-positioning
- Support for RGB (consumer drones) and multispectral (RedEdge, Altum, Sequoia)
- Orthomosaic stitching placeholder (Phase 2 — OpenDroneMap integration)

### 3. Vegetation Index Generation
From RGB imagery (works with ANY drone):
- **VARI** (Visible Atmospherically Resistant Index) — green vs red+blue
- **ExG** (Excess Green Index) — greenness extraction
- **GLI** (Green Leaf Index) — chlorophyll proxy
- **RGBVI** (Red-Green-Blue Vegetation Index)

From multispectral imagery:
- **NDVI** (Normalized Difference Vegetation Index) — NIR vs red
- **NDRE** (Normalized Difference Red Edge) — nitrogen stress
- **SAVI** (Soil-Adjusted Vegetation Index) — for sparse canopy

### 4. Health Map Visualization
- Mapbox satellite base layer with field boundaries
- Color-gradient overlay (red → yellow → green) for vegetation indices
- Side-by-side temporal comparison (this week vs last week)
- Zone highlighting for stress areas (auto-detected below threshold)
- Click any point for index values + trend sparkline

### 5. Stress Zone Detection
- Auto-segment fields into health zones using k-means clustering
- Flag zones below configurable thresholds
- Classify stress type hints: water stress, nutrient deficiency, disease pressure, pest damage
- Generate prescription zones (variable-rate application boundaries)

### 6. Temporal Tracking
- Timeline slider across all flights for a field
- Growth curve charts (average NDVI over season)
- Change detection — highlight areas that improved or degraded between flights
- Season-over-season comparison

### 7. Reports & Sharing
- PDF field health report (map + stats + recommendations)
- Public share link for clients (read-only, branded)
- CSV export of zone data for variable-rate equipment
- Email digest option (weekly field summary)

### 8. Dashboard
- All fields overview with health badges (healthy/watch/critical)
- Recent flights feed
- Season stats (total acres scanned, flights logged, alerts triggered)
- Weather widget (current + 7-day forecast for field locations)

## Tech Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Maps**: Mapbox GL JS (satellite imagery, field boundaries, health overlays)
- **Image Processing**: Canvas API for RGB index generation (client-side for speed)
- **Charts**: Recharts (growth curves, histograms)
- **Storage**: JSON file storage (Phase 1), PostgreSQL (Phase 2)
- **APIs**: Mapbox (maps), OpenWeather (weather), EXIF reader (GPS)

## Color & Design
- Dark theme (ag tech aesthetic)
- Primary accent: **#22C55E** (green-500 — crops, growth, health)
- Secondary: **#EAB308** (yellow-500 — warnings, watch zones)
- Critical: **#EF4444** (red-500 — stress zones)
- Mapbox satellite style for field context

## Data Model

### Field
```
id, name, boundaries (GeoJSON), acreage, cropType, plantingDate, 
seasonId, createdAt, updatedAt
```

### Flight
```
id, fieldId, date, droneModel, altitude, imageCount, 
sensorType (rgb|multispectral), weather, notes, createdAt
```

### Image
```
id, flightId, filename, gpsLat, gpsLng, altitude, 
sensorType, capturedAt, processedAt
```

### HealthMap
```
id, flightId, fieldId, indexType (ndvi|vari|exg|etc),
zones: [{ polygon, avgValue, classification, areaAcres }],
overallScore, generatedAt
```

### Alert
```
id, fieldId, flightId, zoneId, severity (watch|critical),
stressType, message, acknowledged, createdAt
```

## API Routes
- `GET/POST /api/fields` — CRUD fields
- `GET/POST /api/fields/[id]/flights` — flights per field
- `POST /api/flights/[id]/upload` — image upload + processing
- `GET /api/flights/[id]/healthmap` — generated health map data
- `GET /api/fields/[id]/timeline` — temporal data for a field
- `POST /api/fields/[id]/report` — generate PDF report
- `GET /api/dashboard/stats` — overview metrics
- `GET /api/health` — Render health check

## Pages
1. **Dashboard** (`/`) — field overview cards, recent flights, stats
2. **Field Detail** (`/field/[id]`) — map with health overlay, flight timeline, alerts
3. **Flight Detail** (`/flight/[id]`) — uploaded images, processing status, health map
4. **Upload** (`/upload`) — drag-drop flight imagery, field selection
5. **Compare** (`/compare`) — side-by-side temporal comparison
6. **Reports** (`/reports`) — generated reports, share links
7. **Public View** (`/view/[token]`) — shared field health report (read-only)

## Seed Data
- 3 fields in central Texas (corn, cotton, sorghum) with realistic GPS boundaries
- 2-3 flights per field spanning 4 weeks
- Pre-computed health maps with varied stress zones
- Sample alerts (water stress in corn field NE corner, nutrient deficiency in cotton)

## Phase 1 (MVP — Tonight's Build)
- Field CRUD with Mapbox boundary drawing
- Flight upload with EXIF GPS extraction
- RGB vegetation index generation (VARI, ExG — client-side canvas processing)
- Health map overlay on Mapbox
- Stress zone auto-detection (k-means on index values)
- Dashboard with field health cards
- Seed data for demo
- Dark theme, deploy to Render

## Phase 2 (Week 2)
- Multispectral support (NDVI, NDRE from GeoTIFF)
- Temporal comparison slider
- PDF report generation
- Public share links
- Weather integration

## Phase 3 (Month 2)
- OpenDroneMap integration for orthomosaic stitching
- Variable-rate prescription map export (Shapefile/GeoJSON)
- Integration with John Deere Operations Center API
- Mobile-friendly field scouting mode

## Competitive Landscape
| Product | Price | Gap |
|---------|-------|-----|
| DroneDeploy | $499/mo | Expensive, overkill for small operators |
| Pix4Dfields | $350/mo | Desktop-only, no web dashboard |
| Sentera FieldAgent | Hardware-locked | Only works with Sentera sensors |
| FarmLens (acquired) | Discontinued | — |

**Our edge**: Free/cheap, works with ANY drone's RGB images, web-based, self-hostable, no hardware lock-in. The RGB index approach means even a $300 Mini 4 Pro can generate useful crop health data.

## Revenue Potential
- **Freemium SaaS**: Free for 3 fields, $29/mo for unlimited
- **White-label**: Ag drone service companies brand it as their own ($199/mo)
- **Per-report**: $5/PDF report for pay-as-you-go operators
- **API access**: $0.10/acre processed for enterprise integrations
