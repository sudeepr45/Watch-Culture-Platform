import Container from '../components/common/Container'
import SectionHeading from '../components/common/SectionHeading'
import { Link } from '../router'

export default function TermsPage() {
  const lastUpdated = 'September 10, 2026'

  return (
    <div className="py-12 sm:py-16 lg:py-20">
      <Container>
        {/* Header */}
        <div className="border-b border-hairline pb-8 mb-12 sm:mb-16">
          <SectionHeading
            label="LEGAL TERMS OF SERVICE"
            title="Terms &amp; Conditions"
            description="The terms and standards governing access, community contributions, and use of MOERI & JEANNERET."
          />
          <div className="mt-6 flex items-center gap-4 text-xs font-mono tracking-widest text-ink-muted uppercase">
            <span>DOCUMENT // TERMS</span>
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
                TERMS SECTIONS
              </span>
              <nav aria-label="Terms Sections" className="flex flex-col gap-2.5 text-xs font-mono text-ink-secondary">
                <a href="#acceptance" className="hover:text-ink transition-colors">01. ACCEPTANCE &amp; ELIGIBILITY</a>
                <a href="#accounts" className="hover:text-ink transition-colors">02. USER ACCOUNTS &amp; SECURITY</a>
                <a href="#user-content" className="hover:text-ink transition-colors">03. USER-GENERATED CONTENT</a>
                <a href="#image-rules" className="hover:text-ink transition-colors">04. PHOTOGRAPHY &amp; MEDIA</a>
                <a href="#conduct" className="hover:text-ink transition-colors">05. ACCEPTABLE USE &amp; CONDUCT</a>
                <a href="#ip" className="hover:text-ink transition-colors">06. INTELLECTUAL PROPERTY</a>
                <a href="#disclaimers" className="hover:text-ink transition-colors">07. WATCH DATA &amp; NO ADVICE</a>
                <a href="#moderation" className="hover:text-ink transition-colors">08. MODERATION &amp; TERMINATION</a>
                <a href="#liability" className="hover:text-ink transition-colors">09. LIMITATION OF LIABILITY</a>
                <a href="#governing-law" className="hover:text-ink transition-colors">10. GOVERNING LAW &amp; VENUE</a>
                <a href="#contact" className="hover:text-ink transition-colors">11. CONTACT &amp; NOTICES</a>
              </nav>
            </div>
          </aside>

          {/* Main Prose Content */}
          <article className="lg:col-span-8 max-w-prose space-y-12 text-sm sm:text-base text-ink-secondary leading-relaxed font-normal">
            {/* Section 01 */}
            <section id="acceptance" className="scroll-mt-28">
              <h2 className="font-display text-xl sm:text-2xl text-ink uppercase tracking-tight mb-4">
                01. Acceptance of Terms &amp; Eligibility
              </h2>
              <p className="mb-4">
                By visiting, browsing, registering for, or interacting with MOERI &amp; JEANNERET (&ldquo;the Platform,&rdquo;
                &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), you agree to be bound by these Terms &amp; Conditions.
                If you do not agree to these terms, please do not use the Platform.
              </p>
              <p>
                You must be at least 13 years of age (or the applicable age of digital consent in your jurisdiction) to create
                an account or submit content.
              </p>
            </section>

            <hr className="border-hairline" />

            {/* Section 02 */}
            <section id="accounts" className="scroll-mt-28">
              <h2 className="font-display text-xl sm:text-2xl text-ink uppercase tracking-tight mb-4">
                02. User Accounts &amp; Security
              </h2>
              <p className="mb-4">
                When you create a profile, you agree to provide accurate registration information and choose a unique username
                (@handle). You are responsible for safeguarding your login credentials (email/password or Google account session)
                and for all activities occurring under your account.
              </p>
              <p>
                You must notify us immediately if you suspect unauthorized access or security compromises involving your account.
              </p>
            </section>

            <hr className="border-hairline" />

            {/* Section 03 */}
            <section id="user-content" className="scroll-mt-28">
              <h2 className="font-display text-xl sm:text-2xl text-ink uppercase tracking-tight mb-4">
                03. User-Generated Content &amp; Licensing
              </h2>
              <p className="mb-4">
                Our community features allow collectors and enthusiasts to author watch stories, write comments, record wrist collections,
                and participate in head-to-head battle votes.
              </p>
              <ul className="list-disc pl-5 space-y-2 mb-4">
                <li>
                  <strong className="text-ink font-medium">You Retain Ownership:</strong> You retain all copyright and intellectual
                  property ownership in the original text, stories, and photographs you create and publish.
                </li>
                <li>
                  <strong className="text-ink font-medium">Platform License:</strong> By submitting content to public sections of
                  the Platform, you grant MOERI &amp; JEANNERET a non-exclusive, worldwide, royalty-free license to host, format,
                  display, index, and distribute your content across the service in connection with its operation.
                </li>
                <li>
                  <strong className="text-ink font-medium">Content Removal:</strong> You may edit or delete your stories at any time.
                  Upon deletion, your content and associated uploaded media are removed from public display.
                </li>
              </ul>
            </section>

            <hr className="border-hairline" />

            {/* Section 04 */}
            <section id="image-rules" className="scroll-mt-28">
              <h2 className="font-display text-xl sm:text-2xl text-ink uppercase tracking-tight mb-4">
                04. Photography &amp; Media Warranties
              </h2>
              <p className="mb-4">
                To protect archive credibility and intellectual property rights:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>You represent and warrant that you own or possess the necessary rights and permissions to upload any photographs accompanying your stories.</li>
                <li>You must not upload copyrighted images created by other photographers, commercial publications, or manufacturers without authorization.</li>
                <li>You must not upload misleading, AI-hallucinated, or counterfeit imagery claiming to represent genuine timepieces.</li>
              </ul>
            </section>

            <hr className="border-hairline" />

            {/* Section 05 */}
            <section id="conduct" className="scroll-mt-28">
              <h2 className="font-display text-xl sm:text-2xl text-ink uppercase tracking-tight mb-4">
                05. Acceptable Use &amp; Prohibited Conduct
              </h2>
              <p className="mb-4">
                Users must conduct themselves with respect and horological integrity. You agree not to:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Post abusive, harassing, defamatory, threatening, or hateful comments or stories.</li>
                <li>Promote or solicit the sale of counterfeit watches, replica dials, or illegal horological merchandise.</li>
                <li>Impersonate other collectors, authors, brand representatives, or curators.</li>
                <li>Transmit automated spam, phishing schemes, commercial advertisements, or malicious code.</li>
                <li>Attempt to bypass authentication, security safeguards, or Row-Level Security protections.</li>
                <li>Engage in aggressive scraping or denial-of-service activities that degrade server performance.</li>
              </ul>
            </section>

            <hr className="border-hairline" />

            {/* Section 06 */}
            <section id="ip" className="scroll-mt-28">
              <h2 className="font-display text-xl sm:text-2xl text-ink uppercase tracking-tight mb-4">
                06. Intellectual Property &amp; Brand Marks
              </h2>
              <p className="mb-4">
                <strong className="text-ink font-medium">Platform Rights:</strong> The MOERI &amp; JEANNERET name, the MOJEAN. wordmark,
                our editorial essays, original UI/UX layouts, software code, and evaluation algorithms are the proprietary property of
                MOERI &amp; JEANNERET and protected by applicable copyright and trademark laws.
              </p>
              <p className="mb-4">
                <strong className="text-ink font-medium">Third-Party Trademarks:</strong> All third-party brand names, references,
                model designations, logos, and manufacturer trademarks (e.g. Rolex, Omega, Patek Philippe, Audemars Piguet, Cartier,
                Grand Seiko) cited throughout the archive belong exclusively to their respective owners. Their mention is strictly
                nominative and for editorial, educational, and historical identification purposes.
              </p>
              <p>
                See our full <Link to="/copyright" className="text-ink underline font-medium hover:text-steel">Copyright &amp; Intellectual Property Notice</Link>.
              </p>
            </section>

            <hr className="border-hairline" />

            {/* Section 07 */}
            <section id="disclaimers" className="scroll-mt-28">
              <h2 className="font-display text-xl sm:text-2xl text-ink uppercase tracking-tight mb-4">
                07. Watch Data &amp; No Professional Advice
              </h2>
              <p className="mb-4">
                All specifications, historical records, dimensions, caliber classifications, and secondary market valuation ranges
                presented on the Platform are compiled for cultural, historical, and educational reference only.
              </p>
              <p className="mb-4">
                The Platform is not an investment advisor, financial analyst, certified horological appraisal authority, or official
                retailer. Editorial evaluations, community ratings, and &ldquo;WORTH IT?&rdquo; scores reflect deterministic editorial
                rubrics and enthusiast opinion, not financial or investment recommendations.
              </p>
              <p>
                See our complete <Link to="/disclaimer" className="text-ink underline font-medium hover:text-steel">Watch Information &amp; Content Disclaimer</Link>.
              </p>
            </section>

            <hr className="border-hairline" />

            {/* Section 08 */}
            <section id="moderation" className="scroll-mt-28">
              <h2 className="font-display text-xl sm:text-2xl text-ink uppercase tracking-tight mb-4">
                08. Moderation, Suspension &amp; Termination
              </h2>
              <p className="mb-4">
                We reserve the right to review, moderate, unpublish, or permanently remove any user-submitted content that violates
                these Terms or our <Link to="/community-guidelines" className="text-ink underline font-medium hover:text-steel">Community Guidelines</Link>.
              </p>
              <p>
                We may suspend or terminate user accounts that repeatedly violate community rules, engage in harassment, or attempt
                unauthorized exploitation of platform systems.
              </p>
            </section>

            <hr className="border-hairline" />

            {/* Section 09 */}
            <section id="liability" className="scroll-mt-28">
              <h2 className="font-display text-xl sm:text-2xl text-ink uppercase tracking-tight mb-4">
                09. Limitation of Liability &amp; Disclaimers
              </h2>
              <p className="mb-4">
                The Platform is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis without warranties of any kind,
                either express or implied. We do not guarantee that the service will be uninterrupted, error-free, or entirely free
                of historical errata.
              </p>
              <p>
                To the maximum extent permitted by law, MOERI &amp; JEANNERET and its operators shall not be liable for any indirect,
                incidental, consequential, or punitive damages arising from your access to, use of, or inability to use the Platform.
              </p>
            </section>

            <hr className="border-hairline" />

            {/* Section 10 */}
            <section id="governing-law" className="scroll-mt-28">
              <h2 className="font-display text-xl sm:text-2xl text-ink uppercase tracking-tight mb-4">
                10. Governing Law &amp; Jurisdiction
              </h2>
              <p className="mb-4">
                These Terms shall be governed by and construed in accordance with applicable laws, without giving effect to conflict of
                law principles. Any legal disputes arising under these Terms shall be resolved through competent courts of competent
                jurisdiction.
              </p>
              <p>
                We reserve the right to modify these Terms at any time. Continued use of the Platform after revisions constitutes
                acceptance of the updated Terms.
              </p>
            </section>

            <hr className="border-hairline" />

            {/* Section 11 */}
            <section id="contact" className="scroll-mt-28">
              <h2 className="font-display text-xl sm:text-2xl text-ink uppercase tracking-tight mb-4">
                11. Contact &amp; Legal Notices
              </h2>
              <p className="mb-4">
                For legal inquiries, formal notices, or questions regarding these Terms, contact our legal desk:
              </p>
              <div className="p-5 bg-warm-surface/60 border border-hairline text-xs font-mono">
                <div className="text-ink font-semibold uppercase tracking-wider mb-2">LEGAL &amp; COMPLIANCE DESK</div>
                <div className="text-ink-secondary mb-1">Email: <span className="text-ink select-all">thenameischaracter@gmail.com</span></div>
                <div className="text-ink-muted">Turnaround: Typically 1&ndash;3 business days</div>
              </div>
              <p className="mt-6 text-xs font-mono text-ink-muted">
                See also: <Link to="/privacy" className="text-ink underline hover:text-steel">Privacy Policy</Link> &bull; <Link to="/contact" className="text-ink underline hover:text-steel">Contact Directory</Link>
              </p>
            </section>
          </article>
        </div>
      </Container>
    </div>
  )
}
