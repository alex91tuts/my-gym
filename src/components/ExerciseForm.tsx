import { useEffect, useState } from 'react'
import { useStore } from '../lib/store'
import type { Exercise } from '../lib/types'
import { Button, Input, Select, Sheet } from './ui'

export default function ExerciseForm({
  open,
  onClose,
  onSaved,
  exercise,
  initialName = '',
  initialGroup = null,
}: {
  open: boolean
  onClose: () => void
  onSaved?: (e: Exercise) => void
  exercise?: Exercise | null
  initialName?: string
  initialGroup?: string | null
}) {
  const { muscleGroups, equipment, saveExercise } = useStore()
  const [name, setName] = useState('')
  const [groupId, setGroupId] = useState('')
  const [equipId, setEquipId] = useState('')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setName(exercise?.name ?? initialName)
    setGroupId(exercise?.muscle_group_id ?? initialGroup ?? '')
    setEquipId(exercise?.equipment_id ?? '')
    setNotes(exercise?.notes ?? '')
    setErr(null)
  }, [open, exercise, initialName, initialGroup])

  const submit = async () => {
    if (!name.trim()) return
    setBusy(true)
    try {
      const ex = await saveExercise({
        id: exercise?.id,
        name,
        muscle_group_id: groupId || null,
        equipment_id: equipId || null,
        notes: notes.trim() || null,
      })
      onSaved?.(ex)
      onClose()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Eroare')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={exercise ? 'Editează exercițiu' : 'Exercițiu nou'}>
      <div className="space-y-4">
        <Input label="Nume" value={name} onChange={(e) => setName(e.target.value)} autoFocus={!exercise} placeholder="ex. Împins la piept" />
        <Select
          label="Grupă musculară"
          value={groupId}
          onChange={setGroupId}
          options={muscleGroups.map((g) => ({ value: g.id, label: g.name }))}
          placeholder="Fără"
        />
        <Select
          label="Echipament"
          value={equipId}
          onChange={setEquipId}
          options={equipment.map((g) => ({ value: g.id, label: g.name }))}
          placeholder="Fără"
        />
        <Input label="Notițe (opțional)" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="ex. priză îngustă, banca la 30°" />
        {err && <p className="text-sm text-danger">{err}</p>}
        <Button className="w-full" onClick={submit} disabled={!name.trim() || busy}>
          Salvează
        </Button>
      </div>
    </Sheet>
  )
}
