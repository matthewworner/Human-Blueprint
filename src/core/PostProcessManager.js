import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RuptureShader } from './shaders/RuptureShader.js';

export class PostProcessManager {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        
        this.composer = null;
        this.bloomPass = null;
        this.filmPass = null;
        this.chromaticAberrationPass = null;
        this.ruptureShader = null;
        this.rupturePass = null;
        
        this.params = {
            bloomStrength: 0.5,
            bloomRadius: 0.4,
            bloomThreshold: 0.85,
            filmNoise: 0.15,
            filmScanlines: 0.0,
            filmGray: 0
        };
        
        this.init();
    }
    
    init() {
        // Create EffectComposer
        this.composer = new EffectComposer(this.renderer);
        
        // 1. Render Pass (Base Scene)
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        
        // 2. Unreal Bloom Pass (Subtle glow)
        const resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);
        this.bloomPass = new UnrealBloomPass(resolution, this.params.bloomStrength, this.params.bloomRadius, this.params.bloomThreshold);
        this.composer.addPass(this.bloomPass);
        
        // 3. Film Pass (Grain & Atmosphere)
        // noiseIntensity, scanlinesIntensity, scanlinesCount, grayscale
        this.filmPass = new FilmPass(
            this.params.filmNoise, 
            this.params.filmScanlines, 
            648, 
            this.params.filmGray
        );
        this.composer.addPass(this.filmPass);
        
        // 4. Custom Chromatic Aberration & Vignette Shader
        this.createChromaticAberrationPass();

        // 5. Rupture Shader (violent screen distortion during ruptures)
        this.ruptureShader = new RuptureShader();
        this.rupturePass = this.ruptureShader.createPass();
        this.composer.addPass(this.rupturePass);

        console.log('Post-processing initialized');
    }
    
    createChromaticAberrationPass() {
        const ChromaticAberrationShader = {
            uniforms: {
                'tDiffuse': { value: null },
                'uOffset': { value: 0.002 }, // Shift amount
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float uOffset;
                varying vec2 vUv;
                
                void main() {
                    // Distance from center (0.0 to 1.0)
                    float dist = distance(vUv, vec2(0.5));
                    
                    // Strength increases towards edges
                    float strength = dist * uOffset;
                    
                    vec4 r = texture2D(tDiffuse, vUv + vec2(strength, 0.0));
                    vec4 g = texture2D(tDiffuse, vUv);
                    vec4 b = texture2D(tDiffuse, vUv - vec2(strength, 0.0));
                    
                    // Vignette
                    float vignette = 1.0 - (dist * dist * 0.8);
                    
                    gl_FragColor = vec4(r.r, g.g, b.b, 1.0) * vignette;
                }
            `
        };
        
        this.chromaticAberrationPass = new ShaderPass(ChromaticAberrationShader);
        this.composer.addPass(this.chromaticAberrationPass);
    }
    
    setSize(width, height) {
        this.composer.setSize(width, height);
        if (this.bloomPass) {
            this.bloomPass.resolution.set(width, height);
        }
        if (this.ruptureShader) {
            this.ruptureShader.setResolution(width, height);
        }
    }
    
    render() {
        this.composer.render();
    }
    
    // Dynamic updates for Rupture system
    setRuptureIntensity(intensity) {
        // Increase aberration during rupture
        if (this.chromaticAberrationPass) {
            // Base 0.002, Max 0.02
            this.chromaticAberrationPass.uniforms['uOffset'].value = 0.002 + (intensity * 0.03);
        }

        // Increase bloom
        if (this.bloomPass) {
            this.bloomPass.strength = this.params.bloomStrength + (intensity * 2.0);
        }

        // Increase noise
        if (this.filmPass) {
            this.filmPass.uniforms.nIntensity.value = this.params.filmNoise + (intensity * 0.8);
        }

        // Apply rupture shader distortion
        if (this.ruptureShader) {
            this.ruptureShader.update(intensity, performance.now() * 0.001);
        }
    }
}
