import { supabase, supabaseConfigured } from './supabase'
import { load, save } from './storage'

type Row = Record<string, any>

export interface SelectOpts {
  eq?: Record<string, unknown>
  in?: [string, unknown[]]
  order?: [string, 'asc' | 'desc']
  limit?: number
}

export interface Backend {
  mode: 'supabase' | 'local'
  select<T = Row>(table: string, opts?: SelectOpts): Promise<T[]>
  insert<T = Row>(table: string, rows: Row[]): Promise<T[]>
  upsert(table: string, rows: Row[]): Promise<void>
  update<T = Row>(table: string, id: string, patch: Row): Promise<T>
  remove(table: string, id: string): Promise<void>
  removeWhere(table: string, field: string, value: unknown): Promise<void>
}

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message)
  return res.data as T
}

const supabaseBackend: Backend = {
  mode: 'supabase',
  async select(table, opts = {}) {
    let q = supabase.from(table).select('*')
    for (const [k, v] of Object.entries(opts.eq ?? {})) q = q.eq(k, v as never)
    if (opts.in) q = q.in(opts.in[0], opts.in[1] as never[])
    if (opts.order) q = q.order(opts.order[0], { ascending: opts.order[1] === 'asc' })
    if (opts.limit) q = q.limit(opts.limit)
    return check(await q) as never
  },
  async insert(table, rows) {
    return check(await supabase.from(table).insert(rows).select('*')) as never
  },
  async upsert(table, rows) {
    check(await supabase.from(table).upsert(rows))
  },
  async update(table, id, patch) {
    return check(await supabase.from(table).update(patch).eq('id', id).select('*').single()) as never
  },
  async remove(table, id) {
    check(await supabase.from(table).delete().eq('id', id))
  },
  async removeWhere(table, field, value) {
    check(await supabase.from(table).delete().eq(field, value as never))
  },
}

// Mod local (fără Supabase): totul în localStorage. Util pentru test și demo.
const tableKey = (t: string) => `local:${t}`
const read = (t: string) => load<Row[]>(tableKey(t), [])
const write = (t: string, rows: Row[]) => save(tableKey(t), rows)
const now = () => new Date().toISOString()

function withDefaults(row: Row): Row {
  return { id: crypto.randomUUID(), created_at: now(), updated_at: now(), ...row }
}

const localBackend: Backend = {
  mode: 'local',
  async select(table, opts = {}) {
    let rows = read(table)
    for (const [k, v] of Object.entries(opts.eq ?? {})) rows = rows.filter((r) => r[k] === v)
    if (opts.in) {
      const [f, vals] = opts.in
      rows = rows.filter((r) => vals.includes(r[f]))
    }
    if (opts.order) {
      const [f, dir] = opts.order
      rows = [...rows].sort((a, b) => (a[f] < b[f] ? -1 : a[f] > b[f] ? 1 : 0) * (dir === 'asc' ? 1 : -1))
    }
    if (opts.limit) rows = rows.slice(0, opts.limit)
    return rows as never
  },
  async insert(table, rows) {
    const added = rows.map(withDefaults)
    write(table, [...read(table), ...added])
    return added as never
  },
  async upsert(table, rows) {
    const all = read(table)
    for (const r of rows) {
      const i = all.findIndex((x) => x.id === r.id)
      if (i >= 0) all[i] = { ...all[i], ...r }
      else all.push(withDefaults(r))
    }
    write(table, all)
  },
  async update(table, id, patch) {
    const all = read(table)
    const i = all.findIndex((x) => x.id === id)
    if (i < 0) throw new Error('Nu există')
    all[i] = { ...all[i], ...patch }
    write(table, all)
    return all[i] as never
  },
  async remove(table, id) {
    write(table, read(table).filter((r) => r.id !== id))
  },
  async removeWhere(table, field, value) {
    write(table, read(table).filter((r) => r[field] !== value))
  },
}

export const backend: Backend = supabaseConfigured ? supabaseBackend : localBackend
