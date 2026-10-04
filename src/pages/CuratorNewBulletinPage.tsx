import { useState } from 'react'
import Container from '../components/common/Container'
import { useAuth } from '../context/useAuth'
import { useRouter } from '../router/useRouter'
import {
  createBulletin,
  type BulletinCategory,
  type BulletinEra,
} from '../services/curatorBulletinService'

const BULLETIN_CATEGORIES: BulletinCategory[] = [
  'Market',
  'Auction',
  'Release',
  'History',
  'Note',
]

type BulletinField = 'title' | 'category' | 'slug' | 'body'
type FieldErrors = Partial<Record<BulletinField, string>>

function normalizeSlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function FieldError({ id, children }: { id: string; children?: string }) {
  if (!children) return null
  return <p id={id} className="mt-1.5 text-[11px] text-steel-dark" role="alert">{children}</p>
}

export default function CuratorNewBulletinPage() {
  const { isAuthenticated, isCurator, loading: authLoading } = useAuth()
  const { navigate } = useRouter()

  const [title, setTitle] = useState('')
  const [era, setEra] = useState<BulletinEra>('Modern')
  const [category, setCategory] = useState<BulletinCategory | ''>('')
  const [slug, setSlug] = useState('')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [body, setBody] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState<'draft' | 'publish' | null>(null)

  const clearFieldError = (field: BulletinField) => {
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
    setSubmitError(null)
  }

  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (!slugManuallyEdited) setSlug(normalizeSlug(value))
    clearFieldError('title')
    if (!slugManuallyEdited) clearFieldError('slug')
  }

  const handleCreate = async (publish: boolean) => {
    if (saving) return

    const normalizedSlug = normalizeSlug(slug)
    const nextErrors: FieldErrors = {}
    if (!title.trim()) nextErrors.title = 'Enter a title.'
    if (!BULLETIN_CATEGORIES.includes(category as BulletinCategory)) {
      nextErrors.category = 'Select a category.'
    }
    if (!normalizedSlug) nextErrors.slug = 'Enter a valid slug.'
    if (!body.trim()) nextErrors.body = 'Enter the Bulletin body.'

    setFieldErrors(nextErrors)
    setSubmitError(null)
    if (Object.keys(nextErrors).length > 0) return

    setSaving(publish ? 'publish' : 'draft')
    const result = await createBulletin({
      title: title.trim(),
      era,
      category: category as BulletinCategory,
      slug: normalizedSlug,
      body: body.trim(),
      published_at: publish ? new Date().toISOString() : null,
    })

    if (result.error) {
      const message = result.error.message
      setSubmitError(
        /duplicate key|unique constraint|bulletins_slug_key/i.test(message)
          ? 'That slug is already in use. Change the slug and try again.'
          : `Unable to ${publish ? 'publish' : 'save'} the Bulletin: ${message}`
      )
      setSaving(null)
      return
    }

    navigate('/curator/bulletins')
  }

  if (authLoading) {
    return (
      <Container className="py-20">
        <p className="text-[11px] font-mono uppercase tracking-wider text-ink-muted" role="status">
          VERIFYING…
        </p>
      </Container>
    )
  }

  if (!isAuthenticated || !isCurator) {
    return (
      <Container className="py-20">
        <p className="mb-2 text-[10px] font-mono uppercase tracking-[0.2em] text-ink-muted">
          ACCESS DENIED
        </p>
        <h1 className="text-xl font-semibold text-ink">Curator access required</h1>
      </Container>
    )
  }

  return (
    <div className="min-h-[70vh] bg-warm-white">
      <div className="border-b border-hairline bg-warm-surface/40">
        <Container className="py-8 sm:py-12">
          <button
            type="button"
            onClick={() => navigate('/curator/bulletins')}
            className="mb-4 text-[10px] font-mono uppercase tracking-[0.16em] text-ink-muted transition-colors hover:text-ink"
          >
            ← BULLETIN ARCHIVE
          </button>
          <p className="mb-1 text-[10px] font-mono uppercase tracking-[0.22em] text-ink-muted">
            MOERI &amp; JEANNERET / CURATOR / THE BULLETIN
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            NEW BULLETIN
          </h1>
          <p className="mt-1 text-[11px] font-mono uppercase tracking-[0.14em] text-ink-muted">
            SAVE AS DRAFT OR PUBLISH
          </p>
        </Container>
      </div>

      <Container className="py-8 sm:py-10">
        <form
          noValidate
          onSubmit={(event) => event.preventDefault()}
          className="max-w-3xl space-y-6"
        >
          <div>
            <label htmlFor="bulletin-title" className="mb-1.5 block text-[10px] font-mono uppercase tracking-[0.2em] text-ink-muted">
              TITLE
            </label>
            <input
              id="bulletin-title"
              value={title}
              onChange={(event) => handleTitleChange(event.target.value)}
              aria-invalid={Boolean(fieldErrors.title)}
              aria-describedby={fieldErrors.title ? 'bulletin-title-error' : undefined}
              className="w-full border border-hairline bg-warm-white px-3 py-3 font-display text-lg text-ink placeholder:text-ink-muted/50 focus:border-ink focus:outline-none sm:text-xl"
            />
            <FieldError id="bulletin-title-error">{fieldErrors.title}</FieldError>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="bulletin-category" className="mb-1.5 block text-[10px] font-mono uppercase tracking-[0.2em] text-ink-muted">
                CATEGORY
              </label>
              <select
                id="bulletin-category"
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value as BulletinCategory | '')
                  clearFieldError('category')
                }}
                aria-invalid={Boolean(fieldErrors.category)}
                aria-describedby={fieldErrors.category ? 'bulletin-category-error' : undefined}
                className="w-full appearance-none border border-hairline bg-warm-white px-3 py-3 font-mono text-sm text-ink focus:border-ink focus:outline-none"
              >
                <option value="">Select category</option>
                {BULLETIN_CATEGORIES.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <FieldError id="bulletin-category-error">{fieldErrors.category}</FieldError>
            </div>

            <div>
              <label htmlFor="bulletin-era" className="mb-1.5 block text-[10px] font-mono uppercase tracking-[0.2em] text-ink-muted">
                ERA
              </label>
              <select
                id="bulletin-era"
                value={era}
                onChange={(event) => setEra(event.target.value as BulletinEra)}
                className="w-full appearance-none border border-hairline bg-warm-white px-3 py-3 font-mono text-sm text-ink focus:border-ink focus:outline-none"
              >
                <option value="Modern">Modern</option>
                <option value="Vintage">Vintage</option>
              </select>
            </div>

            <div>
              <label htmlFor="bulletin-slug" className="mb-1.5 block text-[10px] font-mono uppercase tracking-[0.2em] text-ink-muted">
                SLUG
              </label>
              <input
                id="bulletin-slug"
                value={slug}
                onChange={(event) => {
                  setSlugManuallyEdited(true)
                  setSlug(event.target.value)
                  clearFieldError('slug')
                }}
                aria-invalid={Boolean(fieldErrors.slug)}
                aria-describedby={fieldErrors.slug ? 'bulletin-slug-error' : undefined}
                className="w-full border border-hairline bg-warm-white px-3 py-3 font-mono text-sm text-ink placeholder:text-ink-muted/50 focus:border-ink focus:outline-none"
              />
              <FieldError id="bulletin-slug-error">{fieldErrors.slug}</FieldError>
            </div>
          </div>

          <div>
            <label htmlFor="bulletin-body" className="mb-1.5 block text-[10px] font-mono uppercase tracking-[0.2em] text-ink-muted">
              BODY
            </label>
            <textarea
              id="bulletin-body"
              value={body}
              onChange={(event) => {
                setBody(event.target.value)
                clearFieldError('body')
              }}
              rows={14}
              aria-invalid={Boolean(fieldErrors.body)}
              aria-describedby={fieldErrors.body ? 'bulletin-body-error' : undefined}
              className="w-full resize-y border border-hairline bg-warm-white px-3 py-3 font-sans text-base leading-relaxed text-ink-secondary placeholder:text-ink-muted/50 focus:border-ink focus:outline-none"
            />
            <FieldError id="bulletin-body-error">{fieldErrors.body}</FieldError>
          </div>

          {submitError && (
            <p className="border-y border-hairline py-3 text-sm text-steel-dark" role="alert">
              {submitError}
            </p>
          )}

          <div className="flex flex-col items-start gap-3 border-t border-hairline pt-6 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => handleCreate(false)}
              disabled={saving !== null}
              className="border border-ink px-6 py-3 text-[11px] font-mono uppercase tracking-[0.16em] text-ink transition-colors hover:bg-ink hover:text-warm-white disabled:opacity-40"
            >
              {saving === 'draft' ? 'SAVING…' : 'SAVE DRAFT'}
            </button>
            <button
              type="button"
              onClick={() => handleCreate(true)}
              disabled={saving !== null}
              className="border border-hairline px-6 py-3 text-[11px] font-mono uppercase tracking-[0.16em] text-ink-secondary transition-colors hover:border-ink hover:text-ink disabled:opacity-40"
            >
              {saving === 'publish' ? 'PUBLISHING…' : 'PUBLISH'}
            </button>
            <p className="text-[10px] font-mono text-ink-muted sm:ml-2">
              Bulletin number is assigned when this record is created.
            </p>
          </div>
        </form>
      </Container>
    </div>
  )
}
