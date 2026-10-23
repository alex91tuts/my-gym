import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, ChevronRight, Sparkles } from 'lucide-react'
import { useStore } from '../lib/store'
import type { WorkoutWithSets } from '../lib/types'
import { fmtDate, fmtMinutes } from '../lib/format'
import { Card, Empty, PageHeader } from '../components/ui'

export function workoutStats(w: WorkoutWithSets) {
  const sets = w.workout_sets.filter((s) => s.completed)
  return {
    sets: sets.length,
    volume: sets.reduce((v, s) => v + Number(s.weight) * s.reps, 0),
    duration: new Date(w.finished_at).getTime() - new Date(w.started_at).getTime(),
    exercises: [...new Set(sets.map((s) => s.exercise_name))],
  }
}

function weekKey(iso: string) {
  const d = new Date(iso)
  const day = (d.getDay() + 6) % 7
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - day)
  return monday.toISOString().slice(0, 10)
}

export default function HistoryPage() {
  const { loadHistory, pendingCount } = useStore()
  const nav = useNavigate()
  const [list, setList] = useState<WorkoutWithSets[] | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    loadHistory()
      .then(setList)
      .catch((e) => setErr(e.message))
  }, [loadHistory])

  // grupare pe săptămâni
  const weeks: { key: string; items: WorkoutWithSets[] }[] = []
  for (const w of list ?? []) {
    const k = weekKey(w.finished_at)
    const g = weeks.find((x) => x.key === k)
    if (g) g.items.push(w)
    else weeks.push({ key: k, items: [w] })
  }

  return (
    <div>
      <PageHeader title="Istoric" subtitle={pendingCount ? `${pendingCount} antrenament(e) în așteptare pentru upload` : undefined} />
      <div className="px-4">
        {err && <p className="rounded-2xl bg-danger/10 p-3 text-sm text-danger">Nu am putut încărca istoricul: {err}</p>}
        {list && list.length === 0 && (
          <Empty icon={<CalendarDays size={28} />} title="Niciun antrenament încă" text="După primul Finish, antrenamentele apar aici." />
        )}
        {!list && !err && <p className="py-10 text-center text-muted">Se încarcă…</p>}
        <div className="space-y-6">
          {weeks.map((wk) => (
            <div key={wk.key}>
              <h2 className="mb-2 px-1 text-sm font-bold tracking-wider text-muted uppercase">
                Săptămâna din {fmtDate(wk.key)} · {wk.items.length} {wk.items.length === 1 ? "antrenament" : "antrenamente"}
              </h2>
              <div className="space-y-3">
                {wk.items.map((w) => {
                  const st = workoutStats(w)
                  return (
                    <Card key={w.id} onClick={() => nav(`/history/${w.id}`)}>
                      <div className="flex items-center gap-3">
                        <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-surface-2 text-center leading-none">
                          <div>
                            <div className="text-lg font-extrabold">{new Date(w.finished_at).getDate()}</div>
                            <div className="text-[10px] text-muted uppercase">
                              {new Date(w.finished_at).toLocaleDateString('ro-RO', { month: 'short' })}
                            </div>
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 font-bold">
                            <span className="truncate">{w.program_name}</span>
                            {w.analyzed_at && <Sparkles size={14} className="shrink-0 text-ai" />}
                          </div>
                          <div className="text-sm text-muted">
                            {fmtMinutes(st.duration)} · {st.sets} seturi · {Math.round(st.volume).toLocaleString('ro-RO')} kg
                          </div>
                        </div>
                        <ChevronRight className="text-muted" />
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
