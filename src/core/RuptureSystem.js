import * as THREE from 'three';

export class RuptureSystem {
    constructor(sceneManager, gazeTracker) {
        this.sceneManager = sceneManager;
        this.gazeTracker = gazeTracker;
        
        this.dwellTimes = new Map(); // Track dwell time per object
        this.ruptureThreshold = 3000; // 3 seconds of dwelling triggers rupture
        this.ruptureCooldown = 10000; // 10 seconds between ruptures
        this.lastRuptureTime = 0;
        
        this.onRupture = null;
    }
    
    update() {
        // Update is called from main loop
        // Dwell tracking happens in GazeTracker
    }
    
    updateDwell(target) {
        if (!target) {
            return;
        }
        
        const now = Date.now();
        
        // Initialize or update dwell time
        if (!this.dwellTimes.has(target)) {
            this.dwellTimes.set(target, { start: now, current: now });
        } else {
            const dwell = this.dwellTimes.get(target);
            dwell.current = now;
            
            const totalDwell = now - dwell.start;
            
            // Check if rupture should trigger
            if (totalDwell >= this.ruptureThreshold) {
                // Check cooldown
                if (now - this.lastRuptureTime > this.ruptureCooldown) {
                    this.triggerRupture(target);
                }
            }
        }
    }
    
    triggerRupture(sourceImage) {
        console.log('Rupture triggered from:', sourceImage.userData.imageData);
        
        // Find a distant image to rupture to
        const destination = this.findDistantImage(sourceImage);
        
        if (destination) {
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
    
    findDistantImage(sourceImage) {
        // Phase 0: Find a random distant image
        // Phase 1+: Find image with connecting thread but distant time/place
        
        const allImages = Array.from(this.sceneManager.scene.children)
            .filter(child => child.userData?.imageData && child !== sourceImage);
        
        if (allImages.length === 0) return null;
        
        // For Phase 0, just pick a random one
        // Later: Use ArrangementAlgorithm to find connected but distant images
        const randomIndex = Math.floor(Math.random() * allImages.length);
        return allImages[randomIndex];
    }
    
    executeRupture(sourceImage, destination) {
        // Visual rupture effect
        this.createRuptureEffect(sourceImage, destination);
        
        // Transport camera to destination
        const destPosition = destination.position.clone();
        destPosition.z += 5; // Offset camera position
        
        // Add some randomness to camera angle
        destPosition.x += (Math.random() - 0.5) * 2;
        destPosition.y += (Math.random() - 0.5) * 2;
        
        this.sceneManager.moveCamera(destPosition, 1500);
        
        // Reset gaze tracking
        this.gazeTracker.currentTarget = null;
        this.gazeTracker.dwellStartTime = null;
    }
    
    createRuptureEffect(sourceImage, destination) {
        // Phase 0: Simple visual crack effect
        // Phase 1+: More dramatic rupture with connecting thread visualization
        
        // Flash effect
        const flash = new THREE.Color(0xffffff);
        this.sceneManager.scene.background = flash;
        
        setTimeout(() => {
            this.sceneManager.scene.background = new THREE.Color(0x000000);
        }, 100);
        
        // Source image pulse
        const originalScale = sourceImage.scale.clone();
        sourceImage.scale.multiplyScalar(1.5);
        sourceImage.material.emissive.setHex(0xffffff);
        
        setTimeout(() => {
            sourceImage.scale.copy(originalScale);
            sourceImage.material.emissive.setHex(0x000000);
        }, 300);
        
        // Destination highlight
        destination.material.emissive.setHex(0x444444);
        setTimeout(() => {
            destination.material.emissive.setHex(0x000000);
        }, 2000);
    }
}

