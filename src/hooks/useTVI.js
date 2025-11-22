/**
 * USE TVI HOOK - React Integration for Temporal Voice Intelligence
 *
 * Provides React components with TVI capabilities.
 * Manages lifecycle and state synchronization.
 *
 * @module useTVI
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { tviEngine } from '../audio/tviEngine';
import { tviScheduler } from '../audio/tviScheduler';
import { humEngine } from '../audio/humEngine';

// ============================================================================
// DEFAULT SETTINGS
// ============================================================================

const DEFAULT_SETTINGS = {
  enabled: true,
  voiceEnabled: true,
  humEnabled: false,
  intervalMs: 60000, // 1 minute default
  volume: 0.8,
  announceMilestones: true,
  announceIntervals: true,
};

// ============================================================================
// STORAGE KEY
// ============================================================================

const TVI_STORAGE_KEY = 'quantum-timer-tvi-settings';

// ============================================================================
// HOOK
// ============================================================================

export function useTVI(theme = 'minimal') {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(TVI_STORAGE_KEY);
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [isInitialized, setIsInitialized] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const timerStateRef = useRef({ isRunning: false, remainingMs: 0 });

  // Initialize TVI on first user interaction
  const initialize = useCallback(() => {
    if (isInitialized) return true;

    const success = tviEngine.init();
    humEngine.init();

    if (success) {
      setIsInitialized(true);
      tviEngine.setPersonality(theme);
      tviEngine.setEnabled(settings.voiceEnabled);
      tviEngine.setVolume(settings.volume);
      humEngine.setEnabled(settings.humEnabled);
      humEngine.setTheme(theme);
    }

    return success;
  }, [isInitialized, theme, settings]);

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem(TVI_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage errors
    }
  }, [settings]);

  // Update theme
  useEffect(() => {
    if (isInitialized) {
      tviEngine.setPersonality(theme);
      humEngine.setTheme(theme);
    }
  }, [theme, isInitialized]);

  // Update enabled state
  useEffect(() => {
    if (isInitialized) {
      tviEngine.setEnabled(settings.voiceEnabled && settings.enabled);
      humEngine.setEnabled(settings.humEnabled && settings.enabled);
    }
  }, [settings.enabled, settings.voiceEnabled, settings.humEnabled, isInitialized]);

  // Update volume
  useEffect(() => {
    if (isInitialized) {
      tviEngine.setVolume(settings.volume);
    }
  }, [settings.volume, isInitialized]);

  /**
   * Start TVI for a timer session
   */
  const startSession = useCallback((totalDurationMs) => {
    if (!settings.enabled) return;

    initialize();

    timerStateRef.current = {
      isRunning: true,
      totalDuration: totalDurationMs,
      remainingMs: totalDurationMs,
    };

    tviScheduler.start({
      totalDuration: totalDurationMs,
      intervalMs: settings.announceIntervals ? settings.intervalMs : null,
      theme,
    });

    if (settings.humEnabled) {
      humEngine.start();
    }
  }, [settings, theme, initialize]);

  /**
   * Update progress during timer
   */
  const updateProgress = useCallback((remainingMs, totalMs) => {
    if (!settings.enabled) return;

    timerStateRef.current.remainingMs = remainingMs;

    const progress = 1 - (remainingMs / totalMs);
    humEngine.setProgress(progress);
  }, [settings.enabled]);

  /**
   * Pause TVI
   */
  const pauseSession = useCallback(() => {
    tviScheduler.pause();
    humEngine.stop();
  }, []);

  /**
   * Resume TVI
   */
  const resumeSession = useCallback(() => {
    const { remainingMs } = timerStateRef.current;
    tviScheduler.resume(remainingMs);

    if (settings.humEnabled) {
      humEngine.start();
    }
  }, [settings.humEnabled]);

  /**
   * Stop TVI
   */
  const stopSession = useCallback(() => {
    tviScheduler.stop();
    humEngine.stop();
    timerStateRef.current = { isRunning: false, remainingMs: 0 };
  }, []);

  /**
   * Speak custom text
   */
  const speak = useCallback((text, options = {}) => {
    if (!settings.enabled || !settings.voiceEnabled) return;
    initialize();
    return tviEngine.speak(text, options);
  }, [settings.enabled, settings.voiceEnabled, initialize]);

  /**
   * Update settings
   */
  const updateSettings = useCallback((updates) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  /**
   * Update interval mid-session
   */
  const setIntervalMs = useCallback((ms) => {
    updateSettings({ intervalMs: ms });
    tviScheduler.setInterval(ms);
  }, [updateSettings]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSession();
    };
  }, [stopSession]);

  return {
    // State
    settings,
    isInitialized,
    isSpeaking,
    isAvailable: tviEngine.isAvailable(),

    // Actions
    initialize,
    startSession,
    updateProgress,
    pauseSession,
    resumeSession,
    stopSession,
    speak,

    // Settings
    updateSettings,
    setIntervalMs,
    setEnabled: (enabled) => updateSettings({ enabled }),
    setVoiceEnabled: (enabled) => updateSettings({ voiceEnabled: enabled }),
    setHumEnabled: (enabled) => updateSettings({ humEnabled: enabled }),
    setVolume: (volume) => updateSettings({ volume }),
  };
}

export { DEFAULT_SETTINGS as TVI_DEFAULT_SETTINGS };
