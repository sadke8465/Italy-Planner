import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useEffect, useRef } from 'react'
import type { VibeAxis } from '../../types'

interface Props {
  axis: { key: VibeAxis; leftLabel: string; rightLabel: string; description: string }
  value: number
  onChange: (v: number) => void
}

export function VibeSlider({ axis, value, onChange }: Props) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const x = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 320, damping: 34, mass: 0.6 })
  const pct = useTransform(sx, (v) => {
    const w = trackRef.current?.offsetWidth ?? 1
    return `${Math.max(0, Math.min(100, (v / w) * 100))}%`
  })

  // Sync motion value when external value changes.
  useEffect(() => {
    const w = trackRef.current?.offsetWidth ?? 0
    x.set(value * w)
  }, [value, x])

  function setFromClientX(clientX: number) {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect) return
    const t = (clientX - rect.left) / rect.width
    onChange(Math.max(0, Math.min(1, t)))
  }

  return (
    <div className="vibe-slider">
      <div className="vibe-slider__labels">
        <span>{axis.leftLabel}</span>
        <span>{axis.rightLabel}</span>
      </div>
      <div
        ref={trackRef}
        className="vibe-slider__track"
        onPointerDown={(e) => {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
          setFromClientX(e.clientX)
        }}
        onPointerMove={(e) => {
          if ((e.buttons & 1) === 0) return
          setFromClientX(e.clientX)
        }}
      >
        <motion.div className="vibe-slider__fill" style={{ width: pct }} />
        <motion.div
          className="vibe-slider__thumb"
          style={{ left: pct }}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.95 }}
        />
      </div>
      <p className="vibe-slider__desc">{axis.description}</p>
    </div>
  )
}
