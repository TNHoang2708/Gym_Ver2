# PRD — Phase 17: PWA & Mobile Native UX

## Overview
Phase 17 bridges the gap between a standard Next.js Web App and a true Mobile-First Application without relying entirely on native app stores (Capacitor). By implementing Progressive Web App (PWA) standards and mobile-first gestures, users can install the app directly to their home screens and interact with it exactly like a native app.

---

## Sub-Phase 17.1: PWA Core Implementation (Add to Home Screen)
**Goal:** Satisfy all browser requirements to trigger the native "Install App / Add to Home Screen" prompt.

### Tasks:
- [x] 1. Update `public/manifest.json` to include required PWA properties (`display: "standalone"`, `start_url`, `icons`).
- [x] 2. Update the root `layout.tsx` to include the `viewport` configuration (disable scaling, set theme color).
- [x] 3. Update the root `layout.tsx` `metadata` to include Apple Mobile Web App tags (`appleWebApp: { capable: true, statusBarStyle: 'black-translucent' }`).
- [x] 4. Create a foundational Service Worker `public/sw.js` with `install` and `fetch` event listeners (required by Chrome/Safari to enable PWA install).
- [x] 5. Create a `PWARegister` client component to mount the Service Worker on app load.

---

## Sub-Phase 17.2: Mobile Gestures & UX Polish
**Goal:** Replace web-centric clicks with native-feeling touch gestures.

### Tasks:
- [x] 1. Ensure `Pull-to-Refresh` behavior is simulated or native overscroll behavior is polished.
- [x] 2. Implement `Overscroll-behavior: none` on `body` to prevent the annoying "bounce" effect when pulling down on iOS Safari, giving it a locked-in native feel.
- [x] 3. Add Safe Area paddings (`env(safe-area-inset-bottom)`) for iPhone notches and bottom home indicators.

---

## Verification
- Can install the app via Chrome Android ("Install App" prompt appears).
- Can "Add to Home Screen" on iOS Safari and it launches without the URL bar.
- UI doesn't rubber-band when scrolling to the top/bottom.
- No zooming allowed when double tapping inputs.

---
**Status:** 100% Complete (Core PWA works, overscroll and double-tap zoom locked)
