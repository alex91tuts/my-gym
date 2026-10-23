export function fmtWeight(n: number | string | null | undefined) {
  if (n === null || n === undefined || n === '') return '–'
  const v = Number(n)
  return Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/\.?0+$/, '')
}

export function fmtDuration(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (x: number) => String(x).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`
}

export function fmtMinutes(ms: number) {
  const m = Math.round(ms / 60000)
  if (m < 60) return `${m} min`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ro-RO', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function fmtDateLong(iso: string) {
  return new Date(iso).toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export function relativeDay(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diff = Math.round((start(today) - start(d)) / 86400000)
  if (diff === 0) return 'azi'
  if (diff === 1) return 'ieri'
  if (diff < 7) return `acum ${diff} zile`
  return fmtDate(iso)
}

// Estimare 1RM (Epley)
export function est1RM(weight: number, reps: number) {
  if (reps <= 0) return 0
  if (reps === 1) return weight
  return weight * (1 + reps / 30)
}

export function parseNum(s: string) {
  const v = Number(String(s).replace(',', '.'))
  return Number.isFinite(v) ? v : NaN
}
