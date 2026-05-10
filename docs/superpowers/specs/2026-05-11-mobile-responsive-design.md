# Mobile Responsive Design — REACH Lab Website

## Overview

Make the REACH Lab website (4 pages: index, research, team, publications) fully mobile-responsive. Extract shared CSS into a single file to avoid duplication and add responsive rules once. Add a hamburger nav menu for mobile.

## Architecture

### New file: `css/shared.css`

Contains all styles shared across every page:
- CSS custom properties (`:root` variables)
- Global reset (`*`, `html`, `body`)
- Nav (`.nav`, `.nav-logo`, `.nav-logo-img`, `.nav-links`, `.nav-links a`, `.nav-active`)
- Hamburger button (`.nav-hamburger` — mobile only)
- Mobile nav drawer (`.nav-open .nav-links` overrides)
- Hero (`.hero`, `.hero::before`, `.hero-inner`, `.hero-logo-wrap`, `.hero-logo`, `.hero-tag`, `.hero-desc`)
- Section (`.section`, `.section-inner`, `.section-title`, `.alt-bg`)
- Footer (`footer`, `footer a`)
- All responsive media queries

### Modified files

Each HTML file:
- Adds `<link rel="stylesheet" href="css/shared.css">` in `<head>`
- Keeps only page-specific styles in its `<style>` block (see below)
- Adds `<button class="nav-hamburger" aria-label="Toggle menu">&#9776;</button>` inside `<nav>`, after `.nav-links`

### `js/utils.js`

Add `initMobileNav()` function:
- Selects `nav`, `.nav-hamburger`, `.nav-links a`
- Hamburger click toggles `.nav-open` on `<nav>`
- Clicking any nav link removes `.nav-open`
- Clicking outside the nav removes `.nav-open`
- Called on `DOMContentLoaded`

Each page's module JS (`home.js`, `research.js`, `team.js`, `publications.js`) imports and calls `initMobileNav()` from `utils.js`.

## Page-Specific Styles

### index.html
`.news-card`, `.news-card:hover`, `.news-title`, `.news-desc`, `.news-link`

### research.html
`.hero-meta`, `.hero-meta-item`, `#projects-container`, `.project-card`, `.project-card:hover`, `.project-card-inner`, `.project-content`, `.project-tag`, `.project-title`, `.project-desc`, `.project-contact`, `.project-pubs`, `.project-pubs-title`, `.pub-item`, `.pub-link`, `.project-media`, `.no-video`

Responsive rule (≤768px): `.project-card-inner { grid-template-columns: 1fr }`

### team.html
`.team-section`, `.team-section-title`, `.team-section-rule`, `.team-card`, `.team-card:last-child`, `.team-photo`, `.team-photo img`, `.team-photo-initials`, `.team-info`, `.team-name`, `.team-role`, `.team-bio`

Responsive rule (≤768px): `.team-card { flex-direction: column }`, `.team-photo { width: 100%; aspect-ratio: 4/3 }`

Responsive rule (≤480px): `.team-photo { aspect-ratio: 1/1 }`

### publications.html
`.pub-section`, `.pub-section-title`, `.pub-section-rule`, `.pub-list`, `.pub-entry`, `.pub-entry:hover`, `.pub-entry-title`, `.pub-entry-title a`, `.pub-entry-title a:hover`, `.pub-entry-meta`

## Responsive Breakpoints (in `css/shared.css`)

### `@media (max-width: 768px)`

| Element | Change |
|---|---|
| `nav` | `padding: 0 1.2rem` |
| `.nav-links` | `display: none` (hidden by default) |
| `.nav-hamburger` | `display: flex` (visible) |
| `.nav-open .nav-links` | `display: flex; flex-direction: column; position: absolute; top: 72px; left: 0; right: 0; background: var(--navy-mid); padding: 0.5rem 0; z-index: 99` |
| `.nav-open .nav-links a` | `padding: 14px 1.5rem; display: block; width: 100%; border-bottom: 1px solid rgba(255,255,255,0.07)` |
| `.hero` | `padding: 40px 1.2rem` |
| `.hero-logo` | `height: 160px` |
| `.section` | `padding: 48px 1.2rem` |

### `@media (max-width: 480px)`

| Element | Change |
|---|---|
| `.hero-logo` | `height: 120px` |
| `.hero-desc` | `font-size: 16px` |
| `.section-title` | `font-size: 1.3rem` |

## Hamburger Button Styles (in `css/shared.css`)

```css
.nav-hamburger {
  display: none;           /* hidden on desktop */
  background: none;
  border: none;
  color: var(--gray-300);
  font-size: 22px;
  cursor: pointer;
  padding: 4px 8px;
  line-height: 1;
}
.nav-hamburger:hover { color: var(--white); }
```

## Files Changed

| File | Change |
|---|---|
| `css/shared.css` | **New** — shared styles + all responsive rules |
| `index.html` | Add shared CSS link; strip shared styles; add hamburger button |
| `research.html` | Add shared CSS link; strip shared styles; add hamburger button |
| `team.html` | Add shared CSS link; strip shared styles; add hamburger button |
| `publications.html` | Add shared CSS link; strip shared styles; add hamburger button |
| `js/utils.js` | Add `initMobileNav()` |
| `js/home.js` | Import + call `initMobileNav()` |
| `js/research.js` | Import + call `initMobileNav()` |
| `js/team.js` | Import + call `initMobileNav()` |
| `js/publications.js` | Import + call `initMobileNav()` |
