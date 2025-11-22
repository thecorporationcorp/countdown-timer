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
    this.voices = [];
    this.voicesLoaded = false;
    this.lastSpeakTime = 0;
    this.minSpeakInterval = 500; // Debounce: min 500ms between speaks
    this.retryCount = 0;
    this.maxRetries = 2;

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
   * @returns {Promise<boolean>}
   */
  init() {
    return new Promise((resolve) => {
      if (!this.synth) {
        console.warn('[TVI] Speech synthesis not available');
        resolve(false);
        return;
      }

      // Load voices (async on most browsers)
      const loadVoices = () => {
        this.voices = this.synth.getVoices();
        if (this.voices.length > 0) {
          this.voicesLoaded = true;
          resolve(true);
          return true;
        }
        return false;
      };

      // Try immediate load
      if (loadVoices()) return;

      // Handle async voice loading
      if (typeof window !== 'undefined') {
        window.speechSynthesis.onvoiceschanged = () => {
          loadVoices();
        };
      }

      // Timeout fallback - resolve anyway after 1s
      setTimeout(() => {
        if (!this.voicesLoaded) {
          this.voices = this.synth.getVoices();
          this.voicesLoaded = this.voices.length > 0;
          resolve(this.voicesLoaded);
        }
      }, 1000);
    });
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

      // Debounce: skip if too soon after last speak (unless critical)
      const now = Date.now();
      if (!options.critical && now - this.lastSpeakTime < this.minSpeakInterval) {
        resolve();
        return;
      }
      this.lastSpeakTime = now;

      // Cancel any current speech
      if (options.interrupt && this.state === TVI_STATE.SPEAKING) {
        this.cancel();
      }

      // Queue if already speaking
      if (this.state === TVI_STATE.SPEAKING && !options.interrupt) {
        tviQueue.add({ text, options, resolve, reject });
        return;
      }

      // Chrome bug: synth can get stuck - cancel and resume
      if (this.synth.paused) {
        this.synth.resume();
      }
      if (this.synth.speaking && !this.synth.pending) {
        this.synth.cancel();
      }

      this.state = TVI_STATE.SPEAKING;

      const utterance = new SpeechSynthesisUtterance(text);

      // Apply voice settings
      utterance.volume = options.volume ?? this.volume;
      utterance.rate = options.rate ?? this.rate;
      utterance.pitch = options.pitch ?? this.pitch;

      // Select voice based on personality (use cached voices)
      const voices = this.voices.length > 0 ? this.voices : this.synth.getVoices();
      const preferredVoice = tviVoices.selectVoice(voices, this.voicePersonality);
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      // Timeout safety net - auto-resolve if speech hangs
      const safetyTimeout = setTimeout(() => {
        if (this.state === TVI_STATE.SPEAKING) {
          console.warn('[TVI] Speech timeout - force resolving');
          this.synth.cancel();
          this.state = TVI_STATE.IDLE;
          this.currentUtterance = null;
          resolve();
          this.processQueue();
        }
      }, Math.max(10000, text.length * 100)); // ~100ms per character, min 10s

      // Event handlers
      utterance.onend = () => {
        clearTimeout(safetyTimeout);
        this.state = TVI_STATE.IDLE;
        this.currentUtterance = null;
        this.retryCount = 0;
        resolve();
        this.processQueue();
      };

      utterance.onerror = (event) => {
        clearTimeout(safetyTimeout);
        this.state = TVI_STATE.IDLE;
        this.currentUtterance = null;

        if (event.error !== 'canceled') {
          console.error('[TVI] Speech error:', event.error);

          // Retry logic for recoverable errors
          if (this.retryCount < this.maxRetries && event.error !== 'not-allowed') {
            this.retryCount++;
            console.log(`[TVI] Retrying (${this.retryCount}/${this.maxRetries})...`);
            setTimeout(() => {
              this.speak(text, options).then(resolve).catch(reject);
            }, 200 * this.retryCount);
            return;
          }

          this.retryCount = 0;
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
