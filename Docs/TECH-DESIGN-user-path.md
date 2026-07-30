# Technical Design: User Path Visualization

## Overview
Show a visual trail of the user's journey through the art space, highlighting which images they've explored and the path between them.

## Architecture

```
User Path System
├── UserPathTracker (tracks viewed images)
├── UserPathVisualizer (renders trail on screen)
└── PersonalizationManager (persists data)
```

## Data Model

```javascript
// Stored in localStorage via PersonalizationManager
{
  viewedImages: [
    { id: "chauvet_001", timestamp: 1234567890, dwellTime: 5000 },
    { id: "museum_met_466105", timestamp: 1234567900, dwellTime: 3000 },
    ...
  ],
  pathConnections: [
    { from: "chauvet_001", to: "museum_met_466105", timestamp: 1234567900 },
    ...
  ]
}
```

## Implementation

### 1. UserPathTracker (new file)
- Track when user views an image (gaze start)
- Record dwell time when gaze ends
- Store connections between sequential views

### 2. UserPathVisualizer (new file)
- Render connections between viewed images as subtle lines
- Add subtle marker/glow to viewed images
- Fade old connections, highlight recent path

### 3. Integrate with existing systems
- Hook into GazeTracker for view events
- Hook into RuptureSystem for path connections
- Use PersonalizationManager for persistence

## Visual Style

- **Path lines:** Thin (1px), semi-transparent, white/gray
- **Viewed image markers:** Subtle glow outline
- **Recent path:** Brighter, more prominent
- **Old path:** Faded, lower opacity

## Files to Create/Modify

```
src/core/
├── UserPathTracker.js     [NEW] - Track user journey
├── UserPathVisualizer.js  [NEW] - Render visual trail
├── GazeTracker.js         [MOD] - Emit view events
├── PersonalizationManager.js [MOD] - Store path data
├── main.js                [MOD] - Initialize tracking
```

## Edge Cases

- Clear path on new session (optional)
- Limit stored path length (last 50 connections)
- Handle rapid ruptures (don't duplicate connections)