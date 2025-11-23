import * as THREE from 'three';

export class SceneManager {
    constructor(container) {
        this.container = container;
        
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            10000
        );
        this.camera.position.set(0, 0, 10);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(directionalLight);
        
        // Handle resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Raycaster for interaction
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
    }
    
    createImagePlane(imageData, position) {
        const loader = new THREE.TextureLoader();
        
        // Create plane geometry
        const geometry = new THREE.PlaneGeometry(2, 2);
        
        // Load texture (or use placeholder)
        const texture = imageData.texture || this.createPlaceholderTexture();
        
        const material = new THREE.MeshStandardMaterial({
            map: texture,
            side: THREE.DoubleSide,
            emissive: 0x000000
        });
        
        const plane = new THREE.Mesh(geometry, material);
        plane.position.set(position.x, position.y, position.z);
        
        // Store image metadata
        plane.userData = {
            imageData: imageData,
            originalPosition: position.clone(),
            isGazed: false,
            dwellTime: 0
        };
        
        // Phase 0: Fixed orientation (will add billboard effect in render loop if needed)
        
        this.scene.add(plane);
        
        return plane;
    }
    
    createPlaceholderTexture() {
        // Create a simple colored texture as placeholder
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // Random color for each placeholder
        const hue = Math.random() * 360;
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
        
        return new THREE.CanvasTexture(canvas);
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    render() {
        // Update image planes to face camera (billboard effect)
        this.scene.children.forEach(child => {
            if (child.userData?.imageData) {
                child.lookAt(this.camera.position);
            }
        });
        
        this.renderer.render(this.scene, this.scene);
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
}

