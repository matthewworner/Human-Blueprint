import * as THREE from 'three';

export class RuptureSystem {
    // Rupture types
    static RUPTURE_TYPES = {
        DWELLING: 'dwelling',
        AVOIDANCE: 'avoidance',
        SCANNING: 'scanning',
        RETURNING: 'returning',
        RAPID_MOVEMENT: 'rapid_movement',
        PATTERN_RECOGNITION: 'pattern_recognition',
        EMOTIONAL_INTENSITY: 'emotional_intensity',
        TEMPORAL_DISPLACEMENT: 'temporal_displacement'
    };

    constructor(sceneManager, gazeTracker, audioSystem = null) {
        this.sceneManager = sceneManager;
        this.gazeTracker = gazeTracker;
        this.audioSystem = audioSystem;

        // Existing dwelling tracking
        this.dwellTimes = new Map(); // Track dwell time per object
        this.ruptureThreshold = 3000; // 3 seconds of dwelling triggers rupture

        // New rupture type tracking
        this.lastSeenTimes = new Map(); // Track last seen time per image (for avoidance)
        this.gazeHistory = []; // Track recent gaze targets (for scanning/returning)
        this.maxHistoryLength = 10; // Keep last 10 gaze targets
        this.avoidanceThreshold = 15000; // 15 seconds without looking triggers avoidance
        this.scanningThreshold = 5; // 5 different images in short time
        this.scanningTimeWindow = 3000; // 3 seconds for scanning
        this.returningThreshold = 10000; // 10 seconds since last gaze to trigger returning
        this.currentGazeTarget = null; // Track current gaze target for change detection
        this.unexploredImages = new Set(); // Track images never gazed at
        this.exploredImages = new Set(); // Track images that have been gazed at
        this.returningDetected = false; // Flag for detected returning behavior

        // Initialize unexplored images
        this.sceneManager.scene.children.forEach(child => {
            if (child.userData?.imageData) {
                this.unexploredImages.add(child.userData.imageData.id);
            }
        });

        // Additional tracking for new rupture types
        this.movementHistory = []; // Track camera movement speed
        this.maxMovementHistory = 20;
        this.rapidMovementThreshold = 5.0; // Units per second
        this.patternRecognitionThreshold = 8; // Images in recognizable pattern
        this.emotionalIntensityThreshold = 0.8; // High engagement level
        this.temporalDisplacementThreshold = 300000; // 5 minutes of continuous engagement
        this.sessionStartTime = Date.now();
        this.engagementScore = 0; // Track user engagement over time
        this.lastCameraPosition = null; // Track last camera position for movement detection

        this.ruptureCooldown = 10000; // 10 seconds between ruptures
        this.lastRuptureTime = 0;

        // Transition parameters (tunable) - now per type
        this.transitionParams = {
            [RuptureSystem.RUPTURE_TYPES.DWELLING]: {
                speed: 1200,
                fadeIntensity: 0.3,
                highlightIntensity: 0.8
            },
            [RuptureSystem.RUPTURE_TYPES.AVOIDANCE]: {
                speed: 2000,
                fadeIntensity: 0.5,
                highlightIntensity: 0.6
            },
            [RuptureSystem.RUPTURE_TYPES.SCANNING]: {
                speed: 800,
                fadeIntensity: 0.2,
                highlightIntensity: 1.0
            },
            [RuptureSystem.RUPTURE_TYPES.RETURNING]: {
                speed: 1500,
                fadeIntensity: 0.4,
                highlightIntensity: 0.7
            },
            [RuptureSystem.RUPTURE_TYPES.RAPID_MOVEMENT]: {
                speed: 600,
                fadeIntensity: 0.6,
                highlightIntensity: 0.9
            },
            [RuptureSystem.RUPTURE_TYPES.PATTERN_RECOGNITION]: {
                speed: 1800,
                fadeIntensity: 0.4,
                highlightIntensity: 0.5
            },
            [RuptureSystem.RUPTURE_TYPES.EMOTIONAL_INTENSITY]: {
                speed: 1000,
                fadeIntensity: 0.7,
                highlightIntensity: 1.2
            },
            [RuptureSystem.RUPTURE_TYPES.TEMPORAL_DISPLACEMENT]: {
                speed: 2200,
                fadeIntensity: 0.8,
                highlightIntensity: 0.4
            }
        };

        // Default transition properties (can be overridden by setters or per-type params)
        this.fadeIntensity = 0.3;
        this.highlightIntensity = 0.8;
        this.transitionSpeed = 1200;

        // State tracking
        this.isRupturing = false;
        this.ruptureStartTime = null;
        this.originalImageOpacities = new Map();
        this.originalImageEmissives = new Map();

        this.onRupture = null;
    }
    
