# REACH Lab Website — Firebase Backend Design

**Date:** 2026-05-09  
**Status:** Approved

## Overview

Replace the current `localStorage`-only data layer with Firebase Firestore (real-time cloud database) and Firebase Email/Password Auth. Split the monolithic single-file HTML into separate, maintainable files. Introduce a dedicated admin page so the public-facing site has zero admin UI.

---

## File Structure

```
reach-labs-website/
├── index.html               ← public site, read-only
├── admin.html               ← admin dashboard (login + manage projects)
└── js/
    ├── firebase-config.js   ← Firebase init; exports db and auth
    ├── app.js               ← Firestore real-time listener + render (public)
    └── admin.js             ← auth state, login/logout, add/delete (admin)
```

The existing `reach-lab-website.html` is the source of truth for HTML structure and CSS during the split. After the migration it becomes obsolete.

---

## Data Model

**Firestore collection:** `projects`  
**Document ID:** the project's `id` field (e.g. `p1`, `p1716912345678`)

Each document:
```json
{
  "id": "p1",
  "title": "Dexterous Manipulation with Deformable Objects",
  "tag": "Robot Learning · Manipulation",
  "desc": "...",
  "contact": { "name": "Prof. Fares Abu-Dakka", "url": "https://nyuad.nyu.edu" },
  "video": { "type": "youtube", "url": "https://www.youtube.com/embed/..." },
  "pubs": [{ "text": "Abu-Dakka et al. ...", "url": "" }],
  "order": 0,
  "createdAt": "<Firestore server timestamp>"
}
```

- `order` — integer, used to sort projects consistently in display order
- `createdAt` — Firestore `serverTimestamp()`, written once at creation; not used for sorting

**Seeding:** On first load of `app.js`, if the `projects` collection is empty, the three default projects are written to Firestore in a batch (with `order` values 0, 1, 2). This makes initial setup zero-config.

---

## Firebase Auth

- **Provider:** Email/Password only
- **Account creation:** Manually via Firebase Console — no self-registration on the site
- **Multiple admin users:** Each person gets their own Firebase account (email + password)
- **Session:** Firebase Auth handles persistence automatically (user stays logged in across page refreshes)

---

## Firestore Security Rules

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

- Anyone can read (public research page works without login)
- Only authenticated Firebase users can write (add, delete)

---

## `js/firebase-config.js`

Initialises the Firebase app and sets the global variables `db` (Firestore instance) and `auth` (Auth instance) that `app.js` and `admin.js` reference. Uses the Firebase CDN compat SDK — no ES module exports. Contains a clear placeholder comment block indicating where to paste the config from the Firebase Console.

```js
// Paste your Firebase config here (Firebase Console → Project Settings → Your Apps)
const firebaseConfig = { ... };

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
```

---

## `js/app.js` (Public)

Responsibilities:
1. Attach a Firestore `onSnapshot` listener to the `projects` collection ordered by `order asc`
2. On first snapshot, if collection is empty, seed default projects then return (listener fires again automatically with the seeded data)
3. On each snapshot, re-render all project cards and update the hero "Active Projects" counter
4. Expose `videoEmbedUrl(type, url)` and `renderProject(p)` as internal helpers

Does **not** handle auth, add, or delete.

---

## `js/admin.js` (Admin)

Responsibilities:
1. **Auth state listener** — `onAuthStateChanged`:
   - Signed out → show login form, hide project controls
   - Signed in → hide login form, show `email · Logout` in nav, show Add Project button, enable delete buttons
2. **Login** — `signInWithEmailAndPassword`; on error show inline message ("Invalid email or password")
3. **Logout** — `signOut`
4. **Add Project** — same modal logic as current `reach-lab-website.html`; on submit writes to Firestore with `order = projects.length` and `serverTimestamp()`
5. **Delete Project** — `deleteDoc`; guarded by auth state (button is hidden/disabled when signed out)

`admin.js` duplicates `videoEmbedUrl` and `renderProject` from `app.js`. This is intentional — admin cards render delete buttons that the public cards don't, so the two render paths are expected to diverge. No shared render file.

---

## `index.html` (Public)

- Identical HTML structure and CSS to the current `reach-lab-website.html`
- Removes: "＋ Add Project" nav button, `btn-delete-project` button markup, `btn-delete-project` CSS rule
- Loads Firebase SDK (CDN), `js/firebase-config.js`, `js/app.js` via `<script>` tags at bottom of `<body>`
- No inline JS

---

## `admin.html` (Admin)

- Same nav, hero, research section, team, about, footer HTML as `index.html`
- **Additions:**
  - Login card (centered modal-style, shown when signed out): email input, password input, "Sign In" button, inline error message area
  - Nav: "＋ Add Project" button (hidden until signed in) + `user@email · Logout` indicator (hidden until signed in)
  - Each project card: "✕ Remove" hover button (same style as current; hidden until signed in)
  - Add Project modal (identical to current implementation)
- Loads Firebase SDK, `js/firebase-config.js`, `js/admin.js`

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| Firestore read fails | Console error; page shows static fallback message "Could not load projects." |
| Add project write fails | Alert with "Failed to save — check your connection." Button re-enabled. |
| Delete fails | Alert with "Failed to delete — check your connection." |
| Wrong login credentials | Inline error below login form: "Invalid email or password." |
| Firebase config not filled in | `firebase-config.js` throws on init; console error; page fails gracefully with fallback message |

---

## Setup Steps (for the lab)

1. Create a Firebase project at console.firebase.google.com
2. Enable Firestore (Build → Firestore Database → Create in Production mode)
3. Paste the security rules above
4. Enable Authentication → Sign-in method → Email/Password
5. Add admin user accounts under Authentication → Users
6. Copy the web app config into `js/firebase-config.js`
7. Deploy the four files to any static host (GitHub Pages, Netlify, etc.)

---

## Out of Scope

- File/image uploads for project thumbnails
- Password reset flow (use Firebase Console to reset manually)
- Project ordering drag-and-drop (order is set at creation time)
- Team member management via the admin page
