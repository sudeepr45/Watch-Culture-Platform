export const BULLETIN_RICH_TEXT_PREFIX = 'MOJEAN_RICH_TEXT_V1\n'

export const BULLETIN_FONT_FAMILIES = [
  'Georgia',
  'Times New Roman',
  'Arial',
  'Verdana',
  'Trebuchet MS',
  'Courier New',
] as const

export type BulletinFontFamily = (typeof BULLETIN_FONT_FAMILIES)[number]

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] ?? character)
}

function allowedFont(value: string | null | undefined): BulletinFontFamily | null {
  const normalized = (value ?? '').replace(/["']/g, '').split(',')[0].trim().toLowerCase()
  return BULLETIN_FONT_FAMILIES.find((font) => font.toLowerCase() === normalized) ?? null
}

function sanitizeNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return escapeHtml(node.textContent ?? '')
  if (!(node instanceof Element)) return ''

  const children = Array.from(node.childNodes, sanitizeNode).join('')
  const tag = node.tagName.toLowerCase()
  if (tag === 'br') return '<br>'
  if (tag === 'strong' || tag === 'b') return `<strong>${children}</strong>`
  if (tag === 'em' || tag === 'i') return `<em>${children}</em>`
  if (tag === 'span' || tag === 'font') {
    const font = allowedFont(tag === 'font' ? node.getAttribute('face') : node.getAttribute('data-font') ?? (node as HTMLElement).style.fontFamily)
    return font ? `<span data-font="${font}">${children}</span>` : children
  }
  if (tag === 'p' || tag === 'div') return `<p>${children || '<br>'}</p>`
  return children
}

/** Returns only paragraphs, line breaks, bold, italic, and the six supported fonts. */
export function sanitizeBulletinRichHtml(html: string): string {
  if (typeof DOMParser === 'undefined') return ''
  const parsed = new DOMParser().parseFromString(html, 'text/html')
  return Array.from(parsed.body.childNodes, sanitizeNode).join('')
}

export function isRichBulletinBody(body: string): boolean {
  return body.startsWith(BULLETIN_RICH_TEXT_PREFIX)
}

export function decodeRichBulletinBody(body: string): string | null {
  if (!isRichBulletinBody(body)) return null
  return sanitizeBulletinRichHtml(body.slice(BULLETIN_RICH_TEXT_PREFIX.length))
}

function plainTextToHtml(body: string, eachLineIsParagraph = false): string {
  const paragraphs = eachLineIsParagraph
    ? body.split(/\r?\n+/)
    : body.split(/\r?\n(?:[\t ]*\r?\n)+/)
  return paragraphs
    .filter((paragraph) => paragraph.trim().length > 0)
    .map((paragraph) => `<p>${paragraph.split(/\r?\n/).map(escapeHtml).join('<br>')}</p>`)
    .join('')
}

export function bulletinBodyEditorHtml(body: string, eachPlainLineIsParagraph = false): string {
  const richHtml = decodeRichBulletinBody(body)
  return richHtml ?? plainTextToHtml(body, eachPlainLineIsParagraph)
}

/** Plain legacy records remain unchanged; rich documents are sanitized on every save. */
export function prepareBulletinBodyForSave(body: string): string {
  if (!isRichBulletinBody(body)) return body
  const html = sanitizeBulletinRichHtml(body.slice(BULLETIN_RICH_TEXT_PREFIX.length))
  return `${BULLETIN_RICH_TEXT_PREFIX}${html}`
}

export function bulletinBodyHasText(body: string): boolean {
  if (!isRichBulletinBody(body)) return body.trim().length > 0
  const html = decodeRichBulletinBody(body) ?? ''
  if (typeof DOMParser === 'undefined') return false
  return new DOMParser().parseFromString(html, 'text/html').body.textContent?.trim().length !== 0
}

export function bulletinBodyPlainText(body: string): string {
  const richHtml = decodeRichBulletinBody(body)
  if (richHtml === null) return body
  if (typeof DOMParser === 'undefined') return ''
  const parsed = new DOMParser().parseFromString(richHtml, 'text/html')
  const collectText = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? ''
    if (!(node instanceof Element)) return ''
    if (node.tagName.toLowerCase() === 'br') return '\n'
    const content = Array.from(node.childNodes, collectText).join('')
    return node.tagName.toLowerCase() === 'p' ? `${content}\n` : content
  }
  return Array.from(parsed.body.childNodes, collectText).join('').trim()
}

export function encodeBulletinRichHtml(html: string): string {
  return `${BULLETIN_RICH_TEXT_PREFIX}${sanitizeBulletinRichHtml(html)}`
}

export function normalizeBulletinFont(value: string): BulletinFontFamily | '' {
  return allowedFont(value) ?? ''
}
