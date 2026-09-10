import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/useAuth'
import { useRouter } from '../router/useRouter'
import Container from '../components/common/Container'
import WatchImage from '../components/common/WatchImage'
import {
  curatorFetchWatchBySlug,
  curatorUpdateWatch,
  uploadArchivePhoto,
  validateArchivePhoto,
  curatorPublishWatch,
  curatorUnpublishWatch,
  curatorArchiveWatch,
} from '../services/curatorWatchService'
import type { Watch } from '../types/watch'

// ------------------------------------------------------------------
// Re-use atomic components
// ------------------------------------------------------------------

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase mb-1.5">
      {children}
    </label>
  )
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  step,
  min,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  step?: string
  min?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      step={step}
      min={min}
      className="w-full bg-warm-white border border-hairline px-3 py-2.5 text-sm text-ink font-mono placeholder:text-ink-muted/50 focus:outline-none focus:border-ink transition-colors"
    />
  )
}

function SelectInput({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder?: string
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-warm-white border border-hairline px-3 py-2.5 text-sm text-ink font-mono focus:outline-none focus:border-ink transition-colors appearance-none"
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  )
}

function TextAreaInput({
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-warm-white border border-hairline px-3 py-2.5 text-sm text-ink font-mono placeholder:text-ink-muted/50 focus:outline-none focus:border-ink transition-colors resize-none"
    />
  )
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 py-2">
      <div className="flex-grow border-t border-hairline" />
      <span className="text-[9px] font-mono tracking-[0.22em] text-ink-muted uppercase flex-shrink-0">
        {label}
      </span>
      <div className="flex-grow border-t border-hairline" />
    </div>
  )
}

