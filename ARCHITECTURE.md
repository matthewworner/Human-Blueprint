# The Human Blueprint - Architecture

**Last Updated:** 2026-07-26

## Project Structure

```
Art_History/
├── index.html              # Entry HTML file
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite build configuration
├── README.md               # Project overview
├── STATUS.md               # Current status
├── ARCHITECTURE.md         # This file
│
├── src/
│   ├── main.js             # Application entry point
│   │
│   └── core/               # Core system modules
│       ├── SceneManager.js          # Three.js scene, camera, renderer, WebXR
│       ├── ImageLoader.js           # Image loading from JSON
│       ├── PositionStrategy.js      # Modular positioning strategies
│       ├── TextureManager.js        # Texture caching
│       ├── ArrangementAlgorithm.js  # UMAP-based 3D positioning
│       ├── GazeTracker.js           # Gaze/mouse tracking
│       ├── RuptureSystem.js         # 8 rupture types + thread visualization
│       ├── ThreadVisualization.js   # Animated connecting threads
│       ├── UserPathTracker.js       # Track user's journey [NEW]
│       ├── UserPathVisualizer.js    # Render path as visual trail [NEW]
│       ├── AudioSystem.js           # Generative soundscapes
│       ├── PersonalizationManager.js # User behavior tracking
│       ├── PostProcessManager.js    # Visual effects
│       ├── ImageClassifier.js       # Client-side AI classification
│       └── shaders/                 # GLSL shaders
│
├── scripts/                # Utility scripts
│   ├── ingest.js           # Image ingestion
│   ├── computeLayout.js    # UMAP layout computation
│   ├── scrape.js           # Image scraping
│   └── generate.js         # Test data generation
│
├── public/                 # Static assets
│   └── images.json         # 2,041 records; mostly generated, no local artwork files
│
└── Docs/                   # Documentation
    ├── screenshots/        # App screenshots
    ├── archive/            # Historical docs
    └── TECH-DESIGN-*.md     # Technical design documents
```

## Core Components

### SceneManager
**Purpose:** Three.js scene management

- Scene, camera, renderer setup
- Image plane creation and caching
- Camera movement and transitions
- WebXR session management
- Level-of-detail texture loading

**Key Properties:**
- `imageObjectsCache` - Cached image objects for efficient lookup

**Key Methods:**
- `createImagePlane(imageData)` - Create 3D image object
- `getImageObjects()` - Get cached image array
- `moveCameraWithLookAt(target, lookAt, duration)` - Animated camera movement
- `updateLOD()` - Load nearby textures after first render through the timeout-bounded texture queue

---

### GazeTracker
**Purpose:** Detect what user is looking at

**Device Types:**
- `desktop` - Mouse tracking
- `phone` - Touch + device orientation
- `vr` - WebXR headset
- `vision_pro` - Apple Vision Pro (eye tracking)

**Key Methods:**
- `detectGaze(objects)` - Raycast and detect target
- `getCurrentGaze()` - Get current gaze state
- `reset()` - Clear gaze state

**Callbacks:**
- `onGazeStart(imageId)`
- `onGazeDwell(imageId, duration)`
- `onGazeEnd(imageId, duration)`
- `onGazePattern(patternType)`

---

### RuptureSystem
**Purpose:** Handle rupture transitions with connecting thread visualization

**Rupture Types:**
| Type | Trigger | Thread Style | Duration |
|------|---------|--------------|----------|
| DWELLING | 3s gaze on single image | solid (gray) | 1200ms |
| AVOIDANCE | Not looking at certain images | solid | 2000ms |
| SCANNING | Rapid switching between images | dashed | 800ms |
| RETURNING | Revisiting previously seen images | dashed | 1500ms |
| RAPID_MOVEMENT | Fast camera movement | pulse (red) | 600ms |
| PATTERN_RECOGNITION | Recognizing arrangement patterns | energy (cyan) | 1800ms |
| EMOTIONAL_INTENSITY | High engagement score | pulse | 1000ms |
| TEMPORAL_DISPLACEMENT | Long session duration | energy (purple) | 2200ms |

**Runtime status:** the desktop dwelling path is automated end-to-end. Avoidance, scanning and returning remain declared concepts but have no active `RuptureSystem` detectors; the other experimental triggers are not manually verified. Do not read this table as eight production-ready behaviours.

**Key Methods:**
- `updateDwell(target, duration)` - Track dwell time
- `triggerRupture(source)` - Initiate rupture
- `findConnectedImage(source)` - Find destination
- `createThreadVisualization(source, dest, type)` - Create animated thread
- `startThreadShrink()` - Begin thread fade-out
- `updateThreadVisualization()` - Update thread animations
- `destroy()` - Cleanup resources

---

### ThreadVisualization [NEW]
**Purpose:** Create animated connecting threads between images during ruptures

**Features:**
- Multiple thread styles (solid, dashed, pulse, energy)
- Smooth growth animation from source to destination
- Automatic fade-out as camera arrives
- Per-rupture-type styling and color
- Automatic cleanup after transition

**Thread States:**
- `CREATED` → Geometry allocated
- `GROWING` → Line animates from source
- `CONNECTED` → Full thread visible with subtle pulse
- `SHRINKING` → Fades as camera arrives
- `DESTROYED` → Cleaned up

