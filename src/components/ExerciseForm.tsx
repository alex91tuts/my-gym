import { useEffect, useState } from 'react'
import { BookOpen } from 'lucide-react'
import { useStore } from '../lib/store'
import { catalogDescription, combinedImage, entryEquipment, entryGroup, type CatalogEntry } from '../lib/catalog'
import { catalogToBody } from '../lib/muscles'
import CatalogPicker from './CatalogPicker'
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
  const { muscleGroups, equipment, saveExercise, addMuscleGroup, addEquipment } = useStore()
  const [name, setName] = useState('')
  const [groupId, setGroupId] = useState('')
  const [equipId, setEquipId] = useState('')
  const [notes, setNotes] = useState('')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState<ImageDraft>({ url: null })
  const [muscles, setMuscles] = useState<{ primary: string[]; secondary: string[] }>({ primary: [], secondary: [] })
  const [catalog, setCatalog] = useState(false)
  const [fromCatalog, setFromCatalog] = useState<string | null>(null)
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
    setMuscles({ primary: exercise?.primary_muscles ?? [], secondary: exercise?.secondary_muscles ?? [] })
    setFromCatalog(null)
    setErr(null)
  }, [open, exercise, initialName, initialGroup])

  // Completează formularul din catalog: grupa/echipamentul se creează dacă lipsesc, poza se urcă la „Salvează”
  const useCatalog = async (x: CatalogEntry) => {
    setCatalog(false)
    setBusy(true)
    setErr(null)
    try {
      const find = <T extends { id: string; name: string }>(list: T[], n: string) =>
        list.find((i) => i.name.toLocaleLowerCase('ro') === n.toLocaleLowerCase('ro'))
      const gName = entryGroup(x)
      if (gName) setGroupId((find(muscleGroups, gName) ?? (await addMuscleGroup({ name: gName }))).id)
      const eName = entryEquipment(x)
      if (eName) setEquipId((find(equipment, eName) ?? (await addEquipment({ name: eName }))).id)
      if (!exercise || !name.trim()) setName(x.n)
      setDescription(catalogDescription(x))
      setMuscles({ primary: catalogToBody(x.p), secondary: catalogToBody(x.s).filter((m) => !catalogToBody(x.p).includes(m)) })
      setFromCatalog(x.n)
      setImage({ url: image.url, file: await combinedImage(x) })
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Eroare')
    } finally {
      setBusy(false)
    }
  }

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
        primary_muscles: muscles.primary,
        secondary_muscles: muscles.secondary,
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
    <>
      <Sheet open={open && !catalog} onClose={onClose} title={exercise ? 'Editează exercițiu' : 'Exercițiu nou'}>
        <div className="space-y-4">
          <button
            onClick={() => setCatalog(true)}
            disabled={busy}
            className="flex w-full items-center gap-3 rounded-2xl border border-accent/30 bg-accent/10 p-3 text-left active:bg-accent/20 disabled:opacity-50"
          >
            <BookOpen size={20} className="shrink-0 text-accent" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">
                {busy && !fromCatalog ? 'Se aduce din catalog…' : fromCatalog ? `Din catalog: ${fromCatalog}` : 'Caută în catalog'}
              </div>
              <div className="text-xs text-muted">870 de exerciții cu poze, descriere și mușchii lucrați</div>
            </div>
          </button>
          <Input
            label="Nume"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus={!exercise}
            placeholder="ex. Împins la piept"
          />
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
          <Input
            label="Notițe (opțional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="ex. priză îngustă, banca la 30°"
          />
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
      <CatalogPicker
        open={open && catalog}
        onClose={() => setCatalog(false)}
        onPick={useCatalog}
        initialQuery={exercise ? '' : name.trim()}
        initialGroup={muscleGroups.find((g) => g.id === groupId)?.name ?? null}
      />
    </>
  )
}
