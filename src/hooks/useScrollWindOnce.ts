import { useCallback, useEffect, useRef } from 'react'
import useWindSound from './useWindSound'

export default function useScrollWindOnce(enabled: boolean, pathname: string) {
  const { playWindSound, prepareWindSound, stopWindSound, playbackIssue } = useWindSound()
  const expectedDestination = useRef<'top' | 'bottom' | null>(null)

  useEffect(() => {
    if (pathname !== '/' || !enabled) {
      expectedDestination.current = null
      stopWindSound()
      return
    }

    prepareWindSound()

    const tolerance = 2
    const getPagePosition = () => {
      const pageHeight = document.documentElement.scrollHeight
      const canScroll = pageHeight > window.innerHeight + tolerance * 2
      const atTop = window.scrollY <= tolerance
      const atBottom = window.innerHeight + window.scrollY >= pageHeight - tolerance

      return { canScroll, atTop, atBottom }
    }

    const initialPosition = getPagePosition()
    if (!initialPosition.canScroll) expectedDestination.current = null
    else if (initialPosition.atTop) expectedDestination.current = 'bottom'
    else if (initialPosition.atBottom) expectedDestination.current = 'top'
    else expectedDestination.current = null

    const handleScroll = () => {
      const { canScroll, atTop, atBottom } = getPagePosition()
      if (!canScroll || (atTop && atBottom)) return

      const destination = expectedDestination.current

      if (destination === null) {
        if (atTop) expectedDestination.current = 'bottom'
        else if (atBottom) expectedDestination.current = 'top'
        return
      }

      if (destination === 'bottom' && atBottom) {
        expectedDestination.current = 'top'
        void playWindSound()
      } else if (destination === 'top' && atTop) {
        expectedDestination.current = 'bottom'
        void playWindSound()
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [enabled, pathname, playWindSound, prepareWindSound, stopWindSound])

  const retryWindSound = useCallback(() => {
    if (enabled && pathname === '/') void playWindSound(true)
  }, [enabled, pathname, playWindSound])

  return { playbackIssue, retryWindSound }
}
