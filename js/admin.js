/* ── REACH Lab — Admin JS ────────────────────────────────────────────────────
   Firebase Auth state, project CRUD, and admin UI.                            */

const DEFAULT_PROJECTS = [
  {
    id: 'p1',
    title: 'Dexterous Manipulation with Deformable Objects',
    tag: 'Robot Learning · Manipulation',
    desc: 'Advancing robotic grasping, in-hand manipulation, and adaptable object handling in complex real-world scenarios, including those involving deformable objects and uncertain conditions. We develop reinforcement learning and imitation learning pipelines that allow robots to acquire manipulation skills from limited demonstrations.',
    contact: { name: 'Prof. Fares Abu-Dakka', url: 'https://nyuad.nyu.edu' },
    video: { type: 'youtube', url: 'https://www.youtube.com/embed/videoseries?list=PLRezMy-3ORkgm6b3E4LL5m07hd-eELrui' },
    pubs: [{ text: 'Abu-Dakka et al. Robot skill learning via compliance-driven RL. IEEE RA-L 2024.', url: '' }]
  },
  {
    id: 'p2',
    title: 'Autonomous Robot Learning from Human Observation',
    tag: 'Imitation Learning · HRI',
    desc: 'Drawing inspiration from how humans and animals learn, we develop algorithms that enable robots to acquire new skills through reinforcement learning, trial and error, and observing and mimicking the actions of others. A key challenge is bridging the gap between human demonstrations and robot execution in varied environments.',
    contact: { name: 'REACH Lab', url: '' },
    video: { type: 'none', url: '' },
    pubs: []
  },
  {
    id: 'p3',
    title: 'Safe Human-Robot Collaboration',
    tag: 'Safety · Control',
    desc: 'Designing control architectures that keep robots safe and predictable during close collaboration with humans. We integrate constraint-aware motion planning with learned task policies, ensuring that robotic assistants can handle dangerous or repetitive tasks while remaining under human oversight at all times.',
    contact: { name: 'REACH Lab', url: '' },
    video: { type: 'none', url: '' },
    pubs: []
  }
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const isHttpUrl = u => typeof u === 'string' && /^https?:\/\//i.test(u);

function mk(tag, className) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  return el;
}

function videoEmbedUrl(type, url) {
  if (!url || type === 'none') return null;
  if (type === 'youtube') {
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
    if (m) return 'https://www.youtube.com/embed/' + m[1];
    if (url.includes('youtube.com/embed')) return url;
  }
  if (type === 'vimeo') {
    const m = url.match(/vimeo\.com\/(\d+)/);
    if (m) return 'https://player.vimeo.com/video/' + m[1];
    if (url.includes('player.vimeo.com')) return url;
  }
  if (type === 'direct' && isHttpUrl(url)) return url;
  return null;
}

// ── Render ────────────────────────────────────────────────────────────────────
function buildMediaCol(p) {
  const media = mk('div', 'project-media');
  const embedUrl = videoEmbedUrl(p.video && p.video.type, p.video && p.video.url);
  if (embedUrl) {
    const iframe = mk('iframe');
    iframe.src = embedUrl;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    media.appendChild(iframe);
  } else {
    const placeholder = mk('div', 'no-video');
    placeholder.textContent = 'Video coming soon';
    media.appendChild(placeholder);
  }
  return media;
}

function buildContentCol(p) {
  const content = mk('div', 'project-content');

  if (p.tag) {
    const tag = mk('span', 'project-tag');
    tag.textContent = p.tag;
    content.appendChild(tag);
  }

  const title = mk('h3', 'project-title');
  title.textContent = p.title;
  content.appendChild(title);

  const desc = mk('p', 'project-desc');
  desc.textContent = p.desc;
  content.appendChild(desc);

  if (p.contact && p.contact.name) {
    const contact = mk('p', 'project-contact');
    contact.append('Contact: ');
    if (isHttpUrl(p.contact.url)) {
      const link = mk('a');
      link.href = p.contact.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = p.contact.name;
      contact.appendChild(link);
    } else {
      contact.append(p.contact.name);
    }
    content.appendChild(contact);
  }

  if (p.pubs && p.pubs.length) {
    const pubsDiv = mk('div', 'project-pubs');
    const pubsTitle = mk('p', 'project-pubs-title');
    pubsTitle.textContent = 'Relevant Publications';
    pubsDiv.appendChild(pubsTitle);
    p.pubs.forEach(function(pub) {
      const item = mk('div', 'pub-item');
      item.textContent = pub.text;
      if (isHttpUrl(pub.url)) {
        const link = mk('a', 'pub-link');
        link.href = pub.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = '[link]';
        item.appendChild(link);
      }
      pubsDiv.appendChild(item);
    });
    content.appendChild(pubsDiv);
  }

  return content;
}

