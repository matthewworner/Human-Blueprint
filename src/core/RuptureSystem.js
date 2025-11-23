import * as THREE from 'three';

export class RuptureSystem {
    constructor(sceneManager, gazeTracker, audioSystem = null) {
        this.sceneManager = sceneManager;
        this.gazeTracker = gazeTracker;
        this.audioSystem = audioSystem;
        
        this.dwellTimes = new Map(); // Track dwell time per object
        this.ruptureThreshold = 3000; // 3 seconds of dwelling triggers rupture
        this.ruptureCooldown = 10000; // 10 seconds between ruptures
        this.lastRuptureTime = 0;
        
        // Transition parameters (tunable)
        this.transitionSpeed = 1200; // ms - camera transition duration
        this.fadeIntensity = 0.3; // 0-1 - how much current images fade (0.3 = fade to 30% opacity)
        this.highlightIntensity = 0.8; // 0-1 - emissive intensity for destination highlight
        
        // State tracking
        this.isRupturing = false;
        this.ruptureStartTime = null;
        this.originalImageOpacities = new Map();
        this.originalImageEmissives = new Map();
        
        this.onRupture = null;
    }
    
    update() {
        // Update is called from main loop
        // Dwell tracking happens in GazeTracker
    }
    
    updateDwell(target, dwellDuration = null) {
        if (!target || this.isRupturing) {
            return;
        }
        
        const now = Date.now();
        
        // If dwellDuration is provided (from GazeTracker), use it directly
        // Otherwise, track our own dwell time
        let totalDwell;
        
        if (dwellDuration !== null) {
            // Use duration from GazeTracker
            totalDwell = dwellDuration;
        } else {
            // Track our own dwell time
            if (!this.dwellTimes.has(target)) {
                this.dwellTimes.set(target, { start: now, current: now });
                return; // Not enough time yet
            } else {
                const dwell = this.dwellTimes.get(target);
                dwell.current = now;
                totalDwell = now - dwell.start;
            }
        }
        
        // Check if rupture should trigger
        if (totalDwell >= this.ruptureThreshold) {
            // Check cooldown
            if (now - this.lastRuptureTime > this.ruptureCooldown) {
                this.triggerRupture(target);
            }
        }
    }
    
    triggerRupture(sourceImage) {
        if (this.isRupturing) {
            return; // Prevent multiple simultaneous ruptures
        }
        
        console.log('Rupture triggered from:', sourceImage.userData.imageData);
        
        // Find a connected image (different era/region, similar color/type)
        const destination = this.findConnectedImage(sourceImage);
        
        if (destination) {
            this.isRupturing = true;
            this.ruptureStartTime = Date.now();
            this.lastRuptureTime = Date.now();
            
            // Reset dwell time for source
            this.dwellTimes.delete(sourceImage);
            
            // Execute rupture
            this.executeRupture(sourceImage, destination);
            
            // Notify callback
            if (this.onRupture) {
                this.onRupture(sourceImage, destination);
            }
        }
    }
    
    findConnectedImage(sourceImage) {
        const sourceData = sourceImage.userData?.imageData;
        if (!sourceData) return null;
        
        const allImages = Array.from(this.sceneManager.scene.children)
            .filter(child => child.userData?.imageData && child !== sourceImage);
        
        if (allImages.length === 0) return null;
        
        // Find images that are:
        // 1. Different era/region (distant in time/space)
        // 2. Similar color/type (connected by visual similarity)
        const candidates = allImages.map(imageObj => {
            const imageData = imageObj.userData.imageData;
            
            // Check if different era/region
            const differentEra = imageData.era !== sourceData.era;
            const differentRegion = imageData.region !== sourceData.region;
            const isDistant = differentEra || differentRegion;
            
            if (!isDistant) {
                return { imageObj, score: 0 };
            }
            
            // Calculate similarity score based on color and type
            let similarityScore = 0;
            
            // Type similarity (exact match = high score)
            if (imageData.type === sourceData.type) {
                similarityScore += 0.5;
            }
            
            // Color similarity (check if any colors match)
            if (sourceData.colors && imageData.colors) {
                const sourceColors = Array.isArray(sourceData.colors) ? sourceData.colors : [];
                const imageColors = Array.isArray(imageData.colors) ? imageData.colors : [];
                
                const matchingColors = sourceColors.filter(c => imageColors.includes(c));
                if (matchingColors.length > 0) {
                    similarityScore += 0.3 * (matchingColors.length / Math.max(sourceColors.length, imageColors.length));
                }
            }
            
            return { imageObj, score: similarityScore };
        });
        
        // Filter out zero-score candidates and sort by score
        const validCandidates = candidates
            .filter(c => c.score > 0)
            .sort((a, b) => b.score - a.score);
        
        // If we have valid candidates, pick the best one
        // Otherwise, pick a random distant image
        if (validCandidates.length > 0) {
            // Sometimes pick a random high-scoring candidate for variety
            const topCandidates = validCandidates.slice(0, Math.min(3, validCandidates.length));
            const randomIndex = Math.floor(Math.random() * topCandidates.length);
            return topCandidates[randomIndex].imageObj;
        } else {
            // Fallback: pick a random distant image
            const distantImages = allImages.filter(imageObj => {
                const imageData = imageObj.userData.imageData;
                return imageData.era !== sourceData.era || imageData.region !== sourceData.region;
            });
            
            if (distantImages.length > 0) {
                const randomIndex = Math.floor(Math.random() * distantImages.length);
                return distantImages[randomIndex];
            }
            
            // Last resort: any random image
            const randomIndex = Math.floor(Math.random() * allImages.length);
            return allImages[randomIndex];
        }
    }
    
