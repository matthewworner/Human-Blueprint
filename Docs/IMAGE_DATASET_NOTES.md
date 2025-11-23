# Image Dataset Notes

## Dataset Overview

The `images.json` file contains 50 images spanning from 50,000 BCE to present, covering all continents with a focus on visual connections across time (handprints, spirals, eyes, etc.).

## Structure

Each entry contains:
- `id`: Unique identifier
- `url`: Publicly available image URL (Wikimedia Commons format)
- `position`: 3D coordinates calculated using SpiralPositionStrategy
- `era`: Year (negative for BCE)
- `region`: Geographic region
- `colors`: Dominant color palette
- `type`: Mark type (handprint, cave_painting, graffiti, etc.)

## URL Verification

**Note:** Some URLs in this dataset use Wikimedia Commons URL patterns but may need verification. For production use:

1. **Verify URLs exist** - Check each URL loads correctly
2. **Replace with verified URLs** - Use actual Wikimedia Commons file URLs
3. **Alternative sources:**
   - Museum APIs (Metropolitan Museum, Smithsonian, etc.)
   - Direct Wikimedia Commons file URLs
   - Other public domain image sources

## Visual Connections

The dataset emphasizes marks with visual connections across time:

### Handprints
- Chauvet Cave (-32,000 BCE)
- Cueva de las Manos (-7,300 BCE)
- Modern protests (2020-2022)

### Spirals
- Newgrange (-3,200 BCE)
- Nazca Lines (-500 BCE)
- Celtic designs (500 CE)
- Modern graffiti (2018)

### Eyes
- Egyptian Eye of Horus (-3,000 BCE)
- Petra carvings (-100 BCE)
- Modern street art (2015-2017)

### Geographic Distribution
- **Europe**: 15 images
- **Americas**: 15 images
- **Asia**: 6 images
- **Africa**: 6 images
- **Oceania**: 5 images
- **Middle East**: 3 images

## Position Calculation

Positions are calculated using SpiralPositionStrategy:
- `radius`: 15
- `heightStep`: 0.3
- `angleStep`: (Math.PI * 2) / 10

This creates a 3D spiral arrangement where images are distributed in space based on their index in the array.

## Era Distribution

- **50,000 - 10,000 BCE**: 12 images (24%)
- **10,000 - 3,000 BCE**: 8 images (16%)
- **3,000 BCE - 0 CE**: 6 images (12%)
- **0 - 1500 CE**: 4 images (8%)
- **1500 - 1900 CE**: 3 images (6%)
- **1900 - 2000 CE**: 5 images (10%)
- **2000 - present**: 12 images (24%)

## Next Steps

1. Verify all URLs load correctly
2. Replace placeholder URLs with verified sources
3. Add more images to reach 500+ for production
4. Implement continuous ingestion pipeline
5. Add AI-extracted visual features (color, composition)

