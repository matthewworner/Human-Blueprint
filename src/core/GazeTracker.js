import * as THREE from 'three';

export class GazeTracker {
    constructor(camera, renderer) {
        this.camera = camera;
        this.renderer = renderer;
        this.raycaster = new THREE.Raycaster();

        // Device detection
        this.deviceType = this.detectDeviceType();

        // WebXR eye tracking
        this.xrSession = null;
        this.xrReferenceSpace = null;
        this.eyeTrackingSupported = false;
        this.eyeTrackingEnabled = false;

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
            // Check for Vision Pro specifically
            const isVisionPro = this.detectVisionPro();
            if (isVisionPro) {
                return 'vision_pro';
            }
            return 'vr';
        }

        // Check for mobile device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
            return 'phone';
        }

        return 'desktop';
    }

    detectVisionPro() {
        // Vision Pro detection based on user agent and WebXR capabilities
        const userAgent = navigator.userAgent;
        const platform = navigator.platform;

        // Vision Pro specific indicators
        const visionProIndicators = [
            'Vision Pro',
            'Apple Vision',
            'Reality Pro'
        ];

        const hasVisionProUA = visionProIndicators.some(indicator =>
            userAgent.includes(indicator) || platform.includes(indicator)
        );

        // Also check for high-precision eye tracking capabilities
        const hasHighPrecisionEyeTracking = navigator.xr &&
            navigator.xr.isSessionSupported &&
            this.eyeTrackingSupported === true;

        return hasVisionProUA || (hasHighPrecisionEyeTracking && this.checkVisionProCapabilities());
    }

    async checkVisionProCapabilities() {
        // Check for Vision Pro specific WebXR features
        if (!navigator.xr) return false;

        try {
            const supported = await navigator.xr.isSessionSupported('immersive-vr', {
                requiredFeatures: ['eye-tracking', 'hit-test', 'anchors']
            });
            return supported;
        } catch (error) {
            return false;
        }
    }

    async checkEyeTrackingSupport() {
        if (!navigator.xr) return false;

        try {
            // Check if eye tracking is supported
            const supported = await navigator.xr.isSessionSupported('immersive-vr', {
                requiredFeatures: ['eye-tracking']
            });
            return supported;
        } catch (error) {
            console.log('Eye tracking support check failed:', error);
            return false;
        }
    }

    async initializeEyeTracking(session) {
        this.xrSession = session;
        this.eyeTrackingSupported = await this.checkEyeTrackingSupport();

        if (this.eyeTrackingSupported) {
            try {
                // Request eye-level reference space for eye tracking
                this.xrReferenceSpace = await this.xrSession.requestReferenceSpace('eye-level');
                this.eyeTrackingEnabled = true;
                console.log('WebXR eye tracking initialized');
            } catch (error) {
                console.warn('Failed to initialize eye tracking:', error);
                this.eyeTrackingEnabled = false;
            }
        } else {
            console.log('Eye tracking not supported');
            this.eyeTrackingEnabled = false;
        }
    }
    
    setupDeviceTracking() {
        if (this.deviceType === 'desktop') {
            this.setupDesktopTracking();
        } else if (this.deviceType === 'phone') {
            this.setupPhoneTracking();
        } else if (this.deviceType === 'vision_pro') {
            this.setupVisionProTracking();
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
        this.mouse = new THREE.Vector2(0, 0); // Center for forward direction

        // Initialize eye tracking if session is available
        if (this.renderer.xr && this.renderer.xr.getSession) {
            const session = this.renderer.xr.getSession();
            if (session) {
                this.initializeEyeTracking(session);
            }
        }

        // Listen for session start events to initialize eye tracking
        if (this.renderer.xr) {
            this.renderer.xr.addEventListener('sessionstart', (event) => {
                this.initializeEyeTracking(event.target.getSession());
            });

            this.renderer.xr.addEventListener('sessionend', () => {
                this.eyeTrackingEnabled = false;
                this.xrSession = null;
                this.xrReferenceSpace = null;
            });
        }
    }

    setupVisionProTracking() {
        // Vision Pro: High-precision eye tracking with optimized parameters
        this.mouse = new THREE.Vector2(0, 0);

        // Vision Pro specific optimizations
        this.visionProSmoothing = 0.3; // Smoother gaze for Vision Pro's precision
        this.visionProPrediction = 0.02; // Slight prediction for latency compensation
        this.visionProConfidenceThreshold = 0.95; // Higher confidence required

        // Initialize eye tracking with Vision Pro optimizations
        if (this.renderer.xr && this.renderer.xr.getSession) {
            const session = this.renderer.xr.getSession();
            if (session) {
                this.initializeVisionProEyeTracking(session);
            }
        }

        // Listen for session events
        if (this.renderer.xr) {
            this.renderer.xr.addEventListener('sessionstart', (event) => {
                this.initializeVisionProEyeTracking(event.target.getSession());
            });

            this.renderer.xr.addEventListener('sessionend', () => {
                this.eyeTrackingEnabled = false;
                this.xrSession = null;
                this.xrReferenceSpace = null;
            });
        }
    }

    async initializeVisionProEyeTracking(session) {
        this.xrSession = session;
        this.eyeTrackingSupported = await this.checkEyeTrackingSupport();

        if (this.eyeTrackingSupported) {
            try {
                // Request eye-level reference space optimized for Vision Pro
                this.xrReferenceSpace = await this.xrSession.requestReferenceSpace('eye-level');

                // Vision Pro specific: Request additional features for better tracking
                const eyeTrackingFeature = await this.xrSession.requestReferenceSpace('eye-tracking');
                if (eyeTrackingFeature) {
                    this.eyeTrackingEnabled = true;
                    console.log('Vision Pro eye tracking initialized with high precision');
                } else {
                    // Fallback to standard eye tracking
                    this.eyeTrackingEnabled = true;
                    console.log('Vision Pro eye tracking initialized (standard mode)');
                }
            } catch (error) {
                console.warn('Failed to initialize Vision Pro eye tracking:', error);
                this.eyeTrackingEnabled = false;
            }
        } else {
            console.log('Vision Pro eye tracking not supported');
            this.eyeTrackingEnabled = false;
        }
    }
    
    getGazeDirection() {
        // Returns the ray direction based on device type
        if (this.deviceType === 'vision_pro') {
            return this.getVisionProGazeDirection();
        } else if (this.deviceType === 'vr') {
            if (this.eyeTrackingEnabled && this.xrSession && this.xrReferenceSpace) {
                // Use WebXR eye tracking data
                const frame = this.renderer.xr.getFrame();
                if (frame) {
                    const pose = frame.getViewerPose(this.xrReferenceSpace);
                    if (pose && pose.views.length > 0) {
                        // Use the first view's transform for gaze direction
                        const view = pose.views[0];
                        const matrix = new THREE.Matrix4();
                        matrix.fromArray(view.transform.matrix);

                        const direction = new THREE.Vector3(0, 0, -1);
                        direction.applyMatrix4(matrix);

                        const position = new THREE.Vector3();
                        position.setFromMatrixPosition(matrix);

                        return {
                            origin: position,
                            direction: direction
                        };
                    }
                }
            }

            // Fallback: Use camera forward direction
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

    getVisionProGazeDirection() {
        if (this.eyeTrackingEnabled && this.xrSession && this.xrReferenceSpace) {
            const frame = this.renderer.xr.getFrame();
            if (frame) {
                const pose = frame.getViewerPose(this.xrReferenceSpace);
                if (pose && pose.views.length > 0) {
                    // Vision Pro: Use more precise eye tracking data
                    const view = pose.views[0];
                    const matrix = new THREE.Matrix4();
                    matrix.fromArray(view.transform.matrix);

                    let direction = new THREE.Vector3(0, 0, -1);
                    direction.applyMatrix4(matrix);

                    const position = new THREE.Vector3();
                    position.setFromMatrixPosition(matrix);

                    // Vision Pro optimizations: smoothing and prediction
                    if (!this.lastVisionProDirection) {
                        this.lastVisionProDirection = direction.clone();
                        this.lastVisionProPosition = position.clone();
                    }

                    // Apply smoothing
                    direction.lerp(this.lastVisionProDirection, this.visionProSmoothing);
                    position.lerp(this.lastVisionProPosition, this.visionProSmoothing);

                    // Store for next frame
                    this.lastVisionProDirection = direction.clone();
                    this.lastVisionProPosition = position.clone();

                    // Add slight prediction for latency compensation
                    const predictedDirection = direction.clone();
                    const velocity = this.calculateGazeVelocity();
                    predictedDirection.add(velocity.multiplyScalar(this.visionProPrediction));

                    return {
                        origin: position,
                        direction: predictedDirection,
                        confidence: this.getVisionProConfidence(frame)
                    };
                }
            }
        }

        // Fallback: Use camera forward direction
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(this.camera.quaternion);
        return {
            origin: this.camera.position.clone(),
            direction: direction,
            confidence: 0.5
        };
    }

    calculateGazeVelocity() {
        // Calculate gaze direction velocity for prediction
        if (!this.previousGazeDirection) {
            this.previousGazeDirection = new THREE.Vector3(0, 0, -1);
            return new THREE.Vector3(0, 0, 0);
        }

        const currentDirection = this.lastVisionProDirection || new THREE.Vector3(0, 0, -1);
        const velocity = currentDirection.clone().sub(this.previousGazeDirection);
        this.previousGazeDirection = currentDirection.clone();

        return velocity;
    }

    getVisionProConfidence(frame) {
        // Vision Pro specific confidence calculation
        // In a real implementation, this would use eye tracking quality metrics
        if (frame && frame.getViewerPose) {
            const pose = frame.getViewerPose(this.xrReferenceSpace);
            if (pose && pose.views.length > 0) {
                // Simplified confidence based on pose stability
                return Math.min(1.0, pose.views[0].transform ? 1.0 : 0.8);
            }
        }
        return 0.5;
    }
    
    detectGaze(objects) {
        const now = Date.now();
        let target = null;
        let imageId = null;
        
        // Perform raycast based on device type
        if (this.deviceType === 'vision_pro' || this.deviceType === 'vr') {
            // Vision Pro/VR: Use gaze direction (eye tracking if available, otherwise camera forward)
            const gazeData = this.getGazeDirection();

            // For Vision Pro, only use high-confidence gaze
            if (this.deviceType === 'vision_pro' && gazeData.confidence < this.visionProConfidenceThreshold) {
                // Fallback to camera forward for low confidence
                const direction = new THREE.Vector3(0, 0, -1);
                direction.applyQuaternion(this.camera.quaternion);
                this.raycaster.set(this.camera.position.clone(), direction);
            } else {
                this.raycaster.set(gazeData.origin, gazeData.direction);
            }
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
        const gazeData = this.getGazeDirection();
        return {
            target: this.currentTarget,
            imageId: this.currentImageId,
            dwellTime: this.dwellStartTime ? Date.now() - this.dwellStartTime : 0,
            deviceType: this.deviceType,
            eyeTrackingEnabled: this.eyeTrackingEnabled,
            eyeTrackingSupported: this.eyeTrackingSupported,
            confidence: gazeData.confidence || 1.0,
            visionProOptimizations: this.deviceType === 'vision_pro' ? {
                smoothing: this.visionProSmoothing,
                prediction: this.visionProPrediction,
                confidenceThreshold: this.visionProConfidenceThreshold
            } : null
        };
    }

    // Get eye tracking status
    getEyeTrackingStatus() {
        return {
            supported: this.eyeTrackingSupported,
            enabled: this.eyeTrackingEnabled,
            sessionActive: this.xrSession !== null
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


