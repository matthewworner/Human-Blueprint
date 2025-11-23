# The Human Blueprint
## Product Requirements Document

### Vision Statement

A spatial computing experience that reveals the pattern of human mark-making consciousness across 50,000 years. Not an educational tool or art gallery, but a mirror that shows users themselves as part of an unbroken chain of human visual expression.

---

## Core Principle

**The collage IS the interface. The eye IS the input. The recognition IS the output.**

This is not about viewing art history. It's about experiencing yourself as continuous with 50,000 years of human mark-making.

---

## What It Is

An immersive, eye-tracking driven spatial experience where ALL human marks—from paleolithic cave paintings to bathroom stall graffiti—self-organize into a living collage based on visual DNA, not curatorial hierarchy.

### Key Attributes
- **Democratic**: No hierarchy between "art" and "garbage"
- **Alive**: Continuously ingesting new marks from the web
- **Responsive**: Reacts to user's gaze patterns in real-time
- **Disorienting**: Deliberately unsettling, not comfortable
- **Transformative**: Creates recognition, not education

---

## What It Is NOT

- ❌ A museum experience
- ❌ An educational timeline
- ❌ A curated art collection
- ❌ User-friendly or comfortable
- ❌ A slideshow or predetermined journey

---

## User Experience Flow

### Entry
- User visits URL (WebXR)
- Works on phone, VR headset (Quest), or Vision Pro
- No login, no onboarding, no tutorial
- Drops into random location in collage based on:
  - Geographic location (IP/GPS)
  - Time of day
  - Device type
  - Pure chance

### Core Interaction Loop
1. **User's eye lands somewhere** (unconscious choice)
2. **System detects gaze** (dwell, scanning, avoidance)
3. **Connections illuminate** (related marks pulse across time/space)
4. **User looks toward connection** (gaze = navigation)
5. **Space reorganizes** around attention patterns
6. **System builds understanding** of user's visual vocabulary
7. **Rupture occurs** when patterns detected (dwelling, avoidance, restlessness)

### Rupture Mechanics
**When triggered:**
- Dwelling too long (comfort detected)
- Avoiding patterns (unconscious aversion detected)
- Rapid scanning (restlessness detected)
- Returning gaze (obsession detected)

**What happens:**
- Visual/audio CRACK
- Instant transport to distant time/place/culture
- Always contains connecting thread (color, gesture, shape, pattern)
- User must discover the connection themselves
- No explanation, no hand-holding

### Exit
- User removes headset or closes browser
- System shows: "This was your path" (visual trace)
- Reveals pattern: "You returned to [handprints/eyes/spirals/etc.]"
- No save, no account, no "progress"
- But browser remembers on return visit

---

## Technical Architecture

### Platform Strategy
**Primary: WebXR (web-based spatial computing)**

**Why:**
- No App Store approval needed
- Cross-platform (Vision Pro, Quest, phone, desktop)
- Instant updates
- URL-based distribution ("mixtape" model)
- Progressive enhancement based on device

**Device Optimization:**
- **Vision Pro**: Full immersion, precise eye tracking, spatial audio
- **Meta Quest**: VR immersion, hand tracking, good enough
- **iPhone/Android AR**: Mixed reality, marks appear in physical space
- **Phone browser**: Touch/tilt navigation, window into collage
- **Desktop**: Mouse/trackpad, development/testing platform

### Technology Stack

**Frontend:**
- Three.js or Babylon.js (3D rendering, WebXR)
- Web Audio API (generative soundscapes)
- WebGL (performance)
- Progressive Web App structure

**Image Ingestion Pipeline:**
- Firecrawl or similar web scraping
- APIs: Museum collections (Met, Smithsonian, etc.)
- Social media scraping (Instagram, Flickr, etc.)
- Archaeological databases
- User submissions (optional future)

**AI/ML Layer:**
- CLIP or similar (image classification, feature extraction)
- Identify: Is this a human mark?
- Extract: Color, composition, mark type, visual features
- No filtering for "quality" - garbage included intentionally

