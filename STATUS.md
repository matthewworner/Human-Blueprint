# The Human Blueprint — Status

**Last updated:** 2026-07-26

## Stage

**BOOT REVIVED — ARTWORK CORPUS BLOCKED**

The web app now starts, renders its Three.js scene, opens settings and completes the desktop pointer-gaze → rupture callback path. This is verified by an automated Puppeteer smoke test and a separate real-network browser run.

The experience is **not yet a compelling artwork demo**. It currently renders coloured placeholders because the claimed 2,041-work corpus is predominantly generated data with unusable remote URLs.

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
| Real artwork rendering | ❌ BLOCKED | No local artwork files; sampled generated Wikimedia URLs return HTTP 400 |

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
| 2,041 real artworks | **FALSE CLAIM — DATASET BLOCKED** |

## Dataset reality

`public/images.json` contains 2,041 **records**, not 2,041 verified artworks:

- 1,950 IDs begin with `generated_`.
- 1,499 URLs match the generator’s deliberately fabricated Wikimedia path pattern.
- Only 41 records contain feature vectors.
- No artwork files are stored locally.
- The repository stores no licence, attribution or canonical source fields for the Wikimedia-backed records.

Do **not** run the original audit recommendation to download all 2,041 URLs. The minimum honest next step is to approve a small, rights-cleared and metadata-verified corpus, self-host resized assets, and hand-author or verify its first meaningful rupture connections.

## Implemented revival work

- Metadata-first startup: remote textures no longer gate first render.
- Five-second timeouts for metadata and texture requests.
- Shared, timeout-bounded LOD texture queue with cheap colour placeholders.
- Correct terminal loading/error ownership; metadata failure cannot emit `Blueprint ready.`.
- Fixed missing rupture update wiring, Three.js `FilmPass` API drift and audio autoplay/custom-binaural runtime errors.
- Added deterministic Puppeteer coverage in `scripts/smoke-test.js`, exposed as `npm test`.
- Removed the inactive `TextureDisposalManager` hookup; texture ownership remains in `SceneManager`/`TextureManager`.

## Next decision

Choose the first honest demo corpus. Recommended default: curate a relevant subset from the 41 Met records, verify public-domain status and authoritative metadata, self-host resized images, then validate the complete visual rupture/thread experience manually.

## Repository state

The working tree remains heavily modified and uncommitted, including required untracked core modules. Nothing was staged, committed or pushed during the revival pass. A clean clone does not yet reproduce this state.

See also:

- [`README.md`](README.md)
- [`DEVELOPMENT_FAILURES.md`](DEVELOPMENT_FAILURES.md)
- [`Docs/qa/2026-07-05-fable5-revival-audit.md`](Docs/qa/2026-07-05-fable5-revival-audit.md)
