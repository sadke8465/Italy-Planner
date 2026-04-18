import { AnimatePresence } from 'framer-motion'
import { LivingMap } from './components/LivingMap/LivingMap'
import { VibeEngine } from './components/VibeEngine/VibeEngine'
import { ArchetypeCards } from './components/Archetype/ArchetypeCards'
import { HighlightRail } from './components/Sculpt/HighlightRail'
import { TensionTimeline } from './components/Sculpt/TensionTimeline'
import { SculptControls } from './components/Sculpt/Controls'
import { useTripStore } from './state/tripStore'

export default function App() {
  const phase = useTripStore((s) => s.phase)
  const focused = useTripStore((s) => s.focusedRegionId)

  return (
    <div className="app">
      <div className="app__brand">
        <span className="app__brand-mark">The Living Map</span>
        <span className="app__brand-tag">· Italy</span>
      </div>

      <LivingMap mode={phase} />

      <AnimatePresence mode="wait">
        {phase === 'vibe' && <VibeEngine key="vibe" />}
        {phase === 'pitch' && <ArchetypeCards key="pitch" />}
      </AnimatePresence>

      {phase === 'sculpt' && (
        <>
          <SculptControls />
          <AnimatePresence>
            {focused && <HighlightRail key="rail" />}
          </AnimatePresence>
          <TensionTimeline />
          {!focused && (
            <div className="phase-hint">
              Click a glowing region to drill down · long-press a pin for isochrone
            </div>
          )}
        </>
      )}
    </div>
  )
}
