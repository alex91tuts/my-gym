import { useEffect, useState } from 'react'
import { useStore } from '../lib/store'
import type { Exercise } from '../lib/types'
import { commitImage, removeImage, type ImageDraft } from '../lib/media'
import { Button, Input, Select, Sheet } from './ui'
import { ImageField, TextArea } from './Media'

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
  const [description, setDescription] = useState('')
  const [image, setImage] = useState<ImageDraft>({ url: null })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setName(exercise?.name ?? initialName)
    setGroupId(exercise?.muscle_group_id ?? initialGroup ?? '')
    setEquipId(exercise?.equipment_id ?? '')
    setNotes(exercise?.notes ?? '')
    setDescription(exercise?.description ?? '')
    setImage({ url: exercise?.image_url ?? null })
    setErr(null)
  }, [open, exercise, initialName, initialGroup])

  const submit = async () => {
    if (!name.trim()) return
    setBusy(true)
    try {
      const image_url = await commitImage(image)
      const ex = await saveExercise({
        id: exercise?.id,
        name,
        muscle_group_id: groupId || null,
        equipment_id: equipId || null,
        notes: notes.trim() || null,
        description: description.trim() || null,
        image_url,
      })
      if (exercise?.image_url && exercise.image_url !== image_url) removeImage(exercise.image_url)
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
        <TextArea
          label="Descriere (opțional)"
          value={description}
          onChange={setDescription}
          placeholder="Cum se execută: poziție, mișcare, ce să simți…"
        />
        <ImageField value={image} onChange={setImage} />
        {err && <p className="text-sm text-danger">{err}</p>}
        <Button className="w-full" onClick={submit} disabled={!name.trim() || busy}>
          {busy ? 'Se salvează…' : 'Salvează'}
        </Button>
      </div>
    </Sheet>
  )
}
