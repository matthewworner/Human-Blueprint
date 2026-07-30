# The Human Blueprint — Fable 5 Reality + Revival Audit

> **Implementation status (2026-07-26):** the original 2026-07-05 audit below is retained as a historical snapshot. Its startup diagnosis led to a successful boot revival, but its claims that the code had no runtime errors and that the 2,041-work corpus was real were incorrect. The current state and corrected evidence are recorded here before the original report.

## Revival implementation update — 2026-07-26

### Current verdict

**The app shell now runs; the artwork experience does not.** A real-network Puppeteer run reached `Blueprint ready.` in 759 ms, completed the desktop pointer-gaze → destination rupture callback in 3.8 s, opened settings and produced zero page errors. The visible field is still primarily coloured placeholders because the dataset is not a dependable artwork corpus.

### Implemented

- Made startup metadata-first: remote textures no longer gate first render.
- Added five-second timeouts for `/images.json` and texture requests, including late-result cleanup and LOD queue recovery.
- Made initialisation own the terminal loading state; metadata failure cannot hide its error or emit false ready.
- Routed lazy texture loading through the shared `TextureManager` and replaced 2,041 canvas placeholders with cheap material colours.
- Fixed runtime blockers missed by the original audit: calls to absent rupture detectors, missing thread-update wiring, Three.js `FilmPass` API drift, audio autoplay/custom-binaural errors and nested tooltip metadata.
- Removed the inactive `TextureDisposalManager` hookup; the active texture path remains in `SceneManager`/`TextureManager`.
- Added `scripts/smoke-test.js` as `npm test`. It verifies ready state despite a permanently hanging artwork request, texture queue recovery after timeout, a hanging metadata request reaching a visible terminal error, settings access and the post-destination rupture callback without page errors.
- Added `https://fastly.picsum.photos` to the CSP as the original audit requested for explicit eager/fallback loading.

### Validation

- `npm test` — **PASS**.
- `npm run build` — **PASS** (72 modules; 1.39 MB bundle).
- `node --check` across application and smoke-test modules — **PASS**.
- Real-network Puppeteer run — **PASS for the application shell**, with zero page errors; generated Wikimedia image requests still returned HTTP 400.

### Corpus correction — original audit materially wrong

`public/images.json` contains 2,041 records, not 2,041 verified artworks:

- 1,950 records use `generated_*` IDs.
- 1,499 URLs match the deliberately fabricated random Wikimedia pattern created by `scripts/generate_more_images.js`.
- Only 41 records contain feature vectors.
- No artwork files exist locally.
- The repository does not preserve licence, attribution or canonical source fields for the Wikimedia-backed records.

The original recommendation to download and self-host all 2,041 URLs **must not be executed**. Most cannot resolve, and the repository cannot attest their usage rights. The minimum honest next step is to approve a small, rights-cleared and authoritative demo corpus, self-host resized assets, then hand-author or verify its first meaningful rupture connections.

### Revised revive-vs-rewrite call

**Revive the boot and interaction shell; replace the corpus and connection model.** The Three.js composition, settings and core dwell/rupture path are now runnable and regression-tested. The claimed visual-similarity dataset is not a foundation: most positions, labels and URLs were generated, and the current rupture selector relies on those random descriptors rather than a consistently verified vector set.

### Remaining repository risk

The working tree remains heavily dirty and uncommitted. Required core modules and the smoke test are still untracked, so a clean clone does not reproduce the revived app. Nothing was staged, committed or pushed during this pass.

---

## Original audit — 2026-07-05 (superseded where contradicted above)

- **Date:** 2026-07-05
- **HEAD:** `1e78629` ("Restructure project: move docs, clean up old files, add screenshots")
- **Branch:** `main` (in sync with origin) — **but the working tree is heavily dirty**: `src/main.js`, `RuptureSystem.js`, `index.html`, `public/images.json` all modified, and much of the app (`ThreadVisualization.js`, `UserPathTracker.js`, `UserPathVisualizer.js`, `TextureDisposalManager.js`, `DwellProgressIndicator.js`, `HapticFeedback.js`, `DEVELOPMENT_FAILURES.md`, `visionOS/`, `HumanBlueprint/`) is **untracked, uncommitted work**. This audit covers the working tree — the thing that actually runs — not the committed HEAD. Committing this state is itself a punch-list item.
- **Method note:** this audit went beyond static reading. Puppeteer (already in devDependencies) plus a freshly installed headless Chrome were used to **actually load the app** against a live Vite dev server — the step that was skipped for 48 hours. Every runtime claim below was observed, not inferred.

