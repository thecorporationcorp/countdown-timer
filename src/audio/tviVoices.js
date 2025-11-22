/**
 * TVI VOICES - Voice Personality Configuration
 *
 * Maps themes to voice characteristics and selects
 * appropriate system voices.
 *
 * @module tviVoices
 */

// ============================================================================
// VOICE CONFIGURATIONS BY THEME
// ============================================================================

const VOICE_CONFIGS = {
  'sci-fi': {
    rate: 1.1,
    pitch: 0.9,
    preferredNames: ['Google UK English Female', 'Samantha', 'Karen', 'Victoria'],
    preferredLang: 'en-GB',
    fallbackLang: 'en-US',
    style: 'robotic',
  },

  'calm': {
    rate: 0.9,
    pitch: 1.0,
    preferredNames: ['Google US English', 'Samantha', 'Alex', 'Daniel'],
    preferredLang: 'en-US',
    fallbackLang: 'en-GB',
    style: 'soothing',
  },

  'minimal': {
    rate: 1.0,
    pitch: 1.0,
    preferredNames: ['Google US English', 'Alex', 'Daniel', 'Samantha'],
    preferredLang: 'en-US',
    fallbackLang: 'en-GB',
    style: 'neutral',
  },

  'neutral': {
    rate: 1.0,
    pitch: 1.0,
    preferredNames: [],
    preferredLang: 'en-US',
    fallbackLang: 'en',
    style: 'neutral',
  },
};

// ============================================================================
// ANNOUNCEMENT TEMPLATES BY THEME
// ============================================================================

const ANNOUNCEMENT_TEMPLATES = {
  'sci-fi': {
    timeRemaining: (time) => `Temporal coordinates: ${time} remaining until destination.`,
    halfwayPoint: 'Attention. Midpoint achieved. Temporal flux stable.',
    oneMinute: 'Alert. One minute until temporal convergence.',
    thirtySeconds: 'Warning. Thirty seconds remaining. Prepare for arrival.',
    tenSeconds: 'Critical. Ten seconds to destination.',
    fiveSeconds: 'Five... Four... Three... Two... One...',
    complete: 'Temporal destination reached. Mission accomplished.',
    paused: 'Temporal stasis engaged.',
    resumed: 'Temporal flow restored.',
  },

  'calm': {
    timeRemaining: (time) => `${time} remaining. Take a deep breath.`,
    halfwayPoint: 'You\'re halfway there. Wonderful progress.',
    oneMinute: 'One minute left. Almost there.',
    thirtySeconds: 'Thirty seconds. Stay present.',
    tenSeconds: 'Ten seconds remaining.',
    fiveSeconds: 'Five... four... three... two... one...',
    complete: 'Time\'s up. Well done.',
    paused: 'Timer paused. Take your time.',
    resumed: 'Continuing where you left off.',
  },

  'minimal': {
    timeRemaining: (time) => `${time} remaining.`,
    halfwayPoint: 'Halfway.',
    oneMinute: 'One minute.',
    thirtySeconds: 'Thirty seconds.',
    tenSeconds: 'Ten seconds.',
    fiveSeconds: 'Five, four, three, two, one.',
    complete: 'Complete.',
    paused: 'Paused.',
    resumed: 'Resumed.',
  },
};

// ============================================================================
// VOICE SELECTION LOGIC
// ============================================================================

const tviVoices = {
  /**
   * Get voice configuration for a theme
   * @param {string} theme
   * @returns {object}
   */
  getVoiceConfig(theme) {
    return VOICE_CONFIGS[theme] || VOICE_CONFIGS.neutral;
  },

  /**
   * Select the best available voice for a theme
   * @param {SpeechSynthesisVoice[]} voices - Available voices
   * @param {string} theme - Current theme
   * @returns {SpeechSynthesisVoice|null}
   */
  selectVoice(voices, theme) {
    if (!voices || voices.length === 0) {
      return null;
    }

    const config = this.getVoiceConfig(theme);

    // Try preferred names first
    for (const name of config.preferredNames) {
      const voice = voices.find((v) => v.name.includes(name));
      if (voice) return voice;
    }

    // Try preferred language
    const langVoice = voices.find((v) => v.lang.startsWith(config.preferredLang));
    if (langVoice) return langVoice;

    // Try fallback language
    const fallbackVoice = voices.find((v) => v.lang.startsWith(config.fallbackLang));
    if (fallbackVoice) return fallbackVoice;

    // Return first available
    return voices[0];
  },

  /**
   * Get announcement text for an event
   * @param {string} theme - Current theme
   * @param {string} event - Event type
   * @param {string} time - Time string (for timeRemaining)
   * @returns {string}
   */
  getAnnouncement(theme, event, time = '') {
    const templates = ANNOUNCEMENT_TEMPLATES[theme] || ANNOUNCEMENT_TEMPLATES.minimal;
    const template = templates[event];

    if (typeof template === 'function') {
      return template(time);
    }

    return template || '';
  },

  /**
   * Get all available announcement events
   * @returns {string[]}
   */
  getEvents() {
    return Object.keys(ANNOUNCEMENT_TEMPLATES.minimal);
  },
};

export { tviVoices, VOICE_CONFIGS, ANNOUNCEMENT_TEMPLATES };
