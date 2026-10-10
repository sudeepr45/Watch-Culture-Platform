import type { Watch101Topic } from '../../types/watch101'
import { Link } from '../../router'

interface GuillocheStoryProps {
  topic: Watch101Topic
  prev?: Watch101Topic
  next?: Watch101Topic
}

const leadPhoto = {
  src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a8/Micro-Rotor_Guilloche_Laurent_Ferrier_Only_Watch_2011.jpg/1920px-Micro-Rotor_Guilloche_Laurent_Ferrier_Only_Watch_2011.jpg',
  source: 'https://commons.wikimedia.org/wiki/File:Micro-Rotor_Guilloche_Laurent_Ferrier_Only_Watch_2011.jpg',
  license: 'https://creativecommons.org/licenses/by-sa/4.0/',
}

const galleryPhotos = [
  {
    src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/30/An_engine-turned_%28guilloch%C3%A9%29_watch_dial_made_by_Derek_Pratt_and_rejected_by_him_due_to_imperfections.jpg/1280px-An_engine-turned_%28guilloch%C3%A9%29_watch_dial_made_by_Derek_Pratt_and_rejected_by_him_due_to_imperfections.jpg',
    alt: 'An engine-turned guilloché watch dial made by Derek Pratt.',
    caption: 'An engine-turned dial made by Derek Pratt.',
    credit: 'Louisetarp · CC0 1.0',
    source: 'https://commons.wikimedia.org/wiki/File:An_engine-turned_(guilloch%C3%A9)_watch_dial_made_by_Derek_Pratt_and_rejected_by_him_due_to_imperfections.jpg',
    license: 'https://creativecommons.org/publicdomain/zero/1.0/',
  },
  {
    src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1c/Flying_tourbillon.jpg/1280px-Flying_tourbillon.jpg',
    alt: 'A tourbillon watch with a Clous de Paris guilloché dial.',
    caption: 'A Clous de Paris dial on an Imperiali Genève tourbillon watch.',
    credit: 'Imperiali Genève · CC BY-SA 4.0',
    source: 'https://commons.wikimedia.org/wiki/File:Flying_tourbillon.jpg',
    license: 'https://creativecommons.org/licenses/by-sa/4.0/',
  },
  {
    src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/18/Ducat_Florentin.jpg/960px-Ducat_Florentin.jpg',
    alt: 'A J. F. Bautte & Cie gold pocket watch from around 1840, with an engraved and guilloché dial.',
    caption: 'An engraved gold dial in a J. F. Bautte & Cie pocket watch, c. 1840.',
    credit: 'Pierre EmD · CC BY-SA 3.0',
    source: 'https://commons.wikimedia.org/wiki/File:Ducat_Florentin.jpg',
    license: 'https://creativecommons.org/licenses/by-sa/3.0/',
  },
]

