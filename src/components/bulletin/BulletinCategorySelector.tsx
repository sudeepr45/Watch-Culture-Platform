import { BULLETIN_CATEGORIES, type BulletinCategory } from '../../services/bulletinService'

interface BulletinCategorySelectorProps {
  selected: BulletinCategory[]
  onChange: (categories: BulletinCategory[]) => void
  error?: string
}

export function BulletinCategorySelector({ selected, onChange, error }: BulletinCategorySelectorProps) {
  return (
    <fieldset aria-describedby={error ? 'bulletin-category-error' : undefined}>
      <legend className="mb-1.5 block text-[10px] font-mono uppercase tracking-[0.2em] text-ink-muted">
        CATEGORIES <span className="normal-case tracking-normal">(select one or more)</span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {BULLETIN_CATEGORIES.map((category) => {
          const isSelected = selected.includes(category)
          return (
            <button
              key={category}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onChange(selected.includes(category)
                ? selected.filter((item) => item !== category)
                : [...selected, category])}
              className={`border px-3 py-2 text-[10px] font-mono uppercase tracking-[0.12em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink ${
                isSelected
                  ? 'border-ink bg-ink text-warm-white'
                  : 'border-hairline bg-warm-white text-ink-secondary hover:border-ink hover:text-ink'
              }`}
            >
              {category}
            </button>
          )
        })}
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-ink-muted">
        Earlier category labels remain available for existing Bulletin records.
      </p>
      {error && <p id="bulletin-category-error" className="mt-1.5 text-[11px] text-steel-dark" role="alert">{error}</p>}
    </fieldset>
  )
}

export function BulletinCategoryLabels({ categories }: { categories: readonly string[] }) {
  return (
    <span className="inline-flex flex-wrap gap-1.5" aria-label={`Categories: ${categories.join(', ')}`}>
      {categories.map((category) => (
        <span key={category} className="border border-hairline px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-[0.12em] text-ink-secondary">
          {category}
        </span>
      ))}
    </span>
  )
}

export function BulletinCategoryDescription({
  categories,
  description,
}: {
  categories: readonly string[]
  description: string | null
}) {
  const text = description?.trim()
  if (!categories.includes('Something Else') || !text) return null

  return <p className="mt-1 max-w-3xl text-xs leading-relaxed text-ink-secondary">{text}</p>
}
