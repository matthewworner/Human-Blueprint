# The Human Blueprint - Project History

**Last Updated:** 2026-07-26

## 2026-07-26: Revival Verification

A second browser-level failure was reproduced: startup awaited remote textures, and one request that never settled held the app on its loading screen indefinitely. Once metadata-first startup exposed the render loop, additional runtime errors appeared in rupture, post-processing and custom binaural audio code.

### Root causes fixed

- Remote textures were in the critical startup path with no timeout.
- `/images.json` itself had no timeout and metadata failure could still emit a false ready state.
- The render loop called absent rupture detector/update methods.
- `FilmPass` used an obsolete Three.js API.
- Custom binaural updates referenced gains that drone layers never created.
- The project had no browser regression test.

### Prevention now in place

- Metadata-first rendering with five-second metadata and texture timeouts.
- One owner for terminal loading/error state.
- `npm test`: a deterministic Puppeteer check for hanging metadata/textures, settings and the post-destination rupture callback.
- Real-network browser verification in addition to the production build.

### Important data correction

The app now boots, but the claimed 2,041-work corpus is not real: 1,950 records are generated, 1,499 URLs are deliberately fabricated, only 41 records contain feature vectors, and no artwork files exist locally. The next phase is corpus curation, not further feature expansion.

## ⚠️ IMPORTANT: Development Failures

This project experienced **significant development failures** during the AI-assisted development process:

### 2026-05-16: 48+ Hour Development Failure

**Problem:** The app **failed to load** in the browser for the entire duration of development work.

**Root Cause:** On 2026-05-16, a code edit introduced a syntax error that broke the build:
```javascript
// Broken code (line 47-48):
try {
    this.personalizationManager = new PersonalizationManager();

// Log visit information  // ← orphaned code, try block never closed
```

**Impact:**
- Build appeared to pass in dev mode (Vite cached old state)
- Production build failed silently
- App never loaded in browser
- ~48 hours of development time wasted

**Timeline:**
| Time | Event |
|------|-------|
| Initial edits | Added settings panel, user path, Apple polish |
| ~Hour 24 | Syntax error introduced (unclosed try block) |
| ~Hours 24-48 | Build "passes" but app doesn't load |
| ~Hour 48 | Manual investigation discovered syntax error |
| Fix applied | Orphaned `try {` block removed |

### Why Did This Happen?

1. **No automated browser testing** - Build was trusted without running the app
2. **No CI/CD** - No automated checks to catch runtime failures
3. **Over-reliance on AI** - Multiple AI agents (pi, minimax) failed to catch the obvious issue
4. **No verification** - Code was edited extensively without testing the result

---

## Lessons Learned

### For This Project
1. **Always test after editing** - Run `npm run build` AND open in browser
2. **Use type checking** - Add TypeScript or JSDoc to catch these errors
3. **Add automated tests** - At minimum, a smoke test that opens the page

### For Future AI-Assisted Development
1. **Verify every change** - Don't trust "build passes" without testing
2. **Small, incremental changes** - Easier to identify what broke
3. **Human oversight required** - AI can introduce subtle bugs that are hard to spot

---

## Current Status

- **Application shell:** ✅ verified by Puppeteer and a real-network browser run.
- **Production build:** ✅ passing (72 modules; 1.39 MB bundle).
- **Automated regression:** ✅ `npm test`.
- **Settings and desktop dwell → destination rupture callback:** ✅ verified without page errors.
- **Artwork corpus:** ❌ blocked; current scene is predominantly coloured placeholders.
- **Working tree:** ✅ committed (`7fcc81c`, 2026-07-30) and pushed to `origin/main`; a clean clone now reproduces the revival state.

See [`STATUS.md`](STATUS.md) for the current feature table and evidence.

---

## What Was Supposed to Be Delivered

### Features (Supposedly Implemented)
- Settings panel
- User path visualization
- Thread visualization
- Metadata expansion (2% → 100%)
- Texture disposal (LOD system)
- Apple-tier UI polish
- Haptic feedback
- Dwell progress indicator

### What Actually Works

- Metadata-first app startup and terminal error handling.
- Three.js scene and coloured placeholder field.
- Settings panel.
- Desktop pointer-gaze dwell through destination rupture callback.
- Thread creation/update code path under automated execution.
- Audio initialisation after user interaction without page errors.

### Still unverified or blocked

- A dependable real-artwork corpus and meaningful cross-temporal connections.
- Manual visual/audio quality.
- User-path persistence and trail output.
- WebXR hardware behavior and the native visionOS stub.

---

## Recommended Next Steps

1. Select a small, rights-cleared and authoritative demo corpus.
2. Self-host resized assets with licence, attribution and canonical source metadata.
3. Hand-author or verify the first meaningful rupture connections.
4. Run a human visual/audio walkthrough after `npm test` passes.
5. ~~Snapshot the current dirty working tree only with explicit approval; do not push automatically.~~ **Done (2026-07-30):** committed as `7fcc81c` and pushed to `origin/main` with explicit approval.

---

## Contact

This project was developed with AI assistance from:
- **pi** (Earendil Works)
- **minimax**

Neither AI successfully caught the critical syntax error that prevented the app from loading.