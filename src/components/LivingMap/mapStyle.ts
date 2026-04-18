import type { StyleSpecification } from 'maplibre-gl'

// Minimalist editorial style, free + no API key. OpenFreeMap's Positron is a
// desaturated Carto-like basemap stripped of most POIs — aligned with the
// "editorial minimalist" aesthetic brief (§2).
export const mapStyleUrl = 'https://tiles.openfreemap.org/styles/positron'

// Fallback: a zero-dependency raster style if the vector CDN is blocked.
export const fallbackStyle: StyleSpecification = {
  version: 8,
  glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
  sources: {
    carto: {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}@2x.png',
        'https://c.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}@2x.png',
        'https://d.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}@2x.png',
      ],
      tileSize: 256,
      attribution: '\u00a9 OpenStreetMap \u00b7 \u00a9 CARTO',
    },
  },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': '#f5f1ea' } },
    { id: 'carto', type: 'raster', source: 'carto', paint: { 'raster-opacity': 0.75 } },
  ],
}

export const ITALY_BOUNDS: [[number, number], [number, number]] = [
  [5.5, 35.0],
  [19.5, 47.5],
]

export const ITALY_CENTER: [number, number] = [12.5, 42.5]
