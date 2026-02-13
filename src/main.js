import * as THREE from 'three';
import { SceneManager } from './core/SceneManager.js';
import { ImageLoader } from './core/ImageLoader.js';
import { ArrangementAlgorithm } from './core/ArrangementAlgorithm.js';
import { GazeTracker } from './core/GazeTracker.js';
import { RuptureSystem } from './core/RuptureSystem.js';
import { AudioSystem } from './core/AudioSystem.js';
import { PersonalizationManager } from './core/PersonalizationManager.js';

class HumanBlueprint {
    constructor() {
        this.sceneManager = null;
        this.imageLoader = null;
        this.arrangement = null;
        this.gazeTracker = null;
        this.ruptureSystem = null;
        this.audioSystem = null;
        this.personalizationManager = null;

        this.images = [];
        this.imageObjects = [];

        this.init();
    }

    async init() {
        console.log('Initializing The Human Blueprint...');

        // Initialize personalization system first
        this.personalizationManager = new PersonalizationManager();

        // Log visit information
        const visitStats = this.personalizationManager.getVisitStats();
        console.log('Visit stats:', visitStats);

        // Initialize core systems
        this.sceneManager = new SceneManager(document.getElementById('canvas-container'));
        this.imageLoader = new ImageLoader();
        this.arrangement = new ArrangementAlgorithm();

        // Optional systems (for full experience)
        try {
            this.gazeTracker = new GazeTracker(this.sceneManager.camera, this.sceneManager.renderer);
            // Set device type in personalization
            this.personalizationManager.setDeviceType(this.gazeTracker.deviceType);

            this.audioSystem = new AudioSystem();
            // Initialize audio system (async, but won't block)
            this.audioSystem.init().catch(err => {
                console.warn('Audio system initialization failed:', err);
            });

            // Get adaptive parameters for rupture system
            const adaptiveParams = this.personalizationManager.getAdaptiveParams();
            this.ruptureSystem = new RuptureSystem(this.sceneManager, this.gazeTracker, this.audioSystem);

            // Apply adaptive parameters
            this.ruptureSystem.setDwellThreshold(adaptiveParams.ruptureThreshold);
            this.ruptureSystem.setTransitionSpeed(adaptiveParams.transitionSpeed);
            this.ruptureSystem.setFadeIntensity(adaptiveParams.visualIntensity);
            this.ruptureSystem.setHighlightIntensity(adaptiveParams.visualIntensity * 1.5);

        } catch (error) {
            console.warn('Some systems failed to initialize:', error);
            // Continue without these systems for basic test
        }

        // Load images
        await this.loadImages();

        // Arrange images in 3D space
        this.arrangeImages();

        // Start generative soundscape (after images are arranged)
        // Note: May need user interaction due to browser autoplay policy
        this.startSoundscapeOnInteraction();

        // Start interaction loop
        this.startInteraction();

        // Set up WebXR button
        this.setupXRButton();

        // Update info display with personalized message
        this.updatePersonalizedInfoDisplay();

        // Hide loading screen
        document.getElementById('loading').classList.add('hidden');

        console.log('Blueprint ready.');
    }

    async loadImages() {
        // Set up loading progress callback
        this.imageLoader.onProgress = (progress) => {
            this.updateLoadingProgress(progress);
        };

        this.imageLoader.onComplete = (images) => {
            console.log(`Loaded ${images.length} images from JSON`);
        };

        this.imageLoader.onError = (error) => {
            console.error('Error loading images:', error);
            document.getElementById('loading').textContent = 'Error: Human Blueprint Initialization Failed';
        };

        try {
            // Load images from JSON file
            const loadedImages = await this.imageLoader.loadFromJSON('/images.json');
            this.images = loadedImages;

            console.log(`Loaded ${this.images.length} images from JSON`);

            // Log texture loading status
            const texturesLoaded = loadedImages.filter(img => img.texture && !img.metadata?.isPlaceholder).length;
            console.log(`Textures loaded: ${texturesLoaded}/${loadedImages.length}`);

            // Check for any failed loads
            const failed = loadedImages.filter(img => img.metadata?.isPlaceholder && img.url).length;
            if (failed > 0) {
                console.warn(`${failed} images failed to load and are using placeholders`);
            }
        } catch (error) {
            console.error('Failed to load images from JSON:', error);
            // Fallback: Load a single test image
            const testImageUrl = 'https://picsum.photos/800/600?random=1';
            try {
                const testPlane = await this.sceneManager.loadTestImageFromURL(
                    testImageUrl,
                    { x: 0, y: 0, z: 0 }
                );
                this.imageObjects.push(testPlane);
                console.log('Loaded fallback test image');
            } catch (fallbackError) {
                console.error('Fallback image also failed:', fallbackError);
            }
        }
    }

