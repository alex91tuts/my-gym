import { createClient } from '@supabase/supabase-js'

// Proiectul My Gym. Cheia „publishable” e publică prin design: datele sunt protejate de RLS (fiecare își vede doar rândurile lui).
// Variabilele VITE_SUPABASE_* au prioritate; VITE_SUPABASE_URL=local forțează modul local (date doar în browser).
const DEFAULT_URL = 'https://fwndjnbhkklrimcsthgs.supabase.co'
const DEFAULT_KEY = 'sb_publishable_2xN18af-kINUG5sIO85WTA_PSNO7bbH'

// Pe GitHub Pages, variabilele nesetate ajung ca text gol, nu undefined.
const envUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || DEFAULT_URL
const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || DEFAULT_KEY
const url = envUrl === 'local' ? undefined : envUrl
const key = envUrl === 'local' ? undefined : envKey

export const supabaseConfigured = Boolean(url && key)

export const supabase = createClient(url ?? 'https://placeholder.supabase.co', key ?? 'placeholder', {
  auth: { persistSession: true, autoRefreshToken: true },
})
