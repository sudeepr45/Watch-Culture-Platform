import { useState, useEffect, type FormEvent } from 'react'
import Container from '../components/common/Container'
import Button from '../components/common/Button'
import WatchImage from '../components/common/WatchImage'
import { isSafeWatchImageUrl } from '../utils/imageSafety'
import { Link } from '../router'
import { useRouter } from '../router/useRouter'
import { useAuth } from '../context/useAuth'
import {
  fetchUserCollection,
  removeWatchFromCollection,
} from '../services/collectionService'
import {
  fetchBookmarkedStories,
  unbookmarkStory,
} from '../services/interactionService'
import type { UserWatchWithWatch } from '../types/collection'
import type { StoryWithAuthorAndWatch } from '../types/story'

export default function ProfilePage() {
  const { user, profile, loading, isAuthenticated, signOut, updateProfile } = useAuth()
  const { navigate } = useRouter()

  const [isEditing, setIsEditing] = useState(false)
  const [editDisplayName, setEditDisplayName] = useState('')
  const [editUsername, setEditUsername] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editAvatarUrl, setEditAvatarUrl] = useState('')

  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // My Wrist / Collection State
  const [collection, setCollection] = useState<UserWatchWithWatch[] | null>(null)
  const [collectionLoading, setCollectionLoading] = useState(() => Boolean(user?.id))
  const [collectionError, setCollectionError] = useState<string | null>(null)

  // Saved / Bookmarked Stories State
  const [savedStories, setSavedStories] = useState<StoryWithAuthorAndWatch[] | null>(null)
  const [savedStoriesLoading, setSavedStoriesLoading] = useState(() => Boolean(user?.id))
  const [savedStoriesError, setSavedStoriesError] = useState<string | null>(null)
  const [removingBookmarkId, setRemovingBookmarkId] = useState<string | null>(null)

  // Start editing mode with current profile values
  const startEditing = () => {
    setEditDisplayName(profile?.display_name || '')
    setEditUsername(profile?.username || '')
    setEditBio(profile?.bio || '')
    setEditAvatarUrl(profile?.avatar_url || '')
    setErrorMessage(null)
    setSuccessMessage(null)
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setErrorMessage(null)
  }

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)
    setSaving(true)

    const result = await updateProfile({
      display_name: editDisplayName,
      username: editUsername,
      bio: editBio,
      avatar_url: editAvatarUrl,
    })

    setSaving(false)

    if (!result.success) {
      setErrorMessage(result.error || 'Failed to update profile.')
    } else {
      setSuccessMessage('Collector dossier updated successfully.')
      setIsEditing(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  // Manual retry handler for wrist collection query
  const retryCollection = async () => {
    if (!user?.id) return
    setCollectionLoading(true)
    setCollectionError(null)
    const result = await fetchUserCollection(user.id)
    if (result.error) {
      setCollectionError(result.error.message)
    } else {
      setCollection(result.data || [])
    }
    setCollectionLoading(false)
  }

  // Load collector's wrist collection without synchronous setState in effect
  useEffect(() => {
    let isMounted = true
    const userId = user?.id

    if (!userId) {
      return
    }

    fetchUserCollection(userId).then((result) => {
      if (!isMounted) return
      if (result.error) {
        setCollectionError(result.error.message)
      } else {
        setCollection(result.data || [])
      }
      setCollectionLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [user?.id])

  const handleRemoveFromCollection = async (watchId: string) => {
    if (!user) return
    const result = await removeWatchFromCollection(user.id, watchId)
    if (result.success) {
      setCollection((prev) => (prev ? prev.filter((item) => item.watch_id !== watchId) : []))
    }
  }

  // Load collector's bookmarked stories without synchronous setState in effect
  useEffect(() => {
    let isMounted = true
    const userId = user?.id

    if (!userId) {
      return
    }

    fetchBookmarkedStories(userId).then((result) => {
      if (!isMounted) return
      if (result.error) {
        setSavedStoriesError(result.error.message)
      } else {
        setSavedStories(result.data || [])
      }
      setSavedStoriesLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [user?.id])

  const handleRemoveBookmark = async (storyId: string) => {
    if (!user?.id || removingBookmarkId) return
    setRemovingBookmarkId(storyId)
    const res = await unbookmarkStory(user.id, storyId)
    if (res.success) {
      setSavedStories((prev) => (prev ? prev.filter((s) => s.id !== storyId) : []))
    }
    setRemovingBookmarkId(null)
  }

  // Format member since date
  const memberSinceDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : 'Recently Joined'

  // 1. Initial Session Loading State
  if (loading) {
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

  // 2. Unauthenticated / Signed-Out State
  if (!isAuthenticated) {
    return (
      <div className="py-12 sm:py-16 lg:py-20">
        <Container>
          {/* Profile Header */}
          <div className="border-b border-hairline pb-8 mb-12 sm:mb-16">
            <div className="flex items-center gap-2 mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-ink-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-steel" aria-hidden="true" />
              <span>PERSONAL ARCHIVE &bull; NOT SIGNED IN</span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight text-ink uppercase">
              My Wrist
            </h1>
            <p className="mt-3 text-xs font-mono uppercase tracking-[0.2em] text-ink-muted">
              Personal record of watches
            </p>
          </div>

          {/* Unauthenticated Personal Record Action Card */}
          <div className="relative border border-hairline bg-warm-surface/40 p-8 sm:p-14 lg:p-16 max-w-3xl mx-auto text-center mb-16">
            <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center border border-hairline bg-warm-white text-ink">
              <svg
                className="w-7 h-7 text-ink-secondary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-normal tracking-tight text-ink uppercase">
              Establish Your Personal Record
            </h2>

            <p className="mt-3 text-sm sm:text-base text-ink-secondary font-light max-w-lg mx-auto leading-relaxed">
              Sign in to catalog the watches you wear, study, or admire, save editorial dispatches, and maintain your personal horological record.
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
              <Button
                variant="secondary"
                size="md"
                className="w-full sm:w-auto"
                onClick={() => navigate('/signup')}
              >
                CREATE ACCOUNT &rarr;
              </Button>
            </div>

            <p className="mt-6 text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase">
              AUTHENTICATED VIA SUPABASE INFRASTRUCTURE
            </p>
          </div>

          {/* Quiet Archive Overview (No fake counts) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="border border-hairline p-6 bg-warm-surface/20">
              <div className="text-[10px] font-mono tracking-[0.18em] text-ink-muted uppercase pb-3 border-b border-hairline">
                PERSONAL RECORD
              </div>
              <p className="mt-4 text-xs text-ink-secondary leading-relaxed font-light">
                Catalog timepieces you own, study, or wish to preserve. Each reference is logged with technical specifications and archival photography.
              </p>
            </div>

            <div className="border border-hairline p-6 bg-warm-surface/20">
              <div className="text-[10px] font-mono tracking-[0.18em] text-ink-muted uppercase pb-3 border-b border-hairline">
                SAVED STORIES
              </div>
              <p className="mt-4 text-xs text-ink-secondary leading-relaxed font-light">
                Keep noteworthy editorial profiles, collector accounts, and historical dispatches close for continued reference.
              </p>
            </div>
          </div>
        </Container>
      </div>
    )
  }

  // 3. Authenticated / Signed-In State
  return (
    <div className="py-12 sm:py-16 lg:py-20">
      <Container>
        {/* Profile Header */}
        <div className="border-b border-hairline pb-8 mb-12 sm:mb-16">
          <div className="flex items-center gap-2 mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-ink-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-steel" aria-hidden="true" />
            <span>PERSONAL ARCHIVE &bull; AUTHENTICATED</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight text-ink uppercase">
            Personal Record
          </h1>
          <p className="mt-3 text-xs font-mono uppercase tracking-widest text-ink-secondary">
            MEMBER SINCE {memberSinceDate.toUpperCase()}
          </p>
        </div>

        {/* Success / Error Banners */}
        {successMessage && (
          <div className="mb-8 p-4 border border-emerald-300 bg-emerald-50 text-xs font-mono text-emerald-900">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-8 p-4 border border-rose-300 bg-rose-50 text-xs font-mono text-rose-900">
            {errorMessage}
          </div>
        )}

        {/* Main Profile Showcase Card */}
        <div className="border border-hairline bg-warm-surface/30 p-8 sm:p-12 mb-12">
          {isEditing ? (
            /* ============================================================ */
            /* EDIT PROFILE FORM                                           */
            /* ============================================================ */
            <div>
              <div className="border-b border-hairline pb-4 mb-6 flex items-center justify-between">
                <h3 className="font-display text-2xl font-normal uppercase text-ink">
                  Edit Collector Dossier
                </h3>
                <span className="text-[10px] font-mono uppercase tracking-widest text-ink-muted">
                  PUBLIC SPECIFICATIONS
                </span>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-6 max-w-xl">
                <div>
                  <label
                    htmlFor="editDisplayName"
                    className="block text-xs font-mono uppercase tracking-wider text-ink font-semibold mb-1.5"
                  >
                    Display Name
                  </label>
                  <input
                    id="editDisplayName"
                    type="text"
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    placeholder="e.g. Hans Wilsdorf"
                    className="w-full px-4 py-3 bg-warm-white border border-hairline text-ink text-xs font-mono focus:outline-none focus:border-ink"
                  />
                </div>

                <div>
                  <label
                    htmlFor="editUsername"
                    className="block text-xs font-mono uppercase tracking-wider text-ink font-semibold mb-1.5"
                  >
                    Username (@)
                  </label>
                  <input
                    id="editUsername"
                    type="text"
                    required
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    placeholder="collector_name"
                    className="w-full px-4 py-3 bg-warm-white border border-hairline text-ink text-xs font-mono focus:outline-none focus:border-ink"
                  />
                  <p className="mt-1 text-[10px] font-mono text-ink-muted">
                    3–20 characters. Letters, numbers, and underscores only. Must be unique.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="editBio"
                    className="block text-xs font-mono uppercase tracking-wider text-ink font-semibold mb-1.5"
                  >
                    Collector Biography ({editBio.length}/250)
                  </label>
                  <textarea
                    id="editBio"
                    rows={3}
                    maxLength={250}
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="Describe your collecting focus, favorite era, or horological interests..."
                    className="w-full px-4 py-3 bg-warm-white border border-hairline text-ink text-xs font-mono focus:outline-none focus:border-ink resize-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="editAvatarUrl"
                    className="block text-xs font-mono uppercase tracking-wider text-ink font-semibold mb-1.5"
                  >
                    Avatar Image URL (Optional)
                  </label>
                  <input
                    id="editAvatarUrl"
                    type="url"
                    value={editAvatarUrl}
                    onChange={(e) => setEditAvatarUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-3 bg-warm-white border border-hairline text-ink text-xs font-mono focus:outline-none focus:border-ink"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={saving}
                  >
                    {saving ? 'SAVING DOSSIER...' : 'SAVE CHANGES \u2192'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={cancelEditing}
                    disabled={saving}
                  >
                    CANCEL
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            /* ============================================================ */
            /* PROFILE VIEW MODE                                            */
            /* ============================================================ */
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                {/* Avatar Display */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 border border-hairline bg-warm-white overflow-hidden flex items-center justify-center flex-shrink-0">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.display_name || profile.username}
                      className="w-full h-full object-cover object-center"
                    />
                  ) : (
                    <div className="font-display text-2xl sm:text-3xl text-ink uppercase">
                      {profile?.display_name
                        ? profile.display_name.charAt(0)
                        : profile?.username
                        ? profile.username.charAt(0)
                        : 'W'}
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-steel border border-warm-white" />
                </div>

                {/* Identity Information */}
                <div>
                  <h2 className="font-display text-3xl sm:text-4xl font-normal uppercase text-ink tracking-tight">
                    {profile?.display_name || 'Watch Collector'}
                  </h2>

                  <div className="mt-1 flex items-center gap-3 text-xs font-mono">
                    <span className="text-ink font-semibold">
                      @{profile?.username || 'collector'}
                    </span>
                    <span className="text-ink-muted">&bull;</span>
                    <span className="text-ink-secondary text-[11px]">
                      {user?.email} (PRIVATE)
                    </span>
                  </div>

                  {/* Bio */}
                  <p className="mt-4 text-xs sm:text-sm font-mono text-ink-secondary max-w-xl leading-relaxed">
                    {profile?.bio || (
                      <span className="text-ink-muted">
                        No biography added yet. Click &ldquo;Edit Profile&rdquo; to define your horological focus.
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={startEditing}
                >
                  EDIT PROFILE &rarr;
                </Button>
                <Button
                  variant="text"
                  size="sm"
                  onClick={handleLogout}
                  className="text-ink-secondary hover:text-rose-900"
                >
                  LOG OUT
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* MY WRIST: PERSONAL ARCHIVE                                   */}
        {/* ============================================================ */}
        <div className="border-t border-hairline pt-12 mb-16">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-mono tracking-[0.25em] text-ink-muted uppercase mb-1">
                PERSONAL ARCHIVE // MY WRIST
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-normal uppercase text-ink">
                My Wrist
              </h3>
              <p className="mt-1 text-xs text-ink-secondary font-light">
                This is becoming my personal record of watches.
              </p>
            </div>
            {collection && collection.length > 0 && (
              <div className="text-xs font-mono tracking-wider text-ink-secondary">
                {collection.length} {collection.length === 1 ? 'RECORD' : 'RECORDS'}
              </div>
            )}
          </div>

          {/* 1. Loading state */}
          {collectionLoading && (
            <div className="border border-hairline bg-warm-surface/20 p-12 sm:p-16 text-center">
              <div className="w-8 h-8 mx-auto mb-4 flex items-center justify-center border border-hairline bg-warm-white">
                <svg
                  className="w-4 h-4 text-steel animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
                </svg>
              </div>
              <p className="text-xs font-mono uppercase tracking-widest text-ink-muted">
                QUERYING PERSONAL RECORD...
              </p>
            </div>
          )}

          {/* 2. Error state */}
          {!collectionLoading && collectionError && (
            <div className="border border-hairline bg-warm-surface/30 p-8 text-center max-w-xl mx-auto">
              <p className="text-xs font-mono text-rose-800 mb-4">{collectionError}</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={retryCollection}
              >
                RETRY QUERY &rarr;
              </Button>
            </div>
          )}

          {/* 3. Empty state */}
          {!collectionLoading && !collectionError && (!collection || collection.length === 0) && (
            <div className="border border-hairline bg-warm-surface/20 p-8 sm:p-14 text-center max-w-2xl mx-auto">
              <div className="w-12 h-12 mx-auto mb-6 flex items-center justify-center border border-hairline bg-warm-white text-ink">
                <svg
                  className="w-5 h-5 text-ink-secondary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="9" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <h4 className="font-display text-2xl sm:text-3xl font-normal tracking-tight text-ink uppercase">
                Your Wrist Is Empty
              </h4>
              <p className="mt-3 text-xs sm:text-sm font-light text-ink-secondary leading-relaxed max-w-md mx-auto">
                No timepieces cataloged in your personal record yet. Explore the Archive to curate the pieces you hold or admire.
              </p>
              <div className="mt-6">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/watches')}
                >
                  EXPLORE ARCHIVE &rarr;
                </Button>
              </div>
            </div>
          )}

          {/* 4. Populated Personal Archive Grid (Matching Archive visual register) */}
          {!collectionLoading && !collectionError && collection && collection.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {collection.map(({ id: entryId, watch, created_at }) => {
                const dateAdded = created_at
                  ? new Date(created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : null

                return (
                  <div
                    key={entryId}
                    className="group relative border border-hairline bg-warm-surface/20 flex flex-col justify-between transition-all duration-300 hover:border-ink hover:bg-warm-surface/50 overflow-hidden"
                  >
                    {/* Documentary Specimen Photography */}
                    <div className="relative aspect-[4/3] w-full bg-warm-surface border-b border-hairline overflow-hidden block">
                      <WatchImage
                        src={watch.image_url}
                        alt={`${watch.brand} ${watch.model}`}
                        className="transition-opacity duration-300 group-hover:opacity-90"
                      />

                      {/* Integrated Archival Corner Tag */}
                      {watch.category && (
                        <div className="absolute top-0 left-0 border-b border-r border-hairline bg-warm-white px-2.5 py-1 text-[9px] font-mono tracking-[0.2em] uppercase text-ink font-medium">
                          {watch.category}
                        </div>
                      )}

                      {/* Era Tag */}
                      {watch.release_year && (
                        <div className="absolute top-0 right-0 border-b border-l border-hairline bg-warm-white px-2.5 py-1 text-[9px] font-mono tracking-[0.15em] text-ink-muted">
                          CIRCA {watch.release_year}
                        </div>
                      )}
                    </div>

                    {/* Specimen Identity & Metadata */}
                    <div className="p-6 flex flex-col justify-between flex-grow">
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-ink-secondary">
                          {watch.brand}
                        </div>
                        <Link
                          to={`/watches/${watch.slug}`}
                          className="mt-1 block font-display text-xl sm:text-2xl font-normal tracking-tight text-ink uppercase group-hover:text-neutral-800 transition-colors"
                        >
                          {watch.model}
                        </Link>
                        <div className="mt-1 text-xs font-mono text-ink-muted tracking-wider">
                          REF. {watch.reference_number}
                        </div>

                        {/* Concise Specification Strip */}
                        <div className="mt-4 pt-3 border-t border-hairline/60 grid grid-cols-3 gap-2 text-[10px] font-mono">
                          <div>
                            <span className="text-ink-muted uppercase block text-[8px] tracking-wider">CALIBRE</span>
                            <span className="text-ink truncate block font-medium">
                              {watch.calibre || watch.movement_name || watch.movement_type || '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-ink-muted uppercase block text-[8px] tracking-wider">DIAMETER</span>
                            <span className="text-ink block font-medium">
                              {watch.case_diameter_mm ? `${watch.case_diameter_mm}mm` : '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-ink-muted uppercase block text-[8px] tracking-wider">MATERIAL</span>
                            <span className="text-ink truncate block font-medium">
                              {watch.case_material || '—'}
                            </span>
                          </div>
                        </div>

                        {/* Real Date Added */}
                        {dateAdded && (
                          <div className="mt-3 text-[9px] font-mono tracking-widest text-ink-muted uppercase">
                            CATALOGED {dateAdded}
                          </div>
                        )}
                      </div>

                      {/* Footer Action Strip */}
                      <div className="mt-6 pt-4 border-t border-hairline flex items-center justify-between text-[11px] font-mono">
                        <Link
                          to={`/watches/${watch.slug}`}
                          className="text-ink font-semibold hover:text-neutral-700 transition-colors duration-200 flex items-center gap-1 uppercase tracking-wider"
                        >
                          VIEW DOSSIER &rarr;
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCollection(watch.id)}
                          className="text-[10px] text-ink-muted hover:text-rose-800 transition-colors uppercase tracking-wider cursor-pointer"
                        >
                          REMOVE
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Saved Stories / Bookmarked Dispatches */}
        <div className="border-t border-hairline pt-12">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 mb-8">
            <div>
              <div className="text-[10px] font-mono tracking-[0.25em] text-ink-muted uppercase mb-1">
                SAVED DISPATCHES // PERSONAL ARCHIVE
              </div>
              <h3 className="font-display text-2xl font-normal uppercase text-ink">
                Saved Stories
              </h3>
            </div>
            <div className="text-xs font-mono text-ink-muted">
              {savedStories ? `${savedStories.length} ${savedStories.length === 1 ? 'STORY' : 'STORIES'} SAVED` : '0 STORIES'}
            </div>
          </div>

          {savedStoriesLoading ? (
            <div className="p-8 border border-hairline bg-warm-surface/20 text-center">
              <span className="font-mono text-xs text-ink-muted uppercase tracking-[0.2em] animate-pulse">
                QUERYING SAVED DISPATCHES...
              </span>
            </div>
          ) : savedStoriesError ? (
            <div className="p-6 border border-hairline bg-red-50 text-red-700 text-xs font-mono">
              FAILED TO LOAD SAVED STORIES: {savedStoriesError}
            </div>
          ) : !savedStories || savedStories.length === 0 ? (
            <div className="border border-hairline p-8 bg-warm-surface/10 text-center">
              <div className="font-mono text-[10px] tracking-[0.2em] text-ink-muted uppercase mb-2">
                SAVED DISPATCHES // EMPTY ARCHIVE
              </div>
              <p className="text-sm font-sans font-light text-ink-secondary max-w-md mx-auto mb-4">
                No saved stories yet. Bookmark compelling collector accounts, provenance records, and technical narratives to reference anytime.
              </p>
              <Link
                to="/stories"
                className="inline-flex items-center text-xs font-mono text-ink font-semibold hover:text-neutral-700 uppercase tracking-wider transition-colors duration-200"
              >
                DISCOVER STORIES &rarr;
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedStories.map((story) => {
                const watchBrand = story.personal_watch_brand || story.watch?.brand || 'ARCHIVE'
                const watchModel = story.personal_watch_model || story.watch?.model || 'TIMEPIECE'
                const authorName = story.author?.display_name || story.author?.username || 'ANONYMOUS'
                const formattedDate = new Date(story.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })

                const imageUrl =
                  story.photo_url ||
                  (story.watch?.image_url && isSafeWatchImageUrl(story.watch.image_url)
                    ? story.watch.image_url
                    : null)

                return (
                  <div
                    key={story.id}
                    className="border border-hairline bg-warm-white flex flex-col justify-between group hover:border-ink/40 transition-colors"
                  >
                    <div>
                      {imageUrl && (
                        <Link to={`/stories/${story.slug}`} className="block relative aspect-[16/10] overflow-hidden bg-warm-surface border-b border-hairline">
                          <img
                            src={imageUrl}
                            alt={story.title}
                            className="w-full h-full object-cover grayscale contrast-125 group-hover:grayscale-0 transition-all duration-300"
                            loading="lazy"
                          />
                        </Link>
                      )}
                      <div className="p-5">
                        <div className="flex items-center justify-between text-[9px] font-mono tracking-[0.2em] text-ink-muted uppercase mb-2">
                          <span className="truncate max-w-[70%]">{watchBrand} &bull; {watchModel}</span>
                          <span>{formattedDate}</span>
                        </div>
                        <Link
                          to={`/stories/${story.slug}`}
                          className="font-display text-lg uppercase text-ink tracking-tight line-clamp-2 group-hover:text-neutral-700 transition-colors duration-200"
                        >
                          {story.title}
                        </Link>
                        <div className="mt-2 text-[10px] font-mono text-ink-secondary tracking-wider uppercase">
                          BY {authorName}
                        </div>
                      </div>
                    </div>

                    <div className="p-5 pt-0 border-t border-hairline/50 mt-4 flex items-center justify-between text-[11px] font-mono">
                      <Link
                        to={`/stories/${story.slug}`}
                        className="text-ink font-semibold hover:text-neutral-700 transition-colors duration-200 flex items-center gap-1 text-[10px] tracking-wider uppercase"
                      >
                        READ STORY &rarr;
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleRemoveBookmark(story.id)}
                        disabled={removingBookmarkId === story.id}
                        className="text-[10px] text-ink-muted hover:text-rose-800 transition-colors uppercase tracking-wider cursor-pointer disabled:opacity-50"
                      >
                        {removingBookmarkId === story.id ? 'REMOVING...' : 'REMOVE'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Container>
    </div>
  )
}
