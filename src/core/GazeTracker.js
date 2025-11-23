import * as THREE from 'three';

export class GazeTracker {
    constructor(camera, renderer) {
        this.camera = camera;
        this.renderer = renderer;
        this.raycaster = new THREE.Raycaster();
        
        // Device detection
        this.deviceType = this.detectDeviceType();
        
        // Gaze tracking state
        this.currentTarget = null;
        this.currentImageId = null;
        this.dwellStartTime = null;
        this.lastGazeTime = null;
        this.lastTargetChangeTime = null;
        
        // Pattern detection
        this.viewedImages = new Set(); // Track which images have been viewed
        this.gazeHistory = []; // Track recent gaze positions for pattern detection
        this.maxHistoryLength = 10;
        this.scanningThreshold = 500; // ms - rapid target changes = scanning
        this.dwellingThreshold = 2000; // ms - staying on one target = dwelling
        
        // Event callbacks
        this.onGazeStart = null;
        this.onGazeDwell = null;
        this.onGazeEnd = null;
        this.onGazePattern = null;
        
        // Dwell time reporting interval (emit every 500ms while dwelling)
        this.lastDwellReportTime = null;
        this.dwellReportInterval = 500;
        
        // Setup device-specific tracking
        this.setupDeviceTracking();
    }
    
    detectDeviceType() {
        // Detect device type for appropriate gaze tracking
        if (this.renderer.xr && this.renderer.xr.isPresenting) {
            return 'vr';
        }
        
        // Check for mobile device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
            return 'phone';
        }
        
