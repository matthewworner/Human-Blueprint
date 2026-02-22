# The Human Blueprint

A spatial computing experience that reveals the pattern of human mark-making consciousness across 50,000 years.

## Status: Phase 0 Complete

Fully functional Three.js scene with real image loading, gaze tracking, rupture system, and generative audio.

### Features
- 50 real images loaded from JSON (spanning 50,000 years)
- Modular positioning system (JSON, Spiral, Grid strategies)
- Efficient texture management with caching and lazy loading
- Mouse-based gaze detection with dwell tracking
- Multi-type rupture system (8 rupture triggers)
- Generative ambient soundscape with spatial audio
- WebXR support (VR button enabled when available)
- Personalization system with adaptive parameters

### Quick Start

```bash
npm install
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Controls
| Input | Action |
|-------|--------|
| Mouse movement | Simulates gaze (highlights images) |
| Click | Click on images for interaction |
| Drag | Orbit camera around scene |
| Dwell (3s) | Hold mouse over image to trigger rupture |
| VR Button | Enter WebXR immersive mode |

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
    AudioSystem.js           # Generative ambient soundscapes
    PersonalizationManager.js # User behavior tracking
    PostProcessManager.js    # Visual effects (rupture flash)
    ImageClassifier.js       # Client-side AI classification

public/
  images.json                # Image metadata and positions

scripts/
  ingest.js                  # Image ingestion pipeline
  computeLayout.js           # UMAP layout computation
  scrape.js                  # Image scraping utilities
```

## Scripts

```bash
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
- [ ] Eye tracking (Vision Pro)
- [ ] Connecting thread visualization
- [ ] Expand image dataset to 500+
- [ ] Continuous image ingestion pipeline

### Phase 2 (Future)
- [ ] Multi-user experiences
- [ ] Curated collections
- [ ] Social sharing

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [STATUS.md](STATUS.md) - Current status
- [TASKS.md](TASKS.md) - Active tasks
- [Docs/](Docs/) - Additional documentation

---

*"We've been marking for 50,000 years. We can't stop. This is the map of that compulsion."*
