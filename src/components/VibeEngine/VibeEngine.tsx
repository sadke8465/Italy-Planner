import { motion } from 'framer-motion'
import { VIBE_AXES } from '../../data/vibe'
import { useTripStore } from '../../state/tripStore'
import { VibeSlider } from './VibeSlider'

export function VibeEngine() {
  const vibe = useTripStore((s) => s.vibe)
  const setVibe = useTripStore((s) => s.setVibe)
  const setPhase = useTripStore((s) => s.setPhase)

  return (
    <motion.aside
      className="panel panel--vibe"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ type: 'spring', stiffness: 120, damping: 22 }}
    >
      <header className="panel__header">
        <span className="panel__eyebrow">Step 01 · The Vibe Engine</span>
        <h1 className="panel__title">What kind of Italy are you after?</h1>
        <p className="panel__subtitle">
          Don’t tell us where. Tell us how. The map will glow where your trip
          wants to be.
        </p>
      </header>

      <div className="vibe-sliders">
        {VIBE_AXES.map((axis) => (
          <VibeSlider
            key={axis.key}
            axis={axis}
            value={vibe[axis.key]}
            onChange={(v) => setVibe(axis.key, v)}
          />
        ))}
      </div>

      <footer className="panel__footer">
        <button
          className="btn btn--primary"
          onClick={() => setPhase('pitch')}
        >
          See 3 archetypes →
        </button>
      </footer>
    </motion.aside>
  )
}
