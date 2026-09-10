import { type ReactNode } from 'react'

interface SectionHeadingProps {
  label?: string
  title: ReactNode
  description?: string
  align?: 'left' | 'center'
  className?: string
}

export default function SectionHeading({
  label,
  title,
  description,
  align = 'left',
  className = '',
}: SectionHeadingProps) {
  const alignmentStyles = align === 'center' ? 'text-center mx-auto' : 'text-left'

  return (
    <div className={`max-w-4xl ${alignmentStyles} ${className}`}>
      {label && (
        <div className={`flex items-center gap-2 mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-ink-muted ${align === 'center' ? 'justify-center' : ''}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-steel" aria-hidden="true" />
          <span>{label}</span>
        </div>
      )}
      <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight text-ink leading-[1.08]">
        {title}
      </h2>
      {description && (
        <p className="mt-4 sm:mt-5 text-base sm:text-lg text-ink-secondary font-normal leading-relaxed max-w-2xl">
          {description}
        </p>
      )}
    </div>
  )
}
