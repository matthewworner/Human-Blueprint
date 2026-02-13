import * as THREE from 'three';

/**
 * TextureManager - Efficient texture loading and caching
 * Handles texture reuse, cleanup, and memory management
 */
export class TextureManager {
    constructor() {
        this.textureCache = new Map(); // URL -> Texture mapping
        this.loadingPromises = new Map(); // URL -> Promise mapping (prevents duplicate loads)
        this.loader = new THREE.TextureLoader();
        
        // Texture settings for image viewing
        this.defaultTextureSettings = {
            flipY: false, // Don't flip Y (images are already correct)
            generateMipmaps: true,
            minFilter: THREE.LinearMipmapLinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            colorSpace: THREE.SRGBColorSpace
        };
    }
    
    /**
     * Load texture from URL with caching
     * @param {string} url - Image URL
     * @returns {Promise<THREE.Texture>}
     */
    async loadTexture(url) {
        // Return cached texture if available
        if (this.textureCache.has(url)) {
            return this.textureCache.get(url);
        }
        
        // Return existing loading promise if already loading
        if (this.loadingPromises.has(url)) {
            return this.loadingPromises.get(url);
        }
        
        // Create new loading promise
        const promise = new Promise((resolve, reject) => {
            this.loader.load(
                url,
                (texture) => {
                    // Apply default settings
                    texture.flipY = true; // Fix upside-down images
                    texture.generateMipmaps = true;
                    texture.minFilter = THREE.LinearMipmapLinearFilter;
                    texture.magFilter = THREE.LinearFilter;
                    texture.colorSpace = THREE.SRGBColorSpace;
                    texture.needsUpdate = true;
                    
                    // Cache the texture
                    this.textureCache.set(url, texture);
                    this.loadingPromises.delete(url);
                    
                    console.log(`Texture loaded: ${url}`);
                    resolve(texture);
                },
                undefined, // Progress callback (optional)
                (error) => {
                    console.error(`Texture load failed: ${url}`, error);
                    this.loadingPromises.delete(url);
                    reject(error);
                }
            );
        });
        
        this.loadingPromises.set(url, promise);
        return promise;
    }
    
    /**
     * Get cached texture or null
     * @param {string} url - Image URL
     * @returns {THREE.Texture|null}
     */
    getCachedTexture(url) {
        return this.textureCache.get(url) || null;
    }
    
    /**
     * Dispose of a texture and remove from cache
     * @param {string} url - Image URL
     */
    disposeTexture(url) {
        const texture = this.textureCache.get(url);
        if (texture) {
            texture.dispose();
            this.textureCache.delete(url);
        }
    }
    
    /**
     * Dispose of all textures and clear cache
     */
    disposeAll() {
        this.textureCache.forEach((texture) => {
            texture.dispose();
        });
        this.textureCache.clear();
        this.loadingPromises.clear();
    }
    
    /**
     * Get cache statistics
     * @returns {Object} Cache stats
     */
    getStats() {
        return {
            cachedTextures: this.textureCache.size,
            loadingTextures: this.loadingPromises.size,
            totalMemory: this.estimateMemoryUsage()
        };
    }
    
    /**
     * Estimate memory usage (rough calculation)
     * @returns {number} Estimated memory in MB
     */
    estimateMemoryUsage() {
        let totalBytes = 0;
        this.textureCache.forEach((texture) => {
            if (texture.image) {
                const width = texture.image.width || 0;
                const height = texture.image.height || 0;
                totalBytes += width * height * 4; // RGBA = 4 bytes per pixel
            }
        });
        return Math.round((totalBytes / 1024 / 1024) * 100) / 100; // MB
    }
}

