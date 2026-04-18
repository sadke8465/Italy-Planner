import { motion } from 'framer-motion'
import {
  computeDayRanges,
  totalPlannedDays,
  totalPlannedHours,
  useTripStore,
} from '../../state/tripStore'
import { regionsById } from '../../data/regions'
import { buildLeg, formatDuration } from '../../data/transit'
import type { TransitMode } from '../../types'

const MODE_GLYPH: Record<TransitMode, string> = {
  high_speed_rail: '🚆',
  regional_rail: '🚉',
  car: '🚗',
  scenic: '🛤️',
}

const MODE_LABEL: Record<TransitMode, string> = {
  high_speed_rail: 'Frecciarossa',
  regional_rail: 'Regional',
  car: 'By car',
  scenic: 'Scenic',
}

export function DirectionsTimeline() {
  const stops = useTripStore((s) => s.stops)
  const totalDays = useTripStore((s) => s.totalDays)
  const transitMode = useTripStore((s) => s.transitMode)
  const setFocused = useTripStore((s) => s.setFocusedRegion)
  const focusedId = useTripStore((s) => s.focusedRegionId)
  const removePlace = useTripStore((s) => s.removePlace)
  const movePlace = useTripStore((s) => s.movePlace)
  const setStopNights = useTripStore((s) => s.setStopNights)

  if (stops.length === 0) return null

  const ranges = computeDayRanges(stops)
  const plannedDays = totalPlannedDays(stops)
  const plannedHours = totalPlannedHours(stops)
  const overbooked = plannedDays > totalDays

  return (
    <motion.footer
      className="directions"
      initial={{ y: 140, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 140, damping: 22 }}
    >
      <div className="directions__header">
        <div className="directions__header-left">
          <span className="panel__eyebrow">Your route</span>
          <h3>
            {stops.length} stop{stops.length === 1 ? '' : 's'} · {plannedDays}/{totalDays} days
          </h3>
        </div>
        <div className="directions__header-right">
          <span className="directions__stat">
            {plannedHours.toFixed(1)}h activities queued
          </span>
          {overbooked && (
            <span className="directions__warn">
              {plannedDays - totalDays} day{plannedDays - totalDays === 1 ? '' : 's'} over budget
            </span>
          )}
        </div>
      </div>

      <div className="directions__track">
        {stops.map((stop, i) => {
          const region = regionsById[stop.region_id]
          if (!region) return null
          const range = ranges[stop.stop_id]
          const prev = stops[i - 1]
          const leg = prev ? buildLeg(prev.region_id, stop.region_id, transitMode) : null
          const isFocused = focusedId === stop.region_id
          const isStart = stop.role === 'start'
          const isEnd = stop.role === 'end'

          return (
            <div key={stop.stop_id} className="directions__cell">
              {leg && (
                <div className="directions__leg">
                  <span className="directions__leg-icon" aria-hidden>
                    {MODE_GLYPH[transitMode]}
                  </span>
                  <div className="directions__leg-line">
                    <span className="directions__leg-arrow">▶</span>
                  </div>
                  <span className="directions__leg-duration">
                    {formatDuration(leg.estimated_duration_minutes)}
                  </span>
                  <span className="directions__leg-mode">{MODE_LABEL[transitMode]}</span>
                </div>
              )}
              <motion.button
                layout
                className="directions__stop"
                data-role={stop.role}
                data-focused={isFocused}
                onClick={() => setFocused(stop.region_id)}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="directions__stop-badge" data-role={stop.role}>
                  {isStart ? 'S' : isEnd ? 'E' : i}
                </span>
                <span className="directions__stop-day">
                  {range.start === range.end
                    ? `Day ${range.start}`
                    : `Days ${range.start}–${range.end}`}
                </span>
                <span className="directions__stop-name">{region.name}</span>
                <span className="directions__stop-sub">
                  {stop.highlight_ids.length} spot
                  {stop.highlight_ids.length === 1 ? '' : 's'} ·{' '}
                  {stop.nights} night{stop.nights === 1 ? '' : 's'}
                </span>

                <div className="directions__stop-controls">
                  <button
                    className="directions__ctrl"
                    onClick={(e) => {
                      e.stopPropagation()
                      setStopNights(stop.stop_id, stop.nights - 1)
                    }}
                    aria-label="Shorten stay"
                  >
                    −
                  </button>
                  <span className="directions__ctrl-value">{stop.nights}n</span>
                  <button
                    className="directions__ctrl"
                    onClick={(e) => {
                      e.stopPropagation()
                      setStopNights(stop.stop_id, stop.nights + 1)
                    }}
                    aria-label="Extend stay"
                  >
                    +
                  </button>
                  {stop.role === 'middle' && (
                    <>
                      <button
                        className="directions__ctrl"
                        onClick={(e) => {
                          e.stopPropagation()
                          movePlace(stop.stop_id, -1)
                        }}
                        aria-label="Move earlier"
                      >
                        ←
                      </button>
                      <button
                        className="directions__ctrl"
                        onClick={(e) => {
                          e.stopPropagation()
                          movePlace(stop.stop_id, 1)
                        }}
                        aria-label="Move later"
                      >
                        →
                      </button>
                      <button
                        className="directions__ctrl directions__ctrl--remove"
                        onClick={(e) => {
                          e.stopPropagation()
                          removePlace(stop.stop_id)
                        }}
                        aria-label="Remove stop"
                      >
                        ✕
                      </button>
                    </>
                  )}
                </div>
              </motion.button>
            </div>
          )
        })}
      </div>
    </motion.footer>
  )
}
