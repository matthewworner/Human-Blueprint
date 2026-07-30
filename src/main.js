import * as THREE from 'three';
import { SceneManager } from './core/SceneManager.js';
import { ImageLoader } from './core/ImageLoader.js';
import { ArrangementAlgorithm } from './core/ArrangementAlgorithm.js';
import { GazeTracker } from './core/GazeTracker.js';
import { RuptureSystem } from './core/RuptureSystem.js';
import { AudioSystem } from './core/AudioSystem.js';
import { PersonalizationManager } from './core/PersonalizationManager.js';
import { UserPathTracker } from './core/UserPathTracker.js';
import { UserPathVisualizer } from './core/UserPathVisualizer.js';
import { HapticFeedback, hapticFeedback } from './core/HapticFeedback.js';
import { DwellProgressIndicator } from './core/DwellProgressIndicator.js';

class HumanBlueprint {
    constructor() {
        this.sceneManager = null;
        this.imageLoader = null;
        this.arrangement = null;
        this.gazeTracker = null;
        this.ruptureSystem = null;
        this.audioSystem = null;
        this.personalizationManager = null;

        this.images = [];
        this.imageObjects = [];

        // User path tracking
        this.userPathTracker = null;
        this.userPathVisualizer = null;

        // Haptic feedback
        this.hapticFeedback = hapticFeedback;

        // Dwell progress indicator
        this.dwellIndicator = null;

        this.init().catch((error) => {
            console.error('Failed to initialize The Human Blueprint:', error);
            const loading = document.getElementById('loading');
            if (loading && !loading.textContent.includes('Unable to Load')) {
                loading.textContent = 'Unable to initialise. Reload to try again.';
            }
        });
    }

    async init() {
        console.log('Initializing The Human Blueprint...');
        
        // Initialize personalization system first
        this.personalizationManager = new PersonalizationManager();

        // Log visit information
        const visitStats = this.personalizationManager.getVisitStats();
        console.log('Visit stats:', visitStats);

        // Initialize core systems
        this.sceneManager = new SceneManager(document.getElementById('canvas-container'));
        this.imageLoader = new ImageLoader();
        this.arrangement = new ArrangementAlgorithm();

        // Optional systems (for full experience)
        try {
            this.gazeTracker = new GazeTracker(this.sceneManager.camera, this.sceneManager.renderer);
            // Set device type in personalization
            this.personalizationManager.setDeviceType(this.gazeTracker.deviceType);

            this.audioSystem = new AudioSystem();
            // Initialize audio system (async, but won't block)
            this.audioSystem.init().catch(err => {
                console.warn('Audio system initialization failed:', err);
            });

            // Get adaptive parameters for rupture system
            const adaptiveParams = this.personalizationManager.getAdaptiveParams();
            this.ruptureSystem = new RuptureSystem(this.sceneManager, this.gazeTracker, this.audioSystem);

            // Apply adaptive parameters
            this.ruptureSystem.setDwellThreshold(adaptiveParams.ruptureThreshold);
            this.ruptureSystem.setTransitionSpeed(adaptiveParams.transitionSpeed);
            this.ruptureSystem.setFadeIntensity(adaptiveParams.visualIntensity);
            this.ruptureSystem.setHighlightIntensity(adaptiveParams.visualIntensity * 1.5);

            // Initialize user path tracking
            this.userPathTracker = new UserPathTracker(this.personalizationManager);
            this.userPathTracker.loadFromPersistence();
            this.userPathVisualizer = new UserPathVisualizer(this.sceneManager.scene, this.sceneManager.camera);

        } catch (error) {
            console.warn('Some systems failed to initialize:', error);
            // Continue without these systems for basic test
        }

        // Load images
        await this.loadImages();

        // Arrange images in 3D space
        this.arrangeImages();

        // Start generative soundscape (after images are arranged)
        // Note: May need user interaction due to browser autoplay policy
        this.startSoundscapeOnInteraction();

        // Start interaction loop
        this.startInteraction();

        // Set up WebXR button
        this.setupXRButton();

        // Update info display with personalized message
        this.updatePersonalizedInfoDisplay();

        // Set up tooltip for image hover
        this.setupTooltip();

        // Set up dwell progress indicator
        this.dwellIndicator = new DwellProgressIndicator(
            this.sceneManager.scene,
            this.sceneManager.camera
        );

        // Set up settings panel
        this.setupSettingsPanel();

        // Hide loading screen
        document.getElementById('loading').classList.add('hidden');

        console.log('Blueprint ready.');

        // Minimal debug hook so the smoke test can gaze at a real artwork.
        if (typeof window !== 'undefined') {
            window.__bpPointAtArtwork = () => this.sceneManager?.pointAtNearestArtwork?.() ?? null;
            window.__bpLoadedTextureCount = () => this.sceneManager?.loadedTextureCount?.() ?? 0;
        }

        // Set up page unload cleanup
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
    }

