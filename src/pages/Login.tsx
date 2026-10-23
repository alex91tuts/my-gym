import { useState } from 'react'
import { Dumbbell } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Button, Input } from '../components/ui'

export default function Login() {
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    const { error, data } =
      mode === 'in'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })
    setBusy(false)
    if (error) setMsg(error.message)
    else if (mode === 'up' && !data.session) setMsg('Cont creat. Verifică emailul pentru confirmare, apoi intră.')
  }

  return (
    <div className="mx-auto flex min-h-full max-w-sm flex-col justify-center px-6 py-10">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-5 grid size-20 place-items-center rounded-[28px] bg-gradient-to-br from-accent to-accent-2 text-black shadow-[0_20px_60px_-15px_rgba(163,230,53,0.6)]">
          <Dumbbell size={38} strokeWidth={2.4} />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">My Gym</h1>
        <p className="mt-1 text-muted">Antrenează. Notează. Progresează.</p>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <Input label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input
          label="Parolă"
          type="password"
          autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
        {msg && <p className="rounded-2xl bg-surface-2 p-3 text-sm text-white/80">{msg}</p>}
        <Button type="submit" className="w-full" size="lg" disabled={busy}>
          {mode === 'in' ? 'Intră' : 'Creează cont'}
        </Button>
      </form>
      <button className="mt-6 text-center text-sm text-muted" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>
        {mode === 'in' ? 'Nu ai cont? ' : 'Ai deja cont? '}
        <span className="font-semibold text-accent">{mode === 'in' ? 'Creează unul' : 'Intră'}</span>
      </button>
    </div>
  )
}
