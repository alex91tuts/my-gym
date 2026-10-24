// Import al datelor din modul local (localStorage, de dinainte de cont) în contul Supabase.
// Grupele, echipamentele și exercițiile se potrivesc după nume, ca să nu apară dubluri.
// Antrenamentele își păstrează id-ul, deci un import repetat nu le dublează.
import { backend } from './backend'
import { load, save } from './storage'

type Row = Record<string, any>

const IMPORTED_KEY = 'local-imported-at'
const local = (t: string) => load<Row[]>(`local:${t}`, [])
const key = (s: unknown) => String(s ?? '').trim().toLocaleLowerCase('ro')
const pick = (r: Row, fields: string[]) => Object.fromEntries(fields.filter((f) => r[f] !== undefined).map((f) => [f, r[f]]))

export interface LocalSummary {
  programs: string[]
  workouts: number
}

export function localSummary(): LocalSummary {
  return { programs: local('programs').map((p) => p.name), workouts: local('workouts').length }
}

export const hasLocalData = () => {
  const s = localSummary()
  return s.programs.length > 0 || s.workouts > 0
}
export const localImportedAt = () => load<string | null>(IMPORTED_KEY, null)
export const dismissLocalImport = () => save(IMPORTED_KEY, 'dismissed')

// Potrivește rândurile locale după nume cu cele din cont; inserează ce lipsește. Întoarce harta id local → id în cont.
async function mergeByName(table: string, rows: Row[], toInsert: (r: Row) => Row): Promise<Record<string, string>> {
  const remote = await backend.select<Row>(table)
  const byName = new Map(remote.map((r) => [key(r.name), r.id as string]))
  const missing: Row[] = []
  for (const r of rows) {
    if (!byName.has(key(r.name)) && !missing.some((m) => key(m.name) === key(r.name))) missing.push(r)
  }
  if (missing.length) {
    const added = await backend.insert<Row>(table, missing.map(toInsert))
    added.forEach((a) => byName.set(key(a.name), a.id))
  }
  return Object.fromEntries(rows.map((r) => [r.id, byName.get(key(r.name))!]))
}

export async function importLocalData(): Promise<{ programs: number; workouts: number }> {
  const groups = await mergeByName('muscle_groups', local('muscle_groups'), (r) => pick(r, ['name', 'description', 'image_url']))
  const equip = await mergeByName('equipment', local('equipment'), (r) => pick(r, ['name', 'description', 'image_url']))
  const exercises = await mergeByName('exercises', local('exercises'), (r) => ({
    ...pick(r, ['name', 'notes', 'description', 'image_url', 'primary_muscles', 'secondary_muscles']),
    muscle_group_id: r.muscle_group_id ? (groups[r.muscle_group_id] ?? null) : null,
    equipment_id: r.equipment_id ? (equip[r.equipment_id] ?? null) : null,
  }))

  // Programe: cele cu un nume care există deja în cont nu se mai adaugă
  const remotePrograms = await backend.select<Row>('programs')
  const programs: Record<string, string> = {}
  for (const p of remotePrograms) for (const lp of local('programs')) if (key(lp.name) === key(p.name)) programs[lp.id] = p.id
  const newPrograms = local('programs').filter((p) => !programs[p.id])
  let position = remotePrograms.length
  for (const p of newPrograms) {
    const [row] = await backend.insert<Row>('programs', [{ name: p.name, description: p.description ?? null, position: position++ }])
    programs[p.id] = row.id
    const items = local('program_exercises')
      .filter((pe) => pe.program_id === p.id && exercises[pe.exercise_id])
      .map((pe) => ({
        ...pick(pe, ['position', 'target_sets', 'target_reps', 'target_weight', 'rest_seconds', 'notes', 'ai_note']),
        program_id: row.id,
        exercise_id: exercises[pe.exercise_id],
      }))
    if (items.length) await backend.insert('program_exercises', items)
  }

  // Istoric: același id, deci upsert-ul e sigur la reluare
  const workouts = local('workouts').map((w) => ({
    ...pick(w, ['id', 'program_name', 'started_at', 'finished_at', 'notes']),
    program_id: w.program_id ? (programs[w.program_id] ?? null) : null,
  }))
  if (workouts.length) await backend.upsert('workouts', workouts)
  const sets = local('workout_sets').map((s) => ({
    ...pick(s, ['id', 'workout_id', 'exercise_name', 'exercise_position', 'set_index', 'target_reps', 'target_weight', 'reps', 'weight', 'rpe', 'completed']),
    exercise_id: s.exercise_id ? (exercises[s.exercise_id] ?? null) : null,
  }))
  for (let i = 0; i < sets.length; i += 500) await backend.upsert('workout_sets', sets.slice(i, i + 500))

  save(IMPORTED_KEY, new Date().toISOString())
  return { programs: newPrograms.length, workouts: workouts.length }
}
