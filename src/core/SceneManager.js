import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class SceneManager {
    constructor(container) {
        this.container = container;
        
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        
        // Camera - positioned at center of 3D space
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            10000
        );
        this.camera.position.set(0, 0, 5);
        
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
        this.controls.target.set(0, 0, 0); // Look at center
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
        this.setupWebXR();
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
    
    async setupWebXR() {
        // Check if WebXR is available
        if (navigator.xr) {
            try {
                // Check if immersive VR is supported
                const isSupported = await navigator.xr.isSessionSupported('immersive-vr');
                if (isSupported) {
                    console.log('WebXR immersive-vr is supported');
                }
                
                // Check if immersive AR is supported
                const isARSupported = await navigator.xr.isSessionSupported('immersive-ar');
                if (isARSupported) {
                    console.log('WebXR immersive-ar is supported');
                }
            } catch (error) {
                console.log('WebXR not available:', error);
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
            // Request immersive VR session
            const session = await navigator.xr.requestSession('immersive-vr', {
                requiredFeatures: ['local-floor'],
                optionalFeatures: ['bounded-floor', 'hand-tracking']
            });
            
            this.xrSession = session;
            this.renderer.xr.setSession(session);
            
            // Set animation loop for XR mode
            this.renderer.xr.setAnimationLoop(() => {
                // Call update callback if provided (for gaze tracking, rupture system, etc.)
                if (this.xrUpdateCallback) {
                    this.xrUpdateCallback();
                }
                this.render();
            });
            
            console.log('Entered WebXR immersive mode');
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
        
        // Create plane geometry
        const geometry = new THREE.PlaneGeometry(2, 2);
        
        // Use texture from imageData or create placeholder
        const texture = imageData.texture || this.createPlaceholderTexture(imageData);
        
        const material = new THREE.MeshStandardMaterial({
            map: texture,
            side: THREE.DoubleSide,
            emissive: 0x000000
        });
        
        const plane = new THREE.Mesh(geometry, material);
        plane.position.set(pos.x, pos.y, pos.z);
        
        // Store image metadata (preserve all imageData)
        plane.userData = {
            imageData: imageData,
            originalPosition: new THREE.Vector3(pos.x, pos.y, pos.z),
            isGazed: false,
            dwellTime: 0,
            id: imageData.id
        };
        
        // Make plane clickable/gazeable
        plane.userData.isImage = true;
        
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
        texture.flipY = false;
        return texture;
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    render() {
        // Update orbit controls (only when not in XR)
        if (!this.renderer.xr.isPresenting) {
            this.controls.update();
        }
        
        // Update image planes to face camera (billboard effect)
        this.scene.children.forEach(child => {
            if (child.userData?.imageData) {
                child.lookAt(this.camera.position);
            }
        });
        
        this.renderer.render(this.scene, this.camera);
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

