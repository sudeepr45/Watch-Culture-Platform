import { useEffect } from 'react'
import useWindSound from './useWindSound'

export default function useScrollWindOnce(enabled: boolean) {
  const playWindSound = useWindSound()

  useEffect(() => {
    if (!enabled) return

    try {
      if (sessionStorage.getItem('mj_wind_played')) return
    } catch {
      // Continue with an in-memory once-per-mount listener if storage is unavailable.
    }

    const handleScroll = () => {
      if (window.scrollY <= 300) return

      playWindSound()
      try {
        sessionStorage.setItem('mj_wind_played', 'true')
      } catch {
        // Playback remains once per mount if storage is unavailable.
      }
      window.removeEventListener('scroll', handleScroll)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [enabled, playWindSound])
}
