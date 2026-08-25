/** Best-effort mobile detection so we can open the Next deep link directly. */
export function isLikelyMobileDevice(): boolean {
  if (typeof navigator === 'undefined') {
    return false
  }

  const ua = navigator.userAgent
  if (/Android|iPhone|iPod|Mobile/i.test(ua)) {
    return true
  }

  // iPadOS often reports as Macintosh but remains touch-first.
  if (navigator.maxTouchPoints > 1 && /Macintosh|iPad/i.test(ua)) {
    return true
  }

  return false
}
