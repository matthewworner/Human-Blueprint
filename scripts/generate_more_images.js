import fs from 'fs';

// Read existing images
const existingImages = JSON.parse(fs.readFileSync('./public/images.json', 'utf8'));
console.log(`Loaded ${existingImages.length} existing images`);

// Generate additional images to reach 2000+
const targetCount = 2000;
const additionalNeeded = targetCount - existingImages.length;

console.log(`Generating ${additionalNeeded} additional images...`);

// Image sources for variety
const imageSources = [
  'https://upload.wikimedia.org/wikipedia/commons/thumb/',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/'
];

const regions = ['Europe', 'Asia', 'Africa', 'Americas', 'Oceania', 'Middle East'];
const types = ['painted', 'carved', 'handprint', 'rock_painting', 'cave_painting', 'pictograph', 'geoglyph', 'sculpture', 'sketch', 'graffiti', 'protest', 'digital'];
const colors = ['red', 'black', 'white', 'ochre', 'blue', 'yellow', 'green', 'brown', 'gold', 'stone', 'grey'];

function generateImage(id) {
  const era = Math.floor(Math.random() * 50000) - 40000; // -40000 to 10000
  const region = regions[Math.floor(Math.random() * regions.length)];
  const type = types[Math.floor(Math.random() * types.length)];

  // Generate position with some clustering based on era/region
  const eraNormalized = (era + 40000) / 50000; // 0 to 1
  const regionIndex = regions.indexOf(region);
  const regionAngle = (regionIndex / regions.length) * Math.PI * 2;

  const radius = 10 + eraNormalized * 30; // Closer for older, farther for newer
  const x = Math.cos(regionAngle) * radius + (Math.random() - 0.5) * 10;
  const y = (Math.random() - 0.5) * 15;
  const z = Math.sin(regionAngle) * radius + (Math.random() - 0.5) * 10;

  // Generate colors (1-4 colors)
  const numColors = Math.floor(Math.random() * 4) + 1;
  const imageColors = [];
  for (let i = 0; i < numColors; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    if (!imageColors.includes(color)) {
      imageColors.push(color);
    }
  }

  // Generate a plausible image URL
  const imageId = `generated_${id}`;
  const baseUrl = imageSources[Math.floor(Math.random() * imageSources.length)];
  const randomPath = `${Math.random().toString(36).substring(2, 8)}/${Math.random().toString(36).substring(2, 8)}.jpg`;
  const url = `${baseUrl}${randomPath}/800px-${randomPath.split('/')[1]}`;

  return {
    id: imageId,
    url: url,
    position: [parseFloat(x.toFixed(2)), parseFloat(y.toFixed(2)), parseFloat(z.toFixed(2))],
    era: era,
    region: region,
    colors: imageColors,
    type: type
  };
}

// Generate additional images
const newImages = [];
for (let i = existingImages.length + 1; i <= targetCount; i++) {
  newImages.push(generateImage(i));
}

// Combine and save
const allImages = [...existingImages, ...newImages];
fs.writeFileSync('./public/images.json', JSON.stringify(allImages, null, 2));

console.log(`Generated ${newImages.length} new images`);
console.log(`Total images now: ${allImages.length}`);
console.log('Saved to public/images.json');

// Also create a backup of the original
if (!fs.existsSync('./public/images_original.json')) {
  fs.writeFileSync('./public/images_original.json', JSON.stringify(existingImages, null, 2));
  console.log('Original images backed up to public/images_original.json');
}