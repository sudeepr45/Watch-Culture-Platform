import { useState, useEffect } from 'react'
import Container from '../common/Container'
import BrandLogo from '../common/BrandLogo'
import { Link } from '../../router'
import { useRouter } from '../../router/useRouter'
import { useAuth } from '../../context/useAuth'

const EDITORIAL_ITEMS = [
  { label: 'CULTURE', to: '/explore' },
  { label: 'STORIES', to: '/stories' },
  { label: 'ARCHIVE', to: '/watches' },
]

const EXPERIENCE_ITEMS = [
  { label: 'WORTH IT?', to: '/case' },
  { label: 'RANDOM ACCESS', to: '/random' },
  { label: 'WATCH 101', to: '/watch-101' },
  { label: 'BATTLES', to: '/battles' },
]

export default function Navbar() {
  const { pathname, navigate } = useRouter()
  const { isAuthenticated, profile } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-colors duration-150 ${
        scrolled
          ? 'bg-warm-white border-b border-hairline'
          : 'bg-warm-white border-b border-hairline'
      }`}
    >
      <Container>
        <div className="flex items-center justify-between h-20">
          {/* Left: Brand Masthead */}
          <div className="flex items-center">
            <Link
              to="/"
              className="group flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-ink"
              aria-label="MOERI & JEANNERET Home"
            >
              <BrandLogo
                variant="horizontal"
                size="sm"
                withSubtitle
                subtitle="CULTURE &bull; STORIES &bull; ARCHIVE"
              />
            </Link>
          </div>

          {/* Center: Desktop Navigation Hierarchy */}
          <nav
            aria-label="Main Navigation"
            className="hidden lg:flex items-center gap-5 xl:gap-8"
          >
            {/* EDITORIAL CLUSTER */}
            <div className="flex items-center gap-4 xl:gap-6">
              {EDITORIAL_ITEMS.map((item) => {
                const isActive =
                  item.to === '/explore'
                    ? pathname === '/explore'
                    : pathname.startsWith(item.to)
                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    aria-current={isActive ? 'page' : undefined}
                    className={`relative text-[11px] xl:text-xs tracking-[0.16em] font-medium transition-colors py-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-ink ${
                      isActive
                        ? 'text-ink font-semibold'
                        : 'text-ink-secondary hover:text-ink'
                    }`}
                  >
                    {item.label}
                    {isActive && (
                      <span
                        className="absolute bottom-0 left-0 w-full h-[2px] bg-ink"
                        aria-hidden="true"
                      />
                    )}
                    {!isActive && (
                      <span
                        className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-steel transition-all duration-200 group-hover:w-full"
                        aria-hidden="true"
                      />
                    )}
                  </Link>
                )
              })}
            </div>

            <span className="w-px h-3.5 bg-hairline" aria-hidden="true" />

            {/* EXPERIENCES CLUSTER */}
            <div className="flex items-center gap-4 xl:gap-6">
              {EXPERIENCE_ITEMS.map((item) => {
                const isActive =
                  item.to === '/random'
                    ? pathname === '/random'
                    : pathname.startsWith(item.to)
                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    aria-current={isActive ? 'page' : undefined}
                    className={`relative text-[11px] xl:text-xs tracking-[0.16em] font-medium transition-colors py-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-ink ${
                      isActive
                        ? 'text-ink font-semibold'
                        : 'text-ink-secondary hover:text-ink'
                    }`}
                  >
                    {item.label}
                    {isActive && (
                      <span
                        className="absolute bottom-0 left-0 w-full h-[2px] bg-ink"
                        aria-hidden="true"
                      />
                    )}
                    {!isActive && (
                      <span
                        className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-steel transition-all duration-200 group-hover:w-full"
                        aria-hidden="true"
                      />
                    )}
                  </Link>
                )
              })}
            </div>
          </nav>

          {/* Right: Actions (Search, Profile) */}
          <div className="hidden lg:flex items-center gap-5 lg:gap-6">
            <button
              type="button"
              onClick={() => navigate('/search')}
              aria-label="Search"
              className={`flex items-center gap-2 text-xs font-medium tracking-[0.15em] transition-colors p-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ink ${
                pathname === '/search'
                  ? 'text-ink font-semibold'
                  : 'text-ink-secondary hover:text-ink'
              }`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
              <span>SEARCH</span>
            </button>

            <span className="w-px h-4 bg-hairline" aria-hidden="true" />

            {isAuthenticated ? (
              <Link
                to="/profile"
                aria-label="Collector Profile"
                className={`flex items-center gap-2 text-xs font-medium tracking-[0.15em] transition-colors p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink ${
                  pathname === '/profile'
                    ? 'text-ink font-semibold'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="w-4 h-4 rounded-full object-cover border border-hairline"
                  />
                ) : (
                  <span className="w-4 h-4 border border-ink bg-ink text-warm-white flex items-center justify-center text-[9px] font-mono">
                    {profile?.username ? profile.username.charAt(0).toUpperCase() : 'C'}
                  </span>
                )}
                <span>@{profile?.username || 'PROFILE'}</span>
              </Link>
            ) : (
              <Link
                to="/login"
                aria-label="Sign In"
                className={`flex items-center gap-2 text-xs font-medium tracking-[0.15em] transition-colors p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink ${
                  pathname === '/login' || pathname === '/signup'
                    ? 'text-ink font-semibold'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                </svg>
                <span>SIGN IN</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              className="p-2 text-ink hover:text-neutral-700 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ink"
            >
              {mobileMenuOpen ? (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <nav
            aria-label="Mobile Navigation"
            className="lg:hidden border-t border-hairline py-6 px-2 animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <div className="flex flex-col gap-6">
              {/* EDITORIAL CLUSTER */}
              <div>
                <div className="text-[9px] font-mono tracking-[0.25em] text-ink-muted uppercase mb-2 px-2">
                  EDITORIAL
                </div>
                <div className="flex flex-col gap-1">
                  {EDITORIAL_ITEMS.map((item) => {
                    const isActive =
                      item.to === '/explore'
                        ? pathname === '/explore'
                        : pathname.startsWith(item.to)
                    return (
                      <Link
                        key={item.label}
                        to={item.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`text-xs tracking-[0.18em] font-medium py-2.5 px-3 transition-colors ${
                          isActive
                            ? 'text-ink bg-warm-surface font-semibold'
                            : 'text-ink-secondary hover:text-ink'
                        }`}
                      >
                        {item.label}
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* EXPERIENCES CLUSTER */}
              <div className="pt-4 border-t border-hairline">
                <div className="text-[9px] font-mono tracking-[0.25em] text-ink-muted uppercase mb-2 px-2">
                  EXPERIENCES
                </div>
                <div className="flex flex-col gap-1">
                  {EXPERIENCE_ITEMS.map((item) => {
                    const isActive =
                      item.to === '/random'
                        ? pathname === '/random'
                        : pathname.startsWith(item.to)
                    return (
                      <Link
                        key={item.label}
                        to={item.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`text-xs tracking-[0.18em] font-medium py-2.5 px-3 transition-colors ${
                          isActive
                            ? 'text-ink bg-warm-surface font-semibold'
                            : 'text-ink-secondary hover:text-ink'
                        }`}
                      >
                        {item.label}
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* SEARCH & AUTH ACTIONS */}
              <div className="pt-4 border-t border-hairline flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    navigate('/search')
                  }}
                  className="flex items-center gap-3 text-xs tracking-[0.18em] font-medium text-ink-secondary py-2.5 px-3 cursor-pointer"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                    />
                  </svg>
                  <span>SEARCH</span>
                </button>
                {isAuthenticated ? (
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 text-xs tracking-[0.18em] font-medium text-ink-secondary py-2.5 px-3"
                  >
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt=""
                        className="w-4 h-4 rounded-full object-cover border border-hairline"
                      />
                    ) : (
                      <span className="w-4 h-4 border border-ink bg-ink text-warm-white flex items-center justify-center text-[9px] font-mono">
                        {profile?.username ? profile.username.charAt(0).toUpperCase() : 'C'}
                      </span>
                    )}
                    <span>@{profile?.username || 'PROFILE'}</span>
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 text-xs tracking-[0.18em] font-medium text-ink-secondary py-2.5 px-3"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                      />
                    </svg>
                    <span>SIGN IN</span>
                  </Link>
                )}
              </div>
            </div>
          </nav>
        )}
      </Container>
    </header>
  )
}
