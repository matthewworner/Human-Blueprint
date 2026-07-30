/**
 * UserPathVisualizer - Render user's journey as visual trail
 * Shows subtle connections between viewed images and markers
 */

import * as THREE from 'three';

export class UserPathVisualizer {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        
        // Path line materials
        this.lineMaterial = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.15,
            linewidth: 1
        });
        
        this.recentLineMaterial = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.4,
            linewidth: 1
        });
        
        // Visual elements
        this.pathLines = []; // All path line objects
        this.viewedMarkers = []; // Glow markers on viewed images
        
        // Configuration
        this.maxLines = 50;
        this.lineHeight = 0.5; // Slight height above images (avoid z-fighting)
        this.fadeOldLines = true;
        this.fadeThreshold = 3; // Fade lines older than 3 connections
        
        // State
        this.isEnabled = true;
        this.imageObjectMap = new Map(); // imageId -> Three.js object
    }

    /**
     * Register image objects for path visualization
     * @param {Array} imageObjects - Array of THREE.Mesh objects with userData.imageData.id
     */
    registerImages(imageObjects) {
        this.imageObjectMap.clear();
        
        imageObjects.forEach(obj => {
            if (obj.userData?.imageData?.id) {
                this.imageObjectMap.set(obj.userData.imageData.id, obj);
            }
        });
    }

    /**
     * Add a path connection between two images
     * @param {string} fromId - Source image ID
     * @param {string} toId - Destination image ID
     */
    addPathLine(fromId, toId) {
        const fromObj = this.imageObjectMap.get(fromId);
        const toObj = this.imageObjectMap.get(toId);
        
        if (!toObj) return; // Need destination at minimum
        
        // Calculate positions
        const fromPos = fromObj ? fromObj.position.clone() : toObj.position.clone();
        const toPos = toObj.position.clone();
        
        // Add slight height offset
        fromPos.y += this.lineHeight;
        toPos.y += this.lineHeight;
        
        // Create line geometry
        const points = [fromPos, toPos];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        // Determine if recent (for opacity)
        const isRecent = this.pathLines.length < 3;
        const material = isRecent ? this.recentLineMaterial.clone() : this.lineMaterial.clone();
        
        const line = new THREE.Line(geometry, material);
        line.userData = { fromId, toId, age: 0 };
        
        this.scene.add(line);
        this.pathLines.push(line);
        
        // Trim old lines
        this.trimOldLines();
    }

    /**
     * Add marker to a viewed image
     * @param {string} imageId - Image ID
     */
    addViewedMarker(imageId) {
        const obj = this.imageObjectMap.get(imageId);
        if (!obj) return;
        
        // Check if marker already exists
        if (this.viewedMarkers.some(m => m.userData.imageId === imageId)) return;
        
        // Create subtle ring marker
        const ringGeometry = new THREE.RingGeometry(1.2, 1.4, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.15,
            side: THREE.DoubleSide
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        
        // Position the ring facing the camera
        ring.position.copy(obj.position);
        ring.position.z += 0.5;
        
        // Orient to face camera
        ring.lookAt(this.camera.position);
        
        ring.userData = { imageId, type: 'marker' };
        
        this.scene.add(ring);
        this.viewedMarkers.push(ring);
    }

    /**
     * Update marker positions (call in render loop)
     */
    update() {
        if (!this.isEnabled) return;
        
        // Update ring markers to face camera
        this.viewedMarkers.forEach(marker => {
            marker.lookAt(this.camera.position);
        });
        
        // Age lines (for fade effect)
        this.pathLines.forEach(line => {
            line.userData.age++;
            
            // Fade based on age
            if (this.fadeOldLines && line.userData.age > this.fadeThreshold) {
                const fadeProgress = (line.userData.age - this.fadeThreshold) / 10;
                line.material.opacity = Math.max(0.05, 0.15 - fadeProgress * 0.01);
            }
        });
    }

    /**
     * Trim old path lines
     */
    trimOldLines() {
        while (this.pathLines.length > this.maxLines) {
            const oldLine = this.pathLines.shift();
            this.scene.remove(oldLine);
            oldLine.geometry.dispose();
            oldLine.material.dispose();
        }
    }

    /**
     * Clear all path visualization
     */
    clear() {
        // Remove path lines
        this.pathLines.forEach(line => {
            this.scene.remove(line);
            line.geometry.dispose();
            line.material.dispose();
        });
        this.pathLines = [];
        
        // Remove markers
        this.viewedMarkers.forEach(marker => {
            this.scene.remove(marker);
            marker.geometry.dispose();
            marker.material.dispose();
        });
        this.viewedMarkers = [];
    }

    /**
     * Enable/disable path visualization
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        
        // Hide/show all elements
        this.pathLines.forEach(line => {
            line.visible = enabled;
        });
        this.viewedMarkers.forEach(marker => {
            marker.visible = enabled;
        });
    }

    /**
     * Toggle path visibility
     */
    toggle() {
        this.setEnabled(!this.isEnabled);
    }

    /**
     * Set path line opacity
     */
    setOpacity(opacity) {
        this.lineMaterial.opacity = opacity;
        this.pathLines.forEach(line => {
            line.material.opacity = opacity;
        });
    }

    /**
     * Destroy visualizer
     */
    destroy() {
        this.clear();
        this.imageObjectMap.clear();
        this.lineMaterial.dispose();
        this.recentLineMaterial.dispose();
    }
}