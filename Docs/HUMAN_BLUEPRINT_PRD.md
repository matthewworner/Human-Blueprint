# The Human Blueprint — Current-State Product Requirements

**Document type:** evidence-backed current-state PRD (read-only).
**Audience:** synthesises the working tree, not aspirational vision.
**Source of truth:** code at `/Users/pro/Projects/Art_History`, working tree as inspected.
**Last evidence pass:** matches `npm test` PASS and `npm run build` PASS observed during this audit.

> Aspirational vision is kept in a clearly separated appendix (`VISION_PRO_PRD.md`, `SYNPOSIS.md`, `IDEAS.md`, `Docs/TECH-DESIGN-*.md`) and is not part of these requirements.

---

## 0. Reading guide

- **Status labels** used per feature:
  - **VERIFIED** — exercised end-to-end by `scripts/smoke-test.js` or another live run described in `STATUS.md` / `Docs/qa/2026-07-05-fable5-revival-audit.md`.
  - **IMPLEMENTED-NOT-VERIFIED** — code is present and wired, but the smoke test or live run has not yet exercised it.
  - **PARTIAL/STUB** — surface exists or is declared, but the implementation is incomplete or a no-op.
  - **BLOCKED** — declared requirement cannot be satisfied by the current dataset / environment.
  - **ABSENT** — not present in code or docs.
- Each line cites `file:line` evidence; line numbers are best-effort at the time of this audit.
- Severity / acceptance gap is stated where it exists.

## 1. Verified evidence base (run during this audit)

| Check | Result | How |
|---|---|---|
| `npm test` | PASS | `node scripts/smoke-test.js` — asserts ready state, settings panel, post-destination rupture callback, hanging texture recovery, hanging metadata timeout |
| `npm run build` | PASS | Vite build, 72 modules, 1.39 MB bundle (`dist/assets/index-*.js`) |
| `node --check` over modules | PASS | Recorded in `Docs/qa/2026-07-05-fable5-revival-audit.md` |
| Real-network Puppeteer run | PASS for shell | Ready in 759 ms; rupture callback in 3.8 s; zero page errors (`STATUS.md`) |

## 2. Corpus reality (blocks the user-facing artwork experience)

| Fact | Value | Evidence |
|---|---|---|
| `public/images.json` record count | 2,041 | `wc -l` and `jq 'length'` |
| Records with `featureVector` (CLIP-style) | **41** | `jq '[.[] \| select(.featureVector)] \| length'` |
| Records with `layoutMethod: "umap"` | **39** | `jq '[.[] \| select(.layoutMethod=="umap")] \| length'` |
| Records whose `id` starts with `generated_` | ~1,950 | `STATUS.md` dataset reality section |
| Records whose `url` matches the generated Wikimedia pattern | ~1,499 | `STATUS.md`; `scripts/generate_more_images.js` |
| Records with `source` not null | 41 (Met) | `jq 'group_by(.source)'` |
| Local artwork files on disk | **0** | `STATUS.md`; no `public/images/` directory |
| `featureVector` dimensions on the 41 records | 512 | `jq '[.[] \| .featureVector \| length] \| max'` |
| Source hosts seen in `url` | `images.metmuseum.org`, `upload.wikimedia.org` | `jq -r '[.[] \| .url] \| unique'` |

**Gap:** the artefact is "2,041 records with metadata", not "2,041 artworks". The user-facing experience currently renders coloured placeholder tiles (`SceneManager.getPlaceholderColor`) for the 2,000 non-Met records and either times out, CORS-fails, or 404s for the remote URLs (`ImageLoader.js:273-282`; `STATUS.md`).

---

## 3. Feature inventory — current-state requirements

For each feature: status, description, inputs / outputs, dependencies, evidence, and acceptance gap.

### 3.1 App shell & entry point

| Feature | Status | Evidence | Inputs / Outputs | Dependencies | Acceptance gap |
|---|---|---|---|---|---|
| Vite + Three.js + ES-module entry | **VERIFIED** | `index.html:547` `<script type="module" src="/src/main.js">`; `package.json` scripts | `index.html` → `/src/main.js` | `vite@^5`, `three@^0.160` | none |
| Composition root `HumanBlueprint` | **VERIFIED** | `src/main.js:26-141` `init()` runs to `Blueprint ready.` in smoke test | DOM ready → all subsystems | DOM `#loading`, `#info-*`, `#tooltip`, `#settings-panel`, `#xr-button` | none |
| Personalisation initialised first | **IMPLEMENTED-NOT-VERIFIED** | `src/main.js:50` `new PersonalizationManager()` runs before others | n/a | localStorage `humanBlueprint_personalization` | localStorage round-trip not asserted in `npm test` |
| Graceful init failure (sets terminal error text) | **VERIFIED** | `src/main.js:36-41` writes "Unable to initialise. Reload to try again."; `scripts/smoke-test.js:55-77` exercises hanging `/images.json` path | metadata fetch failure → user-visible error | `#loading` div | none |

### 3.2 Startup / loading / failure states

| Feature | Status | Evidence | Inputs / Outputs | Dependencies | Acceptance gap |
|---|---|---|---|---|---|
| Loading screen with progress dots | **VERIFIED** | `index.html:158-194`; `src/main.js:130-148` | `onProgress({loaded,total})` → inner HTML | `ImageLoader.onProgress` | none |
| "Try Again" button on fetch failure | **VERIFIED** | `src/main.js:152-172`; `scripts/smoke-test.js:60-72` asserts `Unable to Load` text appears when `/images.json` is held | metadata HTTP failure → CTA | `#loading` element | none |
| 5 s timeout on `/images.json` | **VERIFIED** | `src/core/ImageLoader.js:115` `signal: AbortSignal.timeout(5000)`; smoke test asserts this path | fetch → abort after 5 s | `AbortSignal.timeout` | none |
| 5 s timeout on per-texture load | **VERIFIED** | `src/core/TextureManager.js:11` `loadTimeout = 5000`; `SceneManager.processTextureQueue` rejects after 5 s | texture URL → reject after 5 s | `TextureManager` | queue advances after the timeout (smoke test) |
| Loading screen hidden once ready | **VERIFIED** | `src/main.js:138` adds `.hidden`; smoke test asserts `loadingHidden === true` | ready event → DOM class | `#loading` | none |
| Metadata-first render | **VERIFIED** | `src/main.js:108` `await this.loadImages()` returns synchronously after metadata parse | n/a | ImageLoader lazy path | remote textures no longer gate first frame |
| `Blueprint ready.` log gated by success | **VERIFIED** | `src/main.js:140` console.log; smoke test asserts console marker and that a hanging metadata request does **not** emit it | init completion | n/a | smoke test covers the no-false-ready case |

