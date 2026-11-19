import { useCallback, useEffect, useRef, useState } from 'react'
import { RouterProvider } from './router'
import { useRouter } from './router/useRouter'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import SoundNote from './components/common/SoundNote'
import useScrollWindOnce from './hooks/useScrollWindOnce'
import HomePage from './pages/HomePage'
import ImageDiagnosticPage from './pages/ImageDiagnosticPage'
import StoriesPage from './pages/StoriesPage'
import BulletinPage from './pages/BulletinPage'
import BulletinDetailPage from './pages/BulletinDetailPage'
import StoryDetailPage from './pages/StoryDetailPage'
import CreateStoryPage from './pages/CreateStoryPage'
import WatchesPage from './pages/WatchesPage'
import WatchDetailPage from './pages/WatchDetailPage'
import Watch101Page from './pages/Watch101Page'
import Watch101TopicPage from './pages/Watch101TopicPage'
import ProfilePage from './pages/ProfilePage'
import LoginPage from './pages/LoginPage'
import UpdatePasswordPage from './pages/UpdatePasswordPage'
import SearchPage from './pages/SearchPage'
import CuratorPage from './pages/CuratorPage'
import CuratorBulletinsPage from './pages/CuratorBulletinsPage'
import CuratorNewBulletinPage from './pages/CuratorNewBulletinPage'
import CuratorEditBulletinPage from './pages/CuratorEditBulletinPage'
import CuratorNewWatchPage from './pages/CuratorNewWatchPage'
import CuratorEditWatchPage from './pages/CuratorEditWatchPage'
import PrivacyPage from './pages/PrivacyPage'
import TermsPage from './pages/TermsPage'
import CommunityGuidelinesPage from './pages/CommunityGuidelinesPage'
import DisclaimerPage from './pages/DisclaimerPage'
import CopyrightPage from './pages/CopyrightPage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import PlatePage from './pages/PlatePage'
import PlateIndexPage from './pages/PlateIndexPage'
import HiddenAmpersandExperience from './components/common/HiddenAmpersandExperience'
import type { AmpersandPhase } from './components/common/hiddenAmpersandTiming'
import type { AmpersandOrigin } from './components/common/BrandLogo'

