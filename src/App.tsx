import { useState } from 'react'
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

function AppContent() {
  const { pathname } = useRouter()
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      return window.localStorage.getItem('mj_sound_choice') === 'enabled'
    } catch {
      return false
    }
  })

  useScrollWindOnce(soundEnabled, pathname)

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
    <div className="min-h-screen flex flex-col bg-warm-white text-ink selection:bg-steel/20 selection:text-ink">
      {/* Sticky Editorial Navigation */}
      <Navbar />

      {/* Dynamic Page Content */}
      <main className="flex-grow">{renderPage()}</main>

      {/* Comprehensive Editorial Footer */}
      <Footer />

      <SoundNote soundEnabled={soundEnabled} onSoundChange={setSoundEnabled} />
    </div>
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
