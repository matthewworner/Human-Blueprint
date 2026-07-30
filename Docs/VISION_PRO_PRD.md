# The Human Blueprint — Vision Pro Product Requirements

**Document Version:** 1.0  
**Date:** 2026-05-20  
**Status:** Draft

---

## The Problem

Every art history app, every museum experience, every VR gallery treats you as a viewer. You stand outside the content, browse it, consume it. Safe. Passive. Educational.

This is not that.

---

## The Vision

You put on Vision Pro. The world fades. You are surrounded by 50,000 years of human mark-making — not pictures of art, but the *marks themselves*. Cave paintings, bathroom graffiti, children's scribbles, sacred manuscripts, protest signs, carved stone, painted walls, signatures, tally marks.

They float around you in darkness. Not arranged by museum, not arranged by era, not arranged by value. Arranged by what they *look like*. What they *feel like*. The visual DNA that connects a hand stencil from 40,000 BCE to a handprint on a wall in 2024.

You can't navigate this. You can only *attend*. Where you look is where you go. Not clicking, not selecting, not controlling — pure attention.

The system watches your eyes. It learns what pulls you, what you avoid, what keeps drawing you back. And then it does something with that information.

It drops you somewhere else.

No explanation. No transition. You were looking at Pacific petroglyphs. Now you're looking at Celtic manuscripts. The audio cuts and shifts. A thread of light connects what you were seeing to what you're seeing. *Same gesture. Different continent. Different millennium.*

You have to find the connection yourself.

This keeps happening. Every time you settle, every time you find a groove, the space shifts. It's not letting you feel safe. It's not letting you consume. It's presenting evidence and making you do the work.

At some point, if you're paying attention, something happens. The marks stop being "art" and start being... something else. Evidence of the same impulse, repeated across 50,000 years, in every culture, on every surface. The urge to make a mark. To say "I was here." To communicate something beyond words.

And you realize: I do this. I have always done this. Every signature, every doodle, every scratch on a surface — same impulse as cave painters 40,000 years ago.

That's the collapse. That's what this is for.

---

## Why Vision Pro

**No other medium works.**

Desktop/mobile: You're looking at a screen. The content is "out there." You have escape routes. You can close the tab. You can scroll past. You can treat it as content.

VR headsets (Meta Quest, etc.): Better, but still has friction. Controllers, setup, the gaming association. It's a device you "use."

Apple Vision Pro: It's a *space you occupy*. The content is not on a screen — it's around you. Eye tracking is precise and feels natural. You can't escape your attention — where you look, you go. Spatial audio comes from the space itself, not your speakers. There's no "browser" feeling, no "device" feeling. There's only the experience.

The goal is to make the interface *disappear*. Vision Pro is the only platform where this is possible at consumer scale.

### Apple Frameworks for This Project

| Framework | Purpose | Key Features Used |
|-----------|---------|-------------------|
| **ARKit** | Spatial sensing, input | Eye tracking (gaze), hand tracking, world tracking, scene reconstruction |
| **RealityKit** | 3D rendering, spatial experiences | Entity rendering, spatial anchors, RealityView |
| **SwiftUI** | UI framework | Windows, volumes, immersive spaces, gaze+tap gestures |
| **SpatialAudio** | 3D audio positioning | Audio positioned at mark locations, creates spatial atmosphere |

### Key visionOS Capabilities

**Gaze and Tap (the input model)**
- "People can select an element by looking at it and tapping their fingers together"
- The eye IS the cursor — where you look is where you go
- No controller needed, no click — just attention + finger tap
- Dwell detection is built into the system

**Hand Tracking**
- Track hand and finger positions for custom gestures
- Future: reach toward marks, pull them closer, trace connections with your hands

**Spatial Audio**
- Audio positioned in 3D space — comes from the direction of marks
- Mark on your left → sound from left
- Rupture → audio cuts and reforms from different direction
- Eno-style drones positioned spatially create true immersion

**Scene Reconstruction (Mixed Reality)**
- For mixed reality mode: marks can appear on your actual walls, floor
- The space knows where surfaces are

**Immersion Levels**
- **Full Space** — pure dark with marks around you
- **Mixed** — marks appear in your room via passthrough
- **Passthrough only** — marks on real surfaces

---

## What Makes This Vision Pro-Native

### Spatial Presence
The experience is not displayed — it *surrounds*. Marks exist at different depths, different distances. Some are close enough to examine. Some are far enough to feel the scale of the collection. The spatial relationships between marks create meaning before any individual mark is understood.

### Eye Tracking as Revelation
Your gaze is not navigation — it's *attention*. The system doesn't just know where you look, it knows *how* you look:
- How long before you move on
- Whether you return to something
- What you actively avoid
- Whether you're scanning or dwelling
- What pattern emerges from your attention over time

This is the input. The space responds to your attention patterns, not your commands.

