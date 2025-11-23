# The Human Blueprint - Architecture

## Project Structure

```
arthistory/
├── index.html              # Entry HTML file
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite build configuration
├── README.md               # Project overview
├── ARCHITECTURE.md         # This file
│
├── src/
│   ├── main.js            # Application entry point & orchestration
│   │
│   └── core/              # Core system modules
│       ├── SceneManager.js          # Three.js scene, camera, renderer
│       ├── ImageLoader.js           # Image loading & metadata generation
│       ├── ArrangementAlgorithm.js  # 3D positioning logic
│       ├── GazeTracker.js          # Gaze/mouse detection
│       ├── RuptureSystem.js         # Rupture mechanics
│       └── AudioSystem.js          # Generative audio foundation
│
└── data/                  # Static JSON data (future)
    └── images.json        # Image metadata (Phase 1+)
```

---

## Component Responsibilities

### `main.js` - Application Orchestrator
**Purpose:** Coordinates all systems, manages application lifecycle

**Responsibilities:**
- Initialize all core systems
- Load and arrange images
- Manage render loop
- Handle gaze events
- Trigger rupture callbacks
- Update visual feedback

**Key Methods:**
- `init()` - Bootstrap application
- `loadImages()` - Load image data
- `arrangeImages()` - Position images in 3D
- `animate()` - Main render loop
- `handleGaze()` - Process gaze events
- `handleRupture()` - Process rupture events

---

### `SceneManager.js` - 3D Scene Management
**Purpose:** Manages Three.js scene, camera, renderer, and 3D objects

**Responsibilities:**
- Create and configure Three.js scene
- Handle camera positioning and movement
- Create image planes (3D objects)
- Manage lighting
- Handle window resize
- Render loop execution

**Key Methods:**
- `createImagePlane(imageData, position)` - Create 3D image object
- `moveCamera(targetPosition, duration)` - Animate camera movement
- `render()` - Render scene
- `onWindowResize()` - Handle viewport changes

**Dependencies:**
- Three.js

---

### `ImageLoader.js` - Image Data Management
**Purpose:** Load and generate image metadata

**Responsibilities:**
- Load test images (Phase 0)
- Generate image metadata (temporal, geographic, visual)
- Create placeholder textures
- Future: Load from APIs/JSON

**Key Methods:**
- `loadTestImages(count)` - Generate test image data
- `loadImageFromURL(url)` - Load actual images (future)

**Data Structure:**
```javascript
{
  id: string,
  url: string | null,
  texture: Texture | null,
  temporal: { year, era, yearsAgo },
  geographic: { region, lat, lon },
  colorPalette: [{ r, g, b, hex }],
  markType: string,
  scale: string,
  source: string,
  confidence: number
}
```

---

### `ArrangementAlgorithm.js` - Spatial Positioning
**Purpose:** Calculate 3D positions for images based on relationships

**Responsibilities:**
- Generate 3D positions (Phase 0: spiral, Phase 1+: similarity)
- Find connecting threads between images
- Calculate visual similarity

**Key Methods:**
- `generateSpiralArrangement(count)` - Phase 0 simple spiral
- `generateSimilarityArrangement(images)` - Phase 1+ similarity-based
- `findConnectingThread(imageA, imageB)` - Find connection type
- `colorSimilarity(paletteA, paletteB)` - Calculate color similarity

**Future:**
- t-SNE or UMAP for multi-dimensional similarity
- Incremental updates as new images added

---

### `GazeTracker.js` - Gaze Detection
**Purpose:** Detect what user is looking at

**Responsibilities:**
- Track mouse position (Phase 0)
- Raycast to detect image intersections
- Track dwell time
- Future: Eye tracking (WebXR)

**Key Methods:**
- `setupMouseTracking()` - Mouse event listeners
- `detectGaze(objects)` - Raycast and detect target
- `setupEyeTracking(xrSession)` - Future WebXR integration

**Output:**
- Current target object
- Dwell time tracking
- Gaze change callbacks

---

### `RuptureSystem.js` - Rupture Mechanics
**Purpose:** Handle rupture events when user dwells too long

**Responsibilities:**
- Track dwell time per image
- Detect rupture threshold
- Find destination image
- Execute rupture (visual + camera transport)
- Create rupture visual effects

**Key Methods:**
- `updateDwell(target)` - Track and check dwell time
- `triggerRupture(sourceImage)` - Initiate rupture
- `findDistantImage(sourceImage)` - Find rupture destination
- `executeRupture(source, dest)` - Execute transport
- `createRuptureEffect(source, dest)` - Visual effects

**Configuration:**
- `ruptureThreshold`: 3000ms (3 seconds)
- `ruptureCooldown`: 10000ms (10 seconds)

---

### `AudioSystem.js` - Generative Audio
**Purpose:** Generate ambient soundscapes (foundation for Phase 1)

