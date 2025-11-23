export class ImageLoader {
    constructor() {
        this.loadedImages = [];
    }
    
    async loadTestImages(count) {
        // Phase 0: Generate test image data
        // In production, this would load from URLs (museum APIs, scraped sources)
        
        const images = [];
        
        for (let i = 0; i < count; i++) {
            // Generate metadata for test images
            const imageData = {
                id: `test-${i}`,
                url: null, // Will use placeholder texture
                texture: null,
                
                // Metadata (simulated for Phase 0)
                temporal: this.generateRandomDate(),
                geographic: this.generateRandomLocation(),
                colorPalette: this.generateRandomColors(),
                markType: this.generateRandomMarkType(),
                scale: 'intimate',
                source: 'test',
                confidence: 0.8
            };
            
            images.push(imageData);
        }
        
        return images;
    }
    
    generateRandomDate() {
        // Generate dates spanning 50,000 years
        // Weighted toward more recent (more data available)
        const now = new Date().getTime();
        const yearsAgo = Math.pow(Math.random(), 2) * 50000; // Square for weighting
        const date = new Date(now - yearsAgo * 365.25 * 24 * 60 * 60 * 1000);
        
        return {
            year: date.getFullYear(),
            era: this.getEra(yearsAgo),
            yearsAgo: Math.floor(yearsAgo)
        };
    }
    
    getEra(yearsAgo) {
        if (yearsAgo > 10000) return 'prehistoric';
        if (yearsAgo > 3000) return 'ancient';
        if (yearsAgo > 1500) return 'medieval';
        if (yearsAgo > 500) return 'renaissance';
        if (yearsAgo > 100) return 'modern';
        return 'contemporary';
    }
    
    generateRandomLocation() {
        const regions = [
            { name: 'Europe', lat: 50, lon: 10 },
            { name: 'Asia', lat: 35, lon: 100 },
            { name: 'Africa', lat: 0, lon: 20 },
            { name: 'Americas', lat: 20, lon: -100 },
            { name: 'Oceania', lat: -25, lon: 135 },
            { name: 'Middle East', lat: 30, lon: 40 }
        ];
        
        const region = regions[Math.floor(Math.random() * regions.length)];
        
        return {
            region: region.name,
            lat: region.lat + (Math.random() - 0.5) * 20,
            lon: region.lon + (Math.random() - 0.5) * 40
        };
    }
    
    generateRandomColors() {
        // Generate 3-5 dominant colors
        const count = 3 + Math.floor(Math.random() * 3);
        const colors = [];
        
        for (let i = 0; i < count; i++) {
            colors.push({
                r: Math.random(),
                g: Math.random(),
                b: Math.random(),
                hex: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`
            });
        }
        
        return colors;
    }
    
    generateRandomMarkType() {
        const types = [
            'painted', 'carved', 'drawn', 'scratched',
            'arranged', 'digital', 'accidental'
        ];
        return types[Math.floor(Math.random() * types.length)];
    }
    
    async loadImageFromURL(url) {
        // Future: Load actual images from URLs
        // For now, returns placeholder data
        return {
            url: url,
            texture: null,
            loaded: false
        };
    }
}

