import Model from 'react-body-highlighter'
import { mostlyBack, type Muscle } from '../lib/muscles'
import { cx } from './ui'

const BODY = '#2a2a35'
// index = frecvența - 1: secundari (o dată), principali (de două ori)
const COLORS = ['#a3e63570', '#a3e635']

function data(primary: Muscle[], secondary: Muscle[]) {
  return [
    { name: 'p1', muscles: primary },
    { name: 'p2', muscles: primary },
    { name: 's', muscles: secondary.filter((m) => !primary.includes(m)) },
  ]
}

// Schema corpului, față și spate, cu mușchii lucrați colorați.
export default function BodyMap({ primary, secondary = [], className }: { primary: Muscle[]; secondary?: Muscle[]; className?: string }) {
  const d = data(primary, secondary)
  return (
    <div className={cx('flex justify-center gap-6', className)}>
      {(['anterior', 'posterior'] as const).map((type) => (
        <div key={type} className="w-[38%] max-w-40">
          <Model type={type} data={d} bodyColor={BODY} highlightedColors={COLORS} style={{ width: '100%' }} svgStyle={{ width: '100%' }} />
          <div className="mt-1 text-center text-[11px] text-muted">{type === 'anterior' ? 'Față' : 'Spate'}</div>
        </div>
      ))}
    </div>
  )
}

// Miniatură: doar partea (față sau spate) unde se văd mai bine mușchii
export function BodyThumb({ primary, className }: { primary: Muscle[]; className?: string }) {
  return (
    <div className={cx('grid shrink-0 place-items-center overflow-hidden rounded-xl bg-surface-2 p-0.5', className ?? 'size-10')}>
      <Model
        type={mostlyBack(primary) ? 'posterior' : 'anterior'}
        data={data(primary, [])}
        bodyColor={BODY}
        highlightedColors={COLORS}
        style={{ height: '100%' }}
        svgStyle={{ height: '100%', width: 'auto' }}
      />
    </div>
  )
}
