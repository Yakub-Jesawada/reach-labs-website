# Multi-Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the REACH Lab site into four public pages (Home, Research, Team, Publications) with a rewritten tabbed admin panel, all backed by Firebase Firestore.

**Architecture:** A new `js/utils.js` holds the three shared helpers (`isHttpUrl`, `mk`, `videoEmbedUrl`) that were previously duplicated in `app.js` and `admin.js`. Each public page gets its own JS file that subscribes to one Firestore collection and renders results with DOM methods. The admin is rewritten as a clean 4-tab panel (no longer mirroring the public site layout). `app.js` is deleted.

**Tech Stack:** Firebase Web SDK 10.8.0 (compat CDN), Firestore, Firebase Email/Password Auth, vanilla JS, plain HTML/CSS.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `js/utils.js` | Create | `isHttpUrl`, `mk`, `videoEmbedUrl` — loaded by every page |
| `js/home.js` | Create | `news` Firestore listener + render news cards |
| `js/research.js` | Create | `projects` Firestore listener + render project cards |
| `js/team.js` | Create | `team` Firestore listener + render team cards |
| `js/publications.js` | Create | `publications` Firestore listener + render publication entries |
| `js/admin.js` | Rewrite | Auth + 4-tab panel (News/Research/Team/Publications) |
| `index.html` | Rewrite | Home page: hero, news section, about section |
| `research.html` | Create | Research page: hero with project count, project cards |
| `team.html` | Create | Team page: hero, team grid |
| `publications.html` | Create | Publications page: hero, publications list |
| `admin.html` | Rewrite | Clean admin dashboard: login overlay, tab bar, tab panels, shared modal |
| `js/app.js` | Delete | Replaced by `home.js` + `research.js` |

---

## Task 1: Shared utilities (`js/utils.js`)

**Files:**
- Create: `js/utils.js`

- [ ] **Step 1: Create `js/utils.js`**

```javascript
/* ── REACH Lab — Shared Utilities ────────────────────────────────────────── */

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
```

- [ ] **Step 2: Commit**

```bash
git add js/utils.js
git commit -m "feat: add shared utilities (isHttpUrl, mk, videoEmbedUrl)"
```

---

## Task 2: Home page (`js/home.js` + rewrite `index.html`)

**Files:**
- Create: `js/home.js`
- Rewrite: `index.html`

- [ ] **Step 1: Create `js/home.js`**

```javascript
/* ── REACH Lab — Home (News) ─────────────────────────────────────────────── */

function renderNewsItem(item) {
  const card = mk('div', 'news-card');

  const title = mk('h3', 'news-title');
  title.textContent = item.title;
  card.appendChild(title);

  const desc = mk('p', 'news-desc');
  desc.textContent = item.desc;
  card.appendChild(desc);

  if (isHttpUrl(item.link)) {
    const link = mk('a', 'news-link');
    link.href = item.link;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Read more →';
    card.appendChild(link);
  }

  return card;
}

function subscribeToNews() {
  const container = document.getElementById('news-container');

  db.collection('news')
    .orderBy('order', 'asc')
    .onSnapshot(function(snapshot) {
      container.textContent = '';
      if (snapshot.empty) {
        const empty = mk('p');
        empty.textContent = 'No news yet.';
        empty.style.cssText = 'color:var(--gray-500);text-align:center;padding:2rem 0;';
        container.appendChild(empty);
        return;
      }
      snapshot.docs.forEach(function(d) {
        container.appendChild(renderNewsItem(Object.assign({ id: d.id }, d.data())));
      });
    }, function(err) {
      console.error('Firestore read error:', err);
      container.textContent = 'Could not load news.';
    });
}

subscribeToNews();
```

