import Container from '../components/common/Container'
import SectionHeading from '../components/common/SectionHeading'
import { Link } from '../router'

export default function CopyrightPage() {
  const lastUpdated = 'September 10, 2026'

  return (
    <div className="py-12 sm:py-16 lg:py-20">
      <Container>
        {/* Header */}
        <div className="border-b border-hairline pb-8 mb-12 sm:mb-16">
          <SectionHeading
            label="INTELLECTUAL PROPERTY &amp; BRAND RIGHTS"
            title="Copyright &amp; Intellectual Property"
            description="Our intellectual property policies, brand identity definitions, third-party rights, and takedown procedures."
          />
          <div className="mt-6 flex items-center gap-4 text-xs font-mono tracking-widest text-ink-muted uppercase">
            <span>DOCUMENT // COPYRIGHT</span>
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
                COPYRIGHT SECTIONS
              </span>
              <nav aria-label="Copyright Sections" className="flex flex-col gap-2.5 text-xs font-mono text-ink-secondary">
                <a href="#brand-identity" className="hover:text-ink transition-colors">01. BRAND MARKS &amp; IDENTITY</a>
                <a href="#proprietary-content" className="hover:text-ink transition-colors">02. PROPRIETARY PLATFORM RIGHTS</a>
                <a href="#third-party-rights" className="hover:text-ink transition-colors">03. THIRD-PARTY TRADEMARKS</a>
                <a href="#user-submissions" className="hover:text-ink transition-colors">04. USER CONTRIBUTIONS</a>
                <a href="#takedown-procedure" className="hover:text-ink transition-colors">05. DMCA &amp; TAKEDOWN NOTICE</a>
              </nav>
            </div>
          </aside>

          {/* Main Prose Content */}
          <article className="lg:col-span-8 max-w-prose space-y-12 text-sm sm:text-base text-ink-secondary leading-relaxed font-normal">
            {/* Section 01 */}
            <section id="brand-identity" className="scroll-mt-28">
              <h2 className="font-display text-xl sm:text-2xl text-ink uppercase tracking-tight mb-4">
                01. Brand Marks &amp; Platform Identity
              </h2>
              <p className="mb-4">
                We maintain distinct brand marks that identify our independent cultural publication and digital archive:
              </p>
              <div className="space-y-4 mb-4">
                <div className="p-5 bg-warm-surface/50 border border-hairline">
                  <div className="text-xs font-mono text-ink-muted uppercase tracking-widest mb-1">FORMAL PLATFORM TITLE</div>
                  <div className="text-lg font-display text-ink uppercase tracking-tight mb-2">MOERI &amp; JEANNERET</div>
                  <p className="text-xs text-ink-secondary leading-relaxed">
                    The overarching publication name, masthead, and cultural archive identity representing our independent
                    horological editorial and digital catalog.
                  </p>
                </div>

                <div className="p-5 bg-warm-surface/50 border border-hairline">
                  <div className="text-xs font-mono text-ink-muted uppercase tracking-widest mb-1">COMPACT VISUAL WORDMARK</div>
                  <div className="text-lg font-mono font-bold text-ink uppercase tracking-widest mb-2">MOJEAN.</div>
                  <p className="text-xs text-ink-secondary leading-relaxed">
                    Our compact graphic emblem and favicon insignia, distinguished by bold European grotesque lettering
                    and our signature red point accent.
                  </p>
                </div>
              </div>
            </section>

            <hr className="border-hairline" />

            {/* Section 02 */}
            <section id="proprietary-content" className="scroll-mt-28">
              <h2 className="font-display text-xl sm:text-2xl text-ink uppercase tracking-tight mb-4">
                02. Proprietary Platform Rights &amp; Original Works
              </h2>
              <p className="mb-4">
                All original works created by MOERI &amp; JEANNERET are protected by international copyright laws. This includes:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong className="text-ink font-medium">Original Editorial Text:</strong> Articles, historical monographs, technical essays, and curated watch profiles authored by our editorial staff.</li>
                <li><strong className="text-ink font-medium">UI &amp; Architectural Design:</strong> The distinctive layout, typography system, interactive widgets, color palettes, and visual design of the website.</li>
                <li><strong className="text-ink font-medium">Source Code &amp; Logic:</strong> The underlying React application code, routing architecture, and proprietary evaluation algorithms (including the &ldquo;WORTH IT?&rdquo; Case engine).</li>
              </ul>
            </section>

            <hr className="border-hairline" />

            {/* Section 03 */}
            <section id="third-party-rights" className="scroll-mt-28">
              <h2 className="font-display text-xl sm:text-2xl text-ink uppercase tracking-tight mb-4">
                03. Third-Party Trademarks &amp; Fair Use
              </h2>
              <p className="mb-4">
                This platform documents the global history of watchmaking. In doing so, we reference third-party horological
                manufacturers, trademarked names, model designations, and historical logos.
              </p>
              <ul className="list-disc pl-5 space-y-2 mb-4">
                <li>
                  <strong className="text-ink font-medium">Nominative Fair Use:</strong> All third-party trademarks and brand
                  assets remain the exclusive property of their respective owners. Their mention on this platform is purely
                  descriptive and nominative to identify historical timepieces for research, review, and cultural documentation.
                </li>
                <li>
                  <strong className="text-ink font-medium">No Endorsement or Affiliation:</strong> Use of these trademarks does not
                  imply sponsorship, affiliation, endorsement, or commercial association by any watch brand.
                </li>
              </ul>
            </section>

            <hr className="border-hairline" />

            {/* Section 04 */}
            <section id="user-submissions" className="scroll-mt-28">
              <h2 className="font-display text-xl sm:text-2xl text-ink uppercase tracking-tight mb-4">
                04. User-Submitted Content &amp; Photography
              </h2>
              <p className="mb-4">
                Community members who author stories and upload photography to the platform:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong className="text-ink font-medium">Retain Full Copyright:</strong> Authors retain ownership of their original writing and submitted photos.</li>
                <li><strong className="text-ink font-medium">Display License:</strong> By publishing on the platform, authors grant us a non-exclusive license to host and display the submitted materials in connection with the operation of MOERI &amp; JEANNERET.</li>
                <li><strong className="text-ink font-medium">Contributor Warranty:</strong> Contributors confirm they own or hold legitimate licenses for all submitted media.</li>
              </ul>
            </section>

            <hr className="border-hairline" />

            {/* Section 05 */}
            <section id="takedown-procedure" className="scroll-mt-28">
              <h2 className="font-display text-xl sm:text-2xl text-ink uppercase tracking-tight mb-4">
                05. Copyright Notices &amp; Takedown Procedure
              </h2>
              <p className="mb-4">
                We respect intellectual property rights and promptly investigate notices of alleged infringement. If you believe
                your copyrighted work has been reproduced or displayed on this website in a manner constituting copyright infringement:
              </p>
              <div className="p-5 bg-warm-surface/60 border border-hairline text-xs font-mono space-y-3 mb-6">
                <div className="text-ink font-semibold uppercase tracking-wider">REQUIRED NOTICE INFORMATION</div>
                <ol className="list-decimal pl-4 space-y-1.5 text-ink-secondary">
                  <li>Identification of the copyrighted work claimed to have been infringed.</li>
                  <li>Identification of the material on our platform claimed to be infringing, including the specific URL.</li>
                  <li>Your full contact information (name, address, telephone number, and email address).</li>
                  <li>A statement that you have a good-faith belief that use of the material is not authorized by the copyright owner, its agent, or the law.</li>
                  <li>A statement that the information in the notification is accurate, and under penalty of perjury, that you are authorized to act on behalf of the copyright owner.</li>
                  <li>A physical or electronic signature of the authorized copyright holder or representative.</li>
                </ol>
                <div className="pt-2 border-t border-hairline text-ink">
                  Send notices to: <span className="font-semibold text-ink select-all">thenameischaracter@gmail.com</span>
                </div>
              </div>
              <p className="text-xs font-mono text-ink-muted">
                See also: <Link to="/terms" className="text-ink underline hover:text-steel">Terms &amp; Conditions</Link> &bull; <Link to="/contact" className="text-ink underline hover:text-steel">Contact Directory</Link>
              </p>
            </section>
          </article>
        </div>
      </Container>
    </div>
  )
}