### Spatial Audio as Atmosphere
Sound comes from the direction of marks. If you're looking at ancient marks, the audio shifts lower, more primal. Modern marks shift higher, more clinical. The soundtrack is generative — it never repeats, never resolves, never announces itself. It's just... atmosphere. Unsettling. Eno-style. Present but not foregrounded.

When the space shifts (the "rupture"), the audio cuts and reforms in a different sonic territory. No smooth transition — jarring, deliberate.

### No UI Chrome
There is no menu, no button, no control panel. The UI is the experience. There is no "how to use this" screen. You enter and you're there. The only way out is to remove the headset.

### Passthrough Option
Users can choose to see their actual room overlaid with marks — marks appearing on their walls, their floor. Or full immersion — pure darkness with marks in space. Or mixed reality where both coexist.

---

## The Technical Core

### Development Stack

- **Language:** Swift
- **UI:** SwiftUI (for windows, volumes, immersive spaces)
- **3D Rendering:** RealityKit (for entity rendering, anchors, spatial content)
- **Input:** ARKit (for eye tracking, hand tracking, world tracking)
- **Build:** Xcode (requires Mac with Apple silicon)
- **Distribution:** visionOS app (no App Store if we want — side-loading possible)

### Image Collection
The marks database is not curated by museum value — it's curated by *human gesture*. Every mark someone has ever made: cave paintings, graffiti, scribbles, signatures, tally marks, protest signs, children's drawings, arranged objects, accidental smears.

Filter: "Did a human make a visible mark?" — not "is this art?"

No hierarchy. No "this counts, this doesn't." The algorithm arranges by visual similarity, not institutional value.

### Spatial Arrangement
Marks are positioned in 3D space based on multi-dimensional similarity:
- Visual characteristics (color, form, line quality, composition)
- Gesture type (carved, painted, drawn, pressed, arranged)
- Subject matter (human figure, animal, symbol, abstract, landscape)
- Era and geography (secondary, creates clustering)

The arrangement is pre-computed, not real-time. UMAP or similar for dimensionality reduction into 3D coordinates.

### Rupture System
The system watches your attention. When patterns emerge — dwelling, avoidance, scanning, returning — it triggers a "rupture."

Rupture = violent displacement. You're transported to a different region of the space, with no explanation. The connection between where you were and where you are is always visual (same gesture, similar form, shared color), but it's not stated. You must discover it.

Ruptures prevent comfort, prevent consumption, prevent mastery. The space keeps you off-balance.

### Anti-Comfort Personalization
The system learns your visual vocabulary — what you return to, what you avoid, your patterns. It uses this *against* you. If you keep looking at handprints, it shows you handprints across all time and space. If you avoid faces, it forces you to confront faces. Not to please you — to confront you.

Personalization serves transformation, not satisfaction.

---

## Visual Design System

### Mark Appearance

**Hybrid approach: Mix of real and generated**
- **Anchor marks** (30-50 per collection): Actual photographs of real marks. High resolution, true to the artifact. These are the "gateways" — visually authentic, emotionally grounded.
- **Generated marks** (remainder of collection): Stylized textures based on the visual DNA of anchor marks. Consistent art style, slightly abstracted. They feel real without being reproductions.

**Why this approach:**
- Anchor marks provide authenticity and emotional weight
- Generated marks allow infinite scalability without image licensing
- The hybrid creates visual hierarchy without explicit labeling

**Mark states:**
| State | Appearance |
|-------|-----------|
| Default | Subtle glow, low opacity (0.6) |
| Gazed | Brightens, opacity 0.9, slight scale up (1.1x) |
| Connecting | Pulse animation, particle emission begins |
| Connected | Solid, full opacity, threads visible |
| Distant | Very dim, mostly silhouette |
| Rupturing | Dissolves into particles, moves to new position |

### The Thread

**Particle stream** — not a solid line
- Thin particles flow between connected marks
- Color: warm white, slightly off-center (never pure white)
- Density increases as dwell time increases
- On rupture: particles scatter, reform at new location
- Flow direction: from mark you're leaving → to mark you're arriving at

**Visual metaphor:** A trail of dust in light. Present but not solid.

### Rupture Transition

**Spatial displacement** — not a cut, not a dissolve

1. You realize you've been looking at marks for a while. You're comfortable. You think you understand.
2. Particles between marks accelerate — something's building
3. Reality contracts — marks seem to rush toward you (or you toward them)
4. BLINDING WHITE — no image, no shape, just light
5. Silence
6. New marks emerge from white — different region, different era
7. A single particle thread connects what you SAW to what you're SEEING
8. You must find why they're connected

**The displacement is psychological, not just visual.** You feel it in your chest.

### Exit → Loop

The experience loops.
- Remove headset → session ends
- Put headset back on → experience restarts
- You appear in darkness → marks fade in (different arrangement this time)
- The loop creates ritual, not progression

