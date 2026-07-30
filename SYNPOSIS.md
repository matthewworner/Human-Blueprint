# The Human Blueprint — Project Synopsis

**Status:** Application shell boot verified; artwork corpus blocked. The `/ritual/` MVP described below is not present in the current working tree and should be treated as a design record, not a running build.

> **Implementation reality (2026-07-26):** `npm test`, the production build and a real-network Puppeteer run pass for the current Three.js shell. The vision in this document remains aspirational: 1,950 of the current 2,041 records are generated, 1,499 URLs are fabricated, only 41 records have feature vectors, and no artwork files are local. The next step is a small rights-cleared corpus with verified connections, not scale.

## The Vision

**The Human Blueprint** is a living spatial computing experience that maps 50,000 years of human mark-making consciousness. Not art history — *mark-making*. Every gesture humans have ever made against a surface: cave paintings and bathroom graffiti, illuminated manuscripts and prison tally marks, children's scribbles and prehistoric petroglyphs, protest signs and signatures, digital emoji and ancient cylinder seals.

The experience positions thousands of images in 3D space using multi-dimensional visual similarity (color, form, gesture, technique, subject) rather than chronological or cultural hierarchies. Where an image sits in space has nothing to do with museum value — only what it *looks like* in relation to everything else.

## The Philosophy

Museums curate. They create narratives, hierarchies, and boundaries: "this is art, this is artifact, this is garbage." **The Human Blueprint** refuses that gatekeeping. The handprint on a bathroom stall and the handprint in Chauvet Cave are the same gesture, same impulse, same species saying "I was here." The algorithm doesn't know or care about institutional value — it only sees: *what did this look like, and when was it made?*

The resulting spatial arrangement reveals patterns that institutional curation obscures: the eye motif appearing across 10,000 years and 5,000 miles, the spiral gesture recurring in cultures that never met, the way humans oscillate between representation and abstraction throughout history. These aren't taught — they're *shown*. The images speak to each other across time and space, and users must find the threads themselves.

## The Core Mechanics

### Immersive Spatial Experience
Built as a WebXR application, the collage surrounds users in 3D space. Eye tracking (via Vision Pro or smartphone) becomes the primary interface — where you look is where you go. No menus, no navigation. Pure attention.

### Gaze-Responsive Rupture System
The system reads your eyes in real-time: what you dwell on, what you avoid, where your attention goes when you think no one's watching. Based on gaze patterns, it triggers "ruptures" — violent dislocations that slam you from one region into another with no explanation. You were looking at Pacific spirals, now you're in Celtic illuminated manuscripts. Why? Figure it out.

The rupture is always connected by a thread (color, gesture, form) but the connection isn't stated — users must discover it themselves. This prevents comfort, prevents dwelling, prevents passive consumption.

### Connection Threads
Subtle visual and audio cues hint at relationships: a color that carries through a transition, a shape that pulses briefly, a sound that persists. Users who look deeply notice the threads. Users who scan miss them.

### Anti-Comfort Personalization
The system learns your visual vocabulary — what you return to, what you avoid, your scanning patterns. It uses this knowledge *against* you. You keep looking at handprints? Eventually the rupture will show you handprints from across all time and space. You've been avoiding faces? The system will force you to confront them. Personalization serves provocation, not comfort.

### Generative Soundscapes
Audio responds to position in the collage: era, geography, color palette, density. The aesthetic is Brian Eno-style: ambient, unsettling, silent. Long drones that never resolve. Subtle dissonances. Sounds at the edge of perception that create physical unease. The soundtrack morphs continuously but never announces itself — it creates atmosphere, not music.

### User Path Recognition
The system captures your journey through the space — not to personalize recommendations but to reveal your own patterns. On exit, it shows you: "These are the marks you returned to. This is your visual obsession. This is your path through human mark-making history." You're not just exploring the collage — you're being shown yourself within it.

## The Scale

The database is continuously growing via web scraping of museum APIs, archaeological databases, image archives, and eventually social platforms. The filter is not "is this good?" but "did a human make a visible mark?" Garbage is included deliberately. The system is designed to include everything humans have ever traced, scratched, painted, arranged, or smeared — intentional or accidental, sacred or profane, precious or disposable.

The collage is never finished. New marks appear constantly. No two visits are the same.

## The Experience Arc

1. **Disorientation** — Dropped randomly into the collage, no context, no explanation. "What am I looking at? Where even am I?"
2. **Curiosity** — Connections begin to illuminate. "This connects to that... somehow..."
3. **Pattern Recognition** — The same gestures appear across impossible distances. "Wait, I keep seeing hands, spirals, eyes, circles..."
4. **Dissonance** — The juxtapositions become provocative. "Why is this masterpiece next to this graffiti? Why am I avoiding that cluster?"
5. **Recognition** — The collapse: "Oh. It's all the same. We've always done this. I do this. I am this."
6. **Vertigo** — The understanding that you're not separate from 50,000 years of visual consciousness — you're *in* it. Every mark you've ever made is part of an unbroken chain.

## The Distribution

Built as a WebXR web application, accessible via URL on Vision Pro, VR headsets, smartphones, and desktop browsers. No App Store gatekeeping. Distribution via QR codes, stickers, whispered links, underground sharing — a "mixtape" approach. The experience is deliberately outside institutional control.

## Tech Stack

| Layer | Technology |
|-------|------------|
| 3D Rendering | Three.js / Babylon.js |
| Spatial Computing | WebXR Device API |
| Audio | Web Audio API |
| ML Arrangement | UMAP-JS |
| ML Classification | CLIP (client-side) |
| Build | Vite |
| Image Ingestion | Web scraping pipeline |

## What It's Not

- Not an educational tool
- Not user-friendly in the conventional sense
- Not comfortable
- Not finished when you visit

**What it is**: A mirror that reflects 50,000 years of human visual consciousness back at itself. A tool for experiencing, rather than learning about, the unbroken chain of mark-making that connects all humans across all time. The interface creates the conditions; the revelation is the user's problem.

---

## Ritual MVP Design (not present in the current working tree)

**Historical target:** `/ritual/` at `http://localhost:5176`. No current `/ritual/` directory or running build was found during the revival pass.

A minimum viable version testing the core premise: does 30 marks in a dark sphere create the recognition moment?

### Files
- `index.html` — Minimal HTML, single canvas, fades UI after first interaction
- `ritual.js` — Self-contained Three.js + Web Audio, ES modules via CDN
- No build step, no npm dependencies

### Designed Scope
- 30 marks in dark sphere, fade in immediately (no loading screen)
- Mouse/touch/gyroscope look-around
- Gaze detection via raycasting from camera center
- Connection triggered at 800ms dwell (visual similarity: type + color + era proximity)
- Thread drawn between connected marks
- Brian Eno-style ambient audio (4 drone layers, era-responsive)
- Exit screen showing path count

### Testing Questions
- Does the connection moment create recognition?
- Do users feel the collapse of time?
- Is the audio right (too loud? Too subtle? Wrong tone?)
- Are the 30 marks the right 30?

---

*Document based on conversations with the creator about their vision for the project.*
*See also: `Docs/archive/conversation.md` for the full origin story and development discussion.*
