/**
 * ALARM SETTINGS COMPONENT
 *
 * Settings panel for Guaranteed Wake Alarm System.
 * Non-destructive addition to existing settings.
 */

import React, { memo, useCallback } from 'react';
import './AlarmSettings.css';

function AlarmSettings({
  settings,
  onUpdateSettings,
  notificationPermission,
  onRequestPermission,
  onTest,
  capabilities,
}) {
  const handleToggle = useCallback((key) => {
    onUpdateSettings({ [key]: !settings[key] });
  }, [settings, onUpdateSettings]);

  const handleVolumeChange = useCallback((e) => {
    onUpdateSettings({ soundVolume: parseFloat(e.target.value) });
  }, [onUpdateSettings]);

  return (
    <div className="alarm-settings">
      <h4>Alarm Settings</h4>

      <div className="alarm-setting-row">
        <label className="alarm-toggle">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={() => handleToggle('enabled')}
          />
          <span className="alarm-toggle-slider" />
          <span className="alarm-toggle-label">Enable Alarm</span>
        </label>
      </div>

      {settings.enabled && (
        <>
          {/* Sound */}
          {capabilities.hasAudioSupport && (
            <>
              <div className="alarm-setting-row">
                <label className="alarm-toggle">
                  <input
                    type="checkbox"
                    checked={settings.soundEnabled}
                    onChange={() => handleToggle('soundEnabled')}
                  />
                  <span className="alarm-toggle-slider" />
                  <span className="alarm-toggle-label">Sound</span>
                </label>
              </div>

              {settings.soundEnabled && (
                <div className="alarm-setting-row alarm-setting-range">
                  <span>Volume</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.soundVolume}
                    onChange={handleVolumeChange}
                  />
                  <span className="alarm-volume-value">
                    {Math.round(settings.soundVolume * 100)}%
                  </span>
                </div>
              )}
            </>
          )}

          {/* Vibration */}
          {capabilities.hasVibrationSupport && (
            <div className="alarm-setting-row">
              <label className="alarm-toggle">
                <input
                  type="checkbox"
                  checked={settings.vibrationEnabled}
                  onChange={() => handleToggle('vibrationEnabled')}
                />
                <span className="alarm-toggle-slider" />
                <span className="alarm-toggle-label">Vibration</span>
              </label>
            </div>
          )}

          {/* Notifications */}
          {capabilities.hasNotificationSupport && (
            <div className="alarm-setting-row alarm-notification-row">
              <label className="alarm-toggle">
                <input
                  type="checkbox"
                  checked={settings.notificationEnabled}
                  onChange={() => handleToggle('notificationEnabled')}
                  disabled={notificationPermission === 'denied'}
                />
                <span className="alarm-toggle-slider" />
                <span className="alarm-toggle-label">Notifications</span>
              </label>

              {notificationPermission === 'default' && (
                <button
                  type="button"
                  className="alarm-permission-btn"
                  onClick={onRequestPermission}
                >
                  Enable
                </button>
              )}

              {notificationPermission === 'denied' && (
                <span className="alarm-permission-denied">Blocked</span>
              )}
            </div>
          )}

          {/* Escalation */}
          <div className="alarm-setting-row">
            <label className="alarm-toggle">
              <input
                type="checkbox"
                checked={settings.escalationEnabled}
                onChange={() => handleToggle('escalationEnabled')}
              />
              <span className="alarm-toggle-slider" />
              <span className="alarm-toggle-label">Auto-Escalate</span>
            </label>
            <span className="alarm-setting-hint">
              Gets louder if not dismissed
            </span>
          </div>

          {/* Snooze */}
          <div className="alarm-setting-row">
            <label className="alarm-toggle">
              <input
                type="checkbox"
                checked={settings.snoozeEnabled}
                onChange={() => handleToggle('snoozeEnabled')}
              />
              <span className="alarm-toggle-slider" />
              <span className="alarm-toggle-label">Allow Snooze</span>
            </label>
          </div>

          {/* Test Button */}
          {onTest && (
            <button
              type="button"
              className="alarm-test-btn"
              onClick={onTest}
            >
              Test Alarm
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default memo(AlarmSettings);