- [ ] **Step 2: Rewrite `index.html`**

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

  nav { position: sticky; top: 0; z-index: 100; background: var(--navy); display: flex; align-items: center; justify-content: space-between; padding: 0 3rem; height: 64px; box-shadow: 0 2px 20px rgba(13,43,82,0.3); }
  .nav-logo { display: flex; align-items: center; gap: 12px; text-decoration: none; }
  .nav-logo-mark { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 22px; color: var(--sky-light); letter-spacing: -0.5px; }
  .nav-logo-sub { font-size: 11px; font-weight: 300; color: var(--gray-300); letter-spacing: 0.08em; text-transform: uppercase; border-left: 1px solid rgba(255,255,255,0.2); padding-left: 12px; line-height: 1.3; }
  .nav-links { display: flex; gap: 2rem; list-style: none; }
  .nav-links a { color: var(--gray-300); text-decoration: none; font-size: 13.5px; font-weight: 400; letter-spacing: 0.03em; transition: color 0.2s; }
  .nav-links a:hover { color: var(--white); }
  .nav-links a.nav-active { color: var(--sky-light); }

  .hero { background: linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 60%, #1e4d80 100%); color: white; padding: 90px 3rem 80px; position: relative; overflow: hidden; }
  .hero::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 75% 50%, rgba(43,135,200,0.15) 0%, transparent 65%); pointer-events: none; }
  .hero-inner { max-width: 900px; margin: 0 auto; position: relative; }
  .hero-tag { font-size: 11px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: var(--sky-light); margin-bottom: 1.2rem; }
  h1.hero-title { font-family: 'Syne', sans-serif; font-size: clamp(2.4rem, 5vw, 3.6rem); font-weight: 800; line-height: 1.1; letter-spacing: -1px; color: var(--white); margin-bottom: 1.2rem; }
  h1.hero-title span { color: var(--sky-light); }
  .hero-desc { font-size: 17px; font-weight: 300; color: rgba(255,255,255,0.75); max-width: 640px; line-height: 1.75; }

  .section { padding: 80px 3rem; }
  .section-inner { max-width: 960px; margin: 0 auto; }
  .section-title { font-family: 'Syne', sans-serif; font-size: 1.6rem; font-weight: 700; color: var(--navy); letter-spacing: -0.3px; margin-bottom: 2.5rem; display: flex; align-items: center; gap: 12px; }
  .section-title::after { content: ''; flex: 1; height: 1px; background: var(--border); }
  .alt-bg { background: var(--section-bg); }

  #news-container { display: flex; flex-direction: column; gap: 1.5rem; }
  .news-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 10px; padding: 1.8rem 2rem; transition: box-shadow 0.25s; }
  .news-card:hover { box-shadow: 0 6px 32px rgba(13,43,82,0.1); }
  .news-title { font-family: 'Syne', sans-serif; font-size: 1.1rem; font-weight: 700; color: var(--navy); margin-bottom: 0.5rem; }
  .news-desc { font-size: 14.5px; color: var(--text-muted); line-height: 1.75; margin-bottom: 0.8rem; }
  .news-link { font-size: 13px; color: var(--sky); text-decoration: none; font-weight: 500; }
  .news-link:hover { text-decoration: underline; }

  @media (max-width: 700px) {
    nav { padding: 0 1.2rem; }
    .hero, .section { padding-left: 1.2rem; padding-right: 1.2rem; }
  }

  footer { background: var(--navy); color: rgba(255,255,255,0.55); text-align: center; padding: 2rem 3rem; font-size: 13px; }
  footer a { color: var(--sky-light); text-decoration: none; }
  footer a:hover { text-decoration: underline; }
</style>
</head>
<body>

<nav>
  <a class="nav-logo" href="index.html">
    <span class="nav-logo-mark">REACH</span>
    <span class="nav-logo-sub">Robot Learning<br>&amp; Control Lab</span>
  </a>
  <ul class="nav-links">
    <li><a href="index.html" class="nav-active">Home</a></li>
    <li><a href="research.html">Research</a></li>
    <li><a href="team.html">Team</a></li>
    <li><a href="publications.html">Publications</a></li>
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
  </div>
</section>

<section class="section" id="news">
  <div class="section-inner">
    <h2 class="section-title">News</h2>
    <div id="news-container"></div>
  </div>
</section>

<section class="section alt-bg" id="about">
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
<script src="js/utils.js"></script>
<script src="js/home.js"></script>
</body>
</html>
```

- [ ] **Step 3: Verify in browser**

Run: `npx serve .` and open `http://localhost:3000/index.html`

Expected:
- Nav shows: Home (highlighted blue) · Research · Team · Publications
- Hero shows lab name and tagline, no project count
- News section shows "No news yet." (empty state)
- About section shows static text
- No console errors

- [ ] **Step 4: Commit**

```bash
git add js/home.js index.html
git commit -m "feat: add home page with news section"
```

---

## Task 3: Research page (`js/research.js` + `research.html`)

**Files:**
- Create: `js/research.js`
- Create: `research.html`

- [ ] **Step 1: Create `js/research.js`**

```javascript
/* ── REACH Lab — Research (Projects) ────────────────────────────────────── */

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

function renderProject(p) {
  const card = mk('div', 'project-card');
  card.id = 'project-' + String(p.id).replace(/[^a-zA-Z0-9_-]/g, '');
  const inner = mk('div', 'project-card-inner');
  inner.appendChild(buildContentCol(p));
  inner.appendChild(buildMediaCol(p));
  card.appendChild(inner);
  return card;
}

function subscribeToProjects() {
  const container = document.getElementById('projects-container');

  db.collection('projects')
    .orderBy('order', 'asc')
    .onSnapshot(function(snapshot) {
      container.textContent = '';
      if (snapshot.empty) {
        const empty = mk('p');
        empty.textContent = 'No research projects yet.';
        empty.style.cssText = 'color:var(--gray-500);text-align:center;padding:2rem 0;';
        container.appendChild(empty);
        document.getElementById('meta-projects').textContent = '0';
        return;
      }
      const projects = snapshot.docs.map(function(d) {
        return Object.assign({ id: d.id }, d.data());
      });
      projects.forEach(function(p) { container.appendChild(renderProject(p)); });
      document.getElementById('meta-projects').textContent = projects.length;
    }, function(err) {
      console.error('Firestore read error:', err);
      container.textContent = 'Could not load projects.';
    });
}

subscribeToProjects();
```

