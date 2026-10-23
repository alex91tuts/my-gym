import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')
export { cx }

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <button
      {...props}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100',
        size === 'sm' && 'h-9 px-3 text-sm',
        size === 'md' && 'h-12 px-5',
        size === 'lg' && 'h-14 px-6 text-lg',
        variant === 'primary' && 'bg-accent text-black shadow-[0_8px_30px_-8px_rgba(163,230,53,0.5)]',
        variant === 'secondary' && 'bg-surface-2 text-white',
        variant === 'ghost' && 'text-muted hover:text-white',
        variant === 'danger' && 'bg-danger/15 text-danger',
        className,
      )}
    />
  )
}

export function IconButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cx(
        'grid size-10 place-items-center rounded-full text-white/80 transition active:scale-90 active:bg-white/10 disabled:opacity-30',
        className,
      )}
    />
  )
}

export function Card({ className, children, onClick }: { className?: string; children: ReactNode; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cx(
        'rounded-3xl border border-line/60 bg-surface p-4',
        onClick && 'cursor-pointer transition active:scale-[0.98] active:bg-surface-2',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function Input({ label, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-muted">{label}</span>}
      <input
        {...props}
        className={cx(
          'h-12 w-full rounded-2xl border border-line bg-surface-2 px-4 text-white outline-none placeholder:text-white/30 focus:border-accent',
          className,
        )}
      />
    </label>
  )
}

export function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label?: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
}) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-muted">{label}</span>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full appearance-none rounded-2xl border border-line bg-surface-2 px-4 text-white outline-none focus:border-accent"
      >
        <option value="">{placeholder ?? '—'}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="animate-fade absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="animate-sheet pb-safe relative max-h-[90vh] overflow-y-auto rounded-t-[28px] border-t border-line bg-surface">
        <div className="sticky top-0 z-10 bg-surface px-5 pt-3 pb-2">
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-white/15" />
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">{title}</h2>
            <IconButton onClick={onClose} aria-label="Închide">
              <X size={20} />
            </IconButton>
          </div>
        </div>
        <div className="px-5 pb-6">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

export function Confirm({
  open,
  title,
  message,
  confirmLabel = 'Șterge',
  onConfirm,
  onClose,
}: {
  open: boolean
  title: string
  message?: string
  confirmLabel?: string
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      {message && <p className="mb-5 text-muted">{message}</p>}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={onClose}>
          Renunță
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            onConfirm()
            onClose()
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </Sheet>
  )
}

export function PageHeader({
  title,
  subtitle,
  back,
  right,
}: {
  title: string
  subtitle?: string
  back?: boolean
  right?: ReactNode
}) {
  const nav = useNavigate()
  return (
    <header className="pt-safe sticky top-0 z-30 bg-bg/85 backdrop-blur-xl">
      <div className="flex min-h-16 items-center gap-1 px-3">
        {back && (
          <IconButton onClick={() => nav(-1)} aria-label="Înapoi">
            <ChevronLeft size={26} />
          </IconButton>
        )}
        <div className={cx('min-w-0 flex-1', !back && 'pl-2')}>
          <h1 className={cx('truncate font-extrabold tracking-tight', back ? 'text-xl' : 'text-3xl')}>{title}</h1>
          {subtitle && <p className="truncate text-sm text-muted">{subtitle}</p>}
        </div>
        {right}
      </div>
    </header>
  )
}

export function Empty({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-8 py-14 text-center">
      <div className="mb-4 grid size-16 place-items-center rounded-3xl bg-surface-2 text-accent">{icon}</div>
      <h3 className="text-lg font-bold">{title}</h3>
      {text && <p className="mt-1 text-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Chip({ children, active, onClick }: { children: ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'h-9 shrink-0 rounded-full px-4 text-sm font-semibold transition active:scale-95',
        active ? 'bg-white text-black' : 'bg-surface-2 text-white/70',
      )}
    >
      {children}
    </button>
  )
}

export function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
  suffix,
  label,
}: {
  value: number
  onChange: (v: number) => void
  step?: number
  min?: number
  suffix?: string
  label: string
}) {
  const set = (v: number) => onChange(Math.max(min, Math.round(v * 100) / 100))
  return (
    <div className="rounded-2xl bg-surface-2 p-2">
      <div className="mb-1 text-center text-xs font-medium text-muted">{label}</div>
      <div className="flex items-center justify-between">
        <button className="grid size-9 place-items-center rounded-xl bg-white/5 text-xl active:bg-white/15" onClick={() => set(value - step)}>
          −
        </button>
        <input
          inputMode="decimal"
          value={value}
          onChange={(e) => {
            const v = Number(e.target.value.replace(',', '.'))
            if (Number.isFinite(v)) set(v)
          }}
          className="w-14 bg-transparent text-center text-lg font-bold outline-none"
        />
        <button className="grid size-9 place-items-center rounded-xl bg-white/5 text-xl active:bg-white/15" onClick={() => set(value + step)}>
          +
        </button>
      </div>
      {suffix && <div className="text-center text-[11px] text-muted">{suffix}</div>}
    </div>
  )
}
