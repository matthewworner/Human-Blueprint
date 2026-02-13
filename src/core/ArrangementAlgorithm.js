import { UMAP } from 'umap-js';

export class ArrangementAlgorithm {
    constructor() {
        // Phase 0: Simple spiral
        // Phase 1+: Multi-dimensional similarity (t-SNE/UMAP)
    }
    
    generateSpiralArrangement(count) {
        // Simple 3D spiral arrangement for Phase 0
        // Later: Replace with similarity-based arrangement
        
        const positions = [];
        const radius = 15;
        const heightStep = 0.3;
        const angleStep = (Math.PI * 2) / 10; // 10 images per rotation
        
        for (let i = 0; i < count; i++) {
            const angle = i * angleStep;
            const height = i * heightStep - (count * heightStep) / 2;
            const currentRadius = radius + Math.sin(i * 0.1) * 3; // Slight variation
            
            positions.push({
                x: Math.cos(angle) * currentRadius,
                y: height,
                z: Math.sin(angle) * currentRadius
            });
        }
        
        return positions;
    }
    
    /**
     * Generate 3D positions using UMAP-based similarity arrangement with CLIP features
     * @param {Array} images - Array of image data with feature vectors
     * @returns {Array} Array of {x, y, z} positions
     */
    generateSimilarityArrangement(images) {
        console.log(`Generating UMAP similarity arrangement for ${images.length} images`);

        // Extract feature vectors and metadata
        const featureVectors = images.map(img => img.featureVector || this.generateFallbackFeatures(img));
        const metadata = images.map(img => ({
            era: img.era || 0,
            region: img.region || 'Unknown',
            type: img.type || 'unknown'
        }));

        // Create weighted multi-factor feature vectors
        const weightedFeatures = this.createWeightedFeatures(featureVectors, metadata);

        // Use UMAP to reduce to 3D
        const positions3D = this.computeUMAPLayout(weightedFeatures);

        // Scale and center the positions
        const scaledPositions = this.scaleAndCenterPositions(positions3D);

        console.log('UMAP similarity arrangement complete');
        return scaledPositions;
    }

    /**
     * Create weighted multi-factor feature vectors combining CLIP features with metadata
     * @param {Array} featureVectors - CLIP feature vectors
     * @param {Array} metadata - Metadata objects
     * @returns {Array} Weighted feature vectors
     */
    createWeightedFeatures(featureVectors, metadata) {
        const weights = {
            clip: 0.7,
            era: 0.1,
            region: 0.1,
            type: 0.1
        };

        return featureVectors.map((vec, index) => {
            const meta = metadata[index];

            // Normalize metadata to similar scale as CLIP features
            const eraFeature = (meta.era / 20000) * weights.era; // Normalize era
            const regionFeature = this.hashString(meta.region) / 1000 * weights.region;
            const typeFeature = this.hashString(meta.type) / 1000 * weights.type;

            // Combine with CLIP features
            const weightedVec = vec.map(v => v * weights.clip);
            weightedVec.push(eraFeature, regionFeature, typeFeature);

            return weightedVec;
        });
    }

    /**
     * Compute 3D layout using UMAP
     * @param {Array} featureVectors - Weighted feature vectors
     * @returns {Array} Array of {x, y, z} positions
     */
    computeUMAPLayout(featureVectors) {
        const n = featureVectors.length;

        // Prepare data for UMAP (needs to be a 2D array)
        const data = featureVectors;

        // Configure UMAP for 3D output
        const umap = new UMAP({
            nComponents: 3, // 3D output
            nNeighbors: Math.min(15, Math.max(5, Math.floor(n / 10))), // Adaptive neighbors
            minDist: 0.1,
            spread: 1.0,
            randomState: 42 // For reproducibility
        });

        // Fit and transform
        const embedding = umap.fitTransform(data);

        // Convert to position objects
        return embedding.map(point => ({
            x: point[0],
            y: point[1],
            z: point[2]
        }));
    }

    /**
     * Scale and center the positions for better visualization
     * @param {Array} positions - Raw UMAP positions
     * @returns {Array} Scaled and centered positions
     */
    scaleAndCenterPositions(positions) {
        if (positions.length === 0) return positions;

        // Find bounds
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;

        positions.forEach(pos => {
            minX = Math.min(minX, pos.x);
            maxX = Math.max(maxX, pos.x);
            minY = Math.min(minY, pos.y);
            maxY = Math.max(maxY, pos.y);
            minZ = Math.min(minZ, pos.z);
            maxZ = Math.max(maxZ, pos.z);
        });

        // Calculate ranges
        const rangeX = maxX - minX || 1;
        const rangeY = maxY - minY || 1;
        const rangeZ = maxZ - minZ || 1;
        const maxRange = Math.max(rangeX, rangeY, rangeZ);

        // Scale to desired size and center
        const scale = 10 / maxRange; // Scale to ±5 units roughly
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const centerZ = (minZ + maxZ) / 2;

        return positions.map(pos => ({
            x: (pos.x - centerX) * scale,
            y: (pos.y - centerY) * scale,
            z: (pos.z - centerZ) * scale
        }));
    }

