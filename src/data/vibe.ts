import type { Archetype, VibeAxis, VibeWeights } from '../types'
import { archetypes } from './archetypes'

export const VIBE_AXES: {
  key: VibeAxis
  leftLabel: string
  rightLabel: string
  description: string
}[] = [
  {
    key: 'history_modern',
    leftLabel: 'Ancient History',
    rightLabel: 'Modern Culture',
    description: 'Ruined forums, or design districts and rooftop bars.',
  },
  {
    key: 'coastal_alpine',
    leftLabel: 'Coastal Relaxation',
    rightLabel: 'Alpine Active',
    description: 'Boat rides and granita, or via ferrata and rifugios.',
  },
  {
    key: 'wine_art',
    leftLabel: 'Wine & Culinary',
    rightLabel: 'Art & Architecture',
    description: 'Cellar tours and long lunches, or Renaissance galleries.',
  },
  {
    key: 'iconic_offbeat',
    leftLabel: 'Iconic & Classic',
    rightLabel: 'Off-the-Beaten-Path',
    description: 'The must-sees, or sleepy villages and empty trails.',
  },
]

export const defaultVibe: VibeWeights = {
  history_modern: 0.3,
  coastal_alpine: 0.4,
  wine_art: 0.5,
  iconic_offbeat: 0.35,
}

// Distance between current slider state and an archetype's ideal fit.
// Lower = better match. Used to rank the 3 archetype pitches.
export function scoreArchetype(vibe: VibeWeights, a: Archetype): number {
  let sum = 0
  ;(Object.keys(vibe) as VibeAxis[]).forEach((k) => {
    const d = vibe[k] - a.vibe_fit[k]
    sum += d * d
  })
  return Math.sqrt(sum)
}

export function rankArchetypes(vibe: VibeWeights): Archetype[] {
  return [...archetypes].sort((a, b) => scoreArchetype(vibe, a) - scoreArchetype(vibe, b))
}

// Per-region relevance in [0..1], derived from vibe sliders. Used by the
// map heatmap + region opacity.
export function regionRelevance(
  vibe: VibeWeights,
  region: {
    vibe_weights: {
      history: number
      modern: number
      coastal: number
      alpine: number
      wine_culinary: number
      iconic: number
    }
  },
): number {
  const w = region.vibe_weights
  // For each slider, 0 favors "left" axis, 1 favors "right".
  const historyFit = lerp(w.history, w.modern, vibe.history_modern)
  const coastalFit = lerp(w.coastal, w.alpine, vibe.coastal_alpine)
  const wineFit = lerp(w.wine_culinary, (w.history + w.modern) / 2, vibe.wine_art)
  const iconicFit = lerp(w.iconic, 1 - w.iconic, vibe.iconic_offbeat)
  return (historyFit + coastalFit + wineFit + iconicFit) / 4
}

function lerp(a: number, b: number, t: number) {
  return a * (1 - t) + b * t
}
