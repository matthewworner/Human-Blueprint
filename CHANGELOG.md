# Changelog

All notable changes to The Human Blueprint will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased] — Revival verified 2026-07-26

### Added
- `npm test` Puppeteer regression covering ready state, settings, the post-destination rupture callback, hanging texture recovery and hanging metadata failure.

### Changed
- Startup is metadata-first; remote textures load later through the camera-distance LOD queue.
- Metadata and texture requests now time out after five seconds instead of blocking forever.
- Placeholder planes use material colours instead of allocating 2,041 canvas textures.
- Audio starts after user interaction and uses the browser’s native HRTF path.
- Tooltip records expose their stored title, artist and date at the level consumed by the UI.
- Removed the inactive `TextureDisposalManager` hookup; active texture ownership stays in `SceneManager`/`TextureManager`.

### Fixed
- Permanent loading screen caused by an artwork request that never settled.
- False `Blueprint ready.` after `/images.json` failed.
- Missing rupture detector/update methods that stopped the render loop.
- Three.js `FilmPass` constructor/uniform API drift.
- Custom binaural audio accessing nonexistent per-layer gains.
- CSP omission for the Picsum redirect host.

### Verified
- `npm test` passes.
- `npm run build` passes (72 modules; 1.39 MB bundle).
- A real-network Puppeteer run reached ready in 759 ms and the rupture callback in 3.8 s with zero page errors.

### Known limitations / data correction
- The app shell is verified, but the artwork experience still renders placeholders.
- Of 2,041 records, 1,950 are generated, 1,499 use fabricated Wikimedia URL patterns, only 41 contain feature vectors, and none point to local artwork files.
- The 2026-05-16 claims of “100% metadata coverage” and “2,041 images” describe generated record coverage, not a verified real-artwork corpus. Do not self-host that dataset wholesale.
- The working tree remains uncommitted and includes required untracked modules.

## ⚠️ [UNVERIFIED] — 2026-05-16

**WARNING: This project experienced a 48+ hour development failure.**

On 2026-05-16, a syntax error (unclosed try block) prevented the app from loading.
The error was fixed at 7:05 PM, but the app has NOT been successfully tested.

**See:** `DEVELOPMENT_FAILURES.md` for full details.

### Added
- **Settings Panel** — Modal with sliders for audio volume, visual intensity, transition speed, dwell time, and path trail toggle
- **User Path Visualization** — Tracks and displays user's journey through art space with connecting lines and viewed image markers
- **User Path Tracker** — Records viewed images, dwell times, and path connections with localStorage persistence
- **Thread Visualization** — Animated connecting threads between images during ruptures (4 styles: solid, dashed, pulse, energy)
- **Metadata Coverage** — 100% metadata coverage for all 2,041 images (was 2%)
- **Cave Art Metadata** — Added metadata for 11 prehistoric sites (Chauvet, Lascaux, Altamira, etc.)
- **Historical Art Metadata** — Added metadata for 40 additional historical art pieces
- **Pattern-Based Metadata** — Automated metadata for remaining images based on ID patterns
- **AudioSystem.setMasterVolume()** — Added missing volume control method

### Changed
- **Image Dataset** — Expanded from 50 to 2,041 images
- **Build Size** — 68 modules → 70 modules (added 2 new core modules)
- **Loading Text** — Now shows "Loading Human Blueprint (X/2041 images)" progress

### Fixed
- **Audio System** — Fixed THREE import issue
- **Rupture System** — Fixed parameter mismatches
- **Cleanup** — Added destroy() methods for proper resource cleanup
- **WebXR** — Fixed WebXR API usage
- **Memory Management** — Added TextureDisposalManager (LOD system) [NEW]
- **Page Unload** — Added beforeunload cleanup handler
- **Volume Control** — Added setMasterVolume() method (was missing)
- **Tooltip** — Fixed stuck states with clearHideTimeout helper
- **Settings Panel** — Fixed animation (visibility transition)
- **Error Handling** — Added error boundary with retry button

### Documentation
- Created project skills in `.pi/skills/`
- Added technical design docs for thread visualization and user path
- Updated README, ARCHITECTURE, STATUS, and TASKS

---

## [Previous Releases]

See git history for earlier changes.