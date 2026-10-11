import Container from '../common/Container'
import Button from '../common/Button'
import { useRouter } from '../../router/useRouter'

export default function Hero() {
  const { navigate } = useRouter()

  return (
    <section id="home" aria-labelledby="hero-headline" className="relative flex border-b border-hairline bg-warm-white py-7 sm:py-9 lg:py-12">
      <Container className="flex items-center">
        <div className="w-full max-w-4xl">
          <p className="mb-3 text-xs font-mono uppercase tracking-[0.18em] text-ink-muted">MOJEAN / EDITORIAL</p>
          <h1 id="hero-headline" className="font-display text-4xl font-normal leading-[1.02] tracking-[-0.035em] text-ink uppercase text-balance sm:text-5xl lg:text-6xl">
            Understand watches.
            <br />
            Read their stories.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink-secondary sm:mt-5 sm:text-base">
            MOJEAN is a verified watch archive with technical guides and stories about the mechanics, design, and history of timepieces.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3 sm:mt-6">
            <Button variant="primary" size="md" onClick={() => navigate('/watches')} className="group" iconRight={<span className="inline-block" aria-hidden="true">&rarr;</span>}>
              BROWSE WATCH ARCHIVE
            </Button>
            <Button variant="secondary" size="md" onClick={() => navigate('/watch-101')}>START WITH WATCH 101</Button>
          </div>
        </div>
      </Container>
    </section>
  )
}
