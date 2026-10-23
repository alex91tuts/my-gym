import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { backend } from './backend'
import { load, save } from './storage'
import { seedIfEmpty } from './seed'
import type {
  ActiveWorkout,
  CoachNote,
  Equipment,
  Exercise,
  MuscleGroup,
  Program,
  ProgramExercise,
  WorkoutSet,
  WorkoutWithSets,
} from './types'
import { parseNum } from './format'

interface Library {
  muscleGroups: MuscleGroup[]
  equipment: Equipment[]
  exercises: Exercise[]
  programs: Program[]
  programExercises: ProgramExercise[]
  coachNotes: CoachNote[]
}

const EMPTY: Library = { muscleGroups: [], equipment: [], exercises: [], programs: [], programExercises: [], coachNotes: [] }

export interface LastPerf {
  date: string
  sets: { weight: number; reps: number }[]
}

interface Store extends Library {
  ready: boolean
  syncing: boolean
  error: string | null
  refresh: () => Promise<void>
  // CRUD generic pe bibliotecă
  addMuscleGroup: (name: string) => Promise<MuscleGroup>
  renameMuscleGroup: (id: string, name: string) => Promise<void>
  deleteMuscleGroup: (id: string) => Promise<void>
  addEquipment: (name: string) => Promise<Equipment>
  renameEquipment: (id: string, name: string) => Promise<void>
  deleteEquipment: (id: string) => Promise<void>
  saveExercise: (ex: Partial<Exercise> & { name: string }) => Promise<Exercise>
  deleteExercise: (id: string) => Promise<void>
  saveProgram: (p: Partial<Program> & { name: string }) => Promise<Program>
  deleteProgram: (id: string) => Promise<void>
  addProgramExercise: (programId: string, exerciseId: string) => Promise<void>
  updateProgramExercise: (id: string, patch: Partial<ProgramExercise>) => Promise<void>
  deleteProgramExercise: (id: string) => Promise<void>
  moveProgramExercise: (id: string, dir: -1 | 1) => Promise<void>
  markNoteSeen: (id: string) => Promise<void>
  // Antrenament
  active: ActiveWorkout | null
  setActive: (w: ActiveWorkout | null | ((w: ActiveWorkout | null) => ActiveWorkout | null)) => void
  startWorkout: (programId: string | null) => ActiveWorkout
  finishWorkout: () => Promise<{ id: string; uploaded: boolean }>
  pendingCount: number
  lastPerf: Record<string, LastPerf>
  loadHistory: (limit?: number) => Promise<WorkoutWithSets[]>
  loadExerciseHistory: (exerciseId: string) => Promise<{ date: string; sets: WorkoutSet[] }[]>
}

const Ctx = createContext<Store | null>(null)

export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore în afara StoreProvider')
  return s
}

const CACHE_KEY = 'cache:library'
const ACTIVE_KEY = 'active-workout'
const PENDING_KEY = 'pending-workouts'
const LASTPERF_KEY = 'cache:lastperf'

interface PendingUpload {
  workout: Record<string, unknown>
  sets: Record<string, unknown>[]
}

const byPos = <T extends { position: number }>(a: T, b: T) => a.position - b.position
const byName = <T extends { name: string }>(a: T, b: T) => a.name.localeCompare(b.name, 'ro')