        return 'desktop';
    }
    
    setupDeviceTracking() {
        if (this.deviceType === 'desktop') {
            this.setupDesktopTracking();
        } else if (this.deviceType === 'phone') {
            this.setupPhoneTracking();
        } else if (this.deviceType === 'vr') {
            this.setupVRTracking();
        }
    }
    
    setupDesktopTracking() {
        // Desktop: Raycasting from mouse position
        this.mouse = new THREE.Vector2();
        
        window.addEventListener('mousemove', (event) => {
            const rect = this.renderer.domElement.getBoundingClientRect();
            this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        });
        
        // Also track on touch devices (for desktop with touchscreen)
        window.addEventListener('touchmove', (event) => {
            if (event.touches.length > 0) {
                const rect = this.renderer.domElement.getBoundingClientRect();
                this.mouse.x = ((event.touches[0].clientX - rect.left) / rect.width) * 2 - 1;
                this.mouse.y = -((event.touches[0].clientY - rect.top) / rect.height) * 2 + 1;
            }
        });
    }
    
    setupPhoneTracking() {
        // Phone: Raycasting from device center (screen center)
        this.mouse = new THREE.Vector2(0, 0); // Center of screen
        
        // Optionally track device orientation for more dynamic gaze
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', (event) => {
                // Use device orientation to adjust gaze direction
                // For now, keep it simple with center point
                // Future: could adjust based on beta/gamma angles
            });
        }
        
        // Also track touch position as gaze
        window.addEventListener('touchmove', (event) => {
            if (event.touches.length > 0) {
                const rect = this.renderer.domElement.getBoundingClientRect();
                this.mouse.x = ((event.touches[0].clientX - rect.left) / rect.width) * 2 - 1;
                this.mouse.y = -((event.touches[0].clientY - rect.top) / rect.height) * 2 + 1;
            }
        });
    }
    
    setupVRTracking() {
        // VR: Raycasting from headset gaze direction
        // Use camera forward direction in VR mode
        this.mouse = new THREE.Vector2(0, 0); // Center for forward direction
        
        // In VR, we'll use the camera's forward direction
        // The raycaster will be set from camera position and direction
    }
    
    getGazeDirection() {
        // Returns the ray direction based on device type
        if (this.deviceType === 'vr') {
            // VR: Use camera forward direction
            const direction = new THREE.Vector3(0, 0, -1);
            direction.applyQuaternion(this.camera.quaternion);
            return {
                origin: this.camera.position.clone(),
                direction: direction
            };
        } else {
            // Desktop/Phone: Use mouse position
            return {
                origin: null, // Will use camera position
                direction: null // Will use mouse-based raycast
            };
        }
    }
    
    detectGaze(objects) {
        const now = Date.now();
        let target = null;
        let imageId = null;
        
        // Perform raycast based on device type
        if (this.deviceType === 'vr') {
            // VR: Raycast from camera forward
            const direction = new THREE.Vector3(0, 0, -1);
            direction.applyQuaternion(this.camera.quaternion);
            this.raycaster.set(this.camera.position, direction);
        } else {
            // Desktop/Phone: Raycast from mouse position
            this.raycaster.setFromCamera(this.mouse, this.camera);
        }
        
        const intersects = this.raycaster.intersectObjects(objects, true);
        
        if (intersects.length > 0) {
            target = intersects[0].object;
            imageId = target.userData?.imageData?.id || target.userData?.id || null;
        }
        
        // Handle gaze state changes
        if (target !== this.currentTarget) {
            // Target changed
            const previousImageId = this.currentImageId;
            
            // End gaze on previous target
            if (this.currentTarget && previousImageId) {
                const dwellDuration = this.dwellStartTime ? now - this.dwellStartTime : 0;
                this.emitGazeEnd(previousImageId, dwellDuration);
            }
            
            // Start gaze on new target
            this.currentTarget = target;
            this.currentImageId = imageId;
            this.dwellStartTime = now;
            this.lastGazeTime = now;
            this.lastDwellReportTime = now;
            
            if (imageId) {
                // Check if this is a returning gaze
                const isReturning = this.viewedImages.has(imageId);
                
                // Add to viewed images
                this.viewedImages.add(imageId);
                
                // Emit gaze start
                this.emitGazeStart(imageId);
                
                // Detect pattern
                if (isReturning) {
                    this.emitGazePattern('returning');
                } else {
                    // Check if rapid scanning
                    if (this.lastTargetChangeTime && (now - this.lastTargetChangeTime) < this.scanningThreshold) {
                        this.emitGazePattern('scanning');
                    }
                }
                
                this.lastTargetChangeTime = now;
            }
        } else if (this.currentTarget && imageId) {
            // Same target - update dwell time
            const dwellDuration = now - this.dwellStartTime;
            
            // Emit periodic dwell updates
            if (!this.lastDwellReportTime || (now - this.lastDwellReportTime) >= this.dwellReportInterval) {
                this.emitGazeDwell(imageId, dwellDuration);
                this.lastDwellReportTime = now;
            }
            
            // Detect dwelling pattern (staying on one target)
            if (dwellDuration >= this.dwellingThreshold) {
                this.emitGazePattern('dwelling');
            }
            
            this.lastGazeTime = now;
        } else if (this.currentTarget && !target) {
            // Looked away from current target
            const previousImageId = this.currentImageId;
            const dwellDuration = this.dwellStartTime ? now - this.dwellStartTime : 0;
            
            this.emitGazeEnd(previousImageId, dwellDuration);
            
            this.currentTarget = null;
            this.currentImageId = null;
            this.dwellStartTime = null;
            this.lastDwellReportTime = null;
        }
        
        // Update gaze history for pattern detection
        if (imageId) {
            this.gazeHistory.push({
                imageId: imageId,
                timestamp: now
            });
            
            // Keep history limited
            if (this.gazeHistory.length > this.maxHistoryLength) {
                this.gazeHistory.shift();
            }
        }
        
        return this.currentTarget;
    }
    
    emitGazeStart(imageId) {
        if (this.onGazeStart && imageId) {
            this.onGazeStart(imageId);
        }
    }
    
    emitGazeDwell(imageId, duration) {
        if (this.onGazeDwell && imageId) {
            this.onGazeDwell(imageId, duration);
        }
    }
    
    emitGazeEnd(imageId, duration) {
        if (this.onGazeEnd && imageId) {
            this.onGazeEnd(imageId, duration);
        }
    }
    
    emitGazePattern(patternType) {
        if (this.onGazePattern) {
            this.onGazePattern(patternType);
        }
    }
    
    // Update device type (call when entering/exiting VR)
    updateDeviceType() {
        const newDeviceType = this.detectDeviceType();
        if (newDeviceType !== this.deviceType) {
            this.deviceType = newDeviceType;
            this.setupDeviceTracking();
        }
    }
    
    // Get current gaze state
    getCurrentGaze() {
        return {
            target: this.currentTarget,
            imageId: this.currentImageId,
            dwellTime: this.dwellStartTime ? Date.now() - this.dwellStartTime : 0,
            deviceType: this.deviceType
        };
    }
    
    // Reset gaze tracking (useful for rupture events)
    reset() {
        if (this.currentImageId) {
            const dwellDuration = this.dwellStartTime ? Date.now() - this.dwellStartTime : 0;
            this.emitGazeEnd(this.currentImageId, dwellDuration);
        }
        
        this.currentTarget = null;
        this.currentImageId = null;
        this.dwellStartTime = null;
        this.lastDwellReportTime = null;
    }
}


