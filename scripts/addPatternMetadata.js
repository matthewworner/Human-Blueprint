/**
 * Add metadata for remaining images based on ID patterns
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.resolve(__dirname, '../public');
const imagesPath = path.join(publicDir, 'images.json');

// Patterns and defaults based on ID prefixes
const idPatterns = {
    // Prehistoric sites
    'chauvet': { title: 'Chauvet Cave Art', artist: 'Unknown (Paleolithic)', date: 'ca. 37,000 BCE', era: -37000, culture: 'Franco-Spanish', department: 'Prehistoric Art' },
    'lascaux': { title: 'Lascaux Cave Art', artist: 'Unknown (Paleolithic)', date: 'ca. 17,000 BCE', era: -17000, culture: 'French', department: 'Prehistoric Art' },
    'altamira': { title: 'Altamira Cave Art', artist: 'Unknown (Paleolithic)', date: 'ca. 15,000 BCE', era: -15000, culture: 'Cantabrian', department: 'Prehistoric Art' },
    'pech_merle': { title: 'Pech-Merle Cave Art', artist: 'Unknown (Paleolithic)', date: 'ca. 25,000 BCE', era: -25000, culture: 'French', department: 'Prehistoric Art' },
    'cosquer': { title: 'Cosquer Cave Art', artist: 'Unknown (Paleolithic)', date: 'ca. 27,000 BCE', era: -27000, culture: 'French', department: 'Prehistoric Art' },
    'gargas': { title: 'Gargas Cave Handprints', artist: 'Unknown (Paleolithic)', date: 'ca. 25,000 BCE', era: -25000, culture: 'French', department: 'Prehistoric Art' },
    'cueva': { title: 'Cueva de las Manos', artist: 'Unknown (Prehistoric)', date: 'ca. 9,000 BCE', era: -9000, culture: 'Patagonian', department: 'Prehistoric Art' },
    'el_castillo': { title: 'El Castillo Cave Art', artist: 'Unknown (Paleolithic)', date: 'ca. 40,000 BCE', era: -40000, culture: 'Cantabrian', department: 'Prehistoric Art' },
    
    // African rock art
    'tassili': { title: 'Tassili n Ajjer Rock Art', artist: 'Unknown (Neolithic)', date: 'ca. 6,000 BCE', era: -6000, culture: 'Saharan', department: 'Prehistoric Art' },
    'drakensberg': { title: 'Drakensberg Rock Art', artist: 'Unknown (San)', date: 'ca. 3,000 BCE', era: -3000, culture: 'Southern African', department: 'Indigenous Art' },
    'laas_geel': { title: 'Laas Geel Cave Art', artist: 'Unknown (Neolithic)', date: 'ca. 9,000 BCE', era: -9000, culture: 'Somali', department: 'Prehistoric Art' },
    
    // Australian
    'ubirr': { title: 'Ubirr Rock Art', artist: 'Unknown (Aboriginal Australian)', date: 'ca. 20,000 BCE', era: -20000, culture: 'Australian Aboriginal', department: 'Indigenous Art' },
    'kakadu': { title: 'Kakadu Rock Art', artist: 'Unknown (Aboriginal Australian)', date: 'ca. 20,000 BCE', era: -20000, culture: 'Australian Aboriginal', department: 'Indigenous Art' },
    'kimberley': { title: 'Kimberley Rock Art', artist: 'Unknown (Aboriginal Australian)', date: 'ca. 4,000 BCE', era: -4000, culture: 'Australian Aboriginal', department: 'Indigenous Art' },
    'narrogin': { title: 'Narrogin Petroglyphs', artist: 'Unknown (Aboriginal Australian)', date: 'ca. 5,000 BCE', era: -5000, culture: 'Australian Aboriginal', department: 'Indigenous Art' },
    
    // Asian
    'bhimbetka': { title: 'Bhimbetka Rock Shelters', artist: 'Unknown (Prehistoric)', date: 'ca. 30,000 BCE', era: -30000, culture: 'Indian', department: 'Prehistoric Art' },
    'akam': { title: 'Akam Rock Art', artist: 'Unknown', date: 'ca. 5,000 BCE', era: -5000, culture: 'Japanese', department: 'Prehistoric Art' },
    'japanese': { title: 'Japanese Prehistoric Art', artist: 'Unknown (Jōmon)', date: 'ca. 3,000 BCE', era: -3000, culture: 'Japanese', department: 'Prehistoric Art' },
    
    // European prehistoric
    'newgrange': { title: 'Newgrange Spiral', artist: 'Unknown (Neolithic)', date: 'ca. 3,200 BCE', era: -3200, culture: 'Irish', department: 'Ancient Art' },
    'sego_canyon': { title: 'Sego Canyon Rock Art', artist: 'Unknown (Prehistoric)', date: 'ca. 7,000 BCE', era: -7000, culture: 'North American', department: 'Indigenous Art' },
    'rocky_road': { title: 'Rock Art', artist: 'Unknown', date: 'ca. 10,000 BCE', era: -10000, culture: 'Unknown', department: 'Prehistoric Art' },
    
    // South American
    'serra_capivara': { title: 'Serra da Capivara Rock Art', artist: 'Unknown (Prehistoric)', date: 'ca. 12,000 BCE', era: -12000, culture: 'Brazilian', department: 'Prehistoric Art' },
    'nazca': { title: 'Nazca Geoglyph', artist: 'Unknown (Nazca)', date: 'ca. 500 CE', era: 500, culture: 'Peruvian', department: 'Ancient Art' },
    
    // North American
    'petroglyph': { title: 'Petroglyph', artist: 'Unknown', date: 'ca. 3,000 BCE', era: -3000, culture: 'Unknown', department: 'Indigenous Art' },
    'pictograph': { title: 'Pictograph', artist: 'Unknown', date: 'ca. 5,000 BCE', era: -5000, culture: 'Unknown', department: 'Indigenous Art' },
    'chumash': { title: 'Chumash Rock Art', artist: 'Unknown (Chumash)', date: 'ca. 1,000 BCE', era: -1000, culture: 'California Native', department: 'Indigenous Art' },
    'tainter': { title: 'Tainter Cave Petroglyphs', artist: 'Unknown (Prehistoric)', date: 'ca. 1,000 BCE', era: -1000, culture: 'North American', department: 'Indigenous Art' },
    'maori': { title: 'Māori Rock Art', artist: 'Unknown (Māori)', date: 'ca. 500 BCE', era: -500, culture: 'New Zealand Māori', department: 'Indigenous Art' },
    
    // Middle Eastern
    'petra': { title: 'Petra Carving', artist: 'Unknown (Nabataean)', date: 'ca. 100 BCE', era: -100, culture: 'Nabataean', department: 'Ancient Art' },
    'egyptian': { title: 'Egyptian Art', artist: 'Unknown (Ancient Egyptian)', date: 'ca. 2,500 BCE', era: -2500, culture: 'Egyptian', department: 'Ancient Art' },
    'levant': { title: 'Levant Rock Art', artist: 'Unknown', date: 'ca. 8,000 BCE', era: -8000, culture: 'Levantine', department: 'Prehistoric Art' },
    
    // Street/Modern
    'street_art': { title: 'Street Art', artist: 'Unknown', date: '2010s', era: 2015, culture: 'Various', department: 'Street Art' },
    'graffiti': { title: 'Graffiti Art', artist: 'Unknown', date: '2010s', era: 2015, culture: 'Various', department: 'Street Art' },
    'banksy': { title: 'Banksy Street Art', artist: 'Banksy', date: '2000s', era: 2010, culture: 'British', department: 'Street Art' },
    'basquiat': { title: 'Jean-Michel Basquiat', artist: 'Jean-Michel Basquiat', date: '1980s', era: 1985, culture: 'American', department: 'Contemporary Art' },
    'protest': { title: 'Protest Art', artist: 'Unknown', date: '2020s', era: 2020, culture: 'Various', department: 'Street Art' },
    'blm': { title: 'BLM Protest Art', artist: 'Unknown', date: '2020', era: 2020, culture: 'American', department: 'Street Art' },
    'ukraine': { title: 'Ukraine War Art', artist: 'Unknown', date: '2022', era: 2022, culture: 'Ukrainian', department: 'Street Art' },
    'maya': { title: 'Maya Cave Art', artist: 'Unknown (Maya)', date: 'ca. 700 CE', era: 700, culture: 'Mesoamerican', department: 'Ancient Art' },
    'buddhist': { title: 'Buddhist Art', artist: 'Unknown', date: 'ca. 1,000 CE', era: 1000, culture: 'Buddhist', department: 'Religious Art' },
    'celtic': { title: 'Celtic Art', artist: 'Unknown (Celtic)', date: 'ca. 800 BCE', era: -800, culture: 'Celtic', department: 'Ancient Art' },
    'aboriginal': { title: 'Aboriginal Art', artist: 'Unknown (Aboriginal Australian)', date: 'ca. 1,000 CE', era: 1000, culture: 'Australian Aboriginal', department: 'Indigenous Art' },
    
    // Handprint variations
    'hand_': { title: 'Handprint Art', artist: 'Unknown', date: 'ca. 10,000 BCE', era: -10000, culture: 'Unknown', department: 'Prehistoric Art' },
    'handprint': { title: 'Handprint Art', artist: 'Unknown', date: 'ca. 10,000 BCE', era: -10000, culture: 'Unknown', department: 'Prehistoric Art' },
    'handprint_001': { title: 'Handprint', artist: 'Unknown', date: 'ca. 10,000 BCE', era: -10000, culture: 'Unknown', department: 'Prehistoric Art' },
    
    // Spiral variations  
    'spiral_': { title: 'Spiral Art', artist: 'Unknown', date: 'ca. 5,000 BCE', era: -5000, culture: 'Unknown', department: 'Prehistoric Art' },
    
    // Eye variations
    'eye_': { title: 'Eye Symbol', artist: 'Unknown', date: 'ca. 5,000 BCE', era: -5000, culture: 'Unknown', department: 'Prehistoric Art' },
    
    // African
    'african': { title: 'African Rock Art', artist: 'Unknown', date: 'ca. 6,000 BCE', era: -6000, culture: 'African', department: 'Prehistoric Art' },
    'indian': { title: 'Indian Rock Art', artist: 'Unknown', date: 'ca. 10,000 BCE', era: -10000, culture: 'Indian', department: 'Prehistoric Art' },
    
    // Default for anything else
    '_': { title: 'Rock Art', artist: 'Unknown', date: 'ca. 10,000 BCE', era: -10000, culture: 'Unknown', department: 'Prehistoric Art' }
};

async function addMetadata() {
    console.log('📖 Loading images...');
    
    const data = JSON.parse(fs.readFileSync(imagesPath, 'utf8'));
    console.log(`📊 Total images: ${data.length}`);
    
    let updated = 0;
    let alreadyHad = 0;
    
    data.forEach(img => {
        // Skip if already has good metadata
        if (img.metadata && img.metadata.title && img.metadata.title !== 'Untitled' && img.metadata.title !== 'Painting' && img.metadata.title !== 'Drawing') {
            alreadyHad++;
            return;
        }
        
        const id = img.id.toLowerCase();
        
        // Find matching pattern
        for (const [pattern, meta] of Object.entries(idPatterns)) {
            if (id.includes(pattern)) {
                // Add metadata if not present, or improve if generic
                const needsUpdate = !img.metadata || 
                    !img.metadata.title || 
                    img.metadata.title === 'Untitled' ||
                    img.metadata.title === 'Painting' ||
                    img.metadata.title === 'Drawing';
                
                if (needsUpdate) {
                    img.metadata = {
                        title: meta.title,
                        artist: meta.artist,
                        date: meta.date,
                        culture: meta.culture,
                        department: meta.department
                    };
                    if (meta.era !== undefined) {
                        img.era = meta.era;
                    }
                    updated++;
                }
                return;
            }
        }
    });
    
    console.log(`✅ Already had good metadata: ${alreadyHad}`);
    console.log(`✅ Updated ${updated} images`);
    
    fs.writeFileSync(imagesPath, JSON.stringify(data, null, 2));
    console.log(`💾 Saved to images.json`);
    
    // Final stats
    const withMeta = data.filter(i => i.metadata && i.metadata.title && i.metadata.title !== 'Untitled').length;
    console.log(`📊 Now with metadata: ${withMeta}/${data.length} (${Math.round(withMeta/data.length*100)}%)`);
}

addMetadata().catch(console.error);