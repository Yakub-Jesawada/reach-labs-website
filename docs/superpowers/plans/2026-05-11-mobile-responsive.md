# Mobile Responsive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the REACH Lab website fully mobile-responsive by extracting shared CSS into `css/shared.css`, adding responsive breakpoints, and wiring a hamburger nav menu.

**Architecture:** Create `css/shared.css` for all common styles + responsive rules. Strip those styles from each HTML page's inline `<style>` block. Add `initMobileNav()` to `js/utils.js` and call it from each page's JS module.

**Tech Stack:** Vanilla HTML/CSS, ES modules, Vite dev server (`npm run dev`)

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `css/shared.css` | Create | All shared styles, hamburger button, responsive breakpoints |
| `js/utils.js` | Modify | Add `initMobileNav()` export |
| `index.html` | Modify | Link shared CSS, strip shared styles, add hamburger button |
| `js/home.js` | Modify | Import + call `initMobileNav()` |
| `research.html` | Modify | Link shared CSS, strip shared styles, add hamburger button |
| `js/research.js` | Modify | Import + call `initMobileNav()` |
| `team.html` | Modify | Link shared CSS, strip shared styles, add hamburger button |
| `js/team.js` | Modify | Import + call `initMobileNav()` |
| `publications.html` | Modify | Link shared CSS, strip shared styles, add hamburger button |
| `js/publications.js` | Modify | Import + call `initMobileNav()` |

---

### Task 1: Create `css/shared.css`

**Files:**
- Create: `css/shared.css`

- [ ] **Step 1: Create the `css/` directory and `shared.css`**

Create `css/shared.css` with this exact content:

```css
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
body { font-family: 'Inter', sans-serif; background: var(--off-white); color: var(--text); line-height: 1.7; font-size: 16px; }

nav { position: sticky; top: 0; z-index: 100; background: var(--navy); display: flex; align-items: center; justify-content: space-between; padding: 0 3rem; height: 72px; box-shadow: 0 2px 20px rgba(13,43,82,0.3); }
.nav-logo { display: flex; align-items: center; text-decoration: none; }
.nav-logo-img { height: 56px; width: auto; border-radius: 6px; }
.nav-links { display: flex; gap: 2rem; list-style: none; }
.nav-links a { color: var(--gray-300); text-decoration: none; font-size: 13.5px; font-weight: 400; letter-spacing: 0.03em; transition: color 0.2s; }
.nav-links a:hover { color: var(--white); }
.nav-links a.nav-active { color: var(--sky-light); }

.nav-hamburger { display: none; background: none; border: none; color: var(--gray-300); font-size: 22px; cursor: pointer; padding: 4px 8px; line-height: 1; }
.nav-hamburger:hover { color: var(--white); }

.hero { background: radial-gradient(ellipse at 50% 0%, #1a3f6f 0%, #0d1a2e 45%, #07080d 100%); color: white; padding: 60px 3rem 55px; position: relative; overflow: visible; }
.hero::before { content: ''; position: absolute; inset: -40px; background: radial-gradient(ellipse at 50% 20%, rgba(43,135,200,0.18) 0%, transparent 65%); pointer-events: none; }
.hero-inner { max-width: 700px; margin: 0 auto; position: relative; display: flex; flex-direction: column; align-items: center; text-align: center; }
.hero-logo-wrap { background: transparent; margin-bottom: 2rem; }
.hero-logo { height: 280px; width: auto; display: block; filter: brightness(0) invert(1) drop-shadow(0 0 30px rgba(43,135,200,0.5)); }
.hero-tag { font-size: 12px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: #3fa3e0; margin-bottom: 0.8rem; }
.hero-desc { font-size: 18px; font-weight: 300; color: rgba(255,255,255,0.7); max-width: 560px; line-height: 1.75; }

.section { padding: 80px 3rem; }
.section-inner { max-width: 960px; margin: 0 auto; }
.section-title { font-family: 'Inter', sans-serif; font-size: 1.6rem; font-weight: 700; color: var(--navy); letter-spacing: -0.3px; margin-bottom: 2.5rem; display: flex; align-items: center; gap: 12px; }
.section-title::after { content: ''; flex: 1; height: 1px; background: var(--border); }
.alt-bg { background: var(--section-bg); }

footer { background: var(--navy); color: rgba(255,255,255,0.55); text-align: center; padding: 2rem 3rem; font-size: 13px; }
footer a { color: var(--sky-light); text-decoration: none; }
footer a:hover { text-decoration: underline; }

@media (max-width: 768px) {
  nav { padding: 0 1.2rem; }
  .nav-links { display: none; flex-direction: column; position: absolute; top: 72px; left: 0; right: 0; background: var(--navy-mid); padding: 0.5rem 0; z-index: 99; }
  .nav-open .nav-links { display: flex; }
  .nav-open .nav-links a { padding: 14px 1.5rem; display: block; width: 100%; border-bottom: 1px solid rgba(255,255,255,0.07); }
  .nav-hamburger { display: flex; align-items: center; }
  .hero { padding: 40px 1.2rem; }
  .hero-logo { height: 160px; }
  .section { padding: 48px 1.2rem; }
}

@media (max-width: 480px) {
  .hero-logo { height: 120px; }
  .hero-desc { font-size: 16px; }
  .section-title { font-size: 1.3rem; }
}
```

