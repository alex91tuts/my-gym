import { createClient } from '@supabase/supabase-js'

// Pe GitHub Pages, variabilele nesetate ajung ca text gol, nu undefined.
const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || undefined
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || undefined

export const supabaseConfigured = Boolean(url && key)

export const supabase = createClient(url ?? 'https://placeholder.supabase.co', key ?? 'placeholder', {
  auth: { persistSession: true, autoRefreshToken: true },
})