    updateLoadingProgress(progress) {
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.textContent = `Loading Human Blueprint... ${progress.percentage}% [${progress.loaded}/${progress.total}]`;

            if (progress.loaded === progress.total) {
                setTimeout(() => {
                    loadingEl.classList.add('hidden');
                }, 500);
            }
        }
    }

    arrangeImages() {
        // Create image planes from loaded image data
        // Positions are already set in imageData.position from JSON or strategy
        this.imageObjects = this.images.map((imageData) => {
            return this.sceneManager.createImagePlane(imageData);
        });

        // Apply adaptive arrangement based on user history
        this.applyAdaptiveArrangement();

        // Set up click detection
        this.sceneManager.setGlobalImageClickCallback((object, imageData) => {
            this.handleImageClick(object, imageData);
        });

        console.log(`Arranged ${this.imageObjects.length} images in 3D space`);
    }

    applyAdaptiveArrangement() {
        if (!this.personalizationManager) return;

        const mostViewed = this.personalizationManager.getMostViewedImages(3);
        const visitStats = this.personalizationManager.getVisitStats();

        // For return visitors, slightly adjust positions of favorite images
        if (visitStats.isReturnVisit && mostViewed.length > 0) {
            mostViewed.forEach((imageData, index) => {
                const imageObj = this.imageObjects.find(obj =>
                    obj.userData?.imageData?.id === imageData.id
                );

                if (imageObj) {
                    // Move favorite images slightly closer to center for easier access
                    const originalPos = imageObj.position.clone();
                    const centerBias = 0.1 * (index + 1); // More viewed = closer to center

                    imageObj.position.lerp(new THREE.Vector3(0, 0, 0), centerBias);
                    // Keep some of original position
                    imageObj.position.lerp(originalPos, 0.7);
                }
            });
        }

        // For experienced users, increase spacing slightly for more exploration
        if (visitStats.totalVisits > 5) {
            this.imageObjects.forEach(obj => {
                const direction = obj.position.clone().normalize();
                obj.position.add(direction.multiplyScalar(0.5)); // Push images out slightly
            });
        }
    }

    handleImageClick(object, imageData) {
        console.log('Image clicked:', imageData.id, imageData);

        // Visual feedback
        object.scale.setScalar(1.2);
        setTimeout(() => {
            object.scale.setScalar(1.0);
        }, 200);

        // You can add more click handling here (show info, trigger rupture, etc.)
    }

    startInteraction() {
        // Set up gaze tracking events - if available
        if (this.gazeTracker) {
            this.gazeTracker.onGazeStart = (imageId) => {
                this.personalizationManager.trackGazeStart(imageId);
                this.handleGazeStart(imageId);
            };

            this.gazeTracker.onGazeDwell = (imageId, duration) => {
                this.personalizationManager.trackGazeDwell(imageId, duration);
                this.handleGazeDwell(imageId, duration);
            };

            this.gazeTracker.onGazeEnd = (imageId, duration) => {
                this.handleGazeEnd(imageId, duration);
            };

            this.gazeTracker.onGazePattern = (patternType) => {
                this.personalizationManager.trackGazePattern(patternType);
                this.handleGazePattern(patternType);
            };
        }

        // Set up rupture callbacks - if available
        if (this.ruptureSystem) {
            this.ruptureSystem.onRupture = (targetImage, destination) => {
                this.handleRupture(targetImage, destination);
            };
        }

        // Start render loop
        this.animate();
    }

    startSoundscapeOnInteraction() {
        // Try to start soundscape immediately
        if (this.audioSystem && this.imageObjects.length > 0) {
            this.startAdaptiveSoundscape();
        }

        // Also set up one-time user interaction handler (for browser autoplay policy)
        const startAudioOnInteraction = async () => {
            if (this.audioSystem && !this.audioSystem.soundscapeActive && this.imageObjects.length > 0) {
                // Resume audio context if suspended
                if (this.audioSystem.audioContext && this.audioSystem.audioContext.state === 'suspended') {
                    await this.audioSystem.audioContext.resume();
                }
                this.startAdaptiveSoundscape();
            }
            // Remove listeners after first interaction
            document.removeEventListener('click', startAudioOnInteraction);
            document.removeEventListener('touchstart', startAudioOnInteraction);
        };

        // Listen for first user interaction
        document.addEventListener('click', startAudioOnInteraction, { once: true });
        document.addEventListener('touchstart', startAudioOnInteraction, { once: true });
    }

    startAdaptiveSoundscape() {
        if (!this.audioSystem || this.imageObjects.length === 0) return;

        // Start the soundscape
        this.audioSystem.startSoundscape(this.imageObjects, this.sceneManager.camera);

        // Adjust volume based on user history
        if (this.personalizationManager) {
            const insights = this.personalizationManager.getUserInsights();
            const adaptiveParams = this.personalizationManager.getAdaptiveParams();

            // For return visitors, start at preferred volume
            // For new users, start quieter and let them adjust
            let initialVolume = 0.7;
            if (insights.visitStats.isReturnVisit) {
                initialVolume = adaptiveParams.audioVolume;
            } else {
                initialVolume = 0.3; // Quieter for first-time users
            }

            // Apply volume after a short delay to ensure audio system is ready
            setTimeout(() => {
                if (this.audioSystem.setMasterVolume) {
                    this.audioSystem.setMasterVolume(initialVolume);
                }
            }, 1000);
        }
    }

    setupXRButton() {
        const xrButton = document.getElementById('xr-button');

        // Set up XR update callback so main.js updates run in XR mode
        this.sceneManager.setXRUpdateCallback(() => {
            this.updateXR();
        });

        // Check if WebXR is available
        if (navigator.xr) {
            navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
                if (supported) {
                    xrButton.disabled = false;
                    xrButton.textContent = 'Enter VR';
                    xrButton.addEventListener('click', () => {
                        this.sceneManager.enterXR();
                    });
                } else {
                    xrButton.textContent = 'VR Not Available';
                }
            });
        } else {
            xrButton.textContent = 'WebXR Not Supported';
        }
    }

    updateXR() {
        // Update device type for gaze tracker (VR mode)
        if (this.gazeTracker) {
            const oldDeviceType = this.gazeTracker.deviceType;
            this.gazeTracker.updateDeviceType();
            const newDeviceType = this.gazeTracker.deviceType;

            // Update personalization if device type changed
            if (oldDeviceType !== newDeviceType && this.personalizationManager) {
                this.personalizationManager.setDeviceType(newDeviceType);
            }
        }

        // Update systems that need to run in XR mode
        // Update gaze tracking with image objects - if available
        if (this.gazeTracker && this.imageObjects.length > 0) {
            this.gazeTracker.detectGaze(this.imageObjects);
        }

        // Update rupture system - if available
        if (this.ruptureSystem) {
            this.ruptureSystem.update();
        }

        // Update soundscape camera reference for XR mode
        if (this.audioSystem && this.audioSystem.soundscapeActive) {
            this.audioSystem.camera = this.sceneManager.camera;
        }

        // Update visual feedback for gazed images
        this.updateImageFeedback();
    }

    handleGazeStart(imageId) {
        console.log('Gaze started on image:', imageId);

        // Find the target object
        const target = this.imageObjects.find(obj =>
            obj.userData?.imageData?.id === imageId || obj.userData?.id === imageId
        );

        if (target) {
            // Update visual feedback
            target.userData.isGazed = true;

            // Track dwell time for rupture system
            if (this.ruptureSystem) {
                this.ruptureSystem.updateDwell(target);
            }
        }
    }

    handleGazeDwell(imageId, duration) {
        // Periodic updates while dwelling
        // Duration is in milliseconds
        const target = this.imageObjects.find(obj =>
            obj.userData?.imageData?.id === imageId || obj.userData?.id === imageId
        );

        if (target) {
            // Update dwell time in userData
            target.userData.dwellTime = duration;

            // Track for rupture system - pass duration from GazeTracker
            if (this.ruptureSystem) {
                this.ruptureSystem.updateDwell(target, duration);
            }
        }
    }

    handleGazeEnd(imageId, duration) {
        console.log('Gaze ended on image:', imageId, 'Duration:', duration, 'ms');

        // Find the target object
        const target = this.imageObjects.find(obj =>
            obj.userData?.imageData?.id === imageId || obj.userData?.id === imageId
        );

        if (target) {
            // Clear visual feedback
            target.userData.isGazed = false;
            target.userData.dwellTime = 0;
        }
    }

    handleGazePattern(patternType) {
        console.log('Gaze pattern detected:', patternType);

        // Pattern types: "dwelling" | "scanning" | "returning"
        // This will drive rupture logic later
        // For now, just log it
    }

    handleRupture(sourceImage, destination) {
        console.log('RUPTURE triggered:', sourceImage, destination);

        // Audio rupture
        this.audioSystem.triggerRupture();

        // Note: Visual rupture effect is handled in RuptureSystem.executeRupture()
    }

    animate() {
        // Update device type for gaze tracker (in case VR was entered/exited)
        if (this.gazeTracker) {
            this.gazeTracker.updateDeviceType();
        }

        // Update gaze tracking with image objects - if available
        if (this.gazeTracker && this.imageObjects.length > 0) {
            this.gazeTracker.detectGaze(this.imageObjects);
        }

        // Update rupture system - if available
        if (this.ruptureSystem) {
            this.ruptureSystem.update();
        }

        // Update visual feedback for gazed images
        this.updateImageFeedback();

        // Update soundscape (continuous updates handled internally, but ensure camera reference is current)
        if (this.audioSystem && this.audioSystem.soundscapeActive) {
            // Camera reference is already set, but ensure it's current
            this.audioSystem.camera = this.sceneManager.camera;
        }

        // Periodically update adaptive parameters (every 5 minutes)
        if (this.personalizationManager && Math.random() < 0.001) { // ~1 in 1000 frames
            this.personalizationManager.updateAdaptiveParams();
            // Reapply to systems if needed
            if (this.ruptureSystem) {
                const params = this.personalizationManager.getAdaptiveParams();
                this.ruptureSystem.setDwellThreshold(params.ruptureThreshold);
                this.ruptureSystem.setTransitionSpeed(params.transitionSpeed);
                this.ruptureSystem.setFadeIntensity(params.visualIntensity);
                this.ruptureSystem.setHighlightIntensity(params.visualIntensity * 1.5);
            }
        }

        // Render
        this.sceneManager.render();

        // Only use requestAnimationFrame when not in XR mode
        // XR mode uses its own animation loop via setAnimationLoop
        if (!this.sceneManager.renderer.xr.isPresenting) {
            requestAnimationFrame(() => this.animate());
        }
    }

    updateImageFeedback() {
        this.imageObjects.forEach(obj => {
            if (obj.userData.isGazed) {
                // Subtle glow or scale effect
                obj.material.emissive.setHex(0x333333);
                obj.scale.setScalar(1.1);
            } else {
                obj.material.emissive.setHex(0x000000);
                obj.scale.setScalar(1.0);
            }
        });
    }

    updatePersonalizedInfoDisplay() {
        if (!this.personalizationManager) {
            this.updateInfoDisplay('Phase 0: Active', '50 Images Loaded | Gaze Detection: Mouse');
            return;
        }

        const visitStats = this.personalizationManager.getVisitStats();
        const insights = this.personalizationManager.getUserInsights();

        let phase = 'Phase 0: Active';
        let instructions = 'Dwell 3s → Rupture | Mouse → Gaze';
        let status = `${this.images.length} Images Loaded | Gaze Detection: Mouse`;

        // Personalize based on visit history
        if (visitStats.isReturnVisit) {
            phase = `Welcome back! Visit #${visitStats.totalVisits}`;
            instructions = `Dwell ${Math.round(this.ruptureSystem?.ruptureThreshold / 1000) || 3}s → Rupture | Mouse → Gaze`;

            if (insights.topImages.mostViewed.length > 0) {
                status += ` | Exploring ${insights.topImages.mostViewed.length} favorites`;
            }
        } else {
            phase = 'Phase 0: Discovery';
            status += ' | First visit - explore freely!';
        }

        // Add experience level indicator
        const level = insights.preferences.experienceLevel;
        if (level === 'expert') {
            instructions += ' | Expert mode: Faster transitions';
        } else if (level === 'experienced') {
            instructions += ' | Experienced: Enhanced visuals';
        }

        this.updateInfoDisplay(phase, status, instructions);
    }

    updateInfoDisplay(phase, status, instructions = 'Dwell 3s → Rupture | Mouse → Gaze') {
        const infoEl = document.getElementById('info');
        if (infoEl) {
            infoEl.innerHTML = `
                <div>${phase}</div>
                <div>${instructions}</div>
                <div>${status}</div>
            `;
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new HumanBlueprint();
    });
} else {
    new HumanBlueprint();
}

