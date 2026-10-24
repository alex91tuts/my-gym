import { useState } from 'react'
import { Check, Smartphone, UploadCloud } from 'lucide-react'
import { supabaseConfigured } from '../lib/supabase'
import { useStore } from '../lib/store'
import { dismissLocalImport, hasLocalData, importLocalData, localImportedAt, localSummary } from '../lib/importLocal'
import { Button, Card } from './ui'

// Datele din modul local (de dinainte de cont) rămân pe telefon. Cardul le mută în cont.
// `always`: apare și după import (în Profil); altfel doar până la import sau „Nu acum”.
export default function ImportCard({ always }: { always?: boolean }) {
  const { refresh } = useStore()
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'hidden'>('idle')
  const [msg, setMsg] = useState<string | null>(null)
  if (!supabaseConfigured || !hasLocalData() || state === 'hidden') return null
  if (!always && localImportedAt() && state !== 'done') return null

  const s = localSummary()
  const run = async () => {
    setState('busy')
    setMsg(null)
    try {
      const r = await importLocalData()
      await refresh()
      setState('done')
      setMsg(`Gata: ${r.programs} program(e) noi și ${r.workouts} antrenament(e) din istoric.`)
    } catch (e) {
      setState('idle')
      setMsg(`Nu a mers: ${e instanceof Error ? e.message : e}. Încearcă din nou când ai net.`)
    }
  }

  return (
    <Card className="border-accent/30">
      <div className="mb-1 flex items-center gap-2 font-bold">
        <Smartphone size={18} className="text-accent" /> Date de pe telefon, de dinainte de cont
      </div>
      <p className="text-sm text-white/75">
        {s.programs.length > 0 && <>Programe: {s.programs.join(', ')}. </>}
        {s.workouts > 0 && <>{s.workouts} antrenament(e) în istoric. </>}
        Le poți muta în contul tău.
      </p>
      {msg && <p className="mt-2 text-sm text-accent">{msg}</p>}
      {state === 'done' ? (
        !always && (
          <Button variant="secondary" className="mt-3 w-full" onClick={() => setState('hidden')}>
            <Check size={18} /> OK
          </Button>
        )
      ) : (
        <div className="mt-3 flex gap-2">
          <Button className="flex-1" onClick={run} disabled={state === 'busy'}>
            <UploadCloud size={18} /> {state === 'busy' ? 'Se importă…' : localImportedAt() && always ? 'Importă din nou' : 'Importă în cont'}
          </Button>
          {!always && (
            <Button
              variant="ghost"
              onClick={() => {
                dismissLocalImport()
                setState('hidden')
              }}
            >
              Nu acum
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}
