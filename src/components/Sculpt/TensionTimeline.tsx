import { motion } from 'framer-motion'
import { computeDayTensions, useTripStore } from '../../state/tripStore'
import { regionsById } from '../../data/regions'
import { buildLeg, formatDuration } from '../../data/transit'

export function TensionTimeline() {
  const itinerary = useTripStore((s) => s.itinerary)
  const removeStop = useTripStore((s) => s.removeStop)
  const setFocused = useTripStore((s) => s.setFocusedRegion)
  const setZoom = useTripStore((s) => s.setZoomLevel)
  const moveStopDay = useTripStore((s) => s.moveStopDay)

  if (itinerary.stops.length === 0) return null

  const tensions = computeDayTensions(itinerary)
  const mode = itinerary.transit_mode_preference === 'scenic' ? 'scenic' : 'high_speed_rail'
  const totalDays = Math.max(itinerary.total_days, ...itinerary.stops.map((s) => s.day_index + 1))

  return (
    <motion.footer
      className="timeline"
      initial={{ y: 140, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 140, damping: 22 }}
    >
      <div className="timeline__header">
        <span className="timeline__eyebrow">Step 03 · Tension Timeline</span>
        <h3>{totalDays} days · {itinerary.stops.length} stops</h3>
      </div>

      <div className="timeline__track">
        {itinerary.stops.map((stop, i) => {
          const region = regionsById[stop.region_id]
          if (!region) return null
          const tension = tensions[stop.day_index] ?? 0
          const isRushed = tension > 1.25
          const prev = itinerary.stops[i - 1]
          const leg = prev ? buildLeg(prev.region_id, stop.region_id, mode) : null

          return (
            <div key={stop.stop_id} className="timeline__group">
              {leg && (
                <div
                  className="timeline__leg"
                  data-tension={leg.physics_metadata.tension_weight > 2 ? 'high' : 'ok'}
                >
                  <span className="timeline__leg-line" />
                  <span className="timeline__leg-label">
                    {formatDuration(leg.estimated_duration_minutes)}
                  </span>
                </div>
              )}
              <motion.button
                className="timeline__node"
                data-rushed={isRushed}
                onClick={() => {
                  setFocused(stop.region_id)
                  setZoom('meso')
                }}
                layout
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  scale: isRushed ? 0.9 : 1,
                  filter: isRushed ? 'saturate(1.2)' : 'saturate(1)',
                }}
              >
                <span className="timeline__day">Day {stop.day_index + 1}</span>
                <span className="timeline__region">{region.name}</span>
                <span className="timeline__hours">
                  {stop.suggested_hours.toFixed(1)}h scheduled
                </span>
                <span className="timeline__highlights">
                  {stop.highlight_ids.length} spot{stop.highlight_ids.length === 1 ? '' : 's'}
                </span>
                {isRushed && (
                  <span className="timeline__warn">
                    Too packed — consider +1 day
                  </span>
                )}
                <div className="timeline__actions">
                  <button
                    className="timeline__day-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      moveStopDay(stop.stop_id, Math.max(0, stop.day_index - 1))
                    }}
                  >
                    −
                  </button>
                  <button
                    className="timeline__day-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      moveStopDay(stop.stop_id, stop.day_index + 1)
                    }}
                  >
                    +
                  </button>
                  <button
                    className="timeline__remove"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeStop(stop.stop_id)
                    }}
                  >
                    ✕
                  </button>
                </div>
              </motion.button>
            </div>
          )
        })}
      </div>
    </motion.footer>
  )
}
