import { collection, orderBy, query, onSnapshot } from 'firebase/firestore'
import { db } from './firebase-config.js'
import { mk, isHttpUrl, videoEmbedUrl } from './utils.js'

function buildMediaCol(p) {
  const media = mk('div', 'project-media')
  const embedUrl = videoEmbedUrl(p.video?.type, p.video?.url)
  if (embedUrl) {
    const iframe = mk('iframe')
    iframe.src = embedUrl
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
    iframe.allowFullscreen = true
    media.appendChild(iframe)
  } else {
    const placeholder = mk('div', 'no-video')
    placeholder.textContent = 'Video coming soon'
    media.appendChild(placeholder)
  }
  return media
}

function buildContentCol(p) {
  const content = mk('div', 'project-content')

  if (p.tag) {
    const tag = mk('span', 'project-tag')
    tag.textContent = p.tag
    content.appendChild(tag)
  }

  const title = mk('h3', 'project-title')
  title.textContent = p.title
  content.appendChild(title)

  const desc = mk('p', 'project-desc')
  desc.textContent = p.desc
  content.appendChild(desc)

  if (p.contact?.name) {
    const contact = mk('p', 'project-contact')
    contact.append('Contact: ')
    if (isHttpUrl(p.contact.url)) {
      const link = mk('a')
      link.href = p.contact.url
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      link.textContent = p.contact.name
      contact.appendChild(link)
    } else {
      contact.append(p.contact.name)
    }
    content.appendChild(contact)
  }

  if (p.pubs?.length) {
    const pubsDiv = mk('div', 'project-pubs')
    const pubsTitle = mk('p', 'project-pubs-title')
    pubsTitle.textContent = 'Relevant Publications'
    pubsDiv.appendChild(pubsTitle)
    p.pubs.forEach(pub => {
      const item = mk('div', 'pub-item')
      item.textContent = pub.text
      if (isHttpUrl(pub.url)) {
        const link = mk('a', 'pub-link')
        link.href = pub.url
        link.target = '_blank'
        link.rel = 'noopener noreferrer'
        link.textContent = '[link]'
        item.appendChild(link)
      }
      pubsDiv.appendChild(item)
    })
    content.appendChild(pubsDiv)
  }

  return content
}

function renderProject(p) {
  const card = mk('div', 'project-card')
  card.id = 'project-' + String(p.id).replace(/[^a-zA-Z0-9_-]/g, '')
  const inner = mk('div', 'project-card-inner')
  inner.appendChild(buildContentCol(p))
  inner.appendChild(buildMediaCol(p))
  card.appendChild(inner)
  return card
}

const container = document.getElementById('projects-container')
const metaEl = document.getElementById('meta-projects')
const q = query(collection(db, 'projects'), orderBy('order', 'asc'))

onSnapshot(q, (snapshot) => {
  container.textContent = ''
  if (snapshot.empty) {
    const empty = mk('p')
    empty.textContent = 'No research projects yet.'
    empty.style.cssText = 'color:var(--gray-500);text-align:center;padding:2rem 0;'
    container.appendChild(empty)
    if (metaEl) metaEl.textContent = '0'
    return
  }
  const projects = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
  projects.forEach(p => container.appendChild(renderProject(p)))
  if (metaEl) metaEl.textContent = projects.length
}, (err) => {
  console.error('Firestore read error:', err)
  container.textContent = 'Could not load projects.'
})
