# Firebase Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the localStorage data layer with Firebase Firestore + Email/Password Auth, split the single HTML file into `index.html`, `admin.html`, and a `js/` folder.

**Architecture:** `js/firebase-config.js` initialises Firebase globals (`db`, `auth`). `js/app.js` attaches a public real-time Firestore listener and renders project cards using DOM methods. `js/admin.js` manages auth state, the Add Project modal, and delete operations; it renders cards with a delete button. `index.html` is read-only; `admin.html` adds a login overlay and admin controls.

**Tech Stack:** Firebase Web SDK 10.8.0 (compat CDN), Firestore, Firebase Email/Password Auth, vanilla JS, plain HTML/CSS.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `js/firebase-config.js` | Create | Firebase init; sets globals `db` and `auth` |
| `js/app.js` | Create | Public render engine + Firestore listener |
| `js/admin.js` | Create | Auth, add/delete, admin render (cards with delete button) |
| `index.html` | Create | Public-facing site; no admin UI |
| `admin.html` | Create | Admin dashboard; login overlay + full admin controls |
| `reach-lab-website.html` | Delete (Task 6) | Obsolete after migration |
| `.gitignore` | Commit (Task 1) | Tracked but currently empty |

---

## Task 1: Project skeleton + Firebase config placeholder

**Files:**
- Create: `js/firebase-config.js`
- Commit: `.gitignore`

- [ ] **Step 1: Create `js/firebase-config.js`**

```javascript
// ── REACH Lab — Firebase Config ──────────────────────────────────────────────
// Setup steps:
// 1. Go to https://console.firebase.google.com — create a project
// 2. Add a Web App — copy the config object below
// 3. Build → Firestore Database → Create database (Production mode)
// 4. Set Firestore security rules (see Task 6)
// 5. Build → Authentication → Sign-in method → enable Email/Password
// 6. Authentication → Users → add an account for each admin
// ─────────────────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            "REPLACE_WITH_YOUR_API_KEY",
  authDomain:        "REPLACE_WITH_YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "REPLACE_WITH_YOUR_PROJECT_ID",
  storageBucket:     "REPLACE_WITH_YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "REPLACE_WITH_YOUR_MESSAGING_SENDER_ID",
  appId:             "REPLACE_WITH_YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);

const db   = firebase.firestore();
const auth = firebase.auth();
```

- [ ] **Step 2: Commit**

```bash
git add .gitignore js/firebase-config.js
git commit -m "feat: add firebase-config placeholder"
```

---

## Task 2: Public render engine (`js/app.js`)

**Files:**
- Create: `js/app.js`

All user-supplied text is inserted via `textContent` or validated before use in attributes, so no sanitisation helper is needed.

- [ ] **Step 1: Create `js/app.js`**

```javascript
/* ── REACH Lab — Public Site JS ─────────────────────────────────────────────
   Read-only. Subscribes to Firestore and renders project cards.               */

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

const isHttpUrl = u => typeof u === 'string' && /^https?:\/\//i.test(u);

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

function mk(tag, className) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  return el;
}

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
    p.pubs.forEach(pub => {
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

function renderProject(p) {
  const card = mk('div', 'project-card');
  card.id = 'project-' + String(p.id).replace(/[^a-zA-Z0-9_-]/g, '');

  const inner = mk('div', 'project-card-inner');
  inner.appendChild(buildContentCol(p));
  inner.appendChild(buildMediaCol(p));
  card.appendChild(inner);
  return card;
}

async function seedDefaultProjects() {
  const batch = db.batch();
  DEFAULT_PROJECTS.forEach((p, i) => {
    const ref = db.collection('projects').doc(p.id);
    batch.set(ref, Object.assign({}, p, {
      order: i,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }));
  });
  await batch.commit();
}

function subscribeToProjects() {
  const container = document.getElementById('projects-container');
  const loading = mk('p');
  loading.textContent = 'Loading projects…';
  loading.style.cssText = 'color:var(--gray-500);text-align:center;padding:2rem 0;';
  container.appendChild(loading);

  db.collection('projects')
    .orderBy('order', 'asc')
    .onSnapshot(function(snapshot) {
      if (snapshot.empty) {
        seedDefaultProjects().catch(console.error);
        return;
      }
      const projects = snapshot.docs.map(function(d) {
        return Object.assign({ id: d.id }, d.data());
      });
      container.textContent = '';
      projects.forEach(function(p) { container.appendChild(renderProject(p)); });
      document.getElementById('meta-projects').textContent = projects.length;
    }, function(err) {
      console.error('Firestore read error:', err);
      container.textContent = 'Could not load projects.';
    });
}

subscribeToProjects();
```

