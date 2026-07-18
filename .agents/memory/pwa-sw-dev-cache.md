---
name: PWA service worker vs Vite dev
description: Why the dev preview crashed with "Invalid hook call" / duplicate React and how to avoid it
---

**Rule:** The app's PWA service worker (`client/public/sw.js`) must never cache Vite dev-server module URLs, and SW registration is skipped entirely in dev (`client/src/utils/pwa.ts` + early cleanup script in `client/index.html`).

**Why:** The SW cached `.js` files cache-first. In development it served stale dep chunks (old `?v=` hashes) alongside fresh ones, loading two React copies → app-wide "Invalid hook call" crash in the Replit preview browser only (external browsers with a clean profile were fine). Symptom signature: multiple "Download the React DevTools" console lines, same `chunk-*.js` fetched with different `?v=` hashes.

**How to apply:** If the preview crashes app-wide with invalid-hook/duplicate-React errors while curl and external browsers work, suspect stale client-side caching (service worker or immutable HTTP cache) before suspecting the code. Keep the dev-guard in index.html and pwa.ts intact; bump `CACHE_VERSION` in sw.js whenever caching behavior changes.
