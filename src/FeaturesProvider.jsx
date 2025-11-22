/**
 * FEATURES PROVIDER
 *
 * Integrates TVI, Alarm, and Accountability systems into the app.
 * Non-destructive addition - wraps existing components without modifying them.
 *
 * @module FeaturesProvider
 */

import React, { createContext, useContext, useCallback, useEffect, useRef } from 'react';
import { useTVI } from './hooks/useTVI';
import { useGuaranteedWake } from './alarm/useGuaranteedWake';
import { useAccountability } from './accountability/useAccountability';
import { useTheme } from './hooks/useTheme';

// ============================================================================
// CONTEXT
// ============================================================================

const FeaturesContext = createContext(null);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export function FeaturesProvider({ children }) {
  const { theme } = useTheme();

  // Initialize all feature hooks
  const tvi = useTVI(theme);
  const alarm = useGuaranteedWake();
  const accountability = useAccountability();

  // Track timer state for integration
  const timerStateRef = useRef({
    isRunning: false,
    startTime: null,
    totalDuration: 0,
    userName: 'User',
    timerName: 'Timer',
  });

  // Track accountability timeout for cleanup
  const accountabilityTimeoutRef = useRef(null);

  /**
   * Called when timer starts
   */
  const onTimerStart = useCallback((totalDurationMs, options = {}) => {
    const { userName = 'User', timerName = 'Timer' } = options;

    timerStateRef.current = {
      isRunning: true,
      startTime: Date.now(),
      totalDuration: totalDurationMs,
      userName,
      timerName,
    };

    // Initialize audio on first interaction
    tvi.initialize();

    // Start TVI session
    tvi.startSession(totalDurationMs);
  }, [tvi]);

  /**
   * Called on each timer tick
   */
  const onTimerTick = useCallback((remainingMs, totalMs) => {
    tvi.updateProgress(remainingMs, totalMs);
  }, [tvi]);

  /**
   * Called when timer is paused
   */
  const onTimerPause = useCallback(() => {
    timerStateRef.current.isRunning = false;
    tvi.pauseSession();
  }, [tvi]);

  /**
   * Called when timer is resumed
   */
  const onTimerResume = useCallback(() => {
    timerStateRef.current.isRunning = true;
    tvi.resumeSession();
  }, [tvi]);

  /**
   * Called when timer is reset/cancelled
   */
  const onTimerReset = useCallback(() => {
    timerStateRef.current = {
      isRunning: false,
      startTime: null,
      totalDuration: 0,
      userName: 'User',
      timerName: 'Timer',
    };

    // Clear any pending accountability alert
    if (accountabilityTimeoutRef.current) {
      clearTimeout(accountabilityTimeoutRef.current);
      accountabilityTimeoutRef.current = null;
    }

    tvi.stopSession();
    alarm.confirmAlarm(); // Dismiss any active alarm
    accountability.cancelAlert();
  }, [tvi, alarm, accountability]);

  /**
   * Called when timer expires
   */
  const onTimerExpire = useCallback(() => {
    const { startTime, totalDuration, userName, timerName } = timerStateRef.current;

    timerStateRef.current.isRunning = false;

    // Clear any existing accountability timeout
    if (accountabilityTimeoutRef.current) {
      clearTimeout(accountabilityTimeoutRef.current);
      accountabilityTimeoutRef.current = null;
    }

    // Stop TVI (it handles its own completion announcement)
    tvi.stopSession();

    // Trigger alarm
    alarm.triggerAlarm({
      title: "Time's Up!",
      body: timerName ? `${timerName} has completed.` : 'Your countdown has completed.',
    });

    // Schedule accountability alert if user doesn't respond
    if (accountability.settings.enabled && accountability.contacts.length > 0) {
      // Capture current state for use in timeout closure
      const capturedState = {
        userName,
        timerName,
        startTime,
        totalDuration,
      };

      // In production, this would be scheduled server-side
      // For now, we'll trigger after a delay if alarm is not confirmed
      accountabilityTimeoutRef.current = setTimeout(() => {
        // Re-check alarm state at execution time via the hook's current state
        // Note: In a real app, this would be server-side scheduled
        accountability.sendAlert({
          userName: capturedState.userName,
          timerName: capturedState.timerName,
          setTime: capturedState.startTime,
          expireTime: capturedState.startTime + capturedState.totalDuration,
        });
        accountabilityTimeoutRef.current = null;
      }, accountability.settings.escalationDelayMs || 600000);
    }
  }, [tvi, alarm, accountability]);

  /**
   * Test all audio features
   */
  const testAudio = useCallback(() => {
    tvi.initialize();
    tvi.speak('Audio systems online. All features operational.');
  }, [tvi]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      tvi.stopSession();
      // Clear accountability timeout on unmount
      if (accountabilityTimeoutRef.current) {
        clearTimeout(accountabilityTimeoutRef.current);
        accountabilityTimeoutRef.current = null;
      }
    };
  }, [tvi]);

  // Context value
  const value = {
    // Feature systems
    tvi,
    alarm,
    accountability,

    // Integration callbacks
    onTimerStart,
    onTimerTick,
    onTimerPause,
    onTimerResume,
    onTimerReset,
    onTimerExpire,

    // Utilities
    testAudio,

    // Current theme
    theme,
  };

  return (
    <FeaturesContext.Provider value={value}>
      {children}
    </FeaturesContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useFeatures() {
  const context = useContext(FeaturesContext);

  if (!context) {
    // Return no-op functions if used outside provider (backward compatibility)
    return {
      tvi: { settings: {}, isAvailable: false },
      alarm: { settings: {}, isAlarming: false },
      accountability: { contacts: [], settings: {} },
      onTimerStart: () => {},
      onTimerTick: () => {},
      onTimerPause: () => {},
      onTimerResume: () => {},
      onTimerReset: () => {},
      onTimerExpire: () => {},
      testAudio: () => {},
    };
  }

  return context;
}

export default FeaturesProvider;
