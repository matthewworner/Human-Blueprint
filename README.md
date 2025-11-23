# The Human Blueprint

A spatial computing experience that reveals the pattern of human mark-making consciousness across 50,000 years.

## Phase 0: Proof of Concept

**Current Status:** Basic Three.js scene with mouse-based navigation and rupture system.

### Features (Phase 0)
- ✅ 50 test images in 3D space
- ✅ Spiral arrangement algorithm
- ✅ Mouse-based gaze detection
- ✅ Dwell-triggered rupture system
- ✅ Basic audio cues
- ✅ WebXR-ready architecture

### Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Visit `http://localhost:5173` in your browser.

### Controls (Phase 0)
- **Mouse movement**: Simulates gaze (looks at images)
- **Dwell on image**: Hold mouse over image for 3 seconds to trigger rupture
- **Rupture**: Camera transports to distant image with visual/audio effect

### Project Structure

```
src/
  main.js                 # Application entry point
  core/
    SceneManager.js      # Three.js scene setup
    ImageLoader.js       # Image loading and metadata
    ArrangementAlgorithm.js  # 3D positioning logic
    GazeTracker.js       # Gaze/mouse tracking
    RuptureSystem.js     # Rupture mechanics
    AudioSystem.js       # Generative audio (foundation)
```

### Next Steps (Phase 1)

- [ ] WebXR integration
- [ ] Real image loading from APIs
- [ ] Multi-dimensional similarity arrangement (t-SNE/UMAP)
- [ ] Full generative audio system
- [ ] Eye tracking (Vision Pro)
- [ ] Connecting thread visualization

### Tech Stack

- **Three.js** - 3D rendering
- **WebXR Device API** - Spatial computing (Phase 1)
- **Web Audio API** - Generative soundscapes
- **Vite** - Build tool and dev server

---

*"We've been marking for 50,000 years. We can't stop. This is the map of that compulsion."*

