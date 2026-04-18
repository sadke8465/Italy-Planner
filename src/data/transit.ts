import type { Coordinates, RouteLeg, TransitMode } from '../types'
import { regionsById } from './regions'

// Hand-curated route legs for major Italian pairs. In production these
// come from OpenRouteService (§5B). We expose a simple `buildLeg()` that
// picks the nearest curated polyline, or falls back to a great-circle
// straight line with a crude duration estimate.

type LegSeed = {
  from: string // region_id
  to: string // region_id
  modes: Partial<Record<TransitMode, { minutes: number; via: Coordinates[] }>>
  tension_weight?: number
  scenic_value?: number
}

const seeds: LegSeed[] = [
  {
    from: 'reg_lazio',
    to: 'reg_tuscany',
    modes: {
      high_speed_rail: {
        minutes: 95,
        via: [[12.5017, 41.9009], [12.2, 42.4], [11.5, 43.2], [11.247, 43.776]],
      },
      scenic: {
        minutes: 210,
        via: [[12.5, 41.9], [12.1, 42.3], [11.9, 42.8], [11.7, 43.1], [11.3, 43.5], [11.247, 43.776]],
      },
      car: {
        minutes: 175,
        via: [[12.5, 41.9], [12.0, 42.5], [11.5, 43.2], [11.247, 43.776]],
      },
    },
    tension_weight: 1.0,
    scenic_value: 0.6,
  },
  {
    from: 'reg_tuscany',
    to: 'reg_veneto',
    modes: {
      high_speed_rail: {
        minutes: 125,
        via: [[11.247, 43.776], [11.3, 44.5], [11.8, 45.0], [12.3208, 45.4413]],
      },
      scenic: {
        minutes: 300,
        via: [[11.247, 43.776], [11.4, 44.1], [11.6, 44.5], [11.9, 44.9], [12.3, 45.4]],
      },
    },
    tension_weight: 1.2,
    scenic_value: 0.5,
  },
  {
    from: 'reg_lazio',
    to: 'reg_veneto',
    modes: {
      high_speed_rail: {
        minutes: 220,
        via: [[12.5, 41.9], [11.9, 43.1], [11.3, 44.0], [11.8, 44.9], [12.32, 45.44]],
      },
    },
    tension_weight: 2.2,
    scenic_value: 0.4,
  },
  {
    from: 'reg_lazio',
    to: 'reg_campania',
    modes: {
      high_speed_rail: {
        minutes: 70,
        via: [[12.5017, 41.9009], [13.4, 41.4], [14.0, 41.1], [14.2725, 40.8522]],
      },
      car: {
        minutes: 150,
        via: [[12.5, 41.9], [13.4, 41.5], [14.0, 41.1], [14.27, 40.85]],
      },
    },
    tension_weight: 0.8,
    scenic_value: 0.5,
  },
  {
    from: 'reg_campania',
    to: 'reg_sicily',
    modes: {
      high_speed_rail: {
        minutes: 350,
        via: [[14.27, 40.85], [15.2, 40.0], [15.9, 38.2], [15.29, 37.85], [14.0154, 37.6]],
      },
      scenic: {
        minutes: 560,
        via: [[14.27, 40.85], [15.0, 40.1], [15.6, 39.0], [15.8, 38.3], [14.01, 37.6]],
      },
    },
    tension_weight: 2.8,
    scenic_value: 0.9,
  },
  {
    from: 'reg_lombardy',
    to: 'reg_piedmont',
    modes: {
      high_speed_rail: {
        minutes: 55,
        via: [[9.2045, 45.4864], [8.5, 45.3], [7.9, 45.1], [7.6658, 45.0728]],
      },
      car: {
        minutes: 110,
        via: [[9.2, 45.49], [8.6, 45.3], [7.9, 45.1], [7.66, 45.07]],
      },
    },
    tension_weight: 0.6,
    scenic_value: 0.4,
  },
  {
    from: 'reg_piedmont',
    to: 'reg_tuscany',
    modes: {
      high_speed_rail: {
        minutes: 200,
        via: [[7.66, 45.07], [8.5, 44.5], [9.8, 44.1], [11.0, 43.9], [11.247, 43.776]],
      },
      scenic: {
        minutes: 330,
        via: [[7.66, 45.07], [8.2, 44.6], [9.5, 44.2], [10.5, 43.9], [11.2, 43.77]],
      },
    },
    tension_weight: 1.6,
    scenic_value: 0.7,
  },
  {
    from: 'reg_lombardy',
    to: 'reg_dolomites',
    modes: {
      regional_rail: {
        minutes: 260,
        via: [[9.2045, 45.4864], [9.8, 45.7], [10.8, 46.0], [11.35, 46.5]],
      },
      car: {
        minutes: 220,
        via: [[9.2, 45.49], [9.9, 45.7], [10.9, 46.0], [11.35, 46.5]],
      },
      scenic: {
        minutes: 330,
        via: [[9.2, 45.49], [9.7, 45.9], [10.5, 46.2], [11.35, 46.5]],
      },
    },
    tension_weight: 1.8,
    scenic_value: 1.0,
  },
  {
    from: 'reg_lazio',
    to: 'reg_puglia',
    modes: {
      high_speed_rail: {
        minutes: 240,
        via: [[12.5, 41.9], [13.4, 41.6], [14.8, 41.4], [16.0, 41.2], [16.87, 41.13]],
      },
      car: {
        minutes: 280,
        via: [[12.5, 41.9], [13.5, 41.5], [15.0, 41.3], [16.0, 41.2], [16.87, 41.13]],
      },
    },
    tension_weight: 2.4,
    scenic_value: 0.6,
  },
  {
    from: 'reg_puglia',
    to: 'reg_sicily',
    modes: {
      scenic: {
        minutes: 520,
        via: [[16.87, 41.13], [16.0, 40.0], [15.6, 39.0], [15.3, 38.2], [14.01, 37.6]],
      },
    },
    tension_weight: 3.2,
    scenic_value: 1.0,
  },
]