    update(camera = null, deltaTime = null) {
        // Update is called from main loop
        // Dwell tracking happens in GazeTracker

        // Use sceneManager's camera if not provided
        const activeCamera = camera || this.sceneManager?.camera;
        if (!activeCamera) return;

        // Track movement for rapid movement detection
        this.trackMovement(activeCamera, deltaTime);

        // Update engagement score
        this.updateEngagementScore();

        // Check for new rupture conditions
        this.checkForRuptures();
    }

    /**
     * Track camera movement for rapid movement detection
     */
    trackMovement(camera, deltaTime) {
        if (!camera) return;

        const currentPos = camera.position.clone();
        const currentTime = Date.now();

        if (this.lastCameraPosition) {
            const distance = currentPos.distanceTo(this.lastCameraPosition);
            const speed = distance / (deltaTime || 0.016); // Assume 60fps if no deltaTime

            this.movementHistory.push({
                speed: speed,
                time: currentTime
            });

            // Keep history limited
            if (this.movementHistory.length > this.maxMovementHistory) {
                this.movementHistory.shift();
            }
        }

        this.lastCameraPosition = currentPos;
    }

    /**
     * Update engagement score based on various factors
     */
    updateEngagementScore() {
        const now = Date.now();
        const sessionDuration = (now - this.sessionStartTime) / 1000; // seconds

        // Base engagement from session duration and gaze patterns
        let score = Math.min(sessionDuration / 300, 1.0); // Max at 5 minutes

        // Add engagement from dwell times
        const totalDwell = Array.from(this.dwellTimes.values())
            .reduce((sum, dwell) => sum + (now - dwell.start) / 1000, 0);
        score += Math.min(totalDwell / 60, 0.5); // Up to 0.5 from dwell time

        // Add engagement from gaze history diversity
        const uniqueImages = new Set(this.gazeHistory.map(g => g.imageId)).size;
        score += Math.min(uniqueImages / 50, 0.3); // Up to 0.3 from exploration

        this.engagementScore = Math.min(score, 1.0);
    }

    /**
     * Check for all rupture conditions
     */
    checkForRuptures() {
        const now = Date.now();

        // Check avoidance (not looking at certain images for too long)
        if (this.detectAvoidance()) {
            this.triggerRuptureByType(RuptureSystem.RUPTURE_TYPES.AVOIDANCE);
        }

        // Check scanning (rapid switching between images)
        if (this.detectScanning()) {
            this.triggerRuptureByType(RuptureSystem.RUPTURE_TYPES.SCANNING);
        }

        // Check returning (revisiting previously seen images)
        if (this.detectReturning()) {
            this.triggerRuptureByType(RuptureSystem.RUPTURE_TYPES.RETURNING);
        }

        // Check rapid movement
        if (this.detectRapidMovement()) {
            this.triggerRuptureByType(RuptureSystem.RUPTURE_TYPES.RAPID_MOVEMENT);
        }

        // Check pattern recognition
        if (this.detectPatternRecognition()) {
            this.triggerRuptureByType(RuptureSystem.RUPTURE_TYPES.PATTERN_RECOGNITION);
        }

        // Check emotional intensity
        if (this.detectEmotionalIntensity()) {
            this.triggerRuptureByType(RuptureSystem.RUPTURE_TYPES.EMOTIONAL_INTENSITY);
        }

        // Check temporal displacement
        if (this.detectTemporalDisplacement()) {
            this.triggerRuptureByType(RuptureSystem.RUPTURE_TYPES.TEMPORAL_DISPLACEMENT);
        }
    }

    /**
     * Detect rapid camera movement
     */
    detectRapidMovement() {
        if (this.movementHistory.length < 5) return false;

        // Check if recent movements exceed threshold
        const recentMovements = this.movementHistory.slice(-5);
        const avgSpeed = recentMovements.reduce((sum, m) => sum + m.speed, 0) / recentMovements.length;

        return avgSpeed > this.rapidMovementThreshold;
    }

