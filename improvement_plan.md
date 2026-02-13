# The Human Blueprint - Improvement Plan

## Executive Summary

The current codebase successfully demonstrates the core gaze → rupture → transport mechanic but requires significant enhancements to achieve the PRD's vision of a transformative spatial computing experience. This plan follows the PRD's phased development approach over 20 weeks, prioritizing critical fixes, atmospheric improvements, and progressive feature expansion to reach full PRD compliance.

**Current Status:** Phase 0 prototype (functional but basic)
**Target:** Phase 3 launch with 5,000+ images and complete WebXR ecosystem
**Philosophy:** Follow PRD phases exactly, ensuring each milestone delivers the specified capabilities

---

## 🚨 PROJECT STATUS (Jan 3, 2026)

**Status:** ⏸️ **PARKED**
**User Rating:** 4/10
**Reason:** Infrastructure works, but visual experience does not meet expectations.

See [Docs/BUILD_AUDIT_AND_RECOVERY.md](./Docs/BUILD_AUDIT_AND_RECOVERY.md) for full status and next steps.

---

## Phase Breakdown (Legacy/planned)

### Phase 0: Proof of Concept Refinement (Weeks 1-6) ✅ COMPLETED
**Focus:** Complete and polish the Phase 0 proof-of-concept per PRD specifications
**Goal:** Deliver a working prototype that proves the core mechanic creates the desired "recognition" feeling

**Deliverables:**
- ✅ 50 images manually curated
- ✅ Basic Three.js 3D space
- ✅ Simple arrangement
- ✅ Gaze detection (mouse + basic WebXR eye tracking)
- ✅ One rupture type programmed
- ✅ Minimal audio
- ✅ Runs in desktop browser

### Phase 1: Infrastructure & Scale (REVISED FOCUS)
**Current Status:** ✅ RECOVERY COMPLETE / SCALING PENDING
**Focus:** Decouple backend logic, establish true ingestion pipeline, and enable performance scaling.


**Deliverables:**
- ✅ 500+ images (2039 total: 2000 legacy + 39 scraped with AI data)
- ✅ Web scraping pipeline functioning (CLI-based `npm run ingest`)
- ✅ AI classification working (CLIP embeddings via CLI, pre-computed)
- ✅ Arrangement algorithm (UMAP pre-calculated positions)
- 🚧 WebXR implementation (Basics working, advanced eye-tracking pending)
- 🚧 Gaze-responsive ruptures (Basic gaze tracking working)
- 🚧 Generative audio system (Basic implementation)
- 🚧 localStorage personalization (Basic implementation)

**What Gets Built:**
- ✅ `scripts/ingest.js` for museum API integration
- ✅ `scripts/CLIImageClassifier.js` with CLIP model for feature extraction
- ✅ Enhanced `scripts/computeLayout.js` with UMAP similarity positioning
- Advanced `GazeTracker.js` with WebXR eye tracking and pattern detection
- Expanded `RuptureSystem.js` with multiple trigger types and connecting threads
- Full `AudioSystem.js` with spatial audio and generative synthesis
- Personalization system with localStorage and return visit behavior

**Success Criteria:**
- 500 images arranged by visual similarity, not chronology
- Full experience loop works on phones (testable by team)
- AI accurately classifies human marks and extracts visual features
- Personalization creates different experiences on return visits
- WebXR provides immersive experience on supported devices

### Phase 2: Beta Refinement (Weeks 19-34)
**Focus:** Optimize for Vision Pro and scale to 2,000+ images
**Goal:** Deliver transformative Vision Pro experience with continuous ingestion

**Deliverables:**
- ✅ 2,000+ images, continuously ingesting (daily pipeline active)
- ✅ Vision Pro eye tracking integration (precise gaze detection)
- ✅ Spatial audio fully implemented (3D positioning, binaural)
- ✅ 6-8 rupture patterns (expanded behavioral triggers)
- ✅ Return visit behavior working (pattern resistance, forced exploration)
- ✅ Location-aware features (IP geolocation, optional GPS)
- ✅ Performance optimization (60fps+ across all devices)
- ✅ Small group testing (50 users, qualitative feedback)

**What Gets Built:**
- Vision Pro-specific optimizations in `GazeTracker.js`
- Full spatial audio implementation in `AudioSystem.js`
- Advanced rupture patterns in `RuptureSystem.js`
- Location services integration (IP geolocation, GPS proximity)
- Performance optimizations (LOD, spatial indexing, culling)
- User testing framework and feedback collection
- Continuous ingestion pipeline with content moderation

**Success Criteria:**
- Vision Pro experience feels truly transformative and immersive
- Spatial audio creates uncanny "sound from the image" effect
- Return visits actively challenge user patterns
- Performance maintains 60fps with 2000+ images
- User testing shows desired "recognition" reactions

### Phase 3: Launch Preparation (Weeks 35-50)
**Focus:** Scale to 5,000+ images and prepare for public release
**Goal:** Create a findable, stable experience ready for the "mixtape" distribution model

