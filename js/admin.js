import {
  collection, orderBy, query, onSnapshot,
  addDoc, deleteDoc, doc, serverTimestamp
} from 'firebase/firestore'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'
import { db, auth } from './firebase-config.js'
import { mk } from './utils.js'

// ── State ─────────────────────────────────────────────────────────────────────
let currentTab = 'news'
let unsubNews = null, unsubResearch = null, unsubTeam = null, unsubPublications = null
let currentNews = [], currentProjects = [], currentTeam = [], currentPublications = []
let pubCount = 0

const MODAL_TITLES = {
  news: 'Add News Item',
  research: 'Add Research Project',
  team: 'Add Team Member',
  publications: 'Add Publication'
}

// ── Tab switching ─────────────────────────────────────────────────────────────
window.switchTab = function(tab) {
  currentTab = tab
  ;['news', 'research', 'team', 'publications'].forEach(t => {
    document.getElementById('tab-' + t).classList.toggle('tab-panel-active', t === tab)
    document.getElementById('tab-btn-' + t).classList.toggle('tab-active', t === tab)
  })
}

// ── Render helpers ────────────────────────────────────────────────────────────
function renderAdminList(containerId, items, subtitleFn, deleteFn) {
  const container = document.getElementById(containerId)
  container.textContent = ''
  if (!items.length) {
    const empty = mk('p')
    empty.textContent = 'No items yet.'
    empty.style.cssText = 'color:var(--gray-500);padding:1rem 0;font-size:14px;'
    container.appendChild(empty)
    return
  }
  items.forEach(item => {
    const row = mk('div', 'admin-item-row')
    const info = mk('div', 'admin-item-info')
    const titleEl = mk('div', 'admin-item-title')
    titleEl.textContent = item.title || item.name || '(untitled)'
    info.appendChild(titleEl)
    const sub = subtitleFn(item)
    if (sub) {
      const subEl = mk('div', 'admin-item-subtitle')
      subEl.textContent = sub
      info.appendChild(subEl)
    }
    const deleteBtn = mk('button', 'btn-admin-delete')
    deleteBtn.textContent = '✕ Remove'
    deleteBtn.addEventListener('click', () => deleteFn(item.id))
    row.appendChild(info)
    row.appendChild(deleteBtn)
    container.appendChild(row)
  })
}

// ── News ──────────────────────────────────────────────────────────────────────
function subscribeNews() {
  const q = query(collection(db, 'news'), orderBy('order', 'asc'))
  return onSnapshot(q, snapshot => {
    currentNews = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
    renderAdminList('news-list', currentNews,
      item => item.desc ? item.desc.slice(0, 80) + (item.desc.length > 80 ? '…' : '') : '',
      deleteNews
    )
  }, err => console.error('news read error:', err))
}

async function deleteNews(id) {
  if (!confirm('Remove this news item?')) return
  try { await deleteDoc(doc(db, 'news', id)) }
  catch (err) { console.error(err); alert('Failed to delete — check your connection.') }
}

window.submitNews = async function() {
  const title = document.getElementById('fn-title').value.trim()
  const desc  = document.getElementById('fn-desc').value.trim()
  if (!title || !desc) { alert('Please fill in the title and description.'); return }
  const btn = document.getElementById('fn-submit')
  btn.textContent = 'Saving…'; btn.disabled = true
  try {
    await addDoc(collection(db, 'news'), {
      title, desc,
      link:      document.getElementById('fn-link').value.trim(),
      order:     currentNews.length,
      createdAt: serverTimestamp()
    })
    closeModal()
  } catch (err) {
    console.error(err); alert('Failed to save — check your connection.')
  } finally { btn.textContent = 'Add News →'; btn.disabled = false }
}

// ── Research ──────────────────────────────────────────────────────────────────
function subscribeResearch() {
  const q = query(collection(db, 'projects'), orderBy('order', 'asc'))
  return onSnapshot(q, snapshot => {
    currentProjects = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
    renderAdminList('research-list', currentProjects,
      item => item.tag || '',
      deleteProject
    )
  }, err => console.error('projects read error:', err))
}

async function deleteProject(id) {
  if (!confirm('Remove this project?')) return
  try { await deleteDoc(doc(db, 'projects', id)) }
  catch (err) { console.error(err); alert('Failed to delete — check your connection.') }
}