### 3.3 3D scene, camera, navigation

| Feature | Status | Evidence | Inputs / Outputs | Dependencies | Acceptance gap |
|---|---|---|---|---|---|
| PerspectiveCamera 75° FOV | **VERIFIED** | `src/core/SceneManager.js:18-26` | n/a | three | none |
| Black background scene | **VERIFIED** | `src/core/SceneManager.js:13-15` | n/a | three | none |
| Ambient + directional + fill lights | **VERIFIED** | `src/core/SceneManager.js:43-58` | n/a | three | none |
| `OrbitControls` rotation, zoom | **IMPLEMENTED-NOT-VERIFIED** | `src/core/SceneManager.js:35-41` | mouse drag → camera rotation | three/examples/jsm/controls/OrbitControls.js | not asserted in `npm test`; explicitly contradicts design ("you can only attend") |
| Window resize handler | **IMPLEMENTED-NOT-VERIFIED** | `src/core/SceneManager.js:60, 320-326` | resize → renderer + composer setSize | PostProcessManager | not in `npm test` |
| `requestAnimationFrame` loop (non-XR) | **VERIFIED** | `src/main.js:798-801` `requestAnimationFrame(() => this.animate())` when `!renderer.xr.isPresenting` | frame tick | three | smoke test indirectly covers it |
| XR `setAnimationLoop` (XR mode) | **IMPLEMENTED-NOT-VERIFIED** | `src/core/SceneManager.js:267-273` | session start → animation loop callback | WebXR | not exercised in `npm test` (no headset) |
| Animated camera transport (`moveCameraWithLookAt`) | **IMPLEMENTED-NOT-VERIFIED** | `src/core/SceneManager.js:387-417` | start pos/target/duration/easing → interpolated camera | used by `RuptureSystem.executeRupture` | driven by smoke test only indirectly (via rupture path) |
| Per-image slight random Z-rotation in render | **IMPLEMENTED-NOT-VERIFIED** | `src/core/SceneManager.js:289-297` mutates `child.rotateZ` once | n/a | three | not asserted |
| Image cache (`imageObjectsCache`) | **IMPLEMENTED-NOT-VERIFIED** | `src/core/SceneManager.js:88, 99-115` | n/a | n/a | reduces scene traversal but not asserted |

### 3.4 Image plane lifecycle, LOD, texture loading

| Feature | Status | Evidence | Inputs / Outputs | Dependencies | Acceptance gap |
|---|---|---|---|---|---|
| `createImagePlane(imageData)` | **IMPLEMENTED-NOT-VERIFIED** | `src/core/SceneManager.js:289-356` | imageData → THREE.Mesh + userData | three | not in `npm test` |
| Per-image placeholder colour | **IMPLEMENTED-NOT-VERIFIED** | `src/core/SceneManager.js:358-369` `getPlaceholderColor` hash → HSL | id → THREE.Color | three | visible state during smoke test |
| Camera-distance LOD queue | **IMPLEMENTED-NOT-VERIFIED** | `src/core/SceneManager.js:373-460` `updateLOD` + `processTextureQueue` | camera position → nearest 3 unloaded planes queued, loaded one at a time | TextureManager | smoke test asserts queue advances after a hanging request |
| Throttled LOD checks every 30 frames | **IMPLEMENTED-NOT-VERIFIED** | `src/core/SceneManager.js:382-384` | frame counter → boolean | n/a | not asserted |
| Texture fade-in (300 ms) | **IMPLEMENTED-NOT-VERIFIED** | `src/core/SceneManager.js:462-479` | opacity 0→1 with `material.opacity` | three | not asserted |
| TextureManager cache + dedup + 5 s timeout | **VERIFIED (timeout)** / **IMPLEMENTED-NOT-VERIFIED (cache)** | `src/core/TextureManager.js:7-79` | URL → THREE.Texture; rejected after 5 s | three.TextureLoader | timeout verified by smoke test; cache hit rate not asserted |
| Per-URL loading promise dedup | **IMPLEMENTED-NOT-VERIFIED** | `src/core/TextureManager.js:8` `loadingPromises` map | n/a | n/a | not asserted |
| `TextureDisposalManager` (distance-based unload) | **PARTIAL/STUB** | `src/core/TextureDisposalManager.js` 130 lines; **no caller** — grep finds no import | n/a | three | declared feature, not wired; should be removed or hooked up to SceneManager per `ARCHITECTURE.md` |

### 3.5 Position strategies & arrangement

| Feature | Status | Evidence | Inputs / Outputs | Dependencies | Acceptance gap |
|---|---|---|---|---|---|
| `JSONPositionStrategy` (read `position` from JSON) | **IMPLEMENTED-NOT-VERIFIED** | `src/core/PositionStrategy.js:18-32`; default in `src/core/ImageLoader.js:18` | imageData.position[3] → {x,y,z} | n/a | not asserted |
| `SpiralPositionStrategy` (declared) | **PARTIAL/STUB** | `src/core/PositionStrategy.js:35-52` | n/a | n/a | never wired |
| `GridPositionStrategy` (declared) | **PARTIAL/STUB** | `src/core/PositionStrategy.js:57-78` | n/a | n/a | never wired |
| UMAP offline pre-compute script | **IMPLEMENTED-NOT-VERIFIED** | `scripts/computeLayout.js:16-94`; `npm run compute-layout`; outputs `layoutMethod: "umap"` | `images.json` → updated positions | umap-js | only the 41 records with feature vectors were laid out by UMAP (39 records still have UMAP positions; 2,000 records keep generator positions) |
| In-browser UMAP (`ArrangementAlgorithm.generateSimilarityArrangement`) | **PARTIAL/STUB** | `src/core/ArrangementAlgorithm.js:30-58` | featureVectors → 3D positions | umap-js | constructed in `main.js:59` but **never invoked** from `main.js`; positions come from JSON |
| Adaptive arrangement (return visitors pull favourites) | **IMPLEMENTED-NOT-VERIFIED** | `src/main.js:241-281` | per-visit stats → image position lerp | PersonalizationManager | manual visual not asserted |
| Adaptive spacing (experienced users pushed out) | **IMPLEMENTED-NOT-VERIFIED** | `src/main.js:265-272` | totalVisits > 5 → +0.5 outward push | PersonalizationManager | manual visual not asserted |

