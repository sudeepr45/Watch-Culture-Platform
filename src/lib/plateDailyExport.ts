import { FAMILIES } from '../data/plates'
import { plateForDateKey } from './plateDaily'
import { drawPlate } from './plateEngine'
import { longDate } from './plate'

/** Save the curated plate for a local date in the established 1080 × 1440 layout. */
export async function saveCuratedPlateImage(dateKey: string): Promise<void> {
  const plateData = plateForDateKey(dateKey)
  const family = FAMILIES[plateData.family]
  const width = 1080
  const height = 1440
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) return

  context.fillStyle = '#FAF9F5'
  context.fillRect(0, 0, width, height)

  const artwork = document.createElement('canvas')
  artwork.width = artwork.height = 1000
  const artworkContext = artwork.getContext('2d')
  if (!artworkContext) return

  const styles = getComputedStyle(document.documentElement)
  const readColor = (token: string, fallback: string) => styles.getPropertyValue(token).trim() || fallback
  const ink = readColor('--color-ink', '#121212')
  const steel = readColor('--color-steel-dark', '#334155')
  const surface = readColor('--color-warm-surface', '#F3F1EA')
  drawPlate(artworkContext, 1000, plateData, { ink, steel, bg: surface })
  context.drawImage(artwork, 40, 60)

  context.strokeStyle = '#E7E5DF'
  context.lineWidth = 2
  context.beginPath()
  context.moveTo(60, 1124)
  context.lineTo(1020, 1124)
  context.stroke()

  const mono = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
  context.fillStyle = '#121212'
  context.font = `500 40px ${mono}`
  context.fillText(`MOJEAN · PLATE No. ${plateData.id}`, 60, 1190)
  context.fillStyle = '#57534E'
  context.font = `500 34px ${mono}`
  context.fillText(longDate(dateKey).toUpperCase(), 60, 1250)
  context.fillStyle = '#8C877E'
  context.font = `400 30px ${mono}`
  context.fillText(`${family?.label ?? plateData.family} · ${plateData.name}`, 60, 1310, 960)

  await new Promise<void>((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `mojean-plate-${dateKey}.png`
        document.body.appendChild(link)
        link.click()
        link.remove()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
      }
      resolve()
    })
  })
}
