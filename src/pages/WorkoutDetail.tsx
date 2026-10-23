import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { useStore } from '../lib/store'
import type { WorkoutSet, WorkoutWithSets } from '../lib/types'
import { fmtDateLong, fmtMinutes, fmtWeight } from '../lib/format'
import { Card, PageHeader } from '../components/ui'
import { workoutStats } from './History'

export default function WorkoutDetail() {
  const { id } = useParams()
  const { loadHistory } = useStore()
  const [w, setW] = useState<WorkoutWithSets | null | undefined>(undefined)

  useEffect(() => {
    loadHistory(200).then((list) => setW(list.find((x) => x.id === id) ?? null))
  }, [id, loadHistory])

  if (w === undefined) return <PageHeader title="Se încarcă…" back />
  if (w === null) return <PageHeader title="Nu există" back />

  const st = workoutStats(w)
  const groups: { name: string; sets: WorkoutSet[] }[] = []
  for (const s of w.workout_sets) {
    const g = groups.find((x) => x.name === s.exercise_name)
    if (g) g.sets.push(s)
    else groups.push({ name: s.exercise_name, sets: [s] })
  }

  return (
    <div>
      <PageHeader title={w.program_name} subtitle={fmtDateLong(w.finished_at)} back />
      <div className="space-y-3 px-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            ['Durată', fmtMinutes(st.duration)],
            ['Seturi', String(st.sets)],
            ['Volum', `${Math.round(st.volume).toLocaleString('ro-RO')} kg`],
          ].map(([l, v]) => (
            <div key={l} className="rounded-2xl bg-surface p-3">
              <div className="text-lg font-extrabold">{v}</div>
              <div className="text-xs text-muted">{l}</div>
            </div>
          ))}
        </div>
        {w.analyzed_at && (
          <p className="flex items-center gap-2 rounded-2xl bg-ai/10 p-3 text-sm text-ai">
            <Sparkles size={16} /> Analizat de Claude
          </p>
        )}
        {w.notes && <Card className="text-sm text-white/80">{w.notes}</Card>}
        {groups.map((g) => (
          <Card key={g.name}>
            <h3 className="mb-2 font-bold">{g.name}</h3>
            <div className="space-y-1">
              {g.sets.map((s) => {
                const hit = s.target_reps != null && s.reps >= s.target_reps && (s.target_weight == null || Number(s.weight) >= Number(s.target_weight))
                return (
                  <div key={s.id} className="flex items-center gap-3 text-sm">
                    <span className="w-6 text-muted">{s.set_index}</span>
                    <span className="flex-1 font-semibold">
                      {fmtWeight(s.weight)} kg × {s.reps}
                    </span>
                    {s.target_reps != null && (
                      <span className={hit ? 'text-accent' : 'text-muted'}>
                        țintă {fmtWeight(s.target_weight)}×{s.target_reps}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
