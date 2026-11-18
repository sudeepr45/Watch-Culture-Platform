import { useEffect, useRef, useState, type ClipboardEvent } from 'react'
import {
  BULLETIN_FONT_FAMILIES,
  bulletinBodyEditorHtml,
  encodeBulletinRichHtml,
  normalizeBulletinFont,
} from '../../services/bulletinRichText'

interface BulletinRichTextEditorProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  invalid?: boolean
  describedBy?: string
}

export default function BulletinRichTextEditor({ value, onChange, onBlur, invalid, describedBy }: BulletinRichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const savedRangeRef = useRef<Range | null>(null)
  const lastEmittedValueRef = useRef<string | null>(null)
  const [boldActive, setBoldActive] = useState(false)
  const [italicActive, setItalicActive] = useState(false)
  const [fontActive, setFontActive] = useState('')

  useEffect(() => {
    if (!editorRef.current || value === lastEmittedValueRef.current) return
    editorRef.current.innerHTML = bulletinBodyEditorHtml(value)
    lastEmittedValueRef.current = value
  }, [value])

  const captureSelection = () => {
    const editor = editorRef.current
    const selection = window.getSelection()
    if (!editor || !selection?.rangeCount) return
    const range = selection.getRangeAt(0)
    if (editor.contains(range.commonAncestorContainer)) savedRangeRef.current = range.cloneRange()
  }

  const refreshActiveState = () => {
    captureSelection()
    setBoldActive(document.queryCommandState('bold'))
    setItalicActive(document.queryCommandState('italic'))
    setFontActive(normalizeBulletinFont(document.queryCommandValue('fontName')))
  }

  const restoreSelection = () => {
    const editor = editorRef.current
    const selection = window.getSelection()
    if (!editor || !selection || !savedRangeRef.current) return
    editor.focus()
    selection.removeAllRanges()
    selection.addRange(savedRangeRef.current)
  }

  const publishValue = () => {
    if (!editorRef.current) return
    const next = encodeBulletinRichHtml(editorRef.current.innerHTML)
    lastEmittedValueRef.current = next
    onChange(next)
    refreshActiveState()
  }

  const applyCommand = (command: 'bold' | 'italic' | 'fontName', value?: string) => {
    restoreSelection()
    document.execCommand(command, false, value)
    publishValue()
  }

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault()
    const text = event.clipboardData.getData('text/plain')
    restoreSelection()
    document.execCommand('insertText', false, text)
    publishValue()
  }

  const handleKeyUp = () => refreshActiveState()

  return (
    <div className="border border-hairline bg-warm-white focus-within:border-ink">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-hairline bg-warm-surface/30 p-2" role="toolbar" aria-label="Bulletin text formatting">
        <label className="sr-only" htmlFor="bulletin-font-family">Font family</label>
        <select
          id="bulletin-font-family"
          value={fontActive}
          onMouseDown={captureSelection}
          onFocus={captureSelection}
          onChange={(event) => applyCommand('fontName', event.target.value)}
          className="min-w-0 max-w-[12rem] border border-hairline bg-warm-white px-2 py-1.5 text-xs text-ink focus:border-ink focus:outline-none"
          aria-label="Font family"
        >
          <option value="">Font family</option>
          {BULLETIN_FONT_FAMILIES.map((font) => <option key={font} value={font}>{font}</option>)}
        </select>
        <span className="mx-1 h-5 border-l border-hairline" aria-hidden="true" />
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => applyCommand('bold')}
          aria-label="Bold"
          aria-pressed={boldActive}
          className={`h-8 min-w-8 border px-2 font-serif font-bold text-ink transition-colors ${boldActive ? 'border-ink bg-ink text-warm-white' : 'border-hairline bg-warm-white hover:border-ink'}`}
        >B</button>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => applyCommand('italic')}
          aria-label="Italic"
          aria-pressed={italicActive}
          className={`h-8 min-w-8 border px-2 font-serif italic text-ink transition-colors ${italicActive ? 'border-ink bg-ink text-warm-white' : 'border-hairline bg-warm-white hover:border-ink'}`}
        >I</button>
        <span className="ml-auto text-[9px] font-mono uppercase tracking-[0.12em] text-ink-muted">Select text, then format</span>
      </div>
      <div
        ref={editorRef}
        id="bulletin-body"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label="Bulletin article body"
        aria-multiline="true"
        aria-invalid={invalid}
        aria-describedby={describedBy}
        onInput={publishValue}
        onKeyUp={handleKeyUp}
        onMouseUp={refreshActiveState}
        onKeyDown={(event) => {
          if (event.key === 'Enter') window.setTimeout(refreshActiveState, 0)
        }}
        onPaste={handlePaste}
        onBlur={() => { captureSelection(); onBlur?.() }}
        className="min-h-72 w-full resize-y overflow-y-auto px-3 py-3 font-sans text-base leading-relaxed text-ink-secondary outline-none [&_p]:mb-4 [&_p:last-child]:mb-0 [&_strong]:font-bold [&_em]:italic"
      />
    </div>
  )
}
