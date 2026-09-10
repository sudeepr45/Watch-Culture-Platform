import Container from '../components/common/Container'
import SectionHeading from '../components/common/SectionHeading'
import { Link } from '../router'

export default function PrivacyPage() {
  const lastUpdated = 'September 10, 2026'

  return (
    <div className="py-12 sm:py-16 lg:py-20">
      <Container>
        {/* Header */}
        <div className="border-b border-hairline pb-8 mb-12 sm:mb-16">
          <SectionHeading
            label="TRUST &amp; DATA TRANSPARENCY"
            title="Privacy Policy"
            description="How MOERI & JEANNERET collects, handles, and safeguards your information across the platform."
          />
          <div className="mt-6 flex items-center gap-4 text-xs font-mono tracking-widest text-ink-muted uppercase">
            <span>DOCUMENT // PRIVACY</span>
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
                POLICY SECTIONS
              </span>
              <nav aria-label="Privacy Policy Sections" className="flex flex-col gap-2.5 text-xs font-mono text-ink-secondary">
                <a href="#overview" className="hover:text-ink transition-colors">01. PLATFORM OVERVIEW</a>
                <a href="#account-data" className="hover:text-ink transition-colors">02. ACCOUNT &amp; AUTHENTICATION</a>
                <a href="#user-content" className="hover:text-ink transition-colors">03. USER-SUBMITTED CONTENT</a>
                <a href="#storage-cookies" className="hover:text-ink transition-colors">04. LOCAL STORAGE &amp; SESSIONS</a>
                <a href="#infrastructure" className="hover:text-ink transition-colors">05. INFRASTRUCTURE &amp; HOSTING</a>
                <a href="#data-usage" className="hover:text-ink transition-colors">06. HOW INFORMATION IS USED</a>
                <a href="#security" className="hover:text-ink transition-colors">07. SECURITY ARCHITECTURE</a>
                <a href="#user-rights" className="hover:text-ink transition-colors">08. USER RIGHTS &amp; DELETION</a>
                <a href="#contact" className="hover:text-ink transition-colors">09. PRIVACY CONTACT</a>
              </nav>
            </div>
          </aside>

          {/* Main Prose Content */}
          <article className="lg:col-span-8 max-w-prose space-y-12 text-sm sm:text-base text-ink-secondary leading-relaxed font-normal">
            {/* Section 01 */}
            <section id="overview" className="scroll-mt-28">
              <h2 className="font-display text-xl sm:text-2xl text-ink uppercase tracking-tight mb-4">
                01. Platform Overview
              </h2>
              <p className="mb-4">
                MOERI &amp; JEANNERET operates as an independent horological journal, cultural archive, and interactive
                watch exploration platform. We believe in data transparency and minimal collection principles: we only
                collect information necessary to provide authentication, save your collector preferences, host community stories,
                and maintain the integrity of our cultural archive.
              </p>
              <p>
                We do not sell, rent, or trade your personal data to third-party data brokers, advertising networks, or marketing conglomerates.
              </p>
            </section>

            <hr className="border-hairline" />

            {/* Section 02 */}
            <section id="account-data" className="scroll-mt-28">
              <h2 className="font-display text-xl sm:text-2xl text-ink uppercase tracking-tight mb-4">
                02. Account &amp; Authentication Data
              </h2>
              <p className="mb-4">
                Creating an account on MOERI &amp; JEANNERET allows you to publish community stories, manage your personal
                watch collection in &ldquo;My Wrist,&rdquo; and participate in evaluations. When you register, we collect:
              </p>
              <ul className="list-disc pl-5 space-y-2 mb-4">
                <li>
                  <strong className="text-ink font-medium">Email &amp; Password Sign-Up:</strong> Your email address, chosen
                  username (@handle), display name, and password. Account authentication and login credentials are handled
                  through Supabase Auth identity services.
                </li>
                <li>
                  <strong className="text-ink font-medium">Google Sign-In (OAuth):</strong> If you authenticate via Google, we receive
                  your verified email address, Google account identifier, display name, and avatar profile image as authorized
                  by you during Google OAuth consent.
                </li>
                <li>
                  <strong className="text-ink font-medium">Collector Profile Information:</strong> Optional biographical text
                  (&ldquo;bio&rdquo;) and profile avatar images that you voluntarily add to your collector dossier.
                </li>
              </ul>
            </section>

            <hr className="border-hairline" />

            {/* Section 03 */}
            <section id="user-content" className="scroll-mt-28">
              <h2 className="font-display text-xl sm:text-2xl text-ink uppercase tracking-tight mb-4">
                03. User-Submitted Content &amp; Media
              </h2>
              <p className="mb-4">
                When you participate in community features, we store the content you author and associate it with your public profile:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-ink font-medium">Community Stories:</strong> Article titles, body text, story categories,
                  and watch model associations you submit.
                </li>
                <li>
                  <strong className="text-ink font-medium">Story Photographs:</strong> Images you upload to accompany your stories.
                  These files are stored in our dedicated, secured media storage buckets (<code className="text-xs font-mono bg-warm-surface px-1.5 py-0.5 border border-hairline">story-photos</code>)
                  and served publicly alongside your published writing.
                </li>
                <li>
                  <strong className="text-ink font-medium">My Wrist &amp; Interactions:</strong> Timepieces logged in your collection,
                  ownership status indicators, personal ownership notes, battle votes, story bookmarks, and comments.
                </li>
              </ul>
            </section>

            <hr className="border-hairline" />

            {/* Section 04 */}
            <section id="storage-cookies" className="scroll-mt-28">
              <h2 className="font-display text-xl sm:text-2xl text-ink uppercase tracking-tight mb-4">
                04. Local Storage &amp; Session Management
              </h2>
              <p className="mb-4">
                MOERI &amp; JEANNERET does not use third-party advertising cookies, cross-site trackers, or commercial tracking pixels.
              </p>
              <p className="mb-4">
                We use browser <code className="text-xs font-mono bg-warm-surface px-1.5 py-0.5 border border-hairline">localStorage</code> exclusively
                for functional session continuity:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-ink font-medium">Authentication Tokens:</strong> Secure JWT authentication session tokens
                  managed by Supabase Auth (<code className="text-xs font-mono bg-warm-surface px-1.5 py-0.5 border border-hairline">sb-*-auth-token</code>)
                  to keep you signed in between page refreshes and browser tabs.
                </li>
              </ul>
            </section>

            <hr className="border-hairline" />

            {/* Section 05 */}
            <section id="infrastructure" className="scroll-mt-28">
              <h2 className="font-display text-xl sm:text-2xl text-ink uppercase tracking-tight mb-4">
                05. Infrastructure &amp; Technical Service Providers
              </h2>
              <p className="mb-4">
                To deliver a fast, reliable, and secure experience globally, we rely on established cloud infrastructure partners:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-ink font-medium">Supabase Inc.:</strong> Provides our PostgreSQL database, user authentication
                  infrastructure, row-level security enforcement, and media storage.
                </li>
                <li>
                  <strong className="text-ink font-medium">Vercel Inc.:</strong> Provides global edge network hosting, static asset
                  delivery, and SSL/TLS encryption in transit.
                </li>
                <li>
                  <strong className="text-ink font-medium">Technical Log Data:</strong> When you access the website, hosting infrastructure
                  servers may automatically log standard connection metadata (such as IP addresses, browser user-agent, operating system,
                  and request timestamps) for security monitoring, DDoS mitigation, and server diagnostics.
                </li>
              </ul>
            </section>

            <hr className="border-hairline" />

            {/* Section 06 */}
            <section id="data-usage" className="scroll-mt-28">
              <h2 className="font-display text-xl sm:text-2xl text-ink uppercase tracking-tight mb-4">
                06. How We Use Information
              </h2>
              <p className="mb-4">
                We use the information we collect strictly to:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Authenticate your identity and maintain account security.</li>
                <li>Publish and format your user-authored stories, comments, and votes.</li>
                <li>Display your public collector dossier and manage your wrist collection.</li>
                <li>Enforce our <Link to="/community-guidelines" className="text-ink underline font-medium hover:text-steel">Community Guidelines</Link> and protect against spam, abuse, or unauthorized access.</li>
                <li>Respond to support inquiries, copyright notices, and correction requests.</li>
              </ul>
            </section>

            <hr className="border-hairline" />

            {/* Section 07 */}
            <section id="security" className="scroll-mt-28">
              <h2 className="font-display text-xl sm:text-2xl text-ink uppercase tracking-tight mb-4">
                07. Security Architecture
              </h2>
              <p className="mb-4">
                We implement technical and organizational controls to protect user data:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-ink font-medium">Row-Level Security (RLS):</strong> Database-level access control guarantees
                  that users can only modify their own profiles, stories, comments, and private collection records.
                </li>
                <li>
                  <strong className="text-ink font-medium">Transport Layer Security (TLS):</strong> All communications between your
                  browser and our servers are encrypted in transit via modern HTTPS.
                </li>
                <li>
                  <strong className="text-ink font-medium">Curator Authorization:</strong> Administrative archival records are protected
                  behind verified curator privileges (<code className="text-xs font-mono bg-warm-surface px-1.5 py-0.5 border border-hairline">public.is_curator()</code>)
                  to prevent unauthorized modifications.
                </li>
              </ul>
            </section>

            <hr className="border-hairline" />

            {/* Section 08 */}
            <section id="user-rights" className="scroll-mt-28">
              <h2 className="font-display text-xl sm:text-2xl text-ink uppercase tracking-tight mb-4">
                08. User Rights &amp; Account Deletion
              </h2>
              <p className="mb-4">
                You retain full autonomy over your personal data:
              </p>
              <ul className="list-disc pl-5 space-y-2 mb-4">
                <li>
                  <strong className="text-ink font-medium">Access &amp; Edit:</strong> You can view and edit your profile biography,
                  display name, avatar, and authored stories at any time directly through your account dashboard.
                </li>
                <li>
                  <strong className="text-ink font-medium">Content Removal:</strong> When you delete a published story, its associated
                  record and uploaded photographs in <code className="text-xs font-mono bg-warm-surface px-1.5 py-0.5 border border-hairline">story-photos</code> are
                  permanently removed.
                </li>
                <li>
                  <strong className="text-ink font-medium">Account Deletion:</strong> If you wish to permanently delete your account and
                  associated profile data, submit a request to our privacy desk. Upon verification, your profile, authentication credentials,
                  and private collection logs will be purged.
                </li>
              </ul>
            </section>

            <hr className="border-hairline" />

            {/* Section 09 */}
            <section id="contact" className="scroll-mt-28">
              <h2 className="font-display text-xl sm:text-2xl text-ink uppercase tracking-tight mb-4">
                09. Privacy Questions &amp; Contact
              </h2>
              <p className="mb-4">
                For questions regarding this policy or to exercise data rights, reach out to our privacy desk:
              </p>
              <div className="p-5 bg-warm-surface/60 border border-hairline text-xs font-mono">
                <div className="text-ink font-semibold uppercase tracking-wider mb-2">PRIVACY &amp; DATA INQUIRIES</div>
                <div className="text-ink-secondary mb-1">Email: <span className="text-ink select-all">thenameischaracter@gmail.com</span></div>
                <div className="text-ink-muted">Turnaround: Typically 1&ndash;3 business days</div>
              </div>
              <p className="mt-6 text-xs font-mono text-ink-muted">
                See also: <Link to="/terms" className="text-ink underline hover:text-steel">Terms &amp; Conditions</Link> &bull; <Link to="/contact" className="text-ink underline hover:text-steel">Contact Directory</Link>
              </p>
            </section>
          </article>
        </div>
      </Container>
    </div>
  )
}
