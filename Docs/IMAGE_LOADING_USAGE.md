# Image Loading System Usage

## Overview

The image loading system loads images from JSON files, manages textures efficiently, and positions them in 3D space with modular positioning strategies.

## JSON Format

Create a JSON file with image data:

```json
[
  {
    "id": "cave_lascaux_001",
    "url": "path/to/image.jpg",
    "position": [x, y, z],
    "era": -15000,
    "region": "Europe",
    "colors": ["ochre", "black"],
    "type": "cave_painting"
  }
]
```

**Required fields:**
- `id`: Unique identifier
- `url`: Image URL (or omit for placeholder)

**Optional fields:**
- `position`: [x, y, z] array (if using JSONPositionStrategy)
- `era`: Year/era number
- `region`: Geographic region
- `colors`: Array of color names
- `type`: Mark type (cave_painting, carved, painted, etc.)

## Basic Usage

```javascript
import { ImageLoader } from './core/ImageLoader.js';
import { SceneManager } from './core/SceneManager.js';

// Initialize
const imageLoader = new ImageLoader();
const sceneManager = new SceneManager(container);

// Set up callbacks
imageLoader.onProgress = (progress) => {
    console.log(`Loading: ${progress.percentage}%`);
};

imageLoader.onComplete = (images) => {
    // Create image planes
    images.forEach(imageData => {
        sceneManager.createImagePlane(imageData);
    });
};

// Load from JSON
await imageLoader.loadFromJSON('/images.json');
```

## Position Strategies

### JSON Position Strategy (Default)

Uses positions directly from JSON:

```javascript
import { JSONPositionStrategy } from './core/PositionStrategy.js';

const imageLoader = new ImageLoader({
    positionStrategy: new JSONPositionStrategy()
});
```

### Spiral Position Strategy

Arranges images in a 3D spiral:

```javascript
import { SpiralPositionStrategy } from './core/PositionStrategy.js';

const imageLoader = new ImageLoader({
    positionStrategy: new SpiralPositionStrategy({
        radius: 15,
        heightStep: 0.3,
        angleStep: Math.PI * 2 / 10
    })
});
```

### Grid Position Strategy

Arranges images in a 3D grid:

```javascript
import { GridPositionStrategy } from './core/PositionStrategy.js';

const imageLoader = new ImageLoader({
    positionStrategy: new GridPositionStrategy({
        spacing: 3,
        columns: 5
    })
});
```

### Custom Position Strategy

Create your own:

```javascript
import { BasePositionStrategy } from './core/PositionStrategy.js';

class MyCustomStrategy extends BasePositionStrategy {
    getPosition(imageData, index, allImages) {
        // Your positioning logic
        return {
            x: index * 2,
            y: 0,
            z: 0
        };
    }
}

const imageLoader = new ImageLoader({
    positionStrategy: new MyCustomStrategy()
});
```

## Click Detection

### Global Click Handler

```javascript
sceneManager.setGlobalImageClickCallback((object, imageData) => {
    console.log('Clicked:', imageData.id);
    // Handle click
});
```

### Per-Image Click Handler

```javascript
sceneManager.registerImageClickCallback('cave_lascaux_001', (object, imageData) => {
    console.log('Specific image clicked');
});
```

## Gaze Detection

Gaze detection is handled by `GazeTracker` and works automatically with the image planes:

```javascript
gazeTracker.onGazeChange = (target) => {
    if (target && target.userData?.imageData) {
        console.log('Gazing at:', target.userData.imageData.id);
    }
};
```

## Texture Management

The `TextureManager` automatically caches textures to avoid duplicate loads:

```javascript
// Get texture stats
const stats = imageLoader.getTextureStats();
console.log('Cached textures:', stats.cachedTextures);
console.log('Memory usage:', stats.totalMemory, 'MB');

// Dispose when done
imageLoader.dispose();
```

## Error Handling

The system handles errors gracefully:

- Failed image loads create placeholders automatically
- Loading continues even if some images fail
- Progress callbacks report failed images
- Error callbacks notify of critical failures

```javascript
imageLoader.onError = (error) => {
    console.error('Critical error:', error);
    // Handle error
};
```

## Loading States

Track loading progress:

```javascript
const state = imageLoader.getLoadingState();
console.log(`Loaded: ${state.loaded}/${state.total}`);
console.log(`Failed: ${state.failed}`);
console.log(`In progress: ${state.inProgress}`);
```

## Example: Complete Setup

```javascript
import { ImageLoader } from './core/ImageLoader.js';
import { SceneManager } from './core/SceneManager.js';
import { SpiralPositionStrategy } from './core/PositionStrategy.js';

// Initialize with spiral positioning
const imageLoader = new ImageLoader({
    positionStrategy: new SpiralPositionStrategy()
});

const sceneManager = new SceneManager(container);

// Set up callbacks
imageLoader.onProgress = (progress) => {
    updateLoadingUI(progress);
};

imageLoader.onComplete = (images) => {
    // Create planes
    images.forEach(imageData => {
        sceneManager.createImagePlane(imageData);
    });
};

// Click handling
sceneManager.setGlobalImageClickCallback((object, imageData) => {
    showImageInfo(imageData);
});

// Load images
await imageLoader.loadFromJSON('/images.json');
```

