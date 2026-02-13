import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PostProcessManager } from './PostProcessManager.js';

export class SceneManager {
    constructor(container) {
        this.container = container;

        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);

        // Camera - positioned to view flat collage from front
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            10000
        );
        this.camera.position.set(0, 0, 50); // Further back to see 3D arrangement
        this.camera.lookAt(0, 0, 0); // Look at center

        // Renderer with WebXR support
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Enable WebXR
        this.renderer.xr.enabled = true;
        // Note: Animation loop will be set when entering XR mode
        // For desktop, main.js will handle the animation loop

        this.container.appendChild(this.renderer.domElement);

        // Orbit Controls for development (mouse navigation)
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.target.set(0, 0, 0); // Look at center of flat collage
        this.controls.enableRotate = true; // Allow rotation to view from different angles
        this.controls.update();

        // Lighting - appropriate for viewing images
        // Ambient light for overall illumination
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Main directional light from front
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(0, 0, 10);
        this.scene.add(mainLight);

        // Fill light from side
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-5, 2, 5);
        this.scene.add(fillLight);

        // Handle resize
        window.addEventListener('resize', () => this.onWindowResize());

        // Raycaster for interaction
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Click detection
        this.clickCallbacks = new Map(); // Image ID -> callback
        this.setupClickDetection();

        // WebXR session management
        this.xrSession = null;
        this.xrUpdateCallback = null; // Callback for XR mode updates
        this.gazeTracker = null; // Reference to gaze tracker for eye tracking
        this.setupWebXR();

        // Post-processing effects
        this.postProcessManager = new PostProcessManager(this.scene, this.camera, this.renderer);
    }

    setupClickDetection() {
        // Mouse click detection
        this.renderer.domElement.addEventListener('click', (event) => {
            this.handleClick(event);
        });

        // Touch support
        this.renderer.domElement.addEventListener('touchend', (event) => {
            event.preventDefault();
            if (event.changedTouches.length > 0) {
                const touch = event.changedTouches[0];
                this.handleClick({
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
            }
        });
    }

    handleClick(event) {
        // Convert click position to normalized device coordinates
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Raycast
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Find all image planes
        const imageObjects = [];
        this.scene.traverse((child) => {
            if (child.userData?.imageData) {
                imageObjects.push(child);
            }
        });

        const intersects = this.raycaster.intersectObjects(imageObjects, true);

        if (intersects.length > 0) {
            const clickedObject = intersects[0].object;
            const imageData = clickedObject.userData.imageData;

            // Trigger callback if registered
            if (this.clickCallbacks.has(imageData.id)) {
                this.clickCallbacks.get(imageData.id)(clickedObject, imageData);
            }

            // Also trigger generic click callback
            if (this.onImageClick) {
                this.onImageClick(clickedObject, imageData);
            }
        }
    }

    /**
     * Register click callback for specific image
     * @param {string} imageId - Image ID
     * @param {Function} callback - Callback function
     */
    registerImageClickCallback(imageId, callback) {
        if (typeof callback === 'function') {
            this.clickCallbacks.set(imageId, callback);
        }
    }

    /**
     * Register global image click callback
     * @param {Function} callback - Callback function
     */
    setGlobalImageClickCallback(callback) {
        this.onImageClick = callback;
    }

    setXRUpdateCallback(callback) {
        this.xrUpdateCallback = callback;
    }

    setGazeTracker(gazeTracker) {
        this.gazeTracker = gazeTracker;
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

    async setupWebXR() {
        // Check if WebXR is available
        if (navigator.xr) {
            try {
                // Check if immersive VR is supported
                const isVRSupported = await navigator.xr.isSessionSupported('immersive-vr');
                if (isVRSupported) {
                    console.log('WebXR immersive-vr is supported');
                }

                // Check if immersive AR is supported
                const isARSupported = await navigator.xr.isSessionSupported('immersive-ar');
                if (isARSupported) {
                    console.log('WebXR immersive-ar is supported');
                }

                // Check for advanced VR features
                const eyeTrackingSupported = await this.checkEyeTrackingSupport();
                if (eyeTrackingSupported) {
                    console.log('WebXR eye tracking is supported');
                }

                // Check for hand tracking
                const handTrackingSupported = await navigator.xr.isSessionSupported('immersive-vr', {
                    requiredFeatures: ['hand-tracking']
                });
                if (handTrackingSupported) {
                    console.log('WebXR hand tracking is supported');
                }

            } catch (error) {
                console.log('WebXR feature detection failed:', error);
            }
        } else {
            console.log('WebXR API not available in this browser');
        }
    }

    async enterXR() {
        if (!this.renderer.xr.enabled) {
            return;
        }

        try {
            // Check for eye tracking support
            const eyeTrackingSupported = await this.checkEyeTrackingSupport();

            // Request immersive VR session with enhanced features
            const sessionInit = {
                requiredFeatures: ['local-floor'],
                optionalFeatures: ['bounded-floor', 'hand-tracking']
            };

            // Add eye tracking if supported
            if (eyeTrackingSupported) {
                sessionInit.optionalFeatures.push('eye-tracking');
                console.log('Requesting eye tracking feature');
            }

            const session = await navigator.xr.requestSession('immersive-vr', sessionInit);

            this.xrSession = session;
            this.renderer.xr.setSession(session);

            // Notify gaze tracker about the session for eye tracking initialization
            if (this.gazeTracker && typeof this.gazeTracker.initializeEyeTracking === 'function') {
                await this.gazeTracker.initializeEyeTracking(session);
            }

            // Set animation loop for XR mode
            this.renderer.xr.setAnimationLoop(() => {
                // Call update callback if provided (for gaze tracking, rupture system, etc.)
                if (this.xrUpdateCallback) {
                    this.xrUpdateCallback();
                }
                this.render();
            });

            console.log('Entered WebXR immersive mode with enhanced features');
        } catch (error) {
            console.error('Failed to enter WebXR:', error);
        }
    }

    exitXR() {
        if (this.xrSession) {
            this.xrSession.end();
            this.xrSession = null;
            // Clear XR animation loop - return to normal render loop
            this.renderer.xr.setAnimationLoop(null);

            // Notify gaze tracker to disable eye tracking
            if (this.gazeTracker) {
                this.gazeTracker.eyeTrackingEnabled = false;
                this.gazeTracker.xrSession = null;
                this.gazeTracker.xrReferenceSpace = null;
            }

            console.log('Exited WebXR immersive mode');
        }
    }

    createImagePlane(imageData, position = null) {
        // Use position from imageData if not provided
        // Handle both {x, y, z} object and [x, y, z] array formats
        let pos;
        if (position) {
            pos = Array.isArray(position) ? { x: position[0], y: position[1], z: position[2] } : position;
        } else if (imageData.position) {
            pos = Array.isArray(imageData.position)
                ? { x: imageData.position[0], y: imageData.position[1], z: imageData.position[2] }
                : imageData.position;
        } else {
            pos = { x: 0, y: 0, z: 0 };
        }

        // Create plane geometry - smaller for collage effect, maintain aspect ratio
        // Use 1.0x1.0 for square-ish images, or adjust based on image aspect
        const geometry = new THREE.PlaneGeometry(1.0, 1.0);

        // Use texture from imageData or create placeholder
        const texture = imageData.texture || this.createPlaceholderTexture(imageData);

        // Ensure texture is properly configured
        if (texture) {
            texture.flipY = true; // Fix upside-down images
            texture.needsUpdate = true;
        }

        // Log if using placeholder
        if (!imageData.texture && imageData.url) {
            console.warn(`Using placeholder for ${imageData.id} - texture not loaded yet`);
        } else if (imageData.texture) {
            console.log(`Using loaded texture for ${imageData.id}`);
        }

        const material = new THREE.MeshStandardMaterial({
            map: texture,
            side: THREE.DoubleSide,
            emissive: 0x000000,
            transparent: false,
            // Better for displaying images
            roughness: 0.5,
            metalness: 0.0
        });

        const plane = new THREE.Mesh(geometry, material);

        // Position in 3D space (use full coordinates from UMAP or JSON data)
        plane.position.set(pos.x, pos.y, pos.z);

        // Store image metadata (preserve all imageData)
        plane.userData = {
            imageData: imageData,
            originalPosition: new THREE.Vector3(pos.x, pos.y, pos.z),
            isGazed: false,
            dwellTime: 0,
            id: imageData.id,
            material: material // Store reference for texture updates
        };

        // Make plane clickable/gazeable
        plane.userData.isImage = true;

        // If texture is still loading, update material when it loads
        if (imageData.url && !imageData.texture && !imageData.metadata?.isPlaceholder) {
            // Texture might be loading asynchronously - update when ready
            this.updateTextureWhenReady(plane, imageData);
        }

        this.scene.add(plane);

        return plane;
    }

    async loadTestImageFromURL(url, position = { x: 0, y: 0, z: 0 }) {
        return new Promise((resolve, reject) => {
            const loader = new THREE.TextureLoader();

            loader.load(
                url,
                (texture) => {
                    // Create plane geometry
                    const geometry = new THREE.PlaneGeometry(2, 2);

                    const material = new THREE.MeshStandardMaterial({
                        map: texture,
                        side: THREE.DoubleSide,
                        emissive: 0x000000
                    });

                    const plane = new THREE.Mesh(geometry, material);
                    plane.position.set(position.x, position.y, position.z);

                    // Store image metadata
                    plane.userData = {
                        imageData: { url: url },
                        originalPosition: position,
                        isGazed: false,
                        dwellTime: 0
                    };

                    this.scene.add(plane);
                    resolve(plane);
                },
                undefined,
                (error) => {
                    console.error('Error loading image:', error);
                    reject(error);
                }
            );
        });
    }

    /**
     * Update texture when it loads asynchronously
     * @param {THREE.Mesh} plane - The image plane
     * @param {Object} imageData - Image data
     */
    async updateTextureWhenReady(plane, imageData) {
        if (!imageData.url) return;

        try {
            // Try loading texture again (might have been cached by now)
            const loader = new THREE.TextureLoader();
            loader.load(
                imageData.url,
                (texture) => {
                    texture.flipY = true; // Fix upside-down images
                    texture.needsUpdate = true;
                    plane.userData.material.map = texture;
                    plane.userData.material.needsUpdate = true;
                    plane.userData.imageData.texture = texture;
                    console.log(`Texture updated for ${imageData.id}`);
                },
                undefined,
                (error) => {
                    console.warn(`Could not update texture for ${imageData.id}:`, error);
                }
            );
        } catch (error) {
            console.warn(`Error updating texture for ${imageData.id}:`, error);
        }
    }

    createPlaceholderTexture(imageData = null) {
        // Create a simple colored texture as placeholder
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Use image ID for consistent color, or random
        let hue = 0;
        if (imageData?.id) {
            // Generate consistent color from ID
            let hash = 0;
            for (let i = 0; i < imageData.id.length; i++) {
                hash = imageData.id.charCodeAt(i) + ((hash << 5) - hash);
            }
            hue = Math.abs(hash) % 360;
        } else {
            hue = Math.random() * 360;
        }

        ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
        ctx.fillRect(0, 0, 512, 512);

        // Add some pattern
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        for (let i = 0; i < 20; i++) {
            ctx.fillRect(
                Math.random() * 512,
                Math.random() * 512,
                Math.random() * 100,
                Math.random() * 100
            );
        }

        // Add text if imageData has info
        if (imageData?.id) {
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.font = '24px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(imageData.id.substring(0, 20), 256, 256);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.flipY = true; // Fix upside-down images
        return texture;
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        if (this.postProcessManager) {
            this.postProcessManager.setSize(window.innerWidth, window.innerHeight);
        }
    }

    render() {
        // Update orbit controls (only when not in XR)
        if (!this.renderer.xr.isPresenting) {
            this.controls.update();
        }

        // Update LOD (Lazy Loading)
        // Check fewer images per frame to save performance
        this.updateLOD();

        // For flat collage: images stay flat, no billboard effect
        // Just add slight random rotation for organic collage feel
        this.scene.children.forEach(child => {
            if (child.userData?.imageData) {
                // Add slight random rotation if not already set for organic collage feel
                if (!child.userData.rotationSet) {
                    child.rotateZ((Math.random() - 0.5) * 0.3); // ±0.15 radians (~8 degrees)
                    child.userData.rotationSet = true;
                }
                // Keep images flat (no billboard effect for flat collage)
                // Reset rotation to ensure they stay flat on the plane
                child.rotation.x = 0;
                child.rotation.y = 0;
            }
        });

        // Use post-processing composer if available, otherwise fallback to direct render
        if (this.postProcessManager) {
            this.postProcessManager.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }

    /**
     * Update Level of Detail (Lazy Loading)
     * Loads textures for images close to camera - smoothly, one at a time
     */
    updateLOD() {
        if (!this.camera) return;

        // Global loading queue to prevent overwhelming the browser
        if (!this.textureLoadQueue) this.textureLoadQueue = [];
        if (!this.isLoadingTexture) this.isLoadingTexture = false;

        // Throttle: only check every 30 frames
        if (!this.lodFrame) this.lodFrame = 0;
        this.lodFrame++;
        if (this.lodFrame % 30 !== 0) return;

        const cameraPos = this.camera.position;
        const loadDistance = 30; // Distance to trigger load

        // Find images that need loading
        const imagesToCheck = [];
        this.scene.traverse(child => {
            if (child.userData?.imageData && child.userData.isImage) {
                imagesToCheck.push(child);
            }
        });

        // Sort by distance to camera (load closest first)
        imagesToCheck.sort((a, b) => {
            const distA = a.position.distanceToSquared(cameraPos);
            const distB = b.position.distanceToSquared(cameraPos);
            return distA - distB;
        });

        // Queue up to 3 images for loading
        let queued = 0;
        for (const plane of imagesToCheck) {
            if (queued >= 3) break;

            const dist = plane.position.distanceTo(cameraPos);
            const data = plane.userData.imageData;

            // If close enough and not loaded/loading/queued
            if (dist < loadDistance && !data.texture && !data.loading && !data.queued && !data.metadata?.isPlaceholder) {
                data.queued = true;
                this.textureLoadQueue.push(plane);
                queued++;
            }
        }

        // Process queue one at a time with delay
        this.processTextureQueue();
    }

    processTextureQueue() {
        if (this.isLoadingTexture || this.textureLoadQueue.length === 0) return;

        this.isLoadingTexture = true;
        const plane = this.textureLoadQueue.shift();
        const data = plane.userData.imageData;

        if (!data.url || data.texture) {
            // Already loaded or no URL
            data.queued = false;
            this.isLoadingTexture = false;
            return;
        }

        data.loading = true;

        const loader = new THREE.TextureLoader();
        loader.load(
            data.url,
            (texture) => {
                texture.flipY = true;
                texture.colorSpace = THREE.SRGBColorSpace;

                // Start with transparent, fade in
                plane.material.transparent = true;
                plane.material.opacity = 0;
                plane.material.map = texture;
                plane.material.needsUpdate = true;

                // Smooth fade-in animation
                this.fadeInTexture(plane, () => {
                    data.texture = texture;
                    data.loading = false;
                    data.queued = false;
                    this.isLoadingTexture = false;

                    // Small delay before next load to prevent stutter
                    setTimeout(() => this.processTextureQueue(), 100);
                });
            },
            undefined,
            (err) => {
                console.warn(`Failed to lazy load ${data.id}`);
                data.loading = false;
                data.queued = false;
                data.metadata = data.metadata || {};
                data.metadata.isPlaceholder = true;
                this.isLoadingTexture = false;

                // Try next in queue
                setTimeout(() => this.processTextureQueue(), 50);
            }
        );
    }

    fadeInTexture(plane, onComplete) {
        const duration = 300; // ms
        const startTime = performance.now();

        const animate = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            plane.material.opacity = progress;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                plane.material.transparent = false;
                plane.material.opacity = 1;
                if (onComplete) onComplete();
            }
        };

        requestAnimationFrame(animate);
    }

    // Camera movement for navigation
    moveCamera(targetPosition, duration = 2000) {
        const startPosition = this.camera.position.clone();
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-in-out)
            const eased = progress < 0.5
                ? 2 * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;

            this.camera.position.lerpVectors(startPosition, targetPosition, eased);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }

    // Camera movement with look-at target (for rupture transitions)
    moveCameraWithLookAt(targetPosition, lookAtTarget, duration = 2000, easingFunction = null) {
        const startPosition = this.camera.position.clone();
        const startLookAt = this.controls.target.clone();
        const startTime = Date.now();

        // Default easing (ease-in-out) if none provided
        const defaultEasing = (t) => {
            return t < 0.5
                ? 2 * t * t
                : 1 - Math.pow(-2 * t + 2, 2) / 2;
        };

        const easing = easingFunction || defaultEasing;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const eased = easing(progress);

            // Interpolate camera position
            this.camera.position.lerpVectors(startPosition, targetPosition, eased);

            // Interpolate look-at target
            this.controls.target.lerpVectors(startLookAt, lookAtTarget, eased);
            this.controls.update();

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }
}

