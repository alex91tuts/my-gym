// Mușchii în vocabularul schemei corpului (react-body-highlighter) și traducerile din catalog / grupele noastre.
import type { Muscle } from 'react-body-highlighter'

export type { Muscle }

// Catalogul free-exercise-db → mușchii din schemă
const CATALOG_TO_BODY: Record<string, Muscle[]> = {
  chest: ['chest'],
  shoulders: ['front-deltoids', 'back-deltoids'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  forearms: ['forearm'],
  abdominals: ['abs', 'obliques'],
  quadriceps: ['quadriceps'],
  hamstrings: ['hamstring'],
  glutes: ['gluteal'],
  calves: ['calves'],
  lats: ['upper-back'],
  'middle back': ['upper-back'],
  'lower back': ['lower-back'],
  traps: ['trapezius'],
  adductors: ['adductor'],
  abductors: ['abductors'],
  neck: ['neck'],
}

export const catalogToBody = (muscles: string[]): Muscle[] => [...new Set(muscles.flatMap((m) => CATALOG_TO_BODY[m] ?? []))]

// Catalog → numele grupei musculare în română (se creează dacă lipsește)
export const CATALOG_GROUP: Record<string, string> = {
  chest: 'Piept',
  shoulders: 'Umeri',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Antebrațe',
  abdominals: 'Abdomen',
  quadriceps: 'Cvadriceps',
  hamstrings: 'Femurali',
  glutes: 'Fesieri',
  calves: 'Gambe',
  lats: 'Spate',
  'middle back': 'Spate',
  'lower back': 'Spate',
  traps: 'Spate',
  adductors: 'Adductori',
  abductors: 'Abductori',
  neck: 'Gât',
}

// Catalog → echipament în română (null = fără)
export const CATALOG_EQUIPMENT: Record<string, string | null> = {
  barbell: 'Bară',
  dumbbell: 'Gantere',
  cable: 'Cablu',
  machine: 'Aparat',
  'body only': 'Greutate corporală',
  kettlebells: 'Kettlebell',
  'e-z curl bar': 'Bară EZ',
  bands: 'Benzi elastice',
  'medicine ball': 'Minge medicinală',
  'exercise ball': 'Minge fitness',
  'foam roll': 'Foam roller',
  other: null,
}

const plain = (s: string) => s.toLocaleLowerCase('ro').normalize('NFD').replace(/[\u0300-\u036f]/g, '')

// Numele unei grupe (scris de om, în română sau engleză) → mușchii din schemă
const GROUP_RULES: [RegExp, Muscle[]][] = [
  [/piept|pector|chest/, ['chest']],
  [/trapez|trap/, ['trapezius']],
  [/lombar|lower back/, ['lower-back']],
  [/spate|dorsal|back|lats/, ['upper-back', 'lower-back', 'trapezius']],
  [/umer|umar|delto|shoulder/, ['front-deltoids', 'back-deltoids']],
  [/biceps/, ['biceps']],
  [/triceps/, ['triceps']],
  [/antebrat|forearm/, ['forearm']],
  [/oblic/, ['obliques']],
  [/abdom|abs|core/, ['abs', 'obliques']],
  [/cvadri|quadri|coaps/, ['quadriceps']],
  [/femural|ischio|hamstring/, ['hamstring']],
  [/fesier|glute|fund/, ['gluteal']],
  [/gamb|molet|calf|calves/, ['calves']],
  [/adductor/, ['adductor']],
  [/abductor/, ['abductors']],
  [/gat|neck/, ['neck']],
  [/picioare|legs?$/, ['quadriceps', 'hamstring', 'gluteal', 'calves']],
  [/brate|arms?$/, ['biceps', 'triceps', 'forearm']],
]

export function groupMuscles(name: string | null | undefined): Muscle[] {
  if (!name) return []
  const n = plain(name)
  for (const [re, m] of GROUP_RULES) if (re.test(n)) return m
  return []
}

// Ce parte a corpului se vede mai bine pentru niște mușchi
const BACK_ONLY = new Set<Muscle>(['upper-back', 'lower-back', 'trapezius', 'back-deltoids', 'triceps', 'hamstring', 'gluteal', 'calves'])
export const mostlyBack = (m: Muscle[]) => m.length > 0 && m.filter((x) => BACK_ONLY.has(x)).length * 2 > m.length
