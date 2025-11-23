# The Human Blueprint

A spatial computing experience that reveals the pattern of human mark-making consciousness across 50,000 years.

## Phase 0: Proof of Concept

**Current Status:** Fully functional Three.js scene with real image loading, gaze tracking, rupture system, and generative audio.

### Features (Phase 0)
- ✅ 50 real images loaded from JSON (spanning 50,000 years)
- ✅ Modular positioning system (JSON, Spiral, Grid strategies)
- ✅ Efficient texture management with caching
- ✅ Mouse-based gaze detection with dwell tracking
- ✅ Dwell-triggered rupture system (3-second threshold)
- ✅ Generative ambient soundscape system
- ✅ WebXR support (VR button enabled when available)
- ✅ Click detection on images
- ✅ Visual feedback (glow, scale) on gaze

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
- **Mouse movement**: Simulates gaze (looks at images, highlights them)
- **Click**: Click on images for interaction
- **Drag**: Orbit camera around the scene (OrbitControls)
- **Dwell on image**: Hold mouse over image for 3 seconds to trigger rupture
- **Rupture**: Camera transports to distant image with white flash and audio cue
- **VR**: Click "Enter VR" button if WebXR is supported

### Project Structure

```
src/
  main.js                 # Application entry point & orchestration
  core/
    SceneManager.js      # Three.js scene, camera, renderer, WebXR
    ImageLoader.js       # Image loading from JSON with async handling
    PositionStrategy.js  # Modular positioning (JSON, Spiral, Grid)
    TextureManager.js    # Efficient texture caching and management
    ArrangementAlgorithm.js  # 3D positioning logic (legacy)
    GazeTracker.js       # Gaze/mouse tracking with raycasting
    RuptureSystem.js     # Rupture mechanics and camera transport
    AudioSystem.js       # Generative ambient soundscapes

public/
  images.json            # 50 real images with metadata and positions
```

### Next Steps (Phase 1)

- [x] Real image loading from JSON ✅
- [x] WebXR integration (basic) ✅
- [x] Generative audio system ✅
- [ ] Multi-dimensional similarity arrangement (t-SNE/UMAP)
- [ ] Eye tracking (Vision Pro)
- [ ] Connecting thread visualization
- [ ] Expand image dataset to 500+ images
- [ ] Continuous image ingestion pipeline

### Tech Stack

- **Three.js** - 3D rendering
- **WebXR Device API** - Spatial computing (Phase 1)
- **Web Audio API** - Generative soundscapes
- **Vite** - Build tool and dev server

---

*"We've been marking for 50,000 years. We can't stop. This is the map of that compulsion."*

