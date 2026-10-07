import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import Container from '../components/common/Container'
import { useAuth } from '../context/useAuth'
import { useRouter } from '../router/useRouter'
import {
  createBulletin,
  uploadBulletinImages,
  validateBulletinPhoto,
  type BulletinPhotoUpload,
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

interface SelectedBulletinPhoto {
  file: File
  uploadId: string
  previewUrl: string
}

function formatFileSize(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

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
  const [selectedPhotos, setSelectedPhotos] = useState<SelectedBulletinPhoto[]>([])
  const [photoSelectionError, setPhotoSelectionError] = useState<string | null>(null)
  const [savedBulletinId, setSavedBulletinId] = useState<string | null>(null)
  const [savedBulletinAction, setSavedBulletinAction] = useState<'draft' | 'publish'>('draft')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState<'draft' | 'publish' | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const selectedPhotosRef = useRef(selectedPhotos)

  useEffect(() => {
    selectedPhotosRef.current = selectedPhotos
  }, [selectedPhotos])

  useEffect(() => () => {
    selectedPhotosRef.current.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl))
  }, [])

  const handlePhotoSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files ?? [])
    event.currentTarget.value = ''

    const accepted: SelectedBulletinPhoto[] = []
    const rejected: string[] = []
    for (const file of files) {
      const validationError = validateBulletinPhoto(file)
      if (validationError) rejected.push(`${file.name}: ${validationError}`)
      else accepted.push({ file, uploadId: crypto.randomUUID(), previewUrl: URL.createObjectURL(file) })
    }

    if (accepted.length > 0) setSelectedPhotos((current) => [...current, ...accepted])
    setPhotoSelectionError(rejected.length > 0 ? rejected.join(' ') : null)
  }

  const handleRemovePhoto = (previewUrl: string) => {
    URL.revokeObjectURL(previewUrl)
    setSelectedPhotos((current) => current.filter((photo) => photo.previewUrl !== previewUrl))
  }

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

    if (savedBulletinId) {
      if (selectedPhotos.length === 0) {
        navigate('/curator/bulletins')
        return
      }

      setSaving(savedBulletinAction)
      setSubmitError(null)
      const uploadResult = await uploadBulletinImages(
        savedBulletinId,
        selectedPhotos.map(({ file, uploadId }) => ({ file, uploadId } satisfies BulletinPhotoUpload))
      )
      if (uploadResult.error) {
        setSubmitError(`Bulletin saved, but photo upload failed: ${uploadResult.error.message}`)
        setSaving(null)
        return
      }
      navigate('/curator/bulletins')
      return
    }

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

    if (!result.data?.id) {
      setSubmitError('Bulletin was not returned after saving. Photos were not uploaded.')
      setSaving(null)
      return
    }

    setSavedBulletinId(result.data.id)
    setSavedBulletinAction(publish ? 'publish' : 'draft')

    if (selectedPhotos.length > 0) {
      const uploadResult = await uploadBulletinImages(
        result.data.id,
        selectedPhotos.map(({ file, uploadId }) => ({ file, uploadId } satisfies BulletinPhotoUpload))
      )
      if (uploadResult.error) {
        setSubmitError(`Bulletin saved, but photo upload failed: ${uploadResult.error.message}`)
        setSaving(null)
        return
      }
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

          <section className="border border-hairline bg-warm-surface/20 p-5 sm:p-6" aria-labelledby="bulletin-photos-heading">
            <div className="mb-4 border-b border-hairline pb-3">
              <h2 id="bulletin-photos-heading" className="text-[10px] font-mono uppercase tracking-[0.2em] text-ink-muted">
                PHOTOS
              </h2>
              <p className="mt-1 text-xs text-ink-secondary">
                JPEG, PNG, or WebP. Maximum 10 MB per image.
              </p>
            </div>
            <label
              htmlFor="bulletin-photos"
              className="inline-flex cursor-pointer border border-ink px-4 py-3 text-[10px] font-mono uppercase tracking-[0.16em] text-ink transition-colors hover:bg-ink hover:text-warm-white"
            >
              SELECT PHOTOGRAPHS
            </label>
            <input
              ref={photoInputRef}
              id="bulletin-photos"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={savedBulletinId !== null || saving !== null}
              onChange={handlePhotoSelect}
              className="sr-only"
              aria-label="Select multiple Bulletin photographs"
            />

            {selectedPhotos.length > 0 && (
              <ol className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {selectedPhotos.map(({ file, previewUrl }, index) => (
                  <li key={previewUrl} className="flex gap-3 border border-hairline bg-warm-white p-3">
                    <img
                      src={previewUrl}
                      alt={`Selected Bulletin photograph ${index + 1}`}
                      className="h-24 w-28 shrink-0 border border-hairline object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="break-all text-xs font-mono text-ink">{file.name}</p>
                      <p className="mt-1 text-[10px] font-mono text-ink-muted">{formatFileSize(file.size)}</p>
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(previewUrl)}
                        disabled={savedBulletinId !== null || saving !== null}
                        className="mt-3 text-[10px] font-mono uppercase tracking-[0.14em] text-ink-muted underline underline-offset-4 hover:text-ink"
                      >
                        REMOVE
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
            )}

            {photoSelectionError && (
              <p className="mt-4 border-y border-hairline py-3 text-xs leading-relaxed text-steel-dark" role="alert">
                {photoSelectionError} Invalid images were not added.
              </p>
            )}
          </section>

          {submitError && (
            <p className="border-y border-hairline py-3 text-sm text-steel-dark" role="alert">
              {submitError}
            </p>
          )}

          <div className="flex flex-col items-start gap-3 border-t border-hairline pt-6 sm:flex-row sm:items-center">
            {savedBulletinId && selectedPhotos.length > 0 && (
              <button
                type="button"
                onClick={() => handleCreate(savedBulletinAction === 'publish')}
                disabled={saving !== null}
                className="border border-ink px-6 py-3 text-[11px] font-mono uppercase tracking-[0.16em] text-ink transition-colors hover:bg-ink hover:text-warm-white disabled:opacity-40"
              >
                {saving ? 'UPLOADING PHOTOS…' : 'RETRY PHOTO UPLOAD'}
              </button>
            )}
            {savedBulletinId && selectedPhotos.length === 0 && (
              <button
                type="button"
                onClick={() => navigate('/curator/bulletins')}
                className="border border-ink px-6 py-3 text-[11px] font-mono uppercase tracking-[0.16em] text-ink transition-colors hover:bg-ink hover:text-warm-white"
              >
                RETURN TO BULLETINS
              </button>
            )}
            {!savedBulletinId && <>
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
            </>}
            <p className="text-[10px] font-mono text-ink-muted sm:ml-2">
              {savedBulletinId
                ? 'Bulletin saved. Photo retries will not create another Bulletin.'
                : 'Bulletin number is assigned when this record is created.'}
            </p>
          </div>
        </form>
      </Container>
    </div>
  )
}
