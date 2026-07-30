# The Human Blueprint — Status

**Last updated:** 2026-07-30

## Stage

**BOOT REVIVED — 41-WORK REAL CORPUS SELF-HOSTED**

The web app starts, renders its Three.js scene, opens settings, completes the desktop pointer-gaze → rupture callback path, and now renders real artwork: the 41 genuine Met records have been downloaded, resized to WebP and self-hosted locally. Verified by an automated Puppeteer smoke test (including an assertion that at least one texture lands on a plane) and the production build.

The 2,000 fabricated Wikimedia records were dropped, so the field is honest but sparse (41 works). Per-record licence/attribution fields are not yet recorded, and the visual rupture/thread experience still needs a human walkthrough.

## Verification

| Check | Result | Evidence |
|:---|:---|:---|
| Production build | ✅ PASS | `npm run build`: 72 modules, 1.39 MB bundle |
| Browser smoke test | ✅ PASS | `npm test` |
| Ready state with a permanently hanging artwork request | ✅ PASS | App becomes ready before textures; LOD queue advances after the 5 s timeout |
| Hanging `/images.json` request | ✅ PASS | Aborted after 5 s; error remains visible; false ready is prevented |
| Settings panel | ✅ PASS | Opened by Puppeteer after ready |
| Desktop pointer-gaze → destination rupture callback | ✅ PASS | Triggered automatically without page errors |
| Real-network browser run | ✅ PASS for shell | Ready in 759 ms; rupture callback in 3.8 s; zero page errors |
| Real artwork rendering | ✅ PASS | 41 Met images self-hosted as WebP in `public/images/` (~2.2 MB); smoke test asserts ≥1 texture lands on a plane |

## Feature reality

| Feature | Current status |
|:---|:---|
| App shell / Three.js scene | **VERIFIED** |
| Settings panel | **VERIFIED** |
| Desktop mouse raycast (“gaze”) | **VERIFIED** |
| Dwell → rupture destination callback | **VERIFIED** |
| Thread creation/update path | **AUTOMATED PATH VERIFIED**; visual quality still needs a manual walkthrough |
| Audio runtime after user interaction | **NO PAGE ERRORS**; sound quality not manually assessed |
| Tooltip metadata | **FIXED**; now reads flattened metadata |
| User-path persistence/visual trail | **CODED, NOT MANUALLY VERIFIED** |
| WebXR / eye tracking / visionOS | **NOT VERIFIED / NATIVE PORT IS A STUB** |
| 41 real Met artworks | **SELF-HOSTED** — local WebP, real metadata; per-record licence fields still TODO |

## Dataset reality

`public/images.json` now contains **41 records**, all genuine Met works:

- All 41 point to local assets (`/images/<id>.webp`, ~2.2 MB total, max edge 800 px).
- All 41 carry real `metadata` (title, artist, date, culture, medium, department) and a 512-dim `featureVector`.
- The 2,000 fabricated `generated_*` / `upload.wikimedia.org` records were removed by `scripts/curate-met-corpus.js`.

Still missing: per-record licence/attribution/canonical-source fields. The Met's Open Access policy covers public-domain CRDImages, but each object's `isPublicDomain` status has not been individually verified and recorded.

## Implemented revival work

- Metadata-first startup: remote textures no longer gate first render.
- Five-second timeouts for metadata and texture requests.
- Shared, timeout-bounded LOD texture queue with cheap colour placeholders.
- Correct terminal loading/error ownership; metadata failure cannot emit `Blueprint ready.`.
- Fixed missing rupture update wiring, Three.js `FilmPass` API drift and audio autoplay/custom-binaural runtime errors.
- Added deterministic Puppeteer coverage in `scripts/smoke-test.js`, exposed as `npm test`.
- Removed the inactive `TextureDisposalManager` hookup; texture ownership remains in `SceneManager`/`TextureManager`.
- Curated an honest 41-work corpus: `scripts/curate-met-corpus.js` downloads + resizes the real Met records to local WebP and rewrites `images.json`, dropping the 2,000 fabricated records.
- Smoke test now targets a real artwork plane (via a minimal debug hook) and asserts a texture actually loads, rather than relying on a fixed coordinate and a stale record count.

## Next decision

The corpus renders. The open items are honesty and experience:

1. Record per-record licence/attribution (Met Open Access `isPublicDomain` + source URL) so usage rights are auditable.
2. Human walkthrough: dwell on a real work → rupture → thread draws; tune the dwell threshold so a first-time visitor triggers it within ~30 s.
3. Optionally grow the corpus beyond 41 once the licence fields exist.

## Repository state

The revival pass was committed (`7fcc81c`, 2026-07-30) and pushed to `origin/main`. All required core modules and `scripts/smoke-test.js` are tracked, and Xcode user-state (`xcuserdata/`, `*.xcuserstate`) is now ignored. A clean clone reproduces the revived app.

See also:

- [`README.md`](README.md)
- [`DEVELOPMENT_FAILURES.md`](DEVELOPMENT_FAILURES.md)
- [`Docs/qa/2026-07-05-fable5-revival-audit.md`](Docs/qa/2026-07-05-fable5-revival-audit.md)
