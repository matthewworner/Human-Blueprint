# The Human Blueprint

A spatial experience of 50,000 years of human mark-making.

---

## Project Structure

| Directory | Description |
|-----------|-------------|
| `visionOS/` | Vision Pro app (SwiftUI + RealityKit) |
| `macOS/` | macOS fallback demo (SceneKit) |

---

## Quick Start

### Vision Pro App

```bash
cd visionOS/HumanBlueprint
open HumanBlueprint.xcodeproj
```

See [BUILD.md](visionOS/HumanBlueprint/BUILD.md) for detailed instructions.

### macOS Demo

```bash
cd macOS
open HumanBlueprint.xcodeproj
```

A 3D viewer showing 15 marks arranged on a sphere. Click to select, drag to rotate.

---

## What This Is

You put on Vision Pro. The world fades. You are surrounded by marks — cave paintings, bathroom graffiti, children's scribbles, sacred manuscripts, protest signs, carved stone, painted walls, signatures, tally marks.

Arranged by what they *feel like*. Where you look is where you go. Not clicking, not selecting — pure attention.

The system watches your eyes. It learns what pulls you. Then it drops you somewhere else.

No explanation. A thread of light connects what you were seeing to what you're seeing.

**Same gesture. Different continent. Different millennium.**

---

## Experience Flow

1. **Entry** — Darkness → marks fade in
2. **Exploration** — Gaze = navigation, marks respond to attention
3. **Connection** — Dwell → connection → thread drawn
4. **Rupture** — Space shifts, you're displaced, find the new connection
5. **Loop** — Endless, no completion, ritual return

---

## Technical

| Component | Technology |
|-----------|------------|
| Platform | Apple Vision Pro (visionOS) |
| UI | SwiftUI + RealityKit |
| Input | Eye tracking (gaze = navigation) |
| Audio | Spatial audio positioned at marks |
| Fallback | macOS SceneKit viewer |

---

## Status: Built

The Vision Pro app **builds successfully** for visionOS Simulator. Testing requires Vision Pro hardware.

### Implemented
- Mark model with era/type taxonomy
- 20 sample marks across 5 eras
- Gaze interaction (RealityKit HoverEffectComponent)
- Tap gesture for mark selection
- Connection system (find similar marks)
- Thread renderer (3D cylinder between marks)
- Rupture engine with pattern detection
- Rupture animation sequence (5 phases)
- Spatial audio positioning
- Attention model (dwell, return, avoid tracking)

### Requires Vision Pro Hardware
- Eye tracking (ARKit)
- ImmersiveSpace rendering
- Full spatial audio

### TODO
- ARKit eye tracking (production)
- Real mark images (anchor marks)
- Generative audio (AudioGeneratorController)
- Particle thread system (instanced rendering)

---

*"We've been marking for 50,000 years. We can't stop. This is the map of that compulsion."*
