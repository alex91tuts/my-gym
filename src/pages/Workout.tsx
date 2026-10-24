import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronDown, CloudOff, CloudUpload, MoreHorizontal, Plus, Sparkles, Trash2, Trophy } from 'lucide-react'
import { useNow, useStore } from '../lib/store'
import { fmtDuration, fmtMinutes, fmtWeight, parseNum, relativeDay } from '../lib/format'
import { load, save } from '../lib/storage'
import type { ActiveExercise, ActiveSet } from '../lib/types'
import { Button, Confirm, IconButton, Sheet, cx } from '../components/ui'
import ExercisePicker from '../components/ExercisePicker'
import { ExerciseInfoButton } from '../components/Media'
import RestTimer, { primeAudio, type RestState } from '../components/RestTimer'

const REST_KEY = 'rest-timer'

function useWakeLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    const req = async () => {
      try {
        lock = await navigator.wakeLock.request('screen')
      } catch {
        /* ignore */
      }
    }
    req()
    const onVis = () => document.visibilityState === 'visible' && req()
    document.addEventListener('visibilitychange', onVis)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      lock?.release().catch(() => {})
    }
  }, [enabled])
}

interface Summary {
  name: string
  duration: number
  sets: number
  volume: number
  uploaded: boolean | null // null = se trimite
}

