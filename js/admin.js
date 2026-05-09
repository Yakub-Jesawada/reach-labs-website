/* ── REACH Lab — Admin JS ────────────────────────────────────────────────────
   4-tab admin panel: News, Research, Team, Publications.                       */

// ── State ────────────────────────────────────────────────────────────────────
var currentTab = 'news';
var unsubNews = null, unsubResearch = null, unsubTeam = null, unsubPublications = null;
var currentNews = [], currentProjects = [], currentTeam = [], currentPublications = [];
var pubCount = 0;

var MODAL_TITLES = {
  news: 'Add News Item',
  research: 'Add Research Project',
  team: 'Add Team Member',
  publications: 'Add Publication'
};

// ── Tab switching ─────────────────────────────────────────────────────────────
function switchTab(tab) {
  currentTab = tab;
  ['news', 'research', 'team', 'publications'].forEach(function(t) {
    document.getElementById('tab-' + t).classList.toggle('tab-panel-active', t === tab);
    document.getElementById('tab-btn-' + t).classList.toggle('tab-active', t === tab);
  });
}

// ── Render helpers ────────────────────────────────────────────────────────────
function renderAdminList(containerId, items, subtitleFn, deleteFn) {
  const container = document.getElementById(containerId);
  container.textContent = '';
  if (!items.length) {
    const empty = mk('p');
    empty.textContent = 'No items yet.';
    empty.style.cssText = 'color:var(--gray-500);padding:1rem 0;font-size:14px;';
    container.appendChild(empty);
    return;
  }
  items.forEach(function(item) {
    const row = mk('div', 'admin-item-row');

    const info = mk('div', 'admin-item-info');
    const titleEl = mk('div', 'admin-item-title');
    titleEl.textContent = item.title || item.name || '(untitled)';
    info.appendChild(titleEl);

    const sub = subtitleFn(item);
    if (sub) {
      const subEl = mk('div', 'admin-item-subtitle');
      subEl.textContent = sub;
      info.appendChild(subEl);
    }

    const deleteBtn = mk('button', 'btn-admin-delete');
    deleteBtn.textContent = '✕ Remove';
    deleteBtn.addEventListener('click', function() { deleteFn(item.id); });

    row.appendChild(info);
    row.appendChild(deleteBtn);
    container.appendChild(row);
  });
}

// ── News ──────────────────────────────────────────────────────────────────────
function subscribeNews() {
  return db.collection('news').orderBy('order', 'asc').onSnapshot(function(snapshot) {
    currentNews = snapshot.docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); });
    renderAdminList('news-list', currentNews,
      function(item) { return item.desc ? item.desc.slice(0, 80) + (item.desc.length > 80 ? '…' : '') : ''; },
      deleteNews
    );
  }, function(err) { console.error('news read error:', err); });
}

async function deleteNews(id) {
  if (!confirm('Remove this news item?')) return;
  try {
    await db.collection('news').doc(id).delete();
  } catch (err) {
    console.error('Delete failed:', err);
    alert('Failed to delete — check your connection.');
  }
}

async function submitNews() {
  const title = document.getElementById('fn-title').value.trim();
  const desc  = document.getElementById('fn-desc').value.trim();
  if (!title || !desc) { alert('Please fill in the title and description.'); return; }

  const btn = document.getElementById('fn-submit');
  btn.textContent = 'Saving…';
  btn.disabled = true;

  try {
    await db.collection('news').add({
      title:     title,
      desc:      desc,
      link:      document.getElementById('fn-link').value.trim(),
      order:     currentNews.length,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    closeModal();
  } catch (err) {
    console.error('Add news failed:', err);
    alert('Failed to save — check your connection.');
  } finally {
    btn.textContent = 'Add News →';
    btn.disabled = false;
  }
}

// ── Research ──────────────────────────────────────────────────────────────────
function subscribeResearch() {
  return db.collection('projects').orderBy('order', 'asc').onSnapshot(function(snapshot) {
    currentProjects = snapshot.docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); });
    renderAdminList('research-list', currentProjects,
      function(item) { return item.tag || ''; },
      deleteProject
    );
  }, function(err) { console.error('projects read error:', err); });
}

async function deleteProject(id) {
  if (!confirm('Remove this project?')) return;
  try {
    await db.collection('projects').doc(id).delete();
  } catch (err) {
    console.error('Delete failed:', err);
    alert('Failed to delete — check your connection.');
  }
}

