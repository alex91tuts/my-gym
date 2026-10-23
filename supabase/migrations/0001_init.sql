-- My Gym: schema inițială
-- Fiecare rând aparține unui utilizator (user_id). RLS: fiecare își vede doar datele lui.

create table public.muscle_groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.equipment (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  muscle_group_id uuid references public.muscle_groups(id) on delete set null,
  equipment_id uuid references public.equipment(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  description text,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ținta pentru fiecare exercițiu din program. Claude modifică aceste valori săptămânal.
create table public.program_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  program_id uuid not null references public.programs(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  position int not null default 0,
  target_sets int not null default 3,
  target_reps int not null default 10,
  target_weight numeric(6,2) not null default 0,
  rest_seconds int not null default 90,
  notes text,
  ai_note text,             -- explicația lui Claude pentru ultima modificare
  updated_at timestamptz not null default now()
);

create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  program_id uuid references public.programs(id) on delete set null,
  program_name text not null,
  started_at timestamptz not null,
  finished_at timestamptz not null,
  notes text,
  analyzed_at timestamptz,  -- setat de Claude după analiză
  created_at timestamptz not null default now()
);

create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  workout_id uuid not null references public.workouts(id) on delete cascade,
  exercise_id uuid references public.exercises(id) on delete set null,
  exercise_name text not null,
  exercise_position int not null default 0,
  set_index int not null,
  target_reps int,
  target_weight numeric(6,2),
  reps int not null,
  weight numeric(6,2) not null,
  rpe numeric(3,1),         -- 1-10, opțional
  completed boolean not null default true
);

-- Notițele lui Claude după analiză (apar în aplicație)
create table public.coach_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  program_id uuid references public.programs(id) on delete cascade,
  summary text not null,
  changes jsonb not null default '[]'::jsonb,  -- [{exercise, field, from, to, reason}]
  created_at timestamptz not null default now(),
  seen_at timestamptz
);

create index on public.exercises(user_id);
create index on public.program_exercises(program_id);
create index on public.workouts(user_id, finished_at desc);
create index on public.workout_sets(workout_id);
create index on public.workout_sets(exercise_id);
create index on public.coach_notes(user_id, created_at desc);

-- RLS
do $$
declare t text;
begin
  foreach t in array array['muscle_groups','equipment','exercises','programs','program_exercises','workouts','workout_sets','coach_notes']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "own rows" on public.%I for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
  end loop;
end $$;
