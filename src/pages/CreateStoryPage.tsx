import { useState, useEffect, useRef, type ChangeEvent } from 'react'
import Container from '../components/common/Container'
import Button from '../components/common/Button'
import { useAuth } from '../context/useAuth'
import { useRouter } from '../router/useRouter'
import { uploadStoryPhoto, createStory } from '../services/storyService'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

export default function CreateStoryPage() {
  const { user, profile, loading: authLoading, isAuthenticated } = useAuth()
  const { navigate } = useRouter()

  // Personal Watch State
  const [watchBrand, setWatchBrand] = useState('')
  const [watchModel, setWatchModel] = useState('')
  const [watchReference, setWatchReference] = useState('')

  // Story Content State
  const [title, setTitle] = useState('')
  const [storyText, setStoryText] = useState('')

  // Photograph Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'uploaded' | 'error'>('idle')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Submission State
  const [submitting, setSubmitting] = useState(false)
  const [submitAction, setSubmitAction] = useState<'draft' | 'publish' | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'compose' | 'preview'>('compose')

  // Revoke object URL when replaced or unmounted to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  // Photo Selection Handler
  const handlePhotoSelect = (e: ChangeEvent<HTMLInputElement>) => {
    setUploadError(null)
    setFormError(null)

    const file = e.target.files?.[0]
    if (!file) return

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setUploadError('Invalid format. Please select a JPEG, PNG, or WebP photograph.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    // Validate File Size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError('File exceeds 10MB limit. Please choose a smaller photograph.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    // Clean up prior object URL
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }

    const objectUrl = URL.createObjectURL(file)
    setSelectedFile(file)
    setPreviewUrl(objectUrl)
    setUploadedPhotoUrl(null)
    setUploadStatus('idle')
  }

  // Remove / replace photograph
  const handleRemovePhoto = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }
    setSelectedFile(null)
    setPreviewUrl(null)
    setUploadedPhotoUrl(null)
    setUploadStatus('idle')
    setUploadError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 1. Initial Authentication Loading State
  if (authLoading) {
    return (
      <div className="py-20 sm:py-32">
        <Container>
          <div className="border border-hairline bg-warm-surface/30 p-16 text-center max-w-xl mx-auto">
            <div className="w-10 h-10 mx-auto mb-6 flex items-center justify-center border border-hairline bg-warm-white">
              <svg
                className="w-5 h-5 text-gold animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
              </svg>
            </div>
            <h2 className="font-display text-2xl font-normal uppercase tracking-tight text-ink">
              Verifying Collector Session
            </h2>
            <p className="mt-2 text-xs font-mono tracking-widest text-ink-muted uppercase">
              QUERYING SUPABASE CREDENTIALS...
            </p>
          </div>
        </Container>
      </div>
    )
  }

  // 2. Unauthenticated Collector State
  if (!isAuthenticated) {
    return (
      <div className="py-12 sm:py-16 lg:py-20">
        <Container>
          <div className="border-b border-hairline pb-8 mb-12 sm:mb-16">
            <div className="flex items-center gap-2 mb-3 text-[11px] font-mono font-semibold uppercase tracking-[0.25em] text-ink-secondary">
              <span className="w-1.5 h-1.5 rounded-full bg-gold" aria-hidden="true" />
              <span>COMMUNITY DISPATCHES &bull; AUTHENTICATION REQUIRED</span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight text-ink uppercase">
              Share Your Story
            </h1>
            <p className="mt-3 text-base sm:text-lg text-ink-secondary max-w-2xl font-normal leading-relaxed">
              Every watch carries a personal provenance. Authenticate your collector dossier to document the memory, acquisition, or journey behind your timepiece.
            </p>
          </div>

          <div className="relative border border-hairline bg-warm-surface/40 p-8 sm:p-14 max-w-2xl mx-auto text-center">
            <div className="w-14 h-14 mx-auto mb-6 flex items-center justify-center border border-hairline bg-warm-white text-ink">
              <svg
                className="w-6 h-6 text-ink-secondary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-normal tracking-tight text-ink uppercase">
              Sign In to Contribute
            </h2>
            <p className="mt-3 text-sm text-ink-secondary font-light max-w-md mx-auto leading-relaxed">
              Community Stories connect real collectors with real watches. Please sign in to your collector profile before composing your story.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                variant="primary"
                size="md"
                className="w-full sm:w-auto"
                onClick={() => navigate('/login')}
              >
                SIGN IN &rarr;
              </Button>
            </div>
          </div>
        </Container>
      </div>
    )
  }

  // 3. Draft Submission Handler
  const handleSaveDraft = async () => {
    if (!user?.id) return

    setFormError(null)
    setUploadError(null)

    if (!watchBrand.trim()) {
      setFormError('Please enter your watch brand to save a draft.')
      return
    }

    if (!watchModel.trim()) {
      setFormError('Please enter your watch model or name to save a draft.')
      return
    }

    if (!title.trim()) {
      setFormError('A story title is required to save a draft.')
      return
    }

    if (!storyText.trim()) {
      setFormError('Story text is required to save a draft.')
      return
    }

    setSubmitting(true)
    setSubmitAction('draft')

    let effectivePhotoUrl = uploadedPhotoUrl

    // If a photo file was selected but not uploaded yet, upload it before saving
    if (selectedFile && !effectivePhotoUrl) {
      setUploadStatus('uploading')
      const uploadRes = await uploadStoryPhoto(user.id, selectedFile)
      if (uploadRes.error || !uploadRes.publicUrl) {
        setUploadStatus('error')
        setUploadError(uploadRes.error?.message || 'Failed to upload photo.')
        setFormError('Photo upload failed. Please resolve or remove photo before saving.')
        setSubmitting(false)
        setSubmitAction(null)
        return
      }
      effectivePhotoUrl = uploadRes.publicUrl
      setUploadedPhotoUrl(effectivePhotoUrl)
      setUploadStatus('uploaded')
    }

    const res = await createStory({
      userId: user.id,
      personal_watch_brand: watchBrand.trim(),
      personal_watch_model: watchModel.trim(),
      personal_watch_reference: watchReference.trim() || null,
      title: title.trim(),
      story_text: storyText.trim(),
      photo_url: effectivePhotoUrl,
      status: 'draft',
    })

    if (res.error || !res.data) {
      setFormError(res.error?.message || 'Failed to save draft.')
      setSubmitting(false)
      setSubmitAction(null)
      return
    }

    navigate(`/stories/${res.data.slug}`)
  }

  // 4. Publish Submission Handler
  const handlePublish = async () => {
    if (!user?.id) return

    setFormError(null)
    setUploadError(null)

    if (!watchBrand.trim()) {
      setFormError('Please enter your watch brand.')
      return
    }

    if (!watchModel.trim()) {
      setFormError('Please enter your watch model or name.')
      return
    }

    if (!title.trim()) {
      setFormError('A story title is required to publish.')
      return
    }

    if (!storyText.trim()) {
      setFormError('Please write your personal story before publishing.')
      return
    }

    if (!selectedFile && !uploadedPhotoUrl) {
      setFormError('A photograph of your watch is required to publish a community story.')
      return
    }

    setSubmitting(true)
    setSubmitAction('publish')

    let effectivePhotoUrl = uploadedPhotoUrl

    // If file is selected but not uploaded yet, upload first
    if (selectedFile && !effectivePhotoUrl) {
      setUploadStatus('uploading')
      const uploadRes = await uploadStoryPhoto(user.id, selectedFile)
      if (uploadRes.error || !uploadRes.publicUrl) {
        setUploadStatus('error')
        setUploadError(uploadRes.error?.message || 'Failed to upload photo.')
        setFormError(uploadRes.error?.message || 'Photograph upload failed.')
        setSubmitting(false)
        setSubmitAction(null)
        return
      }
      effectivePhotoUrl = uploadRes.publicUrl
      setUploadedPhotoUrl(effectivePhotoUrl)
      setUploadStatus('uploaded')
    }

    if (!effectivePhotoUrl) {
      setFormError('A valid uploaded photograph is required to publish.')
      setSubmitting(false)
      setSubmitAction(null)
      return
    }

    const res = await createStory({
      userId: user.id,
      personal_watch_brand: watchBrand.trim(),
      personal_watch_model: watchModel.trim(),
      personal_watch_reference: watchReference.trim() || null,
      title: title.trim(),
      story_text: storyText.trim(),
      photo_url: effectivePhotoUrl,
      status: 'published',
    })

    if (res.error || !res.data) {
      setFormError(res.error?.message || 'Failed to publish story.')
      setSubmitting(false)
      setSubmitAction(null)
      return
    }

    navigate(`/stories/${res.data.slug}`)
  }

  // Collector identity fallback
  const authorName = profile?.display_name || profile?.username || 'Authenticated Collector'
  const authorUsername = profile?.username ? `@${profile.username}` : ''

  return (
    <div className="py-12 sm:py-16 lg:py-20">
      <Container>
        {/* Editorial Header */}
        <div className="border-b border-hairline pb-8 mb-10 sm:mb-12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2.5 mb-3 text-[11px] font-mono font-semibold uppercase tracking-[0.25em] text-ink-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-gold" aria-hidden="true" />
                <span>COMMUNITY PROVENANCE &bull; DISPATCH ARCHIVE</span>
              </div>
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight text-ink uppercase">
                Create Your Story
              </h1>
              <p className="mt-3 text-base sm:text-lg text-ink-secondary max-w-2xl font-normal leading-relaxed">
                Document your personal watch with your own photograph and unfiltered experience.
              </p>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center border border-hairline bg-warm-white p-1">
              <button
                type="button"
                onClick={() => setActiveTab('compose')}
                className={`px-4 py-2 text-[10px] font-mono tracking-[0.2em] uppercase transition-colors cursor-pointer ${
                  activeTab === 'compose'
                    ? 'bg-ink text-warm-white font-semibold'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                01 // COMPOSE
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-4 py-2 text-[10px] font-mono tracking-[0.2em] uppercase transition-colors cursor-pointer ${
                  activeTab === 'preview'
                    ? 'bg-ink text-warm-white font-semibold'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                02 // PREVIEW
              </button>
            </div>
          </div>
        </div>

        {/* Global Error Banner */}
        {formError && (
          <div className="mb-8 p-4 border border-hairline bg-warm-surface/60 flex items-start gap-3">
            <svg
              className="w-4 h-4 text-gold shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-xs font-mono text-ink tracking-wide leading-relaxed">
              {formError}
            </p>
          </div>
        )}

        {/* ========================================================================= */}
        {/* COMPOSE TAB */}
        {/* ========================================================================= */}
        {activeTab === 'compose' && (
          <div className="space-y-12 max-w-4xl">
            {/* STEP 1: YOUR PERSONAL WATCH */}
            <section className="border border-hairline bg-warm-surface/20 p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-hairline">
                <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.25em] text-ink-secondary uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold" aria-hidden="true" />
                  <span>STEP 01 // YOUR WATCH</span>
                </div>
                <span className="text-[10px] font-mono tracking-wider text-ink-muted uppercase">
                  REQUIRED
                </span>
              </div>

              <div>
                <p className="text-xs font-mono text-ink-secondary leading-relaxed">
                  Tell us about the watch on your wrist. This is your personal watch. It does not need to be in our archive.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Brand */}
                <div>
                  <label
                    htmlFor="watch-brand"
                    className="block text-[10px] font-mono uppercase tracking-[0.22em] text-ink-secondary mb-2"
                  >
                    Brand *
                  </label>
                  <input
                    id="watch-brand"
                    type="text"
                    value={watchBrand}
                    onChange={(e) => setWatchBrand(e.target.value)}
                    placeholder="e.g. Seiko, Rolex, Omega, Timex"
                    className="w-full bg-warm-white border border-hairline px-4 py-3 text-sm font-sans text-ink placeholder:text-ink-muted/50 focus:outline-none focus:border-ink transition-colors"
                  />
                </div>

                {/* Model / Watch Name */}
                <div>
                  <label
                    htmlFor="watch-model"
                    className="block text-[10px] font-mono uppercase tracking-[0.22em] text-ink-secondary mb-2"
                  >
                    Model / Watch Name *
                  </label>
                  <input
                    id="watch-model"
                    type="text"
                    value={watchModel}
                    onChange={(e) => setWatchModel(e.target.value)}
                    placeholder="e.g. Presage Cocktail Time, Submariner"
                    className="w-full bg-warm-white border border-hairline px-4 py-3 text-sm font-sans text-ink placeholder:text-ink-muted/50 focus:outline-none focus:border-ink transition-colors"
                  />
                </div>
              </div>

              {/* Reference Number (Optional) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="watch-reference"
                    className="block text-[10px] font-mono uppercase tracking-[0.22em] text-ink-secondary"
                  >
                    Reference Number
                  </label>
                  <span className="text-[10px] font-mono tracking-wider text-ink-muted uppercase">
                    OPTIONAL — IF YOU KNOW IT
                  </span>
                </div>
                <input
                  id="watch-reference"
                  type="text"
                  value={watchReference}
                  onChange={(e) => setWatchReference(e.target.value)}
                  placeholder="e.g. SRPB43, 126610LN"
                  className="w-full bg-warm-white border border-hairline px-4 py-3 text-sm font-mono text-ink placeholder:text-ink-muted/50 focus:outline-none focus:border-ink transition-colors"
                />
              </div>
            </section>

            {/* STEP 2: REAL COLLECTOR PHOTOGRAPH */}
            <section className="border border-hairline bg-warm-surface/20 p-6 sm:p-8">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-hairline">
                <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.25em] text-ink-secondary uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold" aria-hidden="true" />
                  <span>STEP 02 // REAL PHOTOGRAPH</span>
                </div>
                <span className="text-[10px] font-mono tracking-wider text-ink-muted uppercase">
                  REQUIRED FOR PUBLISHING
                </span>
              </div>

              {previewUrl ? (
                <div className="border border-hairline bg-warm-white p-5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <div className="w-36 sm:w-44 aspect-[4/3] bg-warm-surface border border-hairline shrink-0 overflow-hidden relative">
                      <img
                        src={previewUrl}
                        alt="Story preview"
                        className="w-full h-full object-cover object-center"
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-ink-secondary">
                        <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                        <span>
                          {uploadStatus === 'uploaded'
                            ? 'STORED IN SUPABASE STORAGE'
                            : uploadStatus === 'uploading'
                            ? 'UPLOADING TO STORAGE...'
                            : 'LOCAL PREVIEW READY'}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-ink-muted tracking-wide">
                        {selectedFile?.name || 'Uploaded photograph'} (
                        {selectedFile ? (selectedFile.size / (1024 * 1024)).toFixed(2) : '0'} MB)
                      </p>
                      <div className="pt-2 flex items-center gap-3">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          REPLACE PHOTO &rarr;
                        </Button>
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="text-[11px] font-mono tracking-wider text-ink-muted hover:text-ink uppercase underline cursor-pointer"
                        >
                          REMOVE
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="py-12 px-6 border border-dashed border-hairline bg-warm-surface/30 text-center cursor-pointer hover:border-ink hover:bg-warm-surface/50 transition-colors"
                >
                  <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center border border-hairline bg-warm-white text-ink">
                    <svg
                      className="w-6 h-6 text-ink-secondary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
                      />
                    </svg>
                  </div>
                  <p className="font-display text-lg text-ink uppercase tracking-tight mb-1">
                    Upload Your Watch Photograph
                  </p>
                  <p className="text-xs font-mono text-ink-secondary max-w-sm mx-auto mb-4 leading-relaxed">
                    Upload a real photograph of your watch on the wrist or in your hand.
                  </p>
                  <span className="inline-block text-[10px] font-mono tracking-[0.2em] uppercase text-ink underline font-medium">
                    BROWSE FILES (JPEG, PNG, WEBP &bull; MAX 10MB)
                  </span>
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoSelect}
                className="hidden"
                aria-label="Upload watch photograph"
              />

              {uploadError && (
                <div className="mt-3 text-xs font-mono text-ink tracking-wide">
                  &bull; {uploadError}
                </div>
              )}
            </section>

            {/* STEP 3: TITLE & PERSONAL STORY */}
            <section className="border border-hairline bg-warm-surface/20 p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-hairline">
                <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.25em] text-ink-secondary uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold" aria-hidden="true" />
                  <span>STEP 03 // STORY NARRATIVE</span>
                </div>
                <span className="text-[10px] font-mono tracking-wider text-ink-muted uppercase">
                  REQUIRED
                </span>
              </div>

              {/* Title Field */}
              <div>
                <label
                  htmlFor="story-title"
                  className="block text-[10px] font-mono uppercase tracking-[0.22em] text-ink-secondary mb-2"
                >
                  Story Title *
                </label>
                <input
                  id="story-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="The watch I bought with my first salary"
                  className="w-full bg-warm-white border border-hairline px-4 py-3.5 text-sm sm:text-base font-display text-ink placeholder:text-ink-muted/50 focus:outline-none focus:border-ink transition-colors"
                />
                <div className="mt-1.5 flex justify-end text-[10px] font-mono text-ink-muted">
                  {title.length} CHARACTERS
                </div>
              </div>

              {/* Story Narrative Body */}
              <div>
                <label
                  htmlFor="story-text"
                  className="block text-[10px] font-mono uppercase tracking-[0.22em] text-ink-secondary mb-2"
                >
                  Personal Provenance &amp; Experience *
                </label>
                <textarea
                  id="story-text"
                  rows={9}
                  value={storyText}
                  onChange={(e) => setStoryText(e.target.value)}
                  placeholder="Tell the story behind this watch. Why did you buy it? What do you remember about that moment? What does it mean to you now?"
                  className="w-full bg-warm-white border border-hairline p-4 text-xs sm:text-sm font-sans leading-relaxed text-ink placeholder:text-ink-muted/50 focus:outline-none focus:border-ink transition-colors resize-y"
                />
                <div className="mt-1.5 flex justify-between text-[10px] font-mono text-ink-muted">
                  <span>SHARE MEMORIES, ACQUISITIONS, TRIPS, OR HOROLOGICAL MILESTONES</span>
                  <span>{storyText.trim() ? storyText.trim().split(/\s+/).length : 0} WORDS</span>
                </div>
              </div>
            </section>

            {/* ACTION BAR */}
            <div className="pt-6 border-t border-hairline flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  disabled={submitting}
                  onClick={handlePublish}
                  className="w-full sm:w-auto"
                >
                  {submitting && submitAction === 'publish'
                    ? 'PUBLISHING TO ARCHIVE...'
                    : 'PUBLISH COMMUNITY STORY \u2192'}
                </Button>

                <Button
                  variant="secondary"
                  size="lg"
                  disabled={submitting}
                  onClick={handleSaveDraft}
                  className="w-full sm:w-auto"
                >
                  {submitting && submitAction === 'draft' ? 'SAVING DRAFT...' : 'SAVE AS DRAFT'}
                </Button>
              </div>

              <button
                type="button"
                onClick={() => navigate('/stories')}
                disabled={submitting}
                className="text-xs font-mono tracking-widest text-ink-muted hover:text-ink uppercase cursor-pointer"
              >
                CANCEL
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PREVIEW TAB */}
        {/* ========================================================================= */}
        {activeTab === 'preview' && (
          <div className="max-w-4xl space-y-10">
            <div className="border border-hairline bg-warm-surface/20 p-4 flex items-center justify-between text-[10px] font-mono tracking-[0.2em] text-ink-secondary uppercase">
              <span>LIVE STORY PRESENTATION PREVIEW</span>
              <button
                type="button"
                onClick={() => setActiveTab('compose')}
                className="text-ink underline hover:text-gold cursor-pointer"
              >
                RETURN TO EDITOR &rarr;
              </button>
            </div>

            {/* Editorial Presentation Mockup */}
            <article className="border border-hairline bg-warm-white p-6 sm:p-10 lg:p-14">
              {/* Header Context Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-8 border-b border-hairline">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-warm-surface border border-hairline flex items-center justify-center text-xs font-mono font-semibold uppercase text-ink shrink-0 overflow-hidden">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={authorName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      authorName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-mono font-semibold text-ink uppercase tracking-wider">
                      {authorName}
                    </div>
                    {authorUsername && (
                      <div className="text-[10px] font-mono text-ink-muted tracking-wide">
                        {authorUsername}
                      </div>
                    )}
                  </div>
                </div>

                {(watchBrand.trim() || watchModel.trim()) && (
                  <div className="text-right">
                    <div className="text-[9px] font-mono uppercase tracking-[0.22em] text-ink-secondary">
                      PERSONAL TIMEPIECE
                    </div>
                    <div className="text-xs font-mono font-medium text-ink uppercase">
                      {watchBrand.trim()} &bull; {watchModel.trim()}
                    </div>
                    {watchReference.trim() && (
                      <div className="text-[10px] font-mono text-ink-muted">
                        REF. {watchReference.trim()}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Title */}
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-ink uppercase mb-8">
                {title.trim() || 'Untitled Community Story'}
              </h2>

              {/* Photograph Frame */}
              <div className="relative aspect-[16/10] w-full bg-warm-surface border border-hairline overflow-hidden mb-10">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={title || 'Watch photograph'}
                    className="w-full h-full object-cover object-center"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-ink-muted">
                    <span className="text-xs font-mono tracking-widest uppercase mb-1">
                      NO PHOTOGRAPH SELECTED
                    </span>
                    <span className="text-[10px] font-mono">
                      A real photo is required before publishing
                    </span>
                  </div>
                )}
              </div>

              {/* Story Narrative */}
              <div className="max-w-2xl mx-auto">
                {storyText.trim() ? (
                  <div className="prose prose-neutral text-ink text-sm sm:text-base font-serif leading-relaxed whitespace-pre-line">
                    {storyText}
                  </div>
                ) : (
                  <p className="text-sm font-serif italic text-ink-muted text-center py-8">
                    Your personal narrative will appear here as you write.
                  </p>
                )}
              </div>

              {/* Attached Personal Watch Detail Footer Bar */}
              {(watchBrand.trim() || watchModel.trim()) && (
                <div className="mt-12 pt-6 border-t border-hairline flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-mono text-ink-secondary">
                  <div>
                    <span className="uppercase tracking-widest text-ink-muted text-[10px] block">
                      COLLECTOR&rsquo;S TIMEPIECE
                    </span>
                    <span className="text-ink font-semibold uppercase">
                      {watchBrand.trim()} {watchModel.trim()}
                    </span>
                    {watchReference.trim() && (
                      <span className="text-ink-muted ml-2">
                        REF. {watchReference.trim()}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] tracking-widest uppercase text-gold">
                    AUTHENTICATED COMMUNITY RECORD
                  </div>
                </div>
              )}
            </article>

            {/* Quick Publish from Preview */}
            <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
              <Button
                variant="primary"
                size="lg"
                disabled={submitting}
                onClick={handlePublish}
                className="w-full sm:w-auto"
              >
                {submitting && submitAction === 'publish'
                  ? 'PUBLISHING TO ARCHIVE...'
                  : 'PUBLISH COMMUNITY STORY \u2192'}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                disabled={submitting}
                onClick={handleSaveDraft}
                className="w-full sm:w-auto"
              >
                {submitting && submitAction === 'draft' ? 'SAVING DRAFT...' : 'SAVE AS DRAFT'}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => setActiveTab('compose')}
                className="w-full sm:w-auto"
              >
                &larr; EDIT STORY
              </Button>
            </div>
          </div>
        )}
      </Container>
    </div>
  )
}