export default function WorkoutPage() {
  const { active, setActive, finishWorkout, lastPerf, programExercises, exercises } = useStore()
  const nav = useNavigate()
  const now = useNow()
  const [rest, setRestState] = useState<RestState | null>(() => load(REST_KEY, null))
  const [picking, setPicking] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [discard, setDiscard] = useState(false)
  const [menuFor, setMenuFor] = useState<string | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [busy, setBusy] = useState(false)

  useWakeLock(Boolean(active))

  const setRest = useCallback((r: RestState | null) => {
    setRestState(r)
    save(REST_KEY, r)
  }, [])

  if (summary) return <Done summary={summary} onClose={() => nav('/', { replace: true })} />

  if (!active) {
    return (
      <div className="grid h-dvh place-items-center p-8 text-center">
        <div>
          <p className="mb-4 text-muted">Niciun antrenament activ.</p>
          <Button onClick={() => nav('/', { replace: true })}>Înapoi</Button>
        </div>
      </div>
    )
  }

  const updateEx = (key: string, fn: (e: ActiveExercise) => ActiveExercise) =>
    setActive((w) => (w ? { ...w, exercises: w.exercises.map((e) => (e.key === key ? fn(e) : e)) } : w))

  const updateSet = (key: string, idx: number, patch: Partial<ActiveSet>) =>
    updateEx(key, (e) => {
      const sets = e.sets.map((s) => ({ ...s }))
      const old = sets[idx]
      // Dacă schimbi greutatea/repetările, seturile următoare nefăcute cu aceeași valoare se actualizează și ele
      for (const field of ['weight', 'reps'] as const) {
        if (patch[field] === undefined) continue
        for (let j = idx + 1; j < sets.length; j++) {
          if (!sets[j].done && sets[j][field] === old[field]) sets[j][field] = patch[field]!
        }
      }
      sets[idx] = { ...old, ...patch }
      return { ...e, sets }
    })

  const toggleDone = (ex: ActiveExercise, idx: number) => {
    primeAudio()
    const s = ex.sets[idx]
    const nowDone = !s.done
    updateSet(ex.key, idx, { done: nowDone })
    if (nowDone) {
      navigator.vibrate?.(30)
      if (ex.restSeconds > 0) setRest({ endAt: Date.now() + ex.restSeconds * 1000, total: ex.restSeconds })
    }
  }

  const all = active.exercises.flatMap((e) => e.sets)
  const doneSets = all.filter((s) => s.done)
  const volume = doneSets.reduce((v, s) => v + (parseNum(s.weight) || 0) * (parseNum(s.reps) || 0), 0)
  const elapsed = now - new Date(active.startedAt).getTime()

  const doFinish = async () => {
    setBusy(true)
    setRest(null)
    setFinishing(false)
    setSummary({ name: active.programName, duration: elapsed, sets: doneSets.length, volume, uploaded: null })
    const res = await finishWorkout()
    setBusy(false)
    setSummary((s) => (s ? { ...s, uploaded: res.uploaded } : s))
  }

  return (
    <div className="min-h-dvh pb-40">
      <header className="pt-safe sticky top-0 z-30 border-b border-line/50 bg-bg/90 backdrop-blur-xl">
        <div className="flex h-16 items-center gap-2 px-3">
          <IconButton onClick={() => nav('/')} aria-label="Minimizează">
            <ChevronDown size={26} />
          </IconButton>
          <div className="min-w-0 flex-1">
            <div className="truncate font-bold">{active.programName}</div>
            <div className="text-sm text-accent tabular-nums">{fmtDuration(elapsed)}</div>
          </div>
          <Button size="sm" onClick={() => setFinishing(true)}>
            Finish
          </Button>
        </div>
        <div className="h-1 bg-surface-2">
          <div className="h-full bg-accent transition-all" style={{ width: `${all.length ? (doneSets.length / all.length) * 100 : 0}%` }} />
        </div>
      </header>

      <div className="space-y-4 px-3 pt-4">
        {active.exercises.map((ex) => {
          const last = lastPerf[ex.exerciseId]
          const pe = programExercises.find((p) => p.program_id === active.programId && p.exercise_id === ex.exerciseId)
          const exDone = ex.sets.length > 0 && ex.sets.every((s) => s.done)
          return (
            <section key={ex.key} className={cx('rounded-3xl border bg-surface p-3 transition', exDone ? 'border-accent/40' : 'border-line/60')}>
              <div className="mb-2 flex items-start gap-2 px-1">
                <div className="min-w-0 flex-1">
                  <h3 className="flex items-center gap-2 text-lg font-bold">
                    {ex.name}
                    {exDone && <Check size={18} className="text-accent" />}
                  </h3>
                  {last ? (
                    <p className="text-xs text-muted">
                      Ultima dată ({relativeDay(last.date)}): {last.sets.map((s) => `${fmtWeight(s.weight)}×${s.reps}`).join(', ')}
                    </p>
                  ) : (
                    <p className="text-xs text-muted">Prima dată 💪</p>
                  )}
                  {pe?.ai_note && (
                    <p className="mt-1 flex gap-1 text-xs text-ai">
                      <Sparkles size={12} className="mt-0.5 shrink-0" /> {pe.ai_note}
                    </p>
                  )}
                </div>
                <ExerciseInfoButton exerciseId={ex.exerciseId} size="sm" />
                <IconButton onClick={() => setMenuFor(ex.key)} aria-label="Opțiuni">
                  <MoreHorizontal size={20} />
                </IconButton>
              </div>

              <div className="grid grid-cols-[2rem_1fr_1fr_1fr_3rem] items-center gap-2 px-1 pb-1 text-[11px] font-semibold tracking-wider text-muted uppercase">
                <span className="text-center">Set</span>
                <span className="text-center">Anterior</span>
                <span className="text-center">kg</span>
                <span className="text-center">Rep</span>
                <span />
              </div>
              <div className="space-y-1.5">
                {ex.sets.map((s, i) => {
                  const prev = last?.sets[i]
                  return (
                    <div
                      key={i}
                      className={cx(
                        'grid grid-cols-[2rem_1fr_1fr_1fr_3rem] items-center gap-2 rounded-2xl px-1 py-1 transition',
                        s.done && 'bg-accent/10',
                      )}
                    >
                      <span className={cx('text-center font-bold', s.done ? 'text-accent' : 'text-muted')}>{i + 1}</span>
                      <span className="truncate text-center text-sm text-muted">{prev ? `${fmtWeight(prev.weight)}×${prev.reps}` : '—'}</span>
                      <NumCell value={s.weight} done={s.done} placeholder={s.targetWeight ? fmtWeight(s.targetWeight) : '0'} onChange={(v) => updateSet(ex.key, i, { weight: v })} />
                      <NumCell value={s.reps} done={s.done} placeholder={String(s.targetReps ?? '')} onChange={(v) => updateSet(ex.key, i, { reps: v })} integer />
                      <button
                        onClick={() => toggleDone(ex, i)}
                        aria-label={s.done ? 'Anulează set' : 'Set făcut'}
                        className={cx(
                          'grid h-11 w-12 place-items-center rounded-xl transition active:scale-90',
                          s.done ? 'animate-pop bg-accent text-black' : 'bg-surface-2 text-white/40',
                        )}
                      >
                        <Check size={22} strokeWidth={3} />
                      </button>
                    </div>
                  )
                })}
              </div>
              <button
                onClick={() =>
                  updateEx(ex.key, (e) => {
                    const lastSet = e.sets[e.sets.length - 1]
                    return {
                      ...e,
                      sets: [
                        ...e.sets,
                        {
                          weight: lastSet?.weight ?? '',
                          reps: lastSet?.reps ?? '',
                          done: false,
                          targetReps: lastSet?.targetReps ?? null,
                          targetWeight: lastSet?.targetWeight ?? null,
                        },
                      ],
                    }
                  })
                }
                className="mt-2 flex h-10 w-full items-center justify-center gap-1 rounded-2xl bg-surface-2 text-sm font-semibold text-white/70 active:bg-line"
              >
                <Plus size={16} /> Adaugă set
              </button>
            </section>
          )
        })}

        <Button variant="secondary" className="w-full" onClick={() => setPicking(true)}>
          <Plus size={18} /> Adaugă exercițiu
        </Button>

        <textarea
          value={active.notes}
          onChange={(e) => setActive((w) => (w ? { ...w, notes: e.target.value } : w))}
          placeholder="Notițe pentru Claude (cum te-ai simțit, dureri, somn…)"
          rows={3}
          className="w-full rounded-3xl border border-line/60 bg-surface p-4 text-sm outline-none placeholder:text-white/30 focus:border-accent"
        />

        <button onClick={() => setDiscard(true)} className="w-full py-3 text-sm font-semibold text-danger/80">
          Renunță la antrenament
        </button>
      </div>

      <RestTimer rest={rest} onChange={setRest} />

      <ExercisePicker
        open={picking}
        onClose={() => setPicking(false)}
        exclude={active.exercises.map((e) => e.exerciseId)}
        onPick={(exId) => {
          const pe = programExercises.find((p) => p.exercise_id === exId)
          const last = lastPerf[exId]
          setActive((w) =>
            w
              ? {
                  ...w,
                  exercises: [
                    ...w.exercises,
                    {
                      key: crypto.randomUUID(),
                      exerciseId: exId,
                      name: exercises.find((e) => e.id === exId)?.name ?? 'Exercițiu',
                      restSeconds: pe?.rest_seconds ?? 90,
                      sets: Array.from({ length: 3 }, (_, i) => ({
                        weight: last?.sets[i] ? String(last.sets[i].weight) : '',
                        reps: last?.sets[i] ? String(last.sets[i].reps) : '10',
                        done: false,
                        targetReps: null,
                        targetWeight: null,
                      })),
                    },
                  ],
                }
              : w,
          )
        }}
      />

      <Sheet open={Boolean(menuFor)} onClose={() => setMenuFor(null)} title="Exercițiu">
        <div className="space-y-2">
          <Button
            variant="secondary"
            className="w-full justify-start"
            onClick={() => {
              updateEx(menuFor!, (e) => ({ ...e, sets: e.sets.filter((s, i) => s.done || i < e.sets.length - 1) }))
              setMenuFor(null)
            }}
          >
            Elimină ultimul set
          </Button>
          <Button
            variant="danger"
            className="w-full justify-start"
            onClick={() => {
              setActive((w) => (w ? { ...w, exercises: w.exercises.filter((e) => e.key !== menuFor) } : w))
              setMenuFor(null)
            }}
          >
            <Trash2 size={18} /> Scoate exercițiul din antrenament
          </Button>
        </div>
      </Sheet>

      <Sheet open={finishing} onClose={() => setFinishing(false)} title="Termini antrenamentul?">
        <div className="mb-5 grid grid-cols-3 gap-2 text-center">
          <Stat label="Durată" value={fmtMinutes(elapsed)} />
          <Stat label="Seturi" value={`${doneSets.length}/${all.length}`} />
          <Stat label="Volum" value={`${Math.round(volume)} kg`} />
        </div>
        {doneSets.length < all.length && (
          <p className="mb-4 rounded-2xl bg-surface-2 p-3 text-sm text-muted">
            Ai {all.length - doneSets.length} seturi nebifate. Se salvează doar cele bifate.
          </p>
        )}
        <Button size="lg" className="w-full" onClick={doFinish} disabled={busy || doneSets.length === 0}>
          <CloudUpload size={20} /> Salvează și trimite
        </Button>
      </Sheet>

      <Confirm
        open={discard}
        onClose={() => setDiscard(false)}
        title="Renunți la antrenament?"
        message="Nimic din antrenamentul ăsta nu se salvează."
        confirmLabel="Renunță"
        onConfirm={() => {
          setActive(null)
          setRest(null)
          nav('/', { replace: true })
        }}
      />
    </div>
  )
}