window.addPubRow = function(existingText, existingUrl) {
  pubCount++
  const row = mk('div', 'pub-row')
  row.id = 'pub-' + pubCount
  const inputsDiv = mk('div')
  const textInput = mk('input')
  textInput.type = 'text'; textInput.placeholder = 'Author(s). Title. Venue Year.'
  textInput.value = existingText || ''; textInput.style.marginBottom = '4px'
  inputsDiv.appendChild(textInput)
  const urlInput = mk('input')
  urlInput.type = 'text'; urlInput.placeholder = 'PDF / DOI URL (optional)'
  urlInput.value = existingUrl || ''
  inputsDiv.appendChild(urlInput)
  row.appendChild(inputsDiv)
  const removeBtn = mk('button', 'btn-remove-pub')
  removeBtn.textContent = '✕'
  removeBtn.addEventListener('click', () => row.remove())
  row.appendChild(removeBtn)
  document.getElementById('pubs-list').appendChild(row)
}

function getPubs() {
  return Array.from(document.querySelectorAll('#pubs-list .pub-row')).reduce((acc, row) => {
    const [t, u] = row.querySelectorAll('input')
    if (t.value.trim()) acc.push({ text: t.value.trim(), url: u.value.trim() })
    return acc
  }, [])
}

window.submitProject = async function() {
  const title = document.getElementById('f-title').value.trim()
  const desc  = document.getElementById('f-desc').value.trim()
  if (!title || !desc) { alert('Please fill in the project title and description.'); return }
  const btn = document.getElementById('fr-submit')
  btn.textContent = 'Saving…'; btn.disabled = true
  try {
    await addDoc(collection(db, 'projects'), {
      title, desc,
      tag:     document.getElementById('f-tag').value.trim(),
      contact: { name: document.getElementById('f-contact-name').value.trim(), url: document.getElementById('f-contact-url').value.trim() },
      video:   { type: document.getElementById('f-video-type').value, url: document.getElementById('f-video-url').value.trim() },
      pubs:      getPubs(),
      order:     currentProjects.length,
      createdAt: serverTimestamp()
    })
    closeModal()
  } catch (err) {
    console.error(err); alert('Failed to save — check your connection.')
  } finally { btn.textContent = 'Add Project →'; btn.disabled = false }
}

// ── Team ──────────────────────────────────────────────────────────────────────
function subscribeTeam() {
  const q = query(collection(db, 'team'), orderBy('order', 'asc'))
  return onSnapshot(q, snapshot => {
    currentTeam = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
    renderAdminList('team-list', currentTeam,
      item => item.role || '',
      deleteTeamMember
    )
  }, err => console.error('team read error:', err))
}

async function deleteTeamMember(id) {
  if (!confirm('Remove this team member?')) return
  try { await deleteDoc(doc(db, 'team', id)) }
  catch (err) { console.error(err); alert('Failed to delete — check your connection.') }
}

window.submitTeamMember = async function() {
  const name = document.getElementById('ft-name').value.trim()
  const role = document.getElementById('ft-role').value.trim()
  if (!name || !role) { alert('Please fill in the name and role.'); return }
  const btn = document.getElementById('ft-submit')
  btn.textContent = 'Saving…'; btn.disabled = true
  try {
    await addDoc(collection(db, 'team'), {
      name, role,
      photo:     document.getElementById('ft-photo').value.trim(),
      bio:       document.getElementById('ft-bio').value.trim(),
      order:     currentTeam.length,
      createdAt: serverTimestamp()
    })
    closeModal()
  } catch (err) {
    console.error(err); alert('Failed to save — check your connection.')
  } finally { btn.textContent = 'Add Member →'; btn.disabled = false }
}

// ── Publications ──────────────────────────────────────────────────────────────
function subscribePublications() {
  const q = query(collection(db, 'publications'), orderBy('order', 'asc'))
  return onSnapshot(q, snapshot => {
    currentPublications = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
    renderAdminList('publications-list', currentPublications,
      item => [item.authors, item.year ? String(item.year) : ''].filter(Boolean).join(' · '),
      deletePublication
    )
  }, err => console.error('publications read error:', err))
}

