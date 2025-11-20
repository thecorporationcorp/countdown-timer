import React, { useState, useCallback, memo } from 'react';
import ThemeSwitcher from './components/ThemeSwitcher';
import DateTimePicker from './components/DateTimePicker';
import ProgressBar from './components/ProgressBar';
import { useTimer } from './hooks/useTimer';
import { useWakeLock } from './hooks/useWakeLock';
import './App.css';

// Memoized time unit component for performance
const TimeUnit = memo(function TimeUnit({ value, label, showMs = false }) {
  return (
    <div className="time-unit">
      <div className="time-value" aria-live="polite">
        {String(value).padStart(2, '0')}
        {showMs && <span className="milliseconds">.{String(value).padStart(2, '0')}</span>}
      </div>
      <div className="time-label">{label}</div>
    </div>
  );
});

function App() {
  const {
    timeLeft,
    isRunning,
    isPaused,
    isExpired,
    progress,
    setTimer,
    setCustomTimer,
    pause,
    resume,
    reset,
  } = useTimer();

  const [showPicker, setShowPicker] = useState(false);
  const [keepScreenOn, setKeepScreenOn] = useState(false);

  // Wake Lock when timer is running and user wants screen on
  const wakeLockActive = useWakeLock(isRunning && keepScreenOn);

  // Share timer functionality
  const handleShare = useCallback(async () => {
    if (!navigator.share) {
      // Fallback: copy to clipboard
      try {
        const url = window.location.href;
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      } catch (err) {
        console.error('Share failed:', err);
      }
      return;
    }

    try {
      await navigator.share({
        title: 'Quantum Countdown Timer',
        text: `Check out my countdown timer! ${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s remaining`,
        url: window.location.href,
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    }
  }, [timeLeft]);

  // Handle quick timer set
  const handleQuickSet = useCallback((hours) => {
    setTimer(hours);
  }, [setTimer]);

  // Handle custom timer set
  const handleCustomSet = useCallback((targetDate) => {
    setCustomTimer(targetDate);
  }, [setCustomTimer]);

  // Toggle pause/resume
  const handleTogglePause = useCallback(() => {
    if (isPaused) {
      resume();
    } else {
      pause();
    }
  }, [isPaused, pause, resume]);

  return (
    <div className="app">
      <ThemeSwitcher />

      <div className="container">
        <header>
          <h1 className="title">
            <span className="quantum-text">QUANTUM</span>
            <span className="subtitle">COUNTDOWN</span>
          </h1>
        </header>

        <main>
          {isExpired ? (
            <div className="expired-message" role="alert">
              <div className="expired-icon">🎉</div>
              <div className="expired-text">TIME'S UP!</div>
              <p className="expired-subtext">Your countdown has finished</p>
              <div className="expired-actions">
                <button
                  className="reset-btn primary"
                  onClick={reset}
                  aria-label="Start new timer"
                >
                  NEW TIMER
                </button>
                <button
                  className="reset-btn secondary"
                  onClick={() => handleQuickSet(1)}
                  aria-label="Quick restart: 1 hour"
                >
                  RESTART (1H)
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Progress Visualization */}
              {isRunning && <ProgressBar progress={progress} />}

              {/* Timer Display */}
              <div
                className={`timer-grid ${isPaused ? 'paused' : ''}`}
                role="timer"
                aria-live="polite"
                aria-atomic="true"
              >
                <TimeUnit value={timeLeft.days} label="DAYS" />
                <TimeUnit value={timeLeft.hours} label="HOURS" />
                <TimeUnit value={timeLeft.minutes} label="MINUTES" />
                <TimeUnit value={timeLeft.seconds} label="SECONDS" />
              </div>

              {/* Milliseconds Display (when timer is active) */}
              {isRunning && !isPaused && (
                <div className="milliseconds-display" aria-live="off">
                  <span className="ms-value">{String(timeLeft.milliseconds).padStart(2, '0')}</span>
                  <span className="ms-label">CENTISECONDS</span>
                </div>
              )}

              {/* Timer Controls */}
              {isRunning && (
                <div className="timer-controls">
                  <button
                    className={`control-btn ${isPaused ? 'resume' : 'pause'}`}
                    onClick={handleTogglePause}
                    aria-label={isPaused ? 'Resume timer' : 'Pause timer'}
                  >
                    {isPaused ? '▶ RESUME' : '⏸ PAUSE'}
                  </button>
                  <button
                    className="control-btn reset"
                    onClick={reset}
                    aria-label="Reset timer"
                  >
                    ⟲ RESET
                  </button>
                  <button
                    className="control-btn share"
                    onClick={handleShare}
                    aria-label="Share timer"
                  >
                    ⤴ SHARE
                  </button>
                </div>
              )}

              {/* Screen Wake Lock Toggle */}
              {isRunning && 'wakeLock' in navigator && (
                <div className="wake-lock-toggle">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={keepScreenOn}
                      onChange={(e) => setKeepScreenOn(e.target.checked)}
                      aria-label="Keep screen on"
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-text">
                      Keep Screen On {wakeLockActive && '🔒'}
                    </span>
                  </label>
                </div>
              )}

              {/* Quick Actions */}
              <div className="quick-actions">
                <h3 className="actions-title">Quick Start</h3>
                <div className="action-buttons">
                  <button
                    className="action-btn"
                    onClick={() => handleQuickSet(1)}
                    aria-label="Set timer for 1 hour"
                  >
                    1 Hour
                  </button>
                  <button
                    className="action-btn"
                    onClick={() => handleQuickSet(6)}
                    aria-label="Set timer for 6 hours"
                  >
                    6 Hours
                  </button>
                  <button
                    className="action-btn"
                    onClick={() => handleQuickSet(24)}
                    aria-label="Set timer for 1 day"
                  >
                    1 Day
                  </button>
                  <button
                    className="action-btn"
                    onClick={() => handleQuickSet(168)}
                    aria-label="Set timer for 1 week"
                  >
                    1 Week
                  </button>
                </div>
                <button
                  className="action-btn custom"
                  onClick={() => setShowPicker(true)}
                  aria-label="Set custom time"
                >
                  ⏱ CUSTOM TIME
                </button>
              </div>
            </>
          )}
        </main>

        {/* Status Information */}
        {isPaused && (
          <div className="status-banner paused" role="status" aria-live="polite">
            ⏸ Timer Paused
          </div>
        )}

        {/* Footer Info */}
        <footer className="app-footer">
          <p>
            {isRunning && !isExpired
              ? `${progress.toFixed(1)}% Complete`
              : 'Set a timer to get started'}
          </p>
        </footer>
      </div>

      {/* Date/Time Picker Modal */}
      {showPicker && (
        <DateTimePicker
          onSetTime={handleCustomSet}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}

export default memo(App);
