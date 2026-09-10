import { useState, useRef, useCallback } from 'react'
import { useAuth } from '../context/useAuth'
import { useRouter } from '../router/useRouter'
import Container from '../components/common/Container'
import WatchImage from '../components/common/WatchImage'
import {
  curatorCreateDraft,
  uploadArchivePhoto,
  validateArchivePhoto,
} from '../services/curatorWatchService'
import type { WatchDraftPayload } from '../services/curatorWatchService'

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

/** Generate a URL-safe slug from brand + model + reference */
function generateSlug(brand: string, model: string, reference: string): string {
  return [brand, model, reference]
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ------------------------------------------------------------------
// Field components
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
  required,
  step,
  min,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  required?: boolean
  step?: string
  min?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
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

// ------------------------------------------------------------------
// Photo upload panel
// ------------------------------------------------------------------
function PhotoUploadPanel({
  previewUrl,
  onFileSelect,
  uploadProgress,
  uploadError,
}: {
  previewUrl: string | null
  onFileSelect: (file: File) => void
  uploadProgress: 'idle' | 'validating' | 'uploading' | 'done' | 'error'
  uploadError: string | null
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = useCallback(
    (file: File) => {
      const err = validateArchivePhoto(file)
      if (err) return
      onFileSelect(file)
    },
    [onFileSelect]
  )

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="space-y-3">
      {/* Preview */}
      <div className="border border-hairline overflow-hidden aspect-[4/3] bg-warm-surface">
        {previewUrl ? (
          <WatchImage
            src={previewUrl}
            alt="Photograph preview"
            aspectRatio="aspect-[4/3]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
            <div className="border border-hairline/60 px-3 py-1.5 mb-2">
              <span className="text-[10px] font-mono tracking-[0.2em] text-ink-secondary uppercase">
                PHOTOGRAPH
              </span>
            </div>
            <span className="text-[9px] font-mono tracking-wider text-ink-muted uppercase">
              NO IMAGE SELECTED
            </span>
          </div>
        )}
      </div>

      {/* Drop zone / file picker */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border border-dashed px-4 py-5 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-ink bg-warm-surface' : 'border-hairline hover:border-steel'
        }`}
      >
        <p className="text-[11px] font-mono tracking-[0.14em] text-ink-secondary uppercase mb-1">
          {uploadProgress === 'uploading'
            ? 'UPLOADING…'
            : uploadProgress === 'done'
              ? 'PHOTOGRAPH UPLOADED'
              : 'SELECT PHOTOGRAPH'}
        </p>
        <p className="text-[10px] font-mono text-ink-muted">
          JPEG · PNG · WebP · Max 10 MB
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
        className="hidden"
      />

      {uploadError && (
        <p className="text-[11px] font-mono text-steel-dark">{uploadError}</p>
      )}

      {uploadProgress === 'done' && (
        <p className="text-[11px] font-mono tracking-[0.12em] text-ink uppercase">
          ✓ PHOTOGRAPH STORED
        </p>
      )}
    </div>
  )
}

// ------------------------------------------------------------------
// Section divider
// ------------------------------------------------------------------
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
export default function CuratorNewWatchPage() {
  const { isAuthenticated, isCurator, loading: authLoading } = useAuth()
  const { navigate } = useRouter()

  // Form state
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [reference, setReference] = useState('')
  const [slug, setSlug] = useState('')
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

  // Photo state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState<
    'idle' | 'validating' | 'uploading' | 'done' | 'error'
  >('idle')
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Photo provenance
  const [photoSourceName, setPhotoSourceName] = useState('')
  const [photoSourceUrl, setPhotoSourceUrl] = useState('')
  const [photoVerificationStatus, setPhotoVerificationStatus] = useState<'pending' | 'verified'>('pending')
  const [photoUsageNote, setPhotoUsageNote] = useState('')

  // Save state
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Auto-generate slug when brand/model/reference change
  const handleBrandChange = (v: string) => {
    setBrand(v)
    if (!slug) setSlug(generateSlug(v, model, reference))
  }
  const handleModelChange = (v: string) => {
    setModel(v)
    setSlug(generateSlug(brand, v, reference))
  }
  const handleReferenceChange = (v: string) => {
    setReference(v)
    setSlug(generateSlug(brand, model, v))
  }

  // File selection
  const handleFileSelect = (file: File) => {
    setUploadError(null)
    setUploadProgress('validating')
    const err = validateArchivePhoto(file)
    if (err) {
      setUploadError(err)
      setUploadProgress('error')
      return
    }
    setPendingFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setUploadProgress('idle')
  }

  // Upload photograph now (needs slug for path)
  const handleUpload = async () => {
    if (!pendingFile) return
    const targetSlug = slug || generateSlug(brand, model, reference)
    if (!targetSlug) {
      setUploadError('Enter brand, model and reference before uploading.')
      return
    }

    setUploadProgress('uploading')
    setUploadError(null)
    const result = await uploadArchivePhoto(pendingFile, targetSlug)
    if (result.error) {
      setUploadError(result.error.message)
      setUploadProgress('error')
    } else {
      setUploadedPhotoUrl(result.publicUrl)
      setUploadProgress('done')
    }
  }

  // Save draft
  const handleSaveDraft = async () => {
    if (!brand || !model || !reference || !slug) {
      setSaveError('Brand, model, reference and slug are required.')
      return
    }

    setSaving(true)
    setSaveError(null)

    // Upload photo first if not yet done
    let finalImageUrl = uploadedPhotoUrl
    if (pendingFile && uploadProgress !== 'done') {
      const targetSlug = slug
      setUploadProgress('uploading')
      const uploadResult = await uploadArchivePhoto(pendingFile, targetSlug)
      if (uploadResult.error) {
        setSaveError(`Photograph upload failed: ${uploadResult.error.message}`)
        setUploadProgress('error')
        setSaving(false)
        return
      }
      finalImageUrl = uploadResult.publicUrl
      setUploadedPhotoUrl(finalImageUrl)
      setUploadProgress('done')
    }

    const payload: WatchDraftPayload = {
      brand,
      model,
      reference_number: reference,
      slug,
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
      image_url: finalImageUrl || null,
      image_source_name: photoSourceName || null,
      image_source_url: photoSourceUrl || null,
      image_verification_status: photoVerificationStatus,
      image_usage_note: photoUsageNote || null,
    }

    const result = await curatorCreateDraft(payload)
    if (result.error) {
      setSaveError(result.error.message)
      setSaving(false)
      return
    }

    setSaving(false)
    navigate('/curator')
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

  // ------------------------------------------------------------------
  // Form
  // ------------------------------------------------------------------
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
            MOERI &amp; JEANNERET / CURATOR
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
            NEW RECORD
          </h1>
          <p className="text-[11px] font-mono tracking-[0.14em] text-ink-muted uppercase mt-1">
            SAVES AS DRAFT
          </p>
        </Container>
      </div>

      <Container className="py-10">
        <div className="max-w-3xl">
          {/* Two-column layout: photo + identity */}
          <div className="grid grid-cols-1 sm:grid-cols-[280px_1fr] gap-8 mb-10">
            {/* Photo column */}
            <div>
              <FieldLabel>PHOTOGRAPH</FieldLabel>
              <PhotoUploadPanel
                previewUrl={previewUrl}
                onFileSelect={handleFileSelect}
                uploadProgress={uploadProgress}
                uploadError={uploadError}
              />

              {pendingFile && uploadProgress !== 'done' && (
                <button
                  onClick={handleUpload}
                  className="mt-3 w-full text-[11px] font-mono tracking-[0.14em] uppercase px-4 py-2.5 border border-ink text-ink hover:bg-ink hover:text-warm-white transition-colors"
                >
                  UPLOAD PHOTOGRAPH
                </button>
              )}

              {/* Provenance */}
              {(pendingFile || uploadedPhotoUrl) && (
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
                      placeholder="https://commons.wikimedia.org/…"
                    />
                  </div>
                  <div>
                    <FieldLabel>USAGE / LICENSE</FieldLabel>
                    <TextInput
                      value={photoUsageNote}
                      onChange={setPhotoUsageNote}
                      placeholder="e.g. CC BY-SA 4.0 — Giordano Tonelli"
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
              )}
            </div>

            {/* Identity column */}
            <div className="space-y-4">
              <div>
                <FieldLabel>BRAND *</FieldLabel>
                <TextInput
                  value={brand}
                  onChange={handleBrandChange}
                  placeholder="e.g. Rolex"
                  required
                />
              </div>
              <div>
                <FieldLabel>MODEL *</FieldLabel>
                <TextInput
                  value={model}
                  onChange={handleModelChange}
                  placeholder="e.g. Submariner Date"
                  required
                />
              </div>
              <div>
                <FieldLabel>REFERENCE *</FieldLabel>
                <TextInput
                  value={reference}
                  onChange={handleReferenceChange}
                  placeholder="e.g. 126610LN"
                  required
                />
              </div>
              <div>
                <FieldLabel>SLUG *</FieldLabel>
                <TextInput
                  value={slug}
                  onChange={setSlug}
                  placeholder="auto-generated"
                  required
                />
                <p className="text-[10px] font-mono text-ink-muted mt-1">
                  URL identifier — must be unique
                </p>
              </div>
              <div>
                <FieldLabel>DESCRIPTION</FieldLabel>
                <TextAreaInput
                  value={description}
                  onChange={setDescription}
                  placeholder="Archival description of this reference…"
                  rows={5}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>PRICE</FieldLabel>
                  <TextInput
                    value={price}
                    onChange={setPrice}
                    type="number"
                    placeholder="0.00"
                    min="0"
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
                options={[
                  'Automatic',
                  'Manual-Wind',
                  'Quartz',
                  'Spring Drive',
                  'Solar',
                  'Kinetic',
                ]}
              />
            </div>
            <div>
              <FieldLabel>MOVEMENT NAME</FieldLabel>
              <TextInput
                value={movementName}
                onChange={setMovementName}
                placeholder="e.g. Calibre 3235"
              />
            </div>
            <div>
              <FieldLabel>CALIBRE</FieldLabel>
              <TextInput
                value={calibre}
                onChange={setCalibre}
                placeholder="e.g. 3235"
              />
            </div>
            <div>
              <FieldLabel>POWER RESERVE (h)</FieldLabel>
              <TextInput
                value={powerReserve}
                onChange={setPowerReserve}
                type="number"
                placeholder="e.g. 70"
                min="0"
              />
            </div>
          </div>

          <SectionDivider label="CASE" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 mb-8">
            <div>
              <FieldLabel>DIAMETER (mm)</FieldLabel>
              <TextInput
                value={caseDiameter}
                onChange={setCaseDiameter}
                type="number"
                placeholder="e.g. 41"
                step="0.1"
              />
            </div>
            <div>
              <FieldLabel>THICKNESS (mm)</FieldLabel>
              <TextInput
                value={caseThickness}
                onChange={setCaseThickness}
                type="number"
                placeholder="e.g. 12.3"
                step="0.1"
              />
            </div>
            <div>
              <FieldLabel>LUG TO LUG (mm)</FieldLabel>
              <TextInput
                value={lugToLug}
                onChange={setLugToLug}
                type="number"
                placeholder="e.g. 48"
                step="0.1"
              />
            </div>
            <div>
              <FieldLabel>CASE MATERIAL</FieldLabel>
              <TextInput
                value={caseMaterial}
                onChange={setCaseMaterial}
                placeholder="e.g. Oystersteel (904L)"
              />
            </div>
            <div>
              <FieldLabel>CRYSTAL</FieldLabel>
              <TextInput
                value={crystal}
                onChange={setCrystal}
                placeholder="e.g. Sapphire Crystal"
              />
            </div>
            <div>
              <FieldLabel>WATER RESISTANCE (m)</FieldLabel>
              <TextInput
                value={waterResistance}
                onChange={setWaterResistance}
                type="number"
                placeholder="e.g. 300"
                step="1"
              />
            </div>
          </div>

          <SectionDivider label="BRACELET / STRAP" />

          <div className="mt-6 mb-8">
            <FieldLabel>BRACELET OR STRAP</FieldLabel>
            <TextInput
              value={bracelet}
              onChange={setBracelet}
              placeholder="e.g. Oyster Bracelet with Glidelock Extension"
            />
          </div>

          <SectionDivider label="CLASSIFICATION" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 mb-10">
            <div>
              <FieldLabel>RELEASE YEAR</FieldLabel>
              <TextInput
                value={releaseYear}
                onChange={setReleaseYear}
                type="number"
                placeholder="e.g. 2020"
                min="1800"
                step="1"
              />
            </div>
            <div>
              <FieldLabel>CATEGORY</FieldLabel>
              <SelectInput
                value={category}
                onChange={setCategory}
                placeholder="— Select —"
                options={[
                  'Affordable',
                  'Mid-range',
                  'Luxury',
                  'Ultra Luxury',
                  'Dive',
                  'Field',
                  'Dress',
                  'GMT',
                  'Chronograph',
                  'Integrated Bracelet',
                  'Everyday',
                  'Haute Horlogerie',
                ]}
              />
            </div>
            <div>
              <FieldLabel>STYLE</FieldLabel>
              <TextInput
                value={style}
                onChange={setStyle}
                placeholder="e.g. Luxury Sport"
              />
            </div>
          </div>

          {/* Error */}
          {saveError && (
            <div className="mb-6 border border-hairline bg-warm-surface px-4 py-3">
              <p className="text-[11px] font-mono text-ink-secondary">{saveError}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-6 border-t border-hairline">
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className="text-[11px] font-mono tracking-[0.16em] uppercase px-6 py-3 border border-ink text-ink hover:bg-ink hover:text-warm-white transition-colors disabled:opacity-40"
            >
              {saving ? 'SAVING…' : 'SAVE DRAFT'}
            </button>
            <button
              onClick={() => navigate('/curator')}
              className="text-[11px] font-mono tracking-[0.16em] uppercase px-6 py-3 border border-hairline text-ink-muted hover:text-ink hover:border-ink transition-colors"
            >
              DISCARD
            </button>
            <p className="text-[10px] font-mono text-ink-muted sm:ml-2">
              Draft — will not be publicly visible until published
            </p>
          </div>
        </div>
      </Container>
    </div>
  )
}
