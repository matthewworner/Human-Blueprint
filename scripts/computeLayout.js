/**
 * Compute UMAP - Pre-calculate 3D positions for similarity-based arrangement
 * 
 * Usage: npm run compute-layout
 * 
 * This script:
 * 1. Reads images.json
 * 2. Extracts feature vectors from images that have them
 * 3. Runs UMAP to get 3D coordinates
 * 4. Updates positions in images.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { UMAP } from 'umap-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function computeLayout() {
    console.log("📐 Starting UMAP Layout Computation...");

    const imagesPath = path.resolve(__dirname, '../public/images.json');
    const data = JSON.parse(fs.readFileSync(imagesPath, 'utf8'));

    console.log(`📊 Total images: ${data.length}`);

    // Separate images with and without vectors
    const withVectors = data.filter(d => d.featureVector && d.featureVector.length > 0);
    const withoutVectors = data.filter(d => !d.featureVector || d.featureVector.length === 0);

    console.log(`🧠 Images with AI vectors: ${withVectors.length}`);
    console.log(`📦 Images without vectors (keeping existing positions): ${withoutVectors.length}`);

    if (withVectors.length < 15) {
        console.log("⚠️ Not enough images with vectors for UMAP (need at least 15). Skipping.");
        return;
    }

    // Extract feature vectors as 2D array
    const vectors = withVectors.map(d => d.featureVector);

    console.log(`🔢 Vector dimensions: ${vectors[0].length}`);
    console.log("⏳ Running UMAP (this may take a moment)...");

    // Configure UMAP for 3D output
    const umap = new UMAP({
        nComponents: 3,
        nNeighbors: Math.min(15, Math.floor(withVectors.length / 2)),
        minDist: 0.1,
        spread: 1.0
    });

    // Fit and transform
    const embedding = umap.fit(vectors);

    console.log("✅ UMAP complete!");

    // Find min/max for scaling
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    embedding.forEach(([x, y, z]) => {
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
    });

    // Scale to fit in a [-20, 20] cube
    const scale = 40;
    const scaleX = (maxX - minX) || 1;
    const scaleY = (maxY - minY) || 1;
    const scaleZ = (maxZ - minZ) || 1;

    // Update positions in withVectors array
    withVectors.forEach((item, i) => {
        const [x, y, z] = embedding[i];
        item.position = [
            ((x - minX) / scaleX - 0.5) * scale,
            ((y - minY) / scaleY - 0.5) * scale * 0.5, // Flatten Y slightly
            ((z - minZ) / scaleZ - 0.5) * scale
        ];
        item.layoutMethod = 'umap'; // Mark as UMAP-positioned
    });

    // Combine back
    const updatedData = [...withVectors, ...withoutVectors];

    // Save
    fs.writeFileSync(imagesPath, JSON.stringify(updatedData, null, 2));

    console.log(`💾 Updated positions for ${withVectors.length} images.`);
    console.log("📐 Layout computation complete!");
}

computeLayout().catch(console.error);
