import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useLookups, useStore } from '../lib/store'
import { Button, Chip, Confirm, IconButton, Input, PageHeader, Sheet, cx } from '../components/ui'
import ExerciseForm from '../components/ExerciseForm'
import { ImageField, InfoButton, TextArea, Thumb, groupSection, hasMedia } from '../components/Media'
import { groupMuscles } from '../lib/muscles'
import { commitImage, removeImage, type ImageDraft } from '../lib/media'
import type { NamedData } from '../lib/store'
import type { Equipment } from '../lib/types'

type Tab = 'exercises' | 'groups' | 'equipment'

export default function LibraryPage() {
  const [tab, setTab] = useState<Tab>(() => {
    try {
      return (sessionStorage.getItem('lib-tab') as Tab) || 'exercises'
    } catch {
      return 'exercises'
    }
  })
  const [adding, setAdding] = useState(false)
  const choose = (t: Tab) => {
    setTab(t)
    try {
      sessionStorage.setItem('lib-tab', t)
    } catch {
      /* ignore */
    }
  }
  return (
    <div>
      <PageHeader
        title="Bibliotecă"
        right={
          <IconButton onClick={() => setAdding(true)} aria-label="Adaugă" className="bg-surface-2">
            <Plus size={22} />
          </IconButton>
        }
      />
      <div className="px-4">
        <div className="mb-4 grid grid-cols-3 rounded-2xl bg-surface p-1">
          {(
            [
              ['exercises', 'Exerciții'],
              ['groups', 'Grupe'],
              ['equipment', 'Echipamente'],
            ] as [Tab, string][]
          ).map(([t, l]) => (
            <button
              key={t}
              onClick={() => choose(t)}
              className={cx('h-10 rounded-xl text-sm font-semibold transition', tab === t ? 'bg-surface-2 text-white shadow' : 'text-muted')}
            >
              {l}
            </button>
          ))}
        </div>
        {tab === 'exercises' && <Exercises adding={adding} setAdding={setAdding} />}
        {tab === 'groups' && <NamedList kind="groups" adding={adding} setAdding={setAdding} />}
        {tab === 'equipment' && <NamedList kind="equipment" adding={adding} setAdding={setAdding} />}
      </div>
    </div>
  )
}

