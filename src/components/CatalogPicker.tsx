import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, Search } from 'lucide-react'
import { LEVEL, catalogImage, entryEquipment, entryGroup, loadCatalog, searchCatalog, type CatalogEntry } from '../lib/catalog'
import { CATALOG_GROUP, catalogToBody } from '../lib/muscles'
import BodyMap from './BodyMap'
import { Button, Chip, Sheet } from './ui'

const GROUPS = [...new Set(Object.values(CATALOG_GROUP))]
const PAGE = 40

// Caută în catalogul de 870 de exerciții și alege unul (poză, descriere, mușchi).
export default function CatalogPicker({
  open,
  onClose,
  onPick,
  initialQuery = '',
  initialGroup = null,
}: {
  open: boolean
  onClose: () => void
  onPick: (x: CatalogEntry) => void
  initialQuery?: string
  initialGroup?: string | null
}) {
  const [list, setList] = useState<CatalogEntry[] | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [g, setG] = useState<string | null>(null)
  const [limit, setLimit] = useState(PAGE)
  const [sel, setSel] = useState<CatalogEntry | null>(null)

  useEffect(() => {
    if (!open) return
    setQ(initialQuery)
    setG(initialGroup && GROUPS.includes(initialGroup) ? initialGroup : null)
    setSel(null)
    setErr(null)
    loadCatalog()
      .then(setList)
      .catch((e) => setErr(e instanceof Error ? e.message : String(e)))
  }, [open, initialQuery, initialGroup])

  useEffect(() => setLimit(PAGE), [q, g])

  const results = useMemo(() => (list ? searchCatalog(list, q, g) : []), [list, q, g])

  return (
    <Sheet open={open} onClose={onClose} title={sel ? sel.n : 'Catalog exerciții'}>
      {sel ? (
        <Detail x={sel} onBack={() => setSel(null)} onUse={() => onPick(sel)} />
      ) : (
        <>
          <div className="relative mb-3">
            <Search className="absolute top-1/2 left-4 -translate-y-1/2 text-muted" size={18} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ex. genuflexiuni, bench press, gantere…"
              className="h-12 w-full rounded-2xl bg-surface-2 pr-4 pl-11 outline-none placeholder:text-white/30"
            />
          </div>
          <div className="no-scrollbar -mx-5 mb-3 flex gap-2 overflow-x-auto px-5">
            <Chip active={!g} onClick={() => setG(null)}>
              Toate
            </Chip>
            {GROUPS.map((m) => (
              <Chip key={m} active={g === m} onClick={() => setG(m)}>
                {m}
              </Chip>
            ))}
          </div>
          {err && <p className="py-6 text-center text-danger">{err}</p>}
          {!list && !err && <p className="py-8 text-center text-muted">Se încarcă…</p>}
          {list && <p className="mb-1 text-xs text-muted">{results.length} exerciții</p>}
          <div className="divide-y divide-line/50">
            {results.slice(0, limit).map((x) => (
              <button key={x.id} onClick={() => setSel(x)} className="flex w-full items-center gap-3 py-2.5 text-left active:opacity-60">
                <img src={catalogImage(x.id)} alt="" loading="lazy" className="size-12 shrink-0 rounded-xl bg-surface-2 object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{x.n}</div>
                  {x.en && x.en !== x.n && <div className="truncate text-xs text-white/40">{x.en}</div>}
                  <div className="truncate text-sm text-muted">{[entryGroup(x), entryEquipment(x)].filter(Boolean).join(' · ') || '—'}</div>
                </div>
              </button>
            ))}
          </div>
          {results.length > limit && (
            <Button variant="secondary" className="mt-3 w-full" onClick={() => setLimit((l) => l + PAGE)}>
              Arată mai multe
            </Button>
          )}
          {list && results.length === 0 && <p className="py-6 text-center text-muted">Nimic găsit. Încearcă alt cuvânt (merge și în engleză).</p>}
        </>
      )}
    </Sheet>
  )
}

function Detail({ x, onBack, onUse }: { x: CatalogEntry; onBack: () => void; onUse: () => void }) {
  const primary = catalogToBody(x.p)
  const secondary = catalogToBody(x.s)
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="-mt-1 flex items-center gap-1 text-sm font-semibold text-muted">
        <ChevronLeft size={18} /> Înapoi la listă
      </button>
      <div className="grid grid-cols-2 gap-1 overflow-hidden rounded-2xl bg-surface-2">
        {Array.from({ length: Math.min(2, x.k) }, (_, i) => (
          <img key={i} src={catalogImage(x.id, i)} alt="" className="aspect-[3/2] w-full object-cover" />
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5 text-xs">
        {[entryGroup(x), entryEquipment(x), LEVEL[x.l]].filter(Boolean).map((t) => (
          <span key={t} className="rounded-lg bg-surface-2 px-2 py-1 font-semibold text-white/80">
            {t}
          </span>
        ))}
      </div>
      {primary.length > 0 && <BodyMap primary={primary} secondary={secondary} />}
      <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-white/80">
        {x.i.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
      <Button className="w-full" onClick={onUse}>
        Folosește exercițiul
      </Button>
    </div>
  )
}
