export class AudioSystem {
    constructor() {
        this.audioContext = null;
        this.isInitialized = false;
        
        // Audio state for cutting/restoring
        this.activeSources = []; // Track active audio sources
        this.masterGain = null; // Master gain node for cutting audio
        this.originalGain = 0.12; // Base volume (quiet, subliminal - Eno-style)
        
        // Generative soundscape state
        this.soundscapeActive = false;
        this.droneOscillators = []; // Array of oscillator nodes for drone layers
        this.reverbNode = null;
        this.reverbGain = null;
        this.dryGain = null;
        this.noiseNode = null; // Subtle noise layer for texture
        this.noiseGain = null;
        
        // Spatial audio: sound sources positioned at images
        this.imageSoundSources = new Map(); // imageId -> { oscillator, gain, panner, filter }

        // HRTF and binaural audio
        this.hrtfEnabled = true;
        this.binauralEnabled = true;
        this.spatialAudioSources = new Map(); // imageId -> { leftEar, rightEar, convolver }

        // Context tracking
        this.currentImage = null;
        this.currentImageId = null;
        this.cameraPosition = { x: 0, y: 0, z: 5 };
        this.lastCameraPosition = { x: 0, y: 0, z: 5 };
        this.movementSpeed = 0;
        this.headOrientation = new THREE.Euler(); // Head orientation for binaural audio
        
        // Smooth parameter changes
        this.targetFrequency = 80; // Base frequency (lower, more rumbling)
        this.currentFrequency = 80;
        this.targetTimbre = 0.3; // 0 = sine (dark), 1 = sawtooth (bright)
        this.currentTimbre = 0.3;
        
        // Generative modulation (LFOs for continuous variation)
        this.lfoNodes = []; // Low-frequency oscillators for subtle modulation
        this.modulationDepth = 0.02; // How much LFO affects frequency (2% variation)
        
        // Transition smoothing
        this.transitionTime = 0.1; // Audio API transition time (100ms)
        this.isRupturing = false; // Flag to prevent smooth transitions during rupture
        
        // Update interval
        this.updateInterval = null;
        
        // Image objects and camera reference
        this.imageObjects = null;
        this.camera = null;
    }
    
