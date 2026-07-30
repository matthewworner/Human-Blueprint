/**
 * DwellProgressIndicator - Visual circular progress for gaze dwell time
 * Shows how close the user is to triggering a rupture
 */
import * as THREE from 'three';

export class DwellProgressIndicator {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        
        // Create progress ring
        this.createProgressRing();
        
        // State
        this.targetObject = null;
        this.dwellStartTime = null;
        this.dwellDuration = 3000; // 3 seconds default
        this.isActive = false;
    }
    
    createProgressRing() {
        // Create ring geometry (circle with hole)
        const radius = 0.8;
        const segments = 64;
        const geometry = new THREE.RingGeometry(radius, radius + 0.03, segments);
        
        // Create material
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide
        });
        
        // Create mesh
        this.ring = new THREE.Mesh(geometry, material);
        this.ring.rotation.x = -Math.PI / 2; // Face camera
        this.ring.position.y = 0.5; // Slightly above image
        
        this.scene.add(this.ring);
    }
    
    /**
     * Start tracking dwell on an object
     */
    startDwell(object, duration = 3000) {
        this.targetObject = object;
        this.dwellStartTime = Date.now();
        this.dwellDuration = duration;
        this.isActive = true;
        
        // Position ring at object
        if (object) {
            this.ring.position.copy(object.position);
            this.ring.position.y += 0.5;
        }
    }
    
    /**
     * Update progress (called every frame)
     */
    update() {
        if (!this.isActive || !this.targetObject) {
            // Fade out ring
            if (this.ring.material.opacity > 0) {
                this.ring.material.opacity = Math.max(0, this.ring.material.opacity - 0.1);
            }
            return;
        }
        
        // Calculate progress
        const elapsed = Date.now() - this.dwellStartTime;
        const progress = Math.min(1, elapsed / this.dwellDuration);
        
        // Update ring appearance
        this.ring.material.opacity = 0.6 * progress;
        
        // Rotate ring for visual interest
        this.ring.rotation.z += 0.02;
        
        // Pulse when near completion
        if (progress > 0.8) {
            const pulse = Math.sin(elapsed * 0.02) * 0.2 + 1;
            this.ring.scale.setScalar(pulse);
        }
        
        // Face camera
        this.ring.lookAt(this.camera.position);
        
        // Update ring to show progress (using geometry clipping)
        // We'll use a dashed appearance via material
        this.ring.material.opacity = 0.3 + progress * 0.5;
    }
    
    /**
     * End dwell tracking
     */
    endDwell() {
        this.targetObject = null;
        this.dwellStartTime = null;
        this.isActive = false;
        this.ring.scale.setScalar(1);
    }
    
    /**
     * Set dwell duration
     */
    setDuration(duration) {
        this.dwellDuration = duration;
    }
    
    /**
     * Destroy indicator
     */
    destroy() {
        this.scene.remove(this.ring);
        this.ring.geometry.dispose();
        this.ring.material.dispose();
    }
}