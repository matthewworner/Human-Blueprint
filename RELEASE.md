# Release Summary — 2026-05-16

> **Historical release claim — corrected 2026-07-26.** This document records what the 2026-05-16 work intended to ship, not a verified release. Later browser testing found that the app did not reliably load, several runtime paths were broken, and the “2,041 images / 100% metadata” claim mostly described generated records rather than a real artwork corpus. The application shell is now revived and covered by `npm test`; the artwork corpus remains blocked. See `STATUS.md` and the corrected Fable audit.

## Overview
Major feature release bringing The Human Blueprint to Phase 1 completion. Focus was on polish, user experience, and documentation.

## What Was Shipped

### New Features (5)

| Feature | Files | Impact |
|---------|-------|--------|
| Settings Panel | `index.html`, `main.js` | User control over audio/visual |
| User Path Tracking | `src/core/UserPathTracker.js` | Persists exploration journey |
| User Path Visualization | `src/core/UserPathVisualizer.js` | Visual trail of exploration |
| Thread Visualization | `src/core/ThreadVisualization.js` | Animated rupture effects |
| Metadata Expansion | `scripts/*.js`, `public/images.json` | 2% → 100% coverage |

### Documentation (7 files)

| File | Changes |
|------|---------|
| README.md | Updated features table, controls, next actions |
| ARCHITECTURE.md | Added new modules to structure diagram |
| STATUS.md | Updated feature list, removed stale items |
| TASKS.md | Marked 8 items complete, updated priorities |
| CHANGELOG.md | NEW — Complete changelog |
| Docs/TECH-DESIGN-*.md | Technical design for new features |
| .pi/skills/ | Created 5 project skills |

### Code Stats

```
Modules:     50 → 70 (+20)
Bundle:      1.36MB → 1.39MB
Images:      50 → 2,041 (+1,991)
Metadata:    2% → 100%
```

## New User Experience

When users load the app now, they can:

1. **Explore** — Mouse around to see image tooltips
2. **Trigger Ruptures** — Dwell 3s on image to transport
3. **See Threads** — Animated connectors during transitions
4. **Track Progress** — White lines show exploration path
5. **Customize** — Click Settings to adjust experience
6. **Persist** — Path saved between sessions

## Settings Panel Controls

| Control | Default | Range |
|---------|---------|-------|
| Audio Volume | 50% | 0-100% |
| Visual Intensity | 50% | 0-100% |
| Transition Speed | 50% | 0-100% |
| Show Path Trail | ON | Toggle |
| Dwell Time | 3s | 1-10s |

## Architecture Changes

```
src/core/
├── ThreadVisualization.js   [NEW] 13KB
├── UserPathTracker.js       [NEW] 6KB
├── UserPathVisualizer.js    [NEW] 6KB
└── main.js                  [MOD] +150 lines
```

## Breaking Changes
None — all changes are additive

## Known Issues (corrected 2026-07-26)
- The 2,041-entry dataset is not a verified artwork corpus; most records and URLs were generated.
- No artwork assets are local, so current network failures resolve to coloured placeholders.
- User-path output, WebXR hardware behaviour and visual/audio quality still need manual verification.
- The working tree is uncommitted and required core modules remain untracked.

## Next Work

1. Select a small, rights-cleared and authoritative demo corpus.
2. Self-host resized assets with provenance and licence data.
3. Hand-author or verify meaningful rupture connections.
4. Run human visual/audio QA after `npm test` passes.

---

**Current build status (2026-07-26):** ✅ Passing (72 modules, 1.39 MB). Application shell verified; artwork corpus blocked.