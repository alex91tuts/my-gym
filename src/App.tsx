import { useEffect, useState } from 'react'
import { HashRouter, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { Dumbbell, History, Library, User } from 'lucide-react'
import type { Session } from '@supabase/supabase-js'
import { supabase, supabaseConfigured } from './lib/supabase'
import { StoreProvider, useStore } from './lib/store'
import { cx } from './components/ui'
import Login from './pages/Login'
import Home from './pages/Home'
import ProgramPage from './pages/Program'
import WorkoutPage from './pages/Workout'
import HistoryPage from './pages/History'
import WorkoutDetail from './pages/WorkoutDetail'
import LibraryPage from './pages/Library'
import ExercisePage from './pages/Exercise'
import Profile from './pages/Profile'
import ActiveBanner from './components/ActiveBanner'

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(supabaseConfigured ? undefined : null)

  useEffect(() => {
    if (!supabaseConfigured) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  if (session === undefined) return <Splash />
  if (supabaseConfigured && !session) return <Login />

  const userId = session?.user.id ?? 'local'
  return (
    <StoreProvider key={userId} userId={userId}>
      <HashRouter>
        <Shell email={session?.user.email ?? null} />
      </HashRouter>
    </StoreProvider>
  )
}

function Splash() {
  return (
    <div className="grid h-full place-items-center">
      <Dumbbell className="animate-pulse text-accent" size={40} />
    </div>
  )
}

function Shell({ email }: { email: string | null }) {
  const { ready } = useStore()
  const loc = useLocation()
  const inWorkout = loc.pathname.startsWith('/workout')
  if (!ready) return <Splash />
  return (
    <div className="mx-auto min-h-full max-w-lg">
      <main className={cx(!inWorkout && 'pb-28')}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/program/:id" element={<ProgramPage />} />
          <Route path="/workout" element={<WorkoutPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/history/:id" element={<WorkoutDetail />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/exercise/:id" element={<ExercisePage />} />
          <Route path="/profile" element={<Profile email={email} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!inWorkout && <ActiveBanner />}
      {!inWorkout && <TabBar />}
    </div>
  )
}

const TABS = [
  { to: '/', label: 'Antrenează', icon: Dumbbell },
  { to: '/history', label: 'Istoric', icon: History },
  { to: '/library', label: 'Bibliotecă', icon: Library },
  { to: '/profile', label: 'Profil', icon: User },
]

function TabBar() {
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line/60 bg-bg/90 backdrop-blur-xl">
      <div className="mx-auto grid max-w-lg grid-cols-4">
        {TABS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cx('flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition', isActive ? 'text-accent' : 'text-muted')
            }
          >
            <Icon size={22} strokeWidth={2.2} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
