import { AnimatePresence } from 'framer-motion'
import { LivingMap } from './components/LivingMap/LivingMap'
import { SetupScreen } from './components/Setup/SetupScreen'
import { ExplorePanel } from './components/Explore/ExplorePanel'
import { DirectionsTimeline } from './components/Explore/DirectionsTimeline'
import { ExploreControls } from './components/Explore/ExploreControls'
import { useTripStore } from './state/tripStore'

export default function App() {
  const phase = useTripStore((s) => s.phase)

  return (
    <div className="app">
      <div className="app__brand">
        <span className="app__brand-mark">The Living Map</span>
        <span className="app__brand-tag">· Italy</span>
      </div>

      <LivingMap mode={phase} />

      <AnimatePresence mode="wait">
        {phase === 'setup' && <SetupScreen key="setup" />}
      </AnimatePresence>

      {phase === 'explore' && (
        <>
          <ExploreControls />
          <AnimatePresence mode="wait">
            <ExplorePanel key="explore-panel" />
          </AnimatePresence>
          <DirectionsTimeline />
        </>
      )}
    </div>
  )
}
