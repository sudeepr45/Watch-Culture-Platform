import { useEffect, useState } from 'react'

type SoundChoice = 'enabled' | 'declined' | null

function readSoundChoice(): SoundChoice {
  try {
    const choice = localStorage.getItem('mj_sound_choice')
    return choice === 'enabled' || choice === 'declined' ? choice : null
  } catch {
    return null
  }
}

interface SoundNoteProps {
  onEnable: () => void
}

export default function SoundNote({ onEnable }: SoundNoteProps) {
  const [choice, setChoice] = useState<SoundChoice>(readSoundChoice)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (choice !== null) return

    const revealTimer = window.setTimeout(() => setVisible(true), 2500)
    return () => window.clearTimeout(revealTimer)
  }, [choice])

  const choose = (nextChoice: Exclude<SoundChoice, null>) => {
    try {
      localStorage.setItem('mj_sound_choice', nextChoice)
    } catch {
      // Keep the choice for this visit if persistent storage is unavailable.
    }

    setChoice(nextChoice)
    if (nextChoice === 'enabled') onEnable()
  }

  if (choice !== null) return null

  return (
    <div
      role="note"
      aria-label="A Note"
      aria-hidden={!visible}
      inert={!visible}
      className={`fixed bottom-4 left-4 right-4 z-[60] max-w-[320px] border border-hairline bg-warm-white p-4 text-ink transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none sm:bottom-6 sm:left-6 sm:right-auto ${
        visible
          ? 'pointer-events-auto translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-2 opacity-0'
      }`}
    >
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-muted">A Note</div>
      <p className="mt-2 text-xs leading-relaxed text-ink-secondary">
        This site has a small sound — a mechanical wind, played once as you scroll. Worth a listen, entirely optional.
      </p>
      <div className="mt-3 flex items-center gap-5">
        <button
          type="button"
          onClick={() => choose('enabled')}
          className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink hover:text-ink-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          Enable sound
        </button>
        <button
          type="button"
          onClick={() => choose('declined')}
          className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          No thanks
        </button>
      </div>
    </div>
  )
}