// ------------------------------------------------------------------
// Main page
// ------------------------------------------------------------------
export default function CuratorEditWatchPage({ slug }: { slug: string }) {
  const { isAuthenticated, isCurator, loading: authLoading } = useAuth()
  const { navigate } = useRouter()

  const [watch, setWatch] = useState<Watch | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Form fields — initialized from DB record
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [reference, setReference] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [movementType, setMovementType] = useState('')
  const [movementName, setMovementName] = useState('')
  const [calibre, setCalibre] = useState('')
  const [caseDiameter, setCaseDiameter] = useState('')
  const [caseThickness, setCaseThickness] = useState('')
  const [lugToLug, setLugToLug] = useState('')
  const [caseMaterial, setCaseMaterial] = useState('')
  const [crystal, setCrystal] = useState('')
  const [waterResistance, setWaterResistance] = useState('')
  const [powerReserve, setPowerReserve] = useState('')
  const [bracelet, setBracelet] = useState('')
  const [releaseYear, setReleaseYear] = useState('')
  const [category, setCategory] = useState('')
  const [style, setStyle] = useState('')

  // Photo
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null)
  const [newPreviewUrl, setNewPreviewUrl] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState<
    'idle' | 'uploading' | 'done' | 'error'
  >('idle')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Provenance
  const [photoSourceName, setPhotoSourceName] = useState('')
  const [photoSourceUrl, setPhotoSourceUrl] = useState('')
  const [photoVerificationStatus, setPhotoVerificationStatus] = useState<'pending' | 'verified'>('pending')
  const [photoUsageNote, setPhotoUsageNote] = useState('')

  // Save / lifecycle
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [lifecycleLoading, setLifecycleLoading] = useState(false)
  const [lifecycleError, setLifecycleError] = useState<string | null>(null)

  // Load watch on mount
  useEffect(() => {
    if (authLoading || !isCurator) return

    const load = async () => {
      setLoading(true)
      setLoadError(null)
      const result = await curatorFetchWatchBySlug(slug)
      if (result.error || !result.data) {
        setLoadError(result.error?.message || 'Watch not found.')
        setLoading(false)
        return
      }

      const w = result.data
      setWatch(w)
      setBrand(w.brand || '')
      setModel(w.model || '')
      setReference(w.reference_number || '')
      setDescription(w.description || '')
      setPrice(w.price != null ? String(w.price) : '')
      setCurrency(w.currency || 'USD')
      setMovementType(w.movement_type || '')
      setMovementName(w.movement_name || '')
      setCalibre(w.calibre || '')
      setCaseDiameter(w.case_diameter_mm != null ? String(w.case_diameter_mm) : '')
      setCaseThickness(w.case_thickness_mm != null ? String(w.case_thickness_mm) : '')
      setLugToLug(w.lug_to_lug_mm != null ? String(w.lug_to_lug_mm) : '')
      setCaseMaterial(w.case_material || '')
      setCrystal(w.crystal || '')
      setWaterResistance(w.water_resistance_m != null ? String(w.water_resistance_m) : '')
      setPowerReserve(w.power_reserve_hours != null ? String(w.power_reserve_hours) : '')
      setBracelet(w.bracelet_or_strap || '')
      setReleaseYear(w.release_year != null ? String(w.release_year) : '')
      setCategory(w.category || '')
      setStyle(w.style || '')
      setCurrentImageUrl(w.image_url || null)
      setPhotoSourceName(w.image_source_name || '')
      setPhotoSourceUrl(w.image_source_url || '')
      setPhotoVerificationStatus((w.image_verification_status as 'pending' | 'verified') || 'pending')
      setPhotoUsageNote(w.image_usage_note || '')
      setLoading(false)
    }

    load()
  }, [slug, authLoading, isCurator])

  // File selection for replacement photo
  const handleFileSelect = useCallback((file: File) => {
    const err = validateArchivePhoto(file)
    if (err) {
      setUploadError(err)
      return
    }
    setUploadError(null)
    setPendingFile(file)
    setNewPreviewUrl(URL.createObjectURL(file))
    setUploadProgress('idle')
  }, [])

  // Save edits
  const handleSave = async () => {
    if (!watch) return
    setSaving(true)
    setSaveError(null)

    let finalImageUrl = currentImageUrl

    // Upload new photo if selected
    if (pendingFile && uploadProgress !== 'done') {
      setUploadProgress('uploading')
      const uploadResult = await uploadArchivePhoto(pendingFile, slug)
      if (uploadResult.error) {
        setSaveError(`Photograph upload failed: ${uploadResult.error.message}`)
        setUploadProgress('error')
        setSaving(false)
        return
      }
      finalImageUrl = uploadResult.publicUrl
      setCurrentImageUrl(finalImageUrl)
      setUploadProgress('done')
    }

    const result = await curatorUpdateWatch(watch.id, {
      brand,
      model,
      reference_number: reference,
      description: description || null,
      price: price ? parseFloat(price) : null,
      currency: currency || 'USD',
      movement_type: movementType || null,
      movement_name: movementName || null,
      calibre: calibre || null,
      case_diameter_mm: caseDiameter ? parseFloat(caseDiameter) : null,
      case_thickness_mm: caseThickness ? parseFloat(caseThickness) : null,
      lug_to_lug_mm: lugToLug ? parseFloat(lugToLug) : null,
      case_material: caseMaterial || null,
      crystal: crystal || null,
      water_resistance_m: waterResistance ? parseFloat(waterResistance) : null,
      power_reserve_hours: powerReserve ? parseFloat(powerReserve) : null,
      bracelet_or_strap: bracelet || null,
      release_year: releaseYear ? parseInt(releaseYear) : null,
      category: category || null,
      style: style || null,
      image_url: finalImageUrl,
      image_source_name: photoSourceName || null,
      image_source_url: photoSourceUrl || null,
      image_verification_status: photoVerificationStatus,
      image_usage_note: photoUsageNote || null,
    })

    if (result.error) {
      setSaveError(result.error.message)
    } else {
      setWatch(result.data)
      navigate('/curator')
    }

    setSaving(false)
  }

  // Lifecycle transitions
  const handleLifecycle = async (
    action: 'publish' | 'unpublish' | 'archive'
  ) => {
    if (!watch) return
    setLifecycleLoading(true)
    setLifecycleError(null)

    let result
    if (action === 'publish') result = await curatorPublishWatch(watch.id)
    else if (action === 'unpublish') result = await curatorUnpublishWatch(watch.id)
    else result = await curatorArchiveWatch(watch.id)

    if (result.error) {
      setLifecycleError(result.error.message)
    } else {
      setWatch(result.data)
    }
    setLifecycleLoading(false)
  }

  // ------------------------------------------------------------------
  // Auth gate
  // ------------------------------------------------------------------
  if (authLoading) {
    return (
      <Container className="py-20">
        <p className="text-[11px] font-mono tracking-wider text-ink-muted uppercase">
          VERIFYING…
        </p>
      </Container>
    )
  }

  if (!isAuthenticated || !isCurator) {
    return (
      <Container className="py-20">
        <p className="text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase mb-2">
          ACCESS DENIED
        </p>
        <h1 className="text-xl font-semibold text-ink">Curator access required</h1>
      </Container>
    )
  }

  if (loading) {
    return (
      <Container className="py-20">
        <p className="text-[11px] font-mono tracking-wider text-ink-muted uppercase">
          LOADING RECORD…
        </p>
      </Container>
    )
  }

  if (loadError || !watch) {
    return (
      <Container className="py-20">
        <p className="text-[10px] font-mono tracking-wider text-ink-muted uppercase mb-2">
          NOT FOUND
        </p>
        <p className="text-sm text-ink-secondary mb-4">{loadError}</p>
        <button
          onClick={() => navigate('/curator')}
          className="text-[11px] font-mono tracking-[0.14em] uppercase px-4 py-2 border border-hairline text-ink-secondary hover:text-ink hover:border-ink transition-colors"
        >
          ← ARCHIVE
        </button>
      </Container>
    )
  }

  const displayImageUrl = newPreviewUrl || currentImageUrl

  return (
    <div className="min-h-[70vh] bg-warm-white">
      {/* Header */}
      <div className="border-b border-hairline bg-warm-surface/40">
        <Container className="py-8 sm:py-12">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate('/curator')}
              className="text-[10px] font-mono tracking-[0.16em] text-ink-muted uppercase hover:text-ink transition-colors"
            >
              ← ARCHIVE
            </button>
          </div>
          <p className="text-[10px] font-mono tracking-[0.22em] text-ink-muted uppercase mb-1">
            MOERI &amp; JEANNERET / CURATOR / EDIT
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
            {watch.brand} {watch.model}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[11px] font-mono tracking-wider text-ink-muted uppercase">
              {watch.reference_number}
            </span>
            <span className="text-hairline">·</span>
            <span
              className={`text-[11px] font-mono tracking-[0.14em] uppercase ${
                watch.status === 'published'
                  ? 'text-ink'
                  : watch.status === 'archived'
                    ? 'text-ink-muted'
                    : 'text-steel'
              }`}
            >
              {watch.status.toUpperCase()}
            </span>
          </div>
        </Container>
      </div>

      <Container className="py-10">
        <div className="max-w-3xl">
          {/* Lifecycle controls */}
          <div className="flex items-center gap-2 mb-8 pb-6 border-b border-hairline flex-wrap">
            <span className="text-[10px] font-mono tracking-[0.18em] text-ink-muted uppercase mr-2">
              STATUS
            </span>

            {watch.status !== 'published' && (
              <button
                onClick={() => handleLifecycle('publish')}
                disabled={lifecycleLoading}
                className="text-[10px] font-mono tracking-[0.14em] uppercase px-3 py-1.5 border border-ink text-ink hover:bg-ink hover:text-warm-white transition-colors disabled:opacity-40"
              >
                PUBLISH
              </button>
            )}
            {watch.status === 'published' && (
              <button
                onClick={() => handleLifecycle('unpublish')}
                disabled={lifecycleLoading}
                className="text-[10px] font-mono tracking-[0.14em] uppercase px-3 py-1.5 border border-hairline text-ink-secondary hover:border-ink hover:text-ink transition-colors disabled:opacity-40"
              >
                REVERT TO DRAFT
              </button>
            )}
            {watch.status !== 'archived' && (
              <button
                onClick={() => handleLifecycle('archive')}
                disabled={lifecycleLoading}
                className="text-[10px] font-mono tracking-[0.14em] uppercase px-3 py-1.5 border border-hairline text-ink-muted hover:border-steel hover:text-steel transition-colors disabled:opacity-40"
              >
                ARCHIVE
              </button>
            )}
            {watch.status === 'archived' && (
              <button
                onClick={() => handleLifecycle('unpublish')}
                disabled={lifecycleLoading}
                className="text-[10px] font-mono tracking-[0.14em] uppercase px-3 py-1.5 border border-hairline text-ink-secondary hover:border-ink hover:text-ink transition-colors disabled:opacity-40"
              >
                RESTORE TO DRAFT
              </button>
            )}

            {lifecycleError && (
              <p className="text-[10px] font-mono text-steel-dark">{lifecycleError}</p>
            )}
          </div>

          {/* Photo + Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-[280px_1fr] gap-8 mb-10">
            {/* Photo */}
            <div>
              <FieldLabel>PHOTOGRAPH</FieldLabel>
              <div className="border border-hairline overflow-hidden aspect-[4/3] bg-warm-surface mb-3">
                <WatchImage
                  src={displayImageUrl}
                  alt={`${watch.brand} ${watch.model}`}
                  aspectRatio="aspect-[4/3]"
                />
              </div>

              {/* Replace photo */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-hairline px-4 py-4 text-center cursor-pointer hover:border-steel transition-colors"
              >
                <p className="text-[11px] font-mono tracking-[0.12em] text-ink-secondary uppercase">
                  {uploadProgress === 'uploading'
                    ? 'UPLOADING…'
                    : pendingFile
                      ? 'CHANGE SELECTION'
                      : 'REPLACE PHOTOGRAPH'}
                </p>
                <p className="text-[10px] font-mono text-ink-muted mt-0.5">
                  JPEG · PNG · WebP · Max 10 MB
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileSelect(file)
                }}
                className="hidden"
              />

              {uploadError && (
                <p className="text-[11px] font-mono text-steel-dark mt-2">{uploadError}</p>
              )}

              {pendingFile && (
                <p className="text-[10px] font-mono text-ink-secondary mt-2">
                  New photo will be uploaded when you save.
                </p>
              )}

              {/* Provenance */}
              <div className="mt-6 space-y-3 pt-6 border-t border-hairline">
                <p className="text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase">
                  PROVENANCE
                </p>
                <div>
                  <FieldLabel>SOURCE</FieldLabel>
                  <TextInput
                    value={photoSourceName}
                    onChange={setPhotoSourceName}
                    placeholder="e.g. Wikimedia Commons"
                  />
                </div>
                <div>
                  <FieldLabel>SOURCE URL</FieldLabel>
                  <TextInput
                    value={photoSourceUrl}
                    onChange={setPhotoSourceUrl}
                    placeholder="https://…"
                  />
                </div>
                <div>
                  <FieldLabel>USAGE / LICENSE</FieldLabel>
                  <TextInput
                    value={photoUsageNote}
                    onChange={setPhotoUsageNote}
                    placeholder="e.g. CC BY-SA 4.0 — Author Name"
                  />
                </div>
                <div>
                  <FieldLabel>VERIFICATION</FieldLabel>
                  <SelectInput
                    value={photoVerificationStatus}
                    onChange={(v) =>
                      setPhotoVerificationStatus(v as 'pending' | 'verified')
                    }
                    options={['pending', 'verified']}
                  />
                </div>
              </div>
            </div>

            {/* Identity */}
            <div className="space-y-4">
              <div>
                <FieldLabel>BRAND</FieldLabel>
                <TextInput value={brand} onChange={setBrand} placeholder="e.g. Rolex" />
              </div>
              <div>
                <FieldLabel>MODEL</FieldLabel>
                <TextInput value={model} onChange={setModel} placeholder="e.g. Submariner Date" />
              </div>
              <div>
                <FieldLabel>REFERENCE</FieldLabel>
                <TextInput value={reference} onChange={setReference} placeholder="e.g. 126610LN" />
              </div>
              <div>
                <FieldLabel>SLUG</FieldLabel>
                <div className="w-full bg-warm-surface border border-hairline px-3 py-2.5 text-sm text-ink-muted font-mono">
                  {watch.slug}
                </div>
                <p className="text-[10px] font-mono text-ink-muted mt-1">
                  Slug cannot be changed after creation
                </p>
              </div>
              <div>
                <FieldLabel>DESCRIPTION</FieldLabel>
                <TextAreaInput value={description} onChange={setDescription} rows={5} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>PRICE</FieldLabel>
                  <TextInput
                    value={price}
                    onChange={setPrice}
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
                <div>
                  <FieldLabel>CURRENCY</FieldLabel>
                  <SelectInput
                    value={currency}
                    onChange={setCurrency}
                    options={['USD', 'EUR', 'GBP', 'CHF', 'JPY', 'SGD', 'HKD']}
                  />
                </div>
              </div>
            </div>
          </div>

          <SectionDivider label="MOVEMENT" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 mb-8">
            <div>
              <FieldLabel>MOVEMENT TYPE</FieldLabel>
              <SelectInput
                value={movementType}
                onChange={setMovementType}
                placeholder="— Select —"
                options={['Automatic', 'Manual-Wind', 'Quartz', 'Spring Drive', 'Solar', 'Kinetic']}
              />
            </div>
            <div>
              <FieldLabel>MOVEMENT NAME</FieldLabel>
              <TextInput value={movementName} onChange={setMovementName} />
            </div>
            <div>
              <FieldLabel>CALIBRE</FieldLabel>
              <TextInput value={calibre} onChange={setCalibre} />
            </div>
            <div>
              <FieldLabel>POWER RESERVE (h)</FieldLabel>
              <TextInput value={powerReserve} onChange={setPowerReserve} type="number" step="0.5" />
            </div>
          </div>

          <SectionDivider label="CASE" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 mb-8">
            <div>
              <FieldLabel>DIAMETER (mm)</FieldLabel>
              <TextInput value={caseDiameter} onChange={setCaseDiameter} type="number" step="0.1" />
            </div>
            <div>
              <FieldLabel>THICKNESS (mm)</FieldLabel>
              <TextInput value={caseThickness} onChange={setCaseThickness} type="number" step="0.1" />
            </div>
            <div>
              <FieldLabel>LUG TO LUG (mm)</FieldLabel>
              <TextInput value={lugToLug} onChange={setLugToLug} type="number" step="0.1" />
            </div>
            <div>
              <FieldLabel>CASE MATERIAL</FieldLabel>
              <TextInput value={caseMaterial} onChange={setCaseMaterial} />
            </div>
            <div>
              <FieldLabel>CRYSTAL</FieldLabel>
              <TextInput value={crystal} onChange={setCrystal} />
            </div>
            <div>
              <FieldLabel>WATER RESISTANCE (m)</FieldLabel>
              <TextInput value={waterResistance} onChange={setWaterResistance} type="number" />
            </div>
          </div>

          <SectionDivider label="BRACELET / STRAP" />
          <div className="mt-6 mb-8">
            <FieldLabel>BRACELET OR STRAP</FieldLabel>
            <TextInput value={bracelet} onChange={setBracelet} />
          </div>

          <SectionDivider label="CLASSIFICATION" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 mb-10">
            <div>
              <FieldLabel>RELEASE YEAR</FieldLabel>
              <TextInput value={releaseYear} onChange={setReleaseYear} type="number" step="1" />
            </div>
            <div>
              <FieldLabel>CATEGORY</FieldLabel>
              <SelectInput
                value={category}
                onChange={setCategory}
                placeholder="— Select —"
                options={[
                  'Affordable', 'Mid-range', 'Luxury', 'Ultra Luxury', 'Dive',
                  'Field', 'Dress', 'GMT', 'Chronograph', 'Integrated Bracelet',
                  'Everyday', 'Haute Horlogerie',
                ]}
              />
            </div>
            <div>
              <FieldLabel>STYLE</FieldLabel>
              <TextInput value={style} onChange={setStyle} />
            </div>
          </div>

          {/* Archival metadata */}
          <div className="mb-6 border border-hairline bg-warm-surface/30 px-4 py-3">
            <p className="text-[10px] font-mono tracking-[0.18em] text-ink-muted uppercase mb-1">
              RECORD METADATA
            </p>
            <p className="text-[11px] font-mono text-ink-secondary">
              ID: {watch.id}
            </p>
            <p className="text-[11px] font-mono text-ink-secondary">
              Created: {new Date(watch.created_at).toLocaleDateString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric',
              })}
            </p>
            <p className="text-[11px] font-mono text-ink-secondary">
              Updated: {new Date(watch.updated_at).toLocaleDateString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric',
              })}
            </p>
          </div>

          {saveError && (
            <div className="mb-6 border border-hairline bg-warm-surface px-4 py-3">
              <p className="text-[11px] font-mono text-ink-secondary">{saveError}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-6 border-t border-hairline">
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-[11px] font-mono tracking-[0.16em] uppercase px-6 py-3 border border-ink text-ink hover:bg-ink hover:text-warm-white transition-colors disabled:opacity-40"
            >
              {saving ? 'SAVING…' : 'SAVE CHANGES'}
            </button>
            <button
              onClick={() => navigate('/curator')}
              className="text-[11px] font-mono tracking-[0.16em] uppercase px-6 py-3 border border-hairline text-ink-muted hover:text-ink hover:border-ink transition-colors"
            >
              DISCARD
            </button>
          </div>
        </div>
      </Container>
    </div>
  )
}
