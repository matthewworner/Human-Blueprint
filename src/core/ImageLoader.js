import * as THREE from 'three';
import { TextureManager } from './TextureManager.js';
import { JSONPositionStrategy, BasePositionStrategy } from './PositionStrategy.js';

/**
 * ImageLoader - Load images from JSON with async error handling
 * Features:
 * - Async image loading with error handling
 * - Position images based on JSON coordinates or strategy
 * - Handle loading states
 * - Efficient texture management
 * - Click/gaze detection ready
 */
export class ImageLoader {
    constructor(options = {}) {
        this.textureManager = new TextureManager();
        this.positionStrategy = options.positionStrategy || new JSONPositionStrategy();
        this.loadedImages = [];
        this.imageObjects = []; // Three.js mesh objects
        
        // Loading state
        this.loadingState = {
            total: 0,
            loaded: 0,
            failed: 0,
            inProgress: false
        };
        
        // Callbacks
        this.onProgress = null;
        this.onComplete = null;
        this.onError = null;
    }
    
    /**
     * Set position strategy (allows swapping logic)
     * @param {BasePositionStrategy} strategy - Position strategy instance
     */
    setPositionStrategy(strategy) {
        if (!(strategy instanceof BasePositionStrategy)) {
            throw new Error('Position strategy must extend BasePositionStrategy');
        }
        this.positionStrategy = strategy;
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
    
    /**
     * Load images from JSON file
     * @param {string} jsonPath - Path to JSON file
     * @returns {Promise<Array>} Array of loaded image data with textures
     */
    async loadFromJSON(jsonPath) {
        try {
            this.loadingState.inProgress = true;
            this.loadingState.loaded = 0;
            this.loadingState.failed = 0;
            
            // Fetch JSON file
            const response = await fetch(jsonPath);
            if (!response.ok) {
                throw new Error(`Failed to load JSON: ${response.statusText}`);
            }
            
            const jsonData = await response.json();
            this.loadingState.total = jsonData.length;
            
            // Load all images in parallel with error handling
            const loadPromises = jsonData.map((imageData, index) => 
                this.loadSingleImage(imageData, index, jsonData)
            );
            
            const results = await Promise.allSettled(loadPromises);
            
            // Process results
            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    this.loadedImages.push(result.value);
                    this.loadingState.loaded++;
                } else {
                    console.error(`Failed to load image ${jsonData[index].id}:`, result.reason);
                    this.loadingState.failed++;
                    
                    // Create placeholder for failed images
                    const placeholder = this.createPlaceholderImageData(jsonData[index], index, jsonData);
                    this.loadedImages.push(placeholder);
                    this.loadingState.loaded++;
                }
                
                // Report progress
                if (this.onProgress) {
                    this.onProgress({
                        loaded: this.loadingState.loaded,
                        total: this.loadingState.total,
                        failed: this.loadingState.failed,
                        percentage: Math.round((this.loadingState.loaded / this.loadingState.total) * 100)
                    });
                }
            });
            
            this.loadingState.inProgress = false;
            
            if (this.onComplete) {
                this.onComplete(this.loadedImages);
            }
            
            return this.loadedImages;
        } catch (error) {
            this.loadingState.inProgress = false;
            console.error('Error loading images from JSON:', error);
            
            if (this.onError) {
                this.onError(error);
            }
            
            throw error;
        }
    }
    
    /**
     * Load a single image with error handling
     * @param {Object} imageData - Image data from JSON
     * @param {number} index - Index in array
     * @param {Array} allImages - All image data
     * @returns {Promise<Object>} Loaded image data with texture
     */
    async loadSingleImage(imageData, index, allImages) {
        try {
            // Get position from strategy
            const position = this.positionStrategy.getPosition(imageData, index, allImages);
            
            // Load texture
            let texture;
            if (imageData.url) {
                try {
                    texture = await this.textureManager.loadTexture(imageData.url);
                } catch (error) {
                    console.warn(`Failed to load texture for ${imageData.id}, using placeholder:`, error);
                    texture = this.createPlaceholderTexture(imageData);
                }
            } else {
                texture = this.createPlaceholderTexture(imageData);
            }
            
            // Return enriched image data
            return {
                id: imageData.id,
                url: imageData.url || null,
                texture: texture,
                position: position,
                era: imageData.era || 0,
                region: imageData.region || 'Unknown',
                colors: imageData.colors || [],
                type: imageData.type || 'unknown',
                // Additional metadata
                metadata: {
                    ...imageData,
                    loaded: true,
                    loadIndex: index
                }
            };
        } catch (error) {
            console.error(`Error loading image ${imageData.id}:`, error);
            throw error;
        }
    }
    
    /**
     * Create placeholder image data for failed loads
     * @param {Object} originalData - Original image data
     * @param {number} index - Index in array
     * @param {Array} allImages - All image data
     * @returns {Object} Placeholder image data
     */
    createPlaceholderImageData(originalData, index, allImages) {
        const position = this.positionStrategy.getPosition(originalData, index, allImages);
        const texture = this.createPlaceholderTexture(originalData);
        
        return {
            id: originalData.id || `placeholder-${index}`,
            url: null,
            texture: texture,
            position: position,
            era: originalData.era || 0,
            region: originalData.region || 'Unknown',
            colors: originalData.colors || [],
            type: originalData.type || 'unknown',
            metadata: {
                ...originalData,
                loaded: false,
                isPlaceholder: true,
                loadIndex: index
            }
        };
    }
    
    /**
     * Create placeholder texture for an image
     * @param {Object} imageData - Image data
     * @returns {THREE.Texture} Placeholder texture
     */
    createPlaceholderTexture(imageData) {
        // Create a simple colored texture as placeholder
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // Use image ID for consistent color, or random
        let hue = 0;
        if (imageData?.id) {
            // Generate consistent color from ID
            let hash = 0;
            for (let i = 0; i < imageData.id.length; i++) {
                hash = imageData.id.charCodeAt(i) + ((hash << 5) - hash);
            }
            hue = Math.abs(hash) % 360;
        } else {
            hue = Math.random() * 360;
        }
        
        ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
        ctx.fillRect(0, 0, 512, 512);
        
        // Add some pattern
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        for (let i = 0; i < 20; i++) {
            ctx.fillRect(
                Math.random() * 512,
                Math.random() * 512,
                Math.random() * 100,
                Math.random() * 100
            );
        }
        
        // Add text if imageData has info
        if (imageData?.id) {
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.font = '24px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(imageData.id.substring(0, 20), 256, 256);
        }
        
        const texture = new THREE.Texture(canvas);
        texture.flipY = false;
        texture.needsUpdate = true;
        return texture;
    }
    
    /**
     * Get loading state
     * @returns {Object} Current loading state
     */
    getLoadingState() {
        return { ...this.loadingState };
    }
    
    /**
     * Dispose of all loaded textures
     */
    dispose() {
        this.textureManager.disposeAll();
        this.loadedImages = [];
        this.imageObjects = [];
    }
    
    /**
     * Get texture manager stats
     * @returns {Object} Texture manager statistics
     */
    getTextureStats() {
        return this.textureManager.getStats();
    }
    
    // Legacy methods for backward compatibility
    async loadImageFromURL(url) {
        try {
            const texture = await this.textureManager.loadTexture(url);
            return {
                url: url,
                texture: texture,
                loaded: true
            };
        } catch (error) {
            return {
                url: url,
                texture: null,
                loaded: false,
                error: error
            };
        }
    }
}

