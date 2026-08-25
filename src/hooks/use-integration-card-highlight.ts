import { useEffect } from 'react'
import { isIntegrationCardId } from '#/lib/integrations/connect-anchors'

const FLASH_CLASS = 'integration-card-flash'
const FLASH_MS = 1400

/**
 * Scrolls to `#integration-*` (also handled by the router) and briefly
 * flashes the target card so deep links from the dashboard feel intentional.
 */
export function useIntegrationCardHighlight() {
  useEffect(() => {
    let flashTimeoutId: number | undefined

    const highlightFromHash = () => {
      const id = window.location.hash.replace(/^#/, '')
      if (!isIntegrationCardId(id)) {
        return
      }

      const el = document.getElementById(id)
      if (!el) {
        return
      }

      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      el.classList.remove(FLASH_CLASS)
      // Restart animation when navigating between cards on the same page.
      void el.offsetWidth
      el.classList.add(FLASH_CLASS)

      window.clearTimeout(flashTimeoutId)
      flashTimeoutId = window.setTimeout(() => {
        el.classList.remove(FLASH_CLASS)
      }, FLASH_MS)
    }

    // Cards mount with ConnectPage; give the browser a frame to paint.
    const startId = window.requestAnimationFrame(() => {
      highlightFromHash()
    })

    window.addEventListener('hashchange', highlightFromHash)

    return () => {
      window.cancelAnimationFrame(startId)
      window.clearTimeout(flashTimeoutId)
      window.removeEventListener('hashchange', highlightFromHash)
    }
  }, [])
}
