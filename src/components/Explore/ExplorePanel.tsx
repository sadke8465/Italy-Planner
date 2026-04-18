import { AnimatePresence, motion } from 'framer-motion'
import { useMemo } from 'react'
import { useTripStore } from '../../state/tripStore'
import { regions, regionsById } from '../../data/regions'
import { buildLeg, formatDuration, haversine } from '../../data/transit'

export function ExplorePanel() {
  const focusedId = useTripStore((s) => s.focusedRegionId)
  const stops = useTripStore((s) => s.stops)
  const season = useTripStore((s) => s.season)
  const transitMode = useTripStore((s) => s.transitMode)
  const addPlace = useTripStore((s) => s.addPlace)
  const removePlace = useTripStore((s) => s.removePlace)
  const toggleHighlight = useTripStore((s) => s.toggleHighlight)
  const setFocusedRegion = useTripStore((s) => s.setFocusedRegion)

  const focused = focusedId ? regionsById[focusedId] : null
  const isAdded = !!focused && stops.some((s) => s.region_id === focused.region_id)
  const addedStop = focused
    ? stops.find((s) => s.region_id === focused.region_id) ?? null
    : null

  // Suggest other regions sorted by distance from the nearest committed stop.
  const suggestions = useMemo(() => {
    if (focused) return []
    const committedIds = new Set(stops.map((s) => s.region_id))
    const anchors = stops.map((s) => regionsById[s.region_id]?.center).filter(Boolean) as [number, number][]
    return regions
      .filter((r) => !committedIds.has(r.region_id))
      .map((r) => {
        const minKm = anchors.length
          ? Math.min(...anchors.map((a) => haversine(a, r.center)))
          : 0
        return { region: r, km: minKm }
      })
      .sort((a, b) => a.km - b.km)
  }, [focused, stops])

  if (!focused) {
    return (
      <motion.aside
        className="panel panel--explore explore--browse"
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 160, damping: 22 }}
      >
        <div className="explore__header">
          <span className="panel__eyebrow">Step 02 · Explore</span>
          <h2 className="panel__title">Browse places to add</h2>
          <p className="panel__subtitle">
            Click a region on the map, or pick below. Each place shows what it&apos;s
            famous for before you commit.
          </p>
        </div>
        <div className="explore__list">
          {suggestions.map(({ region, km }) => (
            <button
              key={region.region_id}
              className="explore-card"
              onClick={() => setFocusedRegion(region.region_id)}
            >
              <div
                className="explore-card__image"
                style={{
                  backgroundImage: `url(${region.curated_highlights[0]?.image_url ?? ''})`,
                }}
              />
              <div className="explore-card__body">
                <div className="explore-card__meta">
                  <span>{region.curated_highlights.length} spots</span>
                  {km > 0 && <span>· {Math.round(km)} km away</span>}
                </div>
                <h3>{region.name}</h3>
                <p>{region.tagline}</p>
              </div>
            </button>
          ))}
        </div>
      </motion.aside>
    )
  }

  const filteredHighlights = focused.curated_highlights.filter((h) => {
    if (h.seasonality === 'warm' && season === 'cold') return false
    if (h.seasonality === 'cold' && season === 'warm') return false
    return true
  })

  // Travel info from the previous committed stop (if any).
  const prevStop = (() => {
    if (!isAdded) {
      // if adding — measure from last stop before the end
      const endIdx = stops.findIndex((s) => s.role === 'end')
      const anchor = endIdx === -1 ? stops[stops.length - 1] : stops[endIdx - 1]
      return anchor ?? null
    }
    const idx = stops.findIndex((s) => s.region_id === focused.region_id)
    return idx > 0 ? stops[idx - 1] : null
  })()

  const legInfo = prevStop
    ? buildLeg(prevStop.region_id, focused.region_id, transitMode)
    : null
  const prevName = prevStop ? regionsById[prevStop.region_id]?.name : null

  const committedIds = addedStop?.highlight_ids ?? []

  return (
    <motion.aside
      key={focused.region_id}
      className="panel panel--explore explore--detail"
      initial={{ x: -60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -60, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 160, damping: 22 }}
    >
      <header className="explore__detail-header">
        <button
          className="explore__back"
          onClick={() => setFocusedRegion(null)}
          aria-label="Back to list"
        >
          ← Browse
        </button>
        <span className="panel__eyebrow">Region</span>
        <h2 className="explore__title">{focused.name}</h2>
        <p className="explore__tagline">{focused.tagline}</p>

        {legInfo && prevName && (
          <div className="explore__travel">
            <span className="explore__travel-from">From {prevName}</span>
            <span className="explore__travel-time">
              {formatDuration(legInfo.estimated_duration_minutes)} ·{' '}
              {transitMode === 'scenic' ? 'scenic' : transitMode === 'car' ? 'by car' : 'high-speed rail'}
            </span>
          </div>
        )}

        <div className="explore__actions">
          {!isAdded ? (
            <button
              className="btn btn--primary explore__add"
              onClick={() => addPlace(focused.region_id)}
            >
              + Add to itinerary
            </button>
          ) : addedStop && addedStop.role === 'middle' ? (
            <button
              className="btn btn--ghost explore__remove"
              onClick={() => removePlace(addedStop.stop_id)}
            >
              Remove from itinerary
            </button>
          ) : (
            <span className="explore__locked">
              {addedStop?.role === 'start' ? 'Start of trip' : 'End of trip'}
            </span>
          )}
        </div>
      </header>

      <div className="explore__offerings">
        <div className="explore__offerings-label">
          <span>What&apos;s here</span>
          <span>{filteredHighlights.length} curated</span>
        </div>
        <AnimatePresence>
          {filteredHighlights.map((h, i) => {
            const checked = committedIds.includes(h.node_id)
            return (
              <motion.article
                key={h.node_id}
                className="offering"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ delay: i * 0.04, type: 'spring', stiffness: 180, damping: 24 }}
                data-checked={checked}
              >
                <div
                  className="offering__image"
                  style={{ backgroundImage: `url(${h.image_url})` }}
                />
                <div className="offering__body">
                  <div className="offering__meta">
                    <span className="offering__category">
                      {h.category.replace('_', ' ')}
                    </span>
                    <span className="offering__duration">
                      {h.suggested_duration_hours}h
                    </span>
                    {h.ztl_warning && <span className="offering__ztl">ZTL ⚠</span>}
                  </div>
                  <h3>{h.title}</h3>
                  <p>{h.editorial_summary}</p>
                  {isAdded && addedStop ? (
                    <button
                      className="offering__toggle"
                      data-checked={checked}
                      onClick={() => toggleHighlight(addedStop.stop_id, h.node_id)}
                    >
                      {checked ? '✓ Added to day' : '+ Add to day'}
                    </button>
                  ) : (
                    <span className="offering__hint">Add region first, then pick your spots</span>
                  )}
                </div>
              </motion.article>
            )
          })}
        </AnimatePresence>
      </div>
    </motion.aside>
  )
}

