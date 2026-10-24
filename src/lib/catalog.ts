// Catalogul free-exercise-db (domeniu public): 870 de exerciții cu poze (start / final) și instrucțiuni în engleză.
// Lista compactă e în public/catalog/exercises.json; pozele vin de pe GitHub și se copiază în cont la import.
import { CATALOG_EQUIPMENT, CATALOG_GROUP } from './muscles'

export interface CatalogEntry {
  id: string
  n: string // nume (engleză)
  e: string | null // echipament
  c: string // categorie
  l: string // nivel
  p: string[] // mușchi principali
  s: string[] // mușchi secundari
  i: string[] // instrucțiuni
  k: number // câte poze
}

const IMG_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/'
export const catalogImage = (id: string, i = 0) => `${IMG_BASE}${id}/${i}.jpg`

let cache: Promise<CatalogEntry[]> | null = null
export function loadCatalog() {
  cache ??= fetch('catalog/exercises.json')
    .then((r) => {
      if (!r.ok) throw new Error('Catalogul nu s-a putut încărca')
      return r.json() as Promise<CatalogEntry[]>
    })
    .catch((e) => {
      cache = null
      throw e
    })
  return cache
}

export const entryGroup = (x: CatalogEntry) => (x.p[0] ? CATALOG_GROUP[x.p[0]] : undefined)
export const entryEquipment = (x: CatalogEntry) => (x.e ? (CATALOG_EQUIPMENT[x.e] ?? null) : null)

export const LEVEL: Record<string, string> = { beginner: 'începător', intermediate: 'mediu', expert: 'avansat' }

const plain = (s: string) => s.toLocaleLowerCase('ro').normalize('NFD').replace(/[\u0300-\u036f]/g, '')

// Cuvinte românești frecvente → termenii din catalog, ca să poți căuta în română
const RO: [RegExp, string][] = [
  [/^genuflex|^ghemuir/, 'squat'],
  [/^fandar/, 'lunge'],
  [/^impins|^presa/, 'press'],
  [/^ramat|^vaslit/, 'row'],
  [/^flexi/, 'curl'],
  [/^extensi/, 'extension'],
  [/^tractiun/, 'pull'],
  [/^fluturar/, 'fly'],
  [/^indreptar/, 'deadlift'],
  [/^ridicar/, 'raise'],
  [/^flotar/, 'push-up'],
  [/^abdomin|^abdom/, 'crunch'],
  [/^gantera|^gantere/, 'dumbbell'],
  [/^bara$/, 'barbell'],
  [/^cablu|^scripete/, 'cable'],
  [/^aparat/, 'machine'],
  [/^inclinat/, 'incline'],
  [/^declinat/, 'decline'],
  [/^picioare/, 'leg'],
  [/^umer/, 'shoulder'],
  [/^gamb|^varfuri/, 'calf'],
  [/^fesier/, 'glute'],
  [/^sold/, 'hip'],
]

// Fiecare cuvânt căutat trebuie să apară în nume, grupă sau echipament (în engleză sau română)
export function searchCatalog(list: CatalogEntry[], query: string, group: string | null): CatalogEntry[] {
  const words = plain(query).split(/\s+/).filter(Boolean)
  const terms = words.map((w) => {
    const hit = RO.find(([re]) => re.test(w))
    return hit ? [w, hit[1]] : [w]
  })
  const out = list.filter((x) => {
    if (group && entryGroup(x) !== group) return false
    if (!terms.length) return true
    const hay = plain([x.n, x.e ?? '', entryGroup(x) ?? '', entryEquipment(x) ?? '', ...x.p].join(' '))
    return terms.every((alts) => alts.some((t) => hay.includes(t)))
  })
  // Exercițiile de forță întâi, stretching/cardio la final
  const rank = (x: CatalogEntry) => (x.c === 'stretching' || x.c === 'cardio' ? 1 : 0)
  return out.sort((a, b) => rank(a) - rank(b))
}

// Pozele de start și final, una lângă alta, într-o singură imagine
export async function combinedImage(x: CatalogEntry): Promise<Blob> {
  const urls = Array.from({ length: Math.min(2, Math.max(1, x.k)) }, (_, i) => catalogImage(x.id, i))
  const bmps = await Promise.all(
    urls.map(async (u) => {
      const r = await fetch(u)
      if (!r.ok) throw new Error('Poza nu s-a putut descărca')
      return createImageBitmap(await r.blob())
    }),
  )
  const h = 500
  const gap = bmps.length > 1 ? 8 : 0
  const widths = bmps.map((b) => Math.round((b.width * h) / b.height))
  const canvas = document.createElement('canvas')
  canvas.width = widths.reduce((a, b) => a + b, 0) + gap
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#15151c'
  ctx.fillRect(0, 0, canvas.width, h)
  let x0 = 0
  bmps.forEach((b, i) => {
    ctx.drawImage(b, x0, 0, widths[i], h)
    x0 += widths[i] + gap
    b.close()
  })
  return new Promise((ok, fail) => canvas.toBlob((b) => (b ? ok(b) : fail(new Error('Poza nu a putut fi procesată'))), 'image/jpeg', 0.85))
}

export const catalogDescription = (x: CatalogEntry) => x.i.map((s, i) => `${i + 1}. ${s}`).join('\n')
