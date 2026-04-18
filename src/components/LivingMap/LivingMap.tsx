import { useEffect, useMemo, useRef, useState } from 'react'
import Map, {
  Layer,
  MapRef,
  Marker,
  Source,
  type MapLayerMouseEvent,
} from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'

import { useTripStore } from '../../state/tripStore'
import { regions, regionsById } from '../../data/regions'
import { regionRelevance } from '../../data/vibe'
import { buildLeg, formatDuration, haversine } from '../../data/transit'
import { ITALY_BOUNDS, ITALY_CENTER, fallbackStyle, mapStyleUrl } from './mapStyle'
import type { Coordinates } from '../../types'
import { IsochroneLayer } from './IsochroneLayer'
import { HighlightPin } from './HighlightPin'

interface Props {
  mode: 'vibe' | 'pitch' | 'sculpt'
}

export function LivingMap({ mode }: Props) {
  const mapRef = useRef<MapRef | null>(null)
  const vibe = useTripStore((s) => s.vibe)
  const focused = useTripStore((s) => s.focusedRegionId)
  const zoomLevel = useTripStore((s) => s.zoomLevel)
  const hovered = useTripStore((s) => s.hoveredRegionId)
  const setHovered = useTripStore((s) => s.setHoveredRegion)
  const setFocused = useTripStore((s) => s.setFocusedRegion)
  const setZoom = useTripStore((s) => s.setZoomLevel)
  const itinerary = useTripStore((s) => s.itinerary)
  const isochroneNodeId = useTripStore((s) => s.isochroneNodeId)
  const toggleIsochrone = useTripStore((s) => s.toggleIsochrone)
  const season = useTripStore((s) => s.season)

  const [styleError, setStyleError] = useState(false)
  const [ghostCursor, setGhostCursor] = useState<Coordinates | null>(null)

  // Heatmap source: one point per region weighted by current vibe fit.
  const heatmapSource = useMemo(() => {
    return {
      type: 'FeatureCollection' as const,
      features: regions.map((r) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: r.center },
        properties: {
          weight: Math.max(0.05, regionRelevance(vibe, r)),
          region_id: r.region_id,
        },
      })),
    }
  }, [vibe])

  // Region "halo" circles at macro level.
  const regionHalos = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: regions.map((r) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: r.center },
        properties: {
          region_id: r.region_id,
          name: r.name,
          score: regionRelevance(vibe, r),
          focused: focused === r.region_id,
          hovered: hovered === r.region_id,
          inTrip: itinerary.stops.some((s) => s.region_id === r.region_id),
        },
      })),
    }),
    [vibe, focused, hovered, itinerary.stops],
  )

  // Committed route polyline.
  const routeLine = useMemo(() => {
    if (itinerary.stops.length < 2) return null
    const mode =
      itinerary.transit_mode_preference === 'scenic' ? 'scenic' : 'high_speed_rail'
    const features = []
    for (let i = 0; i < itinerary.stops.length - 1; i++) {
      const from = itinerary.stops[i]
      const to = itinerary.stops[i + 1]
      const leg = buildLeg(from.region_id, to.region_id, mode)
      features.push({
        type: 'Feature' as const,
        geometry: leg.polyline_geojson,
        properties: { leg_id: leg.leg_id },
      })
    }
    return { type: 'FeatureCollection' as const, features }
  }, [itinerary.stops, itinerary.transit_mode_preference])

  // Ghost path from last committed stop to cursor while scrubbing (§3, Phase 2).
  const ghostLine = useMemo(() => {
    if (!ghostCursor || itinerary.stops.length === 0 || mode !== 'sculpt') return null
    const last = itinerary.stops[itinerary.stops.length - 1]
    const origin = regionsById[last.region_id]?.center
    if (!origin) return null
    return {
      type: 'Feature' as const,
      geometry: { type: 'LineString' as const, coordinates: [origin, ghostCursor] },
      properties: {},
    }
  }, [ghostCursor, itinerary.stops, mode])

  const ghostLabel = useMemo(() => {
    if (!ghostCursor || itinerary.stops.length === 0 || mode !== 'sculpt') return null
    const last = itinerary.stops[itinerary.stops.length - 1]
    const origin = regionsById[last.region_id]?.center
    if (!origin) return null
    const km = haversine(origin, ghostCursor)
    const transitMode =
      itinerary.transit_mode_preference === 'scenic' ? 'scenic' : 'high_speed_rail'
    const speed = transitMode === 'scenic' ? 75 : 200
    const minutes = (km / speed) * 60
    return {
      lng: ghostCursor[0],
      lat: ghostCursor[1],
      text:
        transitMode === 'scenic'
          ? `${formatDuration(minutes)} \u2022 via scenic route \u2022 ${Math.round(km)} km`
          : `${formatDuration(minutes)} \u2022 Frecciarossa \u2022 ${Math.round(km)} km`,
    }
  }, [ghostCursor, itinerary.stops, itinerary.transit_mode_preference, mode])

  // Animate camera on focus/zoom changes.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (focused && zoomLevel !== 'macro') {
      const region = regionsById[focused]
      if (region) {
        map.fitBounds(region.bounding_box, {
          padding: { top: 120, bottom: 260, left: 120, right: 420 },
          duration: 1400,
        })
      }
    } else if (itinerary.stops.length > 1) {
      const coords = itinerary.stops.map((s) => regionsById[s.region_id]?.center).filter(Boolean) as Coordinates[]
      const sw: Coordinates = [Math.min(...coords.map((c) => c[0])), Math.min(...coords.map((c) => c[1]))]
      const ne: Coordinates = [Math.max(...coords.map((c) => c[0])), Math.max(...coords.map((c) => c[1]))]
      map.fitBounds([sw, ne], {
        padding: { top: 140, bottom: 260, left: 180, right: 420 },
        duration: 1400,
      })
    } else {
      map.fitBounds(ITALY_BOUNDS, {
        padding: { top: 60, bottom: 200, left: 60, right: 60 },
        duration: 1200,
      })
    }
  }, [focused, zoomLevel, itinerary.stops])

  const focusedRegion = focused ? regionsById[focused] : null

  // Visible highlight pins at meso/micro.
  const visibleHighlights = useMemo(() => {
    if (!focusedRegion || zoomLevel === 'macro') return []
    return focusedRegion.curated_highlights.filter((h) => {
      if (h.seasonality === 'warm' && season === 'cold') return false
      if (h.seasonality === 'cold' && season === 'warm') return false
      return true
    })
  }, [focusedRegion, zoomLevel, season])

  const isochroneHighlight = useMemo(() => {
    if (!isochroneNodeId || !focusedRegion) return null
    return focusedRegion.curated_highlights.find((h) => h.node_id === isochroneNodeId) ?? null
  }, [isochroneNodeId, focusedRegion])

  function onMapClick(e: MapLayerMouseEvent) {
    const features = e.features ?? []
    const regionFeature = features.find((f) => f.layer.id.startsWith('region-'))
    if (regionFeature) {
      const id = regionFeature.properties?.region_id as string
      if (id) {
        setFocused(id)
        setZoom('meso')
      }
      return
    }
    // Click outside regions with something focused → back out.
    if (focused) {
      setFocused(null)
      setZoom('macro')
      toggleIsochrone(null)
    }
  }

  function onMouseMove(e: MapLayerMouseEvent) {
    const features = e.features ?? []
    const regionFeature = features.find((f) => f.layer.id.startsWith('region-'))
    const nextHover = (regionFeature?.properties?.region_id as string) ?? null
    if (nextHover !== hovered) setHovered(nextHover)

    if (mode === 'sculpt') setGhostCursor([e.lngLat.lng, e.lngLat.lat])
  }

  function onMouseLeave() {
    setHovered(null)
    setGhostCursor(null)
  }

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
        {/* Heatmap bloom driven by Vibe Engine */}
        <Source id="vibe-heatmap" type="geojson" data={heatmapSource}>
          <Layer
            id="vibe-heat"
            type="heatmap"
            paint={{
              'heatmap-weight': ['get', 'weight'],
              'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 4, 1.0, 8, 2.2],
              'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 4, 70, 8, 140],
              'heatmap-opacity': mode === 'vibe' ? 0.85 : mode === 'pitch' ? 0.55 : 0.18,
              'heatmap-color': [
                'interpolate',
                ['linear'],
                ['heatmap-density'],
                0, 'rgba(0,0,0,0)',
                0.2, 'rgba(247, 220, 180, 0.4)',
                0.4, 'rgba(231, 165, 120, 0.55)',
                0.6, 'rgba(201, 92, 75, 0.65)',
                0.8, 'rgba(143, 47, 55, 0.75)',
                1, 'rgba(89, 20, 36, 0.85)',
              ],
            }}
          />
        </Source>

        {/* Region halos (clickable) */}
        <Source id="region-halos" type="geojson" data={regionHalos}>
          <Layer
            id="region-halo-fill"
            type="circle"
            paint={{
              'circle-radius': [
                'interpolate', ['linear'], ['zoom'],
                4, ['+', 14, ['*', ['get', 'score'], 16]],
                8, ['+', 24, ['*', ['get', 'score'], 26]],
              ],
              'circle-color': [
                'case',
                ['get', 'inTrip'], '#8f2f37',
                ['get', 'focused'], '#c95c4b',
                '#f2d7b5',
              ],
              'circle-opacity': [
                'case',
                ['get', 'hovered'], 0.55,
                ['get', 'focused'], 0.4,
                0.22,
              ],
              'circle-stroke-width': [
                'case',
                ['get', 'hovered'], 2,
                ['get', 'inTrip'], 2,
                ['get', 'focused'], 1.5,
                0.5,
              ],
              'circle-stroke-color': [
                'case',
                ['get', 'inTrip'], '#591424',
                '#8f2f37',
              ],
              'circle-stroke-opacity': 0.75,
            }}
          />
          <Layer
            id="region-halo-label"
            type="symbol"
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
              'text-opacity': ['interpolate', ['linear'], ['zoom'], 4, 0.0, 5, 1.0, 9, 0.2],
            }}
          />
        </Source>

        {/* Ghost path */}
        {ghostLine && (
          <Source id="ghost-line" type="geojson" data={ghostLine}>
            <Layer
              id="ghost-line-layer"
              type="line"
              paint={{
                'line-color': '#8f2f37',
                'line-width': 2,
                'line-dasharray': [1, 2],
                'line-opacity': 0.65,
              }}
            />
          </Source>
        )}

        {/* Committed route */}
        {routeLine && (
          <Source id="route-line" type="geojson" data={routeLine}>
            <Layer
              id="route-line-halo"
              type="line"
              paint={{
                'line-color': '#f5f1ea',
                'line-width': 8,
                'line-opacity': 0.9,
                'line-blur': 2,
              }}
            />
            <Layer
              id="route-line-core"
              type="line"
              paint={{
                'line-color': '#591424',
                'line-width': 3,
                'line-opacity': 0.95,
                'line-dasharray':
                  itinerary.transit_mode_preference === 'scenic' ? [2, 1.5] : [1, 0],
              }}
            />
          </Source>
        )}

        {/* Isochrone blob (§4B) */}
        {isochroneHighlight && (
          <IsochroneLayer center={isochroneHighlight.coordinates} radiusKm={90} />
        )}

        {/* Highlight pins */}
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

        {/* Ghost label */}
        {ghostLabel && (
          <Marker longitude={ghostLabel.lng} latitude={ghostLabel.lat} anchor="bottom">
            <div className="ghost-label">{ghostLabel.text}</div>
          </Marker>
        )}
      </Map>

      {/* Depth-of-field blur mask when meso-focused (§3, Phase 3) */}
      <div
        className="dof-mask"
        data-active={zoomLevel !== 'macro'}
      />
    </div>
  )
}
