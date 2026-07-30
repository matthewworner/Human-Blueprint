/**
 * UserPathTracker - Track user's journey through the art space
 * Records viewed images, dwell times, and path connections
 */

export class UserPathTracker {
    constructor(personalizationManager = null) {
        this.personalizationManager = personalizationManager;
        
        // Path data
        this.viewedImages = new Map(); // id -> { timestamp, dwellTime, views }
        this.pathConnections = []; // Array of { from, to, timestamp }
        this.maxConnections = 50; // Keep last 50 connections
        
        // Current tracking state
        this.currentImageId = null;
        this.viewStartTime = null;
        
        // Callbacks
        this.onImageViewed = null; // (imageId, viewData)
        this.onPathConnection = null; // (from, to)
    }

    /**
     * Start tracking a view on an image
     */
    startView(imageId) {
        if (!imageId) return;
        
        // End previous view if any
        if (this.currentImageId && this.currentImageId !== imageId) {
            this.endView();
        }
        
        this.currentImageId = imageId;
        this.viewStartTime = Date.now();
        
        // Mark as viewed if first time
        if (!this.viewedImages.has(imageId)) {
            this.viewedImages.set(imageId, {
                timestamp: Date.now(),
                dwellTime: 0,
                views: 0
            });
        }
        
        // Increment view count
        const viewData = this.viewedImages.get(imageId);
        viewData.views++;
        
        // Persist to personalization
        this.persistViewData();
    }

    /**
     * End tracking the current view
     */
    endView() {
        if (!this.currentImageId || !this.viewStartTime) return;
        
        const viewDuration = Date.now() - this.viewStartTime;
        const imageId = this.currentImageId;
        
        // Update dwell time
        if (this.viewedImages.has(imageId)) {
            const viewData = this.viewedImages.get(imageId);
            viewData.dwellTime += viewDuration;
        }
        
        // Record connection if there was a previous image
        if (this.pathConnections.length > 0) {
            const lastConnection = this.pathConnections[this.pathConnections.length - 1];
            if (lastConnection.to !== imageId) {
                this.addConnection(lastConnection.to, imageId);
            }
        } else {
            // First view - just record it
            this.addConnection(null, imageId);
        }
        
        // Callback
        if (this.onImageViewed) {
            this.onImageViewed(imageId, this.viewedImages.get(imageId));
        }
        
        // Clear current view
        this.currentImageId = null;
        this.viewStartTime = null;
        
        // Persist
        this.persistViewData();
    }

    /**
     * Add a path connection between images
     */
    addConnection(fromId, toId) {
        if (!toId) return;
        
        this.pathConnections.push({
            from: fromId,
            to: toId,
            timestamp: Date.now()
        });
        
        // Trim old connections
        if (this.pathConnections.length > this.maxConnections) {
            this.pathConnections.shift();
        }
        
        // Callback
        if (this.onPathConnection && fromId) {
            this.onPathConnection(fromId, toId);
        }
    }

    /**
     * Record a rupture transition (force connection)
     */
    recordRupture(fromId, toId) {
        this.addConnection(fromId, toId);
    }

    /**
     * Get all viewed image IDs
     */
    getViewedImageIds() {
        return Array.from(this.viewedImages.keys());
    }

    /**
     * Get view data for a specific image
     */
    getViewData(imageId) {
        return this.viewedImages.get(imageId);
    }

    /**
     * Get path connections
     */
    getPathConnections() {
        return [...this.pathConnections];
    }

    /**
     * Get recent path (last N connections)
     */
    getRecentPath(count = 5) {
        return this.pathConnections.slice(-count);
    }

    /**
     * Check if an image has been viewed
     */
    wasViewed(imageId) {
        return this.viewedImages.has(imageId);
    }

    /**
     * Get total views and time spent
     */
    getStats() {
        let totalViews = 0;
        let totalDwellTime = 0;
        
        this.viewedImages.forEach(data => {
            totalViews += data.views || 1;
            totalDwellTime += data.dwellTime || 0;
        });
        
        return {
            uniqueImages: this.viewedImages.size,
            totalViews: totalViews,
            totalDwellTime: totalDwellTime,
            pathLength: this.pathConnections.length
        };
    }

    /**
     * Persist data to personalization manager
     */
    persistViewData() {
        if (!this.personalizationManager) return;
        
        const data = {
            viewedImages: Array.from(this.viewedImages.entries()),
            pathConnections: this.pathConnections
        };
        
        this.personalizationManager.saveData('userPath', data);
    }

    /**
     * Load data from personalization manager
     */
    loadFromPersistence() {
        if (!this.personalizationManager) return;
        
        const data = this.personalizationManager.loadData('userPath');
        if (data) {
            if (data.viewedImages) {
                this.viewedImages = new Map(data.viewedImages);
            }
            if (data.pathConnections) {
                this.pathConnections = data.pathConnections;
            }
        }
    }

    /**
     * Clear all path data
     */
    clear() {
        this.viewedImages.clear();
        this.pathConnections = [];
        this.currentImageId = null;
        this.viewStartTime = null;
        this.persistViewData();
    }

    /**
     * Destroy tracker
     */
    destroy() {
        this.endView();
        this.personalizationManager = null;
        this.onImageViewed = null;
        this.onPathConnection = null;
    }
}