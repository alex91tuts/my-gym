import { useNavigate } from 'react-router-dom'
import { Play } from 'lucide-react'
import { useNow, useStore } from '../lib/store'
import { fmtDuration } from '../lib/format'

// Bara care apare deasupra meniului când ai un antrenament în desfășurare
export default function ActiveBanner() {
  const { active } = useStore()
  const nav = useNavigate()
  const now = useNow()
  if (!active) return null
  const done = active.exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0)
  const total = active.exercises.reduce((n, e) => n + e.sets.length, 0)
  return (
    <button
      onClick={() => nav('/workout')}
      className="animate-fade fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-[calc(32rem-1.5rem)] items-center gap-3 rounded-2xl bg-accent px-4 py-3 text-left text-black shadow-2xl"
    >
      <div className="grid size-9 place-items-center rounded-full bg-black/15">
        <Play size={18} fill="currentColor" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-bold">{active.programName}</div>
        <div className="text-sm font-medium opacity-70">
          {done}/{total} seturi · {fmtDuration(now - new Date(active.startedAt).getTime())}
        </div>
      </div>
      <span className="text-sm font-bold">Continuă</span>
    </button>
  )
}