function addPubRow(existingText, existingUrl) {
  pubCount++;
  const row = mk('div', 'pub-row');
  row.id = 'pub-' + pubCount;

  const inputsDiv = mk('div');
  const textInput = mk('input');
  textInput.type = 'text';
  textInput.placeholder = 'Author(s). Title. Venue Year.';
  textInput.value = existingText || '';
  textInput.style.marginBottom = '4px';
  inputsDiv.appendChild(textInput);

  const urlInput = mk('input');
  urlInput.type = 'text';
  urlInput.placeholder = 'PDF / DOI URL (optional)';
  urlInput.value = existingUrl || '';
  inputsDiv.appendChild(urlInput);

  row.appendChild(inputsDiv);

  const removeBtn = mk('button', 'btn-remove-pub');
  removeBtn.textContent = '✕';
  removeBtn.addEventListener('click', function() { row.remove(); });
  row.appendChild(removeBtn);

  document.getElementById('pubs-list').appendChild(row);
}

function getPubs() {
  const rows = document.querySelectorAll('#pubs-list .pub-row');
  const pubs = [];
  rows.forEach(function(row) {
    const inputs = row.querySelectorAll('input');
    const text = inputs[0].value.trim();
    const url  = inputs[1].value.trim();
    if (text) pubs.push({ text: text, url: url });
  });
  return pubs;
}

async function submitProject() {
  const title = document.getElementById('f-title').value.trim();
  const desc  = document.getElementById('f-desc').value.trim();
  if (!title || !desc) { alert('Please fill in the project title and description.'); return; }

  const btn = document.getElementById('fr-submit');
  btn.textContent = 'Saving…';
  btn.disabled = true;

  try {
    await db.collection('projects').add({
      title:   title,
      tag:     document.getElementById('f-tag').value.trim(),
      desc:    desc,
      contact: {
        name: document.getElementById('f-contact-name').value.trim(),
        url:  document.getElementById('f-contact-url').value.trim()
      },
      video: {
        type: document.getElementById('f-video-type').value,
        url:  document.getElementById('f-video-url').value.trim()
      },
      pubs:      getPubs(),
      order:     currentProjects.length,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    closeModal();
  } catch (err) {
    console.error('Add project failed:', err);
    alert('Failed to save — check your connection.');
  } finally {
    btn.textContent = 'Add Project →';
    btn.disabled = false;
  }
}

// ── Team ──────────────────────────────────────────────────────────────────────
function subscribeTeam() {
  return db.collection('team').orderBy('order', 'asc').onSnapshot(function(snapshot) {
    currentTeam = snapshot.docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); });
    renderAdminList('team-list', currentTeam,
      function(item) { return item.role || ''; },
      deleteTeamMember
    );
  }, function(err) { console.error('team read error:', err); });
}

async function deleteTeamMember(id) {
  if (!confirm('Remove this team member?')) return;
  try {
    await db.collection('team').doc(id).delete();
  } catch (err) {
    console.error('Delete failed:', err);
    alert('Failed to delete — check your connection.');
  }
}

async function submitTeamMember() {
  const name = document.getElementById('ft-name').value.trim();
  const role = document.getElementById('ft-role').value.trim();
  if (!name || !role) { alert('Please fill in the name and role.'); return; }

  const btn = document.getElementById('ft-submit');
  btn.textContent = 'Saving…';
  btn.disabled = true;

  try {
    await db.collection('team').add({
      name:      name,
      role:      role,
      photo:     document.getElementById('ft-photo').value.trim(),
      bio:       document.getElementById('ft-bio').value.trim(),
      order:     currentTeam.length,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    closeModal();
  } catch (err) {
    console.error('Add team member failed:', err);
    alert('Failed to save — check your connection.');
  } finally {
    btn.textContent = 'Add Member →';
    btn.disabled = false;
  }
}

// ── Publications ──────────────────────────────────────────────────────────────
function subscribePublications() {
  return db.collection('publications').orderBy('order', 'asc').onSnapshot(function(snapshot) {
    currentPublications = snapshot.docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); });
    renderAdminList('publications-list', currentPublications,
      function(item) {
        const parts = [item.authors];
        if (item.year) parts.push(String(item.year));
        return parts.join(' · ');
      },
      deletePublication
    );
  }, function(err) { console.error('publications read error:', err); });
}

async function deletePublication(id) {
  if (!confirm('Remove this publication?')) return;
  try {
    await db.collection('publications').doc(id).delete();
  } catch (err) {
    console.error('Delete failed:', err);
    alert('Failed to delete — check your connection.');
  }
}

