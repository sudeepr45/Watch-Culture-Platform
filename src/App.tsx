import { RouterProvider } from './router'
import { useRouter } from './router/useRouter'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import HomePage from './pages/HomePage'
import StoriesPage from './pages/StoriesPage'
import StoryDetailPage from './pages/StoryDetailPage'
import CreateStoryPage from './pages/CreateStoryPage'
import WatchesPage from './pages/WatchesPage'
import WatchDetailPage from './pages/WatchDetailPage'
import BattlesPage from './pages/BattlesPage'
import Watch101Page from './pages/Watch101Page'
import Watch101TopicPage from './pages/Watch101TopicPage'
import ExplorePage from './pages/ExplorePage'
import ProfilePage from './pages/ProfilePage'
import LoginPage from './pages/LoginPage'
import SearchPage from './pages/SearchPage'
import RandomWatchPage from './pages/RandomWatchPage'
import CasePage from './pages/CasePage'
import CuratorPage from './pages/CuratorPage'
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

  const renderPage = () => {
    // Curator routes — private, checked before public dynamic routes
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

    // Dynamic The Case route: /case/:slug
    if (pathname.startsWith('/case/') && pathname !== '/case') {
      const slug = pathname.replace('/case/', '')
      return <CasePage initialSlug={slug} />
    }

    switch (pathname) {
      case '/stories':
        return <StoriesPage />
      case '/watches':
        return <WatchesPage />
      case '/battles':
        return <BattlesPage />
      case '/watch-101':
        return <Watch101Page />
      case '/explore':
        return <ExplorePage />
      case '/random':
        return <RandomWatchPage />
      case '/case':
        return <CasePage />
      case '/profile':
        return <ProfilePage />
      case '/login':
        return <LoginPage initialMode="login" />
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
