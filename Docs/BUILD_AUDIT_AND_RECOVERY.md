# 🔬 BUILD AUDIT & RECOVERY PLAN
**Date:** January 3, 2026
**Status:** ⏸️ PARKED - Infrastructure Complete, Visual Experience Needs Work
**Rating:** 4/10 (User Assessment)

---

## EXECUTIVE SUMMARY

Infrastructure recovery is complete, but the **visual experience does not meet expectations**. The project is being parked for future work.

### What Works ✅
| Component | Status |
|-----------|--------|
| Ingestion Pipeline | `npm run ingest` - scrapes Met Museum, generates CLIP embeddings |
| UMAP Layout | `npm run compute-layout` - pre-calculates 3D positions |
| Frontend Build | 1.3MB bundle (down from ~15MB) |
| Lazy Loading | Images stream in as camera approaches |
| Dataset | 2,039 images (39 with AI vectors) |

### What Doesn't Work ❌
| Issue | Description |
|-------|-------------|
| Visual Quality | Experience feels generic, not "transformative" per PRD |
| Loading UX | Still abrupt despite lazy loading improvements |
| Atmosphere | Missing the "uncanny recognition" feeling described in PRD |
| Polish | Placeholders are jarring, transitions not smooth enough |

---

## CURRENT STATE (For Future Reference)

### Commands Available
```bash
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Production build → dist/
npm run ingest       # Scrape Met Museum + CLIP embeddings
npm run compute-layout  # Generate UMAP 3D positions
```

### Key Files
```
scripts/
├── ingest.js           # CLI entry point for data pipeline
├── CLIImageClassifier.js  # CLIP model for embeddings
├── computeLayout.js    # UMAP 3D positioning
└── ScrapingPipeline.js # Museum API scraping logic

src/core/
├── SceneManager.js     # Three.js scene, LOD/lazy loading
├── ImageLoader.js      # JSON loading, texture management
├── ImageClassifier.js  # Lightweight frontend stub
└── ArrangementAlgorithm.js  # (Unused - positions pre-computed)

public/
└── images.json         # 2,039 images with positions
```

### Dataset Status
- **Total Images:** 2,039
- **With CLIP Vectors:** 39 (from Met Museum)
- **With UMAP Positions:** 39
- **Legacy Images:** 2,000 (random positions, no AI data)

---

## WHAT NEEDS WORK (When Resuming)

### Priority 1: Visual Experience
- [ ] Better placeholder design (not just colored squares)
- [ ] Smoother fade transitions
- [ ] Consider different arrangement visualization
- [ ] Add atmospheric effects (fog, depth of field)
- [ ] Better lighting for images

### Priority 2: Loading UX
- [ ] Progressive loading indicator
- [ ] Prioritize visible images only
- [ ] Consider image thumbnails first, then full res

### Priority 3: Scale
- [ ] Run CLIP on all 2,000 legacy images
- [ ] Unify UMAP layout across entire dataset
- [ ] Add more museum sources (Smithsonian needs API key)

### Priority 4: Core Experience
- [ ] Gaze tracking refinement
- [ ] Rupture effects polish
- [ ] Audio integration
- [ ] WebXR testing

---

## LESSONS LEARNED

1. **Infrastructure ≠ Experience** - Having a working pipeline doesn't mean the visual result is good.
2. **2,000+ images is heavy** - Browser performance is a real constraint.
3. **Lazy loading helps but not enough** - The UX still feels jarring.
4. **Need design iteration** - The visual language needs more thought.

---

## NEXT SESSION STARTING POINT

When resuming:
1. Run `npm run dev` to start the server
2. Review this document
3. Focus on **visual polish** over infrastructure
4. Consider: What would make this feel "transformative"?

---

**Last Updated:** January 3, 2026
**Next Action:** Park project, return when ready for design iteration