    /**
     * Detect when user recognizes arrangement patterns
     */
    detectPatternRecognition() {
        if (this.gazeHistory.length < this.patternRecognitionThreshold) return false;

        // Look for sequential patterns (e.g., chronological, geographical)
        const recentGazes = this.gazeHistory.slice(-this.patternRecognitionThreshold);
        const imageIds = recentGazes.map(g => g.imageId);

        // Check for chronological pattern (increasing era)
        const chronologicalPattern = this.checkChronologicalPattern(imageIds);
        if (chronologicalPattern) return true;

        // Check for geographical pattern (same region)
        const geographicalPattern = this.checkGeographicalPattern(imageIds);
        if (geographicalPattern) return true;

        return false;
    }

    /**
     * Check if gaze follows chronological order
     */
    checkChronologicalPattern(imageIds) {
        // Get image data for these IDs
        const images = imageIds.map(id => {
            const sceneObj = this.sceneManager.scene.children.find(child =>
                child.userData?.imageData?.id === id
            );
            return sceneObj?.userData?.imageData;
        }).filter(img => img);

        if (images.length < 3) return false;

        // Check if eras are in increasing order
        let increasing = true;
        for (let i = 1; i < images.length; i++) {
            if (images[i].era < images[i-1].era) {
                increasing = false;
                break;
            }
        }

        return increasing;
    }

    /**
     * Check if gaze follows geographical grouping
     */
    checkGeographicalPattern(imageIds) {
        // Get image data for these IDs
        const images = imageIds.map(id => {
            const sceneObj = this.sceneManager.scene.children.find(child =>
                child.userData?.imageData?.id === id
            );
            return sceneObj?.userData?.imageData;
        }).filter(img => img);

        if (images.length < 3) return false;

        // Check if most images are from same region
        const regions = images.map(img => img.region);
        const primaryRegion = regions[0];
        const sameRegionCount = regions.filter(r => r === primaryRegion).length;

        return sameRegionCount >= images.length * 0.7; // 70% same region
    }

    /**
     * Detect high emotional engagement
     */
    detectEmotionalIntensity() {
        return this.engagementScore > this.emotionalIntensityThreshold;
    }

    /**
     * Detect temporal displacement (long continuous engagement)
     */
    detectTemporalDisplacement() {
        const sessionDuration = Date.now() - this.sessionStartTime;
        return sessionDuration > this.temporalDisplacementThreshold;
    }

    /**
     * Trigger rupture by type (finds appropriate target)
     */
    triggerRuptureByType(ruptureType) {
        if (this.isRupturing) return;

        const now = Date.now();
        if (now - this.lastRuptureTime < this.ruptureCooldown) return;

        // Find target based on rupture type
        const target = this.findTargetForRuptureType(ruptureType);
        if (target) {
            this.isRupturing = true;
            this.ruptureStartTime = now;
            this.lastRuptureTime = now;

            console.log(`Rupture triggered: ${ruptureType}`);

            // Execute rupture
            this.executeRuptureByType(target, ruptureType);

            // Notify callback
            if (this.onRupture) {
                this.onRupture(null, target, ruptureType);
            }
        }
    }

    /**
     * Find appropriate target for specific rupture type
     */
    findTargetForRuptureType(ruptureType) {
        const allImages = Array.from(this.sceneManager?.scene?.children || [])
            .filter(child => child.userData?.imageData);

        if (allImages.length === 0) return null;

        switch (ruptureType) {
            case RuptureSystem.RUPTURE_TYPES.RAPID_MOVEMENT:
                // Jump to a distant, surprising image
                return this.findMostDistantImage(allImages);

            case RuptureSystem.RUPTURE_TYPES.PATTERN_RECOGNITION:
                // Break the pattern with something unexpected
                return this.findUnexpectedImage(allImages);

            case RuptureSystem.RUPTURE_TYPES.EMOTIONAL_INTENSITY:
                // Go to a powerful, intense image
                return this.findIntenseImage(allImages);

            case RuptureSystem.RUPTURE_TYPES.TEMPORAL_DISPLACEMENT:
                // Jump far in time
                return this.findTemporalJumpImage(allImages);

            default:
                return allImages[Math.floor(Math.random() * allImages.length)];
        }
    }

