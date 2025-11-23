/**
 * PositionStrategy - Modular positioning system
 * Allows swapping positioning logic without changing ImageLoader
 */

/**
 * Base position strategy interface
 */
export class BasePositionStrategy {
    /**
     * Get position for an image
     * @param {Object} imageData - Image data from JSON
     * @param {number} index - Index in array
     * @param {Array} allImages - All image data
     * @returns {Object} {x, y, z} position
     */
    getPosition(imageData, index, allImages) {
        throw new Error('getPosition must be implemented by subclass');
    }
}

/**
 * JSONPositionStrategy - Use positions directly from JSON
 */
export class JSONPositionStrategy extends BasePositionStrategy {
    getPosition(imageData, index, allImages) {
        if (imageData.position && Array.isArray(imageData.position) && imageData.position.length >= 3) {
            return {
                x: imageData.position[0],
                y: imageData.position[1],
                z: imageData.position[2]
            };
        }
        
        // Fallback to default position if not provided
        return { x: 0, y: 0, z: 0 };
    }
}

/**
 * SpiralPositionStrategy - Arrange in 3D spiral
 */
export class SpiralPositionStrategy extends BasePositionStrategy {
    constructor(options = {}) {
        super();
        this.radius = options.radius || 15;
        this.heightStep = options.heightStep || 0.3;
        this.angleStep = options.angleStep || (Math.PI * 2) / 10;
    }
    
    getPosition(imageData, index, allImages) {
        const angle = index * this.angleStep;
        const height = index * this.heightStep - (allImages.length * this.heightStep) / 2;
        const currentRadius = this.radius + Math.sin(index * 0.1) * 3;
        
        return {
            x: Math.cos(angle) * currentRadius,
            y: height,
            z: Math.sin(angle) * currentRadius
        };
    }
}

/**
 * GridPositionStrategy - Arrange in 3D grid
 */
export class GridPositionStrategy extends BasePositionStrategy {
    constructor(options = {}) {
        super();
        this.spacing = options.spacing || 3;
        this.columns = options.columns || 5;
    }
    
    getPosition(imageData, index, allImages) {
        const row = Math.floor(index / this.columns);
        const col = index % this.columns;
        const depth = Math.floor(index / (this.columns * this.columns));
        
        return {
            x: (col - this.columns / 2) * this.spacing,
            y: (row - Math.floor(allImages.length / this.columns) / 2) * this.spacing,
            z: depth * this.spacing
        };
    }
}

