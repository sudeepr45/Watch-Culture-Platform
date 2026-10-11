import { plateForDateKey } from '../../lib/plateDaily'
import PlateIndexCanvas from './PlateIndexCanvas'

interface PlateThumbProps {
  dateKey: string
  label: string
  selected: boolean
  onSelect: () => void
}

const THUMB_SIZE = 96

export default function PlateThumb({ dateKey, label, selected, onSelect }: PlateThumbProps) {
  const plate = plateForDateKey(dateKey)

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={label}
      aria-pressed={selected}
      className={`border bg-warm-surface p-0 leading-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${selected ? 'border-ink' : 'border-hairline'}`}
    >
      <span aria-hidden="true" className="block">
        <PlateIndexCanvas plate={plate} size={THUMB_SIZE} label="" />
      </span>
    </button>
  )
}