### 3.6 Gaze tracking — desktop / phone / VR / visionOS

| Feature | Status | Evidence | Inputs / Outputs | Dependencies | Acceptance gap |
|---|---|---|---|---|---|
| Mouse-based "gaze" (desktop) | **VERIFIED** | `src/core/GazeTracker.js:152-180`; smoke test asserts a pointer-gaze → rupture callback fires | mouse coords → raycast | three.Raycaster | desktop mouse is the only path covered by `npm test` |
| Touch-based gaze (phone + touch-screen desktop) | **IMPLEMENTED-NOT-VERIFIED** | `src/core/GazeTracker.js:165-179, 187-196` | touch coords → raycast | three.Raycaster | not in `npm test`; phone orientation tracking is registered but unused (`GazeTracker.js:182-187`) |
| Device orientation hook (phone) | **ABSENT — no-op** | `src/core/GazeTracker.js:182-187` only attaches a no-op listener | n/a | DeviceOrientationEvent | handler body empty |
| VR headset gaze (camera-forward fallback) | **IMPLEMENTED-NOT-VERIFIED** | `src/core/GazeTracker.js:294-321` | XR viewer pose → gaze ray | WebXR | not in `npm test`; no headset in CI |
| WebXR eye-tracking support probe | **PARTIAL/STUB** | `src/core/GazeTracker.js:109-128, 86-99` | session → reference space | WebXR `eye-tracking` | probe only; `navigator.xr.isSessionSupported` doesn't accept feature flags, so this can't actually verify eye-tracking support until session request — relies on browser allow/deny. Not exercised in `npm test`. |
| Vision Pro detection (UA heuristic) | **PARTIAL/STUB** | `src/core/GazeTracker.js:78-104` | UA sniff → device type | n/a | no real Vision Pro in CI; heuristics only |
| Vision Pro confidence threshold / smoothing / prediction | **PARTIAL/STUB** | `src/core/GazeTracker.js:213-225, 333-381` | n/a | n/a | declared but never observed on real hardware |
| Dwell detection (3 s default) | **VERIFIED** | `src/core/RuptureSystem.js:23`; `src/core/GazeTracker.js:24` `dwellingThreshold = 2000`; smoke test observes `RUPTURE triggered:` | gaze duration ≥ threshold → rupture callback | GazeTracker, RuptureSystem | smoke test confirms callback fires |
| Pattern events `dwelling` / `scanning` / `returning` from GazeTracker | **IMPLEMENTED-NOT-VERIFIED** | `src/core/GazeTracker.js:512-540` | gaze state → patternType | PersonalizationManager | emitted to console but RuptureSystem does **not** subscribe to them as triggers |
| Gaze reset on rupture | **IMPLEMENTED-NOT-VERIFIED** | `src/core/RuptureSystem.js:1083` `this.gazeTracker.reset()`; `src/core/GazeTracker.js:608-619` | rupture → reset | n/a | not asserted |

### 3.7 Rupture system (the eight declared types)

Eight rupture types are declared in `src/core/RuptureSystem.js:6-14`. Only four have **active detectors**, and only **DWELLING** is wired to a desktop mouse source.

| Type | Declared | Active detector? | Trigger wired? | Evidence |
|---|---|---|---|---|
| DWELLING | yes | yes (via `updateDwell`) | yes | `RuptureSystem.js:23, 641-680`; smoke test fires it |
| AVOIDANCE | yes | **no** | no | declared at `RuptureSystem.js:8, 67-71`; `lastSeenTimes` initialised at `:27` but never read by a detector |
| SCANNING | yes | **no** | no | declared at `:9, 72-76`; `GazeTracker` emits `scanning` patterns but no `checkForScanning` exists |
| RETURNING | yes | **no** | no | declared at `:10, 77-81`; `GazeTracker` emits `returning` patterns but no detector |
| RAPID_MOVEMENT | yes | yes (`detectRapidMovement`) | yes | `RuptureSystem.js:225-237` (called from `checkForRuptures` at `:194`) |
| PATTERN_RECOGNITION | yes | yes (`detectPatternRecognition`) | yes | `RuptureSystem.js:239-253` (called from `:199`) |
| EMOTIONAL_INTENSITY | yes | yes (`detectEmotionalIntensity`) | yes | `RuptureSystem.js:299-302` (called from `:204`) |
| TEMPORAL_DISPLACEMENT | yes | yes (`detectTemporalDisplacement`) | yes | `RuptureSystem.js:304-308` (called from `:209`) |

**Acceptance gap:** the published architecture claims eight production-ready rupture types (`ARCHITECTURE.md` table); only DWELLING is reachable in current runtime. The other four active detectors require sustained high engagement, rapid movement, or pattern recognition — none of which are exercised by the smoke test.

