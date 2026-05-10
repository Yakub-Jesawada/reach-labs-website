import {
  collection, orderBy, query, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp
} from 'firebase/firestore'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'
import { db, auth } from './firebase-config.js'
import { mk } from './utils.js'

// ── State ─────────────────────────────────────────────────────────────────────
let currentTab = 'news'
let unsubNews = null, unsubResearch = null, unsubTeam = null, unsubPublications = null
let currentNews = [], currentProjects = [], currentTeam = [], currentPublications = []
let pubCount = 0
let editingId = null

const MODAL_TITLES = {
  news:         { add: 'Add News Item',       edit: 'Edit News Item' },
  research:     { add: 'Add Research Project', edit: 'Edit Research Project' },
  team:         { add: 'Add Team Member',      edit: 'Edit Team Member' },
  publications: { add: 'Add Publication',      edit: 'Edit Publication' },
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
function renderAdminList(containerId, items, subtitleFn, editFn, deleteFn) {
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
    const actions = mk('div')
    actions.style.cssText = 'display:flex;flex-shrink:0;'
    const editBtn = mk('button', 'btn-admin-edit')
    editBtn.textContent = '✎ Edit'
    editBtn.addEventListener('click', () => editFn(item))
    const deleteBtn = mk('button', 'btn-admin-delete')
    deleteBtn.textContent = '✕ Remove'
    deleteBtn.addEventListener('click', () => deleteFn(item.id))
    actions.appendChild(editBtn)
    actions.appendChild(deleteBtn)
    row.appendChild(info)
    row.appendChild(actions)
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
      item => openEditModal('news', item),
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
  const data = {
    title, desc,
    link: document.getElementById('fn-link').value.trim(),
  }
  try {
    if (editingId) {
      await updateDoc(doc(db, 'news', editingId), data)
    } else {
      await addDoc(collection(db, 'news'), { ...data, order: currentNews.length, createdAt: serverTimestamp() })
    }
    closeModal()
  } catch (err) {
    console.error(err); alert('Failed to save — check your connection.')
  } finally { btn.textContent = editingId ? 'Save Changes →' : 'Add News →'; btn.disabled = false }
}

// ── Research ──────────────────────────────────────────────────────────────────
function subscribeResearch() {
  const q = query(collection(db, 'projects'), orderBy('order', 'asc'))
  return onSnapshot(q, snapshot => {
    currentProjects = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
    renderAdminList('research-list', currentProjects,
      item => item.tag || '',
      item => openEditModal('research', item),
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
  const data = {
    title, desc,
    tag:     document.getElementById('f-tag').value.trim(),
    contact: { name: document.getElementById('f-contact-name').value.trim(), url: document.getElementById('f-contact-url').value.trim() },
    video:   { type: document.getElementById('f-video-type').value, url: document.getElementById('f-video-url').value.trim() },
    pubs:    getPubs(),
  }
  try {
    if (editingId) {
      await updateDoc(doc(db, 'projects', editingId), data)
    } else {
      await addDoc(collection(db, 'projects'), { ...data, order: currentProjects.length, createdAt: serverTimestamp() })
    }
    closeModal()
  } catch (err) {
    console.error(err); alert('Failed to save — check your connection.')
  } finally { btn.textContent = editingId ? 'Save Changes →' : 'Add Project →'; btn.disabled = false }
}

// ── Team ──────────────────────────────────────────────────────────────────────
function subscribeTeam() {
  const q = query(collection(db, 'team'), orderBy('order', 'asc'))
  return onSnapshot(q, snapshot => {
    currentTeam = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
    renderAdminList('team-list', currentTeam,
      item => [item.category, item.role].filter(Boolean).join(' · '),
      item => openEditModal('team', item),
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
  const name     = document.getElementById('ft-name').value.trim()
  const category = document.getElementById('ft-category').value
  if (!name) { alert('Please fill in the name.'); return }
  const btn = document.getElementById('ft-submit')
  btn.textContent = 'Saving…'; btn.disabled = true
  const data = {
    name, category,
    role:  document.getElementById('ft-role').value.trim(),
    photo: document.getElementById('ft-photo').value.trim(),
    bio:   document.getElementById('ft-bio').value.trim(),
  }
  try {
    if (editingId) {
      await updateDoc(doc(db, 'team', editingId), data)
    } else {
      await addDoc(collection(db, 'team'), { ...data, order: currentTeam.length, createdAt: serverTimestamp() })
    }
    closeModal()
  } catch (err) {
    console.error(err); alert('Failed to save — check your connection.')
  } finally { btn.textContent = editingId ? 'Save Changes →' : 'Add Member →'; btn.disabled = false }
}

// ── Publications ──────────────────────────────────────────────────────────────
function subscribePublications() {
  const q = query(collection(db, 'publications'), orderBy('order', 'asc'))
  return onSnapshot(q, snapshot => {
    currentPublications = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
    renderAdminList('publications-list', currentPublications,
      item => [item.authors, item.year ? String(item.year) : ''].filter(Boolean).join(' · '),
      item => openEditModal('publications', item),
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
  const data = {
    title, authors,
    venue: document.getElementById('fp-venue').value.trim(),
    year:  yearVal ? parseInt(yearVal, 10) : null,
    link:  document.getElementById('fp-link').value.trim(),
  }
  try {
    if (editingId) {
      await updateDoc(doc(db, 'publications', editingId), data)
    } else {
      await addDoc(collection(db, 'publications'), { ...data, order: currentPublications.length, createdAt: serverTimestamp() })
    }
    closeModal()
  } catch (err) {
    console.error(err); alert('Failed to save — check your connection.')
  } finally { btn.textContent = editingId ? 'Save Changes →' : 'Add Publication →'; btn.disabled = false }
}

// ── Modal ─────────────────────────────────────────────────────────────────────
window.openModal = function() {
  editingId = null
  document.getElementById('modal-title').textContent = MODAL_TITLES[currentTab].add
  ;['news', 'research', 'team', 'publications'].forEach(t => {
    document.getElementById('modal-form-' + t).style.display = t === currentTab ? 'block' : 'none'
  })
  clearModalForm(currentTab)
  updateSubmitLabel()
  document.getElementById('modal-backdrop').classList.add('open')
}

function openEditModal(tab, item) {
  editingId = item.id
  currentTab = tab
  document.getElementById('modal-title').textContent = MODAL_TITLES[tab].edit
  ;['news', 'research', 'team', 'publications'].forEach(t => {
    document.getElementById('modal-form-' + t).style.display = t === tab ? 'block' : 'none'
  })
  if (tab === 'news') {
    document.getElementById('fn-title').value = item.title || ''
    document.getElementById('fn-desc').value  = item.desc  || ''
    document.getElementById('fn-link').value  = item.link  || ''
  } else if (tab === 'research') {
    document.getElementById('f-title').value        = item.title || ''
    document.getElementById('f-tag').value          = item.tag   || ''
    document.getElementById('f-desc').value         = item.desc  || ''
    document.getElementById('f-contact-name').value = item.contact?.name || ''
    document.getElementById('f-contact-url').value  = item.contact?.url  || ''
    document.getElementById('f-video-type').value   = item.video?.type   || 'youtube'
    document.getElementById('f-video-url').value    = item.video?.url    || ''
    document.getElementById('pubs-list').textContent = ''
    pubCount = 0
    ;(item.pubs || []).forEach(p => window.addPubRow(p.text, p.url))
  } else if (tab === 'team') {
    document.getElementById('ft-name').value     = item.name     || ''
    document.getElementById('ft-category').value = item.category || 'student'
    document.getElementById('ft-role').value     = item.role     || ''
    document.getElementById('ft-photo').value    = item.photo    || ''
    document.getElementById('ft-bio').value      = item.bio      || ''
  } else if (tab === 'publications') {
    document.getElementById('fp-title').value   = item.title   || ''
    document.getElementById('fp-authors').value = item.authors || ''
    document.getElementById('fp-venue').value   = item.venue   || ''
    document.getElementById('fp-year').value    = item.year    ? String(item.year) : ''
    document.getElementById('fp-link').value    = item.link    || ''
  }
  updateSubmitLabel()
  document.getElementById('modal-backdrop').classList.add('open')
}

function updateSubmitLabel() {
  const map = { news: 'fn-submit', research: 'fr-submit', team: 'ft-submit', publications: 'fp-submit' }
  const addLabels = { news: 'Add News →', research: 'Add Project →', team: 'Add Member →', publications: 'Add Publication →' }
  const editLabels = { news: 'Save Changes →', research: 'Save Changes →', team: 'Save Changes →', publications: 'Save Changes →' }
  const btn = document.getElementById(map[currentTab])
  if (btn) btn.textContent = editingId ? editLabels[currentTab] : addLabels[currentTab]
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
    document.getElementById('ft-category').value = 'pi'
  } else if (tab === 'publications') {
    ;['fp-title', 'fp-authors', 'fp-venue', 'fp-year', 'fp-link'].forEach(id => { document.getElementById(id).value = '' })
  }
}

window.closeModal = function() {
  editingId = null
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
