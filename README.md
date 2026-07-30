# The Human Blueprint

A spatial computing experience that reveals the pattern of human mark-making consciousness across 50,000 years.

## ⚠️ IMPORTANT: Development Failures

**This project experienced a 48+ hour development failure.** The app failed to load in the browser due to a syntax error that went undetected.

**See:** `DEVELOPMENT_FAILURES.md` for details.

## Status: Boot Verified — Artwork Corpus Blocked

The application shell now starts and renders reliably. Automated browser coverage verifies ready state, settings, metadata/texture timeouts and the desktop pointer-gaze → rupture callback path.

The artwork experience remains blocked: the current 2,041-entry file is mostly generated data with broken remote URLs, so the scene renders coloured placeholders rather than a dependable artwork corpus. See [`STATUS.md`](STATUS.md) for evidence and counts.

### Quick Start

```bash
npm install
npm test
npm run dev
```

Then open `http://localhost:5173` and manually judge the visual/audio experience. `npm test` is the required regression check; a passing production build alone is not sufficient.

### Current Feature Status

| Feature | Status |
|:---|:---|
| App shell / Three.js scene | **VERIFIED** |
| Settings panel | **VERIFIED** |
| Desktop mouse raycast (“gaze”) | **VERIFIED** |
| Dwell → rupture destination callback | **VERIFIED** |
| Thread update path | **AUTOMATED PATH VERIFIED**; manual visual review pending |
| Audio runtime | **NO PAGE ERRORS**; listening test pending |
| User path tracking | **CODED, NOT MANUALLY VERIFIED** |
| Artwork corpus | **BLOCKED** — mostly generated records, no local assets |
| WebXR / visionOS | **NOT VERIFIED / STUB** |

### Dataset Warning

`public/images.json` contains 2,041 records, but 1,950 are `generated_*`, 1,499 use deliberately fabricated Wikimedia URL patterns, only 41 contain feature vectors, and no artwork files exist locally. Do not self-host the current file wholesale; first select and rights-check a small real corpus.

### What Went Wrong

On 2026-05-16, a code edit introduced a syntax error that broke the app:

```javascript
// Line 47-48 - BROKEN:
try {
    this.personalizationManager = new PersonalizationManager();
// Missing closing brace - try block never closed
```

This error prevented the app from loading but went undetected for ~48 hours because:
- Build appeared to pass (Vite caching)
- No automated browser testing
- Multiple AI agents (pi, minimax) failed to catch it

Visit `http://localhost:5173` in your browser.

### Controls
| Input | Action |
|-------|--------|
| Mouse movement | Simulates gaze (highlights images) |
| Click | Click on images for interaction |
| Drag | Orbit camera around scene |
| Dwell (3s default) | Hold mouse over image to trigger rupture |
| VR Button | Enter WebXR immersive mode |
| Scroll | Zoom in/out |
| Settings (bottom-right) | Open settings panel |
| Escape | Close settings panel |

## Project Structure

```
src/
  main.js                    # Application entry point
  core/
    SceneManager.js          # Three.js scene, camera, renderer, WebXR
    ImageLoader.js           # Image loading with async handling
    PositionStrategy.js      # Modular positioning strategies
    TextureManager.js        # Texture caching and management
    ArrangementAlgorithm.js  # UMAP-based 3D positioning
    GazeTracker.js           # Gaze/mouse tracking with raycasting
    RuptureSystem.js         # 8 rupture types with camera transport
    ThreadVisualization.js   # Animated connecting threads
    UserPathTracker.js       # Track user's journey [NEW]
    UserPathVisualizer.js    # Render path as visual trail [NEW]
    AudioSystem.js           # Generative ambient soundscapes
    PersonalizationManager.js # User behavior tracking
    PostProcessManager.js    # Visual effects (rupture flash)
    ImageClassifier.js       # Client-side AI classification

public/
  images.json                # 2,041 records; mostly generated, no local artwork assets

scripts/
  ingest.js                  # Image ingestion pipeline
  computeLayout.js          # UMAP layout computation
  scrape.js                 # Image scraping utilities
```

## Scripts

```bash
npm test             # Browser regression: startup, failure paths, settings and rupture
npm run dev          # Start development server
npm run build        # Build for production
npm run ingest       # Run image ingestion pipeline
npm run compute-layout  # Compute UMAP layout
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| 3D Rendering | Three.js |
| Spatial Computing | WebXR Device API |
| Audio | Web Audio API |
| ML Arrangement | UMAP-JS |
| Build | Vite |

## Roadmap

### Phase 1 (Next)
- [ ] Select a small, rights-cleared and metadata-verified demo corpus
- [ ] Self-host resized artwork assets with attribution/source records
- [ ] Hand-author or verify the first meaningful rupture connections
- [ ] Manually assess the complete visual, thread and audio experience

### Phase 2 (After the core demo works)
- [ ] Replace hand-authored connections with verified vector neighbours where useful
- [ ] Verify WebXR on target hardware
- [ ] Expand ingestion only with provenance and rights metadata

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [STATUS.md](STATUS.md) - Verified status, dataset reality and next decision
- [DEVELOPMENT_FAILURES.md](DEVELOPMENT_FAILURES.md) - Failure history and lessons
- [Fable 5 revival audit](Docs/qa/2026-07-05-fable5-revival-audit.md) - Original audit plus implementation correction
- [Docs/](Docs/) - Additional documentation

---

*"We've been marking for 50,000 years. We can't stop. This is the map of that compulsion."*