- [ ] **Step 2: Commit**

```bash
git add js/app.js
git commit -m "feat: add public Firestore render engine"
```

---

## Task 3: Public page (`index.html`)

**Files:**
- Create: `index.html`

This is the current `reach-lab-website.html` with admin elements removed and Firebase scripts added at the bottom.

- [ ] **Step 1: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>REACH Lab — Robot Learning and Control Lab | NYU Abu Dhabi</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=IBM+Plex+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap" rel="stylesheet">
<style>
  :root {
    --navy: #0d2b52; --navy-mid: #1a3f6f; --navy-light: #2a5fa0;
    --sky: #2b87c8; --sky-light: #3fa3e0; --sky-pale: #daeef8;
    --white: #ffffff; --off-white: #f5f8fb;
    --gray-100: #eaeff5; --gray-300: #b0bece; --gray-500: #6b7f95; --gray-700: #334560;
    --text: #0f1e32; --text-muted: #4a6080;
    --border: rgba(42,95,160,0.15); --card-bg: #ffffff; --section-bg: #f5f8fb;
  }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { font-family: 'IBM Plex Sans', sans-serif; background: var(--off-white); color: var(--text); line-height: 1.7; font-size: 16px; }

  nav {
    position: sticky; top: 0; z-index: 100; background: var(--navy);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 3rem; height: 64px; box-shadow: 0 2px 20px rgba(13,43,82,0.3);
  }
  .nav-logo { display: flex; align-items: center; gap: 12px; text-decoration: none; }
  .nav-logo-mark { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 22px; color: var(--sky-light); letter-spacing: -0.5px; }
  .nav-logo-sub { font-size: 11px; font-weight: 300; color: var(--gray-300); letter-spacing: 0.08em; text-transform: uppercase; border-left: 1px solid rgba(255,255,255,0.2); padding-left: 12px; line-height: 1.3; }
  .nav-links { display: flex; gap: 2rem; list-style: none; }
  .nav-links a { color: var(--gray-300); text-decoration: none; font-size: 13.5px; font-weight: 400; letter-spacing: 0.03em; transition: color 0.2s; }
  .nav-links a:hover { color: var(--white); }

  .hero { background: linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 60%, #1e4d80 100%); color: white; padding: 90px 3rem 80px; position: relative; overflow: hidden; }
  .hero::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 75% 50%, rgba(43,135,200,0.15) 0%, transparent 65%); pointer-events: none; }
  .hero-inner { max-width: 900px; margin: 0 auto; position: relative; }
  .hero-tag { font-size: 11px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: var(--sky-light); margin-bottom: 1.2rem; }
  h1.hero-title { font-family: 'Syne', sans-serif; font-size: clamp(2.4rem, 5vw, 3.6rem); font-weight: 800; line-height: 1.1; letter-spacing: -1px; color: var(--white); margin-bottom: 1.2rem; }
  h1.hero-title span { color: var(--sky-light); }
  .hero-desc { font-size: 17px; font-weight: 300; color: rgba(255,255,255,0.75); max-width: 640px; line-height: 1.75; margin-bottom: 2rem; }
  .hero-meta { display: flex; gap: 2.5rem; flex-wrap: wrap; }
  .hero-meta-item { display: flex; flex-direction: column; gap: 2px; }
  .hero-meta-item strong { font-family: 'Syne', sans-serif; font-size: 1.4rem; font-weight: 700; color: var(--sky-light); }
  .hero-meta-item span { font-size: 12px; color: rgba(255,255,255,0.5); letter-spacing: 0.05em; }

  .section { padding: 80px 3rem; }
  .section-inner { max-width: 960px; margin: 0 auto; }
  .section-title { font-family: 'Syne', sans-serif; font-size: 1.6rem; font-weight: 700; color: var(--navy); letter-spacing: -0.3px; margin-bottom: 2.5rem; display: flex; align-items: center; gap: 12px; }
  .section-title::after { content: ''; flex: 1; height: 1px; background: var(--border); }
  .alt-bg { background: var(--section-bg); }

  #projects-container { display: flex; flex-direction: column; gap: 3rem; }
  .project-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; transition: box-shadow 0.25s; }
  .project-card:hover { box-shadow: 0 6px 32px rgba(13,43,82,0.1); }
  .project-card-inner { display: grid; grid-template-columns: 1fr 380px; gap: 0; }
  .project-content { padding: 2rem 2.2rem; }
  .project-tag { display: inline-block; font-size: 10.5px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: var(--sky); background: var(--sky-pale); border-radius: 3px; padding: 3px 10px; margin-bottom: 1rem; }
  .project-title { font-family: 'Syne', sans-serif; font-size: 1.25rem; font-weight: 700; color: var(--navy); line-height: 1.3; margin-bottom: 0.8rem; }
  .project-desc { font-size: 14.5px; color: var(--text-muted); line-height: 1.75; margin-bottom: 1.2rem; }
  .project-contact { font-size: 13px; color: var(--gray-500); margin-bottom: 1rem; }
  .project-contact a { color: var(--sky); text-decoration: none; }
  .project-contact a:hover { text-decoration: underline; }
  .project-pubs { margin-top: 1rem; border-top: 1px solid var(--border); padding-top: 1rem; }
  .project-pubs-title { font-size: 11px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: var(--gray-500); margin-bottom: 0.6rem; }
  .pub-item { font-size: 13px; line-height: 1.6; color: var(--text-muted); margin-bottom: 0.5rem; }
  .pub-link { font-size: 12px; color: var(--sky); text-decoration: none; margin-left: 6px; }
  .pub-link:hover { text-decoration: underline; }
  .project-media { background: var(--navy); display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 260px; position: relative; }
  .project-media iframe { width: 100%; height: 100%; min-height: 260px; border: none; display: block; }
  .project-media .no-video { color: rgba(255,255,255,0.3); font-size: 13px; text-align: center; padding: 2rem; }

  @media (max-width: 700px) {
    .project-card-inner { grid-template-columns: 1fr; }
    .project-media { min-height: 200px; }
    nav { padding: 0 1.2rem; }
    .hero, .section { padding-left: 1.2rem; padding-right: 1.2rem; }
  }

  .team-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.4rem; }
  .team-card { background: var(--white); border: 1px solid var(--border); border-radius: 8px; padding: 1.4rem 1.2rem; text-align: center; }
  .team-avatar { width: 60px; height: 60px; border-radius: 50%; background: var(--navy-mid); display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 18px; color: var(--sky-light); margin: 0 auto 12px; }
  .team-name { font-family: 'Syne', sans-serif; font-weight: 600; font-size: 14.5px; color: var(--navy); }
  .team-role { font-size: 12.5px; color: var(--text-muted); margin-top: 3px; }

  footer { background: var(--navy); color: rgba(255,255,255,0.55); text-align: center; padding: 2rem 3rem; font-size: 13px; }
  footer a { color: var(--sky-light); text-decoration: none; }
  footer a:hover { text-decoration: underline; }
