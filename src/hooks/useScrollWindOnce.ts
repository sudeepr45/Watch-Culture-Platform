import { useEffect } from 'react'
import useWindSound from './useWindSound'

export default function useScrollWindOnce(enabled: boolean) {
  const playWindSound = useWindSound()

  useEffect(() => {
    if (!enabled) return

    const handleScroll = () => {
      playWindSound()
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [enabled, playWindSound])
}
