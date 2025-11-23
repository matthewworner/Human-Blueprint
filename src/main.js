import { SceneManager } from './core/SceneManager.js';
import { ImageLoader } from './core/ImageLoader.js';
import { ArrangementAlgorithm } from './core/ArrangementAlgorithm.js';
import { GazeTracker } from './core/GazeTracker.js';
import { RuptureSystem } from './core/RuptureSystem.js';
import { AudioSystem } from './core/AudioSystem.js';

class HumanBlueprint {
    constructor() {
        this.sceneManager = null;
        this.imageLoader = null;
        this.arrangement = null;
        this.gazeTracker = null;
        this.ruptureSystem = null;
        this.audioSystem = null;
        
        this.images = [];
        this.imageObjects = [];
        
        this.init();
    }
    
    async init() {
        console.log('Initializing The Human Blueprint...');
        
        // Initialize core systems
        this.sceneManager = new SceneManager(document.getElementById('canvas-container'));
        this.imageLoader = new ImageLoader();
        this.arrangement = new ArrangementAlgorithm();
        
        // Optional systems (for full experience)
        try {
            this.gazeTracker = new GazeTracker(this.sceneManager.camera, this.sceneManager.renderer);
            this.audioSystem = new AudioSystem();
            // Initialize audio system (async, but won't block)
            this.audioSystem.init().catch(err => {
                console.warn('Audio system initialization failed:', err);
            });
            this.ruptureSystem = new RuptureSystem(this.sceneManager, this.gazeTracker, this.audioSystem);
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
            document.getElementById('loading').textContent = 'Error loading images. Check console.';
        };
        
        try {
            // Load images from JSON file
            const loadedImages = await this.imageLoader.loadFromJSON('/images.json');
            this.images = loadedImages;
            
            console.log(`Loaded ${this.images.length} images from JSON`);
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
            loadingEl.textContent = `Loading the blueprint... ${progress.percentage}% (${progress.loaded}/${progress.total})`;
            
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
        
        // Set up click detection
        this.sceneManager.setGlobalImageClickCallback((object, imageData) => {
            this.handleImageClick(object, imageData);
        });
        
        console.log(`Arranged ${this.imageObjects.length} images in 3D space`);
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
                this.handleGazeStart(imageId);
            };
            
            this.gazeTracker.onGazeDwell = (imageId, duration) => {
                this.handleGazeDwell(imageId, duration);
            };
            
            this.gazeTracker.onGazeEnd = (imageId, duration) => {
                this.handleGazeEnd(imageId, duration);
            };
            
            this.gazeTracker.onGazePattern = (patternType) => {
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
            this.audioSystem.startSoundscape(this.imageObjects, this.sceneManager.camera);
        }
        
        // Also set up one-time user interaction handler (for browser autoplay policy)
        const startAudioOnInteraction = async () => {
            if (this.audioSystem && !this.audioSystem.soundscapeActive && this.imageObjects.length > 0) {
                // Resume audio context if suspended
                if (this.audioSystem.audioContext && this.audioSystem.audioContext.state === 'suspended') {
                    await this.audioSystem.audioContext.resume();
                }
                this.audioSystem.startSoundscape(this.imageObjects, this.sceneManager.camera);
            }
            // Remove listeners after first interaction
            document.removeEventListener('click', startAudioOnInteraction);
            document.removeEventListener('touchstart', startAudioOnInteraction);
        };
        
        // Listen for first user interaction
        document.addEventListener('click', startAudioOnInteraction, { once: true });
        document.addEventListener('touchstart', startAudioOnInteraction, { once: true });
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
            this.gazeTracker.updateDeviceType();
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
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new HumanBlueprint();
    });
} else {
    new HumanBlueprint();
}

