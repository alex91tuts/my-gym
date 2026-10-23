import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Pencil, Trash2 } from 'lucide-react'
import { useLookups, useStore } from '../lib/store'
import type { WorkoutSet } from '../lib/types'
import { est1RM, fmtDate, fmtWeight } from '../lib/format'
import { Card, Confirm, IconButton, PageHeader, cx } from '../components/ui'
import ExerciseForm from '../components/ExerciseForm'

type Hist = { date: string; sets: WorkoutSet[] }[]
type Metric = 'weight' | 'e1rm' | 'volume'

export default function ExercisePage() {
  const { id } = useParams()
  const nav = useNavigate()
  const { loadExerciseHistory, deleteExercise } = useStore()
  const { exercise, group, equip } = useLookups()
  const ex = id ? exercise[id] : undefined
  const [hist, setHist] = useState<Hist | null>(null)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [metric, setMetric] = useState<Metric>('weight')

  useEffect(() => {
    if (id) loadExerciseHistory(id).then(setHist).catch(() => setHist([]))
  }, [id, loadExerciseHistory])

  if (!ex) return <PageHeader title="Exercițiu inexistent" back />

  const points = (hist ?? []).map((h) => ({
    date: h.date,
    weight: Math.max(0, ...h.sets.map((s) => Number(s.weight))),
    e1rm: Math.max(0, ...h.sets.map((s) => est1RM(Number(s.weight), s.reps))),
    volume: h.sets.reduce((v, s) => v + Number(s.weight) * s.reps, 0),
  }))
  const best = points.length ? Math.max(...points.map((p) => p.weight)) : 0
  const best1rm = points.length ? Math.max(...points.map((p) => p.e1rm)) : 0

  return (
    <div>
      <PageHeader
        title={ex.name}
        subtitle={[ex.muscle_group_id && group[ex.muscle_group_id]?.name, ex.equipment_id && equip[ex.equipment_id]?.name].filter(Boolean).join(' · ')}
        back
        right={
          <div className="flex">
            <IconButton onClick={() => setEditing(true)} aria-label="Editează">
              <Pencil size={20} />
            </IconButton>
            <IconButton onClick={() => setDeleting(true)} aria-label="Șterge" className="text-danger/80">
              <Trash2 size={20} />
            </IconButton>
          </div>
        }
      />
      <div className="space-y-3 px-4">
        {ex.notes && <Card className="text-sm text-white/80">{ex.notes}</Card>}
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            ['Record', best ? `${fmtWeight(best)} kg` : '–'],
            ['1RM estimat', best1rm ? `${fmtWeight(Math.round(best1rm * 2) / 2)} kg` : '–'],
            ['Sesiuni', String(points.length)],
          ].map(([l, v]) => (
            <div key={l} className="rounded-2xl bg-surface p-3">
              <div className="text-lg font-extrabold">{v}</div>
              <div className="text-xs text-muted">{l}</div>
            </div>
          ))}
        </div>

        <Card>
          <div className="mb-3 flex gap-1 rounded-xl bg-surface-2 p-1">
            {(
              [
                ['weight', 'Greutate max'],
                ['e1rm', '1RM est.'],
                ['volume', 'Volum'],
              ] as [Metric, string][]
            ).map(([m, l]) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={cx('h-8 flex-1 rounded-lg text-xs font-semibold', metric === m ? 'bg-surface text-white' : 'text-muted')}
              >
                {l}
              </button>
            ))}
          </div>
          {points.length >= 2 ? (
            <LineChart data={points.map((p) => ({ x: p.date, y: p[metric] }))} />
          ) : (
            <p className="py-8 text-center text-sm text-muted">
              {hist === null ? 'Se încarcă…' : 'Graficul apare după cel puțin 2 sesiuni.'}
            </p>
          )}
        </Card>

        {[...(hist ?? [])].reverse().map((h) => (
          <Card key={h.date}>
            <div className="mb-1 text-sm font-semibold text-muted">{fmtDate(h.date)}</div>
            <div className="flex flex-wrap gap-1.5">
              {h.sets.map((s) => (
                <span key={s.id} className="rounded-lg bg-surface-2 px-2 py-1 text-sm font-semibold">
                  {fmtWeight(s.weight)}×{s.reps}
                </span>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <ExerciseForm open={editing} onClose={() => setEditing(false)} exercise={ex} />
      <Confirm
        open={deleting}
        onClose={() => setDeleting(false)}
        title={`Ștergi „${ex.name}”?`}
        message="Va fi scos și din programe. Istoricul antrenamentelor rămâne."
        onConfirm={async () => {
          await deleteExercise(ex.id)
          nav(-1)
        }}
      />
    </div>
  )
}

function LineChart({ data }: { data: { x: string; y: number }[] }) {
  const W = 320
  const H = 150
  const P = { l: 34, r: 10, t: 10, b: 22 }
  const ys = data.map((d) => d.y)
  let min = Math.min(...ys)
  let max = Math.max(...ys)
  if (min === max) {
    min -= 1
    max += 1
  }
  const pad = (max - min) * 0.1
  min -= pad
  max += pad
  const x = (i: number) => P.l + (i / (data.length - 1)) * (W - P.l - P.r)
  const y = (v: number) => P.t + (1 - (v - min) / (max - min)) * (H - P.t - P.b)
  const path = data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.y).toFixed(1)}`).join(' ')
  const area = `${path} L${x(data.length - 1)},${H - P.b} L${x(0)},${H - P.b} Z`
  const ticks = [min + pad, (min + max) / 2, max - pad]
  const last = data[data.length - 1]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <defs>
        <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a3e635" stopOpacity="0.35" />
          <stop offset="1" stopColor="#a3e635" stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} stroke="#2a2a35" strokeDasharray="3 4" />
          <text x={P.l - 6} y={y(t) + 4} fontSize="10" fill="#8b8b9a" textAnchor="end">
            {Math.round(t)}
          </text>
        </g>
      ))}
      <path d={area} fill="url(#area)" />
      <path d={path} fill="none" stroke="#a3e635" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <circle key={i} cx={x(i)} cy={y(d.y)} r={i === data.length - 1 ? 4.5 : 2.5} fill={i === data.length - 1 ? '#a3e635' : '#15151c'} stroke="#a3e635" strokeWidth="2" />
      ))}
      <text x={P.l} y={H - 4} fontSize="10" fill="#8b8b9a">
        {fmtDate(data[0].x)}
      </text>
      <text x={W - P.r} y={H - 4} fontSize="10" fill="#8b8b9a" textAnchor="end">
        {fmtDate(last.x)}
      </text>
    </svg>
  )
}
