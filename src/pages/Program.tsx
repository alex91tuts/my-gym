import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowDown, ArrowUp, Check, MoreHorizontal, Pencil, Play, Plus, Sparkles, Timer, Trash2 } from 'lucide-react'
import { useLookups, useStore } from '../lib/store'
import { fmtWeight } from '../lib/format'
import { Button, Card, Confirm, Empty, IconButton, Input, PageHeader, Sheet, Stepper } from '../components/ui'
import ExercisePicker from '../components/ExercisePicker'
import CoachCard from '../components/CoachCard'
import { ExerciseInfoButton } from '../components/Media'
import type { ProgramExercise } from '../lib/types'

export default function ProgramPage() {
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const nav = useNavigate()
  const store = useStore()
  const { exercise, group, equip } = useLookups()
  const program = store.programs.find((p) => p.id === id)
  const items = store.programExercises.filter((p) => p.program_id === id)
  const edit = params.get('edit') === '1'
  const [picking, setPicking] = useState(false)
  const [menu, setMenu] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [confirmStart, setConfirmStart] = useState(false)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')

  if (!program) return <PageHeader title="Program inexistent" back />

  const note = store.coachNotes.find((n) => n.program_id === program.id)
  const setEdit = (v: boolean) => setParams(v ? { edit: '1' } : {}, { replace: true })

  const start = () => {
    if (store.active && !confirmStart) return setConfirmStart(true)
    store.startWorkout(program.id)
    nav('/workout')
  }

  return (
    <div>
      <PageHeader
        title={program.name}
        subtitle={program.description ?? `${items.length} exerciții`}
        back
        right={
          edit ? (
            <Button size="sm" onClick={() => setEdit(false)}>
              <Check size={16} /> Gata
            </Button>
          ) : (
            <div className="flex">
              <IconButton onClick={() => setEdit(true)} aria-label="Editează">
                <Pencil size={20} />
              </IconButton>
              <IconButton onClick={() => setMenu(true)} aria-label="Mai mult">
                <MoreHorizontal size={22} />
              </IconButton>
            </div>
          )
        }
      />

      <div className="space-y-3 px-4">
        {!edit && note && <CoachCard note={note} />}

        {items.length === 0 && (
          <Empty
            icon={<Plus size={28} />}
            title="Program gol"
            text="Adaugă exercițiile și setează ținta: seturi, repetări, greutate."
            action={<Button onClick={() => setPicking(true)}>Adaugă exerciții</Button>}
          />
        )}

        {items.map((pe, i) => {
          const ex = exercise[pe.exercise_id]
          const meta = [ex?.muscle_group_id && group[ex.muscle_group_id]?.name, ex?.equipment_id && equip[ex.equipment_id]?.name]
            .filter(Boolean)
            .join(' · ')
          return edit ? (
            <EditRow key={pe.id} pe={pe} name={ex?.name ?? '?'} first={i === 0} last={i === items.length - 1} />
          ) : (
            <Card key={pe.id} onClick={() => nav(`/exercise/${pe.exercise_id}`)}>
              <div className="flex items-start gap-3">
                <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-surface-2 text-sm font-bold text-muted">{i + 1}</div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold">{ex?.name ?? 'Exercițiu șters'}</div>
                  {meta && <div className="text-sm text-muted">{meta}</div>}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                    <span className="rounded-lg bg-accent/15 px-2 py-1 font-bold text-accent">
                      {pe.target_sets} × {pe.target_reps}
                      {pe.target_weight > 0 && ` · ${fmtWeight(pe.target_weight)} kg`}
                    </span>
                    <span className="flex items-center gap-1 text-muted">
                      <Timer size={14} /> {pe.rest_seconds}s
                    </span>
                  </div>
                  {pe.notes && <p className="mt-2 text-sm text-white/60">{pe.notes}</p>}
                  {pe.ai_note && (
                    <p className="mt-2 flex gap-1.5 rounded-xl bg-ai/10 p-2 text-sm text-ai">
                      <Sparkles size={14} className="mt-0.5 shrink-0" /> {pe.ai_note}
                    </p>
                  )}
                </div>
                <ExerciseInfoButton exerciseId={pe.exercise_id} />
              </div>
            </Card>
          )
        })}

        {edit && (
          <Button variant="secondary" className="w-full" onClick={() => setPicking(true)}>
            <Plus size={18} /> Adaugă exercițiu
          </Button>
        )}
      </div>

      {!edit && items.length > 0 && (
        <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 mx-auto max-w-lg bg-gradient-to-t from-bg via-bg/90 to-transparent px-4 pt-6 pb-3">
          <Button size="lg" className="w-full" onClick={start}>
            <Play size={20} fill="currentColor" /> Start antrenament
          </Button>
        </div>
      )}
      {!edit && items.length > 0 && <div className="h-24" />}

      <ExercisePicker
        open={picking}
        onClose={() => setPicking(false)}
        exclude={items.map((i) => i.exercise_id)}
        onPick={(exId) => store.addProgramExercise(program.id, exId)}
      />

      <Sheet open={menu} onClose={() => setMenu(false)} title={program.name}>
        <div className="space-y-2">
          <Button
            variant="secondary"
            className="w-full justify-start"
            onClick={() => {
              setName(program.name)
              setDesc(program.description ?? '')
              setMenu(false)
              setRenaming(true)
            }}
          >
            <Pencil size={18} /> Redenumește
          </Button>
          <Button
            variant="danger"
            className="w-full justify-start"
            onClick={() => {
              setMenu(false)
              setConfirmDel(true)
            }}
          >
            <Trash2 size={18} /> Șterge programul
          </Button>
        </div>
      </Sheet>

      <Sheet open={renaming} onClose={() => setRenaming(false)} title="Editează program">
        <div className="space-y-4">
          <Input label="Nume" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Descriere (opțional)" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="ex. Luni și joi" />
          <Button
            className="w-full"
            disabled={!name.trim()}
            onClick={async () => {
              await store.saveProgram({ id: program.id, name, description: desc.trim() || null })
              setRenaming(false)
            }}
          >
            Salvează
          </Button>
        </div>
      </Sheet>

      <Confirm
        open={confirmDel}
        onClose={() => setConfirmDel(false)}
        title="Ștergi programul?"
        message="Istoricul antrenamentelor rămâne. Doar programul dispare."
        onConfirm={async () => {
          await store.deleteProgram(program.id)
          nav('/', { replace: true })
        }}
      />

      <Confirm
        open={confirmStart}
        onClose={() => setConfirmStart(false)}
        title="Ai deja un antrenament activ"
        message={`„${store.active?.programName}” e în desfășurare. Dacă începi altul, cel curent se pierde.`}
        confirmLabel="Începe altul"
        onConfirm={() => {
          store.startWorkout(program.id)
          nav('/workout')
        }}
      />
    </div>
  )
}

