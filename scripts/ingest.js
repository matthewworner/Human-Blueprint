/**
 * Ingestion CLI Entry Point
 * 
 * Usage: npm run ingest
 * 
 * Responsibilities:
 * 1. Orchestrate scraping (via ScrapingPipeline.js)
 * 2. Run Classification (via CLI-compatible Classifier) - TO DO
 * 3. Generate static JSON structure for Frontend
 */

import { ScrapingPipeline } from './ScrapingPipeline.js';
import { CLIImageClassifier } from './CLIImageClassifier.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define JsonFileStorage to replace MongoDB
class JsonFileStorage {
    constructor(filePath) {
        this.filePath = filePath;
        this.data = [];
    }

    async connect() {
        console.log(`📂 Connected to JSON storage: ${this.filePath}`);
        try {
            if (fs.existsSync(this.filePath)) {
                const content = fs.readFileSync(this.filePath, 'utf8');
                this.data = JSON.parse(content);
            }
        } catch (error) {
            console.warn("Could not read existing file, starting fresh.");
            this.data = [];
        }
    }

    async save(items) {
        let upsertCount = 0;
        let updateCount = 0;

        items.forEach(newItem => {
            const index = this.data.findIndex(existing => existing.id === newItem.id);
            if (index >= 0) {
                this.data[index] = { ...this.data[index], ...newItem, updatedAt: new Date().toISOString() };
                updateCount++;
            } else {
                this.data.push({ ...newItem, createdAt: new Date().toISOString() });
                upsertCount++;
            }
        });

        // Write to file
        fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
        console.log(`💾 Saved ${upsertCount} new, updated ${updateCount} items to ${path.basename(this.filePath)}`);

        return { upsertedCount: upsertCount, modifiedCount: updateCount };
    }

    async getAll() {
        return this.data;
    }

    async getCount() {
        return this.data.length;
    }

    async close() {
        console.log("📂 Storage connection closed.");
    }
}

async function run() {
    console.log("🏗️  Starting Ingestion Pipeline...");

    // Initialize AI
    const classifier = new CLIImageClassifier();
    try {
        await classifier.init();
    } catch (e) {
        console.error("⚠️ Failed to initialize AI. Continuing without embeddings.", e);
    }

    const publicDir = path.resolve(__dirname, '../public');
    const imagesPath = path.join(publicDir, 'images.json');

    // Create custom storage adapter
    const storage = new JsonFileStorage(imagesPath);

    const pipeline = new ScrapingPipeline({
        storage: storage,
        classifier: classifier,
        // Disable scheduler for CLI run
        schedule: { interval: 0 }
    });

    try {
        await pipeline.initialize();
        const count = await pipeline.runIngestionCycle();
        console.log(`✅ Ingestion complete. Total processed in this run: ${count}`);

        // Final reporting
        const total = await storage.getCount();
        console.log(`📊 Total dataset size: ${total} images`);

    } catch (error) {
        console.error("❌ Ingestion failed:", error);
        process.exit(1);
    } finally {
        await pipeline.close();
        process.exit(0);
    }
}

run();