function Exercises({ adding, setAdding }: { adding: boolean; setAdding: (v: boolean) => void }) {
  const { exercises, muscleGroups } = useStore()
  const { group, equip } = useLookups()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [g, setG] = useState<string | null>(null)
  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return exercises.filter((e) => (!g || e.muscle_group_id === g) && (!s || e.name.toLowerCase().includes(s)))
  }, [exercises, q, g])

  return (
    <>
      <div className="relative mb-3">
        <Search className="absolute top-1/2 left-4 -translate-y-1/2 text-muted" size={18} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Caută în ${exercises.length} exerciții…`}
          className="h-12 w-full rounded-2xl bg-surface pr-4 pl-11 outline-none placeholder:text-white/30"
        />
      </div>
      <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
        <Chip active={!g} onClick={() => setG(null)}>
          Toate
        </Chip>
        {muscleGroups.map((m) => (
          <Chip key={m.id} active={g === m.id} onClick={() => setG(m.id)}>
            {m.name}
          </Chip>
        ))}
      </div>
      <div className="divide-y divide-line/50 rounded-3xl bg-surface px-4">
        {list.map((e) => (
          <button key={e.id} onClick={() => nav(`/exercise/${e.id}`)} className="flex w-full items-center gap-3 py-3.5 text-left active:opacity-60">
            {e.image_url && <Thumb url={e.image_url} />}
            <div className="min-w-0 flex-1">
              <div className="font-semibold">{e.name}</div>
              <div className="text-sm text-muted">
                {[e.muscle_group_id && group[e.muscle_group_id]?.name, e.equipment_id && equip[e.equipment_id]?.name].filter(Boolean).join(' · ') || '—'}
              </div>
            </div>
            <ChevronRight size={18} className="text-muted" />
          </button>
        ))}
        {list.length === 0 && <p className="py-8 text-center text-muted">Nimic găsit.</p>}
      </div>
      <ExerciseForm open={adding} onClose={() => setAdding(false)} initialName={q.trim()} initialGroup={g} />
    </>
  )
}

function NamedList({ kind, adding, setAdding }: { kind: 'groups' | 'equipment'; adding: boolean; setAdding: (v: boolean) => void }) {
  const store = useStore()
  const items = kind === 'groups' ? store.muscleGroups : store.equipment
  const field = kind === 'groups' ? 'muscle_group_id' : 'equipment_id'
  const add = kind === 'groups' ? store.addMuscleGroup : store.addEquipment
  const update = kind === 'groups' ? store.updateMuscleGroup : store.updateEquipment
  const del = kind === 'groups' ? store.deleteMuscleGroup : store.deleteEquipment
  const [editing, setEditing] = useState<Equipment | null>(null)
  const [deleting, setDeleting] = useState<{ id: string; name: string } | null>(null)
  const label = kind === 'groups' ? 'grupă musculară' : 'echipament'

  const open: (Partial<Equipment> & { name: string }) | null = editing ?? (adding ? { name: '' } : null)
  const close = () => {
    setEditing(null)
    setAdding(false)
  }

  return (
    <>
      <div className="divide-y divide-line/50 rounded-3xl bg-surface px-4">
        {items.map((it) => {
          const count = store.exercises.filter((e) => e[field] === it.id).length
          return (
            <div key={it.id} className="flex items-center gap-3 py-2.5">
              <NamedInfo item={it} kind={kind} />
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{it.name}</div>
                <div className="text-sm text-muted">{count} exerciții</div>
              </div>
              <IconButton onClick={() => setEditing(it)} aria-label="Editează">
                <Pencil size={18} />
              </IconButton>
              <IconButton onClick={() => setDeleting(it)} aria-label="Șterge" className="text-danger/80">
                <Trash2 size={18} />
              </IconButton>
            </div>
          )
        })}
      </div>
      <Button variant="secondary" className="mt-3 w-full" onClick={() => setAdding(true)}>
        <Plus size={18} /> Adaugă {label}
      </Button>

      <Sheet open={Boolean(open)} onClose={close} title={open?.id ? `Editează ${label}` : `Adaugă ${label}`}>
        {open && (
          <NamedForm
            initial={open}
            kind={kind}
            onSave={async (data) => {
              if (open.id) await update(open.id, data)
              else await add(data)
              close()
            }}
          />
        )}
      </Sheet>
      <Confirm
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title={`Ștergi „${deleting?.name}”?`}
        message="Exercițiile asociate rămân, doar fără această etichetă."
        onConfirm={() => deleting && del(deleting.id)}
      />
    </>
  )
}

function NamedForm({
  initial,
  kind,
  onSave,
}: {
  initial: Partial<Equipment> & { name: string }
  kind: 'groups' | 'equipment'
  onSave: (data: NamedData) => Promise<void>
}) {
  const [name, setName] = useState(initial.name)
  const [description, setDescription] = useState(initial.description ?? '')
  const [image, setImage] = useState<ImageDraft>({ url: initial.image_url ?? null })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const submit = async () => {
    if (!name.trim() || busy) return
    setBusy(true)
    try {
      const image_url = await commitImage(image)
      await onSave({ name: name.trim(), description: description.trim() || null, image_url })
      if (initial.image_url && initial.image_url !== image_url) removeImage(initial.image_url)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Eroare')
      setBusy(false)
    }
  }
  return (
    <div className="space-y-4">
      <Input label="Nume" value={name} onChange={(e) => setName(e.target.value)} autoFocus={!initial.id} />
      <TextArea
        label="Descriere (opțional)"
        value={description}
        onChange={setDescription}
        placeholder={kind === 'equipment' ? 'Cum arată, unde e în sală, cum se reglează…' : 'Ce mușchi cuprinde, unde se află…'}
      />
      <ImageField value={image} onChange={setImage} />
      {err && <p className="text-sm text-danger">{err}</p>}
      <Button className="w-full" disabled={!name.trim() || busy} onClick={submit}>
        {busy ? 'Se salvează…' : 'Salvează'}
      </Button>
    </div>
  )
}

// Miniatura de info: poza, sau (la grupe) schema corpului dedusă din nume. Locul rămâne rezervat ca rândurile să fie aliniate.
function NamedInfo({ item, kind }: { item: Equipment; kind: 'groups' | 'equipment' }) {
  const section =
    kind === 'groups'
      ? groupSection(item)
      : hasMedia(item)
        ? { label: 'Echipament', title: item.name, description: item.description, image_url: item.image_url }
        : null
  if (!section) return kind === 'groups' ? <div className="size-9 shrink-0" /> : null
  return (
    <InfoButton
      title={item.name}
      thumb={item.image_url}
      thumbMuscles={kind === 'groups' ? groupMuscles(item.name) : undefined}
      sections={[section]}
      size="sm"
    />
  )
}
