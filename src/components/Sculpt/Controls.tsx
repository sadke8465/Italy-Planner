import { motion } from 'framer-motion'
import { useTripStore } from '../../state/tripStore'

export function SculptControls() {
  const pref = useTripStore((s) => s.itinerary.transit_mode_preference)
  const setPref = useTripStore((s) => s.setTransitPreference)
  const season = useTripStore((s) => s.season)
  const setSeason = useTripStore((s) => s.setSeason)
  const reset = useTripStore((s) => s.reset)

  return (
    <motion.div
      className="sculpt-controls"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, type: 'spring', stiffness: 140, damping: 22 }}
    >
      <div className="toggle-group" data-variant="transit">
        <span className="toggle-group__label">Transit</span>
        <button
          data-active={pref === 'high_speed_rail'}
          onClick={() => setPref('high_speed_rail')}
        >
          High-speed
        </button>
        <button
          data-active={pref === 'scenic'}
          onClick={() => setPref('scenic')}
        >
          Analog · Scenic
        </button>
      </div>

      <div className="toggle-group" data-variant="season">
        <span className="toggle-group__label">Season</span>
        <button
          data-active={season === 'warm'}
          onClick={() => setSeason('warm')}
        >
          Warm · Apr–Oct
        </button>
        <button
          data-active={season === 'cold'}
          onClick={() => setSeason('cold')}
        >
          Cold · Nov–Mar
        </button>
      </div>

      <button className="btn btn--ghost" onClick={reset}>
        Start over
      </button>
    </motion.div>
  )
}
