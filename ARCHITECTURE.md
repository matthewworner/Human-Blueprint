# The Human Blueprint - Architecture

## Project Structure

```
Art_History/
├── index.html              # Entry HTML file
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite build configuration
├── README.md               # Project overview
├── STATUS.md               # Current status
├── TASKS.md                # Active tasks
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
│       ├── RuptureSystem.js         # 8 rupture types
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
│   └── images.json         # Image metadata
│
└── Docs/                   # Documentation
    ├── screenshots/        # App screenshots
    └── archive/            # Historical docs
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
- `updateLOD()` - Lazy load nearby textures

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
**Purpose:** Handle rupture transitions

**Rupture Types:**
| Type | Trigger |
|------|---------|
| DWELLING | 3s gaze on single image |
| AVOIDANCE | Not looking at certain images |
| SCANNING | Rapid switching between images |
| RETURNING | Revisiting previously seen images |
| RAPID_MOVEMENT | Fast camera movement |
| PATTERN_RECOGNITION | Recognizing arrangement patterns |
| EMOTIONAL_INTENSITY | High engagement score |
| TEMPORAL_DISPLACEMENT | Long session duration |

**Key Methods:**
- `updateDwell(target, duration)` - Track dwell time
- `triggerRupture(source)` - Initiate rupture
- `findConnectedImage(source)` - Find destination
- `destroy()` - Cleanup resources

---

### AudioSystem
**Purpose:** Generative ambient audio

**Features:**
- 3-layer drone oscillators with LFO modulation
- Spatial audio positioning at gazed image
- Color-to-timbre mapping
- Era-to-frequency mapping
- Binaural audio support
- Rupture sound effects

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
- Async loading with progress tracking
- Fallback to placeholder on failure
- Lazy loading support
- Pre-computed feature vectors from CLI

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
  → SceneManager (create scene)
  → ImageLoader.loadFromJSON()
  → ArrangementAlgorithm (positions already in JSON)
  → SceneManager.createImagePlane() × N
  → GazeTracker (setup mouse tracking)
  → RuptureSystem (initialize)
  → AudioSystem (wait for user interaction)
```

### Render Loop
```
animate() {
  GazeTracker.detectGaze()
  RuptureSystem.update()
  updateImageFeedback()
  SceneManager.render()
}
```

### Rupture Flow
```
User dwells on image (3s)
  → GazeTracker.onGazeDwell()
  → RuptureSystem.updateDwell()
  → RuptureSystem.triggerRupture()
  → findConnectedImage() (different era/region, similar type/color)
  → executeRupture()
    → Visual effects (flash, fade, highlight)
    → Camera transport
    → AudioSystem.triggerRupture()
  → GazeTracker.reset()
```

---

## Performance Optimizations

1. **Image Cache** - `imageObjectsCache` Set avoids scene traversal
2. **Lazy Loading** - Textures loaded based on camera proximity
3. **Texture Caching** - TextureManager prevents duplicate loads
4. **Throttled Updates** - LOD check every 30 frames
5. **localStorage Limits** - PersonalizationManager limits data growth

---

## Cleanup

All major components have `destroy()` methods:

```javascript
audioSystem.destroy()
ruptureSystem.destroy()
gazeTracker.destroy()
imageLoader.dispose()
```

---

**Last Updated:** 2026-02-21