async function submitPublication() {
  const title   = document.getElementById('fp-title').value.trim();
  const authors = document.getElementById('fp-authors').value.trim();
  if (!title || !authors) { alert('Please fill in the title and authors.'); return; }

  const btn = document.getElementById('fp-submit');
  btn.textContent = 'Saving…';
  btn.disabled = true;

  const yearVal = document.getElementById('fp-year').value.trim();

  try {
    await db.collection('publications').add({
      title:     title,
      authors:   authors,
      venue:     document.getElementById('fp-venue').value.trim(),
      year:      yearVal ? parseInt(yearVal, 10) : null,
      link:      document.getElementById('fp-link').value.trim(),
      order:     currentPublications.length,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    closeModal();
  } catch (err) {
    console.error('Add publication failed:', err);
    alert('Failed to save — check your connection.');
  } finally {
    btn.textContent = 'Add Publication →';
    btn.disabled = false;
  }
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function openModal() {
  document.getElementById('modal-title').textContent = MODAL_TITLES[currentTab];
  ['news', 'research', 'team', 'publications'].forEach(function(t) {
    document.getElementById('modal-form-' + t).style.display = t === currentTab ? 'block' : 'none';
  });
  clearModalForm(currentTab);
  document.getElementById('modal-backdrop').classList.add('open');
}

function clearModalForm(tab) {
  if (tab === 'news') {
    document.getElementById('fn-title').value = '';
    document.getElementById('fn-desc').value = '';
    document.getElementById('fn-link').value = '';
  } else if (tab === 'research') {
    document.getElementById('f-title').value = '';
    document.getElementById('f-tag').value = '';
    document.getElementById('f-desc').value = '';
    document.getElementById('f-contact-name').value = '';
    document.getElementById('f-contact-url').value = '';
    document.getElementById('f-video-type').value = 'youtube';
    document.getElementById('f-video-url').value = '';
    document.getElementById('pubs-list').textContent = '';
    pubCount = 0;
  } else if (tab === 'team') {
    document.getElementById('ft-name').value = '';
    document.getElementById('ft-role').value = '';
    document.getElementById('ft-photo').value = '';
    document.getElementById('ft-bio').value = '';
  } else if (tab === 'publications') {
    document.getElementById('fp-title').value = '';
    document.getElementById('fp-authors').value = '';
    document.getElementById('fp-venue').value = '';
    document.getElementById('fp-year').value = '';
    document.getElementById('fp-link').value = '';
  }
}

function closeModal() {
  document.getElementById('modal-backdrop').classList.remove('open');
}

function handleBackdropClick(e) {
  if (e.target === document.getElementById('modal-backdrop')) closeModal();
}

// ── Auth UI ───────────────────────────────────────────────────────────────────
function showLoginCard() {
  document.getElementById('login-card').style.display = 'flex';
  document.getElementById('admin-nav-controls').style.display = 'none';
  document.getElementById('login-email').focus();
}

function showAdminControls(user) {
  document.getElementById('login-card').style.display = 'none';
  document.getElementById('admin-nav-controls').style.display = 'flex';
  document.getElementById('admin-user-email').textContent = user.email;
}

async function handleLogin() {
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl    = document.getElementById('login-error');
  const btn      = document.getElementById('login-btn');

  if (!email || !password) { errEl.textContent = 'Please enter your email and password.'; return; }

  btn.textContent = 'Signing in…';
  btn.disabled    = true;
  errEl.textContent = '';

  try {
    await auth.signInWithEmailAndPassword(email, password);
  } catch (err) {
    errEl.textContent = 'Invalid email or password.';
    btn.textContent = 'Sign In';
    btn.disabled = false;
  }
}

async function handleLogout() {
  await auth.signOut().catch(console.error);
}

// ── Init ──────────────────────────────────────────────────────────────────────
auth.onAuthStateChanged(function(user) {
  if (user) {
    showAdminControls(user);
    unsubNews         = subscribeNews();
    unsubResearch     = subscribeResearch();
    unsubTeam         = subscribeTeam();
    unsubPublications = subscribePublications();
  } else {
    showLoginCard();
    [unsubNews, unsubResearch, unsubTeam, unsubPublications].forEach(function(unsub) {
      if (unsub) unsub();
    });
    unsubNews = unsubResearch = unsubTeam = unsubPublications = null;
  }
});

['login-email', 'login-password'].forEach(function(id) {
  var el = document.getElementById(id);
  if (el) el.addEventListener('keydown', function(e) { if (e.key === 'Enter') handleLogin(); });
});