</style>
</head>
<body>

<nav>
  <a class="nav-logo" href="#">
    <span class="nav-logo-mark">REACH</span>
    <span class="nav-logo-sub">Robot Learning<br>&amp; Control Lab</span>
  </a>
  <ul class="nav-links">
    <li><a href="#research">Research</a></li>
    <li><a href="#team">Team</a></li>
    <li><a href="#about">About</a></li>
  </ul>
</nav>

<section class="hero">
  <div class="hero-inner">
    <p class="hero-tag">NYU Abu Dhabi · Division of Engineering</p>
    <h1 class="hero-title">Robot <span>Learning</span><br>&amp; Control Lab</h1>
    <p class="hero-desc">
      REACH Lab develops algorithms and systems that enable robots to learn, adapt, and collaborate
      with humans in complex real-world environments — from dexterous manipulation to autonomous decision-making.
    </p>
    <div class="hero-meta">
      <div class="hero-meta-item"><strong id="meta-projects">—</strong><span>Active Projects</span></div>
      <div class="hero-meta-item"><strong>NYU AD</strong><span>Abu Dhabi, UAE</span></div>
      <div class="hero-meta-item"><strong>2024</strong><span>Founded</span></div>
    </div>
  </div>
</section>

<section class="section" id="research">
  <div class="section-inner">
    <h2 class="section-title">Current Research</h2>
    <div id="projects-container"></div>
  </div>
</section>

<section class="section alt-bg" id="team">
  <div class="section-inner">
    <h2 class="section-title">Team</h2>
    <div class="team-grid">
      <div class="team-card">
        <div class="team-avatar">FA</div>
        <div class="team-name">Prof. Fares Abu-Dakka</div>
        <div class="team-role">Principal Investigator</div>
      </div>
      <div class="team-card">
        <div class="team-avatar">+</div>
        <div class="team-name">Join the Lab</div>
        <div class="team-role">PhD &amp; Postdoc positions open</div>
      </div>
    </div>
  </div>
</section>