| Other rupture-related requirement | Status | Evidence | Acceptance gap |
|---|---|---|---|
| 10 s cooldown between ruptures | **IMPLEMENTED-NOT-VERIFIED** | `RuptureSystem.js:55, 287` | not asserted |
| Per-type transition params (speed/fade/highlight) | **IMPLEMENTED-NOT-VERIFIED** | `RuptureSystem.js:62-95` | not asserted |
| Visual rupture via post-processing (chromatic aberration + bloom + film noise + custom shader) | **IMPLEMENTED-NOT-VERIFIED** | `src/core/RuptureSystem.js:1043-1077` calls `setRuptureIntensity`; `src/core/PostProcessManager.js:79-95` | spike 0→1→0 over 800 ms; not asserted |
| Per-type pulse/distortion effects (rapid_movement, emotional, temporal) | **IMPLEMENTED-NOT-VERIFIED** | `RuptureSystem.js:447-498` | `setInterval` based; cleanup in `destroy()` (`RuptureSystem.js:1063-1078`) |
| `findConnectedImage` heuristic (different era/region + similar type/colour) | **IMPLEMENTED-NOT-VERIFIED** | `RuptureSystem.js:692-754` | relies on generated metadata (`region`, `colors`, `type`); will pick from the random distribution today |
| `executeRupture` camera transport + camera-offset disorientation + easing | **IMPLEMENTED-NOT-VERIFIED** | `RuptureSystem.js:774-823` | per-type easing; not asserted |
| Destination highlight + nearby-image glow | **IMPLEMENTED-NOT-VERIFIED** | `RuptureSystem.js:837-887` | not asserted |
| `completeRupture` cleanup + thread shrink | **IMPLEMENTED-NOT-VERIFIED** | `RuptureSystem.js:897-928` | not asserted |
| `RuptureSystem.destroy()` | **IMPLEMENTED-NOT-VERIFIED** | `RuptureSystem.js:1040-1078` | wired in `main.js:894` |

### 3.8 Thread visualization

| Feature | Status | Evidence | Inputs / Outputs | Dependencies | Acceptance gap |
|---|---|---|---|---|---|
| Create thread mesh (CatmullRomCurve3 + TubeGeometry) | **IMPLEMENTED-NOT-VERIFIED** | `src/core/ThreadVisualization.js:34-110` | source/dest → mesh | three | not asserted |
| Four thread styles: solid / pulse / energy / dashed | **IMPLEMENTED-NOT-VERIFIED** | `src/core/ThreadVisualization.js:62-110` custom shader/material per style | per-style ShaderMaterial | three | not asserted |
| Growth animation (scale 0→1 over `duration`) | **IMPLEMENTED-NOT-VERIFIED** | `src/core/ThreadVisualization.js:243-265` | elapsed/duration → eased scale | three | smoke test asserts post-destination rupture but not the visible thread |
| Connected-state subtle pulse + auto-shrink after `fadeOutDelay` | **IMPLEMENTED-NOT-VERIFIED** | `src/core/ThreadVisualization.js:268-283` | n/a | three | not asserted |
| Shrink animation + dispose | **IMPLEMENTED-NOT-VERIFIED** | `src/core/ThreadVisualization.js:286-318` | n/a | three | not asserted |
| Per-rupture-type style / colour / duration table | **IMPLEMENTED-NOT-VERIFIED** | `src/core/ThreadVisualization.js:337-403` | ruptureType → style+colour+duration | n/a | not asserted |
| Rupture system drives thread lifecycle | **IMPLEMENTED-NOT-VERIFIED** | `src/core/RuptureSystem.js:823-849` `createThreadVisualization`; `RuptureSystem.js:921` `startThreadShrink` | rupture → thread | ThreadVisualization | smoke test asserts rupture; thread itself not asserted |
| `ThreadVisualization.destroyAll()` cleanup | **IMPLEMENTED-NOT-VERIFIED** | `src/core/ThreadVisualization.js:331-335`; called in `RuptureSystem.destroy()` | n/a | n/a | not asserted |

### 3.9 Tooltip & HUD

| Feature | Status | Evidence | Acceptance gap |
|---|---|---|---|
| Tooltip with title / meta / era, Apple-style card | **VERIFIED** | `index.html:217-262` markup; `src/main.js:299-353` `setupTooltip`; smoke test asserts `tooltipTitle` is non-empty and not `generated_` | tooltip title comes from `imageData.metadata.title` or `.id`; smoke test only asserts the renderer saw a title, not that it is meaningful |
| Loading progress copy (`X of 2,041 images`) | **IMPLEMENTED-NOT-VERIFIED** | `src/main.js:178-191` `updateLoadingProgress` | not asserted |
| Info panel (phase / instructions / status) | **IMPLEMENTED-NOT-VERIFIED** | `index.html:485-490`; `src/main.js:751-781` `updatePersonalizedInfoDisplay` | smoke test asserts `artworkCount` matches `/2041/` |
| Personalised "Welcome Back" message | **IMPLEMENTED-NOT-VERIFIED** | `src/main.js:751-781`; `PersonalizationManager.getVisitStats` | localStorage round-trip |
| Subtle grain overlay | **IMPLEMENTED-NOT-VERIFIED** | `index.html:80-87` body::before SVG noise | n/a |

### 3.10 Settings panel

| Feature | Status | Evidence | Inputs / Outputs | Dependencies | Acceptance gap |
|---|---|---|---|---|---|
| Settings card open/close (gear button, X button, Escape key) | **VERIFIED** | `index.html:512-562`; `src/main.js:361-411`; smoke test clicks `#settings-toggle` and asserts `.visible` class | user input → panel state | HapticFeedback | none |
| Volume slider → `AudioSystem.setMasterVolume` | **IMPLEMENTED-NOT-VERIFIED** | `src/main.js:413-431` `setting-volume`; `AudioSystem.setMasterVolume` at `:850-868` | slider 0-100 → master gain 0-1 | AudioSystem | smoke test asserts the panel opens; value wiring not asserted |
| Intensity slider → `setFadeIntensity` + `setHighlightIntensity` | **IMPLEMENTED-NOT-VERIFIED** | `src/main.js:432-450` | slider 0-100 → fade 0..0.5, highlight 0..1.5 | RuptureSystem | not asserted |
| Speed slider → `setTransitionSpeed` (400-3000 ms) | **IMPLEMENTED-NOT-VERIFIED** | `src/main.js:451-470` | slider → ms | RuptureSystem | not asserted |
| Dwell slider → `setDwellThreshold` (1-10 s) | **IMPLEMENTED-NOT-VERIFIED** | `src/main.js:471-485` | slider → ms | RuptureSystem | not asserted |
| Path toggle → `UserPathVisualizer.setEnabled` | **IMPLEMENTED-NOT-VERIFIED** | `src/main.js:486-499` | checkbox → boolean | UserPathVisualizer | not asserted |
| Settings persistence | **PARTIAL/STUB** | `src/main.js:503-509` `saveSetting` calls `personalizationManager.loadData('settings')` / `saveData('settings')` — **but `PersonalizationManager.loadData()` takes no argument** (`PersonalizationManager.js:69`); key is ignored; whole object is round-tripped through `data.attention`/`data.preferences` only. Per-setting save/load does not actually round-trip across reloads. | localStorage | gap: per-key persistence is broken |

