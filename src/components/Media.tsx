import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { Camera, Info, Trash2 } from 'lucide-react'
import { useLookups } from '../lib/store'
import type { ImageDraft } from '../lib/media'
import { groupMuscles, type Muscle } from '../lib/muscles'
import type { Exercise, Media, MuscleGroup } from '../lib/types'
import BodyMap, { BodyThumb } from './BodyMap'
import { Button, Sheet, cx } from './ui'

export const hasMedia = (m?: Media | null) => Boolean(m && (m.image_url || m.description?.trim()))

// Miniatură pătrată, rotunjită
export function Thumb({ url, className }: { url: string; className?: string }) {
  return (
    <img
      src={url}
      alt=""
      loading="lazy"
      className={cx('shrink-0 rounded-xl bg-surface-2 object-cover object-left', className ?? 'size-10')}
    />
  )
}

export interface InfoSection extends Media {
  label: string
  title: string
  primary?: Muscle[]
  secondary?: Muscle[]
}

const exerciseMuscles = (ex: Exercise) => ({
  primary: (ex.primary_muscles ?? []) as Muscle[],
  secondary: (ex.secondary_muscles ?? []) as Muscle[],
})

// Secțiunea de info pentru o grupă: poza/descrierea ei, plus schema corpului dedusă din nume
export function groupSection(g: MuscleGroup): InfoSection | null {
  const primary = groupMuscles(g.name)
  if (!hasMedia(g) && !primary.length) return null
  return { label: 'Grupă musculară', title: g.name, description: g.description, image_url: g.image_url, primary }
}

// Secțiunile de info pentru un exercițiu: exercițiul, apoi aparatul și grupa musculară (dacă au poză/descriere)
export function useExerciseInfo(exerciseId: string | null | undefined) {
  const { exercise, group, equip } = useLookups()
  return useMemo(() => {
    const ex = exerciseId ? exercise[exerciseId] : undefined
    if (!ex) return { sections: [] as InfoSection[], thumb: null as string | null, title: '' }
    const eq = ex.equipment_id ? equip[ex.equipment_id] : undefined
    const gr = ex.muscle_group_id ? group[ex.muscle_group_id] : undefined
    const own = exerciseMuscles(ex)
    const sections: InfoSection[] = []
    if (hasMedia(ex) || own.primary.length)
      sections.push({ label: 'Exercițiu', title: ex.name, description: ex.description, image_url: ex.image_url, ...own })
    if (hasMedia(eq)) sections.push({ label: 'Echipament', title: eq!.name, description: eq!.description, image_url: eq!.image_url })
    const gs = gr && groupSection(gr)
    // Schema grupei apare doar dacă exercițiul nu are deja schema lui
    if (gs && (hasMedia(gr) || !own.primary.length)) sections.push(own.primary.length ? { ...gs, primary: undefined } : gs)
    return { sections, thumb: ex.image_url || eq?.image_url || null, title: ex.name }
  }, [exerciseId, exercise, group, equip])
}

export function InfoSheet({
  open,
  onClose,
  title,
  sections,
}: {
  open: boolean
  onClose: () => void
  title: string
  sections: InfoSection[]
}) {
  const [zoom, setZoom] = useState<string | null>(null)
  return (
    <>
      <Sheet open={open} onClose={onClose} title={title}>
        <div className="space-y-6">
          {sections.map((s) => (
            <section key={s.label}>
              {sections.length > 1 && (
                <div className="mb-2 text-xs font-semibold tracking-wider text-muted uppercase">
                  {s.label} · <span className="text-white/80 normal-case">{s.title}</span>
                </div>
              )}
              {s.image_url && (
                <button onClick={() => setZoom(s.image_url!)} className="mb-3 block w-full overflow-hidden rounded-2xl bg-surface-2">
                  <img src={s.image_url} alt={s.title} className="max-h-[50vh] w-full object-contain" />
                </button>
              )}
              {s.primary && s.primary.length > 0 && <BodyMap primary={s.primary} secondary={s.secondary} className="mb-3" />}
              {s.description?.trim() && <p className="text-[15px] leading-relaxed whitespace-pre-line text-white/85">{s.description}</p>}
            </section>
          ))}
          {sections.length === 0 && <p className="py-6 text-center text-muted">Nu există încă poză sau descriere.</p>}
        </div>
      </Sheet>
      {zoom &&
        createPortal(
          <div className="animate-fade fixed inset-0 z-[60] grid place-items-center bg-black/95 p-2" onClick={() => setZoom(null)}>
            <img src={zoom} alt="" className="max-h-full max-w-full object-contain" />
          </div>,
          document.body,
        )}
    </>
  )
}