    async loadImages() {
        // Set up loading progress callback
        this.imageLoader.onProgress = (progress) => {
            this.updateLoadingProgress(progress);
        };

        this.imageLoader.onComplete = (images) => {
            console.log(`Loaded ${images.length} images from JSON`);
        };

        try {
            // Load images from JSON file
            const loadedImages = await this.imageLoader.loadFromJSON('/images.json');
            this.images = loadedImages;

            console.log(`Loaded ${this.images.length} images from JSON`);

            // Log texture loading status
            const texturesLoaded = loadedImages.filter(img => img.texture && !img.metadata?.isPlaceholder).length;
            console.log(`Textures loaded: ${texturesLoaded}/${loadedImages.length}`);

            // Check for any failed loads
            const failed = loadedImages.filter(img => img.metadata?.isPlaceholder && img.url).length;
            if (failed > 0) {
                console.warn(`${failed} images failed to load and are using placeholders`);
            }
        } catch (error) {
            console.error('Failed to load images from JSON:', error);
            
            // Show error with retry option
            const loadingEl = document.getElementById('loading');
            if (loadingEl) {
                loadingEl.innerHTML = `
                    <div style="text-align: center;">
                        <div style="margin-bottom: 12px; font-size: 18px; font-weight: 600;">
                            Unable to Load
                        </div>
                        <div style="font-size: 13px; color: var(--color-gray); margin-bottom: 20px;">
                            Please check your connection and try again
                        </div>
                        <button onclick="window.location.reload()" 
                                style="background: var(--color-white); color: var(--color-black); 
                                       border: none; border-radius: 12px; padding: 12px 24px; 
                                       cursor: pointer; font-family: var(--font-system); 
                                       font-size: 15px; font-weight: 500;">
                            Try Again
                        </button>
                    </div>
                `;
            }
            throw error;
        }
    }

    updateLoadingProgress(progress) {
        const loadingEl = document.getElementById('loading');
        if (loadingEl && progress.total > 0) {
            loadingEl.innerHTML = `
                Loading Human Blueprint
                <div class="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                <div style="margin-top: 12px; font-size: 12px; opacity: 0.5;">
                    ${Math.min(progress.loaded, progress.total)} of ${progress.total} images
                </div>
            `;
        }
    }

    arrangeImages() {
        // Create image planes from loaded image data
        // Positions are already set in imageData.position from JSON or strategy
        this.imageObjects = this.images.map((imageData) => {
            return this.sceneManager.createImagePlane(imageData);
        });

        // Apply adaptive arrangement based on user history
        this.applyAdaptiveArrangement();

        // Set up click detection
        this.sceneManager.setGlobalImageClickCallback((object, imageData) => {
            this.handleImageClick(object, imageData);
        });

        // Register images with path visualizer
        if (this.userPathVisualizer) {
            this.userPathVisualizer.registerImages(this.imageObjects);
            
            // Load existing path and draw lines
            if (this.userPathTracker) {
                const connections = this.userPathTracker.getPathConnections();
                connections.forEach(conn => {
                    this.userPathVisualizer.addPathLine(conn.from, conn.to);
                });
                
                // Mark viewed images
                this.userPathTracker.getViewedImageIds().forEach(id => {
                    this.userPathVisualizer.addViewedMarker(id);
                });
            }
        }

        console.log(`Arranged ${this.imageObjects.length} images in 3D space`);
    }