### 3.11 Audio system

| Feature | Status | Evidence | Acceptance gap |
|---|---|---|---|
| Web Audio API context, master gain, reverb (4 s IR) | **IMPLEMENTED-NOT-VERIFIED** | `src/core/AudioSystem.js:60-115` | starts only after user interaction (autoplay policy) |
| Audio starts on first user interaction (click/touch) | **IMPLEMENTED-NOT-VERIFIED** | `src/main.js:574-595` `startSoundscapeOnInteraction` | not asserted |
| Three drone oscillators (sine/triangle/saw), detuned ±11 / 0 / +7 cents, LFOs at 0.1-0.2 Hz | **IMPLEMENTED-NOT-VERIFIED** | `src/core/AudioSystem.js:312-371` `createDroneLayers` | not asserted |
| Subtle noise layer (low-pass at 150 Hz, gain 0.02) | **IMPLEMENTED-NOT-VERIFIED** | `src/core/AudioSystem.js:117-144` | not asserted |
| PannerNode spatial positioning (HRTF mode) | **IMPLEMENTED-NOT-VERIFIED** | `src/core/AudioSystem.js:386, 540-580` `updateSpatialPositioning`; `binauralEnabled = false` so uses native `HRTF` panning | native path; no assertion in `npm test` |
| Listener position set to origin (does not track camera) | **IMPLEMENTED-NOT-VERIFIED** | `src/core/AudioSystem.js:77-87`; listener never updated to follow `this.camera` | per-frame listener-tracking is missing; positions are passed as relative offsets to the panner (`AudioSystem.js:540-580`) which partially mitigates |
| Era → base frequency mapping (50-180 Hz) | **IMPLEMENTED-NOT-VERIFIED** | `src/core/AudioSystem.js:498-518` `updateFrequencyFromEra` | not asserted |
| Colour → timbre/waveform mapping | **IMPLEMENTED-NOT-VERIFIED** | `src/core/AudioSystem.js:441-496` `updateTimbreFromColors` | not asserted |
| Per-frame parameter smoothing (100 ms `setTargetAtTime`) | **IMPLEMENTED-NOT-VERIFIED** | `src/core/AudioSystem.js:604-651` `smoothParameterUpdates` | not asserted |
| Movement-speed Doppler-like modulation | **IMPLEMENTED-NOT-VERIFIED** | `src/core/AudioSystem.js:582-602` | not asserted |
| Rupture audio cut (400 ms) + dissonant chord (sawtooth ×3) | **IMPLEMENTED-NOT-VERIFIED** | `src/core/AudioSystem.js:708-771` `triggerRupture` | not asserted |
| Custom binaural HRTF convolver path (`createBinauralSource`) | **PARTIAL/STUB** | `src/core/AudioSystem.js:223-259, 167-221` | **declared and never invoked** by any caller (`grep` finds no caller); runtime path uses native PannerNode HRTF instead (`binauralEnabled = false`) |
| `AudioSystem.setMasterVolume(volume 0-1)` | **IMPLEMENTED-NOT-VERIFIED** | `src/core/AudioSystem.js:850-868` | called from settings slider |
| `AudioSystem.destroy()` | **IMPLEMENTED-NOT-VERIFIED** | `src/core/AudioSystem.js:822-848`; wired in `main.js:898` | not asserted |
| `listener` field on AudioSystem referenced for camera tracking | **PARTIAL/STUB** | `AudioSystem.js:77-87` sets position once, never updates to follow camera | spatial cues will drift if camera moves |

### 3.12 Personalisation / persistence / user path

| Feature | Status | Evidence | Acceptance gap |
|---|---|---|---|
| Visit counter + timestamps | **IMPLEMENTED-NOT-VERIFIED** | `src/core/PersonalizationManager.js:158-181` | localStorage; bounded to 50 timestamps |
| Per-image view count, dwell time, lastViewed | **IMPLEMENTED-NOT-VERIFIED** | `src/core/PersonalizationManager.js:184-225` | bounded to 100 images (`MAX_TRACKED_IMAGES`); LRU prune at `:33-58` |
| Gaze pattern counters (scanning / dwelling / returning) | **IMPLEMENTED-NOT-VERIFIED** | `src/core/PersonalizationManager.js:228-239` | not driven by RuptureSystem |
| Adaptive rupture threshold / transition speed / visual intensity | **IMPLEMENTED-NOT-VERIFIED** | `src/core/PersonalizationManager.js:265-307` | re-applied every ~5 min via random frame branch (`main.js:782-793`) |
| localStorage key-bound load/save | **PARTIAL/STUB** | `src/core/PersonalizationManager.js:69-95` `loadData()` ignores its argument and returns the full object; `saveData()` writes the whole object. Per-key callers (`main.js:364, 489-491`) therefore have no isolation — settings keys and `userPath` keys all sit on a single flat object and risk stomping each other | gap: per-key persistence does not actually round-trip across reloads |
| localStorage quota / size guard | **IMPLEMENTED-NOT-VERIFIED** | `src/core/PersonalizationManager.js:121-153` | n/a |
| `UserPathTracker` startView / endView / addConnection | **IMPLEMENTED-NOT-VERIFIED** | `src/core/UserPathTracker.js:34-118` | not asserted |
| `UserPathTracker.persistViewData` / `loadFromPersistence` | **IMPLEMENTED-NOT-VERIFIED** | `src/core/UserPathTracker.js:177-203` | relies on broken per-key `PersonalizationManager.loadData('userPath')` (see above) |
| `UserPathVisualizer` path lines + viewed markers | **IMPLEMENTED-NOT-VERIFIED** | `src/core/UserPathVisualizer.js:53-117` | wired in `main.js:222-235, 543-545` |
| Path-line / ring opacity + aging | **IMPLEMENTED-NOT-VERIFIED** | `src/core/UserPathVisualizer.js:121-141` | not asserted |
| `UserPathVisualizer.setEnabled` / toggle | **IMPLEMENTED-NOT-VERIFIED** | `src/core/UserPathVisualizer.js:158-178` | wired to settings path toggle |

