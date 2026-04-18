import { AnimatePresence, motion } from 'framer-motion'
import { rankArchetypes } from '../../data/vibe'
import { regionsById } from '../../data/regions'
import { useTripStore } from '../../state/tripStore'

export function ArchetypeCards() {
  const vibe = useTripStore((s) => s.vibe)
  const selectArchetype = useTripStore((s) => s.selectArchetype)
  const setPhase = useTripStore((s) => s.setPhase)
  const ranked = rankArchetypes(vibe).slice(0, 3)

  return (
    <motion.aside
      className="panel panel--pitch"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ type: 'spring', stiffness: 120, damping: 22 }}
    >
      <header className="panel__header">
        <button className="panel__back" onClick={() => setPhase('vibe')}>
          ← Adjust vibe
        </button>
        <span className="panel__eyebrow">Step 02 · Archetype pitch</span>
        <h2 className="panel__title">Three shapes your trip could take.</h2>
        <p className="panel__subtitle">
          Pick one as a starting sculpture. You can still reshape everything.
        </p>
      </header>

      <AnimatePresence>
        <div className="archetype-cards">
          {ranked.map((a, i) => (
            <motion.button
              key={a.id}
              className="archetype-card"
              onClick={() => selectArchetype(a)}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 160, damping: 20 }}
              whileHover={{ y: -6 }}
              whileTap={{ scale: 0.98 }}
            >
              <div
                className="archetype-card__image"
                style={{ backgroundImage: `url(${a.hero_image})` }}
              />
              <div className="archetype-card__body">
                <span className="archetype-card__eyebrow">{a.duration_days} days</span>
                <h3>{a.title}</h3>
                <p className="archetype-card__subtitle">{a.subtitle}</p>
                <p className="archetype-card__desc">{a.description}</p>
                <div className="archetype-card__stops">
                  {a.stops.map((id, idx) => (
                    <span key={id} className="archetype-card__stop">
                      {regionsById[id]?.name}
                      {idx < a.stops.length - 1 && <span className="archetype-card__arrow">→</span>}
                    </span>
                  ))}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </AnimatePresence>
    </motion.aside>
  )
}