    applyAdaptiveArrangement() {
        if (!this.personalizationManager) return;

        const mostViewed = this.personalizationManager.getMostViewedImages(3);
        const visitStats = this.personalizationManager.getVisitStats();

        // For return visitors, slightly adjust positions of favorite images
        if (visitStats.isReturnVisit && mostViewed.length > 0) {
            mostViewed.forEach((imageData, index) => {
                const imageObj = this.imageObjects.find(obj =>
                    obj.userData?.imageData?.id === imageData.id
                );

                if (imageObj) {
                    // Move favorite images slightly closer to center for easier access
                    const originalPos = imageObj.position.clone();
                    const centerBias = 0.1 * (index + 1); // More viewed = closer to center

                    imageObj.position.lerp(new THREE.Vector3(0, 0, 0), centerBias);
                    // Keep some of original position
                    imageObj.position.lerp(originalPos, 0.7);
                }
            });
        }

        // For experienced users, increase spacing slightly for more exploration
        if (visitStats.totalVisits > 5) {
            this.imageObjects.forEach(obj => {
                const direction = obj.position.clone().normalize();
                obj.position.add(direction.multiplyScalar(0.5)); // Push images out slightly
            });
        }
    }

    handleImageClick(object, imageData) {
        console.log('Image clicked:', imageData.id, imageData);

        // Visual feedback
        object.scale.setScalar(1.2);
        setTimeout(() => {
            object.scale.setScalar(1.0);
        }, 200);

        // You can add more click handling here (show info, trigger rupture, etc.)
    }

    setupTooltip() {
        const tooltip = document.getElementById('tooltip');
        const tooltipTitle = document.getElementById('tooltip-title');
        const tooltipMeta = document.getElementById('tooltip-meta');
        const tooltipEra = document.getElementById('tooltip-era');

        // Track current hovered image
        let currentImageId = null;
        let hideTimeout = null;

        // Clear any pending tooltip hide
        const clearHideTimeout = () => {
            if (hideTimeout) {
                clearTimeout(hideTimeout);
                hideTimeout = null;
            }
        };

        // Called when gaze starts on an image
        this.onImageHover = (imageId, imageData) => {
            if (imageId !== currentImageId) {
                currentImageId = imageId;
                clearHideTimeout();

                // Show tooltip with image metadata
                const title = imageData?.metadata?.title || imageData?.id || 'Unknown';
                const artist = imageData?.metadata?.artist || '';
                const date = imageData?.metadata?.date || '';
                const era = imageData?.era;
                const credit = imageData?.licence?.credit || '';

                tooltipTitle.textContent = title;
                tooltipMeta.textContent = [artist, date].filter(Boolean).join(' · ') || 'Artwork';

                // Format era, and show rights/attribution when we have it.
                const eraStr = era ? (era < 0 ? `${Math.abs(era)} BCE` : `${era} CE`) : '';
                tooltipEra.textContent = [eraStr, credit].filter(Boolean).join(' · ');

                tooltip.classList.add('visible');
            }
        };

        // Called when gaze ends on an image
        this.onImageLeave = (imageId) => {
            if (imageId === currentImageId) {
                currentImageId = null;

                // Delay hide for smooth transition
                clearHideTimeout();
                hideTimeout = setTimeout(() => {
                    tooltip.classList.remove('visible');
                }, 200);
            }
        };
    }

