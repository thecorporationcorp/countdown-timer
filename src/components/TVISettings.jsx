/**
 * TVI SETTINGS COMPONENT
 *
 * Settings panel for Temporal Voice Intelligence.
 * Non-destructive addition to existing settings.
 */

import React, { memo, useCallback } from 'react';
import './TVISettings.css';

const INTERVAL_OPTIONS = [
  { value: 10000, label: '10 seconds' },
  { value: 30000, label: '30 seconds' },
  { value: 60000, label: '1 minute' },
  { value: 300000, label: '5 minutes' },
  { value: 600000, label: '10 minutes' },
  { value: 0, label: 'Off' },
];

function TVISettings({
  settings,
  onUpdateSettings,
  isAvailable,
  onTest,
}) {
  const handleToggle = useCallback((key) => {
    onUpdateSettings({ [key]: !settings[key] });
  }, [settings, onUpdateSettings]);

  const handleIntervalChange = useCallback((e) => {
    onUpdateSettings({ intervalMs: parseInt(e.target.value, 10) });
  }, [onUpdateSettings]);

  const handleVolumeChange = useCallback((e) => {
    onUpdateSettings({ volume: parseFloat(e.target.value) });
  }, [onUpdateSettings]);

  if (!isAvailable) {
    return (
      <div className="tvi-settings tvi-unavailable">
        <h4>Voice Announcements</h4>
        <p className="tvi-notice">
          Voice features are not available in this browser.
        </p>
      </div>
    );
  }

  return (
    <div className="tvi-settings">
      <h4>Voice Announcements</h4>

      <div className="tvi-setting-row">
        <label className="tvi-toggle">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={() => handleToggle('enabled')}
          />
          <span className="tvi-toggle-slider" />
          <span className="tvi-toggle-label">Enable Voice</span>
        </label>
      </div>

      {settings.enabled && (
        <>
          <div className="tvi-setting-row">
            <label className="tvi-toggle">
              <input
                type="checkbox"
                checked={settings.voiceEnabled}
                onChange={() => handleToggle('voiceEnabled')}
              />
              <span className="tvi-toggle-slider" />
              <span className="tvi-toggle-label">Spoken Time</span>
            </label>
          </div>

          <div className="tvi-setting-row">
            <label className="tvi-toggle">
              <input
                type="checkbox"
                checked={settings.humEnabled}
                onChange={() => handleToggle('humEnabled')}
              />
              <span className="tvi-toggle-slider" />
              <span className="tvi-toggle-label">Ambient Hum</span>
            </label>
          </div>

          <div className="tvi-setting-row tvi-setting-select">
            <span>Announce Every</span>
            <select
              value={settings.intervalMs || 0}
              onChange={handleIntervalChange}
            >
              {INTERVAL_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="tvi-setting-row tvi-setting-range">
            <span>Volume</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.volume}
              onChange={handleVolumeChange}
            />
            <span className="tvi-volume-value">
              {Math.round(settings.volume * 100)}%
            </span>
          </div>

          {onTest && (
            <button
              type="button"
              className="tvi-test-btn"
              onClick={onTest}
            >
              Test Voice
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default memo(TVISettings);
