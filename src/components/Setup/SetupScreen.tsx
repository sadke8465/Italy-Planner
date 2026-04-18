import { motion } from 'framer-motion'
import { useTripStore } from '../../state/tripStore'
import { regions } from '../../data/regions'

export function SetupScreen() {
  const startId = useTripStore((s) => s.startRegionId)
  const endId = useTripStore((s) => s.endRegionId)
  const days = useTripStore((s) => s.totalDays)
  const setStart = useTripStore((s) => s.setStart)
  const setEnd = useTripStore((s) => s.setEnd)
  const setDays = useTripStore((s) => s.setTotalDays)
  const beginPlanning = useTripStore((s) => s.beginPlanning)

  const canStart = !!startId && days >= 1

  return (
    <motion.div
      className="panel panel--setup"
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 150, damping: 22 }}
    >
      <div className="panel__header">
        <span className="panel__eyebrow">Step 01 · Shape your trip</span>
        <h2 className="panel__title">Where to, and for how long?</h2>
        <p className="panel__subtitle">
          Pick where you land and where you fly home. Then explore Italy place by place
          — we&apos;ll plot the route, travel times, and everything each stop has to
          offer.
        </p>
      </div>

      <div className="setup__form">
        <label className="setup__field">
          <span className="setup__label">Start</span>
          <select
            className="setup__select"
            value={startId ?? ''}
            onChange={(e) => setStart(e.target.value || null)}
          >
            <option value="">Choose a starting region…</option>
            {regions.map((r) => (
              <option key={r.region_id} value={r.region_id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>

        <label className="setup__field">
          <span className="setup__label">End</span>
          <select
            className="setup__select"
            value={endId ?? ''}
            onChange={(e) => setEnd(e.target.value || null)}
          >
            <option value="">Same as start · round trip</option>
            {regions.map((r) => (
              <option key={r.region_id} value={r.region_id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>

        <label className="setup__field">
          <span className="setup__label">Days</span>
          <div className="setup__days">
            <button
              type="button"
              className="setup__days-btn"
              onClick={() => setDays(days - 1)}
              aria-label="Fewer days"
            >
              −
            </button>
            <input
              type="number"
              className="setup__days-input"
              min={1}
              max={60}
              value={days}
              onChange={(e) => setDays(Number(e.target.value) || 1)}
            />
            <button
              type="button"
              className="setup__days-btn"
              onClick={() => setDays(days + 1)}
              aria-label="More days"
            >
              +
            </button>
          </div>
        </label>
      </div>

      <div className="panel__footer setup__footer">
        <div className="setup__quick">
          {[5, 7, 10, 14].map((n) => (
            <button
              key={n}
              className="setup__quick-btn"
              data-active={days === n}
              onClick={() => setDays(n)}
            >
              {n} days
            </button>
          ))}
        </div>
        <button
          className="btn btn--primary setup__start"
          disabled={!canStart}
          onClick={beginPlanning}
        >
          Start exploring →
        </button>
      </div>
    </motion.div>
  )
}
