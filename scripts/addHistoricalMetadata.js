/**
 * Add metadata for prehistoric, indigenous, and historical art sites
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.resolve(__dirname, '../public');
const imagesPath = path.join(publicDir, 'images.json');

// Comprehensive art site metadata
const artSiteMetadata = {
    // Prehistoric / Cave Art
    'chauvet_handprints_001': { title: 'Chauvet Cave Handprints', artist: 'Unknown (Paleolithic)', date: 'ca. 37,000 BCE', culture: 'Franco-Spanish', medium: 'Red ochre on limestone', department: 'Prehistoric Art', era: -37000 },
    'cueva_manos_001': { title: 'Cueva de las Manos', artist: 'Unknown (Prehistoric)', date: 'ca. 9,000 BCE', culture: 'Patagonian', medium: 'Natural pigments', department: 'Prehistoric Art', era: -9000 },
    'lascaux_bull_001': { title: 'Lascaux Hall of Bulls', artist: 'Unknown (Paleolithic)', date: 'ca. 17,000 BCE', culture: 'French', medium: 'Charcoal and ochre', department: 'Prehistoric Art', era: -17000 },
    'altamira_bison_001': { title: 'Altamira Cave Bison', artist: 'Unknown (Paleolithic)', date: 'ca. 15,000 BCE', culture: 'Cantabrian', medium: 'Charcoal on ceiling', department: 'Prehistoric Art', era: -15000 },
    'pech_merle_horses_001': { title: 'Pech-Merle Spotted Horses', artist: 'Unknown (Paleolithic)', date: 'ca. 25,000 BCE', culture: 'French', medium: 'Natural pigments', department: 'Prehistoric Art', era: -25000 },
    'el_castillo_hand_001': { title: 'El Castillo Hand Stencils', artist: 'Unknown (Paleolithic)', date: 'ca. 40,000 BCE', culture: 'Cantabrian', medium: 'Red ochre stencil', department: 'Prehistoric Art', era: -40000 },
    'ubirr_rock_001': { title: 'Ubirr Rock Art', artist: 'Unknown (Aboriginal Australian)', date: 'ca. 20,000 BCE', culture: 'Australian Aboriginal', medium: 'Ochre on sandstone', department: 'Indigenous Art', era: -20000 },
    'bhimbetka_001': { title: 'Bhimbetka Rock Shelters', artist: 'Unknown (Prehistoric)', date: 'ca. 30,000 BCE', culture: 'Indian', medium: 'Red ochre on sandstone', department: 'Prehistoric Art', era: -30000 },
    'serra_capivara_hand_001': { title: 'Serra da Capivara Hand Prints', artist: 'Unknown (Prehistoric)', date: 'ca. 12,000 BCE', culture: 'Brazilian', medium: 'Natural pigments', department: 'Prehistoric Art', era: -12000 },
    'tassili_ajjer_001': { title: 'Tassili n Ajjer Cattle', artist: 'Unknown (Neolithic)', date: 'ca. 6,000 BCE', culture: 'Saharan', medium: 'Ochre on sandstone', department: 'Prehistoric Art', era: -6000 },
    'gargas_hand_001': { title: 'Gargas Cave Hands', artist: 'Unknown (Paleolithic)', date: 'ca. 25,000 BCE', culture: 'French', medium: 'Ochre and manganese', department: 'Prehistoric Art', era: -25000 },
    'tadrart_acacus_001': { title: 'Tadrart Acacus Rock Art', artist: 'Unknown (Neolithic)', date: 'ca. 12,000 BCE', culture: 'Saharan', medium: 'Ochre on sandstone', department: 'Prehistoric Art', era: -12000 },
    'drakensberg_001': { title: 'Drakensberg Rock Art', artist: 'Unknown (San)', date: 'ca. 3,000 BCE', culture: 'Southern African', medium: 'Ochre on sandstone', department: 'Indigenous Art', era: -3000 },
    'lubang_jeriji_001': { title: 'Lubang Jeriji Saléh', artist: 'Unknown (Prehistoric)', date: 'ca. 44,000 BCE', culture: 'Bornean', medium: 'Ochre on limestone', department: 'Prehistoric Art', era: -44000 },
    'laas_geel_001': { title: 'Laas Geel Cave Art', artist: 'Unknown (Neolithic)', date: 'ca. 9,000 BCE', culture: 'Somali', medium: 'Ochre on granite', department: 'Prehistoric Art', era: -9000 },
    'kakadu_hand_001': { title: 'Kakadu Rock Art', artist: 'Unknown (Aboriginal Australian)', date: 'ca. 20,000 BCE', culture: 'Australian Aboriginal', medium: 'Ochre on sandstone', department: 'Indigenous Art', era: -20000 },
    'sego_canyon_hand_001': { title: 'Sego Canyon Petroglyphs', artist: 'Unknown (Prehistoric)', date: 'ca. 7,000 BCE', culture: 'North American', medium: 'Pecked into sandstone', department: 'Indigenous Art', era: -7000 },
    'tainter_cave_001': { title: 'Tainter Cave Petroglyphs', artist: 'Unknown (Prehistoric)', date: 'ca. 1,000 BCE', culture: 'North American', medium: 'Carved into limestone', department: 'Indigenous Art', era: -1000 },
    'chumash_spiral_001': { title: 'Chumash Rock Art', artist: 'Unknown (Chumash)', date: 'ca. 1,000 BCE', culture: 'California Native', medium: 'Ochre on sandstone', department: 'Indigenous Art', era: -1000 },
    'maori_spiral_001': { title: 'Maori Rock Art', artist: 'Unknown (Māori)', date: 'ca. 500 BCE', culture: 'New Zealand Māori', medium: 'Ochre on basalt', department: 'Indigenous Art', era: -500 },
    'petroglyph_spiral_001': { title: 'Ancient Petroglyph Spiral', artist: 'Unknown', date: 'ca. 3,000 BCE', culture: 'Unknown', medium: 'Carved into rock', department: 'Prehistoric Art', era: -3000 },

    // Historical Art
    'newgrange_spiral_001': { title: 'Newgrange Spiral Stone', artist: 'Unknown (Neolithic)', date: 'ca. 3,200 BCE', culture: 'Irish', medium: 'Carved into granite', department: 'Ancient Art', era: -3200 },
    'petra_eye_001': { title: 'Petra Treasury Carving', artist: 'Unknown (Nabataean)', date: 'ca. 100 BCE', culture: 'Nabataean', medium: 'Carved into sandstone', department: 'Ancient Art', era: -100 },
    'egyptian_eye_001': { title: 'Egyptian Hieroglyph Eye', artist: 'Unknown (Ancient Egyptian)', date: 'ca. 2,500 BCE', culture: 'Egyptian', medium: 'Painted limestone', department: 'Ancient Art', era: -2500 },
    'maya_handprint_001': { title: 'Maya Cave Handprints', artist: 'Unknown (Maya)', date: 'ca. 700 CE', culture: 'Mesoamerican', medium: 'Ochre on cave wall', department: 'Ancient Art', era: 700 },
    'buddhist_mandala_001': { title: 'Buddhist Sand Mandala', artist: 'Unknown (Buddhist monk)', date: 'ca. 1,000 CE', culture: 'Tibetan', medium: 'Colored sand', department: 'Religious Art', era: 1000 },
    'celtic_spiral_001': { title: 'Celtic Spiral Stone', artist: 'Unknown (Celtic)', date: 'ca. 800 BCE', culture: 'Celtic', medium: 'Carved stone', department: 'Ancient Art', era: -800 },
    'aboriginal_dot_001': { title: 'Aboriginal Dot Painting', artist: 'Unknown (Aboriginal Australian)', date: 'ca. 1,000 CE', culture: 'Australian Aboriginal', medium: 'Ochre on bark', department: 'Indigenous Art', era: 1000 },
    'nazca_spiral_001': { title: 'Nazca Geoglyph Spiral', artist: 'Unknown (Nazca)', date: 'ca. 500 CE', culture: 'Peruvian', medium: 'Lines in desert soil', department: 'Ancient Art', era: 500 },

    // Modern/Street Art
    'banksy_hand_001': { title: 'Banksy Street Art', artist: 'Banksy', date: '2000s', culture: 'British', medium: 'Stencil and spray paint', department: 'Street Art', era: 2000 },
    'basquiat_hand_001': { title: 'Jean-Michel Basquiat', artist: 'Jean-Michel Basquiat', date: '1980s', culture: 'American', medium: 'Acrylic and oil stick', department: 'Contemporary Art', era: 1980 },
    'chalk_protest_hand_001': { title: 'Chalk Protest Art', artist: 'Unknown', date: '2020s', culture: 'Various', medium: 'Sidewalk chalk', department: 'Street Art', era: 2020 },
    'cairo_graffiti_eye_001': { title: 'Cairo Graffiti', artist: 'Unknown', date: '2010s', culture: 'Egyptian', medium: 'Spray paint', department: 'Street Art', era: 2010 },
    'hong_kong_hand_001': { title: 'Hong Kong Protest Art', artist: 'Unknown', date: '2019', culture: 'Hong Kong', medium: 'Various', department: 'Street Art', era: 2019 },
    'blm_handprint_001': { title: 'Black Lives Matter Handprint', artist: 'Unknown', date: '2020', culture: 'American', medium: 'Various', department: 'Street Art', era: 2020 },
    'ukraine_hand_001': { title: 'Ukraine War Art', artist: 'Unknown', date: '2022', culture: 'Ukrainian', medium: 'Various', department: 'Street Art', era: 2022 },
    'street_art_eye_001': { title: 'Street Art Eye', artist: 'Unknown', date: '2010s', culture: 'Various', medium: 'Spray paint', department: 'Street Art', era: 2015 },
    'japanese_handprint_001': { title: 'Japanese Rock Art', artist: 'Unknown (Jōmon)', date: 'ca. 3,000 BCE', culture: 'Japanese', medium: 'Ochre on rock', department: 'Prehistoric Art', era: -3000 },
    'indian_handprint_001': { title: 'Indian Cave Handprint', artist: 'Unknown', date: 'ca. 10,000 BCE', culture: 'Indian', medium: 'Ochre on cave wall', department: 'Prehistoric Art', era: -10000 },
    'african_handprint_001': { title: 'African Rock Art Handprint', artist: 'Unknown', date: 'ca. 6,000 BCE', culture: 'African', medium: 'Ochre on rock', department: 'Prehistoric Art', era: -6000 }
};

async function updateMetadata() {
    console.log('📖 Loading images...');
    
    const data = JSON.parse(fs.readFileSync(imagesPath, 'utf8'));
    console.log(`📊 Total images: ${data.length}`);
    
    let updated = 0;
    
    data.forEach(img => {
        const id = img.id;
        
        // Try exact match
        if (artSiteMetadata[id]) {
            const meta = artSiteMetadata[id];
            img.metadata = {
                title: meta.title,
                artist: meta.artist,
                date: meta.date,
                culture: meta.culture,
                medium: meta.medium,
                department: meta.department
            };
            if (meta.era !== undefined) {
                img.era = meta.era;
            }
            updated++;
            return;
        }
        
        // Try partial match
        const prefix = id.split('_')[0];
        for (const [key, meta] of Object.entries(artSiteMetadata)) {
            const keyPrefix = key.split('_')[0];
            if (prefix === keyPrefix || id.includes(key.split('_')[0])) {
                img.metadata = {
                    title: meta.title,
                    artist: meta.artist,
                    date: meta.date,
                    culture: meta.culture,
                    medium: meta.medium,
                    department: meta.department
                };
                if (meta.era !== undefined) {
                    img.era = meta.era;
                }
                updated++;
                return;
            }
        }
    });
    
    console.log(`✅ Updated ${updated} images with metadata`);
    
    fs.writeFileSync(imagesPath, JSON.stringify(data, null, 2));
    console.log(`💾 Saved to images.json`);
    
    // Final stats
    const withMeta = data.filter(i => i.metadata && i.metadata.title).length;
    console.log(`📊 Now with metadata: ${withMeta}/${data.length} (${Math.round(withMeta/data.length*100)}%)`);
}

updateMetadata().catch(console.error);