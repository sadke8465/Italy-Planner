import { create } from 'zustand'
import type {
  Archetype,
  Itinerary,
  ItineraryStop,
  TransitMode,
  VibeAxis,
  VibeWeights,
  ZoomLevel,
} from '../types'
import { archetypes } from '../data/archetypes'
import { defaultVibe } from '../data/vibe'
import { regionsById } from '../data/regions'

type Phase = 'vibe' | 'pitch' | 'sculpt'

interface TripState {
  phase: Phase
  vibe: VibeWeights
  itinerary: Itinerary
  focusedRegionId: string | null
  zoomLevel: ZoomLevel
  hoveredRegionId: string | null
  isochroneNodeId: string | null
  season: 'warm' | 'cold'

  setVibe: (axis: VibeAxis, value: number) => void
  setPhase: (p: Phase) => void
  selectArchetype: (a: Archetype) => void
  setHoveredRegion: (id: string | null) => void
  setFocusedRegion: (id: string | null) => void
  setZoomLevel: (z: ZoomLevel) => void
  setTransitPreference: (m: 'high_speed_rail' | 'scenic') => void
  toggleIsochrone: (nodeId: string | null) => void
  setSeason: (s: 'warm' | 'cold') => void

  addHighlightToStop: (regionId: string, highlightId: string, dayIndex: number) => void
  removeHighlightFromStop: (stopId: string, highlightId: string) => void
  addStop: (regionId: string, dayIndex?: number) => void
  removeStop: (stopId: string) => void
  moveStopDay: (stopId: string, dayIndex: number) => void
  reset: () => void
}

function initialItinerary(): Itinerary {
  return {
    archetype_id: null,
    stops: [],
    transit_mode_preference: 'high_speed_rail',
    total_days: 7,
  }
}

function stopsFromArchetype(a: Archetype): ItineraryStop[] {
  const perRegionDays = Math.max(1, Math.floor(a.duration_days / a.stops.length))
  return a.stops.map((regionId, i) => {
    const region = regionsById[regionId]
    const firstTwo = region?.curated_highlights.slice(0, 2).map((h) => h.node_id) ?? []
    return {
      stop_id: `stop_${regionId}_${i}`,
      region_id: regionId,
      highlight_ids: firstTwo,
      day_index: i * perRegionDays,
      suggested_hours: firstTwo.reduce(
        (s, id) => s + (region?.curated_highlights.find((h) => h.node_id === id)?.suggested_duration_hours ?? 0),
        0,
      ),
    }
  })
}

