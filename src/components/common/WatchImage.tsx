import { useState } from 'react'
import { isSafeWatchImageUrl } from '../../utils/imageSafety'

export interface WatchImageProps {
  src?: string | null
  alt: string
  aspectRatio?: string
  className?: string
  imageClassName?: string
  loading?: 'lazy' | 'eager'
  compact?: boolean
}

/**
 * MOERI & JEANNERET — SHARED ARCHIVE WATCH IMAGE COMPONENT
 *
 * Implements strict archive credibility safeguards:
 * - Valid verified image: Renders authentic photography.
 * - Missing / unverified / unsafe image: Renders restrained archival pending plate.
 * - Network load error: Gracefully falls back to archival pending plate.
 */
export default function WatchImage({
  src,
  alt,
  aspectRatio = 'aspect-[4/3]',
  className = '',
  imageClassName = '',
  loading = 'lazy',
  compact = false,
}: WatchImageProps) {
  const [loadError, setLoadError] = useState(false)
  const [prevSrc, setPrevSrc] = useState(src)

  if (src !== prevSrc) {
    setPrevSrc(src)
    setLoadError(false)
  }

  const isSafe = isSafeWatchImageUrl(src) && !loadError

  return (
    <div
      className={`relative w-full overflow-hidden bg-warm-surface flex items-center justify-center ${aspectRatio} ${className}`}
    >
      {isSafe && src ? (
        <img
          src={src}
          alt={alt}
          loading={loading}
          onError={() => setLoadError(true)}
          className={`h-full w-full object-cover object-center transition-opacity duration-300 ${imageClassName}`}
        />
      ) : compact ? (
        <div className="w-full h-full bg-warm-white flex flex-col items-center justify-center p-1.5 text-center select-none border border-hairline/40">
          <span className="text-[7px] font-mono tracking-wider text-ink-secondary uppercase block font-medium leading-tight">
            ARCHIVE PHOTO
          </span>
          <span className="text-[6px] font-mono tracking-wider text-ink-muted uppercase block leading-tight mt-0.5">
            PENDING
          </span>
        </div>
      ) : (
        <div className="w-full h-full bg-warm-white flex flex-col items-center justify-center p-4 sm:p-6 text-center select-none border border-hairline/40">
          <div className="border border-hairline bg-warm-surface/30 px-3 py-1.5 mb-2">
            <span className="text-[10px] font-mono tracking-[0.25em] text-ink-secondary uppercase block font-medium">
              ARCHIVE PHOTOGRAPH
            </span>
          </div>
          <span className="text-[9px] font-mono tracking-[0.2em] text-ink-muted uppercase">
            IMAGE PENDING VERIFICATION
          </span>
        </div>
      )}
    </div>
  )
}