    async init() {
        // Initialize Web Audio API
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Resume audio context if suspended (browser autoplay policy)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            // Create master gain node for audio cutting
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = this.originalGain;
            
            // Create reverb using ConvolverNode with impulse response
            this.createReverb();

            // Create HRTF convolvers for binaural audio
            this.createHRTFConvolvers();

            // Set up listener position (camera/listener is at origin in audio space)
            this.listener = this.audioContext.listener;
            if (this.listener.positionX) {
                // New API
                this.listener.positionX.value = 0;
                this.listener.positionY.value = 0;
                this.listener.positionZ.value = 0;
            } else if (this.listener.setPosition) {
                // Legacy API
                this.listener.setPosition(0, 0, 0);
            }
            
            this.isInitialized = true;
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
        }
    }
    
    createReverb() {
        // Create a longer, more ambient reverb using ConvolverNode
        this.reverbNode = this.audioContext.createConvolver();
        
        // Create a longer impulse response for ambient reverb (4 seconds)
        const impulseLength = this.audioContext.sampleRate * 4;
        const impulse = this.audioContext.createBuffer(2, impulseLength, this.audioContext.sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < impulseLength; i++) {
                const n = impulseLength - i;
                // Exponential decay with slight randomness for natural reverb
                const decay = Math.pow(n / impulseLength, 1.5);
                const noise = (Math.random() * 2 - 1) * 0.05;
                channelData[i] = decay * (0.1 + noise);
            }
        }
        
        this.reverbNode.buffer = impulse;
        
        // Create wet/dry mix nodes (more reverb for ambient feel)
        this.reverbGain = this.audioContext.createGain();
        this.reverbGain.gain.value = 0.4; // 40% wet (more ambient)
        this.reverbNode.connect(this.reverbGain);
        this.reverbGain.connect(this.masterGain);
        
        // Create dry mix node (direct connection)
        this.dryGain = this.audioContext.createGain();
        this.dryGain.gain.value = 0.6; // 60% dry
        this.dryGain.connect(this.masterGain);
        
        // Create subtle noise layer for texture (very quiet)
        this.createNoiseLayer();
    }
    
    createNoiseLayer() {
        // Create subtle noise for ambient texture (felt, not heard)
        const bufferSize = this.audioContext.sampleRate * 2;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        this.noiseNode = this.audioContext.createBufferSource();
        this.noiseNode.buffer = buffer;
        this.noiseNode.loop = true;

        // Heavy low-pass filter to make noise rumbly, not hissy
        const noiseFilter = this.audioContext.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.value = 150; // Very low, rumbling
        noiseFilter.Q.value = 1;

        this.noiseGain = this.audioContext.createGain();
        this.noiseGain.gain.value = 0.02; // Very quiet (2% of base volume)

        this.noiseNode.connect(noiseFilter);
        noiseFilter.connect(this.noiseGain);
        this.noiseGain.connect(this.dryGain);
        this.noiseGain.connect(this.reverbNode);

        // Start noise (will loop)
        const now = this.audioContext.currentTime;
        this.noiseNode.start(now);
    }

    /**
     * Create HRTF (Head-Related Transfer Function) convolvers for binaural audio
     * HRTF simulates how sound waves interact with the human head and ears
     */
    createHRTFConvolvers() {
        // Create simplified HRTF-like impulse responses
        // In production, use actual HRTF measurements or a library
        const sampleRate = this.audioContext.sampleRate;
        const impulseLength = Math.floor(sampleRate * 0.1); // 100ms impulse response

        // Left ear HRTF (simplified)
        this.leftHRTFBuffer = this.createHRTFImpulse(true, impulseLength, sampleRate);

        // Right ear HRTF (simplified)
        this.rightHRTFBuffer = this.createHRTFImpulse(false, impulseLength, sampleRate);

        // Create convolvers
        this.leftHRTFConvolver = this.audioContext.createConvolver();
        this.leftHRTFConvolver.buffer = this.leftHRTFBuffer;

        this.rightHRTFConvolver = this.audioContext.createConvolver();
        this.rightHRTFConvolver.buffer = this.rightHRTFBuffer;
    }

    /**
     * Create a simplified HRTF impulse response
     * @param {boolean} isLeft - Whether this is for the left ear
     * @param {number} length - Length of impulse response
     * @param {number} sampleRate - Audio sample rate
     */
    createHRTFImpulse(isLeft, length, sampleRate) {
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        // Simplified HRTF: delay and filtering to simulate head shadowing
        const delaySamples = Math.floor(sampleRate * (isLeft ? 0.0005 : 0.0003)); // Interaural time difference
        const attenuation = isLeft ? 0.8 : 0.9; // Interaural level difference

        for (let i = 0; i < length; i++) {
            if (i < delaySamples) {
                data[i] = 0;
            } else {
                // Exponential decay with some frequency shaping
                const t = (i - delaySamples) / length;
                const decay = Math.exp(-t * 3);
                const frequency = (i / length) * Math.PI * 2;
                const filter = 0.5 + 0.5 * Math.cos(frequency * (isLeft ? 1.1 : 0.9));

                data[i] = decay * filter * attenuation;
            }
        }

        return buffer;
    }

    /**
     * Create binaural spatial audio source for an image
     * @param {string} imageId - ID of the image
     * @param {THREE.Vector3} position - 3D position of the image
     */
    createBinauralSource(imageId, position) {
        if (!this.hrtfEnabled) return null;

        // Create stereo splitter
        const splitter = this.audioContext.createChannelSplitter(2);

        // Create binaural processing chain
        const leftGain = this.audioContext.createGain();
        const rightGain = this.audioContext.createGain();

        // Connect: splitter -> HRTF convolvers -> gains -> output
        splitter.connect(this.leftHRTFConvolver, 0);
        splitter.connect(this.rightHRTFConvolver, 1);

        this.leftHRTFConvolver.connect(leftGain);
        this.rightHRTFConvolver.connect(rightGain);

        // Create merger for binaural output
        const merger = this.audioContext.createChannelMerger(2);
        leftGain.connect(merger, 0, 0);
        rightGain.connect(merger, 0, 1);

        // Connect to spatial audio output
        merger.connect(this.dryGain);
        merger.connect(this.reverbNode);

        const binauralSource = {
            splitter: splitter,
            leftGain: leftGain,
            rightGain: rightGain,
            merger: merger,
            position: position.clone(),
            lastUpdate: this.audioContext.currentTime
        };

        this.spatialAudioSources.set(imageId, binauralSource);
        return binauralSource;
    }
    
    /**
     * Start the generative ambient soundscape
     * @param {Array} imageObjects - Array of THREE.Mesh objects with imageData
     * @param {THREE.Camera} camera - Camera for position tracking
     */
    startSoundscape(imageObjects, camera) {
        if (!this.isInitialized) {
            this.init().then(() => {
                if (this.isInitialized) {
                    this.startSoundscape(imageObjects, camera);
                }
            });
            return;
        }
        
        if (this.soundscapeActive) return;
        
        this.soundscapeActive = true;
        this.imageObjects = imageObjects;
        this.camera = camera;
        
        // Create 3 layered oscillators with slight detuning (Brian Eno style)
        this.createDroneLayers();
        
        // Start continuous updates
        this.updateInterval = setInterval(() => {
            this.updateSoundscape();
        }, 100); // Update every 100ms for smooth transitions
    }
    
    /**
     * Stop the generative soundscape
     */
    stopSoundscape() {
        if (!this.soundscapeActive) return;
        
        this.soundscapeActive = false;
        
        // Stop update interval
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        const now = this.audioContext.currentTime;
        
        // Fade out and stop all oscillators
        this.droneOscillators.forEach(layer => {
            if (layer.gainNode) {
                layer.gainNode.gain.cancelScheduledValues(now);
                layer.gainNode.gain.setValueAtTime(layer.gainNode.gain.value, now);
                layer.gainNode.gain.exponentialRampToValueAtTime(0.001, now + 2);
            }
            if (layer.oscillator) {
                layer.oscillator.stop(now + 2);
            }
            // Stop LFOs
            if (layer.lfo) {
                layer.lfo.stop(now + 2);
            }
        });
        
        // Stop noise layer
        if (this.noiseNode) {
            this.noiseGain.gain.cancelScheduledValues(now);
            this.noiseGain.gain.setValueAtTime(this.noiseGain.gain.value, now);
            this.noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 2);
            this.noiseNode.stop(now + 2);
        }
        
        // Clear after fade
        setTimeout(() => {
            this.droneOscillators = [];
            this.lfoNodes = [];
            this.noiseNode = null;
            this.noiseGain = null;
        }, 2100);
    }
    
    /**
     * Create 3 layered oscillators with detuning and LFO modulation
     */
    createDroneLayers() {
        const now = this.audioContext.currentTime;
        const baseFreq = this.currentFrequency;
        
        // Detuning amounts (cents) - subtle, creates beating/interference
        // More detuning for unnerving, dissonant feel
        const detunings = [-11, 0, +7]; // Slight detuning for each layer
        
        this.droneOscillators = detunings.map((detune, index) => {
            // Create oscillator
            const oscillator = this.audioContext.createOscillator();
            oscillator.type = 'sine'; // Start with sine, will modulate to other types
            oscillator.frequency.value = baseFreq;
            
            // Create LFO for subtle frequency modulation (generative variation)
            const lfo = this.audioContext.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.value = 0.1 + (index * 0.05); // Very slow LFO (0.1-0.2 Hz)
            
            // Create gain node to control LFO depth
            const lfoGain = this.audioContext.createGain();
            lfoGain.gain.value = baseFreq * this.modulationDepth; // 2% frequency variation
            
            // Connect LFO to oscillator frequency (via gain node)
            lfo.connect(lfoGain);
            lfoGain.connect(oscillator.frequency);
            
            // Start LFO
            lfo.start(now);
            
            // Create gain node for volume control
            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = 0.06; // Even quieter per layer (subliminal)
            
            // Create low-pass filter for timbre control
            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 1500; // Lower cutoff for darker, more ambient sound
            filter.Q.value = 0.7; // Less resonance (smoother)
            
            // Create panner for spatial audio (will be positioned at gazed image)
            const panner = this.audioContext.createPanner();
            panner.panningModel = this.binauralEnabled ? 'equalpower' : 'HRTF'; // Use binaural if enabled
            panner.distanceModel = 'inverse';
            panner.refDistance = 1;
            panner.maxDistance = 50;
            panner.rolloffFactor = 1.5; // More distance attenuation

            // Create binaural splitter if binaural audio is enabled
            let binauralSplitter = null;
            if (this.binauralEnabled) {
                binauralSplitter = this.audioContext.createChannelSplitter(2);
                // Connect panner to binaural processing
                panner.connect(binauralSplitter);
            }
            
            // Connect: oscillator -> filter -> gain -> panner
            oscillator.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(panner);
            
            // Split signal: dry (direct) and wet (reverb)
            panner.connect(this.dryGain); // Dry signal
            panner.connect(this.reverbNode); // Wet signal (through reverb)
            
            // Start oscillator
            oscillator.start(now);
            
            // Store references
            return {
                oscillator: oscillator,
                filter: filter,
                gainNode: gainNode,
                panner: panner,
                binauralSplitter: binauralSplitter,
                lfo: lfo,
                lfoGain: lfoGain,
                detune: detune,
                baseFrequency: baseFreq
            };
        });
        
        // Store LFO nodes for cleanup
        this.lfoNodes = this.droneOscillators.map(layer => layer.lfo);
    }
    
    /**
     * Update soundscape based on current context
     */
    updateSoundscape() {
        if (!this.soundscapeActive || !this.camera || !this.imageObjects) return;
        
        // Update camera position and movement speed
        this.updateCameraTracking();
        
        // Find current/nearest image
        const nearestImage = this.findNearestImage();
        
        // Update audio parameters based on image properties
        if (nearestImage) {
            this.updateFromImage(nearestImage);
        }
        
        // Smoothly transition parameters
        this.smoothParameterUpdates();
    }
    
    /**
     * Track camera position and calculate movement speed
     */
    updateCameraTracking() {
        if (!this.camera) return;
        
        const pos = this.camera.position;
        this.lastCameraPosition = { ...this.cameraPosition };
        this.cameraPosition = { x: pos.x, y: pos.y, z: pos.z };
        
        // Calculate movement speed (distance per second)
        const dx = this.cameraPosition.x - this.lastCameraPosition.x;
        const dy = this.cameraPosition.y - this.lastCameraPosition.y;
        const dz = this.cameraPosition.z - this.lastCameraPosition.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        this.movementSpeed = distance * 10; // Scale for audio modulation (10 updates per second)
    }
    
    /**
     * Find the nearest image to the camera
     */
    findNearestImage() {
        if (!this.imageObjects || this.imageObjects.length === 0) return null;
        if (!this.camera) return null;
        
        let nearest = null;
        let nearestDistance = Infinity;
        
        this.imageObjects.forEach(obj => {
            if (!obj.userData?.imageData) return;
            
            const imagePos = obj.position;
            const cameraPos = this.camera.position;
            
            const dx = imagePos.x - cameraPos.x;
            const dy = imagePos.y - cameraPos.y;
            const dz = imagePos.z - cameraPos.z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearest = obj;
            }
        });
        
        return nearest;
    }
    
    /**
     * Update audio parameters based on image properties
     */
    updateFromImage(imageObject) {
        const imageData = imageObject.userData.imageData;
        if (!imageData) return;
        
        // Only update if this is a different image (avoid unnecessary updates)
        if (this.currentImageId === imageData.id && this.currentImage) {
            // Same image, just update spatial positioning (camera might have moved)
            this.updateSpatialPositioning(imageObject);
            this.updateMovementModulation();
            return;
        }
        
        // New image - update all parameters
        this.currentImage = imageData;
        this.currentImageId = imageData.id;
        
        // Map color to timbre (waveform type + filter)
        this.updateTimbreFromColors(imageData.colors || []);
        
        // Map era/age to frequency
        this.updateFrequencyFromEra(imageData.era || 0);
        
        // Update spatial positioning (sound comes from image)
        this.updateSpatialPositioning(imageObject);
        
        // Modulate based on movement speed
        this.updateMovementModulation();
    }
    
    /**
     * Map colors to timbre (waveform and filter characteristics)
     * More nuanced mapping for ambient, slightly unnerving sound
     */
    updateTimbreFromColors(colors) {
        if (!colors || colors.length === 0) {
            this.targetTimbre = 0.3; // Default to darker (sine-like)
            return;
        }
        
        // Map color names to timbre values (0 = dark/sine, 1 = bright/sawtooth)
        // Warm colors (red, orange, gold, yellow) → brighter, more present
        // Cool colors (blue, black) → darker, more rumbling
        // Earth tones (ochre, brown) → medium, slightly brighter
        // White → neutral, sine-like
        
        let timbreSum = 0;
        let weightSum = 0;
        
        colors.forEach(color => {
            const colorLower = color.toLowerCase();
            let timbre = 0.3; // Default (dark)
            let weight = 1.0; // Default weight
            
            if (colorLower.includes('red')) {
                timbre = 0.7; // Bright, sawtooth-like
                weight = 1.2; // Red is prominent
            } else if (colorLower.includes('orange') || colorLower.includes('gold') || colorLower.includes('yellow')) {
                timbre = 0.6; // Bright
                weight = 1.0;
            } else if (colorLower.includes('blue')) {
                timbre = 0.15; // Very dark, sine-like
                weight = 1.0;
            } else if (colorLower.includes('black')) {
                timbre = 0.1; // Very dark, rumbling
                weight = 1.3; // Black is prominent (cave paintings)
            } else if (colorLower.includes('white')) {
                timbre = 0.3; // Neutral
                weight = 0.8; // Less prominent
            } else if (colorLower.includes('ochre') || colorLower.includes('brown')) {
                timbre = 0.45; // Medium, slightly brighter
                weight = 1.0;
            }
            
            timbreSum += timbre * weight;
            weightSum += weight;
        });
        
        // Weighted average
        this.targetTimbre = weightSum > 0 ? timbreSum / weightSum : 0.3;
        
        // Clamp to valid range
        this.targetTimbre = Math.max(0, Math.min(1, this.targetTimbre));
    }
    
    /**
     * Map era/age to frequency
     * Older = lower frequencies (more rumbling), newer = higher frequencies (more present)
     * Uses logarithmic mapping for more natural feel
     */
    updateFrequencyFromEra(era) {
        // Era is in years (negative for BCE, positive for CE)
        // Map to frequency range: 50Hz (very old, rumbling) to 180Hz (modern, more present)
        
        // Normalize era to 0-1 range (assuming -40000 to 2024 for cave paintings)
        const minEra = -40000;
        const maxEra = 2024;
        const normalized = Math.max(0, Math.min(1, (era - minEra) / (maxEra - minEra)));
        
        // Logarithmic mapping for more natural frequency distribution
        // Inverted: old = low, new = high
        const logNormalized = Math.pow(1 - normalized, 1.5); // Exponential curve
        
        // Map to frequency range
        const minFreq = 50; // Very low, rumbling (felt, not heard)
        const maxFreq = 180; // A3-ish, more present but still low
        this.targetFrequency = minFreq + logNormalized * (maxFreq - minFreq);
    }
    
    /**
     * Update spatial audio positioning (sound comes from gazed image)
     * Positions drone layers at the gazed image location with binaural processing
     */
    updateSpatialPositioning(imageObject) {
        if (!this.camera || !this.droneOscillators.length) return;

        const imagePos = imageObject.position;
        const cameraPos = this.camera.position;

        // Update head orientation from camera
        this.headOrientation.copy(this.camera.rotation);

        // Calculate relative position (Web Audio API uses right-handed coordinates)
        // Web Audio API coordinate system: x = right, y = up, z = forward (toward listener)
        const x = imagePos.x - cameraPos.x;
        const y = imagePos.y - cameraPos.y;
        const z = imagePos.z - cameraPos.z;

        // Update panner positions for each oscillator
        // Distribute them slightly around the image position for stereo width
        const now = this.audioContext.currentTime;

        this.droneOscillators.forEach((layer, index) => {
            const spread = 0.4; // Small spread for stereo width
            const offset = (index - 1) * spread; // Center, left, right

            const targetX = x + offset;
            const targetY = y;
            const targetZ = z;

            if (this.isRupturing) {
                // During rupture, set immediately (no smooth transition)
                if (layer.panner.positionX) {
                    layer.panner.positionX.value = targetX;
                    layer.panner.positionY.value = targetY;
                    layer.panner.positionZ.value = targetZ;
                } else {
                    layer.panner.setPosition(targetX, targetY, targetZ);
                }
            } else {
                // Smooth transition (exponential ramp)
                if (layer.panner.positionX) {
                    layer.panner.positionX.exponentialRampToValueAtTime(targetX, now + this.transitionTime);
                    layer.panner.positionY.exponentialRampToValueAtTime(targetY, now + this.transitionTime);
                    layer.panner.positionZ.exponentialRampToValueAtTime(targetZ, now + this.transitionTime);
                } else {
                    // Fallback for older browsers (immediate)
                    layer.panner.setPosition(targetX, targetY, targetZ);
                }
            }

            // Update binaural processing if enabled
            if (this.binauralEnabled && layer.binauralSplitter) {
                this.updateBinauralPositioning(layer, targetX, targetY, targetZ);
            }
        });
    }

    /**
     * Update binaural positioning for enhanced 3D spatial audio
     * @param {Object} layer - Audio layer with binaural processing
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} z - Z position
     */
    updateBinauralPositioning(layer, x, y, z) {
        // Calculate azimuth and elevation for HRTF
        const distance = Math.sqrt(x * x + y * y + z * z);
        const azimuth = Math.atan2(x, z); // Horizontal angle
        const elevation = Math.asin(y / distance); // Vertical angle

        // Update HRTF gains based on position
        // Simplified: closer = louder, angle affects left/right balance
        const distanceAttenuation = Math.max(0.1, 1 / (1 + distance * 0.1));
        const leftGain = distanceAttenuation * (azimuth > 0 ? 0.8 : 1.0);
        const rightGain = distanceAttenuation * (azimuth < 0 ? 0.8 : 1.0);

        const now = this.audioContext.currentTime;
        layer.leftGain.gain.setTargetAtTime(leftGain, now, this.transitionTime);
        layer.rightGain.gain.setTargetAtTime(rightGain, now, this.transitionTime);
    }
    
    /**
     * Modulate audio based on movement speed
     * Subtle modulation for ambient feel (not dramatic)
     */
    updateMovementModulation() {
        // Movement speed affects:
        // 1. Very slight pitch modulation (Doppler-like effect, subtle)
        // 2. Filter modulation (more movement = slightly more brightness)
        
        const speedFactor = Math.min(1, this.movementSpeed / 3); // Normalize to 0-1 (lower threshold)
        
        // Apply very slight frequency modulation based on speed (subtle, ambient)
        const speedModulation = 1 + (speedFactor * 0.03); // Up to 3% pitch increase (very subtle)
        
        // Apply subtle filter brightness based on speed
        if (!this.isRupturing) {
            const now = this.audioContext.currentTime;
            this.droneOscillators.forEach(layer => {
                const baseFilterFreq = layer.filter.frequency.value; // Current value
                const targetFilterFreq = baseFilterFreq + (speedFactor * 200); // Max 200Hz increase
                
                // Smooth transition
                layer.filter.frequency.cancelScheduledValues(now);
                layer.filter.frequency.setValueAtTime(baseFilterFreq, now);
                layer.filter.frequency.exponentialRampToValueAtTime(targetFilterFreq, now + this.transitionTime);
            });
        }
    }
    
    /**
     * Smoothly transition audio parameters using exponential ramping
     * Uses Web Audio API scheduling for smooth, professional transitions
     */
    smoothParameterUpdates() {
        if (this.isRupturing) {
            // During rupture, skip smooth transitions (will be handled in triggerRupture)
            return;
        }
        
        const now = this.audioContext.currentTime;
        const rampTime = this.transitionTime; // 100ms for smooth transitions
        
        // Smooth frequency changes using exponential ramping
        this.currentFrequency += (this.targetFrequency - this.currentFrequency) * 0.1; // Fast smoothing for internal tracking
        
        // Update oscillator frequencies with detuning (using exponential ramp)
        this.droneOscillators.forEach(layer => {
            const detuneInHz = layer.detune * this.currentFrequency / 1200; // Convert cents to Hz
            const targetFreq = this.currentFrequency + detuneInHz;
            
            // Use exponential ramp for smooth frequency transitions
            layer.oscillator.frequency.cancelScheduledValues(now);
            layer.oscillator.frequency.setValueAtTime(layer.oscillator.frequency.value, now);
            layer.oscillator.frequency.exponentialRampToValueAtTime(targetFreq, now + rampTime);
        });
        
        // Smooth timbre changes (waveform type)
        this.currentTimbre += (this.targetTimbre - this.currentTimbre) * 0.1;
        
        // Map timbre to waveform type
        // 0.0-0.3: sine (dark, smooth, rumbling)
        // 0.3-0.6: triangle (medium, slightly brighter)
        // 0.6-1.0: sawtooth (bright, harsh, unnerving)
        let waveformType = 'sine';
        if (this.currentTimbre > 0.6) {
            waveformType = 'sawtooth';
        } else if (this.currentTimbre > 0.3) {
            waveformType = 'triangle';
        }
        
        // Update oscillator types (only if changed)
        this.droneOscillators.forEach(layer => {
            if (layer.oscillator.type !== waveformType) {
                layer.oscillator.type = waveformType;
            }
        });
        
        // Update filter based on timbre (brightness) using exponential ramp
        this.droneOscillators.forEach(layer => {
            const baseFilterFreq = 800; // Lower base for darker, more ambient sound
            const maxFilterFreq = 2500; // Lower max for less harshness
            const targetFilterFreq = baseFilterFreq + (this.currentTimbre * (maxFilterFreq - baseFilterFreq));
            
            layer.filter.frequency.cancelScheduledValues(now);
            layer.filter.frequency.setValueAtTime(layer.filter.frequency.value, now);
            layer.filter.frequency.exponentialRampToValueAtTime(targetFilterFreq, now + rampTime);
        });
    }
    
    triggerRupture() {
        // Dramatic audio cut/shift during rupture transitions
        // Creates disorienting, unnerving effect
        
        if (!this.isInitialized) {
            this.init();
        }
        
        if (!this.audioContext || !this.masterGain) return;
        
        this.isRupturing = true;
        const now = this.audioContext.currentTime;
        const cutDuration = 0.4; // Cut audio for 400ms (longer for more impact)
        
        // Cut audio dramatically (quick fade out, abrupt cut)
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(this.originalGain, now);
        this.masterGain.gain.linearRampToValueAtTime(0.001, now + 0.08); // Very quick fade out
        this.masterGain.gain.setValueAtTime(0.001, now + 0.1); // Hold at near-silence
        this.masterGain.gain.linearRampToValueAtTime(this.originalGain, now + cutDuration); // Fade back in
        
        // Create dissonant, unnerving tone for the rupture
        // Multiple oscillators with clashing frequencies
        const dissonantFreqs = [
            this.currentFrequency * 1.5, // Fifth above
            this.currentFrequency * 1.26, // Minor third (dissonant)
            this.currentFrequency * 0.8  // Below (rumbling)
        ];
        
        dissonantFreqs.forEach((freq, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.masterGain);
            
            oscillator.frequency.value = freq;
            oscillator.type = 'sawtooth'; // Harsh, unnerving
            
            // Brief, sharp sound with slight delay for staggered effect
            const delay = index * 0.05;
            const duration = 0.25;
            
            gainNode.gain.setValueAtTime(0, now + delay);
            gainNode.gain.linearRampToValueAtTime(0.12, now + delay + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + delay + duration);
            
            oscillator.start(now + delay);
            oscillator.stop(now + delay + duration);
            
            // Track this source
            this.activeSources.push(oscillator);
            oscillator.onended = () => {
                const idx = this.activeSources.indexOf(oscillator);
                if (idx > -1) {
                    this.activeSources.splice(idx, 1);
                }
            };
        });
        
        // Reset rupture flag after transition completes
        setTimeout(() => {
            this.isRupturing = false;
        }, cutDuration * 1000);
    }
}