    executeRupture(sourceImage, destination) {
        // Store original material properties for restoration
        this.storeOriginalProperties();
        
        // Step 1: Fade current images slightly
        this.fadeCurrentImages();
        
        // Step 2: Cut audio briefly
        if (this.audioSystem) {
            this.audioSystem.triggerRupture();
        }
        
        // Step 3: Smooth camera movement with disorienting effect
        this.moveCameraToDestination(destination);
        
        // Step 4: Highlight destination and fade in nearby images
        this.highlightDestination(destination);
        
        // Step 5: Reset after transition completes
        setTimeout(() => {
            this.completeRupture();
        }, this.transitionSpeed + 500);
    }
    
    storeOriginalProperties() {
        // Store original opacity and emissive for all images
        this.sceneManager.scene.children.forEach(child => {
            if (child.userData?.imageData && child.material) {
                this.originalImageOpacities.set(child, child.material.opacity);
                this.originalImageEmissives.set(child, child.material.emissive.clone());
            }
        });
    }
    
    fadeCurrentImages() {
        // Fade all images to reduced opacity
        this.sceneManager.scene.children.forEach(child => {
            if (child.userData?.imageData && child.material) {
                // Make material transparent if not already
                if (!child.material.transparent) {
                    child.material.transparent = true;
                }
                // Fade to fadeIntensity opacity
                child.material.opacity = this.fadeIntensity;
            }
        });
    }
    
    moveCameraToDestination(destination) {
        const destPosition = destination.position.clone();
        
        // Calculate camera position offset (in front of image)
        const cameraOffset = 5;
        destPosition.z += cameraOffset;
        
        // Add disorienting randomness to camera angle
        // This creates the "jump" feeling - not smooth navigation
        const disorientAmount = 2;
        destPosition.x += (Math.random() - 0.5) * disorientAmount;
        destPosition.y += (Math.random() - 0.5) * disorientAmount;
        
        // Add slight rotation offset for disorientation
        const targetLookAt = destination.position.clone();
        targetLookAt.x += (Math.random() - 0.5) * 1;
        targetLookAt.y += (Math.random() - 0.5) * 1;
        
        // Move camera with custom easing for disorienting effect
        this.sceneManager.moveCameraWithLookAt(
            destPosition,
            targetLookAt,
            this.transitionSpeed,
            this.createDisorientingEasing()
        );
    }
    
    createDisorientingEasing() {
        // Custom easing that creates a "jump" feeling
        // Starts fast, slows in middle, then accelerates again
        return (t) => {
            // Ease-in-out-cubic with slight overshoot at end
            if (t < 0.5) {
                return 4 * t * t * t;
            } else {
                const f = 2 * t - 2;
                return 1 + f * f * f * 0.1; // Slight overshoot
            }
        };
    }
    
    highlightDestination(destination) {
        // Highlight destination image
        if (destination.material) {
            destination.material.emissive.setHex(0xffffff);
            destination.material.emissive.multiplyScalar(this.highlightIntensity);
            
            // Scale up slightly
            const originalScale = destination.scale.clone();
            destination.scale.multiplyScalar(1.2);
            
            // Find nearby images and fade them in
            this.fadeInNearbyImages(destination);
            
            // Animate highlight fade out
            setTimeout(() => {
                destination.material.emissive.setHex(0x000000);
                destination.scale.copy(originalScale);
            }, this.transitionSpeed);
        }
    }
    
    fadeInNearbyImages(centerImage) {
        const centerPos = centerImage.position;
        const nearbyRadius = 8; // Distance threshold for "nearby"
        
        this.sceneManager.scene.children.forEach(child => {
            if (child.userData?.imageData && child !== centerImage && child.material) {
                const distance = child.position.distanceTo(centerPos);
                
                if (distance < nearbyRadius) {
                    // Fade in nearby images (restore opacity)
                    child.material.opacity = this.originalImageOpacities.get(child) || 1.0;
                    
                    // Subtle glow for nearby images
                    child.material.emissive.setHex(0x222222);
                    
                    // Fade out glow after transition
                    setTimeout(() => {
                        child.material.emissive.setHex(0x000000);
                    }, this.transitionSpeed);
                }
            }
        });
    }
    
    completeRupture() {
        // Restore all image opacities
        this.sceneManager.scene.children.forEach(child => {
            if (child.userData?.imageData && child.material) {
                const originalOpacity = this.originalImageOpacities.get(child);
                if (originalOpacity !== undefined) {
                    child.material.opacity = originalOpacity;
                }
            }
        });
        
        // Clear stored properties
        this.originalImageOpacities.clear();
        this.originalImageEmissives.clear();
        
        // Reset rupture state
        this.isRupturing = false;
        this.ruptureStartTime = null;
        
        // Reset gaze tracking
        this.gazeTracker.reset();
    }
    
    // Setters for tuning parameters
    setDwellThreshold(ms) {
        this.ruptureThreshold = ms;
    }
    
    setTransitionSpeed(ms) {
        this.transitionSpeed = ms;
    }
    
    setFadeIntensity(intensity) {
        this.fadeIntensity = Math.max(0, Math.min(1, intensity));
    }
    
    setHighlightIntensity(intensity) {
        this.highlightIntensity = Math.max(0, Math.min(1, intensity));
    }
}