    setupSettingsPanel() {
        const panel = document.getElementById('settings-panel');
        const toggleBtn = document.getElementById('settings-toggle');
        const closeBtn = document.getElementById('settings-close');
        
        // Settings controls
        const volumeSlider = document.getElementById('setting-volume');
        const volumeValue = document.getElementById('setting-volume-value');
        const intensitySlider = document.getElementById('setting-intensity');
        const intensityValue = document.getElementById('setting-intensity-value');
        const speedSlider = document.getElementById('setting-speed');
        const speedValue = document.getElementById('setting-speed-value');
        const pathToggle = document.getElementById('setting-path');
        const dwellSlider = document.getElementById('setting-dwell');
        const dwellValue = document.getElementById('setting-dwell-value');
        
        // Load saved settings or use defaults
        const savedSettings = this.personalizationManager?.loadData('settings') || {};
        
        // Initialize sliders with saved values
        const initialVolume = savedSettings.volume ?? 50;
        const initialIntensity = savedSettings.intensity ?? 50;
        const initialSpeed = savedSettings.speed ?? 50;
        const initialDwell = savedSettings.dwell ?? 3;
        const initialPath = savedSettings.showPath ?? true;
        
        volumeSlider.value = initialVolume;
        intensitySlider.value = initialIntensity;
        speedSlider.value = initialSpeed;
        dwellSlider.value = initialDwell;
        pathToggle.checked = initialPath;
        
        // Update display values
        volumeValue.textContent = initialVolume + '%';
        intensityValue.textContent = initialIntensity + '%';
        speedValue.textContent = initialSpeed + '%';
        dwellValue.textContent = initialDwell + 's';
        
        // Toggle panel visibility
        toggleBtn.addEventListener('click', () => {
            panel.classList.add('visible');
            this.hapticFeedback.light();
        });
        
        closeBtn.addEventListener('click', () => {
            panel.classList.remove('visible');
            this.hapticFeedback.light();
        });
        
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                panel.classList.remove('visible');
            }
        });
        
        // Volume slider
        volumeSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            volumeValue.textContent = value + '%';
            
            // Apply to audio system
            if (this.audioSystem && this.audioSystem.setMasterVolume) {
                this.audioSystem.setMasterVolume(value / 100);
            }
            
            // Save setting
            this.saveSetting('volume', value);
        });
        
        volumeSlider.addEventListener('change', () => {
            this.hapticFeedback.success();
        });
        
        // Intensity slider
        intensitySlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            intensityValue.textContent = value + '%';
            
            // Apply to rupture system
            if (this.ruptureSystem) {
                const normalized = value / 100;
                this.ruptureSystem.setFadeIntensity(normalized * 0.5);
                this.ruptureSystem.setHighlightIntensity(normalized * 1.5);
            }
            
            this.saveSetting('intensity', value);
        });
        
        intensitySlider.addEventListener('change', () => {
            this.hapticFeedback.success();
        });
        
        // Speed slider
        speedSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            speedValue.textContent = value + '%';
            
            // Apply to rupture system (map to transition speed)
            if (this.ruptureSystem) {
                // 0% = 400ms, 100% = 3000ms
                const speed = 400 + (value / 100) * 2600;
                this.ruptureSystem.setTransitionSpeed(speed);
            }
            
            this.saveSetting('speed', value);
        });
        
        // Dwell slider
        dwellSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            dwellValue.textContent = value + 's';
            
            // Apply to rupture system
            if (this.ruptureSystem) {
                this.ruptureSystem.setDwellThreshold(value * 1000);
            }
            
            this.saveSetting('dwell', value);
        });
        
        // Path toggle
        pathToggle.addEventListener('change', (e) => {
            const show = e.target.checked;
            
            // Toggle path visualization
            if (this.userPathVisualizer) {
                this.userPathVisualizer.setEnabled(show);
            }
            
            this.saveSetting('showPath', show);
        });
        
        // Initial path setting
        if (this.userPathVisualizer && !initialPath) {
            this.userPathVisualizer.setEnabled(false);
        }
    }

    saveSetting(key, value) {
        if (!this.personalizationManager) return;
        
        const settings = this.personalizationManager.loadData('settings') || {};
        settings[key] = value;
        this.personalizationManager.saveData('settings', settings);
    }

    startInteraction() {
        // Set up gaze tracking events - if available
        if (this.gazeTracker) {
            this.gazeTracker.onGazeStart = (imageId) => {
                this.personalizationManager.trackGazeStart(imageId);
                this.handleGazeStart(imageId);
                
                // Track user path
                if (this.userPathTracker) {
                    this.userPathTracker.startView(imageId);
                }
                
                // Haptic feedback
                this.hapticFeedback.light();
            };

            this.gazeTracker.onGazeDwell = (imageId, duration) => {
                this.personalizationManager.trackGazeDwell(imageId, duration);
                this.handleGazeDwell(imageId, duration);
            };

            this.gazeTracker.onGazeEnd = (imageId, duration) => {
                this.handleGazeEnd(imageId, duration);
                
                // End user path tracking
                if (this.userPathTracker) {
                    this.userPathTracker.endView();
                }
            };

            this.gazeTracker.onGazePattern = (patternType) => {
                this.personalizationManager.trackGazePattern(patternType);
                this.handleGazePattern(patternType);
            };
        }

        // Set up rupture callbacks - if available
        if (this.ruptureSystem) {
            this.ruptureSystem.onRupture = (sourceImage, destination, ruptureType) => {
                this.handleRupture(sourceImage, destination);
                
                // Record rupture in user path
                if (this.userPathTracker && sourceImage && destination) {
                    const fromId = sourceImage.userData?.imageData?.id;
                    const toId = destination.userData?.imageData?.id;
                    if (fromId && toId) {
                        this.userPathTracker.recordRupture(fromId, toId);
                        
                        // Add visual path line
                        if (this.userPathVisualizer) {
                            this.userPathVisualizer.addPathLine(fromId, toId);
                        }
                        
                        // Haptic feedback for rupture
                        this.hapticFeedback.medium();
                    }
                }
            };
        }

        // Start render loop
        this.animate();
    }

    startSoundscapeOnInteraction() {
        // Set up one-time user interaction handler (required by browser autoplay policy)
        const startAudioOnInteraction = async () => {
            if (this.audioSystem && !this.audioSystem.soundscapeActive && this.imageObjects.length > 0) {
                // Resume audio context if suspended
                if (this.audioSystem.audioContext && this.audioSystem.audioContext.state === 'suspended') {
                    await this.audioSystem.audioContext.resume();
                }
                this.startAdaptiveSoundscape();
            }
            // Remove listeners after first interaction
            document.removeEventListener('click', startAudioOnInteraction);
            document.removeEventListener('touchstart', startAudioOnInteraction);
        };

        // Listen for first user interaction
        document.addEventListener('click', startAudioOnInteraction, { once: true });
        document.addEventListener('touchstart', startAudioOnInteraction, { once: true });
    }

    startAdaptiveSoundscape() {
        if (!this.audioSystem || this.imageObjects.length === 0) return;

        // Start the soundscape
        this.audioSystem.startSoundscape(this.imageObjects, this.sceneManager.camera);

        // Adjust volume based on user history
        if (this.personalizationManager) {
            const insights = this.personalizationManager.getUserInsights();
            const adaptiveParams = this.personalizationManager.getAdaptiveParams();

            // For return visitors, start at preferred volume
            // For new users, start quieter and let them adjust
            let initialVolume = 0.7;
            if (insights.visitStats.isReturnVisit) {
                initialVolume = adaptiveParams.audioVolume;
            } else {
                initialVolume = 0.3; // Quieter for first-time users
            }

            // Apply volume after a short delay to ensure audio system is ready
            setTimeout(() => {
                if (this.audioSystem.setMasterVolume) {
                    this.audioSystem.setMasterVolume(initialVolume);
                }
            }, 1000);
        }
    }

    setupXRButton() {
        const xrButton = document.getElementById('xr-button');

        // Set up XR update callback so main.js updates run in XR mode
        this.sceneManager.setXRUpdateCallback(() => {
            this.updateXR();
        });

        // Check if WebXR is available
        if (navigator.xr) {
            navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
                if (supported) {
                    xrButton.disabled = false;
                    xrButton.textContent = 'Enter VR';
                    xrButton.addEventListener('click', () => {
                        this.sceneManager.enterXR();
                    });
                } else {
                    xrButton.textContent = 'VR Not Available';
                }
            });
        } else {
            xrButton.textContent = 'WebXR Not Supported';
        }
    }

    updateXR() {
        // Update device type for gaze tracker (VR mode)
        if (this.gazeTracker) {
            const oldDeviceType = this.gazeTracker.deviceType;
            this.gazeTracker.updateDeviceType();
            const newDeviceType = this.gazeTracker.deviceType;

            // Update personalization if device type changed
            if (oldDeviceType !== newDeviceType && this.personalizationManager) {
                this.personalizationManager.setDeviceType(newDeviceType);
            }
        }

        // Update systems that need to run in XR mode
        // Update gaze tracking with image objects - if available
        if (this.gazeTracker && this.imageObjects.length > 0) {
            this.gazeTracker.detectGaze(this.imageObjects);
        }

        // Update rupture system - if available
        if (this.ruptureSystem) {
            this.ruptureSystem.update();
        }

        // Update soundscape camera reference for XR mode
        if (this.audioSystem && this.audioSystem.soundscapeActive) {
            this.audioSystem.camera = this.sceneManager.camera;
        }

        // Update visual feedback for gazed images
        this.updateImageFeedback();
    }

    handleGazeStart(imageId) {
        // Show tooltip on gaze
        const target = this.imageObjects.find(obj =>
            obj.userData?.imageData?.id === imageId || obj.userData?.id === imageId
        );

        if (target && this.onImageHover) {
            this.onImageHover(imageId, target.userData.imageData);
        }

        console.log('Gaze started on image:', imageId);

        if (target) {
            // Update visual feedback
            target.userData.isGazed = true;

            // Start dwell progress indicator
            if (this.dwellIndicator && this.ruptureSystem) {
                this.dwellIndicator.startDwell(target, this.ruptureSystem.ruptureThreshold);
            }

            // Track dwell time for rupture system
            if (this.ruptureSystem) {
                this.ruptureSystem.updateDwell(target);
            }
        }
    }

    handleGazeDwell(imageId, duration) {
        // Periodic updates while dwelling
        // Duration is in milliseconds
        const target = this.imageObjects.find(obj =>
            obj.userData?.imageData?.id === imageId || obj.userData?.id === imageId
        );

        if (target) {
            // Update dwell time in userData
            target.userData.dwellTime = duration;

            // Track for rupture system - pass duration from GazeTracker
            if (this.ruptureSystem) {
                this.ruptureSystem.updateDwell(target, duration);
            }
        }
    }

    handleGazeEnd(imageId, duration) {
        // Hide tooltip on gaze end
        if (this.onImageLeave) {
            this.onImageLeave(imageId);
        }

        console.log('Gaze ended on image:', imageId, 'Duration:', duration, 'ms');

        // Find the target object
        const target = this.imageObjects.find(obj =>
            obj.userData?.imageData?.id === imageId || obj.userData?.id === imageId
        );

        if (target) {
            // Clear visual feedback
            target.userData.isGazed = false;
            target.userData.dwellTime = 0;
        }
        
        // End dwell progress indicator
        if (this.dwellIndicator) {
            this.dwellIndicator.endDwell();
        }
    }

    handleGazePattern(patternType) {
        console.log('Gaze pattern detected:', patternType);

        // Pattern types: "dwelling" | "scanning" | "returning"
        // This will drive rupture logic later
        // For now, just log it
    }

    handleRupture(sourceImage, destination) {
        console.log('RUPTURE triggered:', sourceImage, destination);

        // Audio rupture
        this.audioSystem.triggerRupture();

        // Note: Visual rupture effect is handled in RuptureSystem.executeRupture()
    }

    animate() {
        // Update device type for gaze tracker (in case VR was entered/exited)
        if (this.gazeTracker) {
            this.gazeTracker.updateDeviceType();
        }

        // Update gaze tracking with image objects - if available
        if (this.gazeTracker && this.imageObjects.length > 0) {
            this.gazeTracker.detectGaze(this.imageObjects);
        }

        // Update rupture system - if available
        if (this.ruptureSystem) {
            this.ruptureSystem.update();
            // Update thread visualization animation
            this.ruptureSystem.updateThreadVisualization();
        }

        // Update user path visualization
        if (this.userPathVisualizer) {
            this.userPathVisualizer.update();
        }

        // Update dwell progress indicator
        if (this.dwellIndicator) {
            this.dwellIndicator.update();
        }

        // Update visual feedback for gazed images
        this.updateImageFeedback();

        // Update soundscape (continuous updates handled internally, but ensure camera reference is current)
        if (this.audioSystem && this.audioSystem.soundscapeActive) {
            // Camera reference is already set, but ensure it's current
            this.audioSystem.camera = this.sceneManager.camera;
        }

        // Periodically update adaptive parameters (every 5 minutes)
        if (this.personalizationManager && Math.random() < 0.001) { // ~1 in 1000 frames
            this.personalizationManager.updateAdaptiveParams();
            // Reapply to systems if needed
            if (this.ruptureSystem) {
                const params = this.personalizationManager.getAdaptiveParams();
                this.ruptureSystem.setDwellThreshold(params.ruptureThreshold);
                this.ruptureSystem.setTransitionSpeed(params.transitionSpeed);
                this.ruptureSystem.setFadeIntensity(params.visualIntensity);
                this.ruptureSystem.setHighlightIntensity(params.visualIntensity * 1.5);
            }
        }

        // Render
        this.sceneManager.render();

        // Only use requestAnimationFrame when not in XR mode
        // XR mode uses its own animation loop via setAnimationLoop
        if (!this.sceneManager.renderer.xr.isPresenting) {
            requestAnimationFrame(() => this.animate());
        }
    }

    updateImageFeedback() {
        const time = performance.now() * 0.002; // For breathing animation
        
        this.imageObjects.forEach(obj => {
            if (obj?.userData?.isGazed) {
                // Apple-style: subtle scale with spring-like easing + breathing
                const targetScale = 1.02;
                const breathe = 1 + Math.sin(time * 2) * 0.008; // Subtle breathing
                const currentScale = obj.scale.x;
                const newScale = currentScale + (targetScale * breathe - currentScale) * 0.15;
                obj.scale.setScalar(newScale);
                
                // Soft glow (subtle)
                obj.material.emissive.setHex(0x222222);
            } else {
                // Return to normal with smooth easing
                const currentScale = obj.scale.x;
                const newScale = currentScale + (1.0 - currentScale) * 0.1;
                obj.scale.setScalar(newScale);
                
                obj.material.emissive.setHex(0x000000);
            }
        });
    }

    updatePersonalizedInfoDisplay() {
        if (!this.personalizationManager) {
            this.updateInfoDisplay('The Human Blueprint', 'Gaze at an image to explore', `${this.images.length} artworks`);
            return;
        }

        const visitStats = this.personalizationManager.getVisitStats();
        const insights = this.personalizationManager.getUserInsights();

        let phase = 'The Human Blueprint';
        let instructions = 'Gaze at an image to explore';
        let status = `${this.images.length} artworks`;

        // Personalize based on visit history
        if (visitStats.isReturnVisit) {
            phase = `Welcome Back`;
            instructions = `Gaze at an image to explore`;

            if (insights.topImages.mostViewed.length > 0) {
                status = `${insights.topImages.mostViewed.length} favorites revisited`;
            }
        } else {
            phase = 'The Human Blueprint';
            status = `${this.images.length} artworks await`;
        }

        this.updateInfoDisplay(phase, instructions, status);
    }

    /**
     * Clean up all resources
     */
    cleanup() {
        console.log('Cleaning up Human Blueprint...');

        // Save user path data
        if (this.userPathTracker) {
            this.userPathTracker.persistViewData();
        }

        // Clean up user path systems
        if (this.userPathVisualizer) {
            this.userPathVisualizer.destroy();
        }
        if (this.userPathTracker) {
            this.userPathTracker.destroy();
        }

        // Clean up rupture system
        if (this.ruptureSystem?.destroy) {
            this.ruptureSystem.destroy();
        }

        // Clean up audio system
        if (this.audioSystem?.destroy) {
            this.audioSystem.destroy();
        }

        // Clean up gaze tracker
        if (this.gazeTracker) {
            this.gazeTracker = null;
        }

        // Clean up dwell indicator
        if (this.dwellIndicator) {
            this.dwellIndicator.destroy();
        }

        // Clean up scene manager (includes texture manager)
        if (this.sceneManager?.destroy) {
            this.sceneManager.destroy();
        }

        console.log('Cleanup complete.');
    }

    updateInfoDisplay(phase, instructions, status) {
        const phaseEl = document.getElementById('info-phase');
        const instructionsEl = document.getElementById('info-instructions');
        const statusEl = document.getElementById('info-status');

        if (phaseEl) phaseEl.textContent = phase;
        if (instructionsEl) instructionsEl.textContent = instructions;
        if (statusEl) statusEl.textContent = status;
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new HumanBlueprint();
    });
} else {
    new HumanBlueprint();
}

