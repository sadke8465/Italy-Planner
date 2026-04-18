# The Living Map · Italy

A spatial discovery prototype for planning Italian trips, built against the
product spec in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

Shifts the paradigm from form-filling to an **Infinite Canvas**: the map is
the hero; information is disclosed only when spatially relevant.

## What's implemented

- **Vibe Engine** (§3, Phase 1) — 4 tactile sliders that drive a live
  WebGL heatmap over the Italian peninsula. No place names up front,
  only intent.
- **Archetype Pitch** (§3, Phase 1) — the 3 archetype cards are ranked
  dynamically against the current slider state (the LLM's job in prod).
- **Map Scrubbing & Ghost Paths** (§3, Phase 2) — in sculpt mode, a
  dashed elastic ribbon snaps from the last committed region to the
  cursor, with a live transit-time label.
- **Meso Drill-Down** (§3, Phase 3) — click a region halo → the camera
  eases in (`fitBounds` w/ ~1.4s ease), surrounding map dims via a
  radial DoF mask, curated highlight pins bloom.
- **Drag-to-Commit** (§3, Phase 4) — highlight cards commit into the
  itinerary; a route polyline draws between regions, snapping to the
  selected transit mode.
- **Transit Toggle** (§3, Phase 2) — high-speed vs. analog/scenic.
  Different polylines, different dash patterns, different speeds.
- **ZTL & Seasonality** (§3, Phase 4) — ZTL-flagged pins are badged;
  seasonal highlights fade out of the rail in the off-season.
- **Tension Timeline** (§4A) — over-scheduled days visually compress
  and the connecting route line pulses under "tension."
- **Time-Radius Isochrone** (§4B) — long-press any highlight pin to
  bloom a 1h / 2h / 3h concentric reach blob.

## User Flow

```
Phase 1 — Vibe Engine
  Open app → full-bleed Italy map + glassmorphic slider panel
  Adjust sliders (History ↔ Culture, Coastal ↔ Alpine, etc.)
  WebGL heatmap responds in real time, highlighting matching regions
  3 ranked Archetype cards appear → select one to seed the itinerary

Phase 2 — Map Scrubbing & Ghost Paths
  Hover over any region → elastic ribbon stretches from last pin to cursor
  Live micro-label shows transit time ("1.5h Frecciarossa" / "3h drive")
  Toggle Analog/Scenic ↔ High-Speed to reveal different route options
  and unlock off-the-beaten-path hilltop nodes on secondary roads

Phase 3 — Meso Drill-Down
  Click a region halo → camera eases in, surrounding map dims (DoF blur)
  Curated highlight pins bloom inside the focused region
  Click a city → street-grid zoom, generic icons replaced by editorial glyphs

Phase 4 — Drag-to-Commit & Logistics
  Drag a highlight card onto the ribbon or timeline dock to commit it
  Route polyline locks to rail or highway depending on selected transit mode
  ZTL warning badge appears when driving into a restricted traffic zone
  Seasonal highlights fade out if the trip date falls in the off-season
  Long-press any committed pin → 1h / 2h / 3h isochrone blob blooms
  Tension Timeline compresses visually when too many stops crowd a day
```

## Stack

Per §5 of the spec:

- **MapLibre GL JS** + `react-map-gl` — vector tiles, heatmap, line,
  circle, symbol layers.
- **Framer Motion** — spring-based panel & card transitions.
- **Zustand** — single trip store (vibe, phase, itinerary, focus, zoom).
- **Vite** + TypeScript + React 18.
- **OpenFreeMap Positron** — free, key-less, editorial vector basemap
  (Carto fallback if the CDN is unreachable).

## What's stubbed

These would be real backend services in production — see §5C.

- The LLM curation pipeline is **hand-authored JSON** in `src/data/`.
  The shape matches the §6 BFF contracts (`AreaProfile`, `RouteLeg`,
  `Archetype`).
- Routing is precomputed polylines + great-circle fallback, not
  OpenRouteService.
- Isochrones are km-ring approximations, not ORS polygons.
- No WebSockets / multiplayer yet.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build
npm run typecheck
```

## Project layout

```
src/
├── App.tsx                          # phase orchestration
├── main.tsx
├── state/tripStore.ts               # Zustand + derived tensions
├── types/index.ts                   # BFF contracts (§6)
├── data/
│   ├── regions.ts                   # curated AreaProfiles
│   ├── archetypes.ts                # trip archetypes
│   ├── transit.ts                   # leg polylines + durations
│   └── vibe.ts                      # slider axes + ranking
├── components/
│   ├── LivingMap/                   # MapLibre layers, pins, isochrone
│   ├── VibeEngine/                  # slider panel
│   ├── Archetype/                   # pitch cards
│   └── Sculpt/                      # rail, timeline, controls
└── styles/global.css                # editorial minimalist system
```
