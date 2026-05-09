# REACH Lab Website — Multi-Page Redesign

**Date:** 2026-05-09
**Status:** Approved

## Overview

Expand the single-page site into four public pages (Home, Research, Team, Publications) plus a rewritten single admin panel. All content is Firebase-managed. No default seeding — all pages start empty until an admin adds content.

---

## File Structure

```
reach-labs-website/
├── index.html              ← REWRITE: Home page (news + about)
├── research.html           ← NEW: Research projects
├── team.html               ← NEW: Team members
├── publications.html       ← NEW: Publications list
├── admin.html              ← REWRITE: Tabbed admin panel
└── js/
    ├── utils.js            ← NEW: shared helpers (isHttpUrl, mk, videoEmbedUrl)
    ├── home.js             ← NEW: news Firestore listener + render
    ├── research.js         ← NEW: projects Firestore listener + render
    ├── team.js             ← NEW: team Firestore listener + render
    ├── publications.js     ← NEW: publications Firestore listener + render
    ├── admin.js            ← REWRITE: 4-tab admin panel
    ├── app.js              ← DELETE: replaced by home.js + research.js
    └── firebase-config.js  ← unchanged
```

---

## Navigation

All four public pages share an identical `<nav>` that links to all four pages. The active page's nav link is highlighted (class `nav-active`). The nav logo links back to `index.html`.

```
REACH | Robot Learning & Control Lab     Home  Research  Team  Publications
```

---

## Data Models

### `news` collection

```json
{
  "title": "Lab wins Best Paper at ICRA 2025",
  "desc": "Short description of the news item",
  "link": "https://...",
  "order": 0,
  "createdAt": "<serverTimestamp>"
}
```

- `link` is optional (empty string if not provided)
- `order` used for display ordering (asc)

### `projects` collection (unchanged)

```json
{
  "title": "...",
  "tag": "...",
  "desc": "...",
  "contact": { "name": "...", "url": "..." },
  "video": { "type": "youtube|vimeo|direct|none", "url": "..." },
  "pubs": [{ "text": "...", "url": "..." }],
  "order": 0,
  "createdAt": "<serverTimestamp>"
}
```

No default seeding. Collection starts empty.

### `team` collection

```json
{
  "name": "Prof. Fares Abu-Dakka",
  "role": "Principal Investigator",
  "photo": "https://...",
  "bio": "Short bio text",
  "order": 0,
  "createdAt": "<serverTimestamp>"
}
```

- `photo` is optional (empty string if not provided; show initials avatar as fallback)
- `bio` is optional

### `publications` collection

```json
{
  "title": "Robot skill learning via compliance-driven RL",
  "authors": "Abu-Dakka et al.",
  "venue": "IEEE RA-L",
  "year": 2024,
  "link": "https://...",
  "order": 0,
  "createdAt": "<serverTimestamp>"
}
```

- `link` is optional (PDF or DOI URL)
- `year` is an integer

---

## `js/utils.js`

Shared helpers loaded by every page via `<script src="js/utils.js">` before any page script.

```js
const isHttpUrl = u => typeof u === 'string' && /^https?:\/\//i.test(u);

function mk(tag, className) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  return el;
}

function videoEmbedUrl(type, url) { /* unchanged from current app.js */ }
```

---

## Public Pages

All public pages:
- Load Firebase app-compat + firestore-compat SDKs, `firebase-config.js`, `utils.js`, and their page-specific JS
- Attach a Firestore `onSnapshot` listener unconditionally (public read, no auth required)
- Render items using DOM methods only (no innerHTML)
- Show "Could not load [section]." on Firestore error
- Show an empty state message when the collection is empty (e.g. "No news yet.")

### `index.html` — Home

Sections:
1. **Hero** — lab name, tagline, "NYU Abu Dhabi · Division of Engineering" tag
2. **News** — cards rendered from `news` collection; each card shows title, description, and an optional "Read more →" link
3. **About** — static text about the lab, contact email

`js/home.js` subscribes to `news` ordered by `order asc`.

Script tags (bottom of body): `firebase-app-compat.js`, `firebase-firestore-compat.js`, `firebase-config.js`, `utils.js`, `home.js`

### `research.html` — Research

