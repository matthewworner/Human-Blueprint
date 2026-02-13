import * as THREE from 'three';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

/**
 * RuptureShader - GLSL shader for violent screen-tearing rupture effects
 * Creates disorienting distortion during rupture transitions
 */
export class RuptureShader {
    constructor() {
        this.uniforms = {
            'tDiffuse': { value: null },
            'uRuptureAmount': { value: 0.0 }, // 0.0 to 1.0 - controls effect intensity
            'uTime': { value: 0.0 }, // For animated noise
            'uResolution': { value: new THREE.Vector2(800, 600) }
        };

        this.vertexShader = `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        this.fragmentShader = `
            uniform sampler2D tDiffuse;
            uniform float uRuptureAmount;
            uniform float uTime;
            uniform vec2 uResolution;

            varying vec2 vUv;

            // Simplex noise function for organic distortion
            vec3 mod289(vec3 x) {
                return x - floor(x * (1.0 / 289.0)) * 289.0;
            }

            vec4 mod289(vec4 x) {
                return x - floor(x * (1.0 / 289.0)) * 289.0;
            }

            vec4 permute(vec4 x) {
                return mod289(((x*34.0)+1.0)*x);
            }

            vec4 taylorInvSqrt(vec4 r) {
                return 1.79284291400159 - 0.85373472095314 * r;
            }

            float snoise(vec3 v) {
                const vec2 C = vec2(1.0/6.0, 1.0/3.0);
                const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

                vec3 i  = floor(v + dot(v, C.yyy));
                vec3 x0 =   v - i + dot(i, C.xxx);

                vec3 g = step(x0.yzx, x0.xyz);
                vec3 l = 1.0 - g;
                vec3 i1 = min(g.xyz, l.zxy);
                vec3 i2 = max(g.xyz, l.zxy);

                vec3 x1 = x0 - i1 + C.xxx;
                vec3 x2 = x0 - i2 + C.yyy;
                vec3 x3 = x0 - D.yyy;

                i = mod289(i);
                vec4 p = permute(permute(permute(
                    i.z + vec4(0.0, i1.z, i2.z, 1.0))
                    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                    + i.x + vec4(0.0, i1.x, i2.x, 1.0));

                float n_ = 0.142857142857;
                vec3 ns = n_ * D.wyz - D.xzx;

                vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

                vec4 x_ = floor(j * ns.z);
                vec4 y_ = floor(j - 7.0 * x_);

                vec4 x = x_ *ns.x + ns.yyyy;
                vec4 y = y_ *ns.x + ns.yyyy;
                vec4 h = 1.0 - abs(x) - abs(y);

                vec4 b0 = vec4(x.xy, y.xy);
                vec4 b1 = vec4(x.zw, y.zw);

                vec4 s0 = floor(b0)*2.0 + 1.0;
                vec4 s1 = floor(b1)*2.0 + 1.0;
                vec4 sh = -step(h, vec4(0.0));

                vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
                vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

                vec3 p0 = vec3(a0.xy, h.x);
                vec3 p1 = vec3(a0.zw, h.y);
                vec3 p2 = vec3(a1.xy, h.z);
                vec3 p3 = vec3(a1.zw, h.w);

                vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
                p0 *= norm.x;
                p1 *= norm.y;
                p2 *= norm.z;
                p3 *= norm.w;

                vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                m = m * m;
                return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
            }

            void main() {
                vec2 uv = vUv;

                // Create violent distortion based on rupture amount
                if (uRuptureAmount > 0.0) {
                    // Multi-frequency noise for complex tearing
                    float noise1 = snoise(vec3(uv.x * 10.0, uv.y * 10.0, uTime * 2.0));
                    float noise2 = snoise(vec3(uv.x * 50.0, uv.y * 50.0, uTime * 5.0));
                    float noise3 = snoise(vec3(uv.x * 2.0, uv.y * 2.0, uTime * 0.5));

                    // Combine noises for organic distortion
                    float distortion = (noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2) * uRuptureAmount;

                    // Apply horizontal displacement (tearing effect)
                    uv.x += distortion * 0.1;

                    // Add vertical tearing lines
                    float tearLines = sin(uv.y * 100.0 + uTime * 10.0) * uRuptureAmount * 0.05;
                    uv.x += tearLines;

                    // RGB split effect (chromatic aberration)
                    float splitAmount = uRuptureAmount * 0.02;
                    vec2 redOffset = vec2(splitAmount, 0.0);
                    vec2 blueOffset = vec2(-splitAmount, 0.0);

                    // Sample colors with offset
                    vec4 color = texture2D(tDiffuse, uv);
                    vec4 red = texture2D(tDiffuse, uv + redOffset);
                    vec4 blue = texture2D(tDiffuse, uv + blueOffset);

                    // Combine with color inversion at peak rupture
                    float invertAmount = smoothstep(0.7, 1.0, uRuptureAmount);
                    color = mix(color, 1.0 - color, invertAmount);

                    // Apply RGB split
                    gl_FragColor = vec4(red.r, color.g, blue.b, color.a);
                } else {
                    // Normal rendering when no rupture
                    gl_FragColor = texture2D(tDiffuse, uv);
                }
            }
        `;
    }

    /**
     * Create Three.js ShaderPass for this rupture effect
     */
    createPass() {
        const pass = new ShaderPass({
            uniforms: this.uniforms,
            vertexShader: this.vertexShader,
            fragmentShader: this.fragmentShader
        });

        // Update resolution uniform when created
        pass.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);

        return pass;
    }

    /**
     * Update shader uniforms
     * @param {number} ruptureAmount - 0.0 to 1.0
     * @param {number} time - Current time for animation
     */
    update(ruptureAmount, time) {
        this.uniforms.uRuptureAmount.value = Math.max(0, Math.min(1, ruptureAmount));
        this.uniforms.uTime.value = time;
    }

    /**
     * Update resolution (call on window resize)
     * @param {number} width
     * @param {number} height
     */
    setResolution(width, height) {
        this.uniforms.uResolution.value.set(width, height);
    }
}