<section class="section" id="about">
  <div class="section-inner">
    <h2 class="section-title">About</h2>
    <div style="max-width:680px; font-size:15.5px; color:var(--text-muted); line-height:1.85;">
      <p style="margin-bottom:1rem;">
        The <strong style="color:var(--navy)">REACH Lab</strong> (Robot Learning and Control Lab) is based in the Division of Engineering at
        NYU Abu Dhabi. Our research sits at the intersection of machine learning, control theory,
        and human-robot interaction — building robots that learn from experience and work safely alongside people.
      </p>
      <p>
        We are part of the broader robotics ecosystem at NYU Abu Dhabi, collaborating with labs across the NYUAD engineering division and the global NYU network.
        Interested in joining? Reach out at <a href="mailto:reach-lab@nyu.edu" style="color:var(--sky);">reach-lab@nyu.edu</a>.
      </p>
    </div>
  </div>
</section>

<footer>
  <p>REACH Lab · Robot Learning and Control Lab · NYU Abu Dhabi &nbsp;·&nbsp; 2024–2025</p>
  <p style="margin-top:6px;"><a href="https://nyuad.nyu.edu/en/research/faculty-labs-and-projects.html">NYU Abu Dhabi Research</a></p>
</footer>

<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js"></script>
<script src="js/firebase-config.js"></script>
<script src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: add public index.html (read-only)"
```

---

## Task 4: Admin logic (`js/admin.js`)

**Files:**
- Create: `js/admin.js`

Same DOM-method render approach as `app.js`. Admin version of `renderProject` adds a delete button and attaches an event listener rather than using an inline handler attribute.

- [ ] **Step 1: Create `js/admin.js`**

```javascript
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
    batch.set(ref, Object.assign({}, p, {
      order: i,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }));
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

  db.collection('projects')
    .orderBy('order', 'asc')
    .onSnapshot(async function(snapshot) {
      if (snapshot.empty) {
        await seedDefaultProjects();
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
    await db.collection('projects').doc(p.id).set(Object.assign({}, p, {
      order:     currentProjects.length,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }));
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
auth.onAuthStateChanged(function(user) {
  if (user) {
    showAdminControls(user);
  } else {
    showLoginCard();
  }
});

subscribeToProjects();

['login-email', 'login-password'].forEach(function(id) {
  var el = document.getElementById(id);
  if (el) el.addEventListener('keydown', function(e) { if (e.key === 'Enter') handleLogin(); });
});
```

- [ ] **Step 2: Commit**

```bash
git add js/admin.js
git commit -m "feat: add admin auth and project CRUD logic"
```

---

## Task 5: Admin page (`admin.html`)

**Files:**
- Create: `admin.html`

`admin.html` extends `index.html`'s CSS with admin-only rules (delete button, modal). It adds a login overlay, admin nav controls, and the Add Project modal. Auth SDK is added alongside Firestore.

- [ ] **Step 1: Create `admin.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>REACH Lab — Admin | NYU Abu Dhabi</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=IBM+Plex+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap" rel="stylesheet">
<style>
  :root {
    --navy: #0d2b52; --navy-mid: #1a3f6f; --navy-light: #2a5fa0;
    --sky: #2b87c8; --sky-light: #3fa3e0; --sky-pale: #daeef8;
    --white: #ffffff; --off-white: #f5f8fb;
    --gray-100: #eaeff5; --gray-300: #b0bece; --gray-500: #6b7f95; --gray-700: #334560;
    --text: #0f1e32; --text-muted: #4a6080;
    --border: rgba(42,95,160,0.15); --card-bg: #ffffff; --section-bg: #f5f8fb;
  }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { font-family: 'IBM Plex Sans', sans-serif; background: var(--off-white); color: var(--text); line-height: 1.7; font-size: 16px; }

  nav {
    position: sticky; top: 0; z-index: 100; background: var(--navy);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 3rem; height: 64px; box-shadow: 0 2px 20px rgba(13,43,82,0.3);
  }
  .nav-logo { display: flex; align-items: center; gap: 12px; text-decoration: none; }
  .nav-logo-mark { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 22px; color: var(--sky-light); letter-spacing: -0.5px; }
  .nav-logo-sub { font-size: 11px; font-weight: 300; color: var(--gray-300); letter-spacing: 0.08em; text-transform: uppercase; border-left: 1px solid rgba(255,255,255,0.2); padding-left: 12px; line-height: 1.3; }
  .nav-links { display: flex; gap: 2rem; list-style: none; }
  .nav-links a { color: var(--gray-300); text-decoration: none; font-size: 13.5px; font-weight: 400; letter-spacing: 0.03em; transition: color 0.2s; }
  .nav-links a:hover { color: var(--white); }
  .btn-admin { background: rgba(59,163,224,0.15); border: 1px solid rgba(59,163,224,0.4); color: var(--sky-light); font-size: 13px; padding: 6px 16px; border-radius: 4px; cursor: pointer; font-family: 'IBM Plex Sans', sans-serif; transition: background 0.2s, border-color 0.2s; }
  .btn-admin:hover { background: rgba(59,163,224,0.25); border-color: var(--sky-light); }

  .hero { background: linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 60%, #1e4d80 100%); color: white; padding: 90px 3rem 80px; position: relative; overflow: hidden; }
  .hero::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 75% 50%, rgba(43,135,200,0.15) 0%, transparent 65%); pointer-events: none; }
  .hero-inner { max-width: 900px; margin: 0 auto; position: relative; }
  .hero-tag { font-size: 11px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: var(--sky-light); margin-bottom: 1.2rem; }
  h1.hero-title { font-family: 'Syne', sans-serif; font-size: clamp(2.4rem, 5vw, 3.6rem); font-weight: 800; line-height: 1.1; letter-spacing: -1px; color: var(--white); margin-bottom: 1.2rem; }
  h1.hero-title span { color: var(--sky-light); }
  .hero-desc { font-size: 17px; font-weight: 300; color: rgba(255,255,255,0.75); max-width: 640px; line-height: 1.75; margin-bottom: 2rem; }
  .hero-meta { display: flex; gap: 2.5rem; flex-wrap: wrap; }
  .hero-meta-item { display: flex; flex-direction: column; gap: 2px; }
  .hero-meta-item strong { font-family: 'Syne', sans-serif; font-size: 1.4rem; font-weight: 700; color: var(--sky-light); }
  .hero-meta-item span { font-size: 12px; color: rgba(255,255,255,0.5); letter-spacing: 0.05em; }

  .section { padding: 80px 3rem; }
  .section-inner { max-width: 960px; margin: 0 auto; }
  .section-title { font-family: 'Syne', sans-serif; font-size: 1.6rem; font-weight: 700; color: var(--navy); letter-spacing: -0.3px; margin-bottom: 2.5rem; display: flex; align-items: center; gap: 12px; }
  .section-title::after { content: ''; flex: 1; height: 1px; background: var(--border); }
  .alt-bg { background: var(--section-bg); }

  #projects-container { display: flex; flex-direction: column; gap: 3rem; }
  .project-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; transition: box-shadow 0.25s; position: relative; }
  .project-card:hover { box-shadow: 0 6px 32px rgba(13,43,82,0.1); }
  .project-card-inner { display: grid; grid-template-columns: 1fr 380px; gap: 0; }
  .project-content { padding: 2rem 2.2rem; }
  .project-tag { display: inline-block; font-size: 10.5px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: var(--sky); background: var(--sky-pale); border-radius: 3px; padding: 3px 10px; margin-bottom: 1rem; }
  .project-title { font-family: 'Syne', sans-serif; font-size: 1.25rem; font-weight: 700; color: var(--navy); line-height: 1.3; margin-bottom: 0.8rem; }
  .project-desc { font-size: 14.5px; color: var(--text-muted); line-height: 1.75; margin-bottom: 1.2rem; }
  .project-contact { font-size: 13px; color: var(--gray-500); margin-bottom: 1rem; }
  .project-contact a { color: var(--sky); text-decoration: none; }
  .project-contact a:hover { text-decoration: underline; }
  .project-pubs { margin-top: 1rem; border-top: 1px solid var(--border); padding-top: 1rem; }
  .project-pubs-title { font-size: 11px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: var(--gray-500); margin-bottom: 0.6rem; }
  .pub-item { font-size: 13px; line-height: 1.6; color: var(--text-muted); margin-bottom: 0.5rem; }
  .pub-link { font-size: 12px; color: var(--sky); text-decoration: none; margin-left: 6px; }
  .pub-link:hover { text-decoration: underline; }
  .project-media { background: var(--navy); display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 260px; position: relative; }
  .project-media iframe { width: 100%; height: 100%; min-height: 260px; border: none; display: block; }
  .project-media .no-video { color: rgba(255,255,255,0.3); font-size: 13px; text-align: center; padding: 2rem; }

  .btn-delete-project { position: absolute; top: 12px; right: 12px; background: rgba(255,255,255,0.9); border: 1px solid #eee; border-radius: 4px; padding: 4px 10px; font-size: 11px; color: #cc4444; cursor: pointer; opacity: 0; transition: opacity 0.2s; font-family: inherit; }
  .project-card:hover .btn-delete-project { opacity: 1; }

  @media (max-width: 700px) {
    .project-card-inner { grid-template-columns: 1fr; }
    .project-media { min-height: 200px; }
    nav { padding: 0 1.2rem; }
    .hero, .section { padding-left: 1.2rem; padding-right: 1.2rem; }
  }

  .modal-backdrop { display: none; position: fixed; inset: 0; z-index: 200; background: rgba(10,25,50,0.7); align-items: center; justify-content: center; padding: 1.5rem; }
  .modal-backdrop.open { display: flex; }
  .modal { background: var(--white); border-radius: 12px; width: 100%; max-width: 640px; max-height: 90vh; overflow-y: auto; padding: 2.2rem 2.5rem; box-shadow: 0 20px 60px rgba(13,43,82,0.4); }
  .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.8rem; }
  .modal-header h2 { font-family: 'Syne', sans-serif; font-size: 1.2rem; font-weight: 700; color: var(--navy); }
  .modal-close { background: none; border: none; cursor: pointer; font-size: 22px; color: var(--gray-500); line-height: 1; padding: 4px 8px; border-radius: 4px; transition: background 0.2s; }
  .modal-close:hover { background: var(--gray-100); }
  .form-group { margin-bottom: 1.2rem; }
  .form-group label { display: block; font-size: 12px; font-weight: 500; color: var(--navy); letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 6px; }
  .form-group input, .form-group textarea, .form-group select { width: 100%; padding: 10px 14px; border: 1px solid var(--border); border-radius: 6px; font-family: 'IBM Plex Sans', sans-serif; font-size: 14px; color: var(--text); background: var(--white); transition: border-color 0.2s, box-shadow 0.2s; outline: none; }
  .form-group input:focus, .form-group textarea:focus, .form-group select:focus { border-color: var(--sky); box-shadow: 0 0 0 3px rgba(43,135,200,0.12); }
  .form-group textarea { resize: vertical; min-height: 100px; }
  .form-hint { font-size: 12px; color: var(--gray-500); margin-top: 4px; }
  #pubs-list .pub-row { display: grid; grid-template-columns: 1fr auto; gap: 6px; margin-bottom: 8px; align-items: start; }
  #pubs-list .pub-row input { margin: 0; }
  .btn-remove-pub { background: none; border: 1px solid #eee; border-radius: 4px; padding: 8px 10px; cursor: pointer; color: #cc4444; font-size: 13px; white-space: nowrap; }
  .btn-add-pub { background: none; border: 1px dashed var(--border); border-radius: 6px; padding: 8px 14px; font-size: 13px; color: var(--sky); cursor: pointer; font-family: inherit; width: 100%; margin-top: 4px; transition: background 0.2s; }
  .btn-add-pub:hover { background: var(--sky-pale); }
  .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 1.8rem; border-top: 1px solid var(--border); padding-top: 1.4rem; }
  .btn-cancel { background: none; border: 1px solid var(--border); border-radius: 6px; padding: 9px 22px; cursor: pointer; font-size: 14px; color: var(--text-muted); font-family: inherit; transition: background 0.2s; }
  .btn-cancel:hover { background: var(--gray-100); }
  .btn-submit { background: var(--navy); border: none; border-radius: 6px; padding: 9px 26px; cursor: pointer; font-size: 14px; color: white; font-family: 'Syne', sans-serif; font-weight: 600; transition: background 0.2s; }
  .btn-submit:hover { background: var(--navy-mid); }

  .team-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.4rem; }
  .team-card { background: var(--white); border: 1px solid var(--border); border-radius: 8px; padding: 1.4rem 1.2rem; text-align: center; }
  .team-avatar { width: 60px; height: 60px; border-radius: 50%; background: var(--navy-mid); display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 18px; color: var(--sky-light); margin: 0 auto 12px; }
  .team-name { font-family: 'Syne', sans-serif; font-weight: 600; font-size: 14.5px; color: var(--navy); }
  .team-role { font-size: 12.5px; color: var(--text-muted); margin-top: 3px; }

  footer { background: var(--navy); color: rgba(255,255,255,0.55); text-align: center; padding: 2rem 3rem; font-size: 13px; }
  footer a { color: var(--sky-light); text-decoration: none; }
  footer a:hover { text-decoration: underline; }
