/**
 * HapticFeedback - Provide haptic feedback on supported devices
 * Falls back gracefully on unsupported devices
 */
export class HapticFeedback {
    constructor() {
        this.isSupported = this.checkSupport();
        this.vibrationNavigator = navigator.vibrate?.bind(navigator);
    }

    /**
     * Check if haptic feedback is supported
     */
    checkSupport() {
        // Check for vibration API
        if ('vibrate' in navigator) return true;
        
        // Check for haptic feedback in WebXR
        if ('xr' in navigator) return true;
        
        return false;
    }

    /**
     * Trigger light haptic feedback (for gaze start)
     */
    light() {
        if (this.vibrationNavigator) {
            navigator.vibrate(10); // 10ms vibration
        }
    }

    /**
     * Trigger medium haptic feedback (for rupture trigger)
     */
    medium() {
        if (this.vibrationNavigator) {
            navigator.vibrate(30); // 30ms vibration
        }
    }

    /**
     * Trigger success haptic (for settings change)
     */
    success() {
        if (this.vibrationNavigator) {
            navigator.vibrate([10, 50, 10]); // Pattern: vibrate-pause-vibrate
        }
    }

    /**
     * Trigger warning haptic
     */
    warning() {
        if (this.vibrationNavigator) {
            navigator.vibrate([50, 30, 50]); // Double pulse
        }
    }

    /**
     * Trigger error haptic
     */
    error() {
        if (this.vibrationNavigator) {
            navigator.vibrate([100, 50, 100, 50, 100]); // Triple pulse
        }
    }

    /**
     * Play a custom vibration pattern
     * @param {number[]} pattern - Vibration pattern [vibrate, pause, vibrate, ...]
     */
    pattern(pattern) {
        if (this.vibrationNavigator) {
            navigator.vibrate(pattern);
        }
    }

    /**
     * Stop any ongoing vibration
     */
    stop() {
        if (this.vibrationNavigator) {
            navigator.vibrate(0);
        }
    }
}

// Export singleton instance
export const hapticFeedback = new HapticFeedback();