    /**
     * Find most spatially distant image
     */
    findMostDistantImage(images) {
        if (!images || images.length === 0) return null;
        if (!this.sceneManager?.camera) return images[0];

        let farthest = images[0];
        let maxDistance = 0;

        images.forEach(img => {
            if (!img?.position) return;
            const distance = img.position.distanceTo(this.sceneManager.camera.position);
            if (distance > maxDistance) {
                maxDistance = distance;
                farthest = img;
            }
        });

        return farthest;
    }

    /**
     * Find unexpected image (different from recent pattern)
     */
    findUnexpectedImage(images) {
        if (!images || images.length === 0) return null;
        if (this.gazeHistory.length === 0) return images[0];

        const recentImage = this.gazeHistory[this.gazeHistory.length - 1];
        const recentImgData = images.find(img => img.userData?.imageData?.id === recentImage.imageId)?.userData?.imageData;

        if (!recentImgData) return images[0];

        // Find image most different from recent one
        let mostDifferent = images[0];
        let maxDifference = 0;

        images.forEach(img => {
            const imgData = img.userData?.imageData;
            if (!imgData || imgData.id === recentImage.imageId) return;

            let difference = 0;
            difference += Math.abs(imgData.era - recentImgData.era) / 10000; // Era difference
            difference += imgData.region !== recentImgData.region ? 1 : 0; // Region difference
            difference += imgData.type !== recentImgData.type ? 0.5 : 0; // Type difference

            if (difference > maxDifference) {
                maxDifference = difference;
                mostDifferent = img;
            }
        });

        return mostDifferent || images[0];
    }

    /**
     * Find intense/important image
     */
    findIntenseImage(images) {
        // Prioritize images with certain characteristics that might be "intense"
        const candidates = images.filter(img => {
            const data = img.userData?.imageData;
            if (!data) return false;

            // Prioritize very old or very new images, or images with certain colors/types
            return data.era < -20000 || data.era > 1900 ||
                   data.colors?.includes('red') ||
                   data.type === 'handprint';
        });

        return candidates.length > 0 ?
            candidates[Math.floor(Math.random() * candidates.length)] :
            images[Math.floor(Math.random() * images.length)];
    }

    /**
     * Find image from very different time period
     */
    findTemporalJumpImage(images) {
        if (!images || images.length === 0) return null;
        if (this.gazeHistory.length === 0) return images[0];

        const recentImage = this.gazeHistory[this.gazeHistory.length - 1];
        const recentImgData = images.find(img => img.userData?.imageData?.id === recentImage.imageId)?.userData?.imageData;

        if (!recentImgData) return images[0];

        // Find image from most different era
        let mostDifferent = images[0];
        let maxEraDifference = 0;

        images.forEach(img => {
            const imgData = img.userData?.imageData;
            if (!imgData) return;

            const eraDifference = Math.abs(imgData.era - recentImgData.era);
            if (eraDifference > maxEraDifference) {
                maxEraDifference = eraDifference;
                mostDifferent = img;
            }
        });

        return mostDifferent || images[0];
    }

    /**
     * Execute rupture with type-specific parameters
     */
    executeRuptureByType(destination, ruptureType) {
        const params = this.transitionParams[ruptureType];
        if (!params) return;

        // Store original material properties
        this.storeOriginalProperties();

        // Apply type-specific rupture effects
        this.applyRuptureEffects(ruptureType, params);

        // Move camera with type-specific easing
        this.moveCameraForRuptureType(destination, ruptureType, params);

        // Reset after transition
        setTimeout(() => {
            this.completeRupture();
        }, params.speed + 500);
    }

    /**
     * Apply rupture effects based on type
     */
    applyRuptureEffects(ruptureType, params) {
        // Trigger visual rupture effects
        this.triggerVisualRupture();

        // Audio effects
        if (this.audioSystem) {
            this.audioSystem.triggerRupture();
        }

        // Type-specific visual effects
        switch (ruptureType) {
            case RuptureSystem.RUPTURE_TYPES.RAPID_MOVEMENT:
                // More intense fade for rapid movement
                this.fadeCurrentImages(params.fadeIntensity * 1.5);
                break;

            case RuptureSystem.RUPTURE_TYPES.EMOTIONAL_INTENSITY:
                // Pulsing highlight effect
                this.pulseHighlightEffect(params);
                break;

            case RuptureSystem.RUPTURE_TYPES.TEMPORAL_DISPLACEMENT:
                // Slow, eerie transition
                this.fadeCurrentImages(params.fadeIntensity);
                this.applyTemporalDistortion();
                break;

            default:
                this.fadeCurrentImages(params.fadeIntensity);
        }

        // Highlight destination
        this.highlightDestinationWithParams(destination, params);
    }

