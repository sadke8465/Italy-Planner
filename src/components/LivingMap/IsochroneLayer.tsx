import { useMemo } from 'react'
import { Layer, Source } from 'react-map-gl/maplibre'
import type { Coordinates } from '../../types'

// Simple isochrone blob: concentric circles at 1h, 2h, 3h "travel radii"
// approximated by kilometer rings. In production this would be fetched
// from OpenRouteService (§5B) as a proper GeoJSON polygon.

interface Props {
  center: Coordinates
  radiusKm: number
}

export function IsochroneLayer({ center, radiusKm }: Props) {
  const features = useMemo(() => {
    const rings = [radiusKm * 0.33, radiusKm * 0.66, radiusKm].map((km, i) => ({
      type: 'Feature' as const,
      geometry: ringPolygon(center, km),
      properties: { band: i, hours: i + 1 },
    }))
    return { type: 'FeatureCollection' as const, features: rings }
  }, [center, radiusKm])

  return (
    <Source id="isochrone" type="geojson" data={features}>
      <Layer
        id="isochrone-fill"
        type="fill"
        paint={{
          'fill-color': [
            'match',
            ['get', 'band'],
            0, '#c95c4b',
            1, '#e7a578',
            2, '#f2d7b5',
            '#f2d7b5',
          ],
          'fill-opacity': [
            'match',
            ['get', 'band'],
            0, 0.22,
            1, 0.15,
            2, 0.08,
            0.05,
          ],
        }}
      />
      <Layer
        id="isochrone-outline"
        type="line"
        paint={{
          'line-color': '#8f2f37',
          'line-width': 1,
          'line-dasharray': [2, 2],
          'line-opacity': 0.55,
        }}
      />
    </Source>
  )
}

// Generate a 64-sided polygon approximating a circle of `km` radius around `center`.
function ringPolygon([lng, lat]: Coordinates, km: number): GeoJSON.Polygon {
  const points: [number, number][] = []
  const earthR = 6371
  const angularDist = km / earthR
  const latRad = (lat * Math.PI) / 180
  const lngRad = (lng * Math.PI) / 180
  for (let i = 0; i <= 64; i++) {
    const bearing = (i / 64) * 2 * Math.PI
    const sinLat = Math.sin(latRad) * Math.cos(angularDist) +
      Math.cos(latRad) * Math.sin(angularDist) * Math.cos(bearing)
    const lat2 = Math.asin(sinLat)
    const lng2 =
      lngRad +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angularDist) * Math.cos(latRad),
        Math.cos(angularDist) - Math.sin(latRad) * sinLat,
      )
    points.push([(lng2 * 180) / Math.PI, (lat2 * 180) / Math.PI])
  }
  return { type: 'Polygon', coordinates: [points] }
}
