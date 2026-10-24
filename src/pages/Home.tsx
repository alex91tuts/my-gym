import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ClipboardList, Plus, Zap } from 'lucide-react'
import { useStore } from '../lib/store'
import { Button, Card, Empty, IconButton, Input, PageHeader, Sheet } from '../components/ui'
import CoachCard from '../components/CoachCard'
import ImportCard from '../components/ImportCard'

function greeting() {
  const h = new Date().getHours()
  if (h < 11) return 'Bună dimineața'
  if (h < 18) return 'Salut'
  return 'Bună seara'
}

export default function Home() {
  const { programs, programExercises, exercises, coachNotes, saveProgram, startWorkout, active } = useStore()
  const nav = useNavigate()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')

  const unseen = coachNotes.find((n) => !n.seen_at)

  const create = async () => {
    if (!name.trim()) return
    const p = await saveProgram({ name })
    setCreating(false)
    setName('')
    nav(`/program/${p.id}?edit=1`)
  }

  return (
    <div>
      <PageHeader
        title="Antrenează"
        subtitle={greeting()}
        right={
          <IconButton onClick={() => setCreating(true)} aria-label="Program nou" className="bg-surface-2">
            <Plus size={22} />
          </IconButton>
        }
      />
      <div className="space-y-4 px-4">
        <ImportCard />
        {unseen && <CoachCard note={unseen} compact />}

        <div className="flex items-center justify-between px-1 pt-2">
          <h2 className="text-sm font-bold tracking-wider text-muted uppercase">Programele mele</h2>
        </div>

        {programs.length === 0 ? (
          <Empty
            icon={<ClipboardList size={28} />}
            title="Niciun program încă"
            text="Creează primul program (ex. Push, Pull, Legs) și adaugă exerciții."
            action={<Button onClick={() => setCreating(true)}>Creează program</Button>}
          />
        ) : (
          <div className="space-y-3">
            {programs.map((p) => {
              const items = programExercises.filter((x) => x.program_id === p.id)
              const names = items
                .map((i) => exercises.find((e) => e.id === i.exercise_id)?.name)
                .filter(Boolean)
                .slice(0, 3)
              const sets = items.reduce((n, i) => n + i.target_sets, 0)
              const hasAi = items.some((i) => i.ai_note)
              return (
                <Card key={p.id} onClick={() => nav(`/program/${p.id}`)}>
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-lg font-bold">{p.name}</h3>
                        {hasAi && <span className="size-2 shrink-0 rounded-full bg-ai" title="Ajustat de Claude" />}
                      </div>
                      <p className="text-sm text-muted">
                        {items.length} exerciții · {sets} seturi
                      </p>
                      {names.length > 0 && (
                        <p className="mt-1 truncate text-sm text-white/60">
                          {names.join(' · ')}
                          {items.length > 3 ? ' …' : ''}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="text-muted" />
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {!active && (
          <button
            onClick={() => {
              startWorkout(null)
              nav('/workout')
            }}
            className="flex w-full items-center justify-center gap-2 rounded-3xl border border-dashed border-line py-4 text-sm font-semibold text-muted active:bg-surface"
          >
            <Zap size={16} /> Antrenament liber, fără program
          </button>
        )}
      </div>

      <Sheet open={creating} onClose={() => setCreating(false)} title="Program nou">
        <div className="space-y-4">
          <Input
            label="Nume"
            placeholder="ex. Push A, Picioare, Full body"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && create()}
          />
          <Button className="w-full" onClick={create} disabled={!name.trim()}>
            Creează și adaugă exerciții
          </Button>
        </div>
      </Sheet>
    </div>
  )
}
