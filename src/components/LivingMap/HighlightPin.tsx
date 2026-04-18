import { motion } from 'framer-motion'
import type { CuratedHighlight } from '../../types'
import { useTripStore } from '../../state/tripStore'

interface Props {
  highlight: CuratedHighlight
}

const glyphFor: Record<CuratedHighlight['category'], string> = {
  art_museum: '\u25CE', // bullseye
  monument: '\u25B2', // triangle
  viewpoint: '\u2756', // diamond
  wine: '\u273F', // floret
  coastal: '\u223F', // wave
  culinary: '\u2726', // asterisk
  nature: '\u2740', // leaf
  neighborhood: '\u25C9', // concentric
}

export function HighlightPin({ highlight }: Props) {
  const focused = useTripStore((s) => s.focusedRegionId)
  const toggleIsochrone = useTripStore((s) => s.toggleIsochrone)
  const isochroneNodeId = useTripStore((s) => s.isochroneNodeId)
  const isIsochrone = isochroneNodeId === highlight.node_id

  return (
    <motion.button
      className="highlight-pin"
      data-focused={focused === highlight.region_id}
      data-active={isIsochrone}
      onPointerDown={(e) => {
        // Long-press triggers isochrone blob (§4B).
        const start = performance.now()
        const el = e.currentTarget as HTMLButtonElement
        const timer = window.setTimeout(() => {
          toggleIsochrone(isIsochrone ? null : highlight.node_id)
        }, 450)
        const clear = () => {
          window.clearTimeout(timer)
          if (performance.now() - start < 450) {
            // Short click — just emit focus event (noop for now).
          }
          el.removeEventListener('pointerup', clear)
          el.removeEventListener('pointerleave', clear)
        }
        el.addEventListener('pointerup', clear)
        el.addEventListener('pointerleave', clear)
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 26 }}
      whileHover={{ scale: 1.12 }}
      whileTap={{ scale: 0.95 }}
    >
      <span className="highlight-pin__glyph">{glyphFor[highlight.category]}</span>
      <span className="highlight-pin__label">{highlight.title}</span>
      {highlight.ztl_warning && <span className="highlight-pin__ztl">ZTL</span>}
    </motion.button>
  )
}