export function StoreProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const cacheKey = `${CACHE_KEY}:${userId}`
  const [lib, setLib] = useState<Library>(() => load(cacheKey, EMPTY))
  const [ready, setReady] = useState(() => load<Library | null>(cacheKey, null) !== null)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [active, setActiveState] = useState<ActiveWorkout | null>(() => load(ACTIVE_KEY, null))
  const [pending, setPending] = useState<PendingUpload[]>(() => load(PENDING_KEY, []))
  const [lastPerf, setLastPerf] = useState<Record<string, LastPerf>>(() => load(`${LASTPERF_KEY}:${userId}`, {}))

  useEffect(() => save(cacheKey, lib), [cacheKey, lib])
  useEffect(() => save(PENDING_KEY, pending.length ? pending : null), [pending])
  useEffect(() => save(`${LASTPERF_KEY}:${userId}`, lastPerf), [userId, lastPerf])

  const setActive: Store['setActive'] = useCallback((w) => {
    setActiveState((prev) => {
      const next = typeof w === 'function' ? w(prev) : w
      save(ACTIVE_KEY, next)
      return next
    })
  }, [])

  const computeLastPerf = useCallback(async () => {
    const workouts = await backend.select<{ id: string; finished_at: string }>('workouts', {
      order: ['finished_at', 'desc'],
      limit: 40,
    })
    if (!workouts.length) return setLastPerf({})
    const sets = await backend.select<WorkoutSet>('workout_sets', { in: ['workout_id', workouts.map((w) => w.id)] })
    const result: Record<string, LastPerf> = {}
    // workouts sunt descrescătoare, deci primul găsit e cel mai recent
    for (const w of workouts) {
      const ws = sets.filter((s) => s.workout_id === w.id && s.completed && s.exercise_id)
      const ids = new Set(ws.map((s) => s.exercise_id!))
      for (const id of ids) {
        if (result[id]) continue
        result[id] = {
          date: w.finished_at,
          sets: ws
            .filter((s) => s.exercise_id === id)
            .sort((a, b) => a.set_index - b.set_index)
            .map((s) => ({ weight: Number(s.weight), reps: s.reps })),
        }
      }
    }
    setLastPerf(result)
  }, [])

  const flushPending = useCallback(async () => {
    const queue = load<PendingUpload[]>(PENDING_KEY, [])
    if (!queue.length) return
    const left: PendingUpload[] = []
    for (const item of queue) {
      try {
        await backend.upsert('workouts', [item.workout])
        if (item.sets.length) await backend.upsert('workout_sets', item.sets)
      } catch {
        left.push(item)
      }
    }
    setPending(left)
  }, [])

  const refresh = useCallback(async () => {
    setSyncing(true)
    try {
      await seedIfEmpty()
      await flushPending()
      const [muscleGroups, equipment, exercises, programs, programExercises, coachNotes] = await Promise.all([
        backend.select<MuscleGroup>('muscle_groups'),
        backend.select<Equipment>('equipment'),
        backend.select<Exercise>('exercises'),
        backend.select<Program>('programs'),
        backend.select<ProgramExercise>('program_exercises'),
        backend.select<CoachNote>('coach_notes', { order: ['created_at', 'desc'], limit: 20 }),
      ])
      setLib({
        muscleGroups: muscleGroups.sort(byName),
        equipment: equipment.sort(byName),
        exercises: exercises.sort(byName),
        programs: programs.sort((a, b) => a.position - b.position || a.name.localeCompare(b.name)),
        programExercises: programExercises
          .map((p) => ({ ...p, target_weight: Number(p.target_weight) }))
          .sort(byPos),
        coachNotes,
      })
      await computeLastPerf()
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setReady(true)
      setSyncing(false)
    }
  }, [computeLastPerf, flushPending])

  useEffect(() => {
    refresh()
    const onOnline = () => refresh()
    const onVisible = () => document.visibilityState === 'visible' && refresh()
    window.addEventListener('online', onOnline)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('online', onOnline)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refresh])

  const patchLib = (fn: (l: Library) => Library) => setLib((l) => fn(l))

  // ---- Grupe musculare / echipamente
  const addNamed = async <T extends { id: string; name: string }>(table: string, key: 'muscleGroups' | 'equipment', name: string) => {
    const [row] = await backend.insert<T>(table, [{ name }])
    patchLib((l) => ({ ...l, [key]: [...(l[key] as T[]), row].sort(byName) }))
    return row
  }
  const renameNamed = async (table: string, key: 'muscleGroups' | 'equipment', id: string, name: string) => {
    await backend.update(table, id, { name })
    patchLib((l) => ({ ...l, [key]: l[key].map((x) => (x.id === id ? { ...x, name } : x)).sort(byName) }))
  }
  const deleteNamed = async (table: string, key: 'muscleGroups' | 'equipment', field: 'muscle_group_id' | 'equipment_id', id: string) => {
    await backend.remove(table, id)
    patchLib((l) => ({
      ...l,
      [key]: l[key].filter((x) => x.id !== id),
      exercises: l.exercises.map((e) => (e[field] === id ? { ...e, [field]: null } : e)),
    }))
  }

  // ---- Exerciții
  const saveExercise: Store['saveExercise'] = async (ex) => {
    const data = {
      name: ex.name.trim(),
      muscle_group_id: ex.muscle_group_id ?? null,
      equipment_id: ex.equipment_id ?? null,
      notes: ex.notes ?? null,
    }
    const row = ex.id ? await backend.update<Exercise>('exercises', ex.id, data) : (await backend.insert<Exercise>('exercises', [data]))[0]
    patchLib((l) => ({ ...l, exercises: [...l.exercises.filter((x) => x.id !== row.id), row].sort(byName) }))
    return row
  }
  const deleteExercise = async (id: string) => {
    await backend.removeWhere('program_exercises', 'exercise_id', id)
    await backend.remove('exercises', id)
    patchLib((l) => ({
      ...l,
      exercises: l.exercises.filter((x) => x.id !== id),
      programExercises: l.programExercises.filter((p) => p.exercise_id !== id),
    }))
  }

  // ---- Programe
  const saveProgram: Store['saveProgram'] = async (p) => {
    const data = { name: p.name.trim(), description: p.description ?? null, updated_at: new Date().toISOString() }
    const row = p.id
      ? await backend.update<Program>('programs', p.id, data)
      : (await backend.insert<Program>('programs', [{ ...data, position: lib.programs.length }]))[0]
    patchLib((l) => ({ ...l, programs: [...l.programs.filter((x) => x.id !== row.id), row].sort(byPos) }))
    return row
  }
  const deleteProgram = async (id: string) => {
    await backend.removeWhere('program_exercises', 'program_id', id)
    await backend.remove('programs', id)
    patchLib((l) => ({
      ...l,
      programs: l.programs.filter((x) => x.id !== id),
      programExercises: l.programExercises.filter((p) => p.program_id !== id),
    }))
  }
  const addProgramExercise = async (programId: string, exerciseId: string) => {
    const siblings = lib.programExercises.filter((p) => p.program_id === programId)
    const last = lastPerf[exerciseId]
    const [row] = await backend.insert<ProgramExercise>('program_exercises', [
      {
        program_id: programId,
        exercise_id: exerciseId,
        position: siblings.length ? Math.max(...siblings.map((s) => s.position)) + 1 : 0,
        target_sets: 3,
        target_reps: last?.sets[0]?.reps ?? 10,
        target_weight: last ? Math.max(...last.sets.map((s) => s.weight)) : 0,
        rest_seconds: 90,
      },
    ])
    patchLib((l) => ({ ...l, programExercises: [...l.programExercises, { ...row, target_weight: Number(row.target_weight) }] }))
  }
  // Steppere: UI-ul se actualizează imediat, salvarea se grupează (debounce)
  const pendingPatches = useRef<Record<string, { patch: Partial<ProgramExercise>; timer: number }>>({})
  const updateProgramExercise = async (id: string, patch: Partial<ProgramExercise>) => {
    patchLib((l) => ({ ...l, programExercises: l.programExercises.map((p) => (p.id === id ? { ...p, ...patch } : p)) }))
    const cur = pendingPatches.current[id]
    if (cur) window.clearTimeout(cur.timer)
    const merged = { ...cur?.patch, ...patch }
    pendingPatches.current[id] = {
      patch: merged,
      timer: window.setTimeout(() => {
        delete pendingPatches.current[id]
        backend.update('program_exercises', id, { ...merged, updated_at: new Date().toISOString() }).catch((e) => setError(e.message))
      }, 600),
    }
  }
  const deleteProgramExercise = async (id: string) => {
    await backend.remove('program_exercises', id)
    patchLib((l) => ({ ...l, programExercises: l.programExercises.filter((p) => p.id !== id) }))
  }
  const moveProgramExercise = async (id: string, dir: -1 | 1) => {
    const item = lib.programExercises.find((p) => p.id === id)
    if (!item) return
    const list = lib.programExercises.filter((p) => p.program_id === item.program_id).sort(byPos)
    const i = list.findIndex((p) => p.id === id)
    const j = i + dir
    if (j < 0 || j >= list.length) return
    ;[list[i], list[j]] = [list[j], list[i]]
    const updates = list.map((p, idx) => ({ id: p.id, position: idx }))
    patchLib((l) => ({
      ...l,
      programExercises: l.programExercises
        .map((p) => {
          const u = updates.find((x) => x.id === p.id)
          return u ? { ...p, position: u.position } : p
        })
        .sort(byPos),
    }))
    await Promise.all(updates.map((u) => backend.update('program_exercises', u.id, { position: u.position })))
  }
  const markNoteSeen = async (id: string) => {
    const seen_at = new Date().toISOString()
    patchLib((l) => ({ ...l, coachNotes: l.coachNotes.map((n) => (n.id === id ? { ...n, seen_at } : n)) }))
    await backend.update('coach_notes', id, { seen_at })
  }

  // ---- Antrenament
  const startWorkout = (programId: string | null): ActiveWorkout => {
    const program = lib.programs.find((p) => p.id === programId)
    const items = lib.programExercises.filter((p) => p.program_id === programId).sort(byPos)
    const w: ActiveWorkout = {
      id: crypto.randomUUID(),
      programId,
      programName: program?.name ?? 'Antrenament liber',
      startedAt: new Date().toISOString(),
      notes: '',
      exercises: items.map((pe) => {
        const ex = lib.exercises.find((e) => e.id === pe.exercise_id)
        return {
          key: crypto.randomUUID(),
          exerciseId: pe.exercise_id,
          name: ex?.name ?? 'Exercițiu',
          restSeconds: pe.rest_seconds,
          sets: Array.from({ length: pe.target_sets }, () => ({
            weight: pe.target_weight ? String(pe.target_weight) : '',
            reps: String(pe.target_reps),
            done: false,
            targetReps: pe.target_reps,
            targetWeight: pe.target_weight,
          })),
        }
      }),
    }
    setActive(w)
    return w
  }

  const finishWorkout = async () => {
    const w = active
    if (!w) throw new Error('Niciun antrenament activ')
    const workout = {
      id: w.id,
      program_id: w.programId,
      program_name: w.programName,
      started_at: w.startedAt,
      finished_at: new Date().toISOString(),
      notes: w.notes.trim() || null,
    }
    const sets = w.exercises.flatMap((ex, exIdx) =>
      ex.sets
        .filter((s) => s.done)
        .map((s, i) => ({
          id: crypto.randomUUID(),
          workout_id: w.id,
          exercise_id: ex.exerciseId,
          exercise_name: ex.name,
          exercise_position: exIdx,
          set_index: i + 1,
          target_reps: s.targetReps,
          target_weight: s.targetWeight,
          reps: Math.round(parseNum(s.reps) || 0),
          weight: parseNum(s.weight) || 0,
          rpe: null,
          completed: true,
        })),
    )
    // Întâi în coadă (sigur, local), apoi încercăm upload
    const item: PendingUpload = { workout, sets }
    const queue = [...load<PendingUpload[]>(PENDING_KEY, []), item]
    save(PENDING_KEY, queue)
    setPending(queue)
    setActive(null)
    let uploaded = false
    try {
      await backend.upsert('workouts', [workout])
      if (sets.length) await backend.upsert('workout_sets', sets)
      uploaded = true
      const rest = load<PendingUpload[]>(PENDING_KEY, []).filter((p) => p.workout.id !== w.id)
      save(PENDING_KEY, rest)
      setPending(rest)
    } catch {
      /* rămâne în coadă, se reîncearcă la următorul refresh */
    }
    computeLastPerf().catch(() => {})
    return { id: w.id, uploaded }
  }

  const loadHistory = useCallback(async (limit = 60) => {
    const workouts = await backend.select<WorkoutWithSets>('workouts', { order: ['finished_at', 'desc'], limit })
    if (!workouts.length) return []
    const sets = await backend.select<WorkoutSet>('workout_sets', { in: ['workout_id', workouts.map((w) => w.id)] })
    return workouts.map((w) => ({
      ...w,
      workout_sets: sets
        .filter((s) => s.workout_id === w.id)
        .map((s) => ({ ...s, weight: Number(s.weight) }))
        .sort((a, b) => a.exercise_position - b.exercise_position || a.set_index - b.set_index),
    }))
  }, [])

  const loadExerciseHistory = useCallback(async (exerciseId: string) => {
    const sets = await backend.select<WorkoutSet>('workout_sets', { eq: { exercise_id: exerciseId } })
    if (!sets.length) return []
    const ids = [...new Set(sets.map((s) => s.workout_id))]
    const workouts = await backend.select<{ id: string; finished_at: string }>('workouts', { in: ['id', ids] })
    return workouts
      .sort((a, b) => a.finished_at.localeCompare(b.finished_at))
      .map((w) => ({
        date: w.finished_at,
        sets: sets
          .filter((s) => s.workout_id === w.id)
          .map((s) => ({ ...s, weight: Number(s.weight) }))
          .sort((a, b) => a.set_index - b.set_index),
      }))
  }, [])

  const store: Store = {
    ...lib,
    ready,
    syncing,
    error,
    refresh,
    addMuscleGroup: (n) => addNamed<MuscleGroup>('muscle_groups', 'muscleGroups', n),
    renameMuscleGroup: (id, n) => renameNamed('muscle_groups', 'muscleGroups', id, n),
    deleteMuscleGroup: (id) => deleteNamed('muscle_groups', 'muscleGroups', 'muscle_group_id', id),
    addEquipment: (n) => addNamed<Equipment>('equipment', 'equipment', n),
    renameEquipment: (id, n) => renameNamed('equipment', 'equipment', id, n),
    deleteEquipment: (id) => deleteNamed('equipment', 'equipment', 'equipment_id', id),
    saveExercise,
    deleteExercise,
    saveProgram,
    deleteProgram,
    addProgramExercise,
    updateProgramExercise,
    deleteProgramExercise,
    moveProgramExercise,
    markNoteSeen,
    active,
    setActive,
    startWorkout,
    finishWorkout,
    pendingCount: pending.length,
    lastPerf,
    loadHistory,
    loadExerciseHistory,
  }

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

// Hook mic pentru lookup-uri rapide
export function useLookups() {
  const { exercises, muscleGroups, equipment } = useStore()
  return useMemo(
    () => ({
      exercise: Object.fromEntries(exercises.map((e) => [e.id, e])) as Record<string, Exercise>,
      group: Object.fromEntries(muscleGroups.map((g) => [g.id, g])) as Record<string, MuscleGroup>,
      equip: Object.fromEntries(equipment.map((g) => [g.id, g])) as Record<string, Equipment>,
    }),
    [exercises, muscleGroups, equipment],
  )
}

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(Date.now())
  const ref = useRef<number | undefined>(undefined)
  useEffect(() => {
    ref.current = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(ref.current)
  }, [intervalMs])
  return now
}
