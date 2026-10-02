import { useEffect, useId, useRef, useState, type FocusEvent } from 'react'

export interface HeroNoteItem {
  id: string
  number: string
  title: string
  body: string
  liveValue?: string
}

interface HeroNoteProps {
  notes: HeroNoteItem[]
  onActiveNoteChange?: (id: string | null) => void
}

export default function HeroNote({ notes, onActiveNoteChange }: HeroNoteProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [pinnedId, setPinnedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const [dismissedId, setDismissedId] = useState<string | null>(null)
  const [displayedNote, setDisplayedNote] = useState<HeroNoteItem | null>(null)
  const groupRef = useRef<HTMLElement>(null)
  const detailsId = useId()
  const activeNote = notes.find((note) => note.id === activeId) ?? null
  const visibleNote = activeNote ?? displayedNote

  useEffect(() => {
    onActiveNoteChange?.(activeId)
  }, [activeId, onActiveNoteChange])

  const activate = (id: string) => {
    setActiveId(id)
    const selectedNote = notes.find((note) => note.id === id)
    if (selectedNote) setDisplayedNote(selectedNote)
  }

  const activateTransiently = (id: string) => {
    if (pinnedId !== id) setPinnedId(null)
    setDismissedId(null)
    activate(id)
  }

  const handleGroupLeave = () => {
    setHoveredId(null)
    if (pinnedId) {
      activate(pinnedId)
    } else if (focusedId && focusedId !== dismissedId) {
      activate(focusedId)
    } else {
      setActiveId(null)
    }
    if (dismissedId && focusedId !== dismissedId) setDismissedId(null)
  }

  const handleBlur = (event: FocusEvent<HTMLButtonElement>, id: string) => {
    const nextTarget = event.relatedTarget
    if (nextTarget instanceof Node && groupRef.current?.contains(nextTarget)) return

    setFocusedId(null)
    if (pinnedId) {
      activate(pinnedId)
    } else if (hoveredId && hoveredId !== dismissedId) {
      activate(hoveredId)
    } else {
      setActiveId(null)
    }
    if (dismissedId === id && hoveredId !== id) setDismissedId(null)
  }

  const togglePinned = (id: string) => {
    if (pinnedId === id) {
      setPinnedId(null)
      setDismissedId(id)
      setActiveId(null)
      return
    }
    setPinnedId(id)
    setDismissedId(null)
    activate(id)
  }

  return (
    <aside
      ref={groupRef}
      aria-label="Hero instrument notes"
      className="relative ml-auto mt-2 w-full max-w-[320px] text-ink"
      onMouseLeave={handleGroupLeave}
    >
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {notes.map((note) => {
          const isActive = activeId === note.id
          return (
            <button
              key={note.id}
              type="button"
              aria-label={`A Note ${note.number}: ${note.title}. ${isActive ? 'Collapse note' : 'Expand note'}`}
              aria-expanded={isActive}
              aria-controls={detailsId}
              onMouseEnter={() => {
                setHoveredId(note.id)
                activateTransiently(note.id)
              }}
              onFocus={() => {
                setFocusedId(note.id)
                activateTransiently(note.id)
              }}
              onBlur={(event) => handleBlur(event, note.id)}
              onClick={() => togglePinned(note.id)}
              className={`flex min-h-[2.25rem] w-full flex-col justify-center border-t border-hairline py-1 text-left focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${isActive ? 'border-ink/50' : ''}`}
            >
              <span className="flex items-baseline gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-muted">
                <span>A NOTE</span>
                <span aria-hidden="true">/</span>
                <span>{note.number}</span>
              </span>
              <span className={`font-display text-[12px] leading-tight uppercase tracking-[0.06em] sm:text-[13px] ${isActive ? 'font-semibold text-ink' : 'font-medium text-ink'}`}>
                {note.title}
              </span>
            </button>
          )
        })}
      </div>

      <div
        id={detailsId}
        aria-live="polite"
        aria-hidden={!activeNote}
        className="mt-1 h-[88px] border-t border-hairline pt-2 sm:h-[80px]"
      >
        <div className={`transition-opacity duration-200 ease-out motion-reduce:transition-none ${activeNote ? 'opacity-100' : 'opacity-0'}`}>
          {visibleNote?.liveValue && (
            <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-muted">
              {visibleNote.liveValue}
            </p>
          )}
          <p className="mt-1 font-sans text-xs leading-relaxed text-ink-secondary">
            {visibleNote?.body}
          </p>
        </div>
      </div>
    </aside>
  )
}