// Admin version — adds a delete button via event listener (no inline handler attribute)
function renderProject(p) {
  const card = mk('div', 'project-card');
  card.id = 'project-' + String(p.id).replace(/[^a-zA-Z0-9_-]/g, '');

  const deleteBtn = mk('button', 'btn-delete-project');
  deleteBtn.textContent = '✕ Remove';
  deleteBtn.addEventListener('click', function() { deleteProject(p.id); });
  card.appendChild(deleteBtn);

  const inner = mk('div', 'project-card-inner');
  inner.appendChild(buildContentCol(p));
  inner.appendChild(buildMediaCol(p));
  card.appendChild(inner);
  return card;
}

// ── State ────────────────────────────────────────────────────────────────────
var currentProjects = [];

async function seedDefaultProjects() {
  const batch = db.batch();
  DEFAULT_PROJECTS.forEach(function(p, i) {
    const ref = db.collection('projects').doc(p.id);
    const payload = Object.assign({}, p, {
      order: i,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    delete payload.id;
    batch.set(ref, payload);
  });
  await batch.commit();
}

function subscribeToProjects() {
  const container = document.getElementById('projects-container');
  container.textContent = '';
  const loading = mk('p');
  loading.textContent = 'Loading projects…';
  loading.style.cssText = 'color:var(--gray-500);text-align:center;padding:2rem 0;';
  container.appendChild(loading);

  return db.collection('projects')
    .orderBy('order', 'asc')
    .onSnapshot(function(snapshot) {
      if (snapshot.empty) {
        seedDefaultProjects().catch(function(err) {
          console.error('Seed failed:', err);
        });
        return;
      }
      currentProjects = snapshot.docs.map(function(d) {
        return Object.assign({ id: d.id }, d.data());
      });
      container.textContent = '';
      currentProjects.forEach(function(p) { container.appendChild(renderProject(p)); });
      document.getElementById('meta-projects').textContent = currentProjects.length;
    }, function(err) {
      console.error('Firestore read error:', err);
      container.textContent = 'Could not load projects.';
    });
}

// ── Delete ───────────────────────────────────────────────────────────────────
async function deleteProject(id) {
  if (!confirm('Remove this project from the database?')) return;
  try {
    await db.collection('projects').doc(id).delete();
  } catch (err) {
    console.error('Delete failed:', err);
    alert('Failed to delete project. Check your connection and try again.');
  }
}

// ── Add Project Modal ─────────────────────────────────────────────────────────
var pubCount = 0;

function openModal() {
  document.getElementById('modal-backdrop').classList.add('open');
  document.getElementById('f-title').value = '';
  document.getElementById('f-tag').value = '';
  document.getElementById('f-desc').value = '';
  document.getElementById('f-contact-name').value = '';
  document.getElementById('f-contact-url').value = '';
  document.getElementById('f-video-type').value = 'youtube';
  document.getElementById('f-video-url').value = '';
  document.getElementById('pubs-list').textContent = '';
  pubCount = 0;
}

function closeModal() {
  document.getElementById('modal-backdrop').classList.remove('open');
}

function handleBackdropClick(e) {
  if (e.target === document.getElementById('modal-backdrop')) closeModal();
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

  const btn = document.querySelector('.btn-submit');
  btn.textContent = 'Saving…';
  btn.disabled = true;

  const p = {
    id:      'p' + Date.now(),
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
    pubs: getPubs()
  };

  try {
    const docId = p.id;
    const payload = Object.assign({}, p, {
      order:     currentProjects.length,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    delete payload.id;
    await db.collection('projects').doc(docId).set(payload);
    closeModal();
    setTimeout(function() {
      const el = document.getElementById('project-' + p.id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  } catch (err) {
    console.error('Add project failed:', err);
    alert('Failed to save project. Check your connection and try again.');
  } finally {
    btn.textContent = 'Add Project →';
    btn.disabled = false;
  }
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
  await auth.signOut();
}

// ── Init ──────────────────────────────────────────────────────────────────────
var unsubscribeProjects = null;

auth.onAuthStateChanged(function(user) {
  if (user) {
    showAdminControls(user);
    unsubscribeProjects = subscribeToProjects();
  } else {
    showLoginCard();
    if (unsubscribeProjects) {
      unsubscribeProjects();
      unsubscribeProjects = null;
    }
  }
});

['login-email', 'login-password'].forEach(function(id) {
  var el = document.getElementById(id);
  if (el) el.addEventListener('keydown', function(e) { if (e.key === 'Enter') handleLogin(); });
});