**Responsibilities:**
- Initialize Web Audio API
- Generate rupture audio cues
- Future: Generate ambient soundscapes based on current images

**Key Methods:**
- `init()` - Initialize audio context
- `triggerRupture()` - Play rupture sound
- `generateSoundscape(images)` - Future: Eno-style generative audio

**Future:**
- Real-time synthesis based on image properties
- Spatial audio positioning
- Binaural audio for headphones

---

## Data Flow

### Initialization Flow
```
1. main.js creates all core systems
2. ImageLoader generates test image data
3. ArrangementAlgorithm calculates positions
4. SceneManager creates 3D objects
5. GazeTracker sets up mouse tracking
6. RuptureSystem initializes
7. AudioSystem initializes
8. Render loop starts
```

### Interaction Flow
```
1. User moves mouse
2. GazeTracker.detectGaze() raycasts
3. If intersection found:
   - GazeTracker calls onGazeChange callback
   - main.js.handleGaze() processes event
   - RuptureSystem.updateDwell() tracks time
   - Visual feedback updates
4. If dwell threshold reached:
   - RuptureSystem.triggerRupture()
   - Finds distant image
   - Executes rupture (visual + camera)
   - AudioSystem.triggerRupture()
```

### Render Loop
```
Every frame:
1. GazeTracker.detectGaze() - Check mouse intersection
2. RuptureSystem.update() - Check dwell thresholds
3. Update visual feedback (glow, scale)
4. SceneManager.render() - Draw scene
```

---

## Component Connections

```
main.js
  ├── SceneManager (creates 3D scene)
  ├── ImageLoader (loads image data)
  ├── ArrangementAlgorithm (calculates positions)
  ├── GazeTracker (detects gaze)
  │   └── Uses SceneManager.camera for raycasting
  ├── RuptureSystem (handles ruptures)
  │   ├── Uses SceneManager (camera movement, scene effects)
  │   └── Uses GazeTracker (dwell detection)
  └── AudioSystem (generates audio)
```

**Key Relationships:**
- `GazeTracker` needs `SceneManager.camera` for raycasting
- `RuptureSystem` needs `SceneManager` for camera movement
- `RuptureSystem` uses `GazeTracker` for dwell detection
- All systems communicate via callbacks/events

---

## Development Workflow

### Setup
```bash
npm install
```

### Development
```bash
npm run dev
```
- Starts Vite dev server on `http://localhost:5173`
- Hot module replacement enabled
- Open in browser to test

### Build
```bash
npm run build
```
- Creates production build in `dist/`
- Optimized and minified

### Testing
- Open browser console for debug logs
- Mouse movement simulates gaze
- Dwell on image for 3 seconds to trigger rupture
- Check console for rupture events

---

## Phase 0 → Phase 1 Migration Path

### Current (Phase 0)
- ✅ 50 test images with generated metadata
- ✅ Simple spiral arrangement
- ✅ Mouse-based gaze detection
- ✅ Basic rupture system
- ✅ Placeholder textures

### Phase 1 Goals
- [ ] Load real images from JSON/APIs
- [ ] Multi-dimensional similarity arrangement (t-SNE/UMAP)
- [ ] WebXR integration
- [ ] Eye tracking (Vision Pro)
- [ ] Full generative audio system
- [ ] Connecting thread visualization
- [ ] Real image textures

### Migration Steps
1. Replace `ImageLoader.loadTestImages()` with real data loading
2. Replace `ArrangementAlgorithm.generateSpiralArrangement()` with similarity-based
3. Add WebXR session management
4. Replace mouse tracking with eye tracking in `GazeTracker`
5. Enhance `AudioSystem` with full generative capabilities
6. Add connecting thread visualization in `RuptureSystem`

---

## Performance Considerations

### Current Optimizations
- Level-of-detail rendering (future)
- Object pooling (future)
- Spatial indexing (future)

### Target Performance
- 60fps on desktop
- 90fps for VR (Phase 1)
- Smooth camera transitions
- Efficient raycasting

---

## Future Enhancements

### WebXR Integration
- Add `WebXRManager.js` for session management
- Integrate with `GazeTracker` for eye tracking
- Handle hand tracking for gestures
- Spatial audio positioning

### Image Pipeline
- `ScrapingPipeline.js` - Web scraping for images
- `ImageClassifier.js` - AI classification
- `MetadataExtractor.js` - Extract visual features
- Incremental database updates

### Advanced Features
- User path visualization
- Return visit behavior
- Location-aware features
- Social sharing (optional)

---

## Code Style

- ES6 modules
- Classes for major components
- Callbacks for event communication
- Minimal dependencies (Three.js only for Phase 0)
- Vanilla JavaScript (no framework)

---

**Last Updated:** Phase 0 - Initial Architecture