// Butonul discret de info: miniatura (dacă există poză) sau o iconiță „i”. Nu apare deloc dacă nu e nimic de arătat.
export function InfoButton({
  title,
  sections,
  thumb,
  thumbMuscles,
  size = 'md',
}: {
  title: string
  sections: InfoSection[]
  thumb?: string | null
  thumbMuscles?: Muscle[]
  size?: 'sm' | 'md'
}) {
  const [open, setOpen] = useState(false)
  if (!sections.length) return null
  const box = size === 'sm' ? 'size-9' : 'size-11'
  // stopPropagation pe wrapper: evenimentele din Sheet (portal) urcă prin arborele React până la cardul părinte
  return (
    <span className="contents" onClick={(e: MouseEvent) => e.stopPropagation()}>
      <button onClick={() => setOpen(true)} aria-label="Info" className={cx('relative shrink-0 transition active:scale-90', box)}>
        {thumb ? (
          <>
            <Thumb url={thumb} className={cx(box, 'opacity-90')} />
            <span className="absolute -right-1 -bottom-1 grid size-4 place-items-center rounded-full bg-surface text-muted ring-2 ring-surface">
              <Info size={12} />
            </span>
          </>
        ) : thumbMuscles?.length ? (
          <BodyThumb primary={thumbMuscles} className={box} />
        ) : (
          <span className={cx('grid place-items-center rounded-xl text-muted active:bg-white/10', box)}>
            <Info size={size === 'sm' ? 18 : 20} />
          </span>
        )}
      </button>
      <InfoSheet open={open} onClose={() => setOpen(false)} title={title} sections={sections} />
    </span>
  )
}

export function ExerciseInfoButton({ exerciseId, size }: { exerciseId: string; size?: 'sm' | 'md' }) {
  const info = useExerciseInfo(exerciseId)
  return <InfoButton title={info.title} sections={info.sections} thumb={info.thumb} size={size} />
}

// Alegere poză în formular (cameră sau galerie). Fișierul se urcă abia la „Salvează”.
export function ImageField({ value, onChange }: { value: ImageDraft; onChange: (v: ImageDraft) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const preview = useMemo(() => (value.file ? URL.createObjectURL(value.file) : value.url), [value])
  useEffect(() => () => void (value.file && preview && URL.revokeObjectURL(preview)), [value.file, preview])
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-muted">Poză (opțional)</span>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onChange({ url: value.url, file: f })
          e.target.value = ''
        }}
      />
      {preview ? (
        <div className="flex items-center gap-3">
          <img src={preview} alt="" className="size-20 rounded-2xl bg-surface-2 object-cover" />
          <div className="flex flex-1 flex-col gap-2">
            <Button size="sm" variant="secondary" onClick={() => input.current?.click()}>
              <Camera size={16} /> Schimbă
            </Button>
            <Button size="sm" variant="danger" onClick={() => onChange({ url: null })}>
              <Trash2 size={16} /> Scoate poza
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => input.current?.click()}
          className="flex h-20 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-surface-2 text-sm font-semibold text-muted active:bg-line"
        >
          <Camera size={18} /> Adaugă poză
        </button>
      )}
    </div>
  )
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-muted">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-2xl border border-line bg-surface-2 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-accent"
      />
    </label>
  )
}
