import { useEffect, useState } from 'react'
import Container from '../components/common/Container'
import { useAuth } from '../context/useAuth'
import { useRouter } from '../router/useRouter'
import {
  getCuratorBulletinById,
  updateBulletin,
  type BulletinCategory,
  type BulletinEra,
} from '../services/curatorBulletinService'
import type { BulletinWithRelatedWatch } from '../services/bulletinService'
import { fetchPublishedWatches } from '../services/watchService'
import type { Watch } from '../types/watch'

const BULLETIN_CATEGORIES: BulletinCategory[] = ['Market', 'Auction', 'Release', 'History', 'Note']

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

export default function CuratorEditBulletinPage({ id }: { id: string }) {
  const { isAuthenticated, isCurator, loading: authLoading } = useAuth()
  const { navigate } = useRouter()
  const [bulletin, setBulletin] = useState<BulletinWithRelatedWatch | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [era, setEra] = useState<BulletinEra>('Modern')
  const [category, setCategory] = useState<BulletinCategory>('Note')
  const [slug, setSlug] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [relatedWatchId, setRelatedWatchId] = useState('')
  const [watches, setWatches] = useState<Watch[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

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
        setCategory(record.category)
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
    if (saving || !bulletin) return
    const normalizedSlug = normalizeSlug(slug)
    if (!title.trim()) return setFieldError('Enter a title.')
    if (!BULLETIN_CATEGORIES.includes(category)) return setFieldError('Select a valid category.')
    if (!normalizedSlug) return setFieldError('Enter a valid slug.')
    if (!body.trim()) return setFieldError('Enter the Bulletin body.')

    setFieldError(null)
    setSaveError(null)
    setSaving(true)
    const result = await updateBulletin(id, {
      title: title.trim(),
      body: body.trim(),
      era,
      category,
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
                  <label htmlFor="bulletin-category" className="mb-1.5 block text-[10px] font-mono uppercase tracking-[0.2em] text-ink-muted">CATEGORY</label>
                  <select id="bulletin-category" value={category} onChange={(event) => setCategory(event.target.value as BulletinCategory)} className="w-full appearance-none border border-hairline bg-warm-white px-3 py-3 font-mono text-sm text-ink focus:border-ink focus:outline-none">{BULLETIN_CATEGORIES.map((option) => <option key={option}>{option}</option>)}</select>
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
              <div>
                <label htmlFor="bulletin-body" className="mb-1.5 block text-[10px] font-mono uppercase tracking-[0.2em] text-ink-muted">BODY</label>
                <textarea id="bulletin-body" value={body} onChange={(event) => setBody(event.target.value)} rows={14} className="w-full resize-y border border-hairline bg-warm-white px-3 py-3 font-sans text-base leading-relaxed text-ink-secondary focus:border-ink focus:outline-none" />
                <FieldError>{fieldError}</FieldError>
              </div>
              {saveError && <p className="border-y border-hairline py-3 text-sm text-steel-dark" role="alert">{saveError}</p>}
              <div className="flex flex-col items-start gap-3 border-t border-hairline pt-6 sm:flex-row sm:items-center">
                <button type="button" onClick={handleSave} disabled={saving} className="border border-ink px-6 py-3 text-[11px] font-mono uppercase tracking-[0.16em] text-ink transition-colors hover:bg-ink hover:text-warm-white disabled:opacity-40">{saving ? 'SAVING…' : 'SAVE CHANGES'}</button>
                <p className="text-[10px] font-mono text-ink-muted">Publication status and existing photographs are preserved.</p>
              </div>
            </form>}
      </Container>
    </div>
  )
}
