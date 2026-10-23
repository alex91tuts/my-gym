import { useState } from 'react'
import { Check, Copy, Database, LogOut, RefreshCw, Sparkles } from 'lucide-react'
import { supabase, supabaseConfigured } from '../lib/supabase'
import { useStore } from '../lib/store'
import { Button, Card, PageHeader } from '../components/ui'

export default function Profile({ email }: { email: string | null }) {
  const { refresh, syncing, error, pendingCount } = useStore()
  const [copied, setCopied] = useState(false)

  const prompt = `Analizează antrenamentele mele din Supabase (proiectul my-gym${email ? `, utilizatorul ${email}` : ''}). Urmează instrucțiunile din docs/COACH.md din repo-ul my-gym: compară ce am făcut cu țintele, ajustează programele pentru săptămâna viitoare și lasă-mi o notiță.`

  return (
    <div>
      <PageHeader title="Profil" />
      <div className="space-y-3 px-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-2xl bg-surface-2 text-lg font-bold text-accent">
              {(email ?? 'L')[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-bold">{email ?? 'Mod local'}</div>
              <div className="flex items-center gap-1 text-sm text-muted">
                <Database size={14} />
                {supabaseConfigured ? 'Sincronizat cu Supabase' : 'Date doar pe acest telefon'}
              </div>
            </div>
          </div>
          {error && <p className="mt-3 rounded-xl bg-danger/10 p-2 text-sm text-danger">Offline sau eroare: {error}</p>}
          {pendingCount > 0 && <p className="mt-3 text-sm text-muted">{pendingCount} antrenament(e) așteaptă upload.</p>}
          <Button variant="secondary" className="mt-3 w-full" onClick={refresh} disabled={syncing}>
            <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} /> Sincronizează acum
          </Button>
        </Card>

        <Card className="border-ai/30">
          <div className="mb-2 flex items-center gap-2 font-bold text-ai">
            <Sparkles size={18} /> Coach Claude
          </div>
          <p className="text-sm text-white/80">
            După fiecare Finish, antrenamentul ajunge în Supabase. Deschide o conversație cu Claude (cu Supabase conectat) și trimite mesajul de mai jos.
            Claude analizează, ajustează țintele programelor și îți lasă o notiță aici în aplicație.
          </p>
          <div className="mt-3 rounded-2xl bg-surface-2 p-3 text-sm text-white/70">{prompt}</div>
          <Button
            variant="secondary"
            className="mt-3 w-full"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(prompt)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              } catch {
                /* ignore */
              }
            }}
          >
            {copied ? <Check size={18} /> : <Copy size={18} />} {copied ? 'Copiat' : 'Copiază mesajul'}
          </Button>
        </Card>

        {supabaseConfigured && (
          <Button variant="ghost" className="w-full" onClick={() => supabase.auth.signOut()}>
            <LogOut size={18} /> Ieși din cont
          </Button>
        )}
        <p className="pt-4 text-center text-xs text-muted">My Gym v0.1</p>
      </div>
    </div>
  )
}
