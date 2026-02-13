import { ScrapingPipeline } from './src/core/ScrapingPipeline.js';
import fs from 'fs';

async function main() {
  console.log('Starting image ingestion pipeline...');

  // Initialize pipeline with basic config
  const pipeline = new ScrapingPipeline({
    database: {
      uri: 'mongodb://localhost:27017',
      database: 'arthistory'
    },
    moderation: {
      aiThreshold: 0.8
    },
    schedule: {
      interval: 24 * 60 * 60 * 1000 // 24 hours
    }
  });

  try {
    await pipeline.initialize();

    // Run one ingestion cycle
    console.log('Running ingestion cycle...');
    const processedCount = await pipeline.runIngestionCycle();
    console.log(`Processed ${processedCount} new images`);

    // Get all images from database
    const collection = await pipeline.storage.connect();
    const allImages = await collection.find({}).toArray();

    console.log(`Total images in database: ${allImages.length}`);

    // Convert to the format expected by images.json
    const formattedImages = allImages.map(img => ({
      id: img.id,
      url: img.url,
      position: img.position,
      era: img.era,
      region: img.region,
      colors: img.colors || [],
      type: img.type,
      confidence: img.confidence || 0.8
    }));

    // Save to images.json
    fs.writeFileSync('./public/images.json', JSON.stringify(formattedImages, null, 2));
    console.log(`Saved ${formattedImages.length} images to public/images.json`);

    // Start scheduler for continuous ingestion
    console.log('Starting continuous ingestion scheduler...');
    pipeline.startScheduler();

    console.log('Ingestion pipeline running. Press Ctrl+C to stop.');

    // Keep running
    process.on('SIGINT', async () => {
      console.log('Stopping ingestion pipeline...');
      pipeline.stopScheduler();
      await pipeline.close();
      process.exit(0);
    });

  } catch (error) {
    console.error('Error in ingestion pipeline:', error);
    process.exit(1);
  }
}

main();