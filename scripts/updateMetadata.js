/**
 * Retroactive Metadata Updater
 * 
 * Fetches and adds metadata to existing images that don't have it.
 * Uses Met Museum API to look up each image by ID.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.resolve(__dirname, '../public');
const imagesPath = path.join(publicDir, 'images.json');

// Rate limiting
const RATE_LIMIT_MS = 200;
let lastRequest = 0;

async function rateLimitedFetch(url) {
    const now = Date.now();
    if (now - lastRequest < RATE_LIMIT_MS) {
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS - (now - lastRequest)));
    }
    lastRequest = Date.now();
    
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
    });
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    
    return response.json();
}

async function updateMetadata() {
    console.log('📖 Loading existing images...');
    
    const data = JSON.parse(fs.readFileSync(imagesPath, 'utf8'));
    console.log(`📊 Total images: ${data.length}`);
    
    // Find images missing metadata
    const needsUpdate = data.filter(img => {
        const hasMeta = img.metadata && img.metadata.title && img.metadata.title !== 'Untitled';
        const isMet = img.id && img.id.includes('met_');
        return !hasMeta && isMet;
    });
    
    console.log(`🔍 Images needing metadata: ${needsUpdate.length}`);
    
    if (needsUpdate.length === 0) {
        console.log('✅ All images already have metadata!');
        return;
    }
    
    // Limit for this run to avoid timeout
    const limit = Math.min(needsUpdate.length, 100);
    console.log(`📝 Updating first ${limit} images...`);
    
    let updated = 0;
    let failed = 0;
    
    for (let i = 0; i < limit; i++) {
        const img = needsUpdate[i];
        
        // Extract object ID from met_12345 format
        const match = img.id.match(/met_(\d+)/);
        if (!match) {
            failed++;
            continue;
        }
        
        const objectId = match[1];
        
        try {
            console.log(`  [${i + 1}/${limit}] Fetching ${img.id}...`);
            
            const meta = await rateLimitedFetch(
                `https://collectionapi.metmuseum.org/public/collection/v1/objects/${objectId}`
            );
            
            if (meta && meta.title && meta.title !== 'Untitled') {
                // Update the image's metadata
                img.metadata = {
                    ...img.metadata,
                    title: meta.title,
                    artist: meta.artistDisplayName || 'Unknown',
                    date: meta.objectDate || '',
                    culture: meta.culture || '',
                    medium: meta.medium || '',
                    department: meta.department || ''
                };
                
                // Also update URL if it's different
                if (meta.primaryImage && img.url !== meta.primaryImage) {
                    img.url = meta.primaryImage;
                }
                
                updated++;
            } else {
                failed++;
            }
            
        } catch (error) {
            console.log(`    ❌ ${error.message}`);
            failed++;
        }
    }
    
    console.log(`\n✅ Updated ${updated} images, failed ${failed}`);
    
    // Save back to file
    fs.writeFileSync(imagesPath, JSON.stringify(data, null, 2));
    console.log(`💾 Saved to images.json`);
    
    // Report new stats
    const withMeta = data.filter(i => i.metadata && i.metadata.title && i.metadata.title !== 'Untitled').length;
    console.log(`📊 Now with metadata: ${withMeta}/${data.length} (${Math.round(withMeta/data.length*100)}%)`);
}

updateMetadata().catch(console.error);