**Arrangement Algorithm:**
- Dimensionality reduction (t-SNE or UMAP)
- Position images in 3D space based on:
  - Temporal proximity
  - Geographic origin
  - Visual similarity (color, composition, gesture)
  - Mark type (carved, painted, drawn, arranged)
  - Subject matter
  - Scale/ambition
- Multi-factor weighting - no single organizing principle
- Incremental updates as new marks ingested

**Gaze Tracking:**
- WebXR eye tracking API (Vision Pro)
- Hover detection (Quest, less precise)
- Device orientation + screen position (phone)
- Mouse position (desktop fallback)

**Generative Audio:**
- Tone.js or Web Audio API native
- Real-time synthesis based on:
  - Current image properties (color → timbre, age → frequency)
  - Geographic region → cultural sound signatures
  - User movement speed → rhythm/density
  - Rupture events → dissonant transitions
- Eno-style: ambient, unnerving, mostly subliminal
- Spatial audio positioning in 3D
- Binaural for headphones

**Personalization (Minimal Data):**
- Browser localStorage:
  - Visit count
  - Previous attention patterns
  - Regions dwelled/avoided
- IP geolocation (city-level, not precise)
- Optional GPS (for proximity features)
- No accounts, no tracking for profit
- Data used only to create experience

---

## Data & Content Strategy

### What Qualifies as a "Mark"
**Inclusion criteria: Did a human make a visible mark?**

✅ Include:
- Cave paintings, petroglyphs, rock art
- Museum artifacts, ancient art
- Graffiti, tags, street art
- Bathroom stall scrawls
- Children's drawings
- Doodles, sketches, scribbles
- Protest signs, chalk marks
- Handprints, signatures
- Tally marks, counting systems
- Accidental smears (if human-made)
- Emoji sequences
- Digital marks, screenshots
- Worn patterns, erosion from touch
- Arranged objects (rocks, sticks)

❌ Exclude:
- Natural formations (no human intervention)
- Pure photography of nature
- Text-only content without visual mark-making
- AI-generated images (no human mark)

### Database Structure
Each mark contains:
- **Image** (URL or base64)
- **Temporal**: Date/era (approximate if unknown)
- **Geographic**: Origin location (if known)
- **Visual features**: Color palette, composition analysis (AI-extracted)
- **Mark type**: Painted, carved, drawn, arranged, digital, accidental
- **Scale**: Intimate (hand-sized) to monumental
- **Source**: Where scraped from, attribution if available
- **Confidence**: How certain is the metadata?

### Initial Dataset Goals
- **MVP**: 500 marks spanning full timeline
- **Beta**: 2,000+ marks
- **Launch**: 5,000+ marks with continuous ingestion
- **Steady state**: 50,000+ marks, growing daily

### Temporal Distribution (Target)
Weighted toward underrepresented eras:
- 50,000-10,000 BCE: 15%
- 10,000-3,000 BCE: 15%
- 3,000 BCE-0 CE: 15%
- 0-1500 CE: 15%
- 1500-1900 CE: 15%
- 1900-2000 CE: 15%
- 2000-present: 10%

### Geographic Distribution (Target)
Anti-Western-canon weighting:
- Europe: 20%
- Asia: 20%
- Africa: 15%
- Americas: 15%
- Oceania: 15%
- Middle East: 15%

---

## User Personalization Features

### Location-Aware Entry
- IP geolocation determines starting region
- Auckland user → Pacific marks
- Berlin user → European marks
- But only for initial drop-in, not constraint

### Return Visit Behavior
**First visit:**
- Natural exploration
- System learns patterns

**Second visit:**
- "You lingered on handprints last time"
- Either feeds or denies that pattern
- May start in opposite region

**Third+ visits:**
- Actively resists established patterns
- Forces exploration of avoided areas
- "You keep avoiding faces. Today: faces."

### Proximity Features (Optional)
If GPS enabled:
- Near museum → marks from that collection appear
- Near historical site → regional ancient marks surface
- Near street art → local graffiti included
- Creates uncanny "it knows where I am" feeling