**Deliverables:**
- ✅ 5,000+ images with continuous ingestion stable
- ✅ All device types optimized (Vision Pro, Quest, phone AR, desktop)
- ✅ Continuous ingestion stable (daily growth, moderation working)
- ✅ Privacy/ethics documentation (clear data practices, consent)
- ✅ Distribution channels activated (QR codes, installation venues)
- ✅ Installation version ready (dedicated hardware setup)
- ✅ Public URL live (stable hosting, monitoring)

**What Gets Built:**
- Full device optimization pipeline (progressive enhancement)
- Production content moderation system
- Privacy policy and ethical guidelines documentation
- Distribution materials (QR codes, installation guides)
- Installation hardware integration
- Production deployment and monitoring
- Final performance optimizations for 5000+ images

**Success Criteria:**
- Experience works flawlessly on all target platforms
- Content ingestion maintains database growth without issues
- Privacy practices are transparent and user-controlled
- Installation venues can deploy the experience reliably
- Public URL is stable and discoverable through word-of-mouth

---

## Timeline Overview

```
Weeks 1-6: Phase 0 - Proof of Concept Refinement
Weeks 7-18: Phase 1 - Alpha Development (500 images, core systems)
Weeks 19-34: Phase 2 - Beta Refinement (2000+ images, Vision Pro optimization)
Weeks 35-50: Phase 3 - Launch Preparation (5000+ images, public release)
```

**Total Duration:** 50 weeks (approximately 12 months)
**Key Milestones:**
- Week 6: Enhanced Phase 0 prototype complete
- Week 18: Alpha testable on all devices
- Week 34: Vision Pro transformative experience
- Week 50: Public launch ready

---

## Risk Mitigation

**Technical Risks:**
- WebXR eye tracking complexity → Progressive enhancement with fallbacks
- AI classification at scale → Hybrid AI + human curation approach
- Performance with thousands of images → LOD and spatial optimization from start
- CORS and content licensing → Multiple source strategies, fair use legal review

**Content Risks:**
- Copyright violations → Attribution system, removal on request
- Harmful content inclusion → Multi-layer moderation (AI + human + user reports)
- Content quality inconsistency → Confidence scoring and filtering

**Scope Risks:**
- Timeline extension → Phased releases, working software over comprehensive features
- Feature creep → Strict PRD adherence, regular scope reviews
- Browser compatibility → Focus on WebXR-capable modern browsers

---

## Success Metrics

**Quantitative (per PRD):**
- Time spent in experience (target: >5 minutes average)
- Return visit rate (target: >30%)
- Geographic reach (global distribution)
- Marks in database (5,000+ at launch, growing daily)
- Rupture frequency per session (multiple per visit)

**Qualitative (per PRD):**
- "What the fuck did I just experience?" reactions
- "I can't stop thinking about it" follow-up comments
- "It made me uncomfortable but I want to go back"
- "I saw myself in there" recognition statements
- "Time collapsed" temporal disorientation reports

**Technical:**
- 60fps performance across devices (90fps for VR)
- <2 second initial load time
- 95%+ image load success rate
- Zero crashes in normal usage
- WebXR compatibility on target devices

---

## Dependencies & Resources

**Technical Stack:**
- Three.js (3D rendering, WebXR)
- Web Audio API (generative soundscapes)
- TensorFlow.js (AI classification)
- Node.js/Express (scraping pipeline, API server)
- PostgreSQL/MongoDB (image metadata storage)
- WebXR API (cross-platform XR)

**Content Sources (per PRD):**
- Museum APIs (Metropolitan, Smithsonian, Louvre, etc.)
- Wikimedia Commons (public domain works)
- Archaeological databases (global collections)
- Social media APIs (Instagram, Flickr for contemporary marks)
- Academic archives and research collections

**Team Requirements:**
- Lead Developer (3D/WebXR specialist)
- AI/ML Engineer (computer vision, classification)
- Backend Developer (scraping, data pipeline)
- Audio Engineer (generative sound design)
- UX Designer (atmospheric interface design)
- Content Curator (moderation, quality control)
- Legal Counsel (copyright, privacy)

---

## Alignment with PRD Requirements

This plan directly implements all PRD specifications:

**Core Features:**
- ✅ Gaze-driven navigation with eye tracking
- ✅ Rupture mechanics with connecting threads
- ✅ Generative audio based on image properties
- ✅ Personalization without data collection
- ✅ Location-aware entry points

**Technical Architecture:**
- ✅ WebXR primary platform with progressive enhancement
- ✅ t-SNE/UMAP arrangement algorithm
- ✅ CLIP-based AI classification
- ✅ Spatial audio positioning
- ✅ Multi-factor similarity weighting

**Content Strategy:**
- ✅ 50,000-year timeline coverage
- ✅ Anti-Western-canon geographic weighting
- ✅ Democratic inclusion (graffiti, bathroom scribbles)
- ✅ Continuous ingestion pipeline

**User Experience:**
- ✅ No onboarding, no tutorials
- ✅ Disorienting, uncomfortable design
- ✅ Transformative recognition goal
- ✅ Exit path visualization

**Distribution:**
- ✅ "Mixtape" model with QR codes
- ✅ Installation versions for venues
- ✅ Word-of-mouth discovery

---

**Document Version:** 2.1
**Last Updated:** December 31, 2025
**Status:** Phase 1 completed, aligned with PRD v1.0