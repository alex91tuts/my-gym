import { Sparkles } from 'lucide-react'
import type { CoachNote } from '../lib/types'
import { relativeDay } from '../lib/format'
import { useStore } from '../lib/store'

export default function CoachCard({ note, compact }: { note: CoachNote; compact?: boolean }) {
  const { markNoteSeen } = useStore()
  const changes = Array.isArray(note.changes) ? note.changes : []
  return (
    <div className="relative overflow-hidden rounded-3xl border border-ai/30 bg-gradient-to-br from-ai/15 via-surface to-surface p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-ai">
        <Sparkles size={16} />
        Coach Claude · {relativeDay(note.created_at)}
        {!note.seen_at && <span className="ml-auto rounded-full bg-ai px-2 py-0.5 text-[10px] font-bold text-black">NOU</span>}
      </div>
      <p className="whitespace-pre-line text-[15px] leading-relaxed text-white/90">{note.summary}</p>
      {!compact && changes.length > 0 && (
        <ul className="mt-3 space-y-2">
          {changes.map((c, i) => (
            <li key={i} className="rounded-2xl bg-black/25 px-3 py-2 text-sm">
              <div className="font-semibold">
                {c.exercise}
                {c.field && (
                  <span className="ml-1 font-normal text-muted">
                    · {c.field}: {String(c.from ?? '–')} → <span className="font-bold text-accent">{String(c.to ?? '–')}</span>
                  </span>
                )}
              </div>
              {c.reason && <div className="mt-0.5 text-muted">{c.reason}</div>}
            </li>
          ))}
        </ul>
      )}
      {!note.seen_at && (
        <button onClick={() => markNoteSeen(note.id)} className="mt-3 text-sm font-semibold text-ai">
          Am înțeles
        </button>
      )}
    </div>
  )
}
