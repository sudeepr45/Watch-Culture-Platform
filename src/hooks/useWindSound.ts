import { useCallback, useRef } from 'react'

export default function useWindSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lastAttemptRef = useRef<number | null>(null)

  return useCallback(() => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio('/sounds/wind-tick.mp3')
        audioRef.current.volume = 0.25
      }

      const audio = audioRef.current
      const now = performance.now()
      if (
        (lastAttemptRef.current !== null && now - lastAttemptRef.current < 1500) ||
        !audio.paused
      ) {
        return
      }

      lastAttemptRef.current = now
      audio.volume = 0.25
      audio.currentTime = 0
      void audio.play().catch(() => {
        // Playback failures are intentionally silent.
      })
    } catch {
      // Audio setup and playback failures are intentionally silent.
    }
  }, [])
}