- [ ] **Step 2: Create `research.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Research — REACH Lab | NYU Abu Dhabi</title>
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

  nav { position: sticky; top: 0; z-index: 100; background: var(--navy); display: flex; align-items: center; justify-content: space-between; padding: 0 3rem; height: 64px; box-shadow: 0 2px 20px rgba(13,43,82,0.3); }
  .nav-logo { display: flex; align-items: center; gap: 12px; text-decoration: none; }
  .nav-logo-mark { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 22px; color: var(--sky-light); letter-spacing: -0.5px; }
  .nav-logo-sub { font-size: 11px; font-weight: 300; color: var(--gray-300); letter-spacing: 0.08em; text-transform: uppercase; border-left: 1px solid rgba(255,255,255,0.2); padding-left: 12px; line-height: 1.3; }
  .nav-links { display: flex; gap: 2rem; list-style: none; }
  .nav-links a { color: var(--gray-300); text-decoration: none; font-size: 13.5px; font-weight: 400; letter-spacing: 0.03em; transition: color 0.2s; }
  .nav-links a:hover { color: var(--white); }
  .nav-links a.nav-active { color: var(--sky-light); }

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

  footer { background: var(--navy); color: rgba(255,255,255,0.55); text-align: center; padding: 2rem 3rem; font-size: 13px; }
  footer a { color: var(--sky-light); text-decoration: none; }
  footer a:hover { text-decoration: underline; }
</style>
</head>
<body>

<nav>
  <a class="nav-logo" href="index.html">
    <span class="nav-logo-mark">REACH</span>
    <span class="nav-logo-sub">Robot Learning<br>&amp; Control Lab</span>
  </a>
  <ul class="nav-links">
    <li><a href="index.html">Home</a></li>
    <li><a href="research.html" class="nav-active">Research</a></li>
    <li><a href="team.html">Team</a></li>
    <li><a href="publications.html">Publications</a></li>
  </ul>
</nav>

<section class="hero">
  <div class="hero-inner">
    <p class="hero-tag">NYU Abu Dhabi · Division of Engineering</p>
    <h1 class="hero-title">Current <span>Research</span></h1>
    <p class="hero-desc">
      Advancing robotic learning, manipulation, and human-robot collaboration through
      fundamental research and real-world deployment.
    </p>
    <div class="hero-meta">
      <div class="hero-meta-item"><strong id="meta-projects">—</strong><span>Active Projects</span></div>
      <div class="hero-meta-item"><strong>NYU AD</strong><span>Abu Dhabi, UAE</span></div>
      <div class="hero-meta-item"><strong>2024</strong><span>Founded</span></div>
    </div>
  </div>
</section>

<section class="section" id="projects">
  <div class="section-inner">
    <h2 class="section-title">Research Projects</h2>
    <div id="projects-container"></div>
  </div>
</section>

<footer>
  <p>REACH Lab · Robot Learning and Control Lab · NYU Abu Dhabi &nbsp;·&nbsp; 2024–2025</p>
  <p style="margin-top:6px;"><a href="https://nyuad.nyu.edu/en/research/faculty-labs-and-projects.html">NYU Abu Dhabi Research</a></p>
</footer>

<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js"></script>
<script src="js/firebase-config.js"></script>
<script src="js/utils.js"></script>
<script src="js/research.js"></script>
</body>
</html>
```

- [ ] **Step 3: Verify in browser**

Open `http://localhost:3000/research.html`

Expected:
- Nav shows: Home · Research (highlighted) · Team · Publications
- Hero shows "Current Research" heading with "— Active Projects" counter
- Projects section shows "No research projects yet." (empty state)
- No console errors

- [ ] **Step 4: Commit**

```bash
git add js/research.js research.html
git commit -m "feat: add research page"
```

---

## Task 4: Team page (`js/team.js` + `team.html`)

**Files:**
- Create: `js/team.js`
- Create: `team.html`

- [ ] **Step 1: Create `js/team.js`**

```javascript
/* ── REACH Lab — Team ────────────────────────────────────────────────────── */

function getInitials(name) {
  return String(name).split(' ').filter(Boolean).slice(0, 2).map(function(w) {
    return w[0].toUpperCase();
  }).join('');
}

function renderTeamMember(member) {
  const card = mk('div', 'team-card');

  const photoDiv = mk('div', 'team-photo');
  if (isHttpUrl(member.photo)) {
    const img = mk('img');
    img.src = member.photo;
    img.alt = member.name;
    photoDiv.appendChild(img);
  } else {
    const initials = mk('span', 'team-photo-initials');
    initials.textContent = getInitials(member.name);
    photoDiv.appendChild(initials);
  }
  card.appendChild(photoDiv);

  const name = mk('div', 'team-name');
  name.textContent = member.name;
  card.appendChild(name);

  const role = mk('div', 'team-role');
  role.textContent = member.role;
  card.appendChild(role);

  if (member.bio) {
    const bio = mk('p', 'team-bio');
    bio.textContent = member.bio;
    card.appendChild(bio);
  }

  return card;
}

function subscribeToTeam() {
  const container = document.getElementById('team-container');

  db.collection('team')
    .orderBy('order', 'asc')
    .onSnapshot(function(snapshot) {
      container.textContent = '';
      if (snapshot.empty) {
        const empty = mk('p');
        empty.textContent = 'No team members yet.';
        empty.style.cssText = 'color:var(--gray-500);text-align:center;padding:2rem 0;';
        container.appendChild(empty);
        return;
      }
      snapshot.docs.forEach(function(d) {
        container.appendChild(renderTeamMember(Object.assign({ id: d.id }, d.data())));
      });
    }, function(err) {
      console.error('Firestore read error:', err);
      container.textContent = 'Could not load team.';
    });
}

subscribeToTeam();
```

