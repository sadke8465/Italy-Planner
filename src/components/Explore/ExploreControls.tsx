import { motion } from 'framer-motion'
import { useTripStore } from '../../state/tripStore'
import type { TransitMode } from '../../types'

const TRANSIT_OPTIONS: { value: TransitMode; label: string }[] = [
  { value: 'high_speed_rail', label: 'High-speed' },
  { value: 'car', label: 'By car' },
  { value: 'scenic', label: 'Scenic' },
]

export function ExploreControls() {
  const transitMode = useTripStore((s) => s.transitMode)
  const setTransitMode = useTripStore((s) => s.setTransitMode)
  const season = useTripStore((s) => s.season)
  const setSeason = useTripStore((s) => s.setSeason)
  const backToSetup = useTripStore((s) => s.backToSetup)

  return (
    <motion.div
      className="explore-controls"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, type: 'spring', stiffness: 140, damping: 22 }}
    >
      <div className="toggle-group">
        <span className="toggle-group__label">Travel</span>
        {TRANSIT_OPTIONS.map((o) => (
          <button
            key={o.value}
            data-active={transitMode === o.value}
            onClick={() => setTransitMode(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="toggle-group">
        <span className="toggle-group__label">Season</span>
        <button data-active={season === 'warm'} onClick={() => setSeason('warm')}>
          Warm
        </button>
        <button data-active={season === 'cold'} onClick={() => setSeason('cold')}>
          Cold
        </button>
      </div>

      <button className="btn btn--ghost" onClick={backToSetup}>
        ← Start over
      </button>
    </motion.div>
  )
}
