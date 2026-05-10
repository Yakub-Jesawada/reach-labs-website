export const isHttpUrl = u => typeof u === 'string' && /^https?:\/\//i.test(u)

export function mk(tag, className) {
  const el = document.createElement(tag)
  if (className) el.className = className
  return el
}

export function videoEmbedUrl(type, url) {
  if (!url || type === 'none') return null
  if (type === 'youtube') {
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/)
    if (m) return 'https://www.youtube.com/embed/' + m[1]
    if (url.includes('youtube.com/embed')) return url
  }
  if (type === 'vimeo') {
    const m = url.match(/vimeo\.com\/(\d+)/)
    if (m) return 'https://player.vimeo.com/video/' + m[1]
    if (url.includes('player.vimeo.com')) return url
  }
  if (type === 'direct' && isHttpUrl(url)) return url
  return null
}

export function initMobileNav() {
  const nav = document.querySelector('nav')
  const btn = document.querySelector('.nav-hamburger')
  if (!btn || !nav) return

  btn.addEventListener('click', () => nav.classList.toggle('nav-open'))

  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => nav.classList.remove('nav-open'))
  })

  document.addEventListener('click', e => {
    if (!nav.contains(e.target)) nav.classList.remove('nav-open')
  })
}
