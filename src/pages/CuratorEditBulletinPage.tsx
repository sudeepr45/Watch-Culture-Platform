import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import Container from '../components/common/Container'
import { BulletinCategorySelector } from '../components/bulletin/BulletinCategorySelector'
import { useAuth } from '../context/useAuth'
import { useRouter } from '../router/useRouter'
import {
  getCuratorBulletinById,
  removeBulletinImage,
  updateBulletin,
  uploadBulletinImages,
  type CuratorBulletinWithImages,
  validateBulletinPhoto,
  type BulletinPhotoUpload,
  type BulletinCategory,
  type BulletinEra,
} from '../services/curatorBulletinService'
import { fetchPublishedWatches } from '../services/watchService'
import type { Watch } from '../types/watch'

function normalizeSlug(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function FieldError({ children }: { children?: string | null }) {
  return children ? <p className="mt-1.5 text-[11px] text-steel-dark" role="alert">{children}</p> : null
}

function watchLabel(watch: Pick<Watch, 'brand' | 'model' | 'reference_number'>) {
  return `${watch.brand} ${watch.model} — ${watch.reference_number}`
}

interface PendingBulletinPhoto {
  file: File
  uploadId: string
  previewUrl: string
}

export default function CuratorEditBulletinPage({ id }: { id: string }) {
  const { isAuthenticated, isCurator, loading: authLoading } = useAuth()
  const { navigate } = useRouter()
  const [bulletin, setBulletin] = useState<CuratorBulletinWithImages | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [era, setEra] = useState<BulletinEra>('Modern')
  const [categories, setCategories] = useState<BulletinCategory[]>(['Note'])
  const [somethingElseDescription, setSomethingElseDescription] = useState('')
  const [slug, setSlug] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [relatedWatchId, setRelatedWatchId] = useState('')
  const [watches, setWatches] = useState<Watch[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmingPublish, setConfirmingPublish] = useState(false)
  const [pendingPhotos, setPendingPhotos] = useState<PendingBulletinPhoto[]>([])
  const [photoSaving, setPhotoSaving] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [confirmingImageRemovalId, setConfirmingImageRemovalId] = useState<string | null>(null)
  const [removingImageId, setRemovingImageId] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const pendingPhotosRef = useRef(pendingPhotos)

  useEffect(() => {
    pendingPhotosRef.current = pendingPhotos
  }, [pendingPhotos])

  useEffect(() => () => {
    pendingPhotosRef.current.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl))
  }, [])

  useEffect(() => {
    let active = true
    if (authLoading || !isCurator) return () => { active = false }

    Promise.all([getCuratorBulletinById(id), fetchPublishedWatches()]).then(([result, watchResult]) => {
      if (!active) return
      if (result.error) {
        setLoadError(result.error.message)
      } else if (!result.data) {
        setLoadError('This Bulletin could not be found.')
      } else {
        const record = result.data
        setBulletin(record)
        setTitle(record.title)
        setBody(record.body)
        setEra(record.era)
        setCategories(record.categories?.length ? [...record.categories] : [record.category])
        setSomethingElseDescription(record.something_else_description ?? '')
        setSlug(record.slug)
        setCoverImage(record.cover_image ?? '')
        setRelatedWatchId(record.related_watch_id ?? '')
      }
      if (watchResult.data) setWatches(watchResult.data)
      if (watchResult.error) setSaveError(`Watch options could not be loaded: ${watchResult.error.message}`)
      setLoading(false)
    }).catch((error: unknown) => {
      if (!active) return
      setLoadError(error instanceof Error ? error.message : 'Unable to load this Bulletin.')
      setLoading(false)
    })

    return () => { active = false }
  }, [authLoading, id, isCurator])

  const handleSave = async () => {
    if (saving || photoSaving || removingImageId || pendingPhotos.length > 0 || !bulletin) return
    const normalizedSlug = normalizeSlug(slug)
    if (!title.trim()) return setFieldError('Enter a title.')
    if (categories.length === 0) return setFieldError('Select at least one category.')
    if (categories.includes('Something Else') && !somethingElseDescription.trim()) {
      return setFieldError('Describe what this Bulletin is about.')
    }
    if (!normalizedSlug) return setFieldError('Enter a valid slug.')
    if (!body.trim()) return setFieldError('Enter the Bulletin body.')

    setFieldError(null)
    setSaveError(null)
    setSaving(true)
    const result = await updateBulletin(id, {
      title: title.trim(),
      body: body.trim(),
      era,
      categories,
      something_else_description: categories.includes('Something Else') ? somethingElseDescription.trim() : null,
      slug: normalizedSlug,
      cover_image: coverImage.trim() || null,
      related_watch_id: relatedWatchId || null,
    })
    if (result.error) {
      setSaveError(/duplicate key|unique constraint|bulletins_slug_key/i.test(result.error.message)
        ? 'That slug is already in use. Change the slug and try again.'
        : `Unable to save the Bulletin: ${result.error.message}`)
      setSaving(false)
      return
    }
    navigate('/curator/bulletins')
  }

  const handlePublish = async () => {
    if (saving || photoSaving || removingImageId || pendingPhotos.length > 0 || !bulletin || bulletin.published_at) return
    const normalizedSlug = normalizeSlug(slug)
    if (!title.trim()) return setFieldError('Enter a title.')
    if (categories.length === 0) return setFieldError('Select at least one category.')
    if (categories.includes('Something Else') && !somethingElseDescription.trim()) {
      return setFieldError('Describe what this Bulletin is about.')
    }
    if (!normalizedSlug) return setFieldError('Enter a valid slug.')
    if (!body.trim()) return setFieldError('Enter the Bulletin body.')

    setFieldError(null)
    setSaving(true)
    setSaveError(null)
    const result = await updateBulletin(id, {
      title: title.trim(),
      body: body.trim(),
      era,
      categories,
      something_else_description: categories.includes('Something Else') ? somethingElseDescription.trim() : null,
      slug: normalizedSlug,
      cover_image: coverImage.trim() || null,
      related_watch_id: relatedWatchId || null,
      published_at: new Date().toISOString(),
    })
    if (result.error) {
      setSaveError(`Unable to publish the Bulletin: ${result.error.message}`)
      setSaving(false)
      setConfirmingPublish(false)
      return
    }
    navigate('/curator/bulletins')
  }

  const handlePhotoSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files ?? [])
    event.currentTarget.value = ''
    const accepted: PendingBulletinPhoto[] = []
    const rejected: string[] = []
    for (const file of files) {
      const validationError = validateBulletinPhoto(file)
      if (validationError) rejected.push(`${file.name}: ${validationError}`)
      else accepted.push({ file, uploadId: crypto.randomUUID(), previewUrl: URL.createObjectURL(file) })
    }
    if (accepted.length > 0) setPendingPhotos((current) => [...current, ...accepted])
    setPhotoError(rejected.length > 0 ? rejected.join(' ') : null)
  }

  const handleRemovePendingPhoto = (previewUrl: string) => {
    URL.revokeObjectURL(previewUrl)
    setPendingPhotos((current) => current.filter((photo) => photo.previewUrl !== previewUrl))
  }

  const handleUploadPhotos = async () => {
    if (photoSaving || pendingPhotos.length === 0 || !bulletin) return
    setPhotoSaving(true)
    setPhotoError(null)
    const firstSortOrder = bulletin.images.reduce((highest, image) => Math.max(highest, image.sort_order), -1) + 1
    const uploads: BulletinPhotoUpload[] = pendingPhotos.map(({ file, uploadId }) => ({ file, uploadId }))
    const uploadResult = await uploadBulletinImages(bulletin.id, uploads, firstSortOrder)
    if (uploadResult.error) {
      setPhotoError(`Photographs could not be added: ${uploadResult.error.message}`)
      setPhotoSaving(false)
      return
    }

    const refreshed = await getCuratorBulletinById(bulletin.id)
    if (refreshed.error || !refreshed.data) {
      setPhotoError(`Photographs uploaded, but the attached images could not be reloaded: ${refreshed.error?.message ?? 'Bulletin not found.'}`)
      setPhotoSaving(false)
      return
    }

    pendingPhotos.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl))
    setPendingPhotos([])
    setBulletin(refreshed.data)
    setPhotoSaving(false)
  }

  const handleRemoveAttachedPhoto = async (imageId: string) => {
    if (!bulletin || removingImageId) return
    setRemovingImageId(imageId)
    setPhotoError(null)
    const result = await removeBulletinImage(bulletin.id, imageId)
    if (result.error) {
      setPhotoError(`Photograph could not be removed: ${result.error.message}`)
      if (result.deletionPending) {
        setBulletin((current) => current
          ? {
              ...current,
              images: current.images.map((image) => image.id === imageId
                ? { ...image, deletion_pending: true }
                : image),
            }
          : current)
      }
      setRemovingImageId(null)
      setConfirmingImageRemovalId(null)
      return
    }
    setBulletin((current) => current
      ? { ...current, images: current.images.filter((image) => image.id !== imageId) }
      : current)
    setRemovingImageId(null)
    setConfirmingImageRemovalId(null)
  }

  if (authLoading) return <Container className="py-20"><p className="text-[11px] font-mono uppercase tracking-wider text-ink-muted" role="status">VERIFYING…</p></Container>
  if (!isAuthenticated || !isCurator) {
    return <Container className="py-20"><p className="mb-2 text-[10px] font-mono uppercase tracking-[0.2em] text-ink-muted">ACCESS DENIED</p><h1 className="text-xl font-semibold text-ink">Curator access required</h1></Container>
  }

  return (
    <div className="min-h-[70vh] bg-warm-white">
      <div className="border-b border-hairline bg-warm-surface/40">
        <Container className="py-8 sm:py-12">
          <button type="button" onClick={() => navigate('/curator/bulletins')} className="mb-4 text-[10px] font-mono uppercase tracking-[0.16em] text-ink-muted hover:text-ink">← BULLETIN ARCHIVE</button>
          <p className="mb-1 text-[10px] font-mono uppercase tracking-[0.22em] text-ink-muted">MOERI &amp; JEANNERET / CURATOR / THE BULLETIN</p>
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">EDIT BULLETIN</h1>
          {bulletin && <p className="mt-1 text-[11px] font-mono uppercase tracking-[0.14em] text-ink-muted">BULLETIN NO. {String(bulletin.bulletin_number).padStart(3, '0')} · {bulletin.published_at ? 'PUBLISHED' : 'DRAFT'}</p>}
        </Container>
      </div>

      <Container className="py-8 sm:py-10">
        {loading ? <p className="text-[11px] font-mono uppercase tracking-wider text-ink-muted" role="status">LOADING BULLETIN…</p>
          : loadError ? <div className="max-w-3xl border-y border-hairline py-5"><p className="text-sm text-steel-dark" role="alert">{loadError}</p><button type="button" onClick={() => navigate('/curator/bulletins')} className="mt-4 text-[10px] font-mono uppercase tracking-[0.16em] text-ink-muted underline underline-offset-4">RETURN TO BULLETINS</button></div>
            : bulletin && <form noValidate onSubmit={(event) => event.preventDefault()} className="max-w-3xl space-y-6">
              <div>
                <label htmlFor="bulletin-title" className="mb-1.5 block text-[10px] font-mono uppercase tracking-[0.2em] text-ink-muted">TITLE</label>
                <input id="bulletin-title" value={title} onChange={(event) => setTitle(event.target.value)} className="w-full border border-hairline bg-warm-white px-3 py-3 font-display text-lg text-ink focus:border-ink focus:outline-none sm:text-xl" />
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <BulletinCategorySelector
                    selected={categories}
                    onChange={(value) => {
                      setCategories(value)
                      if (!value.includes('Something Else')) {
                        setSomethingElseDescription('')
                        if (fieldError === 'Describe what this Bulletin is about.') setFieldError(null)
                      }
                    }}
                    error={fieldError === 'Select at least one category.' ? fieldError : undefined}
                  />
                  {categories.includes('Something Else') && (
                    <div className="mt-4">
                      <label htmlFor="bulletin-something-else-description" className="mb-1.5 block text-[10px] font-mono uppercase tracking-[0.2em] text-ink-muted">
                        What is this Bulletin about?
                      </label>
                      <textarea
                        id="bulletin-something-else-description"
                        value={somethingElseDescription}
                        onChange={(event) => {
                          setSomethingElseDescription(event.target.value)
                          if (fieldError === 'Describe what this Bulletin is about.') setFieldError(null)
                        }}
                        rows={2}
                        placeholder="Briefly describe this category..."
                        aria-invalid={fieldError === 'Describe what this Bulletin is about.'}
                        className="w-full resize-y border border-hairline bg-warm-white px-3 py-2.5 font-sans text-sm leading-relaxed text-ink-secondary placeholder:text-ink-muted/50 focus:border-ink focus:outline-none"
                      />
                      {fieldError === 'Describe what this Bulletin is about.' && <FieldError>{fieldError}</FieldError>}
                    </div>
                  )}
                </div>
                <div>
                  <label htmlFor="bulletin-era" className="mb-1.5 block text-[10px] font-mono uppercase tracking-[0.2em] text-ink-muted">ERA</label>
                  <select id="bulletin-era" value={era} onChange={(event) => setEra(event.target.value as BulletinEra)} className="w-full appearance-none border border-hairline bg-warm-white px-3 py-3 font-mono text-sm text-ink focus:border-ink focus:outline-none"><option value="Modern">Modern</option><option value="Vintage">Vintage</option></select>
                </div>
                <div>
                  <label htmlFor="bulletin-slug" className="mb-1.5 block text-[10px] font-mono uppercase tracking-[0.2em] text-ink-muted">SLUG</label>
                  <input id="bulletin-slug" value={slug} onChange={(event) => setSlug(event.target.value)} className="w-full border border-hairline bg-warm-white px-3 py-3 font-mono text-sm text-ink focus:border-ink focus:outline-none" />
                </div>
                <div>
                  <label htmlFor="bulletin-related-watch" className="mb-1.5 block text-[10px] font-mono uppercase tracking-[0.2em] text-ink-muted">RELATED WATCH</label>
                  <select id="bulletin-related-watch" value={relatedWatchId} onChange={(event) => setRelatedWatchId(event.target.value)} className="w-full appearance-none border border-hairline bg-warm-white px-3 py-3 font-mono text-sm text-ink focus:border-ink focus:outline-none">
                    <option value="">None</option>
                    {bulletin.related_watch && !watches.some((watch) => watch.id === bulletin.related_watch?.id) && <option value={bulletin.related_watch.id}>{watchLabel(bulletin.related_watch)}</option>}
                    {watches.map((watch) => <option key={watch.id} value={watch.id}>{watchLabel(watch)}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="bulletin-cover-image" className="mb-1.5 block text-[10px] font-mono uppercase tracking-[0.2em] text-ink-muted">COVER IMAGE URL</label>
                  <input id="bulletin-cover-image" type="url" value={coverImage} onChange={(event) => setCoverImage(event.target.value)} className="w-full border border-hairline bg-warm-white px-3 py-3 font-mono text-sm text-ink focus:border-ink focus:outline-none" />
                </div>
              </div>
              <section className="border border-hairline bg-warm-surface/20 p-5 sm:p-6" aria-labelledby="bulletin-existing-photos-heading">
                <div className="mb-4 border-b border-hairline pb-3">
                  <h2 id="bulletin-existing-photos-heading" className="text-[10px] font-mono uppercase tracking-[0.2em] text-ink-muted">ATTACHED PHOTOGRAPHS</h2>
                  <p className="mt-1 text-xs text-ink-secondary">Existing photographs remain attached when this Bulletin is published.</p>
                </div>
                <label htmlFor="bulletin-add-photos" className="inline-flex cursor-pointer border border-ink px-4 py-3 text-[10px] font-mono uppercase tracking-[0.16em] text-ink transition-colors hover:bg-ink hover:text-warm-white">
                  ADD PHOTOGRAPHS
                </label>
                <input
                  ref={photoInputRef}
                  id="bulletin-add-photos"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  disabled={photoSaving || saving || removingImageId !== null}
                  onChange={handlePhotoSelect}
                  className="sr-only"
                  aria-label="Add Bulletin photographs"
                />
                {bulletin.images.length > 0 ? (
                  <ol className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {bulletin.images.map((image, index) => (
                      <li key={image.id} className="border border-hairline bg-warm-white p-2">
                        {image.signed_url ? (
                          <img src={image.signed_url} alt={`Bulletin photograph ${index + 1}`} className="aspect-square w-full border border-hairline object-cover" />
                        ) : (
                          <div className="flex aspect-square w-full items-center justify-center border border-hairline bg-warm-surface/40 px-3 text-center text-[10px] font-mono uppercase tracking-[0.12em] text-ink-muted">
                            {image.deletion_pending && image.storage_object_exists === false ? 'FILE ALREADY REMOVED' : 'PREVIEW UNAVAILABLE'}
                          </div>
                        )}
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <div>
                            <p className="text-[9px] font-mono uppercase tracking-[0.12em] text-ink-muted">PHOTO {String(index + 1).padStart(2, '0')}</p>
                            {image.deletion_pending && <p className="mt-1 text-[9px] font-mono uppercase tracking-[0.1em] text-steel-dark">REMOVAL PENDING</p>}
                          </div>
                          <button
                            type="button"
                            onClick={() => { setConfirmingImageRemovalId(image.id); setPhotoError(null) }}
                            disabled={photoSaving || saving || removingImageId !== null}
                            className="border border-hairline px-2 py-1.5 text-[9px] font-mono uppercase tracking-[0.1em] text-steel-dark transition-colors hover:border-steel hover:text-ink disabled:opacity-40"
                          >
                            {image.deletion_pending ? 'RETRY REMOVE' : 'REMOVE'}
                          </button>
                        </div>
                        {confirmingImageRemovalId === image.id && (
                          <div className="mt-2 border-t border-hairline pt-2" role="group" aria-label={`Confirm removal of photograph ${index + 1}`}>
                            <p className="text-[10px] leading-relaxed text-ink-secondary">{image.deletion_pending ? 'Retry removal. The attachment will remain until Storage and database state are reconciled.' : 'Remove this photograph and its stored file?'}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <button type="button" onClick={() => handleRemoveAttachedPhoto(image.id)} disabled={photoSaving || saving || removingImageId !== null} className="border border-ink bg-ink px-2 py-1.5 text-[9px] font-mono uppercase tracking-[0.1em] text-warm-white disabled:opacity-50">
                                {removingImageId === image.id ? 'REMOVING…' : 'CONFIRM REMOVE'}
                              </button>
                              <button type="button" onClick={() => setConfirmingImageRemovalId(null)} disabled={photoSaving || saving || removingImageId !== null} className="px-2 py-1.5 text-[9px] font-mono uppercase tracking-[0.1em] text-ink-muted hover:text-ink disabled:opacity-50">CANCEL</button>
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-ink-muted">No attached photographs.</p>
                )}
                {pendingPhotos.length > 0 && (
                  <div className="mt-5 border-t border-hairline pt-4">
                    <p className="mb-3 text-[10px] font-mono uppercase tracking-[0.16em] text-ink-muted">READY TO UPLOAD</p>
                    <ol className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                      {pendingPhotos.map(({ file, previewUrl }, index) => (
                        <li key={previewUrl} className="border border-hairline bg-warm-white p-2">
                          <img src={previewUrl} alt={`New Bulletin photograph ${index + 1}`} className="aspect-square w-full border border-hairline object-cover" />
                          <p className="mt-2 break-all text-[9px] font-mono text-ink-secondary">{file.name}</p>
                          <button type="button" onClick={() => handleRemovePendingPhoto(previewUrl)} disabled={photoSaving} className="mt-2 text-[9px] font-mono uppercase tracking-[0.1em] text-ink-muted underline underline-offset-4 hover:text-ink disabled:opacity-40">REMOVE FROM SELECTION</button>
                        </li>
                      ))}
                    </ol>
                    <button type="button" onClick={handleUploadPhotos} disabled={photoSaving || saving} className="mt-4 border border-ink px-4 py-2.5 text-[10px] font-mono uppercase tracking-[0.14em] text-ink transition-colors hover:bg-ink hover:text-warm-white disabled:opacity-40">
                      {photoSaving ? 'UPLOADING PHOTOGRAPHS…' : 'UPLOAD SELECTED PHOTOGRAPHS'}
                    </button>
                    <p className="mt-2 text-[10px] text-ink-muted">Save or publish after the selected photographs finish uploading.</p>
                  </div>
                )}
                {photoError && <p className="mt-4 border-y border-hairline py-3 text-xs leading-relaxed text-steel-dark" role="alert">{photoError}</p>}
              </section>
              <div>
                <label htmlFor="bulletin-body" className="mb-1.5 block text-[10px] font-mono uppercase tracking-[0.2em] text-ink-muted">BODY</label>
                <textarea id="bulletin-body" value={body} onChange={(event) => setBody(event.target.value)} rows={14} className="w-full resize-y border border-hairline bg-warm-white px-3 py-3 font-sans text-base leading-relaxed text-ink-secondary focus:border-ink focus:outline-none" />
                <FieldError>{fieldError === 'Select at least one category.' || fieldError === 'Describe what this Bulletin is about.' ? undefined : fieldError}</FieldError>
              </div>
              {saveError && <p className="border-y border-hairline py-3 text-sm text-steel-dark" role="alert">{saveError}</p>}
              <div className="flex flex-col items-start gap-3 border-t border-hairline pt-6 sm:flex-row sm:items-center">
                <button type="button" onClick={handleSave} disabled={saving || photoSaving || removingImageId !== null || pendingPhotos.length > 0} className="border border-ink px-6 py-3 text-[11px] font-mono uppercase tracking-[0.16em] text-ink transition-colors hover:bg-ink hover:text-warm-white disabled:opacity-40">{saving ? 'SAVING…' : 'SAVE CHANGES'}</button>
                <p className="text-[10px] font-mono text-ink-muted">Publication status and existing photographs are preserved.</p>
                {!bulletin.published_at && (
                  <button type="button" onClick={() => { setConfirmingPublish(true); setSaveError(null) }} disabled={saving || photoSaving || removingImageId !== null || pendingPhotos.length > 0} className="border border-hairline px-6 py-3 text-[11px] font-mono uppercase tracking-[0.16em] text-ink-secondary transition-colors hover:border-ink hover:text-ink disabled:opacity-40">PUBLISH</button>
                )}
              </div>
              {confirmingPublish && !bulletin.published_at && (
                <div className="border-y border-hairline py-4" role="group" aria-label="Confirm Bulletin publishing">
                  <p className="text-sm text-ink-secondary">Publish this Bulletin now? Its existing text and photographs will remain attached.</p>
                  <div className="mt-3 flex items-center gap-3">
                    <button type="button" onClick={handlePublish} disabled={saving || photoSaving || removingImageId !== null || pendingPhotos.length > 0} className="border border-ink bg-ink px-4 py-2.5 text-[10px] font-mono uppercase tracking-[0.14em] text-warm-white transition-colors hover:bg-neutral-800 disabled:opacity-50">{saving ? 'PUBLISHING…' : 'Confirm publish'}</button>
                    <button type="button" onClick={() => setConfirmingPublish(false)} disabled={saving || photoSaving || removingImageId !== null} className="px-2 py-2.5 text-[10px] font-mono uppercase tracking-[0.14em] text-ink-muted hover:text-ink disabled:opacity-50">Cancel</button>
                  </div>
                </div>
              )}
            </form>}
      </Container>
    </div>
  )
}
