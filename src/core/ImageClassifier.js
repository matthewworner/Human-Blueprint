/**
 * ImageClassifier - Lightweight stub for frontend
 * 
 * The real AI classification is now done by the CLI script (scripts/CLIImageClassifier.js).
 * This stub exists for backward compatibility but does minimal work.
 * Pre-computed featureVectors should be used from images.json instead.
 */

export class ImageClassifier {
    constructor() {
        this.isInitialized = false;
        console.log('ImageClassifier: Using lightweight stub. AI processing is done at build time via CLI.');
    }

    async init() {
        this.isInitialized = true;
        console.log('ImageClassifier: Stub initialized. No AI models loaded in browser.');
    }

    /**
     * Stub classification - returns basic metadata from image
     * Real classification should be done via CLI and stored in images.json
     */
    async classifyImage(image, existingMetadata = {}) {
        // Return existing metadata without heavy AI processing
        return {
            markType: existingMetadata.type || 'unknown',
            era: existingMetadata.era || 0,
            region: existingMetadata.region || 'Unknown',
            confidence: existingMetadata.confidence || 0.5,
            featureVector: existingMetadata.featureVector || null,
            classification: {
                markType: existingMetadata.type || 'unknown',
                era: existingMetadata.era || 0,
                region: existingMetadata.region || 'Unknown',
                scale: existingMetadata.scale || 'unknown'
            },
            isStub: true
        };
    }

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

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    computeSimilarityMatrix(images) {
        const n = images.length;
        const matrix = [];

        for (let i = 0; i < n; i++) {
            matrix[i] = [];
            for (let j = 0; j < n; j++) {
                if (i === j) {
                    matrix[i][j] = 1;
                } else if (j < i) {
                    matrix[i][j] = matrix[j][i];
                } else {
                    const vecA = images[i].featureVector;
                    const vecB = images[j].featureVector;
                    matrix[i][j] = this.cosineSimilarity(vecA, vecB);
                }
            }
        }

        return matrix;
    }
}