- [ ] **Step 2: Create `team.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Team — REACH Lab | NYU Abu Dhabi</title>
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

  nav { position: sticky; top: 0; z-index: 100; background: var(--navy); display: flex; align-items: center; justify-content: space-between; padding: 0 3rem; height: 64px; box-shadow: 0 2px 20px rgba(13,43,82,0.3); }
  .nav-logo { display: flex; align-items: center; gap: 12px; text-decoration: none; }
  .nav-logo-mark { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 22px; color: var(--sky-light); letter-spacing: -0.5px; }
  .nav-logo-sub { font-size: 11px; font-weight: 300; color: var(--gray-300); letter-spacing: 0.08em; text-transform: uppercase; border-left: 1px solid rgba(255,255,255,0.2); padding-left: 12px; line-height: 1.3; }
  .nav-links { display: flex; gap: 2rem; list-style: none; }
  .nav-links a { color: var(--gray-300); text-decoration: none; font-size: 13.5px; font-weight: 400; letter-spacing: 0.03em; transition: color 0.2s; }
  .nav-links a:hover { color: var(--white); }
  .nav-links a.nav-active { color: var(--sky-light); }

  .hero { background: linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 60%, #1e4d80 100%); color: white; padding: 90px 3rem 80px; position: relative; overflow: hidden; }
  .hero::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 75% 50%, rgba(43,135,200,0.15) 0%, transparent 65%); pointer-events: none; }
  .hero-inner { max-width: 900px; margin: 0 auto; position: relative; }
  .hero-tag { font-size: 11px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: var(--sky-light); margin-bottom: 1.2rem; }
  h1.hero-title { font-family: 'Syne', sans-serif; font-size: clamp(2.4rem, 5vw, 3.6rem); font-weight: 800; line-height: 1.1; letter-spacing: -1px; color: var(--white); margin-bottom: 1.2rem; }
  h1.hero-title span { color: var(--sky-light); }
  .hero-desc { font-size: 17px; font-weight: 300; color: rgba(255,255,255,0.75); max-width: 640px; line-height: 1.75; }

  .section { padding: 80px 3rem; }
  .section-inner { max-width: 960px; margin: 0 auto; }
  .section-title { font-family: 'Syne', sans-serif; font-size: 1.6rem; font-weight: 700; color: var(--navy); letter-spacing: -0.3px; margin-bottom: 2.5rem; display: flex; align-items: center; gap: 12px; }
  .section-title::after { content: ''; flex: 1; height: 1px; background: var(--border); }

  .team-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1.5rem; }
  .team-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 10px; padding: 1.8rem; text-align: center; transition: box-shadow 0.25s; }
  .team-card:hover { box-shadow: 0 6px 32px rgba(13,43,82,0.1); }
  .team-photo { width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 1rem; overflow: hidden; background: var(--navy-mid); display: flex; align-items: center; justify-content: center; }
  .team-photo img { width: 100%; height: 100%; object-fit: cover; }
  .team-photo-initials { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 22px; color: var(--sky-light); }
  .team-name { font-family: 'Syne', sans-serif; font-weight: 600; font-size: 1rem; color: var(--navy); }
  .team-role { font-size: 13px; color: var(--sky); margin-top: 4px; margin-bottom: 0.8rem; font-weight: 500; }
  .team-bio { font-size: 13.5px; color: var(--text-muted); line-height: 1.7; text-align: left; }

  @media (max-width: 700px) {
    nav { padding: 0 1.2rem; }
    .hero, .section { padding-left: 1.2rem; padding-right: 1.2rem; }
    .team-grid { grid-template-columns: 1fr 1fr; }
  }

  footer { background: var(--navy); color: rgba(255,255,255,0.55); text-align: center; padding: 2rem 3rem; font-size: 13px; }
  footer a { color: var(--sky-light); text-decoration: none; }
  footer a:hover { text-decoration: underline; }
</style>
</head>
<body>

<nav>
  <a class="nav-logo" href="index.html">
    <span class="nav-logo-mark">REACH</span>
    <span class="nav-logo-sub">Robot Learning<br>&amp; Control Lab</span>
  </a>
  <ul class="nav-links">
    <li><a href="index.html">Home</a></li>
    <li><a href="research.html">Research</a></li>
    <li><a href="team.html" class="nav-active">Team</a></li>
    <li><a href="publications.html">Publications</a></li>
  </ul>
</nav>

<section class="hero">
  <div class="hero-inner">
    <p class="hero-tag">NYU Abu Dhabi · Division of Engineering</p>
    <h1 class="hero-title">Our <span>Team</span></h1>
    <p class="hero-desc">
      The people behind REACH Lab — researchers, engineers, and students
      working at the frontier of robot learning and control.
    </p>
  </div>
</section>

<section class="section" id="team">
  <div class="section-inner">
    <h2 class="section-title">Lab Members</h2>
    <div id="team-container" class="team-grid"></div>
  </div>
</section>

<footer>
  <p>REACH Lab · Robot Learning and Control Lab · NYU Abu Dhabi &nbsp;·&nbsp; 2024–2025</p>
  <p style="margin-top:6px;"><a href="https://nyuad.nyu.edu/en/research/faculty-labs-and-projects.html">NYU Abu Dhabi Research</a></p>
</footer>

<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js"></script>
<script src="js/firebase-config.js"></script>
<script src="js/utils.js"></script>
<script src="js/team.js"></script>
</body>
</html>
```

- [ ] **Step 3: Verify in browser**

Open `http://localhost:3000/team.html`

Expected:
- Nav shows: Home · Research · Team (highlighted) · Publications
- Shows "No team members yet." (empty state)
- No console errors