### 3.13 Haptics / dwell indicator

| Feature | Status | Evidence | Acceptance gap |
|---|---|---|---|
| `HapticFeedback.light()` (10 ms) on gaze start | **IMPLEMENTED-NOT-VERIFIED** | `src/core/HapticFeedback.js:25-29`; called at `main.js:507` | uses `navigator.vibrate`; desktop browsers silently no-op |
| `HapticFeedback.medium()` (30 ms) on rupture | **IMPLEMENTED-NOT-VERIFIED** | `src/core/HapticFeedback.js:31-35`; called at `main.js:548` | same |
| `HapticFeedback.success()` on settings change | **IMPLEMENTED-NOT-VERIFIED** | `src/core/HapticFeedback.js:37-41`; called at `main.js:418, 437` | same |
| `HapticFeedback.warning()` / `error()` / `pattern()` / `stop()` | **PARTIAL/STUB** | `src/core/HapticFeedback.js:43-72` | declared, no callers in current code |
| `DwellProgressIndicator` (ring) startDwell / update / endDwell / destroy | **IMPLEMENTED-NOT-VERIFIED** | `src/core/DwellProgressIndicator.js:5-117`; wired at `main.js:130-135, 562-568, 587` | ring orients to camera; fades out when no target |

### 3.14 Post-processing

| Feature | Status | Evidence | Acceptance gap |
|---|---|---|---|
| `EffectComposer` chain | **IMPLEMENTED-NOT-VERIFIED** | `src/core/PostProcessManager.js:32-67` | not asserted |
| `UnrealBloomPass` (strength 0.5, radius 0.4, threshold 0.85) | **IMPLEMENTED-NOT-VERIFIED** | `PostProcessManager.js:44-46` | not asserted |
| `FilmPass` 2-arg (noise + grayscale) — current Three.js API | **IMPLEMENTED-NOT-VERIFIED** | `PostProcessManager.js:49-53` `new FilmPass(noiseIntensity, grayscale)` | matches revivor's note that the obsolete 4-arg call was fixed |
| Custom chromatic-aberration + vignette `ShaderPass` | **IMPLEMENTED-NOT-VERIFIED** | `PostProcessManager.js:69-103` | n/a |
| Custom `RuptureShader` (screen distortion) | **IMPLEMENTED-NOT-VERIFIED** | `src/core/shaders/RuptureShader.js`; wired at `PostProcessManager.js:56-59, 90-94` | n/a |
| `setRuptureIntensity(intensity 0-1)` | **IMPLEMENTED-NOT-VERIFIED** | `PostProcessManager.js:79-95`; called from `RuptureSystem.triggerVisualRupture` | spike 0→1→0 over 800 ms |

### 3.15 Click / interaction

| Feature | Status | Evidence | Acceptance gap |
|---|---|---|---|
| Mouse click hit-test on image plane | **IMPLEMENTED-NOT-VERIFIED** | `src/core/SceneManager.js:117-145` `handleClick` | not asserted in `npm test`; smoke test exercises dwell, not click |
| Touch end hit-test (mobile) | **IMPLEMENTED-NOT-VERIFIED** | `src/core/SceneManager.js:122-131` | n/a |
| Per-image scale-up animation on click | **IMPLEMENTED-NOT-VERIFIED** | `src/main.js:296-305` `handleImageClick` | n/a |

### 3.16 Adaptive / visual feedback during gaze

| Feature | Status | Evidence | Acceptance gap |
|---|---|---|---|
| Subtle scale + breathing while gazed | **IMPLEMENTED-NOT-VERIFIED** | `src/main.js:712-734` `updateImageFeedback` | n/a |
| Soft emissive (0x222222) while gazed | **IMPLEMENTED-NOT-VERIFIED** | `src/main.js:721` | n/a |

### 3.17 WebXR / visionOS

| Feature | Status | Evidence | Acceptance gap |
|---|---|---|---|
| WebXR renderer flag enabled | **IMPLEMENTED-NOT-VERIFIED** | `src/core/SceneManager.js:33` `this.renderer.xr.enabled = true` | n/a |
| `navigator.xr.isSessionSupported('immersive-vr'/'ar')` probe | **IMPLEMENTED-NOT-VERIFIED** | `src/core/SceneManager.js:200-225` `setupWebXR` | n/a |
| `requestSession('immersive-vr', {requiredFeatures:['local-floor'], optionalFeatures:['bounded-floor','hand-tracking','eye-tracking']})` | **IMPLEMENTED-NOT-VERIFIED** | `src/core/SceneManager.js:233-274` `enterXR` | not exercised in `npm test` |
| Eye-level reference space request for eye tracking | **PARTIAL/STUB** | `src/core/GazeTracker.js:126-148` `initializeEyeTracking`; calls `requestReferenceSpace('eye-tracking')` in visionOS path at `:222-235` | the `'eye-tracking'` reference space is not a real WebXR feature name (the standard feature is `requiredFeatures:['eye-tracking']` on the session); the call will reject. Code path exists, runtime path is not correct |
| XR animation loop hooked to `xrUpdateCallback` | **IMPLEMENTED-NOT-VERIFIED** | `src/core/SceneManager.js:267-273`; `main.js:613-639` `updateXR` | n/a |
| `xr-button` enabled when immersive-vr is supported | **IMPLEMENTED-NOT-VERIFIED** | `src/main.js:610-634` `setupXRButton` | the smoke test does not toggle WebXR |
| `exitXR` cleanup (session end + reset gaze tracker) | **IMPLEMENTED-NOT-VERIFIED** | `src/core/SceneManager.js:276-289` | n/a |
| visionOS native projects (visionOS + macOS) | **PARTIAL/STUB** | `HumanBlueprint/visionOS/HumanBlueprint/{CoreModels.swift,MarkWorldContent.swift}` (961 lines total); `visionOS/ProofOfConcept/MarkEntity.swift` (1 file); `HumanBlueprint/macOS/HumanBlueprint.swift` (1 file). **4 Swift files in total**, not a buildable visionOS app | "ARKit eye tracking with WorldTrackingProvider" and other production TODOs listed at `MarkWorldContent.swift:11-17` |