    /**
     * Pulse highlight effect for emotional intensity
     */
    pulseHighlightEffect(params) {
        this.pulseInterval = setInterval(() => {
            this.sceneManager.scene.children.forEach(child => {
                if (child.userData?.imageData && child.material) {
                    const intensity = 0.5 + Math.sin(Date.now() * 0.01) * 0.3;
                    child.material.emissive.setHex(0xff0000);
                    child.material.emissive.multiplyScalar(intensity);
                }
            });
        }, 50);

        setTimeout(() => {
            if (this.pulseInterval) {
                clearInterval(this.pulseInterval);
                this.pulseInterval = null;
            }
        }, params.speed);
    }

    /**
     * Apply temporal distortion effect
     */
    applyTemporalDistortion() {
        // Create a time-bending visual effect
        this.distortionInterval = setInterval(() => {
            this.sceneManager.scene.children.forEach(child => {
                if (child.userData?.imageData && child.material) {
                    const distortion = Math.sin(Date.now() * 0.005) * 0.1;
                    child.material.opacity = Math.max(0.1, child.material.opacity + distortion);
                }
            });
        }, 30);

        setTimeout(() => {
            if (this.distortionInterval) {
                clearInterval(this.distortionInterval);
                this.distortionInterval = null;
            }
        }, 2000);
    }

    /**
     * Move camera with type-specific easing
     */
    moveCameraForRuptureType(destination, ruptureType, params) {
        const destPosition = destination.position.clone();
        const cameraOffset = 5;
        destPosition.z += cameraOffset;

        let easingFunction;
        switch (ruptureType) {
            case RuptureSystem.RUPTURE_TYPES.RAPID_MOVEMENT:
                easingFunction = (t) => Math.pow(t, 0.3); // Fast start
                break;
            case RuptureSystem.RUPTURE_TYPES.TEMPORAL_DISPLACEMENT:
                easingFunction = (t) => 1 - Math.pow(1 - t, 3); // Slow end
                break;
            default:
                easingFunction = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        }

        // Add disorienting randomness
        const disorientAmount = params.fadeIntensity;
        destPosition.x += (Math.random() - 0.5) * disorientAmount * 4;
        destPosition.y += (Math.random() - 0.5) * disorientAmount * 4;

        const targetLookAt = destination.position.clone();
        targetLookAt.x += (Math.random() - 0.5) * disorientAmount * 2;
        targetLookAt.y += (Math.random() - 0.5) * disorientAmount * 2;

        this.sceneManager.moveCameraWithLookAt(
            destPosition,
            targetLookAt,
            params.speed,
            easingFunction
        );
    }

