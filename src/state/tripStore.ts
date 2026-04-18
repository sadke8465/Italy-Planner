import { create } from 'zustand'
import type { TransitMode } from '../types'
import { regionsById } from '../data/regions'

// --- New exploration-based model ------------------------------------------
// The user enters a start + end + total_days (phase: 'setup'), then moves into
// 'explore' to browse regions, view their curated offerings, and add them as
// stops. Start + end are always pinned; middle stops are user-inserted and
// can be reordered or removed. Travel segments between stops are derived
// from buildLeg() in /data/transit.

export type Phase = 'setup' | 'explore'

export type StopRole = 'start' | 'middle' | 'end'

export interface PlaceStop {
  stop_id: string
  region_id: string
  role: StopRole
  nights: number
  highlight_ids: string[]
}

interface TripState {
  phase: Phase
  startRegionId: string | null
  endRegionId: string | null
  totalDays: number

  stops: PlaceStop[] // always [start, ...middle, end] once explore begins
  focusedRegionId: string | null
  hoveredRegionId: string | null
  isochroneNodeId: string | null

  transitMode: TransitMode
  season: 'warm' | 'cold'

  // setup actions
  setStart: (id: string | null) => void
  setEnd: (id: string | null) => void
  setTotalDays: (n: number) => void
  beginPlanning: () => void
  backToSetup: () => void

  // explore actions
  addPlace: (regionId: string) => void
  removePlace: (stopId: string) => void
  movePlace: (stopId: string, direction: -1 | 1) => void
  setStopNights: (stopId: string, nights: number) => void
  toggleHighlight: (stopId: string, highlightId: string) => void

  // map actions
  setFocusedRegion: (id: string | null) => void
  setHoveredRegion: (id: string | null) => void
  toggleIsochrone: (nodeId: string | null) => void
  setTransitMode: (m: TransitMode) => void
  setSeason: (s: 'warm' | 'cold') => void

  reset: () => void
}

function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

function makeStop(regionId: string, role: StopRole, nights = 1): PlaceStop {
  return {
    stop_id: newId(`stop_${regionId}`),
    region_id: regionId,
    role,
    nights: Math.max(1, nights),
    highlight_ids: [],
  }
}

export const useTripStore = create<TripState>((set, get) => ({
  phase: 'setup',
  startRegionId: null,
  endRegionId: null,
  totalDays: 7,

  stops: [],
  focusedRegionId: null,
  hoveredRegionId: null,
  isochroneNodeId: null,

  transitMode: 'high_speed_rail',
  season: 'warm',

  setStart: (id) => set({ startRegionId: id }),
  setEnd: (id) => set({ endRegionId: id }),
  setTotalDays: (n) => set({ totalDays: Math.max(1, Math.min(60, Math.round(n))) }),

  beginPlanning: () => {
    const { startRegionId, endRegionId, totalDays } = get()
    if (!startRegionId) return
    const sameEndpoints = !endRegionId || endRegionId === startRegionId
    const stops: PlaceStop[] = sameEndpoints
      ? [makeStop(startRegionId, 'start', Math.max(1, totalDays))]
      : [
          makeStop(startRegionId, 'start', Math.max(1, Math.floor(totalDays / 2))),
          makeStop(endRegionId!, 'end', Math.max(1, Math.ceil(totalDays / 2))),
        ]
    set({
      phase: 'explore',
      stops,
      focusedRegionId: startRegionId,
    })
  },

  backToSetup: () =>
    set({
      phase: 'setup',
      stops: [],
      focusedRegionId: null,
      hoveredRegionId: null,
      isochroneNodeId: null,
    }),

  addPlace: (regionId) => {
    const { stops } = get()
    if (stops.some((s) => s.region_id === regionId)) {
      set({ focusedRegionId: regionId })
      return
    }
    const endIdx = stops.findIndex((s) => s.role === 'end')
    const insertAt = endIdx === -1 ? stops.length : endIdx
    const newStop = makeStop(regionId, 'middle', 1)
    const next = [...stops.slice(0, insertAt), newStop, ...stops.slice(insertAt)]
    set({ stops: next, focusedRegionId: regionId })
  },

  removePlace: (stopId) => {
    const { stops } = get()
    const stop = stops.find((s) => s.stop_id === stopId)
    if (!stop || stop.role !== 'middle') return
    set({ stops: stops.filter((s) => s.stop_id !== stopId) })
  },

  movePlace: (stopId, direction) => {
    const { stops } = get()
    const i = stops.findIndex((s) => s.stop_id === stopId)
    if (i === -1 || stops[i].role !== 'middle') return
    const j = i + direction
    if (!stops[j] || stops[j].role !== 'middle') return
    const next = stops.slice()
    ;[next[i], next[j]] = [next[j], next[i]]
    set({ stops: next })
  },

  setStopNights: (stopId, nights) => {
    const { stops } = get()
    set({
      stops: stops.map((s) =>
        s.stop_id === stopId ? { ...s, nights: Math.max(1, Math.min(30, nights)) } : s,
      ),
    })
  },

  toggleHighlight: (stopId, highlightId) => {
    const { stops } = get()
    set({
      stops: stops.map((s) => {
        if (s.stop_id !== stopId) return s
        const has = s.highlight_ids.includes(highlightId)
        return {
          ...s,
          highlight_ids: has
            ? s.highlight_ids.filter((id) => id !== highlightId)
            : [...s.highlight_ids, highlightId],
        }
      }),
    })
  },

  setFocusedRegion: (id) => set({ focusedRegionId: id }),
  setHoveredRegion: (id) => set({ hoveredRegionId: id }),
  toggleIsochrone: (nodeId) =>
    set((s) => ({ isochroneNodeId: s.isochroneNodeId === nodeId ? null : nodeId })),
  setTransitMode: (m) => set({ transitMode: m }),
  setSeason: (s) => set({ season: s }),

  reset: () =>
    set({
      phase: 'setup',
      startRegionId: null,
      endRegionId: null,
      totalDays: 7,
      stops: [],
      focusedRegionId: null,
      hoveredRegionId: null,
      isochroneNodeId: null,
      transitMode: 'high_speed_rail',
      season: 'warm',
    }),
}))

// --- Derived helpers -------------------------------------------------------

export interface DayRange {
  start: number // 1-indexed inclusive
  end: number
}

// Given the ordered stops + nights, compute inclusive day ranges per stop.
// Travel between stops is assumed to consume part of the same day as arrival
// (Google Maps-style itinerary — no extra travel day).
export function computeDayRanges(stops: PlaceStop[]): Record<string, DayRange> {
  const out: Record<string, DayRange> = {}
  let cursor = 1
  for (const stop of stops) {
    const end = cursor + Math.max(0, stop.nights - 1)
    out[stop.stop_id] = { start: cursor, end }
    cursor = end + 1
  }
  return out
}

export function totalPlannedDays(stops: PlaceStop[]): number {
  return stops.reduce((s, x) => s + Math.max(1, x.nights), 0)
}

export function totalPlannedHours(stops: PlaceStop[]): number {
  let h = 0
  for (const stop of stops) {
    const region = regionsById[stop.region_id]
    if (!region) continue
    for (const id of stop.highlight_ids) {
      const hl = region.curated_highlights.find((x) => x.node_id === id)
      if (hl) h += hl.suggested_duration_hours
    }
  }
  return h
}
