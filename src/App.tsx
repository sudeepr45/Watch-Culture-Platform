import { RouterProvider } from './router'
import { useRouter } from './router/useRouter'
import Navbar from './components/layout/Navbar'
import Container from './components/common/Container'
import HomePage from './pages/HomePage'
import StoriesPage from './pages/StoriesPage'
import WatchesPage from './pages/WatchesPage'
import BattlesPage from './pages/BattlesPage'
import Watch101Page from './pages/Watch101Page'
import ExplorePage from './pages/ExplorePage'
import ProfilePage from './pages/ProfilePage'
import LoginPage from './pages/LoginPage'
import SearchPage from './pages/SearchPage'

function AppContent() {
  const { pathname } = useRouter()

  const renderPage = () => {
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
      case '/profile':
        return <ProfilePage />
      case '/login':
        return <LoginPage />
      case '/search':
        return <SearchPage />
      case '/':
      default:
        return <HomePage />
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-warm-white text-ink selection:bg-gold/20 selection:text-ink">
      {/* Sticky Editorial Navigation */}
      <Navbar />

      {/* Dynamic Page Content */}
      <main className="flex-grow">{renderPage()}</main>

      {/* Understated Editorial Colophon */}
      <footer className="border-t border-hairline bg-warm-white py-10">
        <Container>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono tracking-[0.16em] text-ink-muted uppercase">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-ink">PROJECT WATCH</span>
              <span>&bull;</span>
              <span>PHASE 2A // FEATURE ROUTING</span>
            </div>
            <div>
              &copy; {new Date().getFullYear()} WATCH CULTURE PLATFORM. ALL RIGHTS RESERVED.
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
      <AppContent />
    </RouterProvider>
  )
}
