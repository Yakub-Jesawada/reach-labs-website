import { collection, orderBy, query, onSnapshot } from 'firebase/firestore'
import { db } from './firebase-config.js'
import { mk, isHttpUrl } from './utils.js'

const CATEGORIES = [
  { key: 'book',       label: 'Books' },
  { key: 'preprint',   label: 'Selected Preprints' },
  { key: 'journal',    label: 'Journal Papers' },
  { key: 'conference', label: 'Conferences' },
  { key: 'chapter',    label: 'Book Chapters' },
]

function renderPublication(pub) {
  const entry = mk('div', 'pub-entry')

  const titleDiv = mk('div', 'pub-entry-title')
  if (isHttpUrl(pub.link)) {
    const link = mk('a')
    link.href = pub.link
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    link.textContent = pub.title
    titleDiv.appendChild(link)
  } else {
    titleDiv.textContent = pub.title
  }
  entry.appendChild(titleDiv)

  const meta = mk('p', 'pub-entry-meta')
  meta.textContent = pub.authors || ''
  if (pub.venue || pub.year) {
    const parts = [pub.venue, pub.year ? String(pub.year) : ''].filter(Boolean)
    meta.textContent += ' · ' + parts.join(' ')
  }
  entry.appendChild(meta)

  return entry
}

const container = document.getElementById('publications-list')
const q = query(collection(db, 'publications'), orderBy('order', 'asc'))

onSnapshot(q, (snapshot) => {
  container.textContent = ''

  if (snapshot.empty) {
    const empty = mk('p')
    empty.textContent = 'No publications yet.'
    empty.style.cssText = 'color:var(--gray-500);text-align:center;padding:2rem 0;'
    container.appendChild(empty)
    return
  }

  const grouped = {}
  snapshot.docs.forEach(d => {
    const pub = { id: d.id, ...d.data() }
    const cat = pub.category || 'journal'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(pub)
  })

  CATEGORIES.forEach(({ key, label }) => {
    const pubs = grouped[key]
    if (!pubs || pubs.length === 0) return

    const section = mk('div', 'pub-section')

    const heading = mk('h2', 'pub-section-title')
    heading.textContent = label
    section.appendChild(heading)

    const rule = mk('div', 'pub-section-rule')
    section.appendChild(rule)

    const list = mk('div', 'pub-list')
    pubs.forEach(p => list.appendChild(renderPublication(p)))
    section.appendChild(list)

    container.appendChild(section)
  })
}, (err) => {
  console.error('Firestore read error:', err)
  container.textContent = 'Could not load publications.'
})