### Time-of-Day Variation
- Late night (10pm-4am): Darker, more primal marks prioritized
- Morning (6am-10am): Lighter palette, newer marks
- Afternoon: Balanced
- Audio tone shifts with time of day

---

## Privacy & Ethics

### Data Collection
**What we collect:**
- Visit timestamps
- Gaze patterns within session
- Regions dwelled/avoided
- Device type
- Approximate location (city-level via IP)

**What we DON'T collect:**
- Names, emails, accounts
- Precise GPS (unless user explicitly enables)
- Cross-site tracking
- Anything sold or shared

### Data Storage
- Browser localStorage (user controls)
- No server-side user profiles
- Anonymous aggregated analytics only
- Clear privacy statement on entry

### Copyright Approach
- Link to sources, don't claim ownership
- Thumbnail/preview fair use
- Attribution where available
- No commercial use of others' work
- Remove on request from rights holders

### Ethical Stance
**The surveillance question:**
Personalization serves the transformative experience, not exploitation. Data never leaves the user's device or is used for profit. Clear transparency about what's tracked and why.

---

## Distribution Strategy

### "Mixtape" Model
No mass marketing. Discovery-based distribution:

**Physical:**
- QR codes on stickers in galleries, museums
- Cards left in art books at bookstores
- Graffiti with URL in appropriate locations
- Gallery installations with dedicated devices

**Digital:**
- Shared in art/philosophy forums
- Whispered in conversations
- Social media (organic, not ads)
- Artist/academic networks
- Underground culture channels

**Word of mouth:**
"Have you been to that URL? You need to experience it alone."

### Installation Version
Physical spaces with Vision Pro headsets:
- Museums (ironic - using museum space to break museum narrative)
- Galleries
- Art festivals
- Academic conferences
- Private viewings

User books time, has solo experience, leaves.

---

## Success Metrics

### Quantitative
- Time spent in experience (longer = deeper engagement)
- Return visit rate
- Geographic reach
- Marks in database (growth over time)
- Rupture frequency per session

### Qualitative (User Responses)
**Desired reactions:**
- "What the fuck did I just experience?"
- "I can't stop thinking about it"
- "It made me uncomfortable but I want to go back"
- "I saw myself in there"
- "Time collapsed"

**NOT desired:**
- "That was nice"
- "Interesting educational tool"
- "Good way to learn about art history"

### The Real Metric
**Did users experience recognition?** 
The sense that they're part of an unbroken 50,000-year chain of mark-making consciousness.

If even 10% of users report this feeling, the project succeeds.

---

## Development Phases

### Phase 0: Proof of Concept (4-6 weeks)
**Goal:** Does the core mechanic work?

- [ ] 50 images manually curated
- [ ] Basic Three.js 3D space
- [ ] Simple arrangement (chronological spiral)
- [ ] Gaze detection (mouse on desktop, basic eye tracking if available)
- [ ] One rupture type programmed
- [ ] Minimal audio (one drone tone)
- [ ] Runs in desktop browser

**Success criteria:** Does it create the feeling? Even crudely?

### Phase 1: Alpha (8-12 weeks)
**Goal:** Core systems working

- [ ] 500 images, full timeline
- [ ] Web scraping pipeline functioning
- [ ] AI classification working
- [ ] Arrangement algorithm (t-SNE/UMAP)
- [ ] WebXR implementation (phone + desktop)
- [ ] Gaze-responsive ruptures (3-4 types)
- [ ] Generative audio system (basic)
- [ ] localStorage personalization

**Success criteria:** Full experience loop exists, testable on phones

### Phase 2: Beta (12-16 weeks)
**Goal:** Refinement + Vision Pro optimization

- [ ] 2,000+ images, continuously ingesting
- [ ] Vision Pro eye tracking integration
- [ ] Spatial audio fully implemented
- [ ] 6-8 rupture patterns
- [ ] Return visit behavior working
- [ ] Location-aware features
- [ ] Performance optimization (60fps+)
- [ ] Small group testing (50 users)

**Success criteria:** Vision Pro experience is transformative

