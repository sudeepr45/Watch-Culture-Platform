import { useState, useEffect, useRef, useMemo, useCallback, type ChangeEvent } from 'react'
import Container from '../components/common/Container'
import Button from '../components/common/Button'
import { useAuth } from '../context/useAuth'
import { useRouter } from '../router/useRouter'
import { uploadStoryPhoto, createStory, updateStory, fetchStoryBySlug } from '../services/storyService'
import { fetchWatches } from '../services/watchService'
import type { Watch } from '../types/watch'
import type { StoryWithAuthorAndWatch } from '../types/story'
import WatchImage from '../components/common/WatchImage'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

interface CreateStoryPageProps {
  editSlug?: string
}

export default function CreateStoryPage({ editSlug }: CreateStoryPageProps = {}) {
  const { user, profile, loading: authLoading, isAuthenticated } = useAuth()
  const { navigate } = useRouter()

  // Edit Mode State
  const [editingStory, setEditingStory] = useState<StoryWithAuthorAndWatch | null>(null)
  const [editLoading, setEditLoading] = useState(Boolean(editSlug))
  const [editError, setEditError] = useState<string | null>(null)
  const [isNotOwner, setIsNotOwner] = useState(false)

  // Personal Watch State
  const [watchBrand, setWatchBrand] = useState('')
  const [watchModel, setWatchModel] = useState('')
  const [watchReference, setWatchReference] = useState('')

  // Verified Watch Archive State (Optional connection)
  const [selectedArchiveWatch, setSelectedArchiveWatch] = useState<Watch | null>(null)
  const [isArchivePickerOpen, setIsArchivePickerOpen] = useState(false)
  const [archiveSearchQuery, setArchiveSearchQuery] = useState('')
  const [archiveWatches, setArchiveWatches] = useState<Watch[]>([])
  const [archiveWatchesLoading, setArchiveWatchesLoading] = useState(false)

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

  // Preload existing story when in edit mode
  useEffect(() => {
    if (!editSlug) return

    let isMounted = true

    async function loadStoryForEdit() {
      setEditLoading(true)
      setEditError(null)
      setIsNotOwner(false)

      const res = await fetchStoryBySlug(editSlug!)

      if (!isMounted) return

      if (res.error || !res.data) {
        setEditError(res.error?.message || 'Failed to retrieve dispatch from archive.')
        setEditLoading(false)
        return
      }

      const story = res.data

      // Check ownership against authenticated collector
      if (user && story.user_id !== user.id) {
        setIsNotOwner(true)
        setEditLoading(false)
        return
      }

      setEditingStory(story)
      setWatchBrand(story.personal_watch_brand || '')
      setWatchModel(story.personal_watch_model || '')
      setWatchReference(story.personal_watch_reference || '')
      setTitle(story.title || '')
      setStoryText(story.story_text || '')

      if (story.photo_url) {
        setUploadedPhotoUrl(story.photo_url)
        setPreviewUrl(story.photo_url)
        setUploadStatus('uploaded')
      }

      if (story.watch_id && story.watch) {
        setSelectedArchiveWatch(story.watch as Watch)
      } else {
        setSelectedArchiveWatch(null)
      }

      setEditLoading(false)
    }

    if (!authLoading) {
      loadStoryForEdit()
    }

    return () => {
      isMounted = false
    }
  }, [editSlug, authLoading, user])

  // Preload verified archive watches for modal responsiveness
  useEffect(() => {
    let isMounted = true
    async function loadWatches() {
      setArchiveWatchesLoading(true)
      const res = await fetchWatches()
      if (isMounted) {
        if (res.data) {
          setArchiveWatches(res.data)
        }
        setArchiveWatchesLoading(false)
      }
    }
    loadWatches()
    return () => {
      isMounted = false
    }
  }, [])

  // Close archive picker on Escape key
  const handleCloseArchivePicker = useCallback(() => {
    setArchiveSearchQuery('')
    setIsArchivePickerOpen(false)
  }, [])

  useEffect(() => {
    if (!isArchivePickerOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseArchivePicker()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isArchivePickerOpen, handleCloseArchivePicker])

  // Filter watches by search query
  const filteredArchiveWatches = useMemo(() => {
    if (!archiveSearchQuery.trim()) return archiveWatches

    const query = archiveSearchQuery.toLowerCase().trim()
    return archiveWatches.filter(
      (w) =>
        w.brand.toLowerCase().includes(query) ||
        w.model.toLowerCase().includes(query) ||
        w.reference_number.toLowerCase().includes(query) ||
        (w.category && w.category.toLowerCase().includes(query))
    )
  }, [archiveWatches, archiveSearchQuery])

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
                className="w-5 h-5 text-steel animate-spin"
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
              Authenticating Dossier
            </h2>
            <p className="mt-2 text-xs font-mono tracking-widest text-ink-muted uppercase">
              CHECKING COLLECTOR PROFILE...
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
            <div className="flex items-center gap-2 mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-ink-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-steel" aria-hidden="true" />
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

  // 3. Edit Mode Loading State
  if (editSlug && editLoading) {
    return (
      <div className="py-20 sm:py-32">
        <Container>
          <div className="border border-hairline bg-warm-surface/30 p-16 text-center max-w-xl mx-auto">
            <div className="w-10 h-10 mx-auto mb-6 flex items-center justify-center border border-hairline bg-warm-white">
              <svg
                className="w-5 h-5 text-steel animate-spin"
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
              Loading Dispatch
            </h2>
            <p className="mt-2 text-xs font-mono tracking-widest text-ink-muted uppercase">
              RETRIEVING STORY FROM ARCHIVE...
            </p>
          </div>
        </Container>
      </div>
    )
  }

  // 4. Edit Mode Retrieval Error State
  if (editSlug && editError) {
    return (
      <div className="py-16 sm:py-24">
        <Container>
          <div className="border border-hairline bg-warm-surface/40 p-8 sm:p-12 max-w-xl mx-auto text-center">
            <div className="w-12 h-12 mx-auto mb-5 flex items-center justify-center border border-hairline bg-warm-white text-ink-secondary">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 className="font-display text-2xl font-normal uppercase tracking-tight text-ink">
              Unable to Load Dispatch
            </h2>
            <p className="mt-3 text-xs font-mono text-ink-muted leading-relaxed">
              {editError}
            </p>
            <div className="mt-6">
              <Button variant="secondary" size="md" onClick={() => navigate('/stories')}>
                &larr; RETURN TO STORIES
              </Button>
            </div>
          </div>
        </Container>
      </div>
    )
  }

  // 5. Edit Mode Ownership Verification (Permission Denied) State
  if (editSlug && (isNotOwner || (editingStory && user && editingStory.user_id !== user.id))) {
    return (
      <div className="py-16 sm:py-24">
        <Container>
          <div className="border border-hairline bg-warm-surface/40 p-8 sm:p-12 max-w-xl mx-auto text-center">
            <div className="w-12 h-12 mx-auto mb-5 flex items-center justify-center border border-hairline bg-warm-white text-ink-secondary">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <div className="flex items-center justify-center gap-2 mb-2 text-[10px] font-mono tracking-[0.25em] text-ink-secondary uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-steel" />
              <span>PERMISSION DENIED // ACCESS RESTRICTED</span>
            </div>
            <h2 className="font-display text-2xl font-normal uppercase tracking-tight text-ink">
              Restricted Dispatch
            </h2>
            <p className="mt-3 text-xs font-mono text-ink-muted leading-relaxed">
              You can only edit community stories that you have authored. This dispatch belongs to another collector dossier.
            </p>
            <div className="mt-6">
              <Button variant="secondary" size="md" onClick={() => navigate('/stories')}>
                &larr; RETURN TO STORIES
              </Button>
            </div>
          </div>
        </Container>
      </div>
    )
  }

  // 6. Draft Submission Handler
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

    if (editingStory) {
      const res = await updateStory(user.id, editingStory.id, {
        watch_id: selectedArchiveWatch?.id ?? null,
        personal_watch_brand: watchBrand.trim(),
        personal_watch_model: watchModel.trim(),
        personal_watch_reference: watchReference.trim() || null,
        title: title.trim(),
        story_text: storyText.trim(),
        photo_url: effectivePhotoUrl,
        status: 'draft',
      })

      if (res.error || !res.data) {
        setFormError(res.error?.message || 'Failed to update draft.')
        setSubmitting(false)
        setSubmitAction(null)
        return
      }

      navigate(`/stories/${editingStory.slug}`)
      return
    }

    const res = await createStory({
      userId: user.id,
      watch_id: selectedArchiveWatch?.id ?? null,
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

  // 7. Publish Submission Handler
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

    if (editingStory) {
      const res = await updateStory(user.id, editingStory.id, {
        watch_id: selectedArchiveWatch?.id ?? null,
        personal_watch_brand: watchBrand.trim(),
        personal_watch_model: watchModel.trim(),
        personal_watch_reference: watchReference.trim() || null,
        title: title.trim(),
        story_text: storyText.trim(),
        photo_url: effectivePhotoUrl,
        status: 'published',
      })

      if (res.error || !res.data) {
        setFormError(res.error?.message || 'Failed to update story.')
        setSubmitting(false)
        setSubmitAction(null)
        return
      }

      navigate(`/stories/${editingStory.slug}`)
      return
    }

    const res = await createStory({
      userId: user.id,
      watch_id: selectedArchiveWatch?.id ?? null,
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
              <div className="flex items-center gap-2.5 mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-ink-muted">
                <span className="w-1.5 h-1.5 rounded-full bg-steel" aria-hidden="true" />
                <span>
                  {editSlug
                    ? 'EDIT YOUR STORY // MANAGE DISPATCH'
                    : 'COMMUNITY PROVENANCE \u2022 DISPATCH ARCHIVE'}
                </span>
              </div>
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight text-ink uppercase">
                {editSlug ? 'Edit Your Story' : 'Create Your Story'}
              </h1>
              <p className="mt-3 text-base sm:text-lg text-ink-secondary max-w-2xl font-normal leading-relaxed">
                {editSlug
                  ? 'Update your personal watch details, photograph, or narrative provenance.'
                  : 'Document your personal watch with your own photograph and unfiltered experience.'}
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
              className="w-4 h-4 text-ink-secondary shrink-0 mt-0.5"
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
                <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.25em] text-ink-muted uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-steel" aria-hidden="true" />
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

            {/* OPTIONAL ARCHIVE CONNECTION */}
            <section className="border border-hairline bg-warm-surface/20 p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-hairline">
                <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.25em] text-ink-muted uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-steel" aria-hidden="true" />
                  <span>OPTIONAL // VERIFIED ARCHIVE CONNECTION</span>
                </div>
                <span className="text-[10px] font-mono tracking-wider text-ink-muted uppercase">
                  OPTIONAL &bull; 01 SPECIMEN
                </span>
              </div>

              <div>
                <p className="text-xs font-mono text-ink-secondary leading-relaxed">
                  Does your personal watch correspond to an official specimen in our Verified Watch Archive?
                  Connecting your story links it to the central watch dossier and presents your dispatch to collectors researching that model.
                  This is completely optional &mdash; personal stories can always stand on their own.
                </p>
              </div>

              {selectedArchiveWatch ? (
                <div className="border border-hairline bg-warm-white p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-warm-surface border border-hairline shrink-0 overflow-hidden relative flex items-center justify-center">
                        <WatchImage
                          src={selectedArchiveWatch.image_url}
                          alt={`${selectedArchiveWatch.brand} ${selectedArchiveWatch.model}`}
                          aspectRatio="h-full w-full"
                          compact
                        />
                      </div>

                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-steel font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-steel" />
                          <span>VERIFIED ARCHIVE RECORD LINKED</span>
                        </div>
                        <h3 className="font-display text-xl sm:text-2xl font-normal text-ink uppercase tracking-tight truncate">
                          {selectedArchiveWatch.brand} &bull; {selectedArchiveWatch.model}
                        </h3>
                        <div className="text-xs font-mono text-ink-secondary">
                          REF. {selectedArchiveWatch.reference_number}
                          {selectedArchiveWatch.category ? ` \u2022 ${selectedArchiveWatch.category}` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-hairline">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsArchivePickerOpen(true)}
                      >
                        CHANGE
                      </Button>
                      <button
                        type="button"
                        onClick={() => setSelectedArchiveWatch(null)}
                        className="text-[11px] font-mono tracking-wider text-ink-muted hover:text-ink uppercase underline cursor-pointer px-2 py-1"
                      >
                        CLEAR LINK
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-hairline bg-warm-white p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-ink-muted mb-1">
                      CURRENT ARCHIVE STATUS
                    </div>
                    <div className="font-display text-lg text-ink uppercase tracking-tight">
                      Personal Provenance Only (Unlinked)
                    </div>
                    <p className="text-xs font-mono text-ink-secondary mt-1 max-w-lg">
                      Your story will be published under your personal timepiece details without an official archive catalog link.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsArchivePickerOpen(true)}
                    className="shrink-0"
                  >
                    LINK ARCHIVE DOSSIER &rarr;
                  </Button>
                </div>
              )}
            </section>

            {/* STEP 2: REAL COLLECTOR PHOTOGRAPH */}
            <section className="border border-hairline bg-warm-surface/20 p-6 sm:p-8">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-hairline">
                <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.25em] text-ink-muted uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-steel" aria-hidden="true" />
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
                        <span className="w-1.5 h-1.5 rounded-full bg-steel" />
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
                <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.25em] text-ink-muted uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-steel" aria-hidden="true" />
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
                    ? editingStory?.status === 'published'
                      ? 'UPDATING STORY...'
                      : 'PUBLISHING TO ARCHIVE...'
                    : editingStory?.status === 'published'
                      ? 'UPDATE STORY \u2192'
                      : 'PUBLISH COMMUNITY STORY \u2192'}
                </Button>

                {(!editingStory || editingStory.status === 'draft') && (
                  <Button
                    variant="secondary"
                    size="lg"
                    disabled={submitting}
                    onClick={handleSaveDraft}
                    className="w-full sm:w-auto"
                  >
                    {submitting && submitAction === 'draft'
                      ? editingStory
                        ? 'UPDATING DRAFT...'
                        : 'SAVING DRAFT...'
                      : editingStory
                        ? 'UPDATE DRAFT'
                        : 'SAVE AS DRAFT'}
                  </Button>
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  editingStory ? navigate(`/stories/${editingStory.slug}`) : navigate('/stories')
                }
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
                className="text-ink underline hover:text-neutral-700 cursor-pointer duration-200 transition-colors"
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
                    {selectedArchiveWatch && (
                      <div className="mt-1 flex items-center justify-end gap-1.5 text-[9px] font-mono text-steel uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-steel" />
                        <span>ARCHIVE DOSSIER: {selectedArchiveWatch.brand} {selectedArchiveWatch.model}</span>
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
                  <div className="prose prose-neutral text-ink text-sm sm:text-base font-sans font-light leading-relaxed whitespace-pre-line">
                    {storyText}
                  </div>
                ) : (
                  <p className="text-sm font-sans font-light text-ink-muted text-center py-8">
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
                  <div className="flex flex-col sm:items-end gap-1">
                    <div className="text-[10px] tracking-widest uppercase text-steel">
                      AUTHENTICATED COMMUNITY RECORD
                    </div>
                    {selectedArchiveWatch ? (
                      <div className="text-[9px] font-mono text-ink-muted uppercase">
                        CONNECTS TO ARCHIVE: {selectedArchiveWatch.brand} {selectedArchiveWatch.model} (REF. {selectedArchiveWatch.reference_number})
                      </div>
                    ) : (
                      <div className="text-[9px] font-mono text-ink-muted uppercase">
                        STANDALONE PERSONAL DISPATCH
                      </div>
                    )}
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
                  ? editingStory?.status === 'published'
                    ? 'UPDATING STORY...'
                    : 'PUBLISHING TO ARCHIVE...'
                  : editingStory?.status === 'published'
                    ? 'UPDATE STORY \u2192'
                    : 'PUBLISH COMMUNITY STORY \u2192'}
              </Button>
              {(!editingStory || editingStory.status === 'draft') && (
                <Button
                  variant="secondary"
                  size="lg"
                  disabled={submitting}
                  onClick={handleSaveDraft}
                  className="w-full sm:w-auto"
                >
                  {submitting && submitAction === 'draft'
                    ? editingStory
                      ? 'UPDATING DRAFT...'
                      : 'SAVING DRAFT...'
                    : editingStory
                      ? 'UPDATE DRAFT'
                      : 'SAVE AS DRAFT'}
                </Button>
              )}
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

        {/* Archive Watch Picker Modal */}
        {isArchivePickerOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-ink/60 animate-fadeIn"
            role="dialog"
            aria-modal="true"
            aria-labelledby="archive-picker-title"
            onClick={handleCloseArchivePicker}
          >
            <div
              className="relative w-full max-w-4xl max-h-[90vh] bg-warm-white border border-hairline flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 sm:p-8 border-b border-hairline flex items-start justify-between bg-warm-surface/20">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-[10px] font-mono tracking-[0.25em] text-ink-muted uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-steel" aria-hidden="true" />
                    <span>VERIFIED WATCH ARCHIVE // SELECT SPECIMEN</span>
                  </div>
                  <h2
                    id="archive-picker-title"
                    className="font-display text-2xl sm:text-3xl font-normal tracking-tight text-ink uppercase"
                  >
                    Connect to Archive Dossier
                  </h2>
                  <p className="mt-1 text-xs font-mono text-ink-secondary">
                    Select the official archive watch corresponding to your dispatch.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCloseArchivePicker}
                  aria-label="Close archive selector"
                  className="p-2 border border-hairline hover:border-ink bg-warm-white text-ink transition-colors cursor-pointer"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="square" strokeLinejoin="miter" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-4 sm:p-6 border-b border-hairline bg-warm-white">
                <div className="relative">
                  <input
                    type="text"
                    value={archiveSearchQuery}
                    onChange={(e) => setArchiveSearchQuery(e.target.value)}
                    placeholder="Search archive by brand, model, reference number, or category..."
                    className="w-full bg-warm-surface/40 border border-hairline px-4 py-3 pl-11 text-xs font-mono text-ink placeholder:text-ink-muted focus:outline-none focus:border-ink transition-colors"
                    autoFocus
                  />
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-secondary">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      aria-hidden="true"
                    >
                      <circle cx="11" cy="11" r="7" />
                      <line x1="16.5" y1="16.5" x2="21" y2="21" />
                    </svg>
                  </div>
                  {archiveSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setArchiveSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-ink-muted hover:text-ink text-xs font-mono cursor-pointer"
                    >
                      CLEAR
                    </button>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase">
                  <span>
                    SHOWING {filteredArchiveWatches.length} OF {archiveWatches.length} ARCHIVE SPECIMENS
                  </span>
                  <span>CENTRAL WATCH DATABASE</span>
                </div>
              </div>

              {/* Watch Grid */}
              <div className="overflow-y-auto p-4 sm:p-6 flex-1 space-y-3 sm:space-y-4">
                {archiveWatchesLoading ? (
                  <div className="py-16 text-center">
                    <div className="w-8 h-8 mx-auto mb-4 border-2 border-steel border-t-transparent animate-spin rounded-full" />
                    <p className="text-xs font-mono text-ink-muted uppercase tracking-widest">
                      QUERYING WATCH ARCHIVE...
                    </p>
                  </div>
                ) : filteredArchiveWatches.length === 0 ? (
                  <div className="py-16 text-center border border-dashed border-hairline bg-warm-surface/20">
                    <p className="text-xs font-mono tracking-widest text-ink-muted uppercase">
                      NO ARCHIVE SPECIMENS MATCH &ldquo;{archiveSearchQuery}&rdquo;
                    </p>
                    {archiveSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setArchiveSearchQuery('')}
                        className="mt-3 text-[11px] font-mono uppercase tracking-wider text-ink underline cursor-pointer"
                      >
                        Reset Search
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredArchiveWatches.map((watch) => {
                      const isSelected = selectedArchiveWatch?.id === watch.id

                      return (
                        <div
                          key={watch.id}
                          onClick={() => {
                            setSelectedArchiveWatch(watch)
                            handleCloseArchivePicker()
                          }}
                          className={`relative border text-left transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer group ${
                            isSelected
                              ? 'border-ink bg-warm-surface/60 ring-1 ring-ink'
                              : 'border-hairline bg-warm-surface/20 hover:border-ink hover:bg-warm-surface/60'
                          }`}
                        >
                          <div className="p-4 flex gap-4 items-center">
                            <div className="w-16 h-16 bg-warm-surface border border-hairline shrink-0 overflow-hidden flex items-center justify-center">
                              <WatchImage
                                src={watch.image_url}
                                alt={`${watch.brand} ${watch.model}`}
                                aspectRatio="h-full w-full"
                                compact
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="text-[10px] font-mono uppercase tracking-widest text-ink-muted">
                                {watch.brand}
                              </div>
                              <div className="text-xs font-sans font-medium text-ink uppercase tracking-tight truncate">
                                {watch.model}
                              </div>
                              <div className="text-[10px] font-mono text-ink-secondary truncate">
                                REF. {watch.reference_number}
                              </div>
                            </div>
                          </div>

                          <div className="px-4 py-2 border-t border-hairline bg-warm-surface/40 flex items-center justify-between text-[9px] font-mono tracking-wider uppercase text-ink-muted group-hover:text-ink">
                            <span>{watch.category || 'TIMEPIECE'}</span>
                            <span className={isSelected ? 'text-ink font-bold' : ''}>
                              {isSelected ? '\u2713 SELECTED' : 'LINK SPECIMEN \u2192'}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-6 border-t border-hairline bg-warm-surface/20 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedArchiveWatch(null)
                    handleCloseArchivePicker()
                  }}
                  className="text-xs font-mono tracking-wider uppercase text-ink-muted hover:text-ink underline cursor-pointer"
                >
                  CLEAR / PROCEED UNLINKED
                </button>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleCloseArchivePicker}
                >
                  CLOSE
                </Button>
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  )
}

