import { collection, orderBy, query, onSnapshot } from 'firebase/firestore'
import { db } from './firebase-config.js'
import { mk, isHttpUrl } from './utils.js'

function getInitials(name) {
  return String(name).split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')
}

function renderTeamMember(member) {
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

  const name = mk('div', 'team-name')
  name.textContent = member.name
  card.appendChild(name)

  const role = mk('div', 'team-role')
  role.textContent = member.role
  card.appendChild(role)

  if (member.bio) {
    const bio = mk('p', 'team-bio')
    bio.textContent = member.bio
    card.appendChild(bio)
  }

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
  snapshot.docs.forEach(d => {
    container.appendChild(renderTeamMember({ id: d.id, ...d.data() }))
  })
}, (err) => {
  console.error('Firestore read error:', err)
  container.textContent = 'Could not load team.'
})
