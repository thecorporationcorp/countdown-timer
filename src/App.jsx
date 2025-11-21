import React, { useState, useCallback, memo } from 'react';
import { useTimer, TIMER_STATE } from './hooks/useTimer';
import { useWakeLock } from './hooks/useWakeLock';
import { useTheme } from './hooks/useTheme';
import './App.css';

/**
 * ELEGANT TIMER APP
 *
 * Design Principles:
 * 1. One Way: Each action has exactly one way to perform it
 * 2. Progressive Disclosure: Show only what's needed for current state
 * 3. Zero Jargon: Labels a 5-year-old could understand
 * 4. Minimal Chrome: Interface disappears, content shines
 * 5. Instant Clarity: User knows what to do within 1 second
 */

// ============================================================================
// PRESETS - Single Source of Truth
// ============================================================================

const PRESETS = [
  { label: '5 min', minutes: 5 },
  { label: '15 min', minutes: 15 },
  { label: '30 min', minutes: 30 },
  { label: '1 hour', minutes: 60 },
];

// ============================================================================
// IDLE VIEW - "Set a Timer"
// ============================================================================

const IdleView = memo(function IdleView({ onStart, onCustom }) {
  return (
    <div className="idle-view">
      <h2 className="view-title">Set a Timer</h2>
      <div className="preset-buttons">
        {PRESETS.map(({ label, minutes }) => (
          <button
            key={minutes}
            className="preset-btn"
            onClick={() => onStart(minutes / 60)}
            aria-label={`Set timer for ${label}`}
          >
            {label}
          </button>
        ))}
        <button
          className="preset-btn custom"
          onClick={onCustom}
          aria-label="Set custom duration"
        >
          Custom
        </button>
      </div>
    </div>
  );
});

// ============================================================================
// RUNNING VIEW - Timer counting down
// ============================================================================

const RunningView = memo(function RunningView({ timeLeft, progress, onPause, onCancel }) {
  const timeString = formatTime(timeLeft);

  return (
    <div className="running-view">
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin="0"
          aria-valuemax="100"
        />
      </div>

      <div className="time-display" role="timer" aria-live="polite">
        {timeString}
      </div>

      <div className="controls">
        <button className="control-btn pause" onClick={onPause}>
          Pause
        </button>
        <button className="control-btn cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
});

// ============================================================================
// PAUSED VIEW - Timer frozen
// ============================================================================

const PausedView = memo(function PausedView({ timeLeft, progress, onResume, onCancel }) {
  const timeString = formatTime(timeLeft);

  return (
    <div className="paused-view">
      <div className="progress-bar paused">
        <div
          className="progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="time-display paused">
        {timeString}
        <span className="paused-badge">PAUSED</span>
      </div>

      <div className="controls">
        <button className="control-btn resume" onClick={onResume}>
          Resume
        </button>
        <button className="control-btn cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
});

// ============================================================================
// FINISHED VIEW - Timer complete
// ============================================================================

const FinishedView = memo(function FinishedView({ onRestart }) {
  return (
    <div className="finished-view">
      <div className="celebration">🎉</div>
      <h2 className="finished-title">Time's Up!</h2>
      <button className="start-btn" onClick={onRestart}>
        Start New Timer
      </button>
    </div>
  );
});

// ============================================================================
// CUSTOM TIME PICKER (Simplified)
// ============================================================================

function CustomPicker({ onSet, onClose }) {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(30);

  const handleSubmit = (e) => {
    e.preventDefault();
    const totalHours = hours + minutes / 60;
    if (totalHours > 0) {
      onSet(totalHours);
      onClose();
    }
  };

  return (
    <div className="picker-overlay" onClick={onClose}>
      <div className="picker-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Custom Duration</h3>

        <form onSubmit={handleSubmit}>
          <div className="picker-inputs">
            <label>
              <input
                type="number"
                min="0"
                max="99"
                value={hours}
                onChange={(e) => setHours(parseInt(e.target.value) || 0)}
              />
              <span>hours</span>
            </label>
            <label>
              <input
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
              />
              <span>minutes</span>
            </label>
          </div>

          <div className="picker-actions">
            <button type="button" className="picker-btn cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="picker-btn start">
              Start
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// SETTINGS MODAL
// ============================================================================

function SettingsModal({ onClose }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h3>Settings</h3>
          <button className="close-btn" onClick={onClose} aria-label="Close settings">×</button>
        </div>

        <div className="settings-body">
          <div className="setting-row">
            <span>Theme</span>
            <select value={theme} onChange={(e) => setTheme(e.target.value)}>
              <option value="sci-fi">Sci-Fi</option>
              <option value="calm">Calm</option>
              <option value="minimal">Minimal</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatTime(timeLeft) {
  const { days, hours, minutes, seconds } = timeLeft;
  const totalHours = days * 24 + hours;

  if (totalHours > 0) {
    return `${String(totalHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// ============================================================================
// MAIN APP
// ============================================================================

function App() {
  const {
    timerState,
    timeLeft,
    progress,
    setTimer,
    pause,
    resume,
    reset,
  } = useTimer();

  const [showPicker, setShowPicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Auto-enable wake lock when running
  useWakeLock(timerState === TIMER_STATE.RUNNING);

  // Handlers
  const handleStart = useCallback((hours) => {
    setTimer(hours);
  }, [setTimer]);

  const handleCancel = useCallback(() => {
    reset();
  }, [reset]);

  // Determine which view to show
  const renderView = () => {
    switch (timerState) {
      case TIMER_STATE.IDLE:
        return (
          <IdleView
            onStart={handleStart}
            onCustom={() => setShowPicker(true)}
          />
        );

      case TIMER_STATE.RUNNING:
        return (
          <RunningView
            timeLeft={timeLeft}
            progress={progress}
            onPause={pause}
            onCancel={handleCancel}
          />
        );

      case TIMER_STATE.PAUSED:
        return (
          <PausedView
            timeLeft={timeLeft}
            progress={progress}
            onResume={resume}
            onCancel={handleCancel}
          />
        );

      case TIMER_STATE.EXPIRED:
        return <FinishedView onRestart={reset} />;

      default:
        return <IdleView onStart={handleStart} onCustom={() => setShowPicker(true)} />;
    }
  };

  return (
    <div className="app">
      {/* Settings Button */}
      <button
        className="settings-btn"
        onClick={() => setShowSettings(true)}
        aria-label="Settings"
      >
        ⚙
      </button>

      {/* Main Content */}
      <div className="container">
        <header>
          <h1 className="app-title">Timer</h1>
        </header>

        <main>
          {renderView()}
        </main>
      </div>

      {/* Modals */}
      {showPicker && (
        <CustomPicker
          onSet={handleStart}
          onClose={() => setShowPicker(false)}
        />
      )}

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}

export default memo(App);
