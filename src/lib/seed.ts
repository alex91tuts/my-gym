import { backend } from './backend'

const GROUPS = ['Piept', 'Spate', 'Umeri', 'Biceps', 'Triceps', 'Cvadriceps', 'Femurali', 'Fesieri', 'Gambe', 'Abdomen']
const EQUIPMENT = ['Bară', 'Gantere', 'Aparat', 'Cablu', 'Greutate corporală', 'Kettlebell', 'Bară EZ', 'Smith']

const EXERCISES: [string, string, string][] = [
  ['Împins la piept cu bară', 'Piept', 'Bară'],
  ['Împins înclinat cu gantere', 'Piept', 'Gantere'],
  ['Fluturări la cablu', 'Piept', 'Cablu'],
  ['Tracțiuni', 'Spate', 'Greutate corporală'],
  ['Ramat cu bară', 'Spate', 'Bară'],
  ['Lat pulldown', 'Spate', 'Aparat'],
  ['Ramat la cablu', 'Spate', 'Cablu'],
  ['Presă militară', 'Umeri', 'Bară'],
  ['Ridicări laterale', 'Umeri', 'Gantere'],
  ['Flexii cu bară EZ', 'Biceps', 'Bară EZ'],
  ['Flexii ciocan', 'Biceps', 'Gantere'],
  ['Extensii triceps la cablu', 'Triceps', 'Cablu'],
  ['Genuflexiuni', 'Cvadriceps', 'Bară'],
  ['Presă picioare', 'Cvadriceps', 'Aparat'],
  ['Îndreptări românești', 'Femurali', 'Bară'],
  ['Flexii picioare', 'Femurali', 'Aparat'],
  ['Hip thrust', 'Fesieri', 'Bară'],
  ['Ridicări pe vârfuri', 'Gambe', 'Aparat'],
  ['Plank', 'Abdomen', 'Greutate corporală'],
]

let running: Promise<boolean> | null = null

// Rulează o singură dată, când utilizatorul nu are încă nimic.
export function seedIfEmpty() {
  running ??= doSeed().finally(() => (running = null))
  return running
}

async function doSeed() {
  const existing = await backend.select('muscle_groups', { limit: 1 })
  if (existing.length > 0) return false
  const groups = await backend.insert<{ id: string; name: string }>('muscle_groups', GROUPS.map((name) => ({ name })))
  const equip = await backend.insert<{ id: string; name: string }>('equipment', EQUIPMENT.map((name) => ({ name })))
  const g = Object.fromEntries(groups.map((x) => [x.name, x.id]))
  const e = Object.fromEntries(equip.map((x) => [x.name, x.id]))
  await backend.insert(
    'exercises',
    EXERCISES.map(([name, group, eq]) => ({ name, muscle_group_id: g[group] ?? null, equipment_id: e[eq] ?? null })),
  )
  return true
}
