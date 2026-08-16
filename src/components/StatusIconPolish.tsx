import { useEffect } from 'react'

const icons: Record<string, string> = {
  Visto: '✓',
  Viendo: '▶',
  Pendiente: '♡',
  Pausado: 'Ⅱ',
  Abandonado: '×',
}

export function StatusIconPolish() {
  useEffect(() => {
    const apply = () => {
      document.querySelectorAll<HTMLElement>('.media-card .cover em').forEach((badge) => {
        const label = badge.textContent?.trim() ?? ''
        const icon = icons[label]
        if (!icon) return
        badge.dataset.statusLabel = label
        badge.dataset.statusIcon = icon
        badge.setAttribute('aria-label', label)
      })
    }
    apply()
    const observer = new MutationObserver(apply)
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })
    return () => observer.disconnect()
  }, [])
  return null
}