### Phase 3: Launch (16-20 weeks)
**Goal:** Public release

- [ ] 5,000+ images
- [ ] All device types optimized
- [ ] Continuous ingestion stable
- [ ] Privacy/ethics documentation
- [ ] Distribution channels activated
- [ ] Installation version ready
- [ ] Public URL live

**Success criteria:** It exists in the world, findable by those who seek it

---

## Technical Challenges & Solutions

### Challenge: Eye tracking accuracy across devices
**Solution:** Progressive enhancement
- Vision Pro: Precise gaze tracking
- Quest: Hover-based approximation
- Phone: Device orientation + screen touch
- Desktop: Mouse position fallback
- Core mechanic works at all levels, just less precise

### Challenge: Performance with thousands of images
**Solution:** 
- Level-of-detail (LOD) rendering
- Only load high-res for nearby images
- Instancing for repeated elements
- Spatial indexing for culling
- Target 60fps minimum (90fps for VR)

### Challenge: Arrangement algorithm at scale
**Solution:**
- Pre-compute arrangement server-side
- Incremental updates (don't recalculate entire space)
- Hierarchical clustering (macro → micro detail)
- Cache computed positions

### Challenge: Audio generation CPU cost
**Solution:**
- Synthesize small set of tones, layer/modulate
- Use Web Audio's built-in efficiency
- Spatial audio handled by browser
- Limit concurrent sound sources

### Challenge: Copyright/legal concerns
**Solution:**
- Fair use (transformative, educational)
- Link to sources, attribute
- Thumbnail-sized images
- Remove on request
- No commercial use
- Consult IP lawyer before launch

### Challenge: Content moderation (harmful images)
**Solution:**
- AI pre-screening for extreme content
- Human review of flagged items
- User reporting mechanism
- But: Don't over-sanitize. "Garbage" is part of the concept.
- Clear content warning on entry

---

## Open Questions

1. **How violent should ruptures be?** Currently: disorienting but not traumatic. Test with users.

2. **Should we allow user-submitted marks?** Pro: radically democratic. Con: moderation burden.

3. **Audio volume/prominence?** Currently: subliminal Eno-style. Could be more aggressive.

4. **Maximum session length?** Should it auto-exit after 30 minutes to force reflection?

5. **Social features?** Share your path? See others' paths? Or keep it solitary?

6. **Monetization?** None planned. But: could charge for installation hardware rental?

7. **Accessibility?** Audio descriptions? Alternative nav for visually impaired? (Ironic given it's visual-first)

8. **Name?** "The Human Blueprint" or something less explicit?

---

## Non-Goals

Things we explicitly are NOT trying to do:

- Create a comprehensive art history resource
- Replace museums or art education
- Be accessible/comfortable for everyone
- Maximize user engagement metrics
- Monetize user attention
- Build a social platform
- Gamify the experience
- Provide definitive answers about art
- Be politically neutral (the anti-museum stance IS political)

---

## The Secret

There is an underlying pattern in 50,000 years of human mark-making that becomes visible when all marks are allowed to self-organize without curatorial hierarchy.

**We will not state what that pattern is.**

The collage reveals it. Users discover it themselves. Or they don't.

The system protects the revelation by never explaining it.

---

## Contact & Contribution

[To be determined: How do people report bugs, suggest sources, contribute marks?]

**Philosophy:** Keep it small, focused, intentional. This is not a platform for everyone. It's an experience for those who need it.

---

## Appendix: Inspirations

- Rothko Chapel (immersion, contemplation, unease)
- Donnie Darko website (non-linear discovery, hidden connections)
- Brian Eno (generative systems, ambient unease)
- Early internet (weird, personal, underground)
- Lascaux (standing in presence of ancient human marks)
- Cave of Forgotten Dreams (Werner Herzog's reverence for mark-making)
- Borges' Library of Babel (infinite, overwhelming, meaningful)

---

**Version:** 1.0  
**Date:** November 24, 2025  
**Status:** Conceptual → Moving to prototype

---

*"We've been marking for 50,000 years. We can't stop. This is the map of that compulsion."*