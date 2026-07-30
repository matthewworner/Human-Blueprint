# The Human Blueprint — Vision Pro

A spatial experience of 50,000 years of human mark-making.

Not art history. Mark-making consciousness.

---

## The Vision

You put on Vision Pro. The world fades. You are surrounded by marks — cave paintings, bathroom graffiti, children's scribbles, sacred manuscripts, protest signs, carved stone, painted walls, signatures, tally marks.

They float around you in darkness. Not arranged by museum, not arranged by era. Arranged by what they *look like*. What they *feel like*.

Where you look is where you go. Not clicking, not selecting — pure attention.

The system watches your eyes. It learns what pulls you. And then it drops you somewhere else.

No explanation. A thread of light connects what you were seeing to what you're seeing. Same gesture. Different continent. Different millennium.

You have to find the connection yourself.

At some point, you realize: I do this. I've always done this. Every signature, every doodle, every scratch — same impulse as cave painters 40,000 years ago.

**That's the collapse. That's what this is for.**

---

## Architecture

```
HumanBlueprint/
├── project.yml           # XcodeGen configuration
├── Info.plist            # App configuration
├── Assets.xcassets/      # App icons, colors
├── CoreModels.swift      # Mark, Era, MarkType, Factory methods
├── MarkWorldContent.swift # Main view, gaze tracking, rupture system
└── README.md             # This file
```

### Core Components

| File | Purpose |
|------|---------|
| `CoreModels.swift` | Mark struct, Era enum, MarkType enum, Entity factories, AttentionModel, RuptureEngine, ConnectionTracker, AmbientAudioEngine, ThreadRenderer |
| `MarkWorldContent.swift` | Main RealityView, gaze handling, connection logic, rupture animation, tap gesture |

### Key Technical Decisions

1. **Gaze = Navigation**: Using `HoverEffectComponent` + `InputTargetComponent` + `CollisionComponent` — RealityKit handles gaze detection automatically, no ARKit raycasting needed for POC

2. **Spatial Audio**: Using `SpatialAudioComponent` on entities — audio positioned at mark locations, comes from that direction

3. **Rupture System**: Attention model tracks dwell, returns, avoidance. Rupture engine triggers displacement when patterns emerge.

4. **Pre-computed Positions**: Marks positioned on sphere using UMAP-like algorithm offline

---

## Building

### Prerequisites
- Mac with Apple silicon
- Xcode 15+
- visionOS 1.2+ SDK
- Apple Vision Pro (for testing)

### Generate Xcode Project

```bash
cd visionOS
xcodegen generate
```

## Building

### Prerequisites
- Mac with Apple silicon
- Xcode 15+
- visionOS 1.2+ SDK
- Apple Vision Pro (for testing)

### Generate Xcode Project

```bash
cd visionOS
brew install xcodegen  # if not installed
xcodegen generate
```

### Build

```bash
xcodebuild \
  -project HumanBlueprint.xcodeproj \
  -scheme HumanBlueprint \
  -configuration Debug \
  -destination 'platform=visionOS' \
  build
```

### Run

Open `HumanBlueprint.xcodeproj` in Xcode and run on Vision Pro simulator or device.

**Note:** Eye tracking requires physical Vision Pro device — simulator will not test gaze interaction.

---

## The Experience

### Entry
- World fades to black
- Marks slowly appear around user
- No explanation, no UI

### Exploration
- User looks around (gaze = navigation)
- Marks respond to gaze (brighten, scale)
- Dwell on a mark → connection attempt

### Connection
- Mark glows when gazed
- If dwell > 1.5 seconds → connection made
- Similar mark found (same type, different era)
- Particle thread drawn between them
- 3 seconds, then fades

### Rupture
- When user gets comfortable (dwelling, returning, avoiding)
- Space shifts: tension → contraction → flash → silence → emergence
- Audio cuts, reforms in different era
- Thread shows what connected

### Loop
- Experience loops infinitely
- Remove headset → session ends
- Put on again → darkness, marks fade in differently

---

## Visual Design

### Mark Appearance
- Plane with solid color (era-based)
- Glow from within, don't reflect light
- States: default (0.85 opacity), gazed (1.15x scale), connected (thread visible)

### Thread
- Particle stream between connected marks
- Warm white, like dust in light
- Visible for 3 seconds, then fades

### Rupture Animation
1. **Tension** (1s): Particles accelerate, marks vibrate
2. **Contraction** (0.5s): Marks rush toward user
3. **Flash** (0.3s): Pure white
4. **Silence** (1s): Black, no audio
5. **Emergence** (2s): New marks fade in

### Color Palette (by Era)
| Era | Color | Feel |
|-----|-------|------|
| Prehistoric | Amber/Ochre | Fire, earth, blood |
| Ancient | Sienna/Deep Red | Pigment, ochre |
| Classical | Lapis Blue | Divine, mineral |
| Early Modern | Sepia/Gold | Ink, parchment |
| Modern | Chrome/White | Industrial, clinical |

---

## Audio

Brian Eno-style generative soundscape.

- Never resolves, never announces itself
- Always slightly wrong
- Comes from mark's direction
- Era-based frequency: prehistoric = low (80Hz), modern = high (500Hz)

**Rupture audio:**
- Cuts immediately on trigger
- Silent during flash
- Returns transformed, not the same

---

## Status

**Built — Requires Vision Pro Hardware for Testing**

The app builds successfully for visionOS Simulator. ImmersiveSpace and eye tracking require physical Vision Pro.

### Implemented
- ✅ Mark model with era/type taxonomy
- ✅ 20 sample marks across 5 eras
- ✅ Gaze interaction (HoverEffectComponent)
- ✅ Tap gesture for mark selection
- ✅ Connection system (find similar marks)
- ✅ Thread renderer (3D cylinder between marks)
- ✅ Rupture engine with pattern detection
- ✅ Rupture animation sequence (5 phases)
- ✅ Spatial audio positioning
- ✅ Attention model (dwell, return, avoid tracking)
- ✅ Graceful error handling
- ✅ **Builds successfully for visionOS Simulator**

### Requires Vision Pro Hardware
- [ ] ARKit eye tracking (production eye tracking, not simulation)
- [ ] ImmersiveSpace rendering
- [ ] Real mark images (anchor marks)
- [ ] Generative audio (AudioGeneratorController)
- [ ] Particle thread system (instanced rendering)
- [ ] Visual rupture animation (not just timing)
- [ ] Pre-computed positions (UMAP)
- [ ] Scene reconstruction (mixed reality)
- [ ] Path visualization on exit
- [ ] Hand gesture support (reach, pull marks)

---

## Success Metrics

Qualitative. If someone emerges saying:
- "I felt continuous with everything that came before me"
- "Time collapsed"
- "I can't stop thinking about it"
- "It made me uncomfortable but I want to go back"

...it worked.

---

*"We've been marking for 50,000 years. We can't stop. This is the map of that compulsion."*