**No completion, no score.** Just re-entry.

### Color Palette

**Darkness first.** The void is the canvas.

Marks glow from within — they are not lit, they emit.

| Era | Color Temperature | Description |
|-----|-------------------|-------------|
| Prehistoric (50,000 BCE - 10,000 BCE) | Warm amber, ochre | Fire, earth, blood. The oldest marks feel warmest. |
| Ancient (10,000 BCE - 0 CE) | Deep red, burnt sienna | Pigment from ochre, charcoal, manganese. |
| Classical (0 CE - 1500 CE) | Cool blues, verdigris | Mineral pigments, lapis lazuli, gold leaf. Divine. |
| Early Modern (1500 CE - 1800 CE) | Warm sepia, faded gold | Ink, quill, parchment. Intimate. |
| Modern (1800 CE - present) | Stark whites, chrome | Industrial. Clinical. Cold. |

**Emotional atmosphere:**
- Marks are warm — they come from bodies, from fire, from earth
- Space is cold — the void between marks is infinite
- Contrast creates the feeling of time collapsing
- No color for its own sake — every hue references a material reality

### Spatial Layout

**No grid. No map. Pure void.**

- Marks exist at varying depths (2m to 15m from user)
- Closer marks: more detail, can examine texture
- Farther marks: atmospheric, show scale of collection
- No "up" or "down" — the arrangement is non-Euclidean
- The closest marks form loose clusters, connected by visual similarity
- Clusters overlap — boundaries blur

---

## Generative Audio
Brian Eno-style ambient soundscape. Never resolving, never announcing itself, always slightly wrong. Responds to:
- The era of the mark you're looking at
- The geographic origin
- Movement through the space
- Rupture events (cuts and reforms)

No music. No beats. Just atmosphere that creates unease.

---

## The Experience Phases

### Entry
You put on the headset. The room fades. You are in darkness. Then, slowly, marks begin to appear around you — faint at first, then clearer. Not a loading screen, not a tutorial. You are *there*.

You don't know where you are. No context. No explanation. Just marks in space.

### Exploration
You look around. The marks are everywhere — at different depths, different distances. Where you look, you go. No clicking, no controllers.

When you gaze at a mark, it responds — brightens slightly, becomes more present. If you dwell, the system notices. Connections to other marks may illuminate faintly.

### Rupture
At some point — when you start to feel comfortable, when a pattern starts to emerge, when you think you're understanding — the space shifts. Audio cuts. You're somewhere else. Something else.

A thread of light connects what you were seeing to what you're seeing. The visual relationship is there, but not explained. You have to see it.

This keeps happening. Every few minutes, or based on your attention patterns, the space shifts. Never lets you settle.

### Recognition
If you're paying attention, if you're really looking — at some point, the marks stop being "things" and start being "evidence." You see the same gesture across impossible distances. Handprints from 40,000 BCE and handprints from yesterday. Spirals in cultures that never met. Eyes appearing everywhere, across 10,000 years.

And then: "I do this. I've always done this. Every time I sign a receipt, every time I doodle, every time I scratch a surface — same impulse as those cave painters."

The collapse of time. The recognition of continuity.

### Exit
You remove the headset. There's no score, no completion, no "you've seen X% of the collection." There's just: what did you see? What did you feel?

Optionally: the system could show you your path — not as data, but as visual trace. The marks you connected, the thread between them.

---

## What's NOT This

- Not an art history app
- Not a museum experience
- Not educational
- Not comfortable
- Not user-friendly in the conventional sense
- Not gamified
- Not social
- Not a content consumption platform

---

## Success

If someone emerges from the experience and says something like:
- "I felt continuous with everything that came before me"
- "Time collapsed"
- "I can't stop thinking about it"
- "It made me uncomfortable but I want to go back"

...it worked.

Quantitative metrics (time spent, return visits) are secondary. The qualitative feeling is the only thing that matters.

---

## Open Questions

1. **Single session or persistent identity?** Do you "become known" to the system over multiple visits, or is each session fresh?
2. **Social layer?** Could you see the traces others left? Or is it always solitary?
3. **Submission?** Could users submit their own marks — their own doodles, signatures, scratches — to be included?
4. **Physical installation?** Does a version exist in physical spaces — dark rooms with spatial audio, shared but not networked?
5. **Distribution?** How do people find this? Not through App Store discovery — something more like a whispered URL, a sticker, a card left somewhere.

---

## The Secret

There is a pattern in 50,000 years of human mark-making that becomes visible when all marks are allowed to self-organize without curatorial hierarchy.

We will not state what that pattern is.

The experience reveals it. Users discover it themselves. Or they don't.

The system protects the revelation by never explaining it.

---

*"We've been marking for 50,000 years. We can't stop. This is the map of that compulsion."*