/**
 * USE GUARANTEED WAKE HOOK - Triple Redundancy Alarm System
 *
 * Implements guaranteed wake-up with:
 * 1. Browser Notifications API
 * 2. Web Audio API alarm
 * 3. Vibration API (mobile)
 *
 * @module useGuaranteedWake
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================================
// CONSTANTS
// ============================================================================

const ALARM_STORAGE_KEY = 'quantum-timer-alarm-settings';

const DEFAULT_ALARM_SETTINGS = {
  enabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
  notificationEnabled: true,
  soundVolume: 1.0,
  snoozeEnabled: false,
  snoozeDurationMs: 300000, // 5 minutes
  requireConfirmation: true,
  escalationEnabled: true,
};

// ============================================================================
// ALARM SOUND GENERATOR
// ============================================================================

class AlarmSoundGenerator {
  constructor() {
    this.audioContext = null;
    this.isPlaying = false;
    this.oscillators = [];
    this.gainNode = null;
  }

  init() {
    if (this.audioContext) return true;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Play escalating alarm sound
   * @param {number} volume - Volume 0-1
   * @param {string} pattern - 'gentle', 'standard', 'urgent'
   */
  play(volume = 1.0, pattern = 'standard') {
    if (this.isPlaying) return;
    if (!this.audioContext) {
      if (!this.init()) return;
    }

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.isPlaying = true;
    this.playPattern(pattern, volume);
  }

  playPattern(pattern, volume) {
    const patterns = {
      gentle: [
        { freq: 523.25, duration: 0.3 }, // C5
        { freq: 659.25, duration: 0.3 }, // E5
        { freq: 783.99, duration: 0.5 }, // G5
      ],
      standard: [
        { freq: 880, duration: 0.2 },
        { freq: 0, duration: 0.1 },
        { freq: 880, duration: 0.2 },
        { freq: 0, duration: 0.1 },
        { freq: 1108.73, duration: 0.3 },
      ],
      urgent: [
        { freq: 1000, duration: 0.1 },
        { freq: 0, duration: 0.05 },
        { freq: 1000, duration: 0.1 },
        { freq: 0, duration: 0.05 },
        { freq: 1200, duration: 0.1 },
        { freq: 0, duration: 0.05 },
        { freq: 1200, duration: 0.1 },
      ],
    };

    const sequence = patterns[pattern] || patterns.standard;
    let time = this.audioContext.currentTime;

    // Create master gain
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.setValueAtTime(volume * 0.5, time);
    this.gainNode.connect(this.audioContext.destination);

    // Play sequence
    sequence.forEach(({ freq, duration }) => {
      if (freq > 0) {
        const osc = this.audioContext.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);

        const noteGain = this.audioContext.createGain();
        noteGain.gain.setValueAtTime(1, time);
        noteGain.gain.exponentialRampToValueAtTime(0.01, time + duration);

        osc.connect(noteGain);
        noteGain.connect(this.gainNode);

        osc.start(time);
        osc.stop(time + duration);
        this.oscillators.push(osc);
      }
      time += duration;
    });

    // Loop after sequence
    this.loopTimeout = setTimeout(() => {
      if (this.isPlaying) {
        this.playPattern(pattern, volume);
      }
    }, time * 1000 + 500);
  }

  stop() {
    this.isPlaying = false;
    clearTimeout(this.loopTimeout);

    this.oscillators.forEach((osc) => {
      try {
        osc.stop();
      } catch {
        // Already stopped
      }
    });
    this.oscillators = [];

    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
  }

  destroy() {
    this.stop();
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// ============================================================================
// HOOK
// ============================================================================

export function useGuaranteedWake() {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(ALARM_STORAGE_KEY);
      return stored ? { ...DEFAULT_ALARM_SETTINGS, ...JSON.parse(stored) } : DEFAULT_ALARM_SETTINGS;
    } catch {
      return DEFAULT_ALARM_SETTINGS;
    }
  });

  const [isAlarming, setIsAlarming] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [isConfirmed, setIsConfirmed] = useState(false);

  const soundRef = useRef(new AlarmSoundGenerator());
  const escalationTimeoutRef = useRef(null);
  const vibrationIntervalRef = useRef(null);

  // Check notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem(ALARM_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore
    }
  }, [settings]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      soundRef.current.destroy();
      clearTimeout(escalationTimeoutRef.current);
      clearInterval(vibrationIntervalRef.current);
    };
  }, []);

  /**
   * Request notification permission
   */
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) return 'denied';

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    return permission;
  }, []);

  /**
   * Trigger the alarm
   */
  const triggerAlarm = useCallback((options = {}) => {
    if (!settings.enabled) return;

    setIsAlarming(true);
    setIsConfirmed(false);

    const { title = "Time's Up!", body = 'Your countdown has completed.' } = options;

    // 1. Sound alarm
    if (settings.soundEnabled) {
      soundRef.current.init();
      soundRef.current.play(settings.soundVolume, 'gentle');

      // Escalate if not confirmed
      if (settings.escalationEnabled) {
        escalationTimeoutRef.current = setTimeout(() => {
          if (!isConfirmed) {
            soundRef.current.stop();
            soundRef.current.play(settings.soundVolume, 'urgent');
          }
        }, 10000);
      }
    }

    // 2. Vibration
    if (settings.vibrationEnabled && 'vibrate' in navigator) {
      const vibratePattern = [200, 100, 200, 100, 400];
      navigator.vibrate(vibratePattern);

      vibrationIntervalRef.current = setInterval(() => {
        if (settings.vibrationEnabled && !isConfirmed) {
          navigator.vibrate(vibratePattern);
        }
      }, 2000);
    }

    // 3. Notification
    if (settings.notificationEnabled && notificationPermission === 'granted') {
      try {
        const notification = new Notification(title, {
          body,
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-72.png',
          tag: 'quantum-timer-alarm',
          requireInteraction: true,
          vibrate: [200, 100, 200],
        });

        notification.onclick = () => {
          window.focus();
          confirmAlarm();
          notification.close();
        };
      } catch (error) {
        console.error('[Alarm] Notification error:', error);
      }
    }
  }, [settings, notificationPermission, isConfirmed]);

  /**
   * Confirm/dismiss the alarm
   */
  const confirmAlarm = useCallback(() => {
    setIsConfirmed(true);
    setIsAlarming(false);

    // Stop sound
    soundRef.current.stop();

    // Stop vibration
    if ('vibrate' in navigator) {
      navigator.vibrate(0);
    }
    clearInterval(vibrationIntervalRef.current);

    // Clear escalation
    clearTimeout(escalationTimeoutRef.current);
  }, []);

  /**
   * Snooze the alarm
   */
  const snoozeAlarm = useCallback(() => {
    if (!settings.snoozeEnabled) return null;

    confirmAlarm();

    // Return snooze end time
    return Date.now() + settings.snoozeDurationMs;
  }, [settings.snoozeEnabled, settings.snoozeDurationMs, confirmAlarm]);

  /**
   * Update settings
   */
  const updateSettings = useCallback((updates) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  /**
   * Test the alarm
   */
  const testAlarm = useCallback(() => {
    soundRef.current.init();
    soundRef.current.play(settings.soundVolume, 'standard');

    setTimeout(() => {
      soundRef.current.stop();
    }, 2000);

    if (settings.vibrationEnabled && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  }, [settings.soundVolume, settings.vibrationEnabled]);

  return {
    // State
    settings,
    isAlarming,
    isConfirmed,
    notificationPermission,

    // Capabilities
    hasNotificationSupport: 'Notification' in window,
    hasVibrationSupport: 'vibrate' in navigator,
    hasAudioSupport: !!(window.AudioContext || window.webkitAudioContext),

    // Actions
    triggerAlarm,
    confirmAlarm,
    snoozeAlarm,
    testAlarm,
    requestNotificationPermission,

    // Settings
    updateSettings,
    setEnabled: (enabled) => updateSettings({ enabled }),
    setSoundEnabled: (enabled) => updateSettings({ soundEnabled: enabled }),
    setVibrationEnabled: (enabled) => updateSettings({ vibrationEnabled: enabled }),
    setNotificationEnabled: (enabled) => updateSettings({ notificationEnabled: enabled }),
    setSoundVolume: (volume) => updateSettings({ soundVolume: volume }),
    setSnoozeEnabled: (enabled) => updateSettings({ snoozeEnabled: enabled }),
  };
}

export { DEFAULT_ALARM_SETTINGS };