- [ ] **Step 2: Start dev server and verify `css/shared.css` loads without errors**

```bash
npm run dev
```

Open `http://localhost:5173`. The page should look identical to before (no style regression). Check the browser console — no 404 for `shared.css` yet (it's not linked yet, this step just confirms the file is valid CSS by importing it temporarily in any page). Skip to Task 2 if you want to defer the visual check to Task 3.

- [ ] **Step 3: Commit**

```bash
git add css/shared.css
git commit -m "feat: add shared.css with responsive rules and hamburger nav styles"
```

---

### Task 2: Add `initMobileNav()` to `js/utils.js`

**Files:**
- Modify: `js/utils.js`

- [ ] **Step 1: Add `initMobileNav` export to `js/utils.js`**

Append this function to the end of `js/utils.js`:

```js
export function initMobileNav() {
  const nav = document.querySelector('nav')
  const btn = document.querySelector('.nav-hamburger')
  if (!btn || !nav) return

  btn.addEventListener('click', () => nav.classList.toggle('nav-open'))

  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => nav.classList.remove('nav-open'))
  })

  document.addEventListener('click', e => {
    if (!nav.contains(e.target)) nav.classList.remove('nav-open')
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add js/utils.js
git commit -m "feat: add initMobileNav utility for hamburger menu toggle"
```

---

### Task 3: Update `index.html` and `js/home.js`

**Files:**
- Modify: `index.html`
- Modify: `js/home.js`

- [ ] **Step 1: Replace the `<style>` block in `index.html`**

Replace the entire `<style>…</style>` block (lines 9–60) with:

```html
<link rel="stylesheet" href="css/shared.css">
<style>
  #news-container { display: flex; flex-direction: column; gap: 1.5rem; }
  .news-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 10px; padding: 1.8rem 2rem; transition: box-shadow 0.25s; }
  .news-card:hover { box-shadow: 0 6px 32px rgba(13,43,82,0.1); }
  .news-title { font-family: 'Inter', sans-serif; font-size: 1.1rem; font-weight: 700; color: var(--navy); margin-bottom: 0.5rem; }
  .news-desc { font-size: 14.5px; color: var(--text-muted); line-height: 1.75; margin-bottom: 0.8rem; }
  .news-link { font-size: 13px; color: var(--sky); text-decoration: none; font-weight: 500; }
  .news-link:hover { text-decoration: underline; }
</style>
```

- [ ] **Step 2: Add the hamburger button to `<nav>` in `index.html`**

Find the closing `</ul>` of `.nav-links` and add the button immediately after it, before `</nav>`:

```html
  </ul>
  <button class="nav-hamburger" aria-label="Toggle menu">&#9776;</button>
</nav>
```

- [ ] **Step 3: Update `js/home.js` to import and call `initMobileNav`**

Change the existing utils import (line 3):

```js
import { mk, isHttpUrl, initMobileNav } from './utils.js'
```

Add a call right after the imports (after line 3):

```js
initMobileNav()
```

- [ ] **Step 4: Verify in browser**

With `npm run dev` running, open `http://localhost:5173`:
- Desktop (>768px): nav looks identical to before, hamburger button hidden
- Resize to 375px wide (Chrome DevTools mobile): hamburger ☰ appears, nav links hidden
- Click ☰: links drop down in a navy drawer
- Click a link or tap outside: drawer closes
- Hero logo is 160px tall at 768px, 120px at 480px
- Section padding is reduced on mobile

- [ ] **Step 5: Commit**

```bash
git add index.html js/home.js
git commit -m "feat: mobile responsive index page with hamburger nav"
```

---

### Task 4: Update `research.html` and `js/research.js`

**Files:**
- Modify: `research.html`
- Modify: `js/research.js`

- [ ] **Step 1: Replace the `<style>` block in `research.html`**

Replace the entire `<style>…</style>` block (lines 9–77) with:

```html
<link rel="stylesheet" href="css/shared.css">
<style>
  .hero-meta { display: flex; gap: 2.5rem; justify-content: center; flex-wrap: wrap; }
  .hero-meta-item { display: flex; flex-direction: column; gap: 2px; align-items: center; }
  .hero-meta-item strong { font-family: 'Inter', sans-serif; font-size: 1.4rem; font-weight: 700; color: #3fa3e0; }
  .hero-meta-item span { font-size: 12px; color: rgba(255,255,255,0.5); letter-spacing: 0.05em; }

  #projects-container { display: flex; flex-direction: column; gap: 3rem; }
  .project-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; transition: box-shadow 0.25s; }
  .project-card:hover { box-shadow: 0 6px 32px rgba(13,43,82,0.1); }
  .project-card-inner { display: grid; grid-template-columns: 1fr 380px; gap: 0; }
  .project-content { padding: 2rem 2.2rem; }
  .project-tag { display: inline-block; font-size: 10.5px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: var(--sky); background: var(--sky-pale); border-radius: 3px; padding: 3px 10px; margin-bottom: 1rem; }
  .project-title { font-family: 'Inter', sans-serif; font-size: 1.25rem; font-weight: 700; color: var(--navy); line-height: 1.3; margin-bottom: 0.8rem; }
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

  @media (max-width: 768px) {
    .project-card-inner { grid-template-columns: 1fr; }
    .project-media { min-height: 200px; }
  }
</style>
```

- [ ] **Step 2: Add the hamburger button to `<nav>` in `research.html`**

```html
  </ul>
  <button class="nav-hamburger" aria-label="Toggle menu">&#9776;</button>
</nav>
```

- [ ] **Step 3: Update `js/research.js` to import and call `initMobileNav`**

Change the existing utils import (line 3):

```js
import { mk, isHttpUrl, videoEmbedUrl, initMobileNav } from './utils.js'
```

Add a call right after the imports:

```js
initMobileNav()
```

- [ ] **Step 4: Verify in browser**

Open `http://localhost:5173/research.html`:
- Desktop: project cards show text + video in two columns
- Mobile (375px): project cards stack to single column, video below text
- Hamburger nav works as on index

- [ ] **Step 5: Commit**

```bash
git add research.html js/research.js
git commit -m "feat: mobile responsive research page"
```

---

### Task 5: Update `team.html` and `js/team.js`

**Files:**
- Modify: `team.html`
- Modify: `js/team.js`

- [ ] **Step 1: Replace the `<style>` block in `team.html`**

Replace the entire `<style>…</style>` block (lines 9–67) with:

```html
<link rel="stylesheet" href="css/shared.css">
<style>
  .team-section { margin-bottom: 4rem; }
  .team-section-title { font-size: 1.5rem; font-weight: 700; color: var(--navy); letter-spacing: -0.2px; margin-bottom: 0.5rem; }
  .team-section-rule { height: 2px; background: var(--border); margin-bottom: 2rem; }
  .team-card { display: flex; gap: 2.4rem; align-items: flex-start; padding: 1.8rem 0; border-bottom: 1px solid var(--border); }
  .team-card:last-child { border-bottom: none; }
  .team-photo { width: 220px; flex-shrink: 0; overflow: hidden; border-radius: 4px; background: var(--gray-100); aspect-ratio: 3/4; display: flex; align-items: center; justify-content: center; }
  .team-photo img { width: 100%; height: 100%; object-fit: cover; }
  .team-photo-initials { font-family: 'Inter', sans-serif; font-weight: 700; font-size: 2.5rem; color: var(--navy-light); }
  .team-info { flex: 1; padding-top: 0.4rem; }
  .team-name { font-family: 'Inter', sans-serif; font-weight: 700; font-size: 1.4rem; color: var(--navy); margin-bottom: 0.3rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border); }
  .team-role { font-size: 13.5px; color: var(--sky); font-weight: 500; margin-bottom: 1rem; }
  .team-bio { font-size: 14.5px; color: var(--text-muted); line-height: 1.85; text-align: justify; }

  @media (max-width: 768px) {
    .team-card { flex-direction: column; gap: 1.2rem; }
    .team-photo { width: 100%; aspect-ratio: 4/3; }
  }
  @media (max-width: 480px) {
    .team-photo { aspect-ratio: 1/1; }
  }
</style>
```

- [ ] **Step 2: Add the hamburger button to `<nav>` in `team.html`**

```html
  </ul>
  <button class="nav-hamburger" aria-label="Toggle menu">&#9776;</button>
</nav>
```

- [ ] **Step 3: Read the top of `js/team.js` to confirm current imports, then update**

Open `js/team.js` and find the `import … from './utils.js'` line. Add `initMobileNav` to it, then add `initMobileNav()` call immediately after imports.

The import line should become:

```js
import { mk, initMobileNav } from './utils.js'
```

(Add any existing named imports that were already there alongside `initMobileNav`.)

Then add:

```js
initMobileNav()
```

- [ ] **Step 4: Verify in browser**

Open `http://localhost:5173/team.html`:
- Desktop: photo on left (220px wide, 3:4), bio on right
- Mobile (375px): photo full-width (4:3), bio below
- 480px and below: photo becomes square (1:1)
- Hamburger nav works

- [ ] **Step 5: Commit**

```bash
git add team.html js/team.js
git commit -m "feat: mobile responsive team page"
```

---

### Task 6: Update `publications.html` and `js/publications.js`

**Files:**
- Modify: `publications.html`
- Modify: `js/publications.js`

- [ ] **Step 1: Replace the `<style>` block in `publications.html`**

Replace the entire `<style>…</style>` block (lines 9–62) with:

```html
<link rel="stylesheet" href="css/shared.css">
<style>
  .pub-section { margin-bottom: 4rem; }
  .pub-section-title { font-size: 1.5rem; font-weight: 700; color: var(--navy); letter-spacing: -0.2px; margin-bottom: 0.5rem; }
  .pub-section-rule { height: 2px; background: var(--border); margin-bottom: 1.6rem; }
  .pub-list { display: flex; flex-direction: column; gap: 0.8rem; }
  .pub-entry { background: var(--card-bg); border: 1px solid var(--border); border-radius: 8px; padding: 1.4rem 1.8rem; transition: box-shadow 0.25s; }
  .pub-entry:hover { box-shadow: 0 4px 20px rgba(13,43,82,0.08); }
  .pub-entry-title { font-family: 'Inter', sans-serif; font-size: 1rem; font-weight: 700; color: var(--navy); margin-bottom: 0.4rem; }
  .pub-entry-title a { color: inherit; text-decoration: none; }
  .pub-entry-title a:hover { color: var(--sky); }
  .pub-entry-meta { font-size: 13px; color: var(--text-muted); line-height: 1.6; }
</style>
```

- [ ] **Step 2: Add the hamburger button to `<nav>` in `publications.html`**

```html
  </ul>
  <button class="nav-hamburger" aria-label="Toggle menu">&#9776;</button>
</nav>
```

- [ ] **Step 3: Read the top of `js/publications.js` to confirm current imports, then update**

Open `js/publications.js` and find the `import … from './utils.js'` line. Add `initMobileNav` to the import and call it after imports:

```js
import { mk, initMobileNav } from './utils.js'
// (keep any other existing named imports)

initMobileNav()
```

- [ ] **Step 4: Final cross-page verification**

With `npm run dev` running, resize to 375px and check all 4 pages:
- All pages: hamburger ☰ appears, desktop links hidden
- Click ☰: drawer opens; links stack vertically with full-width tap targets
- Click a link: drawer closes, navigation works
- Hero logo: 160px at 768px, 120px at 480px
- Sections: reduced padding, no horizontal overflow
- Research: project cards single-column
- Team: photo stacked above bio
- Publications: entries render normally (no layout change needed)

- [ ] **Step 5: Commit**

```bash
git add publications.html js/publications.js
git commit -m "feat: mobile responsive publications page — all pages complete"
```
