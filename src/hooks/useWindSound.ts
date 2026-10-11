import { useCallback, useRef, useState } from 'react'

export type WindPlaybackIssue = 'blocked' | 'unavailable' | null

export default function useWindSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lastAttemptRef = useRef<number | null>(null)
  const attemptInProgressRef = useRef(false)
  const playbackGenerationRef = useRef(0)
  const [playbackIssue, setPlaybackIssue] = useState<WindPlaybackIssue>(null)

  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio('/sounds/wind-tick.mp3')
      audio.preload = 'auto'
      audio.volume = 0.25
      audioRef.current = audio
    }

    return audioRef.current
  }, [])

  const prepareWindSound = useCallback(() => {
    try {
      const audio = getAudio()
      if (audio.readyState === HTMLMediaElement.HAVE_NOTHING) audio.load()
    } catch {
      setPlaybackIssue('unavailable')
    }
  }, [getAudio])

  const playWindSound = useCallback(async (retry = false) => {
    let audio: HTMLAudioElement
    try {
      audio = getAudio()
    } catch {
      setPlaybackIssue('unavailable')
      return
    }

    const now = performance.now()
    if (
      attemptInProgressRef.current ||
      (!retry && lastAttemptRef.current !== null && now - lastAttemptRef.current < 1500) ||
      !audio.paused
    ) {
      return
    }

    lastAttemptRef.current = now
    attemptInProgressRef.current = true
    const playbackGeneration = playbackGenerationRef.current

    try {
      audio.volume = 0.25
      if (audio.readyState > HTMLMediaElement.HAVE_NOTHING) audio.currentTime = 0
      await audio.play()
      if (playbackGeneration === playbackGenerationRef.current) setPlaybackIssue(null)
    } catch (error) {
      if (playbackGeneration !== playbackGenerationRef.current) return
      if (error instanceof DOMException && error.name === 'AbortError') return
      setPlaybackIssue(error instanceof DOMException && error.name === 'NotAllowedError' ? 'blocked' : 'unavailable')
    } finally {
      attemptInProgressRef.current = false
    }
  }, [getAudio])

  const stopWindSound = useCallback(() => {
    playbackGenerationRef.current += 1
    const audio = audioRef.current
    if (audio && !audio.paused) {
      audio.pause()
      if (audio.readyState > HTMLMediaElement.HAVE_NOTHING) audio.currentTime = 0
    }
  }, [])

  return { playWindSound, prepareWindSound, stopWindSound, playbackIssue }
}