- [ ] **Step 4: Commit**

```bash
git add js/team.js team.html
git commit -m "feat: add team page"
```

---

## Task 5: Publications page (`js/publications.js` + `publications.html`)

**Files:**
- Create: `js/publications.js`
- Create: `publications.html`

- [ ] **Step 1: Create `js/publications.js`**

```javascript
/* ── REACH Lab — Publications ────────────────────────────────────────────── */

function renderPublication(pub) {
  const entry = mk('div', 'pub-entry');

  const titleDiv = mk('div', 'pub-entry-title');
  if (isHttpUrl(pub.link)) {
    const link = mk('a');
    link.href = pub.link;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = pub.title;
    titleDiv.appendChild(link);
  } else {
    titleDiv.textContent = pub.title;
  }
  entry.appendChild(titleDiv);

  const meta = mk('p', 'pub-entry-meta');
  const authors = mk('span');
  authors.textContent = pub.authors;
  meta.appendChild(authors);

  if (pub.venue || pub.year) {
    meta.append(' · ');
    const venueYear = mk('span');
    const parts = [];
    if (pub.venue) parts.push(pub.venue);
    if (pub.year) parts.push(String(pub.year));
    venueYear.textContent = parts.join(' ');
    meta.appendChild(venueYear);
  }
  entry.appendChild(meta);

  return entry;
}

function subscribeToPublications() {
  const container = document.getElementById('publications-list');

  db.collection('publications')
    .orderBy('order', 'asc')
    .onSnapshot(function(snapshot) {
      container.textContent = '';
      if (snapshot.empty) {
        const empty = mk('p');
        empty.textContent = 'No publications yet.';
        empty.style.cssText = 'color:var(--gray-500);text-align:center;padding:2rem 0;';
        container.appendChild(empty);
        return;
      }
      snapshot.docs.forEach(function(d) {
        container.appendChild(renderPublication(Object.assign({ id: d.id }, d.data())));
      });
    }, function(err) {
      console.error('Firestore read error:', err);
      container.textContent = 'Could not load publications.';
    });
}

subscribeToPublications();
```

- [ ] **Step 2: Create `publications.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Publications — REACH Lab | NYU Abu Dhabi</title>
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

  nav { position: sticky; top: 0; z-index: 100; background: var(--navy); display: flex; align-items: center; justify-content: space-between; padding: 0 3rem; height: 64px; box-shadow: 0 2px 20px rgba(13,43,82,0.3); }
  .nav-logo { display: flex; align-items: center; gap: 12px; text-decoration: none; }
  .nav-logo-mark { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 22px; color: var(--sky-light); letter-spacing: -0.5px; }
  .nav-logo-sub { font-size: 11px; font-weight: 300; color: var(--gray-300); letter-spacing: 0.08em; text-transform: uppercase; border-left: 1px solid rgba(255,255,255,0.2); padding-left: 12px; line-height: 1.3; }
  .nav-links { display: flex; gap: 2rem; list-style: none; }
  .nav-links a { color: var(--gray-300); text-decoration: none; font-size: 13.5px; font-weight: 400; letter-spacing: 0.03em; transition: color 0.2s; }
  .nav-links a:hover { color: var(--white); }
  .nav-links a.nav-active { color: var(--sky-light); }

  .hero { background: linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 60%, #1e4d80 100%); color: white; padding: 90px 3rem 80px; position: relative; overflow: hidden; }
  .hero::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 75% 50%, rgba(43,135,200,0.15) 0%, transparent 65%); pointer-events: none; }
  .hero-inner { max-width: 900px; margin: 0 auto; position: relative; }
  .hero-tag { font-size: 11px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: var(--sky-light); margin-bottom: 1.2rem; }
  h1.hero-title { font-family: 'Syne', sans-serif; font-size: clamp(2.4rem, 5vw, 3.6rem); font-weight: 800; line-height: 1.1; letter-spacing: -1px; color: var(--white); margin-bottom: 1.2rem; }
  h1.hero-title span { color: var(--sky-light); }
  .hero-desc { font-size: 17px; font-weight: 300; color: rgba(255,255,255,0.75); max-width: 640px; line-height: 1.75; }

  .section { padding: 80px 3rem; }
  .section-inner { max-width: 960px; margin: 0 auto; }
  .section-title { font-family: 'Syne', sans-serif; font-size: 1.6rem; font-weight: 700; color: var(--navy); letter-spacing: -0.3px; margin-bottom: 2.5rem; display: flex; align-items: center; gap: 12px; }
  .section-title::after { content: ''; flex: 1; height: 1px; background: var(--border); }

  #publications-list { display: flex; flex-direction: column; gap: 1rem; }
  .pub-entry { background: var(--card-bg); border: 1px solid var(--border); border-radius: 8px; padding: 1.4rem 1.8rem; transition: box-shadow 0.25s; }
  .pub-entry:hover { box-shadow: 0 4px 20px rgba(13,43,82,0.08); }
  .pub-entry-title { font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 700; color: var(--navy); margin-bottom: 0.4rem; }
  .pub-entry-title a { color: inherit; text-decoration: none; }
  .pub-entry-title a:hover { color: var(--sky); }
  .pub-entry-meta { font-size: 13px; color: var(--text-muted); line-height: 1.6; }

  @media (max-width: 700px) {
    nav { padding: 0 1.2rem; }
    .hero, .section { padding-left: 1.2rem; padding-right: 1.2rem; }
  }

  footer { background: var(--navy); color: rgba(255,255,255,0.55); text-align: center; padding: 2rem 3rem; font-size: 13px; }
  footer a { color: var(--sky-light); text-decoration: none; }
  footer a:hover { text-decoration: underline; }
</style>
</head>
<body>

<nav>
  <a class="nav-logo" href="index.html">
    <span class="nav-logo-mark">REACH</span>
    <span class="nav-logo-sub">Robot Learning<br>&amp; Control Lab</span>
  </a>
  <ul class="nav-links">
    <li><a href="index.html">Home</a></li>
    <li><a href="research.html">Research</a></li>
    <li><a href="team.html">Team</a></li>
    <li><a href="publications.html" class="nav-active">Publications</a></li>
  </ul>
</nav>

<section class="hero">
  <div class="hero-inner">
    <p class="hero-tag">NYU Abu Dhabi · Division of Engineering</p>
    <h1 class="hero-title"><span>Publications</span></h1>
    <p class="hero-desc">
      Peer-reviewed research from the REACH Lab on robot learning, manipulation,
      and human-robot collaboration.
    </p>
  </div>
</section>

<section class="section" id="publications">
  <div class="section-inner">
    <h2 class="section-title">All Publications</h2>
    <div id="publications-list"></div>
  </div>
</section>

<footer>
  <p>REACH Lab · Robot Learning and Control Lab · NYU Abu Dhabi &nbsp;·&nbsp; 2024–2025</p>
  <p style="margin-top:6px;"><a href="https://nyuad.nyu.edu/en/research/faculty-labs-and-projects.html">NYU Abu Dhabi Research</a></p>
</footer>

<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js"></script>
<script src="js/firebase-config.js"></script>
<script src="js/utils.js"></script>
<script src="js/publications.js"></script>
</body>
</html>
```