function AppContent() {
  const { pathname } = useRouter()
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      return window.localStorage.getItem('mj_sound_choice') === 'enabled'
    } catch {
      return false
    }
  })
  const [ampersandPhase, setAmpersandPhase] = useState<AmpersandPhase>('idle')
  const [ampersandOrigin, setAmpersandOrigin] = useState<AmpersandOrigin>({ x: 0.5, y: 0.1 })
  const [exitImpactOrigin, setExitImpactOrigin] = useState<AmpersandOrigin | null>(null)
  const [reducedMotion, setReducedMotion] = useState(false)
  const phaseRef = useRef<AmpersandPhase>('idle')
  const savedScrollRef = useRef(0)
  const savedBodyStyleRef = useRef<{ position: string; top: string; width: string; overflow: string; htmlOverflow: string } | null>(null)
  const historyEntryActiveRef = useRef(false)
  const historyTraversalPendingRef = useRef(false)
  const historyMarker = '__mojeanAmpersandExperience'
  const historyMarkerValue = 'mojean-hidden-ampersand-v1'

  const setPhase = useCallback((phase: AmpersandPhase) => {
    phaseRef.current = phase
    setAmpersandPhase(phase)
  }, [])

  const restoreDocument = useCallback(() => {
    const saved = savedBodyStyleRef.current
    if (saved) {
      document.body.style.position = saved.position
      document.body.style.top = saved.top
      document.body.style.width = saved.width
      document.body.style.overflow = saved.overflow
      document.documentElement.style.overflow = saved.htmlOverflow
      savedBodyStyleRef.current = null
      window.scrollTo({ top: savedScrollRef.current, behavior: 'instant' })
    }
  }, [])

  const beginAmpersandExperience = useCallback((origin: AmpersandOrigin) => {
    if (pathname !== '/' || phaseRef.current !== 'idle') return
    setAmpersandOrigin(origin)
    setExitImpactOrigin(null)
    savedScrollRef.current = window.scrollY
    savedBodyStyleRef.current = {
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
      overflow: document.body.style.overflow,
      htmlOverflow: document.documentElement.style.overflow,
    }
    document.body.style.position = 'fixed'
    document.body.style.top = `-${savedScrollRef.current}px`
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    try {
      const state = window.history.state && typeof window.history.state === 'object' ? window.history.state : {}
      window.history.pushState({ ...state, [historyMarker]: historyMarkerValue }, '', window.location.href)
      historyEntryActiveRef.current = true
      historyTraversalPendingRef.current = false
    } catch {
      // The visual experience remains available if history state is restricted.
      historyEntryActiveRef.current = false
    }
    setPhase('consuming')
  }, [historyMarker, historyMarkerValue, pathname, setPhase])

  const requestAmpersandExit = useCallback((origin?: AmpersandOrigin) => {
    if (phaseRef.current === 'idle' || phaseRef.current === 'reversing') return
    setExitImpactOrigin(origin ?? null)
    setPhase('reversing')
    if (
      historyEntryActiveRef.current
      && !historyTraversalPendingRef.current
      && window.history.state?.[historyMarker] === historyMarkerValue
    ) {
      historyTraversalPendingRef.current = true
      window.history.back()
    }
  }, [historyMarker, historyMarkerValue, setPhase])

  const finishAmpersandExit = useCallback(() => {
    restoreDocument()
    setExitImpactOrigin(null)
    historyEntryActiveRef.current = false
    historyTraversalPendingRef.current = false
    setPhase('idle')
  }, [restoreDocument, setPhase])

  const finishAmpersandInversion = useCallback(() => setPhase('inverted'), [setPhase])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && phaseRef.current !== 'idle') {
        event.preventDefault()
        requestAmpersandExit()
      }
    }
    const handlePopState = () => {
      const state = window.history.state
      const marker = state?.[historyMarker]
      const hasExperienceMarker = marker === historyMarkerValue
      const hasLegacyExperienceMarker = marker === true
      const hasTransientMarker = hasExperienceMarker || hasLegacyExperienceMarker

      if (hasTransientMarker && phaseRef.current === 'idle') {
        const cleanState = { ...state }
        delete cleanState[historyMarker]
        window.history.replaceState(cleanState, '', window.location.href)
        historyEntryActiveRef.current = false
        historyTraversalPendingRef.current = false
        return
      }

      if (phaseRef.current === 'idle') return
      if (window.location.pathname !== '/') {
        historyEntryActiveRef.current = false
        historyTraversalPendingRef.current = false
        finishAmpersandExit()
      } else if (hasTransientMarker && phaseRef.current === 'reversing') {
        // Forward restored the transient entry during reversal; consume it again.
        historyTraversalPendingRef.current = true
        window.history.back()
      } else if (!hasExperienceMarker) {
        historyTraversalPendingRef.current = false
        historyEntryActiveRef.current = false
        if (phaseRef.current !== 'reversing') requestAmpersandExit()
      }
    }
    const currentState = window.history.state
    if (currentState?.[historyMarker] === historyMarkerValue || currentState?.[historyMarker] === true) {
      const cleanState = { ...currentState }
      delete cleanState[historyMarker]
      window.history.replaceState(cleanState, '', window.location.href)
    }
    window.addEventListener('keydown', handleKey)
    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('keydown', handleKey)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [finishAmpersandExit, historyMarker, historyMarkerValue, requestAmpersandExit])

  const { playbackIssue, retryWindSound } = useScrollWindOnce(soundEnabled, pathname)

  const renderPage = () => {
    if (pathname === '/image-diagnostic') {
      return <ImageDiagnosticPage />
    }

    // Curator routes — private, checked before public dynamic routes
    const curatorBulletinEditMatch = pathname.match(/^\/curator\/bulletins\/([^/]+)\/edit$/)
    if (curatorBulletinEditMatch) {
      return <CuratorEditBulletinPage key={curatorBulletinEditMatch[1]} id={curatorBulletinEditMatch[1]} />
    }

    if (pathname === '/curator/bulletins') {
      return <CuratorBulletinsPage />
    }

    if (pathname === '/curator/bulletins/new') {
      return <CuratorNewBulletinPage />
    }

    if (pathname === '/curator/new') {
      return <CuratorNewWatchPage />
    }

    if (pathname.startsWith('/curator/edit/') && pathname !== '/curator/edit') {
      const slug = pathname.replace('/curator/edit/', '')
      return <CuratorEditWatchPage slug={slug} />
    }

    if (pathname === '/curator') {
      return <CuratorPage />
    }

    // Dynamic Bulletin detail route: /bulletin/:slug
    const bulletinMatch = pathname.match(/^\/bulletin\/([^/]+)$/)
    if (bulletinMatch) {
      return <BulletinDetailPage slug={bulletinMatch[1]} />
    }

    // Create Story route: /stories/new (must be checked before dynamic :slug)
    if (pathname === '/stories/new') {
      return <CreateStoryPage />
    }

    // Edit Story route: /stories/:slug/edit (must be checked before dynamic :slug)
    if (pathname.startsWith('/stories/') && pathname.endsWith('/edit')) {
      const slug = pathname.replace('/stories/', '').replace(/\/edit$/, '')
      return <CreateStoryPage editSlug={slug} />
    }

    // Dynamic Story Detail route: /stories/:slug
    if (pathname.startsWith('/stories/') && pathname !== '/stories') {
      const slug = pathname.replace('/stories/', '')
      return <StoryDetailPage slug={slug} />
    }

    // Dynamic Watch Detail route: /watches/:slug
    if (pathname.startsWith('/watches/') && pathname !== '/watches') {
      const slug = pathname.replace('/watches/', '')
      return <WatchDetailPage slug={slug} />
    }

    // Dynamic Watch 101 Topic route: /watch-101/:slug
    if (pathname.startsWith('/watch-101/') && pathname !== '/watch-101') {
      const slug = pathname.replace('/watch-101/', '')
      return <Watch101TopicPage slug={slug} />
    }

    switch (pathname) {
      case '/bulletin':
        return <BulletinPage />
      case '/stories':
        return <StoriesPage />
      case '/watches':
        return <WatchesPage />
      case '/watch-101':
        return <Watch101Page />
      case '/plate':
        return <PlatePage />
      case '/plates':
        return <PlateIndexPage />
      case '/profile':
        return <ProfilePage />
      case '/login':
        return <LoginPage initialMode="login" />
      case '/update-password':
        return <UpdatePasswordPage />
      case '/signup':
        return <LoginPage initialMode="signup" />
      case '/search':
        return <SearchPage />
      case '/privacy':
        return <PrivacyPage />
      case '/terms':
        return <TermsPage />
      case '/community-guidelines':
        return <CommunityGuidelinesPage />
      case '/disclaimer':
        return <DisclaimerPage />
      case '/copyright':
        return <CopyrightPage />
      case '/about':
        return <AboutPage />
      case '/contact':
        return <ContactPage />
      case '/':
      default:
        return <HomePage />
    }
  }

  return (
    <>
    <div
      className="min-h-screen flex flex-col bg-warm-white text-ink selection:bg-steel/20 selection:text-ink"
      aria-hidden={ampersandPhase !== 'idle'}
      inert={ampersandPhase !== 'idle'}
    >
      {/* Sticky Editorial Navigation */}
      <Navbar onAmpersandActivate={beginAmpersandExperience} />

      {/* Dynamic Page Content */}
      <main className="flex-grow">{renderPage()}</main>

      {/* Comprehensive Editorial Footer */}
      <Footer />

      <SoundNote soundEnabled={soundEnabled} onSoundChange={setSoundEnabled} playbackIssue={pathname === '/' ? playbackIssue : null} onRetry={retryWindSound} />
    </div>
    <HiddenAmpersandExperience
      phase={ampersandPhase}
      origin={ampersandOrigin}
      exitOrigin={exitImpactOrigin}
      reducedMotion={reducedMotion}
      onInverted={finishAmpersandInversion}
      onReversed={finishAmpersandExit}
      onExit={requestAmpersandExit}
    />
    </>
  )
}

export default function App() {
  return (
    <RouterProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </RouterProvider>
  )
}
