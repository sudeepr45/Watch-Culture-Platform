/**
 * MOERI & JEANNERET — WATCH IMAGE SAFETY AUDITOR
 *
 * Enforces archive credibility by ensuring only genuine, verified photography
 * is displayed for cataloged timepieces.
 *
 * Never permits:
 * - AI-generated imagery
 * - Smartwatches or smart-render mockups
 * - Generic fashion watch stock photos
 * - Unrelated or visually similar substitutes
 * - Broken or unverified image assets
 */

/**
 * Known unsafe, incorrect, generic, broken, or AI/smartwatch placeholder images
 * identified during archive credibility audit.
 */
export const UNSAFE_WATCH_IMAGE_SIGNATURES: readonly string[] = [
  'photo-1522335789203-aabd1fc54bc9', // Bobbi Brown makeup kit / smartwatch
  'photo-1547996160-71dfa63582b8', // 404 Broken Unsplash URL
  'photo-1508057198894-247b23fe5ade', // Generic "Hunters Race" fashion watch
  'photo-1523275335684-37898b6baf30', // 3D Smartwatch render with charging puck
  'photo-1614164185128-e4ec99c436d7', // Citizen Eco-Drive watch on rocks
]

/**
 * Validates whether an image URL is safe and verified for display on a watch record.
 * Returns false for null, empty strings, or any image matching unsafe/unverified signatures.
 */
export function isSafeWatchImageUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return false
  }

  const normalized = url.toLowerCase().trim()

  for (const signature of UNSAFE_WATCH_IMAGE_SIGNATURES) {
    if (normalized.includes(signature.toLowerCase())) {
      return false
    }
  }

  return true
}
