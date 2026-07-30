# Technical Design: Connecting Thread Visualization

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        RUPTURE FLOW                                  │
│                                                                      │
│  ┌──────────┐    triggerRupture()    ┌──────────────┐              │
│  │ Gaze     │ ──────────────────────▶│ RuptureSystem│              │
│  │ Tracker  │                         └──────┬───────┘              │
│  └──────────┘                              │                         │
│                                           ▼                         │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              executeRupture()                               │   │
│  │                                                              │   │
│  │  1. triggerVisualRupture()  ──▶ PostProcessManager         │   │
│  │  2. fadeCurrentImages()                                       │   │
│  │  3. audioSystem.triggerRupture()                             │   │
│  │  4. ★ NEW: createThreadVisualization(source, dest)           │   │
│  │  5. moveCameraToDestination()                                │   │
│  │  6. highlightDestination()                                   │   │
│  │  7. completeRupture() → destroyThread()                     │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────┐         ┌────────────────┐         ┌───────────┐ │
│  │ Thread       │◀────────│ SceneManager   │────────▶│ Three.js  │ │
│  │ Visualization│         │ (addToScene)   │         │ Line/Mesh │ │
│  └──────────────┘         └────────────────┘         └───────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
sourceImage ─────┬─────▶ destinationImage
                 │
                 ▼
         getConnectionPoints()
                 │
                 ▼
         createThreadGeometry()
                 │
                 ▼
         animateThreadGrowth() ──▶ Thread renders over destination
                 │
                 ▼
         animateCameraTransition()
                 │
                 ▼
         fadeThreadAway() ──▶ Thread dissolves as camera arrives
```

## Components

### 1. ThreadVisualization (NEW CLASS)
**Responsibility:** Create and animate the connecting thread between source and destination

**Dependencies:**
- `THREE.Line` or `THREE.Mesh` for rendering
- `THREE.BufferGeometry` for animated path
- `THREE.Material` for stylized appearance

**Failure modes:**
- If source/destination is null → skip thread, continue rupture
- If geometry creation fails → fallback to simple line

**API:**
```javascript
class ThreadVisualization {
    constructor(scene)
    
    // Create thread between two 3D positions
    createThread(sourcePos, destPos, options: {
        color: number,       // hex color
        width: number,       // line width
        segments: number,    // path resolution
        duration: number,    // animation duration ms
        style: 'solid' | 'dashed' | 'pulse' | 'energy'
    })
    
    // Animation lifecycle
    animateGrowth()      // Thread "grows" from source
    animateShrink()      // Thread fades as camera arrives
    destroy()             // Clean up geometry/material
    
    // Update every frame
    update(deltaTime)
}
```

### 2. RuptureSystem (MODIFIED)
**Changes:**
- Add `createThreadVisualization(source, destination)` call in executeRupture()
- Store active thread reference for cleanup
- Add `threadStyle` config per rupture type

### 3. SceneManager (MODIFIED)
**Changes:**
- Add `createLine()` helper for thread rendering
- Add thread to scene during rupture
- Remove thread when rupture completes

## Thread Style Options

| Style | Description | Best For |
|-------|-------------|----------|
| `solid` | Simple glowing line | DWELLING, AVOIDANCE |
| `dashed` | Dotted/dashed line | SCANNING, RETURNING |
| `pulse` | Pulsing energy line | RAPID_MOVEMENT, EMOTIONAL_INTENSITY |
| `energy` | Electric/arc effect | TEMPORAL_DISPLACEMENT, PATTERN_RECOGNITION |

## State Management

```
Thread States:
├── CREATED      → Geometry allocated
├── GROWING       → Line animates from source
├── CONNECTED     → Full thread visible
├── SHRINKING     → Fades as camera arrives
└── DESTROYED     → Cleaned up
```

## Edge Cases

1. **Thread between same position** → Skip thread creation
2. **Very long distance (>100 units)** → Reduce segments, add curve
3. **Rupture cancelled mid-animation** → Destroy thread immediately
4. **Multiple ruptures in sequence** → Queue threads, don't overlap
5. **VR mode** → Thread should work in 3D space (no changes needed)

## Performance Considerations

- Thread geometry is simple (LineSegments or TubeGeometry with low segments)
- Animation uses requestAnimationFrame, not setInterval
- Thread is destroyed immediately after rupture completes
- No persistent thread objects after transition

## Testing Strategy

| Test | Description |
|------|-------------|
| Unit | `ThreadVisualization.createThread()` with mock positions |
| Unit | Thread states transition correctly |
| Integration | Thread appears during rupture, disappears after |
| Edge | Thread handles null source/destination |
| Edge | Thread handles very long/short distances |
| Edge | Multiple rapid ruptures don't create artifacts |

## Implementation Order

1. **Phase 1:** Basic solid line thread
   - Create `ThreadVisualization` class
   - Simple Line geometry from source to destination
   - Add to `RuptureSystem.executeRupture()`
   - Clean up after transition

2. **Phase 2:** Animated growth
   - Animate line drawing from source to destination
   - Duration matches camera transition speed
   - Fade out as camera arrives

3. **Phase 3:** Style variations
   - Per-rupture-type styling
   - Dashed lines, pulsing effects, energy arcs

## Security Considerations

- No user input affects thread rendering
- All geometry created from internal state
- No WebGL shader injection risks
- Simple buffer operations, no eval()

## File Changes

```
src/core/
├── ThreadVisualization.js    [NEW] - Thread rendering class
├── RuptureSystem.js           [MOD] - Add thread creation calls
└── SceneManager.js            [MOD] - Add line helper method
```