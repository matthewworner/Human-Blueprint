import * as THREE from 'three';

/**
 * ThreadVisualization - Creates animated connecting threads between images during ruptures
 * Features:
 * - Multiple thread styles (solid, dashed, pulse, energy)
 * - Smooth growth/shrink animations
 * - Per-rupture-type styling
 * - Automatic cleanup
 */
export class ThreadVisualization {
    constructor(scene) {
        this.scene = scene;
        this.activeThreads = [];
        
        // Default thread appearance
        this.defaultColor = 0x666666;
        this.defaultWidth = 0.05;
        this.defaultSegments = 20;
    }

    /**
     * Create a thread between two positions
     * @param {Object} source - Source image mesh with position
     * @param {Object} destination - Destination image mesh with position
     * @param {Object} options - Thread configuration
     * @returns {Object} Thread instance
     */
    createThread(source, destination, options = {}) {
        const sourcePos = source.position.clone();
        const destPos = destination.position.clone();
        
        // Calculate midpoint with slight curve for visual interest
        const midPoint = sourcePos.clone().lerp(destPos, 0.5);
        
        // Add slight curve offset based on distance
        const distance = sourcePos.distanceTo(destPos);
        const curveAmount = Math.min(distance * 0.1, 2);
        const curveDirection = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 0.5  // Less vertical curve
        ).normalize();
        
        // Apply curve to midpoint
        midPoint.add(curveDirection.multiplyScalar(curveAmount));
        
        // Create curved path using CatmullRom spline
        const curve = new THREE.CatmullRomCurve3([
            sourcePos,
            midPoint,
            destPos
        ]);
        
        // Create geometry based on style
        const style = options.style || 'solid';
        let geometry, material;
        
        switch (style) {
            case 'pulse':
                geometry = this.createPulseGeometry(curve, options.segments || 30);
                material = this.createPulseMaterial(options.color);
                break;
                
            case 'energy':
                geometry = this.createEnergyGeometry(curve, options.segments || 40);
                material = this.createEnergyMaterial(options.color);
                break;
                
            case 'dashed':
                geometry = this.createDashedGeometry(curve, options.segments || 20);
                material = this.createDashedMaterial(options.color);
                break;
                
            case 'solid':
            default:
                geometry = new THREE.TubeGeometry(curve, options.segments || 20, options.width || 0.03, 8, false);
                material = this.createSolidMaterial(options.color);
                break;
        }
        
        // Create mesh
        const mesh = new THREE.Mesh(geometry, material);
        
        // Start invisible, animate in
        mesh.visible = false;
        mesh.scale.set(0, 0, 1);
        
        this.scene.add(mesh);
        
        // Create thread instance
        const thread = {
            mesh: mesh,
            material: material,
            style: style,
            sourcePos: sourcePos,
            destPos: destPos,
            progress: 0,  // 0 to 1 for animation
            state: 'CREATED',
            startTime: null,
            duration: options.duration || 2000,
            fadeOutDelay: options.fadeOutDelay || 500
        };
        
