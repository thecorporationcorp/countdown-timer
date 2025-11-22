/**
 * TVI ENGINE - Temporal Voice Intelligence
 *
 * Core engine for spoken announcements during countdown.
 * Uses Web Speech API with fallback to Audio API.
 *
 * @module tviEngine
 */

import { tviVoices } from './tviVoices';
import { tviQueue } from './tviQueue';

// ============================================================================
// CONSTANTS
// ============================================================================

const TVI_STATE = {
  IDLE: 'IDLE',
  SPEAKING: 'SPEAKING',
  QUEUED: 'QUEUED',
  DISABLED: 'DISABLED',
};

// ============================================================================
// TVI ENGINE CLASS
// ============================================================================

class TVIEngine {
  constructor() {
    this.state = TVI_STATE.IDLE;
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.currentUtterance = null;
    this.cancellationToken = null;
    this.voicePersonality = 'neutral';
    this.volume = 0.8;
    this.rate = 1.0;
    this.pitch = 1.0;
    this.enabled = true;
    this.reducedMotion = false;

    // Check for reduced motion preference
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.reducedMotion = mediaQuery.matches;
      mediaQuery.addEventListener('change', (e) => {
        this.reducedMotion = e.matches;
      });
    }
  }

  /**
   * Initialize the TVI engine
   */
  init() {
    if (!this.synth) {
      console.warn('[TVI] Speech synthesis not available');
      return false;
    }

    // Warm up voices
    this.synth.getVoices();

    // Handle voice list change
    if (typeof window !== 'undefined') {
      window.speechSynthesis.onvoiceschanged = () => {
        this.voices = this.synth.getVoices();
      };
    }

    return true;
  }

  /**
   * Set voice personality based on theme
   * @param {string} theme - Current theme (sci-fi, calm, minimal)
   */
  setPersonality(theme) {
    this.voicePersonality = theme;
    const config = tviVoices.getVoiceConfig(theme);
    this.rate = config.rate;
    this.pitch = config.pitch;
  }

  /**
   * Speak an announcement
   * @param {string} text - Text to speak
   * @param {object} options - Speaking options
   * @returns {Promise<void>}
   */
  speak(text, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.enabled || !this.synth) {
        resolve();
        return;
      }

      // Skip if reduced motion and not critical
      if (this.reducedMotion && !options.critical) {
        resolve();
        return;
      }

      // Cancel any current speech
      if (options.interrupt && this.state === TVI_STATE.SPEAKING) {
        this.cancel();
      }

      // Queue if already speaking
      if (this.state === TVI_STATE.SPEAKING && !options.interrupt) {
        tviQueue.add({ text, options, resolve, reject });
        return;
      }

      this.state = TVI_STATE.SPEAKING;

      const utterance = new SpeechSynthesisUtterance(text);

      // Apply voice settings
      utterance.volume = options.volume ?? this.volume;
      utterance.rate = options.rate ?? this.rate;
      utterance.pitch = options.pitch ?? this.pitch;

      // Select voice based on personality
      const voices = this.synth.getVoices();
      const preferredVoice = tviVoices.selectVoice(voices, this.voicePersonality);
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      // Event handlers
      utterance.onend = () => {
        this.state = TVI_STATE.IDLE;
        this.currentUtterance = null;
        resolve();

        // Process queue
        this.processQueue();
      };

      utterance.onerror = (event) => {
        this.state = TVI_STATE.IDLE;
        this.currentUtterance = null;

        if (event.error !== 'canceled') {
          console.error('[TVI] Speech error:', event.error);
          reject(event.error);
        } else {
          resolve();
        }

        this.processQueue();
      };

      this.currentUtterance = utterance;
      this.synth.speak(utterance);
    });
  }

  /**
   * Process the speech queue
   */
  processQueue() {
    const next = tviQueue.next();
    if (next) {
      this.speak(next.text, next.options)
        .then(next.resolve)
        .catch(next.reject);
    }
  }

  /**
   * Cancel current and queued speech
   */
  cancel() {
    if (this.synth) {
      this.synth.cancel();
    }
    tviQueue.clear();
    this.state = TVI_STATE.IDLE;
    this.currentUtterance = null;
  }

  /**
   * Enable or disable TVI
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.cancel();
    }
  }

  /**
   * Set volume (0-1)
   * @param {number} volume
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Check if speech synthesis is available
   * @returns {boolean}
   */
  isAvailable() {
    return !!this.synth;
  }

  /**
   * Get current state
   * @returns {string}
   */
  getState() {
    return this.state;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const tviEngine = new TVIEngine();
export { TVI_STATE };