- [ ] **Step 3: Verify in browser**

Open `http://localhost:3000/publications.html`

Expected:
- Nav shows: Home · Research · Team · Publications (highlighted)
- Shows "No publications yet." (empty state)
- No console errors

- [ ] **Step 4: Commit**

```bash
git add js/publications.js publications.html
git commit -m "feat: add publications page"
```

---

## Task 6: Admin panel rewrite (`admin.html` + `js/admin.js`)

**Files:**
- Rewrite: `admin.html`
- Rewrite: `js/admin.js`

- [ ] **Step 1: Rewrite `admin.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>REACH Lab — Admin</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=IBM+Plex+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap" rel="stylesheet">
<style>
  :root {
    --navy: #0d2b52; --navy-mid: #1a3f6f; --navy-light: #2a5fa0;
    --sky: #2b87c8; --sky-light: #3fa3e0; --sky-pale: #daeef8;
    --white: #ffffff; --off-white: #f5f8fb;
    --gray-100: #eaeff5; --gray-300: #b0bece; --gray-500: #6b7f95; --gray-700: #334560;
    --text: #0f1e32; --text-muted: #4a6080;
    --border: rgba(42,95,160,0.15); --card-bg: #ffffff;
  }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'IBM Plex Sans', sans-serif; background: var(--off-white); color: var(--text); font-size: 16px; min-height: 100vh; }

  nav { background: var(--navy); display: flex; align-items: center; justify-content: space-between; padding: 0 3rem; height: 64px; box-shadow: 0 2px 20px rgba(13,43,82,0.3); }
  .nav-logo-mark { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 20px; color: var(--sky-light); letter-spacing: -0.5px; }
  .nav-logo-mark span { font-weight: 400; font-size: 13px; color: var(--gray-300); margin-left: 8px; }
  #admin-nav-controls { display: none; align-items: center; gap: 12px; }
  #admin-user-email { font-size: 12px; color: var(--gray-300); }
  .btn-logout { background: none; border: 1px solid rgba(255,255,255,0.2); color: var(--gray-300); font-size: 12px; padding: 5px 12px; border-radius: 4px; cursor: pointer; font-family: inherit; }
  .btn-logout:hover { border-color: rgba(255,255,255,0.4); color: var(--white); }

  .admin-main { max-width: 960px; margin: 0 auto; padding: 2rem 3rem; }

  .admin-tab-bar { display: flex; border-bottom: 2px solid var(--border); margin-bottom: 2rem; }
  .tab-btn { padding: 10px 24px; background: none; border: none; border-bottom: 2px solid transparent; margin-bottom: -2px; font-size: 14px; font-family: 'IBM Plex Sans', sans-serif; color: var(--gray-500); cursor: pointer; transition: color 0.2s, border-color 0.2s; }
  .tab-btn:hover { color: var(--navy); }
  .tab-btn.tab-active { color: var(--sky); border-bottom-color: var(--sky); font-weight: 500; }

  .tab-panel { display: none; }
  .tab-panel.tab-panel-active { display: block; }
  .tab-panel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.2rem; }
  .tab-panel-title { font-family: 'Syne', sans-serif; font-size: 1.3rem; font-weight: 700; color: var(--navy); }
  .btn-admin { background: var(--navy); color: white; border: none; padding: 8px 18px; border-radius: 4px; font-size: 13px; cursor: pointer; font-family: 'IBM Plex Sans', sans-serif; transition: background 0.2s; }
  .btn-admin:hover { background: var(--navy-mid); }

  .admin-item-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border: 1px solid var(--border); border-radius: 8px; margin-bottom: 8px; background: var(--card-bg); }
  .admin-item-info { flex: 1; min-width: 0; margin-right: 12px; }
  .admin-item-title { font-size: 14px; font-weight: 600; color: var(--navy); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .admin-item-subtitle { font-size: 12px; color: var(--gray-500); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .btn-admin-delete { background: none; border: 1px solid #eee; border-radius: 4px; padding: 5px 12px; font-size: 12px; color: #cc4444; cursor: pointer; white-space: nowrap; font-family: inherit; flex-shrink: 0; transition: background 0.2s; }
  .btn-admin-delete:hover { background: #fff0f0; border-color: #cc4444; }

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

  @media (max-width: 700px) {
    nav { padding: 0 1.2rem; }
    .admin-main { padding: 1.5rem 1.2rem; }
    .tab-btn { padding: 10px 14px; font-size: 13px; }
  }
</style>
</head>
<body>

<!-- Login overlay -->
<div id="login-card" style="position:fixed;inset:0;z-index:300;background:rgba(10,25,50,0.88);display:flex;align-items:center;justify-content:center;padding:1.5rem;">
  <div style="background:white;border-radius:12px;width:100%;max-width:400px;padding:2.5rem;box-shadow:0 20px 60px rgba(13,43,82,0.4);">
    <h2 style="font-family:'Syne',sans-serif;font-size:1.3rem;font-weight:700;color:var(--navy);margin-bottom:0.4rem;">Admin Sign In</h2>
    <p style="font-size:13px;color:var(--text-muted);margin-bottom:1.6rem;">REACH Lab · NYU Abu Dhabi</p>
    <div class="form-group">
      <label for="login-email">Email</label>
      <input type="email" id="login-email" placeholder="you@nyu.edu" autocomplete="email">
    </div>
    <div class="form-group">
      <label for="login-password">Password</label>
      <input type="password" id="login-password" placeholder="••••••••" autocomplete="current-password">
    </div>
    <p id="login-error" style="font-size:13px;color:#cc4444;min-height:1.4em;margin-bottom:0.8rem;"></p>
    <button id="login-btn" onclick="handleLogin()" style="width:100%;background:var(--navy);border:none;border-radius:6px;padding:11px;font-family:'Syne',sans-serif;font-size:14px;font-weight:600;color:white;cursor:pointer;transition:background 0.2s;">Sign In</button>
  </div>
</div>

<nav>
  <div class="nav-logo-mark">REACH<span>Admin</span></div>
  <div id="admin-nav-controls">
    <span id="admin-user-email"></span>
    <button class="btn-logout" onclick="handleLogout()">Logout</button>
  </div>
</nav>

<main class="admin-main">
  <div class="admin-tab-bar">
    <button id="tab-btn-news" class="tab-btn tab-active" onclick="switchTab('news')">News</button>
    <button id="tab-btn-research" class="tab-btn" onclick="switchTab('research')">Research</button>
    <button id="tab-btn-team" class="tab-btn" onclick="switchTab('team')">Team</button>
    <button id="tab-btn-publications" class="tab-btn" onclick="switchTab('publications')">Publications</button>
  </div>

  <!-- News tab -->
  <div id="tab-news" class="tab-panel tab-panel-active">
    <div class="tab-panel-header">
      <h2 class="tab-panel-title">News</h2>
      <button class="btn-admin" onclick="openModal()">&#xFF0B; Add News</button>
    </div>
    <div id="news-list"></div>
  </div>

  <!-- Research tab -->
  <div id="tab-research" class="tab-panel">
    <div class="tab-panel-header">
      <h2 class="tab-panel-title">Research</h2>
      <button class="btn-admin" onclick="openModal()">&#xFF0B; Add Project</button>
    </div>
    <div id="research-list"></div>
  </div>

  <!-- Team tab -->
  <div id="tab-team" class="tab-panel">
    <div class="tab-panel-header">
      <h2 class="tab-panel-title">Team</h2>
      <button class="btn-admin" onclick="openModal()">&#xFF0B; Add Member</button>
    </div>
    <div id="team-list"></div>
  </div>

  <!-- Publications tab -->
  <div id="tab-publications" class="tab-panel">
    <div class="tab-panel-header">
      <h2 class="tab-panel-title">Publications</h2>
      <button class="btn-admin" onclick="openModal()">&#xFF0B; Add Publication</button>
    </div>
    <div id="publications-list"></div>
  </div>
</main>

<!-- Shared modal with 4 form sections -->
<div class="modal-backdrop" id="modal-backdrop" onclick="handleBackdropClick(event)">
  <div class="modal">
    <div class="modal-header">
      <h2 id="modal-title">Add Item</h2>
      <button class="modal-close" onclick="closeModal()">&#x2715;</button>
    </div>

    <!-- News form -->
    <div id="modal-form-news">
      <div class="form-group">
        <label for="fn-title">Title *</label>
        <input type="text" id="fn-title" placeholder="e.g. Lab wins Best Paper at ICRA 2025">
      </div>
      <div class="form-group">
        <label for="fn-desc">Description *</label>
        <textarea id="fn-desc" placeholder="Short description of the news item"></textarea>
      </div>
      <div class="form-group">
        <label for="fn-link">Link (optional)</label>
        <input type="url" id="fn-link" placeholder="https://...">
      </div>
      <div class="modal-actions">
        <button class="btn-cancel" onclick="closeModal()">Cancel</button>
        <button class="btn-submit" id="fn-submit" onclick="submitNews()">Add News &#x2192;</button>
      </div>
    </div>

    <!-- Research form -->
    <div id="modal-form-research" style="display:none;">
      <div class="form-group">
        <label for="f-title">Project Title *</label>
        <input type="text" id="f-title" placeholder="e.g. Dexterous Manipulation via Imitation Learning">
      </div>
      <div class="form-group">
        <label for="f-tag">Research Area / Tag</label>
        <input type="text" id="f-tag" placeholder="e.g. Robot Learning · Manipulation">
      </div>
      <div class="form-group">
        <label for="f-desc">Description *</label>
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
        <button class="btn-submit" id="fr-submit" onclick="submitProject()">Add Project &#x2192;</button>
      </div>
    </div>

    <!-- Team form -->
    <div id="modal-form-team" style="display:none;">
      <div class="form-group">
        <label for="ft-name">Name *</label>
        <input type="text" id="ft-name" placeholder="e.g. Prof. Fares Abu-Dakka">
      </div>
      <div class="form-group">
        <label for="ft-role">Role *</label>
        <input type="text" id="ft-role" placeholder="e.g. Principal Investigator">
      </div>
      <div class="form-group">
        <label for="ft-photo">Photo URL (optional)</label>
        <input type="url" id="ft-photo" placeholder="https://...">
      </div>
      <div class="form-group">
        <label for="ft-bio">Bio (optional)</label>
        <textarea id="ft-bio" placeholder="Short bio text"></textarea>
      </div>
      <div class="modal-actions">
        <button class="btn-cancel" onclick="closeModal()">Cancel</button>
        <button class="btn-submit" id="ft-submit" onclick="submitTeamMember()">Add Member &#x2192;</button>
      </div>
    </div>

    <!-- Publications form -->
    <div id="modal-form-publications" style="display:none;">
      <div class="form-group">
        <label for="fp-title">Title *</label>
        <input type="text" id="fp-title" placeholder="e.g. Robot skill learning via compliance-driven RL">
      </div>
      <div class="form-group">
        <label for="fp-authors">Authors *</label>
        <input type="text" id="fp-authors" placeholder="e.g. Abu-Dakka et al.">
      </div>
      <div class="form-group">
        <label for="fp-venue">Venue / Journal</label>
        <input type="text" id="fp-venue" placeholder="e.g. IEEE RA-L">
      </div>
      <div class="form-group">
        <label for="fp-year">Year</label>
        <input type="number" id="fp-year" placeholder="2024" min="1900" max="2100">
      </div>
      <div class="form-group">
        <label for="fp-link">Link (optional)</label>
        <input type="url" id="fp-link" placeholder="https://... (PDF or DOI)">
      </div>
      <div class="modal-actions">
        <button class="btn-cancel" onclick="closeModal()">Cancel</button>
        <button class="btn-submit" id="fp-submit" onclick="submitPublication()">Add Publication &#x2192;</button>
      </div>
    </div>

  </div>
</div>

<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js"></script>
<script src="js/firebase-config.js"></script>
<script src="js/utils.js"></script>
<script src="js/admin.js"></script>
</body>
</html>
```

