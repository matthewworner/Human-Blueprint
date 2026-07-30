/**
 * TextureDisposalManager - Manages texture memory by unloading distant textures
 * Implements Level of Detail (LOD) for textures to prevent memory exhaustion
 */

import * as THREE from 'three';

export class TextureDisposalManager {
    constructor(scene, camera, maxTexturesInMemory = 50) {
        this.scene = scene;
        this.camera = camera;
        
        // Configuration
        this.maxTexturesInMemory = maxTexturesInMemory;
        this.unloadDistance = 50; // Distance beyond which textures are unloaded
        this.reloadDistance = 30; // Distance at which textures are reloaded
        
        // Tracking
        this.texturedObjects = new Map(); // object -> { texture, originalMaterial, lastSeen }
        this.unloadedObjects = new Set(); // Objects with unloaded textures
        
        // LOD texture placeholder (low-res or transparent)
        this.placeholderTexture = null;
        this.createPlaceholderTexture();
        
        // Update frequency (don't check every frame)
        this.updateCounter = 0;
        this.updateInterval = 30; // Check every 30 frames
    }
    
    /**
     * Create a simple placeholder texture
     */
    createPlaceholderTexture() {
        // Create a 1x1 transparent pixel texture as placeholder
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#333333';
        ctx.fillRect(0, 0, 1, 1);
        
        this.placeholderTexture = new THREE.CanvasTexture(canvas);
        this.placeholderTexture.needsUpdate = true;
    }
    
    /**
     * Register an image object for texture management
     * @param {THREE.Mesh} object - Image mesh with texture
     */
    registerObject(object) {
        if (!object || !object.material) return;
        
        const texture = object.material.map;
        if (!texture) return;
        
        this.texturedObjects.set(object, {
            texture: texture,
            originalMaterial: object.material.clone(),
            lastSeen: Date.now(),
            isLoaded: true
        });
    }
    
    /**
     * Register multiple objects
     * @param {Array} objects - Array of meshes
     */
    registerObjects(objects) {
        objects.forEach(obj => this.registerObject(obj));
    }
    
    /**
     * Update called each frame (throttled)
     */
    update() {
        this.updateCounter++;
        if (this.updateCounter < this.updateInterval) return;
        this.updateCounter = 0;
        
        const cameraPos = this.camera.position;
        
        // Check each textured object
        this.texturedObjects.forEach((data, object) => {
            if (!object || !object.parent) {
                this.unregisterObject(object);
                return;
            }
            
            const distance = cameraPos.distanceTo(object.position);
            
            if (distance > this.unloadDistance && data.isLoaded) {
                // Unload texture
                this.unloadTexture(object);
            } else if (distance < this.reloadDistance && !data.isLoaded) {
                // Reload texture
                this.reloadTexture(object);
            }
            
            if (data.isLoaded) {
                data.lastSeen = Date.now();
            }
        });
        
        // Force cleanup if over memory limit
        this.enforceMemoryLimit();
    }
    
    /**
     * Unload texture from object (swap with placeholder)
     */
    unloadTexture(object) {
        const data = this.texturedObjects.get(object);
        if (!data || !data.isLoaded) return;
        
        // Create a simple material with placeholder texture
        const placeholderMaterial = new THREE.MeshBasicMaterial({
            color: 0x333333,
            transparent: true,
            opacity: 0.3
        });
        
        object.material.dispose();
        object.material = placeholderMaterial;
        data.isLoaded = false;
        data.unloadTime = Date.now();
        
        this.unloadedObjects.add(object);
        
        // Also dispose original texture to free memory
        if (data.texture && data.texture !== this.placeholderTexture) {
            data.texture.dispose();
            data.texture = null;
        }
        
        // Clear geometry's texture reference
        object.geometry?.clearAttribute('uv');
    }
    
    /**
     * Reload texture to object
     */
    reloadTexture(object) {
        const data = this.texturedObjects.get(object);
        if (!data || data.isLoaded) return;
        
        // Recreate texture from source
        // Note: This requires the original image URL to be stored
        const imageData = object.userData?.imageData;
        if (!imageData || !imageData.url) {
            console.warn('Cannot reload texture: no URL stored');
            return;
        }
        
        const loader = new THREE.TextureLoader();
        loader.load(imageData.url, (newTexture) => {
            if (!newTexture) return;
            
            newTexture.flipY = true;
            newTexture.generateMipmaps = true;
            newTexture.minFilter = THREE.LinearMipmapLinearFilter;
            newTexture.magFilter = THREE.LinearFilter;
            newTexture.colorSpace = THREE.SRGBColorSpace;
            newTexture.needsUpdate = true;
            
            // Restore original material with new texture
            const newMaterial = new THREE.MeshBasicMaterial({
                map: newTexture,
                transparent: true
            });
            
            // Copy over emissive if it existed
            if (data.originalMaterial?.emissive) {
                newMaterial.emissive = data.originalMaterial.emissive.clone();
            }
            
            object.material.dispose();
            object.material = newMaterial;
            
            data.texture = newTexture;
            data.isLoaded = true;
            this.unloadedObjects.delete(object);
        });
    }
    
    /**
     * Enforce memory limit by unloading oldest textures
     */
    enforceMemoryLimit() {
        if (this.texturedObjects.size <= this.maxTexturesInMemory) return;
        
        // Sort by last seen time
        const sorted = Array.from(this.texturedObjects.entries())
            .filter(([obj, data]) => data.isLoaded)
            .sort((a, b) => a[1].lastSeen - b[1].lastSeen);
        
        // Unload oldest until under limit
        const toUnload = sorted.slice(0, this.texturedObjects.size - this.maxTexturesInMemory);
        toUnload.forEach(([obj]) => this.unloadTexture(obj));
    }
    
    /**
     * Get memory stats
     */
    getStats() {
        let loaded = 0;
        let unloaded = 0;
        
        this.texturedObjects.forEach(data => {
            if (data.isLoaded) loaded++;
            else unloaded++;
        });
        
        return {
            total: this.texturedObjects.size,
            loaded,
            unloaded,
            maxAllowed: this.maxTexturesInMemory
        };
    }
    
    /**
     * Unregister object
     */
    unregisterObject(object) {
        if (!object) return;
        
        const data = this.texturedObjects.get(object);
        if (data) {
            if (data.texture && data.texture !== this.placeholderTexture) {
                data.texture.dispose();
            }
            if (data.originalMaterial) {
                data.originalMaterial.dispose();
            }
        }
        
        this.texturedObjects.delete(object);
        this.unloadedObjects.delete(object);
    }
    
    /**
     * Dispose all textures
     */
    disposeAll() {
        this.texturedObjects.forEach((data, object) => {
            if (data.texture) {
                data.texture.dispose();
            }
            if (data.originalMaterial) {
                data.originalMaterial.dispose();
            }
        });
        
        if (this.placeholderTexture) {
            this.placeholderTexture.dispose();
        }
        
        this.texturedObjects.clear();
        this.unloadedObjects.clear();
    }
    
    /**
     * Destroy manager
     */
    destroy() {
        this.disposeAll();
        this.scene = null;
        this.camera = null;
    }
}