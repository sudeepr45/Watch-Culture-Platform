import { RouterProvider } from './router'
import { useRouter } from './router/useRouter'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/layout/Navbar'
import Container from './components/common/Container'
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

function AppContent() {
  const { pathname } = useRouter()

  const renderPage = () => {
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

      {/* Understated Editorial Colophon */}
      <footer className="border-t border-hairline bg-warm-white py-10">
        <Container>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono tracking-[0.16em] text-ink-muted uppercase">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-ink">MOERI &amp; JEANNERET</span>
              <span>&bull;</span>
              <span>CULTURAL ARCHIVE &amp; DISPATCHES</span>
            </div>
            <div>
              &copy; {new Date().getFullYear()} MOERI &amp; JEANNERET. ALL RIGHTS RESERVED.
            </div>
          </div>
        </Container>
      </footer>
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