</style>
</head>
<body>

<!-- Login overlay: visible until auth.onAuthStateChanged fires with a user -->
<div id="login-card" style="position:fixed;inset:0;z-index:300;background:rgba(10,25,50,0.88);display:flex;align-items:center;justify-content:center;padding:1.5rem;">
  <div style="background:white;border-radius:12px;width:100%;max-width:400px;padding:2.5rem;box-shadow:0 20px 60px rgba(13,43,82,0.4);">
    <h2 style="font-family:'Syne',sans-serif;font-size:1.3rem;font-weight:700;color:var(--navy);margin-bottom:0.4rem;">Admin Sign In</h2>
    <p style="font-size:13px;color:var(--text-muted);margin-bottom:1.6rem;">REACH Lab · NYU Abu Dhabi</p>
    <div class="form-group">
      <label>Email</label>
      <input type="email" id="login-email" placeholder="you@nyu.edu" autocomplete="email" autofocus>
    </div>
    <div class="form-group">
      <label>Password</label>
      <input type="password" id="login-password" placeholder="••••••••" autocomplete="current-password">
    </div>
    <p id="login-error" style="font-size:13px;color:#cc4444;min-height:1.4em;margin-bottom:0.8rem;"></p>
    <button id="login-btn" onclick="handleLogin()" style="width:100%;background:var(--navy);border:none;border-radius:6px;padding:11px;font-family:'Syne',sans-serif;font-size:14px;font-weight:600;color:white;cursor:pointer;transition:background 0.2s;">Sign In</button>
  </div>
