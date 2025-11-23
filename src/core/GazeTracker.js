import * as THREE from 'three';

export class GazeTracker {
    constructor(camera, renderer) {
        this.camera = camera;
        this.renderer = renderer;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        this.currentTarget = null;
        this.dwellStartTime = null;
        this.dwellThreshold = 2000; // 2 seconds for Phase 0
        
        // Phase 0: Mouse-based gaze
        // Phase 1+: Eye tracking (WebXR)
        
        this.setupMouseTracking();
    }
    
    setupMouseTracking() {
        // Track mouse movement as gaze proxy
        window.addEventListener('mousemove', (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        });
        
        // Also track on touch devices
        window.addEventListener('touchmove', (event) => {
            if (event.touches.length > 0) {
                this.mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
                this.mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
            }
        });
    }
    
    update() {
        // Update raycaster with current mouse position
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Find all image planes in scene
        const imageObjects = this.camera.parent
            ? this.camera.parent.children.filter(child => child.userData?.imageData)
            : [];
        
        // For now, we'll need to get objects from scene
        // This is a simplified version - in production, maintain object list
    }
    
    // Called from main loop with scene objects
    detectGaze(objects) {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(objects, true);
        
        if (intersects.length > 0) {
            const target = intersects[0].object;
            
            // Check if this is a new target
            if (target !== this.currentTarget) {
                this.currentTarget = target;
                this.dwellStartTime = Date.now();
                
                if (this.onGazeChange) {
                    this.onGazeChange(target);
                }
            } else {
                // Same target - check dwell time
                const dwellTime = Date.now() - this.dwellStartTime;
                if (dwellTime >= this.dwellThreshold) {
                    // Dwell threshold reached
                    if (this.onDwellThreshold) {
                        this.onDwellThreshold(target, dwellTime);
                    }
                }
            }
        } else {
            // No target
            if (this.currentTarget) {
                this.currentTarget = null;
                this.dwellStartTime = null;
                
                if (this.onGazeChange) {
                    this.onGazeChange(null);
                }
            }
        }
        
        return this.currentTarget;
    }
    
    // Future: WebXR eye tracking
    setupEyeTracking(xrSession) {
        // This will be implemented when WebXR is added
        // For now, mouse tracking is the fallback
    }
}