    /**
     * Compute pairwise similarities between images
     * @param {Array} featureVectors - Feature vectors
     * @param {Array} metadata - Metadata objects
     * @returns {Array} Symmetric similarity matrix
     */
    computePairwiseSimilarities(featureVectors, metadata) {
        const n = featureVectors.length;
        const similarities = new Array(n).fill(null).map(() => new Array(n).fill(0));

        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const featureSim = this.cosineSimilarity(featureVectors[i], featureVectors[j]);
                const metadataSim = this.metadataSimilarity(metadata[i], metadata[j]);

                // Weighted combination
                const similarity = 0.7 * featureSim + 0.3 * metadataSim;
                similarities[i][j] = similarity;
                similarities[j][i] = similarity;
            }
        }

        return similarities;
    }

    /**
     * Cosine similarity between two vectors
     */
    cosineSimilarity(vecA, vecB) {
        if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }

        normA = Math.sqrt(normA);
        normB = Math.sqrt(normB);

        if (normA === 0 || normB === 0) return 0;

        return dotProduct / (normA * normB);
    }

    /**
     * Similarity based on metadata (era, region, type)
     */
    metadataSimilarity(metaA, metaB) {
        let similarity = 0;
        let factors = 0;

        // Era similarity (closer in time = more similar)
        const eraDiff = Math.abs(metaA.era - metaB.era);
        const eraSim = Math.max(0, 1 - eraDiff / 10000); // 10k year range
        similarity += eraSim;
        factors++;

        // Region similarity
        if (metaA.region === metaB.region) {
            similarity += 1;
        } else {
            // Some regions are more similar (Europe/Asia vs Europe/Africa)
            similarity += 0.3;
        }
        factors++;

        // Type similarity
        if (metaA.type === metaB.type) {
            similarity += 1;
        } else {
            // Related types are somewhat similar
            similarity += 0.5;
        }
        factors++;

        return similarity / factors;
    }

    /**
     * Generate fallback features for images without classification
     */
    generateFallbackFeatures(image) {
        // Create a basic feature vector from available metadata
        const era = image.era || 0;
        const regionHash = this.hashString(image.region || 'Unknown');
        const typeHash = this.hashString(image.type || 'unknown');

        return [
            era / 20000, // Normalize era
            regionHash / 1000, // Region as number
            typeHash / 1000, // Type as number
            Math.random() * 0.1, // Small random variation
            Math.random() * 0.1,
            Math.random() * 0.1,
            Math.random() * 0.1,
            Math.random() * 0.1,
            Math.random() * 0.1,
            Math.random() * 0.1
        ];
    }

    /**
     * Simple string hashing
     */
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }
    
    // Future: Find connecting thread between two images
    findConnectingThread(imageA, imageB) {
        // Analyze what connects them:
        // - Color similarity
        // - Gesture/mark type
        // - Composition
        // - Subject matter
        // Returns the strongest connection
        
        const connections = [];
        
        // Color similarity
        const colorSim = this.colorSimilarity(imageA.colorPalette, imageB.colorPalette);
        if (colorSim > 0.3) {
            connections.push({ type: 'color', strength: colorSim });
        }
        
        // Mark type
        if (imageA.markType === imageB.markType) {
            connections.push({ type: 'markType', strength: 1.0 });
        }
        
        // Temporal proximity (weaker connection, but still valid)
        const timeDiff = Math.abs(imageA.temporal.yearsAgo - imageB.temporal.yearsAgo);
        if (timeDiff < 1000) {
            connections.push({ type: 'temporal', strength: 1 - (timeDiff / 1000) });
        }
        
        // Return strongest connection
        return connections.sort((a, b) => b.strength - a.strength)[0] || null;
    }
    
    colorSimilarity(paletteA, paletteB) {
        // Simple color similarity calculation
        // In production, use proper color distance metrics
        
        let totalSim = 0;
        let comparisons = 0;
        
        paletteA.forEach(colorA => {
            paletteB.forEach(colorB => {
                const distance = Math.sqrt(
                    Math.pow(colorA.r - colorB.r, 2) +
                    Math.pow(colorA.g - colorB.g, 2) +
                    Math.pow(colorA.b - colorB.b, 2)
                );
                const similarity = 1 - (distance / Math.sqrt(3));
                totalSim += similarity;
                comparisons++;
            });
        });
        
        return comparisons > 0 ? totalSim / comparisons : 0;
    }
}

