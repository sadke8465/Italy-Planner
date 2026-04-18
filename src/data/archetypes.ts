import type { Archetype } from '../types'

// Hand-authored archetype pitches. In production these are synthesized
// dynamically by the LLM (§1B "Dynamic Archetyping").

export const archetypes: Archetype[] = [
  {
    id: 'arc_classic_core',
    title: 'The Classic Core',
    subtitle: 'Rome \u00b7 Florence \u00b7 Venice',
    description:
      'The canonical triangle. Roman stones, Renaissance paintings, Venetian water \u2014 three different Italys in eight days.',
    stops: ['reg_lazio', 'reg_tuscany', 'reg_veneto'],
    duration_days: 8,
    vibe_fit: { history_modern: 0.15, coastal_alpine: 0.35, wine_art: 0.4, iconic_offbeat: 0.1 },
    hero_image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1400&q=80',
  },
  {
    id: 'arc_southern_sun',
    title: 'The Southern Sun',
    subtitle: 'Rome \u00b7 Naples \u00b7 Amalfi \u00b7 Sicily',
    description:
      'A slow descent toward the Mediterranean. Volcanic coastlines, pizza ovens, Greek theaters above turquoise water.',
    stops: ['reg_lazio', 'reg_campania', 'reg_sicily'],
    duration_days: 11,
    vibe_fit: { history_modern: 0.25, coastal_alpine: 0.1, wine_art: 0.5, iconic_offbeat: 0.35 },
    hero_image: 'https://images.unsplash.com/photo-1533676802871-eca1ae998cd9?w=1400&q=80',
  },
  {
    id: 'arc_wine_pilgrim',
    title: 'The Wine Pilgrim',
    subtitle: 'Piedmont \u00b7 Tuscany \u00b7 Veneto',
    description:
      'Barolo, Brunello, Amarone. Three appellations, three dialects of Italian terroir, one liver.',
    stops: ['reg_piedmont', 'reg_tuscany', 'reg_veneto'],
    duration_days: 9,
    vibe_fit: { history_modern: 0.4, coastal_alpine: 0.55, wine_art: 0.1, iconic_offbeat: 0.5 },
    hero_image: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1400&q=80',
  },
  {
    id: 'arc_northern_alps',
    title: 'The Northern Heights',
    subtitle: 'Milan \u00b7 Como \u00b7 Dolomites',
    description:
      'Design capital to alpine amphitheater. Aperitivo at sea level, rifugio dinners at 2,000 meters.',
    stops: ['reg_lombardy', 'reg_dolomites'],
    duration_days: 7,
    vibe_fit: { history_modern: 0.75, coastal_alpine: 0.9, wine_art: 0.45, iconic_offbeat: 0.6 },
    hero_image: 'https://images.unsplash.com/photo-1516815231560-8f41ec531527?w=1400&q=80',
  },
  {
    id: 'arc_puglian_detour',
    title: 'The Puglian Detour',
    subtitle: 'Rome \u00b7 Puglia \u00b7 Sicily',
    description:
      'South of the guidebooks. Whitewashed towns, Baroque limestone, and the long Ionian afternoon.',
    stops: ['reg_lazio', 'reg_puglia', 'reg_sicily'],
    duration_days: 10,
    vibe_fit: { history_modern: 0.3, coastal_alpine: 0.15, wine_art: 0.65, iconic_offbeat: 0.85 },
    hero_image: 'https://images.unsplash.com/photo-1558005137-d9619a5c539f?w=1400&q=80',
  },
  {
    id: 'arc_renaissance_scholar',
    title: 'The Renaissance Scholar',
    subtitle: 'Florence \u00b7 Siena \u00b7 Rome',
    description:
      'A tight, art-saturated loop. Uffizi mornings, Chianti afternoons, Sistine Chapel as the finale.',
    stops: ['reg_tuscany', 'reg_lazio'],
    duration_days: 6,
    vibe_fit: { history_modern: 0.1, coastal_alpine: 0.4, wine_art: 0.2, iconic_offbeat: 0.2 },
    hero_image: 'https://images.unsplash.com/photo-1543429776-2782fc8e1acd?w=1400&q=80',
  },
]
