import { AutoProcessor, CLIPVisionModelWithProjection, RawImage } from '@xenova/transformers';

/**
 * CLI Image Classifier
 * Uses local CLIP Vision model to generate feature vectors for images.
 * Designed to run in Node.js environment during ingestion.
 */
export class CLIImageClassifier {
    constructor() {
        this.modelId = 'Xenova/clip-vit-base-patch32';
        this.processor = null;
        this.visionModel = null;
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) return;

        console.log(`🤖 Loading AI Model (${this.modelId})... This may take a while on first run.`);

        // Load the processor and vision model separately for image embeddings
        this.processor = await AutoProcessor.from_pretrained(this.modelId);
        this.visionModel = await CLIPVisionModelWithProjection.from_pretrained(this.modelId);

        this.isInitialized = true;
        console.log("🤖 AI Model Loaded.");
    }

    /**
     * Generate embedding for an image URL
     * @param {string} imageUrl 
     * @returns {Promise<Array<number>>} Feature vector (512 dimensions for CLIP ViT-B/32)
     */
    async extractFeatures(imageUrl) {
        if (!this.isInitialized) await this.init();

        try {
            // Load image from URL using RawImage
            const image = await RawImage.fromURL(imageUrl);

            // Process image through the CLIP processor
            const imageInputs = await this.processor(image);

            // Get vision embeddings
            const { image_embeds } = await this.visionModel(imageInputs);

            // Convert to array and return
            const embedding = Array.from(image_embeds.data);

            // Normalize the embedding (L2 normalization)
            const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
            const normalized = embedding.map(val => val / norm);

            return normalized;
        } catch (error) {
            console.error(`⚠️ AI Classification failed for ${imageUrl}: ${error.message}`);
            return null;
        }
    }
}