    /**
     * Highlight destination with custom parameters
     */
    highlightDestinationWithParams(destination, params) {
        if (!destination.material) return;

        destination.material.emissive.setHex(0xffffff);
        destination.material.emissive.multiplyScalar(params.highlightIntensity);

        const originalScale = destination.scale.clone();
        destination.scale.multiplyScalar(1.2);

        setTimeout(() => {
            destination.material.emissive.setHex(0x000000);
            destination.scale.copy(originalScale);
        }, params.speed);
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
        const sourceData = sourceImage?.userData?.imageData;
        if (!sourceData) return null;

        const allImages = Array.from(this.sceneManager?.scene?.children || [])
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
    
    executeRupture(sourceImage, destination, ruptureType = RuptureSystem.RUPTURE_TYPES.DWELLING) {
        const params = this.transitionParams[ruptureType] || this.transitionParams[RuptureSystem.RUPTURE_TYPES.DWELLING];

        // Store original material properties for restoration
        this.storeOriginalProperties();

        // Step 1: Trigger visual rupture effects (screen distortion)
        this.triggerVisualRupture();

        // Step 2: Fade current images slightly
        this.fadeCurrentImages(params.fadeIntensity);

        // Step 3: Cut audio briefly
        if (this.audioSystem) {
            this.audioSystem.triggerRupture();
        }

        // Step 4: Smooth camera movement with disorienting effect
        this.moveCameraToDestination(destination, params);

        // Step 5: Highlight destination and fade in nearby images
        this.highlightDestination(destination, params);

        // Step 6: Reset after transition completes
        setTimeout(() => {
            this.completeRupture();
        }, params.speed + 500);
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
    
    fadeCurrentImages(fadeIntensity = null) {
        // Use provided intensity or fall back to instance property
        const intensity = fadeIntensity !== null ? fadeIntensity : (this.fadeIntensity || 0.3);
        
        // Fade all images to reduced opacity
        this.sceneManager.scene.children.forEach(child => {
            if (child.userData?.imageData && child.material) {
                // Make material transparent if not already
                if (!child.material.transparent) {
                    child.material.transparent = true;
                }
                // Fade to specified intensity
                child.material.opacity = intensity;
            }
        });
    }
    
    moveCameraToDestination(destination, params) {
        const destPosition = destination.position.clone();

        // Calculate camera position offset (in front of image)
        const cameraOffset = 5;
        destPosition.z += cameraOffset;

        // Add disorienting randomness to camera angle
        // This creates the "jump" feeling - not smooth navigation
        const disorientAmount = params.fadeIntensity * 2;
        destPosition.x += (Math.random() - 0.5) * disorientAmount;
        destPosition.y += (Math.random() - 0.5) * disorientAmount;

        // Add slight rotation offset for disorientation
        const targetLookAt = destination.position.clone();
        targetLookAt.x += (Math.random() - 0.5) * disorientAmount * 0.5;
        targetLookAt.y += (Math.random() - 0.5) * disorientAmount * 0.5;

        // Move camera with custom easing for disorienting effect
        this.sceneManager.moveCameraWithLookAt(
            destPosition,
            targetLookAt,
            params.speed,
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
    
    highlightDestination(destination, params = null) {
        // Use provided params or fall back to instance properties
        const highlightIntensity = params?.highlightIntensity || this.highlightIntensity || 0.8;
        const transitionSpeed = params?.speed || this.transitionSpeed || 1200;
        
        // Highlight destination image
        if (destination.material) {
            destination.material.emissive.setHex(0xffffff);
            destination.material.emissive.multiplyScalar(highlightIntensity);
            
            // Scale up slightly
            const originalScale = destination.scale.clone();
            destination.scale.multiplyScalar(1.2);
            
            // Find nearby images and fade them in
            this.fadeInNearbyImages(destination);
            
            // Animate highlight fade out
            setTimeout(() => {
                destination.material.emissive.setHex(0x000000);
                destination.scale.copy(originalScale);
            }, transitionSpeed);
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
    
    triggerVisualRupture() {
        // Animate rupture intensity for visual "crack" effect
        const startTime = Date.now();
        const duration = 800; // 800ms rupture effect

        const animateRupture = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Create a sharp spike in intensity (0 → 1 → 0)
            let intensity;
            if (progress < 0.3) {
                // Quick rise to peak
                intensity = progress / 0.3;
            } else if (progress < 0.7) {
                // Hold at peak
                intensity = 1.0;
            } else {
                // Quick fall off
                intensity = 1.0 - ((progress - 0.7) / 0.3);
            }

            // Apply to post-processing
            if (this.sceneManager.postProcessManager) {
                this.sceneManager.postProcessManager.setRuptureIntensity(intensity);
            }

            if (progress < 1) {
                requestAnimationFrame(animateRupture);
            } else {
                // Ensure intensity returns to 0
                if (this.sceneManager.postProcessManager) {
                    this.sceneManager.postProcessManager.setRuptureIntensity(0);
                }
            }
        };

        animateRupture();
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

    /**
     * Clean up all intervals and resources
     */
    destroy() {
        // Clear any active intervals
        if (this.pulseInterval) {
            clearInterval(this.pulseInterval);
            this.pulseInterval = null;
        }
        if (this.distortionInterval) {
            clearInterval(this.distortionInterval);
            this.distortionInterval = null;
        }

        // Clear tracking data
        this.dwellTimes.clear();
        this.lastSeenTimes.clear();
        this.gazeHistory = [];
        this.movementHistory = [];
        this.unexploredImages.clear();
        this.exploredImages.clear();
        this.originalImageOpacities.clear();
        this.originalImageEmissives.clear();

        // Reset state
        this.isRupturing = false;

        // Clear references
        this.sceneManager = null;
        this.gazeTracker = null;
        this.audioSystem = null;
    }
}