function pairKey(a: string, b: string) {
  return [a, b].sort().join('__')
}

const seedMap = new Map<string, LegSeed>()
for (const s of seeds) seedMap.set(pairKey(s.from, s.to), s)

export function buildLeg(
  originRegion: string,
  destRegion: string,
  mode: TransitMode,
): RouteLeg {
  const key = pairKey(originRegion, destRegion)
  const seed = seedMap.get(key)
  const origin = regionsById[originRegion]?.center
  const dest = regionsById[destRegion]?.center

  let coords: Coordinates[]
  let minutes: number

  if (seed && seed.modes[mode]) {
    const m = seed.modes[mode]!
    coords = seed.from === originRegion ? m.via : [...m.via].reverse()
    minutes = m.minutes
  } else if (seed) {
    const fallback =
      seed.modes.high_speed_rail ?? seed.modes.scenic ?? seed.modes.car ?? seed.modes.regional_rail!
    coords = seed.from === originRegion ? fallback.via : [...fallback.via].reverse()
    minutes = fallback.minutes * (mode === 'scenic' ? 1.7 : mode === 'car' ? 1.3 : 1)
  } else if (origin && dest) {
    coords = [origin, dest]
    const km = haversine(origin, dest)
    const speed = mode === 'high_speed_rail' ? 200 : mode === 'car' ? 90 : 70
    minutes = (km / speed) * 60
  } else {
    coords = []
    minutes = 0
  }

  return {
    leg_id: `leg_${originRegion}__${destRegion}__${mode}`,
    origin_node_id: originRegion,
    destination_node_id: destRegion,
    selected_transit_mode: mode,
    estimated_duration_minutes: Math.round(minutes),
    polyline_geojson: { type: 'LineString', coordinates: coords },
    physics_metadata: {
      tension_weight: seed?.tension_weight ?? 1.5,
      scenic_value: seed?.scenic_value ?? 0.5,
    },
  }
}

export function haversine(a: Coordinates, b: Coordinates): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const [lng1, lat1] = a
  const [lng2, lat2] = b
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}