</div>

<nav>
  <a class="nav-logo" href="index.html">
    <span class="nav-logo-mark">REACH</span>
    <span class="nav-logo-sub">Robot Learning<br>&amp; Control Lab</span>
  </a>
  <ul class="nav-links">
    <li><a href="#research">Research</a></li>
    <li><a href="#team">Team</a></li>
    <li><a href="#about">About</a></li>
  </ul>
  <div id="admin-nav-controls" style="display:none;align-items:center;gap:12px;">
    <span id="admin-user-email" style="font-size:12px;color:var(--gray-300);"></span>
    <button class="btn-admin" onclick="openModal()">&#xFF0B; Add Project</button>
    <button onclick="handleLogout()" style="background:none;border:1px solid rgba(255,255,255,0.2);color:var(--gray-300);font-size:12px;padding:5px 12px;border-radius:4px;cursor:pointer;font-family:inherit;">Logout</button>
  </div>
</nav>

<section class="hero">
  <div class="hero-inner">
    <p class="hero-tag">NYU Abu Dhabi · Division of Engineering · Admin</p>
    <h1 class="hero-title">Robot <span>Learning</span><br>&amp; Control Lab</h1>
    <p class="hero-desc">
      REACH Lab develops algorithms and systems that enable robots to learn, adapt, and collaborate
      with humans in complex real-world environments.
    </p>
    <div class="hero-meta">
      <div class="hero-meta-item"><strong id="meta-projects">—</strong><span>Active Projects</span></div>
      <div class="hero-meta-item"><strong>NYU AD</strong><span>Abu Dhabi, UAE</span></div>
      <div class="hero-meta-item"><strong>2024</strong><span>Founded</span></div>
    </div>
  </div>
