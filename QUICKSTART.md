# Quick Start Guide

## Installation

```bash
# Install dependencies
npm install
```

## Development

```bash
# Start dev server
npm run dev
```

Opens automatically at `http://localhost:5173`

## How to Test

1. **Mouse Movement = Gaze**
   - Move your mouse around the screen
   - Images will highlight when your "gaze" (mouse) is over them
   - Images will scale up slightly and glow when gazed at

2. **Trigger Rupture**
   - Hover your mouse over an image
   - Keep it there for **3 seconds** (dwell threshold)
   - Rupture will trigger:
     - White flash effect
     - Camera transports to a random distant image
     - Audio cue plays
     - 10 second cooldown before next rupture

3. **Navigation**
   - Currently camera is fixed (Phase 0)
   - Rupture transports you to new location
   - Future: Smooth navigation via gaze

## What You Should See

- **50 colored placeholder images** arranged in a 3D spiral
- **Black background** (space-like)
- **Mouse movement** highlights images
- **3-second dwell** triggers rupture transport

## Debugging

Open browser console (F12) to see:
- Image loading progress
- Gaze detection events
- Rupture triggers
- Any errors

## Troubleshooting

**No images appear?**
- Check console for errors
- Ensure Three.js loaded correctly
- Verify Vite dev server is running

**Rupture not triggering?**
- Make sure you're dwelling for full 3 seconds
- Check cooldown period (10 seconds between ruptures)
- Look for console errors

**Performance issues?**
- Reduce image count in `main.js` (change `imageCount = 50` to lower number)
- Check browser console for warnings

## Next Steps

Once Phase 0 is working:
1. Add real image loading
2. Implement similarity-based arrangement
3. Add WebXR support
4. Enhance audio system