        this.activeThreads.push(thread);
        return thread;
    }

    /**
     * Create solid material with glow
     */
    createSolidMaterial(color) {
        return new THREE.MeshBasicMaterial({
            color: color || this.defaultColor,
            transparent: true,
            opacity: 0.85  // Slightly more opaque
        });
    }

    /**
     * Create pulsing energy material
     */
    createPulseMaterial(color) {
        return new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color: { value: new THREE.Color(color || 0xff4444) },
                opacity: { value: 0.9 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 color;
                uniform float opacity;
                varying vec2 vUv;
                
                void main() {
                    float pulse = sin(vUv.x * 10.0 - time * 3.0) * 0.5 + 0.5;
                    float alpha = pulse * opacity;
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });
    }

    /**
     * Create energy arc material
     */
    createEnergyMaterial(color) {
        return new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color: { value: new THREE.Color(color || 0x44ffff) },
                opacity: { value: 0.7 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 color;
                uniform float opacity;
                varying vec2 vUv;
                
                // Noise function for energy effect
                float noise(vec2 st) {
                    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
                }
                
                void main() {
                    float n = noise(vec2(vUv.x * 20.0, time * 5.0));
                    float energy = step(0.5, fract(vUv.x * 15.0 - time * 2.0)) * 0.5;
                    energy += step(0.8, n) * 0.5;
                    float alpha = energy * opacity;
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });
    }

    /**
     * Create dashed line geometry
     */
    createDashedGeometry(curve, segments) {
        const points = curve.getPoints(segments);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        return geometry;
    }

    /**
     * Create pulse-style tube geometry
     */
    createPulseGeometry(curve, segments) {
        return new THREE.TubeGeometry(curve, segments, 0.05, 8, false);
    }

    /**
     * Create energy-style tube geometry with twist
     */
    createEnergyGeometry(curve, segments) {
        return new THREE.TubeGeometry(curve, segments, 0.03, 6, false);
    }

    /**
     * Start thread animation (grow from source to destination)
     */
    animateGrowth(thread) {
        if (thread.state !== 'CREATED') return;
        
        thread.state = 'GROWING';
        thread.startTime = performance.now();
        thread.mesh.visible = true;
    }

    /**
     * Update all active threads
     * @param {number} deltaTime - Time since last update
     */
    update(deltaTime) {
        const now = performance.now();
        
        for (let i = this.activeThreads.length - 1; i >= 0; i--) {
            const thread = this.activeThreads[i];
            
            switch (thread.state) {
                case 'GROWING':
                    this.updateGrowth(thread, now);
                    break;
                    
                case 'CONNECTED':
                    this.updateConnected(thread, now);
                    break;
                    
                case 'SHRINKING':
                    this.updateShrink(thread, now);
                    break;
            }
            
            // Update shader uniforms for animated styles
            if (thread.material.uniforms && thread.material.uniforms.time) {
                thread.material.uniforms.time.value = now * 0.001;
            }
        }
    }

    /**
     * Update growth animation
     */
    updateGrowth(thread, now) {
        const elapsed = now - thread.startTime;
        thread.progress = Math.min(elapsed / thread.duration, 1);
        
        // Ease out for smooth deceleration
        const eased = 1 - Math.pow(1 - thread.progress, 3);
        
        // Scale the mesh based on progress (only in X direction to "grow")
        const scale = eased;
        thread.mesh.scale.set(scale, scale, 1);
        
        // Check if growth complete
        if (thread.progress >= 1) {
            thread.state = 'CONNECTED';
            thread.startTime = now;
        }
    }

    /**
     * Update connected state (keep visible briefly)
     */
    updateConnected(thread, now) {
        const elapsed = now - thread.startTime;
        
        // Add subtle pulse while connected
        const pulse = Math.sin(elapsed * 0.003) * 0.1 + 1;
        thread.mesh.scale.set(pulse, pulse, 1);
        
        // Check if it's time to start shrinking
        if (elapsed > thread.fadeOutDelay) {
            thread.state = 'SHRINKING';
            thread.startTime = now;
        }
    }

    /**
     * Update shrink animation
     */
    updateShrink(thread, now) {
        const elapsed = now - thread.startTime;
        const shrinkDuration = 500; // 500ms to fade out
        const progress = Math.min(elapsed / shrinkDuration, 1);
        
        // Ease in for acceleration
        const eased = progress * progress;
        
        // Scale down
        const scale = 1 - eased;
        thread.mesh.scale.set(scale, scale, 1);
        
        // Fade out material
        if (thread.material.opacity !== undefined) {
            thread.material.opacity = 0.8 * (1 - progress);
        }
        
        // Check if shrink complete
        if (progress >= 1) {
            thread.state = 'DESTROYED';
            this.destroyThread(thread);
        }
    }

    /**
     * Start shrinking a specific thread
     */
    startShrink(thread) {
        if (thread.state === 'CONNECTED') {
            thread.state = 'SHRINKING';
            thread.startTime = performance.now();
        }
    }

    /**
     * Destroy a thread and clean up resources
     */
    destroyThread(thread) {
        // Remove from scene
        this.scene.remove(thread.mesh);
        
        // Dispose geometry and material
        if (thread.mesh.geometry) {
            thread.mesh.geometry.dispose();
        }
        if (thread.mesh.material) {
            if (thread.mesh.material.map) {
                thread.mesh.material.map.dispose();
            }
            thread.mesh.material.dispose();
        }
        
        // Remove from active threads
        const index = this.activeThreads.indexOf(thread);
        if (index > -1) {
            this.activeThreads.splice(index, 1);
        }
    }

    /**
     * Destroy all active threads
     */
    destroyAll() {
        for (let i = this.activeThreads.length - 1; i >= 0; i--) {
            this.destroyThread(this.activeThreads[i]);
        }
        this.activeThreads = [];
    }

    /**
     * Get thread style based on rupture type
     */
    static getStyleForRuptureType(ruptureType) {
        const styles = {
            'dwelling': 'solid',
            'avoidance': 'solid',
            'scanning': 'dashed',
            'returning': 'dashed',
            'rapid_movement': 'pulse',
            'pattern_recognition': 'energy',
            'emotional_intensity': 'pulse',
            'temporal_displacement': 'energy'
        };
        
        return styles[ruptureType] || 'solid';
    }

    /**
     * Get color based on rupture type
     */
    static getColorForRuptureType(ruptureType) {
        const colors = {
            'dwelling': 0xbbbbbb,      // Brighter gray for visibility
            'avoidance': 0x999999,      // Brighter gray
            'scanning': 0xdddddd,      // Light gray for visibility
            'returning': 0xcccccc,     // Light gray
            'rapid_movement': 0xff6666,
            'pattern_recognition': 0x66ffff,
            'emotional_intensity': 0xff4444,
            'temporal_displacement': 0xbb77ff  // Brighter purple
        };
        
        return colors[ruptureType] || 0xaaaaaa;  // Default to brighter
    }

    /**
     * Get duration based on rupture type (matches camera transition)
     */
    static getDurationForRuptureType(ruptureType, defaultDuration = 1500) {
        const durations = {
            'dwelling': 1200,
            'avoidance': 2000,
            'scanning': 800,
            'returning': 1500,
            'rapid_movement': 600,
            'pattern_recognition': 1800,
            'emotional_intensity': 1000,
            'temporal_displacement': 2200
        };
        
        return durations[ruptureType] || defaultDuration;
    }
}