### 3.18 Ingestion / classification / dataset

| Feature | Status | Evidence | Acceptance gap |
|---|---|---|---|
| `scripts/ingest.js` (pipeline orchestrator) | **PARTIAL/STUB** | `scripts/ingest.js` 119 lines; calls `ScrrapingPipeline.js`, classification TODO | n/a |
| `scripts/ScrapingPipeline.js` | **IMPLEMENTED-NOT-VERIFIED** | 564 lines; museum APIs | n/a |
| `scripts/CLIImageClassifier.js` (CLIP via @xenova/transformers) | **IMPLEMENTED-NOT-VERIFIED** | 60 lines; lazy init | n/a |
| `scripts/scrape.js` | **IMPLEMENTED-NOT-VERIFIED** | 70 lines | n/a |
| `scripts/computeLayout.js` (UMAP) | **IMPLEMENTED-NOT-VERIFIED** | 98 lines; outputs `layoutMethod: "umap"` | applied only to the 41 records with vectors (39 actually have UMAP positions) |
| `scripts/generate.js` / `generate.py` / `generate_more_images.js` | **IMPLEMENTED-NOT-VERIFIED** | 158 + 145 + 85 lines | produces the 1,500+ generated records with fabricated Wikimedia URLs — source of the dataset problem |
| `scripts/updateMetadata.js` / `addCaveArtMetadata.js` / `addHistoricalMetadata.js` / `addPatternMetadata.js` | **IMPLEMENTED-NOT-VERIFIED** | 127/192/124/152 lines | n/a |
| `src/core/ImageClassifier.js` (browser-side) | **PARTIAL/STUB** | explicit stub comment: `"ImageClassifier: Using lightweight stub. AI processing is done at build time via CLI."` (`ImageClassifier.js:11`); returns existing metadata | only invoked if no `featureVector` and `skipClientAI === false`; default behaviour is no AI in the browser |
| `src/core/ArrangementAlgorithm.js` UMAP at runtime | **PARTIAL/STUB** | instantiated at `main.js:59`; **never called** from `main.js` | dead in the runtime path |

### 3.19 Accessibility

| Feature | Status | Evidence | Acceptance gap |
|---|---|---|---|
| `prefers-reduced-motion` media query | **IMPLEMENTED-NOT-VERIFIED** | `index.html:457-464` | n/a |
| `prefers-contrast: high` media query | **IMPLEMENTED-NOT-VERIFIED** | `index.html:466-471` | n/a |
| ARIA labels on canvas, buttons, sliders, switch | **IMPLEMENTED-NOT-VERIFIED** | `index.html:494, 507, 508, 515, 520-546` | not asserted |
| Visible focus / keyboard navigation beyond Escape-close | **ABSENT** | grep for focus styles returns no result; no `:focus-visible` rules; sliders not keyboard-tested | only Esc-to-close settings panel is wired (`main.js:404-407`) |
| Skip-to-content link | **PARTIAL/STUB** | `index.html:492` link exists but is `position:absolute;left:-9999px;` and `onclick="this.remove()"` removes itself on first click | functionally a no-op |
| Screen-reader semantics for the 3D scene | **ABSENT** | only a `role="application"` wrapper; no image-level ARIA, no live region for ruptures, no alt text on a non-existent image-only canvas | the canvas has no fallback content; no live-region announcements for state changes |

### 3.20 Persistence & cleanup

| Feature | Status | Evidence | Acceptance gap |
|---|---|---|---|
| `HumanBlueprint.cleanup()` on `beforeunload` | **IMPLEMENTED-NOT-VERIFIED** | `src/main.js:141-145`; `main.js:861-911` | not asserted |
| `UserPathTracker.persistViewData()` on unload | **IMPLEMENTED-NOT-VERIFIED** | `main.js:874-877` | relies on broken per-key loadData |
| `UserPathVisualizer.destroy()` on unload | **IMPLEMENTED-NOT-VERIFIED** | `main.js:880-883` | n/a |
| `RuptureSystem.destroy()` on unload | **IMPLEMENTED-NOT-VERIFIED** | `main.js:886-890` | n/a |
| `AudioSystem.destroy()` on unload | **IMPLEMENTED-NOT-VERIFIED** | `main.js:892-896` | n/a |
| `GazeTracker.destroy()` on unload (currently `null`-assignment only) | **PARTIAL/STUB** | `main.js:900-903` | doesn't actually call `gazeTracker.destroy()`; just sets the field to null. `GazeTracker.destroy()` exists (`GazeTracker.js:633-658`) but is not invoked here |
| `DwellProgressIndicator.destroy()` on unload | **IMPLEMENTED-NOT-VERIFIED** | `main.js:905-908` | n/a |
| `SceneManager.destroy()` | **ABSENT** | grep finds no `destroy()` on `SceneManager`; `main.js:911-915` invokes `this.sceneManager.destroy?.()` (optional chaining returns undefined) | declared requirement (`ARCHITECTURE.md` "Cleanup is partial…") — texture ownership, OrbitControls, listeners and the renderer are not torn down on unmount |
| `TextureDisposalManager.destroy()` | **PARTIAL/STUB** | implemented (`TextureDisposalManager.js:166-170`) but **never instantiated** | dead code |

### 3.21 Composition summary

`src/main.js` is the only composition root. Sequence on `init()`:

1. `PersonalizationManager` (line 50)
2. `SceneManager` (line 56)
3. `ImageLoader` (line 57)
4. `ArrangementAlgorithm` (line 59 — **not used at runtime**)
5. Optional block (try/catch): `GazeTracker` (62), `AudioSystem` (65), `RuptureSystem` (72-79), `UserPathTracker` (84), `UserPathVisualizer` (86)
6. `loadImages()` (108) → `arrangeImages()` (200)
7. `startSoundscapeOnInteraction()` (118)
8. `startInteraction()` (494)
9. `setupXRButton()` (610)
10. `updatePersonalizedInfoDisplay()` (118)
11. `setupTooltip()` (299)
12. `setupSettingsPanel()` (361)
13. `DwellProgressIndicator` (130-135)
14. Hide loading, log ready (137-140)
15. Register `beforeunload` cleanup (141-145)