function EditRow({ pe, name, first, last }: { pe: ProgramExercise; name: string; first: boolean; last: boolean }) {
  const { updateProgramExercise, deleteProgramExercise, moveProgramExercise } = useStore()
  const up = (patch: Partial<ProgramExercise>) => updateProgramExercise(pe.id, patch)
  return (
    <Card>
      <div className="mb-3 flex items-center gap-1">
        <div className="min-w-0 flex-1 truncate font-bold">{name}</div>
        <IconButton disabled={first} onClick={() => moveProgramExercise(pe.id, -1)} aria-label="Sus">
          <ArrowUp size={18} />
        </IconButton>
        <IconButton disabled={last} onClick={() => moveProgramExercise(pe.id, 1)} aria-label="Jos">
          <ArrowDown size={18} />
        </IconButton>
        <IconButton onClick={() => deleteProgramExercise(pe.id)} aria-label="Elimină" className="text-danger">
          <Trash2 size={18} />
        </IconButton>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Stepper label="Seturi" value={pe.target_sets} min={1} onChange={(v) => up({ target_sets: v })} />
        <Stepper label="Repetări" value={pe.target_reps} min={1} onChange={(v) => up({ target_reps: v })} />
        <Stepper label="Greutate (kg)" value={pe.target_weight} step={2.5} onChange={(v) => up({ target_weight: v })} />
        <Stepper label="Pauză (sec)" value={pe.rest_seconds} step={15} onChange={(v) => up({ rest_seconds: v })} />
      </div>
      <input
        defaultValue={pe.notes ?? ''}
        onBlur={(e) => e.target.value !== (pe.notes ?? '') && up({ notes: e.target.value.trim() || null })}
        placeholder="Notițe (opțional)"
        className="mt-2 h-11 w-full rounded-2xl bg-surface-2 px-4 text-sm outline-none placeholder:text-white/30"
      />
    </Card>
  )
}