</section>

<section class="section" id="research">
  <div class="section-inner">
    <h2 class="section-title">Current Research</h2>
    <div id="projects-container"></div>
  </div>
</section>

<section class="section alt-bg" id="team">
  <div class="section-inner">
    <h2 class="section-title">Team</h2>
    <div class="team-grid">
      <div class="team-card">
        <div class="team-avatar">FA</div>
        <div class="team-name">Prof. Fares Abu-Dakka</div>
        <div class="team-role">Principal Investigator</div>
      </div>
      <div class="team-card">
        <div class="team-avatar">+</div>
        <div class="team-name">Join the Lab</div>
        <div class="team-role">PhD &amp; Postdoc positions open</div>
      </div>
    </div>
  </div>
</section>

<section class="section" id="about">
  <div class="section-inner">
    <h2 class="section-title">About</h2>
    <div style="max-width:680px; font-size:15.5px; color:var(--text-muted); line-height:1.85;">
      <p style="margin-bottom:1rem;">
        The <strong style="color:var(--navy)">REACH Lab</strong> (Robot Learning and Control Lab) is based in the Division of Engineering at NYU Abu Dhabi.
      </p>
      <p>
        Interested in joining? Reach out at <a href="mailto:reach-lab@nyu.edu" style="color:var(--sky);">reach-lab@nyu.edu</a>.
      </p>
    </div>
  </div>
</section>

<footer>
  <p>REACH Lab · Robot Learning and Control Lab · NYU Abu Dhabi &nbsp;·&nbsp; 2024–2025</p>
  <p style="margin-top:6px;"><a href="https://nyuad.nyu.edu/en/research/faculty-labs-and-projects.html">NYU Abu Dhabi Research</a></p>
</footer>

