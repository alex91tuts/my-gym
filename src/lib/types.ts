// Poză + descriere opționale, afișate doar la cerere (butonul de info)
export interface Media {
  description?: string | null
  image_url?: string | null
}

export interface MuscleGroup extends Media {
  id: string
  name: string
}

export interface Equipment extends Media {
  id: string
  name: string
}

export interface Exercise extends Media {
  id: string
  name: string
  muscle_group_id: string | null
  equipment_id: string | null
  notes: string | null
  // Pentru schema corpului (vocabularul react-body-highlighter)
  primary_muscles?: string[] | null
  secondary_muscles?: string[] | null
}

export interface Program {
  id: string
  name: string
  description: string | null
  position: number
  updated_at: string
}

export interface ProgramExercise {
  id: string
  program_id: string
  exercise_id: string
  position: number
  target_sets: number
  target_reps: number
  target_weight: number
  rest_seconds: number
  notes: string | null
  ai_note: string | null
  updated_at: string
}

export interface CoachChange {
  exercise?: string
  field?: string
  from?: string | number
  to?: string | number
  reason?: string
}

export interface CoachNote {
  id: string
  program_id: string | null
  summary: string
  changes: CoachChange[]
  created_at: string
  seen_at: string | null
}

export interface Workout {
  id: string
  program_id: string | null
  program_name: string
  started_at: string
  finished_at: string
  notes: string | null
  analyzed_at: string | null
}

export interface WorkoutSet {
  id: string
  workout_id: string
  exercise_id: string | null
  exercise_name: string
  exercise_position: number
  set_index: number
  target_reps: number | null
  target_weight: number | null
  reps: number
  weight: number
  rpe: number | null
  completed: boolean
}

export interface WorkoutWithSets extends Workout {
  workout_sets: WorkoutSet[]
}

// Antrenamentul în desfășurare, ținut local până la Finish
export interface ActiveSet {
  weight: string
  reps: string
  done: boolean
  targetReps: number | null
  targetWeight: number | null
}

export interface ActiveExercise {
  key: string
  exerciseId: string
  name: string
  restSeconds: number
  sets: ActiveSet[]
}

export interface ActiveWorkout {
  id: string
  programId: string | null
  programName: string
  startedAt: string
  exercises: ActiveExercise[]
  notes: string
}
