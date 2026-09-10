import Container from '../common/Container'
import BrandLogo from '../common/BrandLogo'
import { Link } from '../../router'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-hairline bg-warm-white text-ink pt-14 pb-12 sm:pt-16 sm:pb-14">
      <Container>
        {/* Top Section: Brand Masthead & Navigation Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 pb-12 border-b border-hairline">
          {/* Brand Identity Column (5 cols on lg) */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <Link to="/" className="inline-block mb-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink">
                <BrandLogo variant="horizontal" size="sm" />
              </Link>
              <p className="text-xs sm:text-sm text-ink-secondary font-light leading-relaxed max-w-sm">
                An independent horological journal, cultural archive, and deterministic exploration platform. Documenting
                the mechanics, heritage, and human stories behind timepieces.
              </p>
            </div>

            <div className="mt-6 pt-4 flex items-center gap-3 text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-steel" aria-hidden="true" />
              <span>INDEPENDENT ARCHIVE &bull; VOL. I</span>
            </div>
          </div>

          {/* Cluster 1: Archive & Instruments (2 cols on lg) */}
          <div className="lg:col-span-2">
            <div className="text-[10px] font-mono tracking-[0.25em] text-ink font-semibold uppercase mb-4">
              ARCHIVE
            </div>
            <ul className="space-y-2.5 text-xs font-mono tracking-wider">
              <li>
                <Link to="/explore" className="text-ink-secondary hover:text-ink transition-colors uppercase">
                  Culture
                </Link>
              </li>
              <li>
                <Link to="/stories" className="text-ink-secondary hover:text-ink transition-colors uppercase">
                  Stories
                </Link>
              </li>
              <li>
                <Link to="/watches" className="text-ink-secondary hover:text-ink transition-colors uppercase">
                  Archive Index
                </Link>
              </li>
              <li>
                <Link to="/case" className="text-ink-secondary hover:text-ink transition-colors uppercase">
                  Worth It?
                </Link>
              </li>
              <li>
                <Link to="/battles" className="text-ink-secondary hover:text-ink transition-colors uppercase">
                  Battles
                </Link>
              </li>
              <li>
                <Link to="/watch-101" className="text-ink-secondary hover:text-ink transition-colors uppercase">
                  Watch 101
                </Link>
              </li>
            </ul>
          </div>

          {/* Cluster 2: Platform & Community (2 cols on lg) */}
          <div className="lg:col-span-2">
            <div className="text-[10px] font-mono tracking-[0.25em] text-ink font-semibold uppercase mb-4">
              PLATFORM
            </div>
            <ul className="space-y-2.5 text-xs font-mono tracking-wider">
              <li>
                <Link to="/about" className="text-ink-secondary hover:text-ink transition-colors uppercase">
                  About
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-ink-secondary hover:text-ink transition-colors uppercase">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/community-guidelines" className="text-ink-secondary hover:text-ink transition-colors uppercase">
                  Guidelines
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-ink-secondary hover:text-ink transition-colors uppercase">
                  Collector Dossier
                </Link>
              </li>
              <li>
                <Link to="/search" className="text-ink-secondary hover:text-ink transition-colors uppercase">
                  Archive Search
                </Link>
              </li>
            </ul>
          </div>

          {/* Cluster 3: Legal & Trust (3 cols on lg) */}
          <div className="lg:col-span-3">
            <div className="text-[10px] font-mono tracking-[0.25em] text-ink font-semibold uppercase mb-4">
              LEGAL &amp; TRUST
            </div>
            <ul className="space-y-2.5 text-xs font-mono tracking-wider">
              <li>
                <Link to="/terms" className="text-ink-secondary hover:text-ink transition-colors uppercase">
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-ink-secondary hover:text-ink transition-colors uppercase">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/disclaimer" className="text-ink-secondary hover:text-ink transition-colors uppercase">
                  Content Disclaimer
                </Link>
              </li>
              <li>
                <Link to="/copyright" className="text-ink-secondary hover:text-ink transition-colors uppercase">
                  Copyright &amp; IP
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Colophon Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono tracking-[0.16em] text-ink-muted uppercase">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-ink">MOERI &amp; JEANNERET</span>
            <span>&bull;</span>
            <span>INDEPENDENT HOROLOGICAL JOURNAL &bull; DIGITAL ARCHIVE</span>
          </div>
          <div>
            &copy; {currentYear} MOERI &amp; JEANNERET. ALL RIGHTS RESERVED.
          </div>
        </div>
      </Container>
    </footer>
  )
}
