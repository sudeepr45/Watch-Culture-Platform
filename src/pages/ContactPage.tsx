import Container from '../components/common/Container'
import SectionHeading from '../components/common/SectionHeading'
import { Link } from '../router'

export default function ContactPage() {
  const primaryEmail = 'thenameischaracter@gmail.com'

  const inquiryTypes = [
    {
      label: 'EDITORIAL & GENERAL INQUIRIES',
      purpose: 'General editorial correspondence, story feedback, and questions regarding published articles or cultural dispatches.',
    },
    {
      label: 'ARCHIVAL ERRATA & CORRECTIONS',
      purpose: 'Factual corrections, caliber documentation, historical errata, reference number updates, or verified provenance records.',
    },
    {
      label: 'LEGAL & INTELLECTUAL PROPERTY',
      purpose: 'Formal legal notices, DMCA/copyright takedown requests, brand trademark notices, or terms inquiries.',
    },
    {
      label: 'COMMUNITY & CONTENT CONCERNS',
      purpose: 'Reports concerning community stories, comments, guideline violations, or moderation questions.',
    },
    {
      label: 'PRIVACY & DATA REQUESTS',
      purpose: 'Account data inquiries, data export requests, profile deletion, or questions regarding our Privacy Policy.',
    },
  ]

  return (
    <div className="py-12 sm:py-16 lg:py-20">
      <Container>
        {/* Header */}
        <div className="border-b border-hairline pb-8 mb-12 sm:mb-16">
          <SectionHeading
            label="COMMUNICATIONS &bull; DIRECTORY"
            title="Contact &amp; Dispatches"
            description="Reach our editorial team, archival curators, moderation desk, or legal representatives."
          />
          <div className="mt-6 flex items-center gap-4 text-xs font-mono tracking-widest text-ink-muted uppercase">
            <span>CONTACT // DIRECTORY</span>
            <span>&bull;</span>
            <span>PRIMARY INBOX</span>
          </div>
        </div>

        {/* Primary Contact Panel */}
        <div className="max-w-3xl mb-12">
          <div className="p-8 sm:p-10 bg-warm-surface border border-hairline relative">
            <div className="absolute -inset-1.5 border border-hairline pointer-events-none" aria-hidden="true" />
            <div className="text-[10px] font-mono tracking-[0.25em] text-ink-muted uppercase mb-3 font-semibold">
              PRIMARY CONTACT CHANNEL
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-mono font-bold text-ink mb-4 select-all break-all">
              {primaryEmail}
            </div>
            <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed font-normal mb-6">
              All correspondence for MOERI &amp; JEANNERET is received through this primary email. To ensure your message
              is addressed promptly, please mention the subject of your inquiry (e.g., &ldquo;Archival Correction,&rdquo;
              &ldquo;Privacy Request,&rdquo; or &ldquo;Editorial Feedback&rdquo;) in your email subject line.
            </p>
            <div className="pt-4 border-t border-hairline flex items-center justify-between text-xs font-mono text-ink-muted uppercase tracking-wider">
              <span>Expected Turnaround:</span>
              <span className="text-ink font-medium">1&ndash;3 Business Days</span>
            </div>
          </div>
        </div>

        {/* Covered Inquiry Categories */}
        <div className="max-w-3xl mb-16 sm:mb-20">
          <div className="text-[10px] font-mono tracking-[0.25em] text-ink-muted uppercase mb-6 font-semibold">
            INQUIRY CATEGORIES HANDLED AT THIS ADDRESS
          </div>
          <div className="space-y-4">
            {inquiryTypes.map((item) => (
              <div key={item.label} className="p-5 bg-warm-surface/30 border border-hairline">
                <div className="text-xs font-mono font-semibold text-ink uppercase tracking-wider mb-1">
                  {item.label}
                </div>
                <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed font-normal">
                  {item.purpose}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Reference Links */}
        <div className="border-t border-hairline pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-ink-muted">
          <div>
            MOERI &amp; JEANNERET &bull; INDEPENDENT HOROLOGICAL ARCHIVE
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/about" className="text-ink underline hover:text-steel">About the Platform</Link>
            <span>&bull;</span>
            <Link to="/privacy" className="text-ink underline hover:text-steel">Privacy Policy</Link>
            <span>&bull;</span>
            <Link to="/terms" className="text-ink underline hover:text-steel">Terms of Service</Link>
          </div>
        </div>
      </Container>
    </div>
  )
}
