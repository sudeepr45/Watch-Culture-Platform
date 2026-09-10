import Container from '../components/common/Container'
import SectionHeading from '../components/common/SectionHeading'
import { Link } from '../router'

export default function CommunityGuidelinesPage() {
  const lastUpdated = 'September 10, 2026'

  return (
    <div className="py-12 sm:py-16 lg:py-20">
      <Container>
        {/* Header */}
        <div className="border-b border-hairline pb-8 mb-12 sm:mb-16">
          <SectionHeading
            label="COMMUNITY &amp; DISCOURSE STANDARDS"
            title="Community Guidelines"
            description="Our standards for thoughtful, respectful, and authentic horological storytelling and debate."
          />
          <div className="mt-6 flex items-center gap-4 text-xs font-mono tracking-widest text-ink-muted uppercase">
            <span>DOCUMENT // COMMUNITY</span>
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
                GUIDELINES INDEX
              </span>
              <nav aria-label="Community Guidelines Index" className="flex flex-col gap-2.5 text-xs font-mono text-ink-secondary">
                <a href="#ethos" className="hover:text-ink transition-colors">01. OUR EDITORIAL ETHOS</a>
                <a href="#authentic-stories" className="hover:text-ink transition-colors">02. AUTHENTIC STORYTELLING</a>
                <a href="#photography" className="hover:text-ink transition-colors">03. PHOTOGRAPHY &amp; PROVENANCE</a>
                <a href="#civil-debate" className="hover:text-ink transition-colors">04. RESPECTFUL CRITICISM</a>
                <a href="#prohibitions" className="hover:text-ink transition-colors">05. ZERO-TOLERANCE CONDUCT</a>
                <a href="#moderation" className="hover:text-ink transition-colors">06. MODERATION &amp; ENFORCEMENT</a>
                <a href="#reporting" className="hover:text-ink transition-colors">07. REPORTING CONCERNS</a>
              </nav>
            </div>
          </aside>

          {/* Main Prose Content */}
          <article className="lg:col-span-8 max-w-prose space-y-12 text-sm sm:text-base text-ink-secondary leading-relaxed font-normal">
            {/* Section 01 */}
            <section id="ethos" className="scroll-mt-28">
              <h2 className="font-display text-xl sm:text-2xl text-ink uppercase tracking-tight mb-4">
                01. Our Editorial Ethos
              </h2>
              <p className="mb-4">
                MOERI &amp; JEANNERET is a dedicated space for watch culture, mechanical craft, and the personal journeys
                behind wristwatches. We are building an intelligent, serious, and welcoming community where collectors,
                historians, and newcomers can share meaningful perspectives.
              </p>
              <p>
                We value depth over hype, mechanical curiosity over speculative frenzy, and authentic personal reflection
                over commercial posturing.
              </p>
            </section>

            <hr className="border-hairline" />

            {/* Section 02 */}
            <section id="authentic-stories" className="scroll-mt-28">
              <h2 className="font-display text-xl sm:text-2xl text-ink uppercase tracking-tight mb-4">
                02. Authentic Horological Storytelling
              </h2>
              <p className="mb-4">
                When authoring Community Stories on the platform:
              </p>
              <ul className="list-disc pl-5 space-y-2 mb-4">
                <li>
                  <strong className="text-ink font-medium">Write from Real Experience:</strong> Share genuine reflections on
                  acquiring, wearing, servicing, or researching timepieces. Whether discussing an entry-level field watch or a grand
                  complication, honest personal insight is what matters.
                </li>
                <li>
                  <strong className="text-ink font-medium">Provide Context &amp; Substance:</strong> Strive for constructive substance.
                  Explain the &ldquo;why&rdquo; behind your thoughts—design details, historical ergonomics, mechanical quirks, or life milestones.
                </li>
                <li>
                  <strong className="text-ink font-medium">No Duplicate Submissions:</strong> Do not repeatedly post identical or
                  near-identical stories to artificially manipulate engagement.
                </li>
              </ul>
            </section>

            <hr className="border-hairline" />

            {/* Section 03 */}
            <section id="photography" className="scroll-mt-28">
              <h2 className="font-display text-xl sm:text-2xl text-ink uppercase tracking-tight mb-4">
                03. Photography &amp; Provenance Standards
              </h2>
              <p className="mb-4">
                High-quality visual documentation preserves our archive credibility:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-ink font-medium">Original Photography:</strong> Only upload wrist shots, macro photos,
                  or movement captures that you personally photographed or have explicit written authorization from the owner to share.
                </li>
                <li>
                  <strong className="text-ink font-medium">No Image Piracy:</strong> Never screenshot or upload photography from
                  other collectors, Instagram accounts, online auctions, or commercial publications without permission.
                </li>
                <li>
                  <strong className="text-ink font-medium">No Synthetic Renders:</strong> Do not upload synthetic AI-generated watch
                  renders or fabricated mockups claiming to be real timepieces.
                </li>
              </ul>
            </section>

            <hr className="border-hairline" />

            {/* Section 04 */}
            <section id="civil-debate" className="scroll-mt-28">
              <h2 className="font-display text-xl sm:text-2xl text-ink uppercase tracking-tight mb-4">
                04. Respectful Criticism &amp; Battle Debates
              </h2>
              <p className="mb-4">
                Watch enthusiast culture thrives on passionate debate. Whether defending the merits of a high-beat automatic caliber
                over Spring Drive or voting in head-to-head Battles:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-ink font-medium">Critique the Timepiece, Not the Collector:</strong> Disagreement over case
                  finishing, water resistance ratings, or price-to-value equations is welcomed. Personal attacks, insults, or gatekeeping
                  directed at fellow community members are strictly prohibited.
                </li>
                <li>
                  <strong className="text-ink font-medium">Respect Different Price Points:</strong> Great horology exists across all
                  budgets, from mechanical microbrands to haute horlogerie. Snobbery and elitism undermine community dialogue.
                </li>
              </ul>
            </section>

            <hr className="border-hairline" />

            {/* Section 05 */}
            <section id="prohibitions" className="scroll-mt-28">
              <h2 className="font-display text-xl sm:text-2xl text-ink uppercase tracking-tight mb-4">
                05. Zero-Tolerance Conduct
              </h2>
              <p className="mb-4">
                The following behaviors will result in immediate content removal and potential account suspension:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-ink font-medium">Counterfeits &amp; Replicas:</strong> Advertising, promoting, selling,
                  or celebrating counterfeit watches, replica movements, or fake branding marks.
                </li>
                <li>
                  <strong className="text-ink font-medium">Harassment &amp; Hate Speech:</strong> Targeted bullying, discriminatory
                  language, hate speech, threats, or invasion of privacy.
                </li>
                <li>
                  <strong className="text-ink font-medium">Spam &amp; Commercial Solicitation:</strong> Using community stories or
                  comments to post affiliate referral links, unauthorized retail sales listings, gray-market broker ads, or promotional spam.
                </li>
                <li>
                  <strong className="text-ink font-medium">Impersonation:</strong> Posing as another collector, brand representative,
                  watchmaker, or platform curator.
                </li>
              </ul>
            </section>

            <hr className="border-hairline" />

            {/* Section 06 */}
            <section id="moderation" className="scroll-mt-28">
              <h2 className="font-display text-xl sm:text-2xl text-ink uppercase tracking-tight mb-4">
                06. Moderation &amp; Enforcement
              </h2>
              <p className="mb-4">
                Our editorial and curation team monitors community submissions to uphold archival quality and user safety.
                Actions we may take include:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-ink font-medium">Editorial Corrections:</strong> Flagging or correcting factual archive
                  misattributions (e.g. incorrect reference numbers or movement calibers).
                </li>
                <li>
                  <strong className="text-ink font-medium">Content Removal:</strong> Unpublishing stories, comments, or media that
                  violate these guidelines.
                </li>
                <li>
                  <strong className="text-ink font-medium">Account Restrictions:</strong> Issuing warnings, temporarily restricting
                  publishing privileges, or permanently terminating accounts for serious or repeated infractions.
                </li>
              </ul>
            </section>

            <hr className="border-hairline" />

            {/* Section 07 */}
            <section id="reporting" className="scroll-mt-28">
              <h2 className="font-display text-xl sm:text-2xl text-ink uppercase tracking-tight mb-4">
                07. Reporting Concerns &amp; Appeals
              </h2>
              <p className="mb-4">
                If you encounter content or conduct that violates these guidelines, report it directly to our moderation desk:
              </p>
              <div className="p-5 bg-warm-surface/60 border border-hairline text-xs font-mono">
                <div className="text-ink font-semibold uppercase tracking-wider mb-2">COMMUNITY MODERATION DESK</div>
                <div className="text-ink-secondary mb-1">Email: <span className="text-ink select-all">thenameischaracter@gmail.com</span></div>
                <div className="text-ink-muted">Include the URL of the affected story/comment and a brief explanation of the concern.</div>
              </div>
              <p className="mt-6 text-xs font-mono text-ink-muted">
                See also: <Link to="/terms" className="text-ink underline hover:text-steel">Terms &amp; Conditions</Link> &bull; <Link to="/copyright" className="text-ink underline hover:text-steel">Copyright Policy</Link>
              </p>
            </section>
          </article>
        </div>
      </Container>
    </div>
  )
}