export default function GuillocheStory({ topic, prev, next }: GuillocheStoryProps) {
  return (
    <main className="py-8 sm:py-12 lg:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-8 sm:mb-12">
          <Link
            to="/watch-101"
            className="text-sm text-ink-secondary underline decoration-hairline underline-offset-4 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            Watch 101
          </Link>
          <span className="mx-2 text-ink-muted" aria-hidden="true">/</span>
          <span className="text-sm text-ink" aria-current="page">{topic.title}</span>
        </nav>

        <header className="max-w-3xl border-b border-hairline pb-8 sm:pb-10">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-ink-muted">
            Watch 101 <span aria-hidden="true">·</span> {topic.readTimeMinutes} min read
          </p>
          <h1 className="font-display text-4xl font-normal tracking-tight text-ink sm:text-5xl lg:text-6xl">
            What is guilloché?
          </h1>
          <p className="mt-5 text-base leading-relaxed text-ink-secondary sm:text-lg">
            {topic.shortDescription}
          </p>
        </header>

        <figure className="mt-8 sm:mt-12">
          <img
            src={leadPhoto.src}
            alt="A Laurent Ferrier Micro-Rotor watch with a guilloché dial, photographed for Only Watch 2011."
            className="mx-auto block max-h-[780px] w-full bg-warm-surface object-contain"
            fetchPriority="high"
          />
          <figcaption className="mt-3 flex flex-col gap-1 border-b border-hairline pb-4 text-sm text-ink-secondary sm:flex-row sm:items-baseline sm:justify-between">
            <span>A Laurent Ferrier Micro-Rotor, with guilloché across its dial.</span>
            <span className="text-xs text-ink-muted">
              Photograph: Laurent Ferrier SA ·{' '}
              <a href={leadPhoto.source} target="_blank" rel="noreferrer" className="underline underline-offset-2">Source</a>
              {' · '}
              <a href={leadPhoto.license} target="_blank" rel="noreferrer" className="underline underline-offset-2">CC BY-SA 4.0</a>
            </span>
          </figcaption>
        </figure>

        <section aria-labelledby="making-guilloche" className="mt-14 grid grid-cols-1 gap-6 border-b border-hairline pb-12 sm:mt-20 sm:gap-10 sm:pb-16 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-5">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-ink-muted">The hand at the machine</p>
            <h2 id="making-guilloche" className="font-display text-3xl font-normal tracking-tight text-ink sm:text-4xl">
              How it is made
            </h2>
            <p className="mt-5 text-base leading-relaxed text-ink-secondary">
              {topic.deeperExplanation.lead} {topic.deeperExplanation.paragraphs[0]}
            </p>
            <p className="mt-4 text-base leading-relaxed text-ink-secondary">
              {topic.deeperExplanation.paragraphs[1]}
            </p>
            <p className="mt-4 text-base leading-relaxed text-ink-secondary">
              {topic.deeperExplanation.paragraphs[2]}
            </p>
          </div>

          <figure className="lg:col-span-7">
            <img
              src="https://thumb.wikimedia.org/wikipedia/commons/thumb/0/09/Derek-Pratt-Engine-Turning-Machine1.jpg/1280px-Derek-Pratt-Engine-Turning-Machine1.jpg"
              alt="Watchmaker Derek Pratt working at an engine-turning machine on a guilloché dial."
              loading="lazy"
              className="block aspect-[4/3] w-full bg-warm-surface object-contain"
            />
            <figcaption className="mt-2 flex flex-wrap items-baseline justify-between gap-1 text-sm text-ink-secondary">
              <span>Derek Pratt at an engine-turning machine.</span>
              <span className="text-xs text-ink-muted">
                Photograph: Louisetarp ·{' '}
                <a href="https://commons.wikimedia.org/wiki/File:Derek-Pratt-Engine-Turning-Machine1.jpg" target="_blank" rel="noreferrer" className="underline underline-offset-2">Source</a>
                {' · '}
                <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer" className="underline underline-offset-2">CC BY-SA 4.0</a>
              </span>
            </figcaption>
          </figure>
        </section>

        <section aria-labelledby="guilloche-gallery" className="mt-12 sm:mt-16">
          <div className="mb-6 max-w-2xl sm:mb-8">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-ink-muted">Cut, light and repetition</p>
            <h2 id="guilloche-gallery" className="font-display text-3xl font-normal tracking-tight text-ink sm:text-4xl">
              Patterns in metal
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {galleryPhotos.map((photo) => (
              <figure key={photo.source}>
                <img
                  src={photo.src}
                  alt={photo.alt}
                  loading="lazy"
                  className="block aspect-[4/3] w-full border border-hairline bg-warm-surface object-contain"
                />
                <figcaption className="mt-3">
                  <p className="text-sm leading-relaxed text-ink">{photo.caption}</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {photo.credit} ·{' '}
                    <a href={photo.source} target="_blank" rel="noreferrer" className="underline underline-offset-2">Source</a>
                    {' · '}
                    <a href={photo.license} target="_blank" rel="noreferrer" className="underline underline-offset-2">License</a>
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section aria-labelledby="plate-connection" className="mt-14 border-y border-hairline py-8 sm:mt-20 sm:py-10">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-ink-muted">A digital study, not an engraving</p>
          <h2 id="plate-connection" className="font-display text-2xl font-normal tracking-tight text-ink sm:text-3xl">
            Guilloché and Plate of the Day
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-ink-secondary">
            MOJEAN’s Plate of the Day is generated mathematically from the date and takes inspiration from guilloché’s repeating forms. It is a digital drawing: no dial is engraved, and it does not reproduce the traditional craft process.
          </p>
          <Link
            to="/plate"
            className="mt-5 inline-flex min-h-11 items-center border-b border-ink text-sm text-ink hover:text-ink-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            Explore Plate of the Day <span className="ml-2" aria-hidden="true">→</span>
          </Link>
        </section>

        <section aria-label="Further reading" className="mt-8 text-sm text-ink-secondary">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-ink-muted">Further reading</p>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            <li><a className="underline underline-offset-2 hover:text-ink" href="https://www.breguet.com/en/breguet-house/1775-1801/appearance-guilloche-watchmaking" target="_blank" rel="noreferrer">Breguet: guilloché in watchmaking</a></li>
            <li><a className="underline underline-offset-2 hover:text-ink" href="https://www.patek.com/en/manufacture/artisans-of-time/guillochage" target="_blank" rel="noreferrer">Patek Philippe: the art of guillochage</a></li>
            <li><a className="underline underline-offset-2 hover:text-ink" href="https://horopedia.org/guilloche-engine-turning/" target="_blank" rel="noreferrer">Horopedia: engine-turning</a></li>
          </ul>
        </section>

        <nav aria-label="Watch 101 topics" className="mt-12 flex flex-col justify-between gap-4 border-t border-hairline pt-6 text-sm sm:flex-row">
          {prev ? (
            <Link to={`/watch-101/${prev.slug}`} className="text-ink-secondary underline decoration-hairline underline-offset-4 hover:text-ink">
              ← Previous: {prev.title}
            </Link>
          ) : <span />}
          {next ? (
            <Link to={`/watch-101/${next.slug}`} className="text-ink-secondary underline decoration-hairline underline-offset-4 hover:text-ink sm:text-right">
              Next: {next.title} →
            </Link>
          ) : <span />}
        </nav>
      </div>
    </main>
  )
}
