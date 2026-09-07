import Navbar from './components/layout/Navbar'
import Hero from './components/hero/Hero'
import PhilosophyStrip from './components/home/PhilosophyStrip'
import Container from './components/common/Container'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-warm-white text-ink selection:bg-gold/20 selection:text-ink">
      {/* Sticky Editorial Navigation */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-grow">
        {/* Full-screen Editorial Hero */}
        <Hero />

        {/* Philosophy & Transition Strip */}
        <PhilosophyStrip />
      </main>

      {/* Understated Editorial Colophon */}
      <footer className="border-t border-hairline bg-warm-white py-10">
        <Container>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono tracking-[0.16em] text-ink-muted uppercase">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-ink">PROJECT WATCH</span>
              <span>&bull;</span>
              <span>STAGE 01 // VISUAL FOUNDATION</span>
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
