import { useEffect, useRef } from 'react'
import { Minus, Plus, X } from 'lucide-react'
import { useNow } from '../lib/store'
import { fmtDuration } from '../lib/format'

export interface RestState {
  endAt: number
  total: number
}

let audioCtx: AudioContext | null = null
export function primeAudio() {
  try {
    audioCtx ??= new AudioContext()
    if (audioCtx.state === 'suspended') audioCtx.resume()
  } catch {
    /* ignore */
  }
}

function beep() {
  try {
    if (!audioCtx) return
    const t = audioCtx.currentTime
    ;[0, 0.22, 0.44].forEach((d, i) => {
      const o = audioCtx!.createOscillator()
      const g = audioCtx!.createGain()
      o.frequency.value = i === 2 ? 1320 : 880
      g.gain.setValueAtTime(0.0001, t + d)
      g.gain.exponentialRampToValueAtTime(0.35, t + d + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.18)
      o.connect(g).connect(audioCtx!.destination)
      o.start(t + d)
      o.stop(t + d + 0.2)
    })
  } catch {
    /* ignore */
  }
}

export default function RestTimer({ rest, onChange }: { rest: RestState | null; onChange: (r: RestState | null) => void }) {
  const now = useNow(250)
  const fired = useRef<number | null>(null)
  const left = rest ? rest.endAt - now : 0

  useEffect(() => {
    if (!rest || left > 0 || fired.current === rest.endAt) return
    fired.current = rest.endAt
    beep()
    navigator.vibrate?.([300, 120, 300, 120, 500])
    const t = setTimeout(() => onChange(null), 2500)
    return () => clearTimeout(t)
  }, [rest, left, onChange])

  if (!rest) return null
  const done = left <= 0
  const pct = Math.min(1, Math.max(0, 1 - left / (rest.total * 1000)))

  return (
    <div className="pb-safe fixed inset-x-0 bottom-0 z-40 mx-auto max-w-lg px-3 pb-3">
      <div className={`animate-sheet overflow-hidden rounded-3xl border shadow-2xl ${done ? 'border-accent bg-accent text-black' : 'border-line bg-surface-2'}`}>
        {!done && (
          <div className="h-1 bg-white/10">
            <div className="h-full bg-accent transition-[width] duration-300" style={{ width: `${pct * 100}%` }} />
          </div>
        )}
        <div className="flex items-center gap-2 p-3">
          <button
            className="grid size-11 place-items-center rounded-2xl bg-black/20 active:scale-90"
            onClick={() => onChange({ ...rest, endAt: rest.endAt - 15000 })}
            aria-label="-15 secunde"
          >
            <Minus size={18} />
          </button>
          <div className="flex-1 text-center">
            <div className="text-xs font-semibold opacity-60">{done ? 'GATA!' : 'PAUZĂ'}</div>
            <div className="text-3xl font-extrabold tabular-nums">{done ? 'Următorul set' : fmtDuration(left)}</div>
          </div>
          <button
            className="grid size-11 place-items-center rounded-2xl bg-black/20 active:scale-90"
            onClick={() => onChange({ endAt: rest.endAt + 15000, total: rest.total + 15 })}
            aria-label="+15 secunde"
          >
            <Plus size={18} />
          </button>
          <button className="grid size-11 place-items-center rounded-2xl bg-black/20 active:scale-90" onClick={() => onChange(null)} aria-label="Sari peste">
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
