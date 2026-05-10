import { collection, orderBy, query, onSnapshot } from 'firebase/firestore'
import { db } from './firebase-config.js'
import { mk, isHttpUrl } from './utils.js'

const CATEGORIES = [
  { key: 'pi',      label: 'Principal Investigator' },
  { key: 'postdoc', label: 'Postdoctoral Researchers' },
  { key: 'phd',     label: 'PhD Candidates' },
  { key: 'student', label: 'Student Members' },
  { key: 'staff',   label: 'Research Staff' },
]

function getInitials(name) {
  return String(name).split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')
}

function renderMember(member) {
  const card = mk('div', 'team-card')

  const photoDiv = mk('div', 'team-photo')
  if (isHttpUrl(member.photo)) {
    const img = mk('img')
    img.src = member.photo
    img.alt = member.name
    photoDiv.appendChild(img)
  } else {
    const initials = mk('span', 'team-photo-initials')
    initials.textContent = getInitials(member.name)
    photoDiv.appendChild(initials)
  }
  card.appendChild(photoDiv)

  const info = mk('div', 'team-info')

  const name = mk('div', 'team-name')
  name.textContent = member.name
  info.appendChild(name)

  if (member.role) {
    const role = mk('div', 'team-role')
    role.textContent = member.role
    info.appendChild(role)
  }

  if (member.bio) {
    const bio = mk('p', 'team-bio')
    bio.textContent = member.bio
    info.appendChild(bio)
  }

  card.appendChild(info)
  return card
}

const container = document.getElementById('team-container')
const q = query(collection(db, 'team'), orderBy('order', 'asc'))

onSnapshot(q, (snapshot) => {
  container.textContent = ''

  if (snapshot.empty) {
    const empty = mk('p')
    empty.textContent = 'No team members yet.'
    empty.style.cssText = 'color:var(--gray-500);text-align:center;padding:2rem 0;'
    container.appendChild(empty)
    return
  }

  const grouped = {}
  snapshot.docs.forEach(d => {
    const m = { id: d.id, ...d.data() }
    const cat = m.category || 'student'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(m)
  })

  CATEGORIES.forEach(({ key, label }) => {
    const members = grouped[key]
    if (!members || members.length === 0) return

    const section = mk('div', 'team-section')

    const heading = mk('h2', 'team-section-title')
    heading.textContent = label
    section.appendChild(heading)

    const rule = mk('div', 'team-section-rule')
    section.appendChild(rule)

    members.forEach(m => section.appendChild(renderMember(m)))
    container.appendChild(section)
  })
}, (err) => {
  console.error('Firestore read error:', err)
  container.textContent = 'Could not load team.'
})