**Key Methods:**
- `createThread(source, dest, options)` - Create thread geometry
- `animateGrowth(thread)` - Start growth animation
- `startShrink(thread)` - Begin shrink animation
- `update(deltaTime)` - Update all active threads
- `destroyAll()` - Clean up all threads

---

### AudioSystem
**Purpose:** Generative ambient audio

**Features:**
- 3-layer drone oscillators with LFO modulation
- Spatial audio positioning at gazed image
- Color-to-timbre mapping (red→bright, blue→dark)
- Era-to-frequency mapping (old→low, new→high)
- Binaural audio support
- Rupture sound effects (dissonant chord)

**Key Methods:**
- `startSoundscape(images, camera)` - Start ambient audio
- `triggerRupture()` - Play rupture sound
- `destroy()` - Cleanup audio resources

---

### PersonalizationManager
**Purpose:** Track user behavior and adapt experience

**Data Tracked:**
- Visit count and timestamps
- Per-image view count and dwell time
- Gaze patterns (scanning, dwelling, returning)
- Device type preference

**Limits:**
- Max 100 tracked images (LRU eviction)
- Max 50 visit timestamps

**Adaptive Parameters:**
- `ruptureThreshold` - Faster for experienced users
- `transitionSpeed` - Based on visit frequency
- `visualIntensity` - Based on engagement
- `audioVolume` - Persisted preference

---

### ImageLoader
**Purpose:** Load images from JSON

**Features:**
- Five-second timeout for the same-origin metadata request
- Metadata-first startup: no remote texture is awaited when lazy loading is enabled
- One completion progress update after records are normalised
- Placeholder fallback for explicit eager loading
- Pre-computed feature vectors where they genuinely exist (41 current records)

**Key Methods:**
- `loadFromJSON(path)` - Load from JSON file
- `loadSingleImage(imageData, index, allImages)` - Load one image

---

### ArrangementAlgorithm
**Purpose:** Calculate 3D positions

**Methods:**
- `generateSpiralArrangement(count)` - Simple spiral (fallback)
- `generateSimilarityArrangement(images)` - UMAP-based layout
- `computeUMAPLayout(features)` - Run UMAP dimensionality reduction

---

## Data Flow

### Initialization
```
main.js
  → PersonalizationManager (load user data)
  → SceneManager (create scene and shared TextureManager)
  → ImageLoader.loadFromJSON() (metadata request bounded to 5 s)
  → Normalise 2,041 records with texture: null
  → SceneManager.createImagePlane() × 2,041 (cheap colour placeholders)
  → GazeTracker + RuptureSystem + ThreadVisualization
  → Settings/tooltips/dwell indicator
  → Hide loading state and emit "Blueprint ready."
  → SceneManager LOD queue loads nearby remote textures after first render
  → AudioSystem resumes/starts only after user interaction
```

### Render Loop
```
animate() {
  GazeTracker.detectGaze()
  RuptureSystem.update()
  RuptureSystem.updateThreadVisualization()  [NEW]
  updateImageFeedback()
  SceneManager.render()
}
```

### Rupture Flow (with Thread Visualization)
```
User dwells on image (3s)
  → GazeTracker.onGazeDwell()
  → RuptureSystem.updateDwell()
  → RuptureSystem.triggerRupture()
  → findConnectedImage() (different era/region, similar type/color)
  → executeRupture()
    → Visual effects (flash, fade, highlight)
    → ThreadVisualization.createThread()  [NEW]
    → ThreadVisualization.animateGrowth()  [NEW]
    → Camera transport
    → AudioSystem.triggerRupture()
  → RuptureSystem.completeRupture()
    → ThreadVisualization.startShrink()  [NEW]
  → GazeTracker.reset()
```

---

## Performance Optimizations

1. **Metadata-first render** - Network artwork requests cannot block first interaction.
2. **Image Cache** - `imageObjectsCache` avoids scene traversal for texture selection.
3. **Lazy Loading** - Nearby textures load one at a time after first render.
4. **Bounded Texture Cache/Loads** - `TextureManager` deduplicates URLs and releases the queue after 5 s; late results are disposed.
5. **Cheap Placeholders** - Material colours replace 2,041 per-record canvas textures.
6. **Throttled Updates** - LOD checks every 30 frames.
7. **localStorage Limits** - `PersonalizationManager` bounds retained behaviour data.
8. **Thread Cleanup** - Thread geometry/materials are destroyed after transitions.

`TextureDisposalManager.js` is currently not wired. If a verified local corpus demonstrates memory pressure, eviction should be added to the existing `SceneManager`/`TextureManager` ownership path rather than creating a second texture owner.

---

## Cleanup

Cleanup is partial. Audio, rupture/thread, user-path and dwell components expose teardown methods, but `SceneManager` currently has no `destroy()` implementation and the composition root does not call every available teardown. This is not blocking the current smoke test; add one real `SceneManager.destroy()` only when navigation/re-mounting or measured resource leakage requires it.

---

## Technical Design Documents

- [TECH-DESIGN-thread-visualization.md](Docs/TECH-DESIGN-thread-visualization.md) - Connecting thread architecture