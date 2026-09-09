import { type ReactNode } from 'react'

interface BrandLogoProps {
  variant?: 'horizontal' | 'stacked' | 'compact'
  size?: 'sm' | 'md' | 'lg'
  withSubtitle?: boolean
  subtitle?: ReactNode
  className?: string
}

export default function BrandLogo({
  variant = 'horizontal',
  size = 'md',
  withSubtitle = false,
  subtitle = 'CULTURE \u2022 STORIES \u2022 ARCHIVE',
  className = '',
}: BrandLogoProps) {
  // 1. Stacked Editorial Variant
  if (variant === 'stacked') {
    return (
      <div className={`flex flex-col items-start uppercase font-sans text-ink ${className}`}>
        <div className="flex flex-col leading-[0.95] tracking-[0.22em] font-semibold text-sm sm:text-base">
          <span>MOERI</span>
          <span
            className="my-1.5 text-[0.8em] font-light tracking-[0.1em] text-ink-secondary select-none"
            aria-hidden="true"
          >
            &amp;
          </span>
          <span>JEANNERET</span>
        </div>
        {withSubtitle && (
          <span className="mt-2 text-[8px] font-mono tracking-[0.24em] text-ink-muted uppercase">
            {subtitle}
          </span>
        )}
      </div>
    )
  }

  // 2. Compact Typographic Mark (Restrained)
  if (variant === 'compact') {
    return (
      <div
        className={`inline-flex items-baseline font-mono text-ink uppercase ${className}`}
        aria-label="MOERI & JEANNERET"
      >
        <span className="font-semibold text-xs tracking-wider">M</span>
        <span
          className="mx-1 text-[0.78em] font-light text-ink-secondary select-none"
          aria-hidden="true"
        >
          &amp;
        </span>
        <span className="font-semibold text-xs tracking-wider">J</span>
      </div>
    )
  }

  // 3. Primary Horizontal Masthead Variant
  const sizeClasses = {
    sm: {
      name: 'text-xs sm:text-sm tracking-[0.22em]',
      amp: 'mx-2.5 sm:mx-3 text-[0.78em]',
      subtitle: 'text-[8.5px] tracking-[0.24em]',
    },
    md: {
      name: 'text-sm sm:text-base tracking-[0.24em]',
      amp: 'mx-3 sm:mx-4 text-[0.8em]',
      subtitle: 'text-[9px] tracking-[0.26em]',
    },
    lg: {
      name: 'text-base sm:text-lg md:text-xl tracking-[0.26em]',
      amp: 'mx-3.5 sm:mx-5 text-[0.82em]',
      subtitle: 'text-[10px] tracking-[0.28em]',
    },
  }

  const currentSize = sizeClasses[size]

  return (
    <div className={`flex flex-col ${className}`} aria-label="MOERI & JEANNERET">
      <div className="inline-flex items-baseline leading-none uppercase font-sans text-ink">
        <span className={`font-semibold ${currentSize.name} transition-colors group-hover:text-neutral-700`}>
          MOERI
        </span>
        <span
          className={`font-light text-ink-secondary select-none ${currentSize.amp}`}
          aria-hidden="true"
        >
          &amp;
        </span>
        <span className={`font-semibold ${currentSize.name} transition-colors group-hover:text-neutral-700`}>
          JEANNERET
        </span>
      </div>
      {withSubtitle && (
        <span className={`mt-1 font-mono text-ink-muted uppercase ${currentSize.subtitle}`}>
          {subtitle}
        </span>
      )}
    </div>
  )
}
