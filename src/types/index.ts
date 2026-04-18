// BFF-standard data models (mirrors §6 of the architecture doc).

export type Coordinates = [number, number] // [lng, lat]

export type VibeAxis =
  | 'history_modern'
  | 'coastal_alpine'
  | 'wine_art'
  | 'iconic_offbeat'

export type VibeWeights = Record<VibeAxis, number> // 0..1 each

export type TransitMode = 'high_speed_rail' | 'regional_rail' | 'car' | 'scenic'

export interface TransitHub {
  id: string
  name: string
  type: Array<'high_speed_rail' | 'regional_rail'>
  coordinates: Coordinates
}

export interface CuratedHighlight {
  node_id: string
  title: string
  category:
    | 'art_museum'
    | 'monument'
    | 'viewpoint'
    | 'wine'
    | 'coastal'
    | 'culinary'
    | 'nature'
    | 'neighborhood'
  editorial_summary: string
  image_url: string
  suggested_duration_hours: number
  coordinates: Coordinates
  ztl_warning?: boolean
  seasonality?: 'all' | 'warm' | 'cold'
  region_id: string
}

export interface AreaProfile {
  region_id: string
  name: string
  tagline: string
  bounding_box: [Coordinates, Coordinates] // SW, NE
  center: Coordinates
  vibe_weights: {
    history: number
    wine_culinary: number
    coastal: number
    alpine: number
    modern: number
    iconic: number
  }
  transit_hubs: TransitHub[]
  curated_highlights: CuratedHighlight[]
}

export interface RouteLeg {
  leg_id: string
  origin_node_id: string
  destination_node_id: string
  selected_transit_mode: TransitMode
  estimated_duration_minutes: number
  polyline_geojson: {
    type: 'LineString'
    coordinates: Coordinates[]
  }
  physics_metadata: {
    tension_weight: number
    scenic_value: number
  }
}

export interface Archetype {
  id: string
  title: string
  subtitle: string
  description: string
  stops: string[] // region_ids in order
  duration_days: number
  vibe_fit: VibeWeights // 0..1 per axis — how close to slider state is ideal
  hero_image: string
}

export interface ItineraryStop {
  stop_id: string
  region_id: string
  highlight_ids: string[]
  day_index: number
  suggested_hours: number
}

export interface Itinerary {
  archetype_id: string | null
  stops: ItineraryStop[]
  transit_mode_preference: 'high_speed_rail' | 'scenic'
  total_days: number
}

export type ZoomLevel = 'macro' | 'meso' | 'micro'
