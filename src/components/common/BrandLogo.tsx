import { type MouseEvent, type ReactNode, useEffect, useState } from 'react'
import { Link } from '../../router'

export interface AmpersandOrigin {
  x: number
  y: number
}

interface BrandLogoProps {
  variant?: 'horizontal' | 'stacked' | 'compact'
  size?: 'sm' | 'md' | 'lg'
  withSubtitle?: boolean
  subtitle?: ReactNode
  className?: string
  animateAssembly?: boolean
  interactiveWind?: boolean
  onAmpersandActivate?: (origin: AmpersandOrigin) => void
}

export default function BrandLogo({
  variant = 'horizontal',
  size = 'md',
  withSubtitle = false,
  subtitle = 'CULTURE \u2022 STORIES \u2022 ARCHIVE',
  className = '',
  animateAssembly = false,
  interactiveWind = false,
  onAmpersandActivate,
}: BrandLogoProps) {
  const [shouldAnimate, setShouldAnimate] = useState(false)

  useEffect(() => {
    if (!animateAssembly) return

    if (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }

    try {
      const alreadyPlayed = sessionStorage.getItem('mojean_assembly_played')
      if (!alreadyPlayed) {
        const assemblyFrame = requestAnimationFrame(() => {
          setShouldAnimate(true)
          try {
            sessionStorage.setItem('mojean_assembly_played', 'true')
          } catch {
            // Gracefully handle storage errors
          }
        })

        return () => cancelAnimationFrame(assemblyFrame)
      }
    } catch {
      // Gracefully handle storage errors
    }
  }, [animateAssembly])

  // 1. Stacked Editorial Variant
  if (variant === 'stacked') {
    return (
      <div className={`flex flex-col items-start uppercase font-sans text-ink ${className}`}>
        <div className="flex flex-col leading-[0.95] tracking-[0.22em] font-semibold text-sm sm:text-base">
          <span className={shouldAnimate ? 'animate-assembly-left' : ''}>MOERI</span>
          <span
            className={`my-1.5 text-[0.8em] font-light tracking-[0.1em] text-ink-secondary select-none inline-block origin-center ${
              interactiveWind
                ? 'rotate-90'
                : ''
            } ${shouldAnimate ? 'animate-assembly-center' : ''}`}
            aria-hidden="true"
          >
            &amp;
          </span>
          <span className={shouldAnimate ? 'animate-assembly-right' : ''}>JEANNERET</span>
        </div>
        {withSubtitle && (
          <span
            className={`mt-2 text-[8px] font-mono tracking-[0.24em] text-ink-muted uppercase ${
              shouldAnimate ? 'animate-assembly-fade' : ''
            }`}
          >
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
          className={`mx-1 text-[0.78em] font-light text-ink-secondary select-none inline-block origin-center ${
            interactiveWind
              ? 'rotate-90'
              : ''
          }`}
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
  const nameClass = `font-semibold ${currentSize.name} ${shouldAnimate ? 'animate-assembly-left' : ''}`
  const rightNameClass = `font-semibold ${currentSize.name} ${shouldAnimate ? 'animate-assembly-right' : ''}`
  const ampersandClass = `font-light text-[#8A102A] select-none inline-block origin-center ${currentSize.amp} ${onAmpersandActivate ? 'cursor-pointer' : ''} ${interactiveWind ? 'rotate-0 animate-wordmark-ampersand' : ''} ${shouldAnimate ? 'animate-assembly-center' : ''}`
  const homeLinkClass = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-ink'

  const activateAmpersand = (event: MouseEvent<HTMLButtonElement>) => {
    if (!onAmpersandActivate) return
    event.preventDefault()
    event.stopPropagation()
    const rect = event.currentTarget.getBoundingClientRect()
    const isPointerActivation = event.detail > 0
    onAmpersandActivate({
      x: (isPointerActivation ? event.clientX : rect.left + rect.width / 2) / window.innerWidth,
      y: (isPointerActivation ? event.clientY : rect.top + rect.height / 2) / window.innerHeight,
    })
  }

  return (
    <div className={`flex flex-col ${className}`} aria-label="MOERI & JEANNERET">
      <div className="inline-flex items-baseline leading-none uppercase font-sans text-ink">
        {onAmpersandActivate ? (
          <Link to="/" className={homeLinkClass} aria-label="MOERI home">
            <span className={nameClass}>MOERI</span>
          </Link>
        ) : (
          <span className={nameClass}>MOERI</span>
        )}
        {onAmpersandActivate ? (
          <button
            type="button"
            className={`mojean-amp-trigger ${ampersandClass} focus:outline-none focus-visible:ring-2 focus-visible:ring-ink`}
            aria-label="Open hidden page"
            onClick={activateAmpersand}
          >
            &amp;
          </button>
        ) : (
          <span className={ampersandClass} aria-hidden="true">&amp;</span>
        )}
        {onAmpersandActivate ? (
          <Link to="/" className={homeLinkClass} aria-label="JEANNERET home">
            <span className={rightNameClass}>JEANNERET</span>
          </Link>
        ) : (
          <span className={rightNameClass}>JEANNERET</span>
        )}
      </div>
      {withSubtitle && (
        onAmpersandActivate ? (
          <Link to="/" className={`mt-1 w-fit ${homeLinkClass}`} aria-label="MOERI and JEANNERET culture, stories and archive">
            <span className={`font-mono text-ink-muted uppercase ${currentSize.subtitle} ${shouldAnimate ? 'animate-assembly-fade' : ''}`}>
              {subtitle}
            </span>
          </Link>
        ) : (
          <span className={`mt-1 font-mono text-ink-muted uppercase ${currentSize.subtitle} ${shouldAnimate ? 'animate-assembly-fade' : ''}`}>
            {subtitle}
          </span>
        )
      )}
    </div>
  )
}

