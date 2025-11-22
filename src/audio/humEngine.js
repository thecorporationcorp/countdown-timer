/**
 * HUM ENGINE - Ambient Background Audio
 *
 * Generates subtle ambient hum that intensifies as timer progresses.
 * Creates atmosphere without overwhelming the user.
 *
 * @module humEngine
 */

// ============================================================================
// CONSTANTS
// ============================================================================

const HUM_CONFIG = {
  'sci-fi': {
    baseFrequency: 60,
    modulationFrequency: 0.5,
    maxVolume: 0.08,
    intensityCurve: 'exponential',
    waveType: 'sine',
  },
  'calm': {
    baseFrequency: 120,
    modulationFrequency: 0.2,
    maxVolume: 0.04,
    intensityCurve: 'linear',
    waveType: 'sine',
  },
  'minimal': {
    baseFrequency: 0,
    modulationFrequency: 0,
    maxVolume: 0,
    intensityCurve: 'none',
    waveType: 'sine',
  },
};

// ============================================================================
// HUM ENGINE CLASS
// ============================================================================

class HumEngine {
  constructor() {
    this.audioContext = null;
    this.oscillator = null;
    this.gainNode = null;
    this.modulatorNode = null;
    this.isPlaying = false;
    this.theme = 'minimal';
    this.progress = 0;
    this.enabled = false;
    this.rafId = null;
  }

  /**
   * Initialize audio context (must be called from user interaction)
   * @returns {boolean}
   */
  init() {
    if (this.audioContext) return true;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        console.warn('[HUM] AudioContext not available');
        return false;
      }

      this.audioContext = new AudioContext();
      return true;
    } catch (error) {
      console.error('[HUM] Failed to initialize:', error);
      return false;
    }
  }

  /**
   * Set theme for hum characteristics
   * @param {string} theme
   */
  setTheme(theme) {
    this.theme = theme;
    if (this.isPlaying) {
      this.updateHumCharacteristics();
    }
  }

  /**
   * Start the ambient hum
   */
  start() {
    if (this.isPlaying || !this.enabled) return;
    if (!this.audioContext) {
      if (!this.init()) return;
    }

    const config = HUM_CONFIG[this.theme] || HUM_CONFIG.minimal;

    // Skip if minimal theme (no hum)
    if (config.maxVolume === 0) return;

    // Resume context if suspended
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    // Create oscillator
    this.oscillator = this.audioContext.createOscillator();
    this.oscillator.type = config.waveType;
    this.oscillator.frequency.setValueAtTime(config.baseFrequency, this.audioContext.currentTime);

    // Create gain node for volume control
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);

    // Create modulator for subtle variation
    if (config.modulationFrequency > 0) {
      this.modulatorNode = this.audioContext.createOscillator();
      this.modulatorNode.frequency.setValueAtTime(config.modulationFrequency, this.audioContext.currentTime);

      const modulatorGain = this.audioContext.createGain();
      modulatorGain.gain.setValueAtTime(2, this.audioContext.currentTime);

      this.modulatorNode.connect(modulatorGain);
      modulatorGain.connect(this.oscillator.frequency);
      this.modulatorNode.start();
    }

    // Connect nodes
    this.oscillator.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);

    // Start oscillator
    this.oscillator.start();
    this.isPlaying = true;

    // Fade in
    this.gainNode.gain.linearRampToValueAtTime(
      this.calculateVolume(this.progress),
      this.audioContext.currentTime + 0.5
    );
  }

  /**
   * Stop the ambient hum
   */
  stop() {
    if (!this.isPlaying) return;

    // Fade out
    if (this.gainNode && this.audioContext) {
      this.gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.3);

      // Stop after fade
      setTimeout(() => {
        if (this.oscillator) {
          this.oscillator.stop();
          this.oscillator.disconnect();
          this.oscillator = null;
        }
        if (this.modulatorNode) {
          this.modulatorNode.stop();
          this.modulatorNode.disconnect();
          this.modulatorNode = null;
        }
        if (this.gainNode) {
          this.gainNode.disconnect();
          this.gainNode = null;
        }
      }, 300);
    }

    this.isPlaying = false;
  }

  /**
   * Update progress (0-1) to adjust intensity
   * @param {number} progress - Progress value 0-1
   */
  setProgress(progress) {
    this.progress = Math.max(0, Math.min(1, progress));

    if (this.isPlaying && this.gainNode && this.audioContext) {
      const volume = this.calculateVolume(this.progress);
      this.gainNode.gain.linearRampToValueAtTime(
        volume,
        this.audioContext.currentTime + 0.1
      );
    }
  }

  /**
   * Calculate volume based on progress and intensity curve
   * @param {number} progress
   * @returns {number}
   */
  calculateVolume(progress) {
    const config = HUM_CONFIG[this.theme] || HUM_CONFIG.minimal;

    if (config.maxVolume === 0) return 0;

    let intensity;
    switch (config.intensityCurve) {
      case 'exponential':
        // Volume increases exponentially in last 20%
        intensity = progress < 0.8 ? progress * 0.5 : 0.4 + Math.pow((progress - 0.8) / 0.2, 2) * 0.6;
        break;
      case 'linear':
        intensity = progress;
        break;
      default:
        intensity = 0;
    }

    return intensity * config.maxVolume;
  }

  /**
   * Update hum characteristics for current theme
   */
  updateHumCharacteristics() {
    const config = HUM_CONFIG[this.theme] || HUM_CONFIG.minimal;

    if (this.oscillator && this.audioContext) {
      this.oscillator.frequency.linearRampToValueAtTime(
        config.baseFrequency,
        this.audioContext.currentTime + 0.5
      );
    }
  }

  /**
   * Enable or disable hum
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.stop();
    }
  }

  /**
   * Check if hum is available
   * @returns {boolean}
   */
  isAvailable() {
    return !!(window.AudioContext || window.webkitAudioContext);
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.stop();
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const humEngine = new HumEngine();
export { HUM_CONFIG };
