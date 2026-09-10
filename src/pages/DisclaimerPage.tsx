import Container from '../components/common/Container'
import SectionHeading from '../components/common/SectionHeading'
import { Link } from '../router'

export default function DisclaimerPage() {
  const lastUpdated = 'September 10, 2026'

  return (
    <div className="py-12 sm:py-16 lg:py-20">
      <Container>
        {/* Header */}
        <div className="border-b border-hairline pb-8 mb-12 sm:mb-16">
          <SectionHeading
            label="CONTENT &amp; ARCHIVAL NOTICE"
            title="Watch Information &amp; Content Disclaimer"
            description="Important clarifications regarding archival specifications, pricing references, brand independence, and editorial scope."
          />
          <div className="mt-6 flex items-center gap-4 text-xs font-mono tracking-widest text-ink-muted uppercase">
            <span>DOCUMENT // DISCLAIMER</span>
            <span>&bull;</span>
            <span>LAST REVISED: {lastUpdated}</span>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Quick Index Sidebar (Desktop) */}
          <aside className="hidden lg:block lg:col-span-4">
            <div className="sticky top-28 p-6 bg-warm-surface/50 border border-hairline">
              <span className="text-[10px] font-mono tracking-[0.25em] text-ink-muted uppercase block font-semibold mb-4">
                DISCLAIMER TOPICS
              </span>
              <nav aria-label="Disclaimer Topics" className="flex flex-col gap-2.5 text-xs font-mono text-ink-secondary">
                <a href="#editorial-purpose" className="hover:text-ink transition-colors">01. EDITORIAL &amp; ARCHIVAL NATURE</a>
                <a href="#specs-variance" className="hover:text-ink transition-colors">02. SPECIFICATIONS &amp; ERRATA</a>
                <a href="#pricing" className="hover:text-ink transition-colors">03. PRICING &amp; VALUATION ESTIMATES</a>
                <a href="#independence" className="hover:text-ink transition-colors">04. INDEPENDENCE &amp; NO AFFILIATION</a>
                <a href="#trademarks" className="hover:text-ink transition-colors">05. TRADEMARK NOMINATIVE USE</a>
                <a href="#evaluation-engine" className="hover:text-ink transition-colors">06. EVALUATIONS &amp; WORTH IT?</a>
                <a href="#verification" className="hover:text-ink transition-colors">07. VERIFICATION ADVISORY</a>
              </nav>
            </div>
          </aside>

          {/* Main Prose Content */}
          <article className="lg:col-span-8 max-w-prose space-y-12 text-sm sm:text-base text-ink-secondary leading-relaxed font-normal">
            {/* Section 01 */}
            <section id="editorial-purpose" className="scroll-mt-28">
              <h2 className="font-display text-xl sm:text-2xl text-ink uppercase tracking-tight mb-4">
                01. Editorial &amp; Archival Nature of the Platform
              </h2>
              <p className="mb-4">
                MOERI &amp; JEANNERET is an independent cultural publication, technical study archive, and interactive
                horological resource. All materials published across this website—including curated watch records, technical
                breakdowns, interactive caliber widgets, community stories, and historical monographs—are compiled and provided
                strictly for cultural, educational, and informational purposes.
              </p>
            </section>

            <hr className="border-hairline" />

            {/* Section 02 */}
            <section id="specs-variance" className="scroll-mt-28">
              <h2 className="font-display text-xl sm:text-2xl text-ink uppercase tracking-tight mb-4">
                02. Technical Specifications &amp; Historical Variance
              </h2>
              <p className="mb-4">
                While our curation team endeavors to maintain accurate horological data:
              </p>
              <ul className="list-disc pl-5 space-y-2 mb-4">
                <li>
                  <strong className="text-ink font-medium">Production Variances:</strong> Case dimensions (diameter, lug-to-lug,
                  thickness), water resistance depth ratings, crystal compositions, and caliber specifications often evolve across
                  different production runs, reference generations, or localized market distributions.
                </li>
                <li>
                  <strong className="text-ink font-medium">Historical Inaccuracies:</strong> Vintage production numbers, historical
                  lineage records, and archive dates reflect published horological scholarship, which may be revised as manufacturers
                  open factory archives or new scholarly research emerges.
                </li>
                <li>
                  <strong className="text-ink font-medium">Corrections Welcomed:</strong> If you identify technical errata or
                  catalog inaccuracies, we encourage you to submit verifiable documentation to our archival team.
                </li>
              </ul>
            </section>

            <hr className="border-hairline" />

            {/* Section 03 */}
            <section id="pricing" className="scroll-mt-28">
              <h2 className="font-display text-xl sm:text-2xl text-ink uppercase tracking-tight mb-4">
                03. Pricing &amp; Market Valuation Estimates
              </h2>
              <p className="mb-4">
                Any manufacturer suggested retail prices (MSRP), historical launch figures, or secondary market value estimates
                displayed throughout the Platform are indicative reference figures only:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Prices vary substantially by currency, regional taxes, import tariffs, dealer markups, and market cycles.</li>
                <li>Pre-owned and vintage valuations are highly dependent on individual specimen condition, service provenance, box/papers completeness, and auction volatility.</li>
                <li>MOERI &amp; JEANNERET does not broker, sell, or guarantee the transactional availability of any timepiece cataloged in our archive.</li>
              </ul>
            </section>

            <hr className="border-hairline" />

            {/* Section 04 */}
            <section id="independence" className="scroll-mt-28">
              <h2 className="font-display text-xl sm:text-2xl text-ink uppercase tracking-tight mb-4">
                04. Editorial Independence &amp; No Commercial Affiliation
              </h2>
              <p className="mb-4">
                MOERI &amp; JEANNERET is an entirely independent editorial endeavor:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>We are NOT an authorized dealer, official distributor, retailer, or manufacturer representative of any watch brand mentioned on the Platform.</li>
                <li>We do NOT sell watches, provide warranty repair services, or authenticate timepieces on behalf of watch manufacturers.</li>
                <li>Our editorial evaluations, curated selections, and interactive tools are produced without commercial sponsorship or paid placement from watch brands.</li>
              </ul>
            </section>

            <hr className="border-hairline" />

            {/* Section 05 */}
            <section id="trademarks" className="scroll-mt-28">
              <h2 className="font-display text-xl sm:text-2xl text-ink uppercase tracking-tight mb-4">
                05. Trademark &amp; Brand Reference Notice
              </h2>
              <p className="mb-4">
                All brand names, model trademarks, company logos, and registered trade dress (including but not limited to Rolex,
                Omega, Patek Philippe, Audemars Piguet, Cartier, Jaeger-LeCoultre, Grand Seiko, Tudor, IWC, Seiko, Hamilton, Tissot,
                and Casio) mentioned on this website belong exclusively to their respective trademark holders.
              </p>
              <p>
                Their use on MOERI &amp; JEANNERET is strictly nominative and descriptive, intended solely to identify specific
                horological models, calibers, and historical artifacts for editorial commentary and public study.
              </p>
            </section>

            <hr className="border-hairline" />

            {/* Section 06 */}
            <section id="evaluation-engine" className="scroll-mt-28">
              <h2 className="font-display text-xl sm:text-2xl text-ink uppercase tracking-tight mb-4">
                06. Evaluations, Battles &amp; &ldquo;WORTH IT?&rdquo; Scoring
              </h2>
              <p className="mb-4">
                The platform includes algorithmic and editorial evaluation mechanisms (such as the &ldquo;WORTH IT?&rdquo; Case
                evaluation engine and head-to-head Battles):
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-ink font-medium">Deterministic Editorial Rubrics:</strong> Scores and verdicts are
                  calculated based on structured qualitative and technical benchmarks (heritage, caliber architecture, daily wearability,
                  and value retention).
                </li>
                <li>
                  <strong className="text-ink font-medium">Not Financial or Investment Advice:</strong> Horological collecting carries
                  inherent financial risk. Evaluations express editorial points of view and must never be taken as financial, investment,
                  tax, or asset-allocation advice.
                </li>
              </ul>
            </section>

            <hr className="border-hairline" />

            {/* Section 07 */}
            <section id="verification" className="scroll-mt-28">
              <h2 className="font-display text-xl sm:text-2xl text-ink uppercase tracking-tight mb-4">
                07. Verification Advisory
              </h2>
              <p className="mb-4">
                Before purchasing any timepiece, committing financial resources, or initiating technical servicing:
              </p>
              <div className="p-5 bg-warm-surface/60 border border-hairline text-xs font-mono space-y-2">
                <div className="text-ink font-semibold uppercase tracking-wider">RECOMMENDED ACTION</div>
                <p className="text-ink-secondary">
                  Always verify current official specifications, warranty terms, and authorized retail prices directly with the
                  brand&rsquo;s official manufacturer documentation or a certified authorized boutique.
                </p>
              </div>
              <p className="mt-6 text-xs font-mono text-ink-muted">
                See also: <Link to="/terms" className="text-ink underline hover:text-steel">Terms &amp; Conditions</Link> &bull; <Link to="/contact" className="text-ink underline hover:text-steel">Archival Errata Contact</Link>
              </p>
            </section>
          </article>
        </div>
      </Container>
    </div>
  )
}
