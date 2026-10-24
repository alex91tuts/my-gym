import { useMemo, useState } from 'react'
import { Check, Plus, Search } from 'lucide-react'
import { useLookups, useStore } from '../lib/store'
import { Button, Chip, Sheet, cx } from './ui'
import ExerciseForm from './ExerciseForm'
import { ExerciseInfoButton } from './Media'

export default function ExercisePicker({
  open,
  onClose,
  onPick,
  exclude = [],
}: {
  open: boolean
  onClose: () => void
  onPick: (exerciseId: string) => void
  exclude?: string[]
}) {
  const { exercises, muscleGroups } = useStore()
  const { group, equip } = useLookups()
  const [q, setQ] = useState('')
  const [g, setG] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return exercises.filter((e) => (!g || e.muscle_group_id === g) && (!s || e.name.toLowerCase().includes(s)))
  }, [exercises, q, g])

  return (
    <>
      <Sheet open={open && !creating} onClose={onClose} title="Alege exercițiu">
        <div className="relative mb-3">
          <Search className="absolute top-1/2 left-4 -translate-y-1/2 text-muted" size={18} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Caută…"
            className="h-12 w-full rounded-2xl bg-surface-2 pr-4 pl-11 outline-none placeholder:text-white/30"
          />
        </div>
        <div className="no-scrollbar -mx-5 mb-3 flex gap-2 overflow-x-auto px-5">
          <Chip active={!g} onClick={() => setG(null)}>
            Toate
          </Chip>
          {muscleGroups.map((m) => (
            <Chip key={m.id} active={g === m.id} onClick={() => setG(m.id)}>
              {m.name}
            </Chip>
          ))}
        </div>
        <div className="divide-y divide-line/50">
          {list.map((e) => {
            const used = exclude.includes(e.id)
            return (
              <div key={e.id} className="flex items-center gap-3">
                <ExerciseInfoButton exerciseId={e.id} size="sm" />
                <button
                  onClick={() => {
                    onPick(e.id)
                    onClose()
                  }}
                  className="flex min-w-0 flex-1 items-center gap-3 py-3 text-left active:opacity-60"
                >
                  <div className="min-w-0 flex-1">
                    <div className={cx('font-semibold', used && 'text-muted')}>{e.name}</div>
                    <div className="text-sm text-muted">
                      {[e.muscle_group_id && group[e.muscle_group_id]?.name, e.equipment_id && equip[e.equipment_id]?.name]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </div>
                  </div>
                  {used ? <Check size={18} className="text-muted" /> : <Plus size={20} className="text-accent" />}
                </button>
              </div>
            )
          })}
          {list.length === 0 && <p className="py-6 text-center text-muted">Nimic găsit.</p>}
        </div>
        <Button variant="secondary" className="mt-4 w-full" onClick={() => setCreating(true)}>
          <Plus size={18} /> Exercițiu nou{q.trim() ? `: „${q.trim()}”` : ''}
        </Button>
      </Sheet>
      <ExerciseForm
        open={open && creating}
        initialName={q.trim()}
        initialGroup={g}
        onClose={() => setCreating(false)}
        onSaved={(ex) => {
          setCreating(false)
          onPick(ex.id)
          onClose()
        }}
      />
    </>
  )
}
