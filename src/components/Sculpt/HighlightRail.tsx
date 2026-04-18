import { AnimatePresence, motion } from 'framer-motion'
import { useTripStore } from '../../state/tripStore'
import { regionsById } from '../../data/regions'
import type { CuratedHighlight } from '../../types'

export function HighlightRail() {
  const focused = useTripStore((s) => s.focusedRegionId)
  const zoomLevel = useTripStore((s) => s.zoomLevel)
  const itinerary = useTripStore((s) => s.itinerary)
  const addHighlight = useTripStore((s) => s.addHighlightToStop)
  const season = useTripStore((s) => s.season)
  const setFocused = useTripStore((s) => s.setFocusedRegion)

  const region = focused ? regionsById[focused] : null
  if (!region || zoomLevel === 'macro') return null

  const seasonFiltered = region.curated_highlights.filter((h) => {
    if (h.seasonality === 'warm' && season === 'cold') return false
    if (h.seasonality === 'cold' && season === 'warm') return false
    return true
  })

  const committedHighlightIds = new Set(
    itinerary.stops
      .filter((s) => s.region_id === region.region_id)
      .flatMap((s) => s.highlight_ids),
  )

  function handleCommit(h: CuratedHighlight) {
    if (!region) return
    const existingStop = itinerary.stops.find((s) => s.region_id === region.region_id)
    const last = itinerary.stops[itinerary.stops.length - 1]
    const day = existingStop?.day_index ?? (last?.day_index ?? -1) + 2
    addHighlight(region.region_id, h.node_id, Math.max(0, day))
  }

  return (
    <motion.aside
      className="panel panel--rail"
      initial={{ x: 60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 60, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 160, damping: 22 }}
    >
      <header className="rail__header">
        <button className="rail__close" onClick={() => setFocused(null)} aria-label="Close">
          ✕
        </button>
        <span className="rail__eyebrow">{seasonFiltered.length} curated spots</span>
        <h2 className="rail__title">{region.name}</h2>
        <p className="rail__tagline">{region.tagline}</p>
      </header>
      <AnimatePresence>
        <div className="rail__list">
          {seasonFiltered.map((h, i) => {
            const committed = committedHighlightIds.has(h.node_id)
            return (
              <motion.article
                key={h.node_id}
                className="highlight-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: i * 0.06, type: 'spring', stiffness: 180, damping: 22 }}
                data-committed={committed}
              >
                <div
                  className="highlight-card__image"
                  style={{ backgroundImage: `url(${h.image_url})` }}
                />
                <div className="highlight-card__body">
                  <div className="highlight-card__meta">
                    <span className="highlight-card__category">{h.category.replace('_', ' ')}</span>
                    <span className="highlight-card__duration">
                      {h.suggested_duration_hours}h
                    </span>
                    {h.ztl_warning && <span className="highlight-card__ztl">ZTL ⚠</span>}
                  </div>
                  <h3>{h.title}</h3>
                  <p>{h.editorial_summary}</p>
                  <button
                    className="highlight-card__commit"
                    onClick={() => handleCommit(h)}
                    disabled={committed}
                  >
                    {committed ? 'In your trip ✓' : 'Drop into trip ↵'}
                  </button>
                </div>
              </motion.article>
            )
          })}
        </div>
      </AnimatePresence>
    </motion.aside>
  )
}
