export class PersonalizationManager {
    // Limits to prevent localStorage overflow (typically 5-10MB)
    static MAX_TRACKED_IMAGES = 100;
    static MAX_VISIT_TIMESTAMPS = 50;
    static ESTIMATED_SIZE_LIMIT = 4 * 1024 * 1024; // 4MB safety limit

    constructor() {
        this.storageKey = 'humanBlueprint_personalization';
        this.data = this.loadData();

        // Initialize visit tracking
        this.trackVisit();

        // Adaptive parameters that change based on user history
        this.adaptiveParams = {
            ruptureThreshold: 3000, // Base 3 seconds
            transitionSpeed: 1200,   // Base speed
            visualIntensity: 0.5,    // Base intensity
            audioVolume: 0.7         // Base volume
        };

        this.updateAdaptiveParams();
    }

    /**
     * Estimate the size of data in bytes
     * @returns {number} Estimated size in bytes
     */
    estimateDataSize() {
        try {
            return new Blob([JSON.stringify(this.data)]).size;
        } catch {
            return 0;
        }
    }

    /**
     * Prune old image data to stay within limits
     */
    pruneImageData() {
        const images = this.data.attention.images;
        const imageIds = Object.keys(images);

        if (imageIds.length <= PersonalizationManager.MAX_TRACKED_IMAGES) {
            return; // Within limit
        }

        // Sort by lastViewed (most recent first)
        const sortedIds = imageIds.sort((a, b) => {
            const aTime = images[a].lastViewed || 0;
            const bTime = images[b].lastViewed || 0;
            return bTime - aTime;
        });

        // Keep only the most recent images
        const idsToKeep = new Set(sortedIds.slice(0, PersonalizationManager.MAX_TRACKED_IMAGES));

        // Remove old entries
        for (const id of imageIds) {
            if (!idsToKeep.has(id)) {
                delete images[id];
            }
        }

        console.log(`Pruned ${imageIds.length - PersonalizationManager.MAX_TRACKED_IMAGES} old image entries`);
    }

