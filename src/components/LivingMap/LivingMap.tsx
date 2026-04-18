import { useEffect, useMemo, useRef, useState } from 'react'
import Map, {
  Layer,
  MapRef,
  Marker,
  Source,
  type MapLayerMouseEvent,
} from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'

import { useTripStore, type Phase } from '../../state/tripStore'
import { regions, regionsById } from '../../data/regions'
import { buildLeg, formatDuration } from '../../data/transit'
import { ITALY_BOUNDS, ITALY_CENTER, fallbackStyle, mapStyleUrl } from './mapStyle'
import type { Coordinates } from '../../types'
import { IsochroneLayer } from './IsochroneLayer'
import { HighlightPin } from './HighlightPin'

interface Props {
  mode: Phase
}

export function LivingMap({ mode }: Props) {
  const mapRef = useRef<MapRef | null>(null)
  const focused = useTripStore((s) => s.focusedRegionId)
  const hovered = useTripStore((s) => s.hoveredRegionId)
  const setHovered = useTripStore((s) => s.setHoveredRegion)
  const setFocused = useTripStore((s) => s.setFocusedRegion)
  const stops = useTripStore((s) => s.stops)
  const transitMode = useTripStore((s) => s.transitMode)
  const isochroneNodeId = useTripStore((s) => s.isochroneNodeId)
  const season = useTripStore((s) => s.season)

  const [styleError, setStyleError] = useState(false)

  // Region markers (clickable cities).
  const regionHalos = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: regions.map((r) => {
        const inTrip = stops.some((s) => s.region_id === r.region_id)
        return {
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: r.center },
          properties: {
            region_id: r.region_id,
            name: r.name,
            focused: focused === r.region_id,
            hovered: hovered === r.region_id,
            inTrip,
          },
        }
      }),
    }),
    [focused, hovered, stops],
  )

  // Committed route, Google Maps-style: bold oxblood line with arrows.
  const { routeLine, segmentLabels } = useMemo(() => {
    if (stops.length < 2) return { routeLine: null, segmentLabels: [] }
    const features = []
    const labels: { coord: Coordinates; text: string }[] = []
    for (let i = 0; i < stops.length - 1; i++) {
      const from = stops[i]
      const to = stops[i + 1]
      const leg = buildLeg(from.region_id, to.region_id, transitMode)
      features.push({
        type: 'Feature' as const,
        geometry: leg.polyline_geojson,
        properties: { leg_id: leg.leg_id },
      })
      const coords = leg.polyline_geojson.coordinates
      if (coords.length > 0) {
        const midCoord = coords[Math.floor(coords.length / 2)]
        labels.push({
          coord: midCoord,
          text: formatDuration(leg.estimated_duration_minutes),
        })
      }
    }
    return {
      routeLine: { type: 'FeatureCollection' as const, features },
      segmentLabels: labels,
    }
  }, [stops, transitMode])

  // Animate camera on focus / stops change.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (focused) {
      const region = regionsById[focused]
      if (region) {
        map.fitBounds(region.bounding_box, {
          padding: { top: 140, bottom: 260, left: 460, right: 120 },
          duration: 1200,
        })
        return
      }
    }
    if (stops.length > 1) {
      const coords = stops
        .map((s) => regionsById[s.region_id]?.center)
        .filter(Boolean) as Coordinates[]
      const sw: Coordinates = [
        Math.min(...coords.map((c) => c[0])) - 0.5,
        Math.min(...coords.map((c) => c[1])) - 0.5,
      ]
      const ne: Coordinates = [
        Math.max(...coords.map((c) => c[0])) + 0.5,
        Math.max(...coords.map((c) => c[1])) + 0.5,
      ]
      map.fitBounds([sw, ne], {
        padding: { top: 140, bottom: 260, left: 460, right: 120 },
        duration: 1200,
      })
    } else {
      map.fitBounds(ITALY_BOUNDS, {
        padding: { top: 60, bottom: 240, left: 400, right: 60 },
        duration: 1200,
      })
    }
  }, [focused, stops, mode])

  const focusedRegion = focused ? regionsById[focused] : null

  const visibleHighlights = useMemo(() => {
    if (!focusedRegion) return []
    return focusedRegion.curated_highlights.filter((h) => {
      if (h.seasonality === 'warm' && season === 'cold') return false
      if (h.seasonality === 'cold' && season === 'warm') return false
      return true
    })
  }, [focusedRegion, season])

  const isochroneHighlight = useMemo(() => {
    if (!isochroneNodeId || !focusedRegion) return null
    return (
      focusedRegion.curated_highlights.find((h) => h.node_id === isochroneNodeId) ?? null
    )
  }, [isochroneNodeId, focusedRegion])

  function onMapClick(e: MapLayerMouseEvent) {
    const features = e.features ?? []
    const regionFeature = features.find((f) => f.layer.id.startsWith('region-'))
    if (regionFeature) {
      const id = regionFeature.properties?.region_id as string | undefined
      if (id) setFocused(id)
      return
    }
    if (focused) setFocused(null)
  }

  function onMouseMove(e: MapLayerMouseEvent) {
    const features = e.features ?? []
    const regionFeature = features.find((f) => f.layer.id.startsWith('region-'))
    const nextHover = (regionFeature?.properties?.region_id as string) ?? null
    if (nextHover !== hovered) setHovered(nextHover)
  }

  function onMouseLeave() {
    setHovered(null)
  }

  // Each committed stop gets a numbered marker (S / 1 / 2 / … / E).
  const stopMarkers = useMemo(() => {
    let counter = 0
    return stops.map((stop) => {
      const region = regionsById[stop.region_id]
      if (!region) return null
      let label: string
      if (stop.role === 'start') label = 'S'
      else if (stop.role === 'end') label = 'E'
      else {
        counter += 1
        label = String(counter)
      }
      return { stop_id: stop.stop_id, region, label, role: stop.role }
    })
  }, [stops])

  return (
    <div className="map-root" onMouseLeave={onMouseLeave}>
      <Map
        ref={mapRef}
        mapStyle={styleError ? fallbackStyle : mapStyleUrl}
        onError={() => setStyleError(true)}
        initialViewState={{
          longitude: ITALY_CENTER[0],
          latitude: ITALY_CENTER[1],
          zoom: 5.3,
        }}
        maxBounds={[[-5, 30], [30, 52]]}
        minZoom={4.5}
        maxZoom={15}
        interactiveLayerIds={['region-halo-fill']}
        onClick={onMapClick}
        onMouseMove={onMouseMove}
        dragRotate={false}
        pitchWithRotate={false}
        touchPitch={false}
        attributionControl={true}
      >
        {/* Region markers — simple hover/click targets */}
        <Source id="region-halos" type="geojson" data={regionHalos}>
          <Layer
            id="region-halo-fill"
            type="circle"
            paint={{
              'circle-radius': [
                'interpolate', ['linear'], ['zoom'],
                4, ['case', ['get', 'inTrip'], 10, 14],
                8, ['case', ['get', 'inTrip'], 14, 22],
              ],
              'circle-color': [
                'case',
                ['get', 'inTrip'], '#8f2f37',
                ['get', 'focused'], '#c95c4b',
                '#f2d7b5',
              ],
              'circle-opacity': [
                'case',
                ['get', 'inTrip'], 0.0,
                ['get', 'focused'], 0.45,
                ['get', 'hovered'], 0.55,
                0.28,
              ],
              'circle-stroke-width': [
                'case',
                ['get', 'inTrip'], 0,
                ['get', 'hovered'], 2,
                ['get', 'focused'], 2,
                0.8,
              ],
              'circle-stroke-color': '#8f2f37',
              'circle-stroke-opacity': 0.7,
            }}
          />
          <Layer
            id="region-halo-label"
            type="symbol"
            filter={['!', ['get', 'inTrip']]}
            layout={{
              'text-field': ['get', 'name'],
              'text-font': ['Noto Sans Regular'],
              'text-size': 11,
              'text-offset': [0, 1.4],
              'text-anchor': 'top',
              'text-letter-spacing': 0.12,
              'text-transform': 'uppercase',
            }}
            paint={{
              'text-color': '#1c1917',
              'text-halo-color': 'rgba(245,241,234,0.85)',
              'text-halo-width': 1.5,
              'text-opacity': ['interpolate', ['linear'], ['zoom'], 4, 0.0, 5, 0.9, 9, 0.2],
            }}
          />
        </Source>

        {/* Committed route — Google Maps style: white halo + oxblood core + arrows */}
        {routeLine && (
          <Source id="route-line" type="geojson" data={routeLine}>
            <Layer
              id="route-line-halo"
              type="line"
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              paint={{
                'line-color': '#ffffff',
                'line-width': 9,
                'line-opacity': 0.95,
              }}
            />
            <Layer
              id="route-line-core"
              type="line"
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              paint={{
                'line-color': '#8f2f37',
                'line-width': 5,
                'line-opacity': 0.95,
                'line-dasharray': transitMode === 'scenic' ? [1.2, 1.4] : [1, 0],
              }}
            />
            {/* Directional arrows along the route */}
            <Layer
              id="route-line-arrows"
              type="symbol"
              layout={{
                'symbol-placement': 'line',
                'symbol-spacing': 110,
                'text-field': '▶',
                'text-size': 14,
                'text-keep-upright': false,
                'text-rotation-alignment': 'map',
                'text-allow-overlap': true,
                'text-ignore-placement': true,
              }}
              paint={{
                'text-color': '#ffffff',
                'text-halo-color': '#591424',
                'text-halo-width': 2,
              }}
            />
          </Source>
        )}

        {/* Isochrone blob (long-press) */}
        {isochroneHighlight && (
          <IsochroneLayer center={isochroneHighlight.coordinates} radiusKm={90} />
        )}

        {/* Highlight pins for the focused region */}
        {visibleHighlights.map((h) => (
          <Marker
            key={h.node_id}
            longitude={h.coordinates[0]}
            latitude={h.coordinates[1]}
            anchor="bottom"
          >
            <HighlightPin highlight={h} />
          </Marker>
        ))}

        {/* Numbered stop markers (S, 1, 2, 3, …, E) */}
        {stopMarkers.map((s) =>
          s ? (
            <Marker
              key={s.stop_id}
              longitude={s.region.center[0]}
              latitude={s.region.center[1]}
              anchor="bottom"
            >
              <button
                className="stop-pin"
                data-role={s.role}
                data-focused={focused === s.region.region_id}
                onClick={(e) => {
                  e.stopPropagation()
                  setFocused(s.region.region_id)
                }}
              >
                <span className="stop-pin__badge">{s.label}</span>
                <span className="stop-pin__name">{s.region.name}</span>
              </button>
            </Marker>
          ) : null,
        )}

        {/* Segment duration labels near midpoint of each leg */}
        {segmentLabels.map((lab, i) => (
          <Marker key={i} longitude={lab.coord[0]} latitude={lab.coord[1]} anchor="bottom">
            <div className="segment-label">{lab.text}</div>
          </Marker>
        ))}
      </Map>
    </div>
  )
}