- [ ] **Step 2: Rewrite `js/admin.js`**

```javascript
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
```

- [ ] **Step 3: Verify in browser**

Open `http://localhost:3000/admin.html`

Expected:
- Login overlay covers the page
- Sign in with your Firebase admin credentials
- After login: overlay disappears, nav shows email + Logout button
- Four tabs appear: News, Research, Team, Publications
- Each tab shows "No items yet."
- Click "＋ Add News" on the News tab → modal opens with News form
- Fill in title + description → click "Add News →" → item appears in the list
- Switch to Team tab → "＋ Add Member" → fill name + role → item appears
- Click "✕ Remove" on an item → confirm dialog → item disappears
- Logout → login overlay reappears
- No console errors

- [ ] **Step 4: Commit**

```bash
git add admin.html js/admin.js
git commit -m "feat: rewrite admin as 4-tab panel (news, research, team, publications)"
```

---

## Task 7: Cleanup

**Files:**
- Delete: `js/app.js`

- [ ] **Step 1: Delete `js/app.js`**

```bash
git rm js/app.js
git commit -m "chore: remove app.js (replaced by home.js and research.js)"
```

- [ ] **Step 2: Update Firestore security rules**

The current rules only cover the `projects` collection. Update them in the Firebase Console (Firestore → Rules tab) to cover all four collections:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{collection}/{docId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

Click **Publish**.

- [ ] **Step 3: Final smoke test**

With `npx serve .` running:

| Page | URL | Check |
|---|---|---|
| Home | `http://localhost:3000/index.html` | Nav links all work, news section loads |
| Research | `http://localhost:3000/research.html` | Project counter shows 0 or actual count |
| Team | `http://localhost:3000/team.html` | Team grid loads |
| Publications | `http://localhost:3000/publications.html` | Publications list loads |
| Admin | `http://localhost:3000/admin.html` | Login works, all 4 tabs functional |

Add one item in each admin tab and verify it appears on the corresponding public page without a refresh (Firestore real-time listener).

- [ ] **Step 4: Commit (if any fixes needed from smoke test)**

```bash
git add -A
git commit -m "fix: smoke test corrections"
```