<div class="modal-backdrop" id="modal-backdrop" onclick="handleBackdropClick(event)">
  <div class="modal">
    <div class="modal-header">
      <h2>Add New Research Project</h2>
      <button class="modal-close" onclick="closeModal()">&#x2715;</button>
    </div>
    <div class="form-group">
      <label>Project Title *</label>
      <input type="text" id="f-title" placeholder="e.g. Dexterous Manipulation via Imitation Learning">
    </div>
    <div class="form-group">
      <label>Research Area / Tag</label>
      <input type="text" id="f-tag" placeholder="e.g. Robot Learning · Manipulation">
    </div>
    <div class="form-group">
      <label>Description *</label>
      <textarea id="f-desc" placeholder="Describe the research problem, approach, and goals..."></textarea>
    </div>
    <div class="form-group">
      <label>Contact Person</label>
      <input type="text" id="f-contact-name" placeholder="Name">
      <input type="text" id="f-contact-url" placeholder="Profile URL (optional)" style="margin-top:6px;">
    </div>
    <div class="form-group">
      <label>Video Embed</label>
      <select id="f-video-type">
        <option value="youtube">YouTube URL or Embed URL</option>
        <option value="vimeo">Vimeo URL</option>
        <option value="direct">Direct MP4 link</option>
        <option value="none">No video</option>
      </select>
      <input type="text" id="f-video-url" placeholder="https://www.youtube.com/watch?v=..." style="margin-top:8px;">
      <p class="form-hint">Paste any YouTube/Vimeo URL — it will be auto-converted to an embed.</p>
    </div>
    <div class="form-group">
      <label>Publications</label>
      <div id="pubs-list"></div>
      <button class="btn-add-pub" onclick="addPubRow()">&#xFF0B; Add Publication</button>
    </div>
    <div class="modal-actions">
      <button class="btn-cancel" onclick="closeModal()">Cancel</button>
      <button class="btn-submit" onclick="submitProject()">Add Project &#x2192;</button>
    </div>
  </div>
</div>

<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js"></script>
<script src="js/firebase-config.js"></script>
<script src="js/admin.js"></script>
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add admin.html
git commit -m "feat: add admin.html with login overlay and project management"
```

---

## Task 6: Firebase Console setup + end-to-end test

**Files:**
- Modify: `js/firebase-config.js` (fill in real config values)
- Delete: `reach-lab-website.html`

- [ ] **Step 1: Create the Firebase project**

1. Go to https://console.firebase.google.com
2. Click **Add project** → give it a name (e.g. `reach-lab`) → disable Google Analytics → **Create project**

- [ ] **Step 2: Enable Firestore**

1. Sidebar: **Build → Firestore Database → Create database** → choose **Production mode** → region `europe-west1` (closest to UAE) → **Enable**
2. Go to the **Rules** tab and replace the default rules with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /projects/{projectId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

3. Click **Publish**

- [ ] **Step 3: Enable Email/Password Auth**

1. Sidebar: **Build → Authentication → Get started → Sign-in method**
2. Click **Email/Password** → toggle **Enable** → **Save**
3. Go to the **Users** tab → **Add user** for each admin (email + password)

- [ ] **Step 4: Get the web app config**

1. Sidebar gear icon → **Project settings → Your apps → Add app → Web icon**
2. Register the app (nickname: `reach-lab-web`) → copy the `firebaseConfig` object shown

- [ ] **Step 5: Fill in `js/firebase-config.js`**

Replace each `REPLACE_WITH_...` value with the real values from Step 4:

```javascript
const firebaseConfig = {
  apiKey:            "AIzaSy...",
  authDomain:        "reach-lab.firebaseapp.com",
  projectId:         "reach-lab",
  storageBucket:     "reach-lab.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abc123"
};
```

- [ ] **Step 6: Start a local HTTP server**

Firebase Auth requires HTTP(S) — opening `file://` will not work.

```bash
npx serve .
```

Expected output: `Serving! - Local: http://localhost:3000`

- [ ] **Step 7: Test the public page**

1. Open `http://localhost:3000/index.html`
2. Open DevTools → Console — expect zero errors
3. Projects load and render (default 3 on first run, seeded automatically)
4. Hero counter shows **3**
5. Verify: no Add Project button, no delete controls anywhere

- [ ] **Step 8: Test admin login**

1. Open `http://localhost:3000/admin.html`
2. Dark login overlay should cover the page
3. Enter wrong credentials → expect inline error "Invalid email or password."
4. Enter correct credentials → overlay disappears, nav shows `email · Add Project · Logout`

- [ ] **Step 9: Test Add Project**

1. On `admin.html`, click **Add Project**, fill in Title and Description, submit
2. Modal closes, new card appears at the bottom
3. Open `index.html` in a second tab — new card appears there too (confirms real-time sync)

- [ ] **Step 10: Test Delete**

1. On `admin.html`, hover a card → "✕ Remove" appears → click → confirm
2. Card disappears immediately on `admin.html`; disappears on `index.html` tab within ~1 second

- [ ] **Step 11: Final cleanup commit**

```bash
git rm reach-lab-website.html
git add js/firebase-config.js
git commit -m "feat: connect Firebase backend, remove legacy single-file"
```