async function deletePublication(id) {
  if (!confirm('Remove this publication?')) return
  try { await deleteDoc(doc(db, 'publications', id)) }
  catch (err) { console.error(err); alert('Failed to delete — check your connection.') }
}

window.submitPublication = async function() {
  const title   = document.getElementById('fp-title').value.trim()
  const authors = document.getElementById('fp-authors').value.trim()
  if (!title || !authors) { alert('Please fill in the title and authors.'); return }
  const btn = document.getElementById('fp-submit')
  btn.textContent = 'Saving…'; btn.disabled = true
  const yearVal = document.getElementById('fp-year').value.trim()
  try {
    await addDoc(collection(db, 'publications'), {
      title, authors,
      venue:     document.getElementById('fp-venue').value.trim(),
      year:      yearVal ? parseInt(yearVal, 10) : null,
      link:      document.getElementById('fp-link').value.trim(),
      order:     currentPublications.length,
      createdAt: serverTimestamp()
    })
    closeModal()
  } catch (err) {
    console.error(err); alert('Failed to save — check your connection.')
  } finally { btn.textContent = 'Add Publication →'; btn.disabled = false }
}

// ── Modal ─────────────────────────────────────────────────────────────────────
window.openModal = function() {
  document.getElementById('modal-title').textContent = MODAL_TITLES[currentTab]
  ;['news', 'research', 'team', 'publications'].forEach(t => {
    document.getElementById('modal-form-' + t).style.display = t === currentTab ? 'block' : 'none'
  })
  clearModalForm(currentTab)
  document.getElementById('modal-backdrop').classList.add('open')
}

function clearModalForm(tab) {
  if (tab === 'news') {
    ;['fn-title', 'fn-desc', 'fn-link'].forEach(id => { document.getElementById(id).value = '' })
  } else if (tab === 'research') {
    ;['f-title', 'f-tag', 'f-desc', 'f-contact-name', 'f-contact-url', 'f-video-url'].forEach(id => { document.getElementById(id).value = '' })
    document.getElementById('f-video-type').value = 'youtube'
    document.getElementById('pubs-list').textContent = ''
    pubCount = 0
  } else if (tab === 'team') {
    ;['ft-name', 'ft-role', 'ft-photo', 'ft-bio'].forEach(id => { document.getElementById(id).value = '' })
  } else if (tab === 'publications') {
    ;['fp-title', 'fp-authors', 'fp-venue', 'fp-year', 'fp-link'].forEach(id => { document.getElementById(id).value = '' })
  }
}

window.closeModal = function() {
  document.getElementById('modal-backdrop').classList.remove('open')
}

window.handleBackdropClick = function(e) {
  if (e.target === document.getElementById('modal-backdrop')) closeModal()
}

// ── Auth ──────────────────────────────────────────────────────────────────────
window.handleLogin = async function() {
  const email    = document.getElementById('login-email').value.trim()
  const password = document.getElementById('login-password').value
  const errEl    = document.getElementById('login-error')
  const btn      = document.getElementById('login-btn')
  if (!email || !password) { errEl.textContent = 'Please enter your email and password.'; return }
  btn.textContent = 'Signing in…'; btn.disabled = true; errEl.textContent = ''
  try {
    await signInWithEmailAndPassword(auth, email, password)
  } catch {
    errEl.textContent = 'Invalid email or password.'
    btn.textContent = 'Sign In'; btn.disabled = false
  }
}

window.handleLogout = async function() {
  await signOut(auth).catch(console.error)
}

onAuthStateChanged(auth, user => {
  if (user) {
    document.getElementById('login-card').style.display = 'none'
    document.getElementById('admin-nav-controls').style.display = 'flex'
    document.getElementById('admin-user-email').textContent = user.email
    unsubNews         = subscribeNews()
    unsubResearch     = subscribeResearch()
    unsubTeam         = subscribeTeam()
    unsubPublications = subscribePublications()
  } else {
    document.getElementById('login-card').style.display = 'flex'
    document.getElementById('admin-nav-controls').style.display = 'none'
    document.getElementById('login-email').focus()
    ;[unsubNews, unsubResearch, unsubTeam, unsubPublications].forEach(u => u?.())
    unsubNews = unsubResearch = unsubTeam = unsubPublications = null
  }
})

;['login-email', 'login-password'].forEach(id => {
  document.getElementById(id)?.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleLogin()
  })
})
