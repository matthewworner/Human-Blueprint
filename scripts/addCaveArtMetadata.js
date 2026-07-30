/**
 * Add metadata for known prehistoric/cave art sites
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.resolve(__dirname, '../public');
const imagesPath = path.join(publicDir, 'images.json');

// Known prehistoric art sites with metadata
const caveArtMetadata = {
    'chauvet_handprints_001': {
        title: 'Chauvet Cave Handprints',
        artist: 'Unknown (Prehistoric)',
        date: 'ca. 37,000 BCE',
        culture: 'Franco-Spanish',
        medium: 'Red ochre on limestone wall',
        department: 'Prehistoric Art'
    },
    'cueva_manos_001': {
        title: 'Cueva de las Manos',
        artist: 'Unknown (Prehistoric)',
        date: 'ca. 9,000 BCE',
        culture: 'Patagonian',
        medium: 'Natural pigments on cave wall',
        department: 'Prehistoric Art'
    },
    'lascaux_bull_001': {
        title: 'Lascaux Hall of Bulls',
        artist: 'Unknown (Prehistoric)',
        date: 'ca. 17,000 BCE',
        culture: 'French',
        medium: 'Charcoal and ochre on limestone',
        department: 'Prehistoric Art'
    },
    'altamira_bison_001': {
        title: 'Altamira Cave Bison',
        artist: 'Unknown (Prehistoric)',
        date: 'ca. 15,000 BCE',
        culture: 'Cantabrian',
        medium: 'Charcoal and ochre on ceiling',
        department: 'Prehistoric Art'
    },
    'pech_merle_horses_001': {
        title: 'Pech-Merle Spotted Horses',
        artist: 'Unknown (Prehistoric)',
        date: 'ca. 25,000 BCE',
        culture: 'French',
        medium: 'Natural pigments on cave wall',
        department: 'Prehistoric Art'
    },
    'el_castillo_hand_001': {
        title: 'El Castillo Hand Stencils',
        artist: 'Unknown (Prehistoric)',
        date: 'ca. 40,000 BCE',
        culture: 'Cantabrian',
        medium: 'Red ochre with hand stencil technique',
        department: 'Prehistoric Art'
    },
    'ubirr_rock_001': {
        title: 'Ubirr Rock Art',
        artist: 'Unknown (Indigenous Australian)',
        date: 'ca. 20,000 BCE',
        culture: 'Australian Aboriginal',
        medium: 'Ochre and charcoal on sandstone',
        department: 'Indigenous Art'
    },
    'bhimbetka_001': {
        title: 'Bhimbetka Rock Shelters',
        artist: 'Unknown (Prehistoric)',
        date: 'ca. 30,000 BCE',
        culture: 'Indian',
        medium: 'Red ochre on sandstone',
        department: 'Prehistoric Art'
    },
    'serra_capivara_hand_001': {
        title: 'Serra da Capivara Hand Prints',
        artist: 'Unknown (Prehistoric)',
        date: 'ca. 12,000 BCE',
        culture: 'Brazilian',
        medium: 'Natural pigments on rock shelter',
        department: 'Prehistoric Art'
    },
    'tassili_ajjer_001': {
        title: 'Tassili n Ajjer Cattle',
        artist: 'Unknown (Neolithic)',
        date: 'ca. 6,000 BCE',
        culture: 'Saharan',
        medium: 'Ochre on sandstone',
        department: 'Prehistoric Art'
    },
    'narrogin_001': {
        title: 'Narrogin Petroglyphs',
        artist: 'Unknown (Indigenous Australian)',
        date: 'ca. 5,000 BCE',
        culture: 'Australian Aboriginal',
        medium: 'Carved into granite',
        department: 'Indigenous Art'
    },
    'kimberley_wandjina_001': {
        title: 'Kimberley Wandjina',
        artist: 'Unknown (Indigenous Australian)',
        date: 'ca. 4,000 BCE',
        culture: 'Australian Aboriginal',
        medium: 'Ochre on sandstone',
        department: 'Indigenous Art'
    },
    'grotte_chauvet_001': {
        title: 'Grande Salle of Chauvet',
        artist: 'Unknown (Paleolithic)',
        date: 'ca. 37,000 BCE',
        culture: 'Franco-Spanish',
        medium: 'Charcoal and ochre painting',
        department: 'Prehistoric Art'
    },
    'cosquer_001': {
        title: 'Cosquer Cave Seals',
        artist: 'Unknown (Prehistoric)',
        date: 'ca. 27,000 BCE',
        culture: 'French',
        medium: 'Ochre and charcoal on limestone',
        department: 'Prehistoric Art'
    }
};

async function updateCaveArtMetadata() {
    console.log('📖 Loading images...');
    
    const data = JSON.parse(fs.readFileSync(imagesPath, 'utf8'));
    console.log(`📊 Total images: ${data.length}`);
    
    let updated = 0;
    
    // Update images with cave art metadata
    data.forEach(img => {
        const id = img.id;
        
        // Try exact match first
        if (caveArtMetadata[id]) {
            img.metadata = { ...caveArtMetadata[id] };
            img.era = extractEra(caveArtMetadata[id].date);
            updated++;
            return;
        }
        
        // Try partial match (strip numbers)
        const baseId = id.replace(/_\d+$/, '');
        for (const [key, meta] of Object.entries(caveArtMetadata)) {
            const baseKey = key.replace(/_\d+$/, '');
            if (id.includes(baseKey) || baseKey.includes(id.split('_')[0])) {
                img.metadata = { ...meta };
                img.era = extractEra(meta.date);
                updated++;
                return;
            }
        }
    });
    
    console.log(`✅ Updated ${updated} images with cave art metadata`);
    
    // Save
    fs.writeFileSync(imagesPath, JSON.stringify(data, null, 2));
    console.log(`💾 Saved to images.json`);
    
    // Final stats
    const withMeta = data.filter(i => i.metadata && i.metadata.title).length;
    console.log(`📊 Now with metadata: ${withMeta}/${data.length}`);
}

function extractEra(dateStr) {
    if (!dateStr) return 0;
    
    // Extract year from strings like "ca. 37,000 BCE"
    const match = dateStr.match(/(\d+)[\s,]*BCE/i);
    if (match) {
        return -parseInt(match[1].replace(',', ''));
    }
    
    // Handle CE dates
    const ceMatch = dateStr.match(/(\d+)[\s,]*BCE/i);
    if (ceMatch) {
        return -parseInt(ceMatch[1].replace(',', ''));
    }
    
    return 0;
}

updateCaveArtMetadata().catch(console.error);