function NumCell({
  value,
  onChange,
  done,
  placeholder,
  integer,
}: {
  value: string
  onChange: (v: string) => void
  done: boolean
  placeholder?: string
  integer?: boolean
}) {
  return (
    <input
      inputMode={integer ? 'numeric' : 'decimal'}
      value={value}
      placeholder={placeholder}
      onFocus={(e) => e.target.select()}
      onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ''))}
      className={cx(
        'h-11 w-full min-w-0 rounded-xl text-center text-lg font-bold tabular-nums outline-none placeholder:text-white/25 focus:ring-2 focus:ring-accent',
        done ? 'bg-transparent text-white' : 'bg-surface-2',
      )}
    />
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface-2 p-3">
      <div className="text-lg font-extrabold">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  )
}

function Done({ summary, onClose }: { summary: Summary; onClose: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <div className="animate-pop mb-6 grid size-24 place-items-center rounded-[32px] bg-gradient-to-br from-accent to-accent-2 text-black shadow-[0_20px_60px_-15px_rgba(163,230,53,0.6)]">
        <Trophy size={44} />
      </div>
      <h1 className="text-3xl font-extrabold">Bravo!</h1>
      <p className="mt-1 text-muted">{summary.name} e gata.</p>
      <div className="my-8 grid w-full max-w-sm grid-cols-3 gap-2">
        <Stat label="Durată" value={fmtMinutes(summary.duration)} />
        <Stat label="Seturi" value={String(summary.sets)} />
        <Stat label="Volum" value={`${Math.round(summary.volume)} kg`} />
      </div>
      <p className={cx('mb-8 flex items-center gap-2 text-sm', summary.uploaded ? 'text-accent' : 'text-muted')}>
        {summary.uploaded === false ? <CloudOff size={16} /> : <CloudUpload size={16} className={cx(summary.uploaded === null && 'animate-pulse')} />}
        {summary.uploaded === null
          ? 'Se trimite…'
          : summary.uploaded
            ? 'Trimis. Claude îl poate analiza.'
            : 'Salvat pe telefon. Se trimite automat când ai net.'}
      </p>
      <Button size="lg" className="w-full max-w-sm" onClick={onClose}>
        Gata
      </Button>
    </div>
  )
}