    // Load data from localStorage
    loadData() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Handle version upgrades if needed
                if (!parsed.version || parsed.version < 1) {
                    return this.migrateData(parsed);
                }
                return parsed;
            }
        } catch (error) {
            console.warn('Failed to load personalization data:', error);
        }

        // Return default data structure
        return {
            version: 1,
            visits: {
                count: 0,
                firstVisit: null,
                lastVisit: null,
                timestamps: []
            },
            attention: {
                totalGazeTime: 0,
                totalDwellTime: 0,
                images: {},
                patterns: {
                    scanning: 0,
                    dwelling: 0,
                    returning: 0
                }
            },
            preferences: {
                deviceType: null,
                preferredContentTypes: [],
                experienceLevel: 'newbie'
            }
        };
    }

    // Migrate old data formats
    migrateData(oldData) {
        // For now, just return new structure
        // In future versions, implement proper migration
        return this.loadData();
    }

    // Save data to localStorage
    saveData() {
        try {
            // Prune old data if we're approaching size limits
            this.pruneImageData();

            // Also limit visit timestamps
            if (this.data.visits.timestamps.length > PersonalizationManager.MAX_VISIT_TIMESTAMPS) {
                this.data.visits.timestamps = this.data.visits.timestamps.slice(-PersonalizationManager.MAX_VISIT_TIMESTAMPS);
            }

            const serialized = JSON.stringify(this.data);

            // Check if we're within size limits
            if (serialized.length > PersonalizationManager.ESTIMATED_SIZE_LIMIT) {
                console.warn('Personalization data approaching size limit, pruning more aggressively');
                // More aggressive pruning - keep only half
                const imageIds = Object.keys(this.data.attention.images);
                if (imageIds.length > PersonalizationManager.MAX_TRACKED_IMAGES / 2) {
                    this.pruneImageData();
                }
            }

            localStorage.setItem(this.storageKey, serialized);
        } catch (error) {
            console.warn('Failed to save personalization data:', error);

            // If quota exceeded, try to recover by clearing old data
            if (error.name === 'QuotaExceededError' || error.code === 22) {
                console.warn('localStorage quota exceeded, clearing old data');
                this.data.attention.images = {};
                this.data.visits.timestamps = this.data.visits.timestamps.slice(-10);
                try {
                    localStorage.setItem(this.storageKey, JSON.stringify(this.data));
                } catch (retryError) {
                    console.error('Failed to save even after clearing:', retryError);
                }
            }
        }
    }

    // Track a new visit
    trackVisit() {
        const now = Date.now();

        if (!this.data.visits.firstVisit) {
            this.data.visits.firstVisit = now;
        }

        this.data.visits.count += 1;
        this.data.visits.lastVisit = now;
        this.data.visits.timestamps.push(now);

        // Keep only last 50 visit timestamps
        if (this.data.visits.timestamps.length > 50) {
            this.data.visits.timestamps = this.data.visits.timestamps.slice(-50);
        }

        this.saveData();
    }

    // Check if this is a return visit
    isReturnVisit() {
        return this.data.visits.count > 1;
    }

    // Get visit statistics
    getVisitStats() {
        const now = Date.now();
        const timeSinceFirstVisit = now - this.data.visits.firstVisit;
        const timeSinceLastVisit = now - this.data.visits.lastVisit;

        return {
            totalVisits: this.data.visits.count,
            isReturnVisit: this.isReturnVisit(),
            daysSinceFirstVisit: Math.floor(timeSinceFirstVisit / (1000 * 60 * 60 * 24)),
            hoursSinceLastVisit: Math.floor(timeSinceLastVisit / (1000 * 60 * 60)),
            visitFrequency: this.calculateVisitFrequency()
        };
    }

    // Calculate average visits per day
    calculateVisitFrequency() {
        if (this.data.visits.timestamps.length < 2) return 0;

        const first = this.data.visits.timestamps[0];
        const last = this.data.visits.timestamps[this.data.visits.timestamps.length - 1];
        const spanDays = (last - first) / (1000 * 60 * 60 * 24);

        if (spanDays <= 0) return this.data.visits.count;

        return this.data.visits.count / spanDays;
    }

    // Track gaze start on an image
    trackGazeStart(imageId) {
        if (!this.data.attention.images[imageId]) {
            this.data.attention.images[imageId] = {
                viewCount: 0,
                totalDwellTime: 0,
                lastViewed: null,
                firstViewed: null,
                patterns: {
                    scanning: 0,
                    dwelling: 0,
                    returning: 0
                }
            };
        }

        const imageData = this.data.attention.images[imageId];
        imageData.viewCount += 1;
        imageData.lastViewed = Date.now();

        if (!imageData.firstViewed) {
            imageData.firstViewed = Date.now();
        }

        this.saveData();
    }

    // Track gaze dwell on an image
    trackGazeDwell(imageId, duration) {
        if (this.data.attention.images[imageId]) {
            this.data.attention.images[imageId].totalDwellTime += duration;
            this.data.attention.totalDwellTime += duration;
        }
        this.data.attention.totalGazeTime += duration;

        this.saveData();
    }

    // Track gaze pattern
    trackGazePattern(patternType) {
        if (this.data.attention.patterns.hasOwnProperty(patternType)) {
            this.data.attention.patterns[patternType] += 1;
        }

        // Also track per image if we have current gaze target
        // This would need to be called with imageId context

        this.saveData();
    }

    // Track device type preference
    setDeviceType(deviceType) {
        this.data.preferences.deviceType = deviceType;
        this.saveData();
    }

    // Get most viewed images
    getMostViewedImages(limit = 5) {
        const images = Object.entries(this.data.attention.images)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => b.viewCount - a.viewCount);

        return images.slice(0, limit);
    }

    // Get images with longest dwell time
    getMostDwelledImages(limit = 5) {
        const images = Object.entries(this.data.attention.images)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => b.totalDwellTime - a.totalDwellTime);

        return images.slice(0, limit);
    }

    // Update adaptive parameters based on user history
    updateAdaptiveParams() {
        const stats = this.getVisitStats();
        const attention = this.data.attention;

        // Adjust rupture threshold based on experience
        if (stats.totalVisits > 10) {
            // Experienced users get faster ruptures
            this.adaptiveParams.ruptureThreshold = 2000;
        } else if (stats.totalVisits > 5) {
            this.adaptiveParams.ruptureThreshold = 2500;
        } else {
            this.adaptiveParams.ruptureThreshold = 3000;
        }

        // Adjust visual intensity based on total gaze time
        const totalHoursGazed = attention.totalGazeTime / (1000 * 60 * 60);
        if (totalHoursGazed > 2) {
            this.adaptiveParams.visualIntensity = 0.8; // More intense for engaged users
        } else if (totalHoursGazed > 0.5) {
            this.adaptiveParams.visualIntensity = 0.6;
        } else {
            this.adaptiveParams.visualIntensity = 0.4;
        }

        // Adjust transition speed - faster for return visitors
        if (stats.isReturnVisit) {
            this.adaptiveParams.transitionSpeed = 1000;
        } else {
            this.adaptiveParams.transitionSpeed = 1200;
        }

        // Set experience level
        if (stats.totalVisits > 20) {
            this.data.preferences.experienceLevel = 'expert';
        } else if (stats.totalVisits > 5) {
            this.data.preferences.experienceLevel = 'experienced';
        } else {
            this.data.preferences.experienceLevel = 'newbie';
        }

        this.saveData();
    }

    // Get adaptive parameters for systems to use
    getAdaptiveParams() {
        return { ...this.adaptiveParams };
    }

    // Get user insights for debugging/analytics
    getUserInsights() {
        const stats = this.getVisitStats();
        const mostViewed = this.getMostViewedImages(3);
        const mostDwelled = this.getMostDwelledImages(3);

        return {
            visitStats: stats,
            attentionStats: {
                totalGazeTime: this.data.attention.totalGazeTime,
                totalDwellTime: this.data.attention.totalDwellTime,
                averageDwellTime: this.data.attention.totalDwellTime / Math.max(this.data.attention.totalGazeTime, 1),
                uniqueImagesViewed: Object.keys(this.data.attention.images).length,
                patternCounts: this.data.attention.patterns
            },
            topImages: {
                mostViewed,
                mostDwelled
            },
            preferences: this.data.preferences,
            adaptiveParams: this.adaptiveParams
        };
    }

    // Reset all data (for testing or user request)
    reset() {
        this.data = this.loadData(); // This will return default structure
        this.saveData();
        this.updateAdaptiveParams();
    }
}