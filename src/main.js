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
        this.gazeTracker = new GazeTracker(this.sceneManager.camera, this.sceneManager.renderer);
        this.ruptureSystem = new RuptureSystem(this.sceneManager, this.gazeTracker);
        this.audioSystem = new AudioSystem();
        
        // Load images
        await this.loadImages();
        
        // Arrange images in 3D space
        this.arrangeImages();
        
        // Start interaction loop
        this.startInteraction();
        
        // Hide loading screen
        document.getElementById('loading').classList.add('hidden');
        
        console.log('Blueprint ready.');
    }
    
    async loadImages() {
        // Phase 0: Load 50 test images
        // For now, we'll use placeholder images or a curated set
        // In production, this would come from the scraping pipeline
        
        const imageCount = 50;
        this.images = await this.imageLoader.loadTestImages(imageCount);
        console.log(`Loaded ${this.images.length} images`);
    }
    
    arrangeImages() {
        // Phase 0: Simple spiral arrangement
        // Later: Multi-dimensional similarity-based arrangement
        
        const positions = this.arrangement.generateSpiralArrangement(this.images.length);
        
        this.imageObjects = this.images.map((imageData, index) => {
            const position = positions[index];
            return this.sceneManager.createImagePlane(imageData, position);
        });
        
        console.log(`Arranged ${this.imageObjects.length} images in 3D space`);
    }
    
    startInteraction() {
        // Set up gaze tracking (mouse-based for Phase 0)
        this.gazeTracker.onGazeChange = (target) => {
            this.handleGaze(target);
        };
        
        // Set up rupture callbacks
        this.ruptureSystem.onRupture = (targetImage, destination) => {
            this.handleRupture(targetImage, destination);
        };
        
        // Start render loop
        this.animate();
    }
    
    handleGaze(target) {
        if (target) {
            // Track dwell time for rupture (this checks threshold and triggers)
            this.ruptureSystem.updateDwell(target);
        }
    }
    
    handleRupture(sourceImage, destination) {
        console.log('RUPTURE triggered:', sourceImage, destination);
        
        // Audio rupture
        this.audioSystem.triggerRupture();
        
        // Note: Visual rupture effect is handled in RuptureSystem.executeRupture()
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Update gaze tracking with image objects
        const gazedTarget = this.gazeTracker.detectGaze(this.imageObjects);
        if (gazedTarget) {
            this.handleGaze(gazedTarget);
        } else if (this.gazeTracker.currentTarget === null) {
            // Clear gaze state when no target
            this.imageObjects.forEach(obj => {
                obj.userData.isGazed = false;
            });
        }
        
        // Update rupture system
        this.ruptureSystem.update();
        
        // Update visual feedback for gazed images
        this.updateImageFeedback();
        
        // Render
        this.sceneManager.render();
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