---

## Q1 verdict — does it actually run?

**The code is sound; the startup is deadlocked. The app boots, initialises every subsystem without a single JS error, then hangs forever on the loading screen waiting for third-party image servers.**

What was verified:

- **No sibling of the 48-hour syntax bug exists.** All 18 modules pass `node --check` cleanly; the full import graph (index.html → `/src/main.js` → 17 core modules + three/umap-js) resolves; every module transforms and serves 200 from a cold Vite dev server (no stale cache involved — fresh server, fresh transform).
- **Headless Chrome loads the page with zero page errors.** Console shows the full init sequence: `Initializing The Human Blueprint...` → visit stats → post-processing → images.json fetched (200, 2,041 records). Canvas is created, gear icon and VR button render.
- **But `Blueprint ready` never fires.** Three separate headless runs: never ready at 65 s, never ready at 240 s, and a 60 s instrumented run that isolated the cause. Screenshot evidence: black screen, "Loading Human Blueprint…", forever.

**The deadlock, precisely** (this is the new "48-hour bug" — same class, different layer):

1. `init()` awaits `loadImages()` (`src/main.js:92`), which awaits `Promise.allSettled` over **all 2,041** entries (`src/core/ImageLoader.js:173-177`). The first 10 load real textures; the rest resolve fast with `texture: null`.
2. The Met image URLs work in curl (all 10 respond 200 in 1–7 s) but are **CORS-blocked in the browser** (no `Access-Control-Allow-Origin`; Three's TextureLoader sets `crossOrigin`). Observed: 9 of 10 primaries fail.
3. Each failure falls back to `https://picsum.photos/...` (`ImageLoader.js:282`) — which **always fails**, because picsum 302-redirects to `fastly.picsum.photos`, which is **not in the CSP `img-src` allow-list** (`index.html:8`). Observed: 0 of 9 fallbacks ever succeeded. Those 9 settle as placeholders — fine.
4. **The 10th texture load never settles at all** — neither `load` nor `error` fires (observed: `primaryFail:9, fallbackOK:0, fallbackFail:9, texLoaded:0` after 60 s). `TextureManager.loadTexture` has **no timeout** (`src/core/TextureManager.js:29-71`), so one pending promise holds `allSettled` open forever → `init()` never proceeds → settings panel, tooltips, soundscape and the ready state are all gated behind it → **infinite loading screen**.

So: **Vite says fine, syntax is fine, the module graph is fine — and the user still sees a black loading screen.** "Build passes" was never the question; unbounded awaits on third-party networks in the critical startup path is.

### Operator runbook (confirm in a browser)

```bash
npm install && npm run dev   # open http://localhost:5173
```

- **Failure signature you WILL see today:** "Loading Human Blueprint…" that never clears (waited 4+ minutes headless). DevTools console: CORS errors for `images.metmuseum.org`, CSP violations for `fastly.picsum.photos`, and no `Blueprint ready.` log.
- **What "working" looks like after the fix:** `Blueprint ready.` in console within ~5 s, loading overlay fades, a field of image planes (mostly coloured placeholder tiles until the image pipeline is fixed), gear icon opens the settings panel, hovering an image shows the tooltip.
- **Quick triage trick:** DevTools → Network → find the one `images.metmuseum.org` request stuck in "pending" — that's the deadlock made visible.

---

## Q2 — feature reality table

| Claimed feature | Verdict | Evidence |
|:---|:---|:---|
| 2,041 images with metadata | **BROKEN** (metadata REAL, pipeline broken) | `public/images.json` has exactly 2,041 records with rich metadata (era, region, colours, featureVector, positions). But **zero image files exist on disk** — every `url` is a remote hotlink (Met Museum originals, 0.4–4.6 MB each), and in a browser those are CORS-blocked (9/10 observed). The picsum fallback is 100% dead via CSP (`index.html:8` vs the fastly redirect). Net result today: placeholder tiles, not artworks. |
| Gaze tracking | **REAL** (desktop = mouse-raycast) | `src/core/GazeTracker.js` (636 lines): device detection, per-device strategies (desktop mouse raycast `:159-166`, phone, vision_pro, vr), dwell timing, pattern detection; fully wired in `main.js:512-544`. It's honest pointer-gaze, not eye tracking — appropriate for the medium. Renders-on-screen unverified because startup never completes. |
| Rupture system | **REAL** (code), unverifiable on screen | `src/core/RuptureSystem.js` (1,100 lines): dwell thresholds, rupture selection, transitions, shader import, thread-viz hook (`:809-823`); wired with adaptive params in `main.js:73-79, 547-567`. Cannot fire until the loader deadlock is fixed (gaze needs rendered images to dwell on). |
| Thread visualization | **REAL** (code), unverifiable on screen | `src/core/ThreadVisualization.js` (422 lines), imported and driven by RuptureSystem (`RuptureSystem.js:2, 809`), animated per-frame from `main.js:790`. Untracked file — exists only in the working tree. |
| Settings panel | **BROKEN** (fully built, unreachable) | Complete implementation — sliders wired to audio/rupture/dwell with persistence (`main.js:363-508`, DOM in `index.html`). **Observed headless: clicking the gear does nothing**, because `setupSettingsPanel()` sits after the deadlocked `await loadImages()` (`main.js:128`). One fix away from REAL. |
| User path tracking | **REAL** (code), unverifiable on screen | `UserPathTracker.js` (229 lines, persistence via PersonalizationManager) + `UserPathVisualizer.js` (225 lines, path lines + viewed markers), wired at `main.js:82-84, 238-253, 552-566`. Both untracked/uncommitted. |
| "Apple-tier UI polish" | **REAL-ish** (styling exists; taste unjudged) | ~550 lines of considered CSS in `index.html` (reduced-motion support, tooltip system, glass panel, loading dots). The observed reality is a black screen with a spinner — polish is moot until the app gets past loading. |
| visionOS build | **STUB** | `visionOS/ProofOfConcept/` + `HumanBlueprint/{macOS,visionOS}` Xcode projects contain **4 Swift files total** (e.g. `MarkEntity.swift`, `MarkWorldContent.swift`, `CoreModels.swift`). A proof-of-concept skeleton, not a port. |

---

## Findings

### 1. BLOCKER- startup deadlocks on a texture load that never settles — the app never becomes ready
- **File:** `src/core/TextureManager.js:29-71` (no timeout), `src/core/ImageLoader.js:173-177` (allSettled gate), `src/main.js:92-139` (everything awaits it)
- **What/Why:** as detailed in Q1 — one pending third-party image request with no timeout holds the entire init hostage. Observed headless: never ready at 240 s; settings gear dead; loading overlay permanent.
- **Fix direction:** three cheap, compounding fixes: (a) wrap `loadTexture` in `Promise.race` with a 5–8 s timeout that rejects; (b) don't gate init on textures at all — create planes with placeholders immediately and let the existing LOD lazy-loader (`SceneManager.js:532`, already implemented and wired at `:502`) fill them in; (c) show the scene the moment metadata is parsed. The app should be interactive in ~2 s on a cold cache.

### 2. BLOCKER- the image pipeline itself is dead: CORS-blocked primaries, CSP-blocked fallback
- **File:** `public/images.json` (all URLs remote), `index.html:8` (CSP `img-src` lacks `fastly.picsum.photos`), `src/core/ImageLoader.js:282` (fallback)
- **What/Why:** even after fixing Finding 1, almost no real artwork renders: Met originals are CORS-blocked in-browser (9/10 observed), and every picsum fallback dies on the CSP redirect (9/9 observed). The experience's entire substance — the images — doesn't load. Hotlinking 2,041 multi-MB museum originals was never going to survive contact with a browser anyway.
- **Fix direction:** self-host. The metadata already exists; write a one-off script (puppeteer/sharp are already in devDependencies, and `scripts/` has a scraping pipeline) to download + resize the 2,041 images to ~800 px WebP (~100–200 MB total) into `public/images/`, rewrite `url` to local paths. Kills CORS, CSP, latency, and Met's servers' opinion of you in one move. Interim quick win: add `https://fastly.picsum.photos` to the CSP so the fallback at least works.

### 3. BROKEN- settings panel, tooltip, soundscape and XR are all gated behind the deadlock
- **File:** `src/main.js:107-131` (everything after `await this.loadImages()`)
- **What/Why:** confirmed by headless click test — gear does nothing today. Not a defect in the features themselves; a sequencing defect. Fixing Finding 1 un-breaks all of them at once.
- **Fix direction:** covered by Finding 1(b)/(c); optionally move `setupSettingsPanel()` before the image await — it has no dependency on images.

### 4. VIABILITY- the app that runs is uncommitted — `main` HEAD is not the product
- **File:** `git status` — 10 modified + ~20 untracked files including six core modules
- **What/Why:** the thread viz, user path system, texture disposal, haptics, dwell indicator, the failure post-mortem, and both native builds exist only in the working tree. A `git checkout .` or a clone loses the app. This is exactly how 48-hour-class failures become unrecoverable.
- **Fix direction:** commit the working tree now (one "state of the world" commit is fine), before any revival work.

### 5. INFO- loading progress UI reports all-at-once, not progressively
- **File:** `src/core/ImageLoader.js:180-203` — `onProgress` fires inside the `results.forEach` **after** `allSettled` resolves, so "X of 2,041" would only ever render in one burst at the end. Moot after Finding 1's restructure, noted for honesty.

### 6. INFO- misc observed console noise
- `index.html`: `X-Frame-Options` set via `<meta>` (ignored by browsers), deprecated `apple-mobile-web-app-capable`, one 404 (favicon-class). Cosmetic.

---

## The needle question

**What's genuinely novel:** the *mechanic*, not the scaffolding. Pointer-gaze dwell → rupture → being pulled across 50,000 years to a formally-resonant mark, with your accumulated path drawn as threads through the space — that loop (GazeTracker → RuptureSystem → ThreadVisualization → UserPathTracker) is a real, coherent interaction design and it is **actually coded, wired end-to-end, and clean to read**. The UMAP-positioned 2,041-work metadata corpus is real too, and it's the expensive part to recreate. What's generic: the Three.js boilerplate, the settings panel, the "Apple polish" CSS, the audio bed. What's vapour: the visionOS "build" (4 Swift files).

**Revive-vs-rewrite call: REVIVE. Unambiguously.** The evidence: the app initialises every subsystem with zero errors; the architecture is a sane composition root (`main.js`) over 17 single-purpose modules with defensive null-checks throughout; the LOD lazy-loading system the fix needs is *already written and wired*. The two blockers are a missing timeout and a broken image-hosting decision — plumbing, not foundations. A rewrite would spend weeks re-arriving at code that already exists. The 48-hour trauma was a process failure (nobody opened a browser), not an architecture failure; this audit opened the browser and the architecture held up.

**Shortest path to a needle-shifting demo** (est. order of a day or two of focused work, not weeks):

1. Commit the working tree (Finding 4).
2. Un-gate startup: texture timeout + placeholders-first + rely on existing LOD loader (Finding 1). → *App interactive in seconds.*
3. Self-host the 2,041 images resized (Finding 2). → *The space fills with real artwork — the first moment the concept is actually visible.*
4. Verify the core loop in the browser: dwell on an image → rupture fires → thread draws. Tune the dwell threshold so a first-time visitor triggers it within ~30 s.
5. Add the smoke test this repo has needed twice now: a 20-line puppeteer script (`await 'Blueprint ready'` + fail on pageerror) as `npm test`. The tooling proved itself in this audit; it's sitting in devDependencies.
6. Only then: polish, audio, visionOS.

---

## Punch list (get it loading → core experience → polish)

1. **Commit everything** — the runnable app must exist in git (Finding 4).
2. **Texture timeout + don't await textures at init** — kills the deadlock, un-gates settings/tooltip/audio (Findings 1, 3).
3. **CSP: add `fastly.picsum.photos`** — one-line stopgap so fallbacks work while step 4 runs (Finding 2).
4. **Download + resize + self-host the 2,041 images; rewrite `images.json` URLs to local paths** (Finding 2).
5. **Browser smoke test in `npm test`** (puppeteer already installed) — never lose 48 hours to "build passes" again.
6. **Verify and tune the gaze→rupture→thread loop live** — the actual bet.
7. Cosmetics: meta-tag warnings, favicon 404, progressive loading counter (Findings 5, 6).