The optional block (5) is wrapped in `try/catch` (60-89) so the app still becomes "ready" without gaze/audio/rupture/path — `npm test` exercises this fall-through indirectly (the smoke test fires the rupture via `console.log`, not via a verified DOM event).

---

## 4. Acceptance gaps by severity

### 4.1 BLOCKER — corpus integrity
- 2,041 records is not 2,041 artworks. 1,950 are generated (`STATUS.md`; `images.json`). Self-hosting the current file wholesale is forbidden by `CHANGELOG.md` / `Docs/qa/2026-07-05-fable5-revival-audit.md`.

### 4.2 HIGH — runtime path coverage
- **PersonalizationManager.loadData / saveData are not key-bound.** `PersonalizationManager.js:69-95` ignores the argument and round-trips the entire object. Settings persistence (`main.js:489-491`) and user-path persistence (`UserPathTracker.js:194-198`) therefore share one flat blob and are not isolated. Cross-reload restoration is not actually exercised by `npm test`.
- **Only one of eight declared rupture types is reachable from a real input.** Avoidance, scanning and returning are declared (`RuptureSystem.js:8-10, 67-81`) and emitted by GazeTracker (`GazeTracker.js:512-540`) but no detector subscribes. The architecture table claims eight behaviours; runtime has one.
- **`TextureDisposalManager` is dead code.** 130 lines, never imported (`grep` confirms no caller). Per `ARCHITECTURE.md` it should be removed or wired into the active texture path.

### 4.3 MEDIUM — visual / audio not asserted
- Visual: tooltip quality, thread visibility, post-processing chain, dwell ring, image-feedback breathing are not asserted by `npm test`. The smoke test only confirms rupture *callback* fired.
- Audio: `AudioSystem` runtime is not asserted; the binaural convolver path is dead code (`createBinauralSource` has no caller); listener does not track camera (`AudioSystem.js:77-87`).

### 4.4 MEDIUM — WebXR / visionOS
- Eye-tracking reference space is requested with the wrong feature name (`GazeTracker.js:222-235` requests `'eye-tracking'` reference space; the standard is `requiredFeatures:['eye-tracking']` on `requestSession`). Code path exists, runtime will reject.
- Native projects: 4 Swift files; not a buildable visionOS app. Many TODOs in `MarkWorldContent.swift:11-17`.

### 4.5 LOW — accessibility / cleanup
- No focus-visible styles, only Esc-to-close, screen readers get only `role="application"`.
- `SceneManager.destroy()` does not exist; `HumanBlueprint.cleanup()` therefore can't release the renderer, OrbitControls, the texture cache or resize listeners.

### 4.6 LOW — runtime-only stubs
- `ArrangementAlgorithm` instantiated but never invoked (`main.js:59`).
- `SpiralPositionStrategy`, `GridPositionStrategy` defined but never used.
- `HapticFeedback.warning/error/pattern/stop` defined, no callers.
- `RuptureShader` declared but no behaviour visible to `npm test`.

---

## 5. Verified runbook (mirrors `STATUS.md`)

```
npm install
npm test          # Puppeteer: ready state, settings, rupture callback, hanging texture/metadata
npm run dev       # manual desktop check at http://localhost:5173
npm run build     # Vite production build, 72 modules
npm run ingest    # stub pipeline
npm run compute-layout  # pre-compute UMAP for any records with featureVector
```

`npm test` PASS and `npm run build` PASS were observed during this audit (see §1).

---

## 6. What is NOT a current-state requirement (kept here only to disambiguate)

The following appear in the codebase or docs but are **not** running features; treat them as aspirational design records (`Docs/VISION_PRO_PRD.md`, `SYNPOSIS.md`, `Docs/TECH-DESIGN-thread-visualization.md`, `Docs/TECH-DESIGN-user-path.md`, `IDEAS.md`):

- Anti-comfort personalisation that "uses knowledge *against* the user" (`SYNPOSIS.md`).
- Eye-tracking as the *primary* input on Vision Pro; "you can only attend" (`Docs/VISION_PRO_PRD.md`).
- Vision Pro "high-precision" smoothing / prediction / confidence threshold (`GazeTracker.js:213-225, 333-381`).
- "Show me cave paintings" / voice commands / hand-based navigation (`IDEAS.md`).
- Multi-user synchronized viewing, PWA, collaborative annotations (`IDEAS.md`).
- Per-type rupture UX promises that imply reachability (avoidance / scanning / returning detectors).
- The eight-style table in `ARCHITECTURE.md` as a "production-ready" claim.
- Full texture-disposal LOD pipeline (`TextureDisposalManager`).
- Custom binaural convolver path (`createBinauralSource`).

These items belong in a separate aspirational / vision document, not in this PRD.

---

## 7. Open questions for the next decision

1. **Corpus.** Select a small, rights-cleared, metadata-verified set; self-host resized assets. (`STATUS.md` next-decision; `CHANGELOG.md` known-limitations.)
2. **Key-bound persistence.** Either fix `PersonalizationManager.loadData/saveData` to accept a key, or remove the callers that pass one.
3. **Rupture detector honesty.** Either implement avoidance / scanning / returning detectors or remove the declarations from `RuptureSystem.js` and the architecture table.
4. **Eye-tracking correctness.** Replace the `'eye-tracking'` reference space request with the standard `requiredFeatures:['eye-tracking']` session feature.
5. **`SceneManager.destroy()`.** Add a real teardown (renderer, OrbitControls, listeners, texture cache) so the composition root's `cleanup()` is honest.
6. **`TextureDisposalManager`.** Wire it into `SceneManager`'s LOD path or delete it.
7. **Mobile parity.** Implement the phone-orientation handler and add mobile coverage to `npm test`.
8. **Accessibility baseline.** Focus-visible styles, live-region for rupture events, alt-content for the canvas.