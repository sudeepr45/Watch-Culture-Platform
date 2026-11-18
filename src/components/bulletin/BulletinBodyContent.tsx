import { Fragment, createElement, type ReactNode } from 'react'
import { decodeRichBulletinBody } from '../../services/bulletinRichText'

function renderSafeNode(node: Node, key: string): ReactNode {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent
  if (!(node instanceof Element)) return null

  const children = Array.from(node.childNodes, (child, index) => renderSafeNode(child, `${key}.${index}`))
  const tag = node.tagName.toLowerCase()
  if (tag === 'br') return createElement('br', { key })
  if (tag === 'strong' || tag === 'b') return createElement('strong', { key }, children)
  if (tag === 'em' || tag === 'i') return createElement('em', { key }, children)
  if (tag === 'p' || tag === 'div') return createElement('p', { key, className: 'whitespace-pre-wrap' }, children)
  if (tag === 'span') {
    const font = node.getAttribute('data-font')
    if (font) return createElement('span', { key, style: { fontFamily: font } }, children)
  }
  return createElement(Fragment, { key }, children)
}

function renderRichHtml(html: string): ReactNode[] {
  const parsed = new DOMParser().parseFromString(html, 'text/html')
  return Array.from(parsed.body.childNodes, (node, index) => renderSafeNode(node, `rich-${index}`))
}

function renderPlainBody(body: string): ReactNode[] {
  return body.split(/\r?\n(?:[\t ]*\r?\n)+/)
    .filter((paragraph) => paragraph.trim().length > 0)
    .map((paragraph, index) => (
      <p key={`plain-${index}`} className="whitespace-pre-line">{paragraph}</p>
    ))
}

export default function BulletinBodyContent({ body, eachPlainLineIsParagraph = false }: { body: string; eachPlainLineIsParagraph?: boolean }) {
  const richHtml = decodeRichBulletinBody(body)
  if (richHtml !== null) return <>{renderRichHtml(richHtml)}</>
  if (eachPlainLineIsParagraph) {
    return <>{body.split(/\r?\n+/).filter((paragraph) => paragraph.trim()).map((paragraph, index) => (
      <p key={`plain-${index}`} className="whitespace-pre-line">{paragraph}</p>
    ))}</>
  }
  return <>{renderPlainBody(body)}</>
}