export const useTripStore = create<TripState>((set, get) => ({
  phase: 'vibe',
  vibe: defaultVibe,
  itinerary: initialItinerary(),
  focusedRegionId: null,
  zoomLevel: 'macro',
  hoveredRegionId: null,
  isochroneNodeId: null,
  season: 'warm',

  setVibe: (axis, value) =>
    set((s) => ({ vibe: { ...s.vibe, [axis]: Math.max(0, Math.min(1, value)) } })),

  setPhase: (p) => set({ phase: p }),

  selectArchetype: (a) => {
    const stops = stopsFromArchetype(a)
    set({
      phase: 'sculpt',
      itinerary: {
        archetype_id: a.id,
        stops,
        transit_mode_preference: 'high_speed_rail',
        total_days: a.duration_days,
      },
      focusedRegionId: stops[0]?.region_id ?? null,
      zoomLevel: 'macro',
    })
  },

  setHoveredRegion: (id) => set({ hoveredRegionId: id }),
  setFocusedRegion: (id) =>
    set({
      focusedRegionId: id,
      zoomLevel: id ? 'meso' : 'macro',
    }),
  setZoomLevel: (z) => set({ zoomLevel: z }),
  setTransitPreference: (m) =>
    set((s) => ({ itinerary: { ...s.itinerary, transit_mode_preference: m } })),
  toggleIsochrone: (nodeId) => set({ isochroneNodeId: nodeId }),
  setSeason: (s) => set({ season: s }),

  addHighlightToStop: (regionId, highlightId, dayIndex) => {
    const { itinerary } = get()
    const existing = itinerary.stops.find((s) => s.region_id === regionId)
    const region = regionsById[regionId]
    const hours = region?.curated_highlights.find((h) => h.node_id === highlightId)?.suggested_duration_hours ?? 2

    if (existing) {
      if (existing.highlight_ids.includes(highlightId)) return
      set({
        itinerary: {
          ...itinerary,
          stops: itinerary.stops.map((s) =>
            s.stop_id === existing.stop_id
              ? { ...s, highlight_ids: [...s.highlight_ids, highlightId], suggested_hours: s.suggested_hours + hours }
              : s,
          ),
        },
      })
    } else {
      const newStop: ItineraryStop = {
        stop_id: `stop_${regionId}_${Date.now()}`,
        region_id: regionId,
        highlight_ids: [highlightId],
        day_index: dayIndex,
        suggested_hours: hours,
      }
      set({
        itinerary: {
          ...itinerary,
          stops: [...itinerary.stops, newStop].sort((a, b) => a.day_index - b.day_index),
        },
      })
    }
  },

  removeHighlightFromStop: (stopId, highlightId) => {
    const { itinerary } = get()
    set({
      itinerary: {
        ...itinerary,
        stops: itinerary.stops
          .map((s) => {
            if (s.stop_id !== stopId) return s
            const region = regionsById[s.region_id]
            const hours = region?.curated_highlights.find((h) => h.node_id === highlightId)?.suggested_duration_hours ?? 0
            return {
              ...s,
              highlight_ids: s.highlight_ids.filter((id) => id !== highlightId),
              suggested_hours: Math.max(0, s.suggested_hours - hours),
            }
          })
          .filter((s) => s.highlight_ids.length > 0),
      },
    })
  },

  addStop: (regionId, dayIndex) => {
    const { itinerary } = get()
    if (itinerary.stops.some((s) => s.region_id === regionId)) return
    const region = regionsById[regionId]
    const firstTwo = region?.curated_highlights.slice(0, 2).map((h) => h.node_id) ?? []
    const maxDay = Math.max(-1, ...itinerary.stops.map((s) => s.day_index))
    const newStop: ItineraryStop = {
      stop_id: `stop_${regionId}_${Date.now()}`,
      region_id: regionId,
      highlight_ids: firstTwo,
      day_index: dayIndex ?? maxDay + 2,
      suggested_hours: firstTwo.reduce(
        (s, id) => s + (region?.curated_highlights.find((h) => h.node_id === id)?.suggested_duration_hours ?? 0),
        0,
      ),
    }
    set({
      itinerary: {
        ...itinerary,
        stops: [...itinerary.stops, newStop].sort((a, b) => a.day_index - b.day_index),
        total_days: Math.max(itinerary.total_days, newStop.day_index + 2),
      },
    })
  },

  removeStop: (stopId) => {
    const { itinerary } = get()
    set({
      itinerary: {
        ...itinerary,
        stops: itinerary.stops.filter((s) => s.stop_id !== stopId),
      },
    })
  },

  moveStopDay: (stopId, dayIndex) => {
    const { itinerary } = get()
    set({
      itinerary: {
        ...itinerary,
        stops: itinerary.stops
          .map((s) => (s.stop_id === stopId ? { ...s, day_index: Math.max(0, dayIndex) } : s))
          .sort((a, b) => a.day_index - b.day_index),
      },
    })
  },

  reset: () =>
    set({
      phase: 'vibe',
      vibe: defaultVibe,
      itinerary: initialItinerary(),
      focusedRegionId: null,
      zoomLevel: 'macro',
      hoveredRegionId: null,
      isochroneNodeId: null,
    }),
}))

// Derived: tension score per day window (§4A).
// Input: stops array. Output: map of day_index → tension (>1 = rushed).
export function computeDayTensions(itinerary: Itinerary, baseline: number = 8): Record<number, number> {
  const byDay: Record<number, number> = {}
  for (const stop of itinerary.stops) {
    byDay[stop.day_index] = (byDay[stop.day_index] ?? 0) + stop.suggested_hours
  }
  const result: Record<number, number> = {}
  for (const [day, hours] of Object.entries(byDay)) {
    result[Number(day)] = hours / baseline
  }
  return result
}

// Unused transit mode helper.
export const transitPrefToMode = (
  pref: 'high_speed_rail' | 'scenic',
): TransitMode => (pref === 'scenic' ? 'scenic' : 'high_speed_rail')