Sections:
1. **Hero** — "Current Research" heading, active project count from `#meta-projects`
2. **Projects** — same card layout as current site (tag, title, desc, contact, video iframe, publications)

`js/research.js` subscribes to `projects` ordered by `order asc`. Updates `#meta-projects` counter.

Script tags: `firebase-app-compat.js`, `firebase-firestore-compat.js`, `firebase-config.js`, `utils.js`, `research.js`

### `team.html` — Team

Sections:
1. **Hero** — "Our Team" heading
2. **Team grid** — cards rendered from `team` collection; each card shows photo (or initials avatar fallback), name, role, bio

`js/team.js` subscribes to `team` ordered by `order asc`.

Script tags: `firebase-app-compat.js`, `firebase-firestore-compat.js`, `firebase-config.js`, `utils.js`, `team.js`

### `publications.html` — Publications

Sections:
1. **Hero** — "Publications" heading
2. **Publications list** — one entry per publication: title (linked if URL present), authors, venue · year

`js/publications.js` subscribes to `publications` ordered by `order asc`.

Script tags: `firebase-app-compat.js`, `firebase-firestore-compat.js`, `firebase-config.js`, `utils.js`, `publications.js`

---

## `admin.html` — Admin Panel

### Structure

- Login overlay (`#login-card`) — same as current, shown when signed out
- Nav — "REACH Admin" logo, signed-in user email + Logout button
- Tab bar — four tabs: News | Research | Team | Publications
- Tab content area — switches on tab click; only one tab visible at a time

Active tab is tracked by a JS variable `currentTab`. Switching tabs re-renders the content area without re-querying Firestore (data already in memory from the active subscriptions).

### Auth

Identical to current `admin.js`: `onAuthStateChanged` gates all subscriptions. On sign-in, all four `onSnapshot` listeners start. On sign-out, all four are torn down.

### Per-tab content

Each tab shows:
1. Section heading + item count + "＋ Add [Item]" button
2. List of existing items (title/name as heading, short preview, "✕ Remove" button)
3. Add form (modal overlay — one shared `#modal-backdrop` in the HTML containing 4 form sections; only the section matching the active tab is shown)

#### News tab
- List: title + truncated desc
- Add form fields: Title *, Description *, Link (optional)

#### Research tab
- List: title + tag
- Add form fields: identical to current Add Project modal (Title, Tag, Description, Contact name+URL, Video type+URL, Publications multi-row)

#### Team tab
- List: name + role
- Add form fields: Name *, Role *, Photo URL (optional), Bio (optional)

#### Publications tab
- List: title + authors + year
- Add form fields: Title *, Authors *, Venue, Year, Link (optional)

### `js/admin.js`

Responsibilities:
1. Auth state listener — `onAuthStateChanged`; signed in → start all 4 subscriptions, show admin controls; signed out → tear down all 4 subscriptions, show login card
2. Tab switching — show/hide tab panels, track `currentTab`
3. Per-collection subscribe functions: `subscribeNews()`, `subscribeProjects()`, `subscribeTeam()`, `subscribePublications()` — each returns an unsubscribe function
4. Per-collection render functions: `renderNewsItem()`, `renderProject()`, `renderTeamMember()`, `renderPublication()`
5. Per-collection add functions: `submitNews()`, `submitProject()`, `submitTeamMember()`, `submitPublication()`
6. Per-collection delete functions: `deleteNews(id)`, `deleteProject(id)`, `deleteTeamMember(id)`, `deletePublication(id)`
7. Modal open/close (shared modal backdrop, form swapped per tab)
8. Login/logout handlers

Script tags (bottom of body): `firebase-app-compat.js`, `firebase-firestore-compat.js`, `firebase-auth-compat.js`, `firebase-config.js`, `utils.js`, `admin.js`

---

## Firestore Security Rules

Unchanged from current:

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

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| Firestore read fails | Console error; section shows "Could not load [section]." |
| Collection empty | Section shows "No [items] yet." empty state message |
| Add fails | Alert "Failed to save — check your connection." Button re-enabled. |
| Delete fails | Alert "Failed to delete — check your connection." |
| Login fails | Inline error: "Invalid email or password." |

---

## Out of Scope

- Editing existing items (add + delete only)
- Drag-and-drop reordering (order set at creation time)
- Photo upload (photo URL entered manually)
- Password reset
