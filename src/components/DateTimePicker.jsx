import React, { useState, useCallback } from 'react';
import './DateTimePicker.css';

export default function DateTimePicker({ onSetTime, onClose }) {
  const [selectedDate, setSelectedDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 16);
  });

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    const targetDate = new Date(selectedDate);

    if (targetDate <= new Date()) {
      alert('Please select a future date and time');
      return;
    }

    onSetTime(targetDate.toISOString());
    onClose();
  }, [selectedDate, onSetTime, onClose]);

  const handleQuickSet = useCallback((hours) => {
    const target = new Date(Date.now() + hours * 3600000);
    setSelectedDate(target.toISOString().slice(0, 16));
  }, []);

  return (
    <div className="datetime-picker-overlay" onClick={onClose}>
      <div className="datetime-picker" onClick={(e) => e.stopPropagation()}>
        <div className="picker-header">
          <h3>Set Custom Timer</h3>
          <button className="close-btn" onClick={onClose} aria-label="Close picker">×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="picker-body">
            <label htmlFor="datetime-input">Target Date & Time</label>
            <input
              id="datetime-input"
              type="datetime-local"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              required
            />

            <div className="quick-presets">
              <p>Quick Presets:</p>
              <div className="preset-grid">
                <button type="button" onClick={() => handleQuickSet(1)}>+1 Hour</button>
                <button type="button" onClick={() => handleQuickSet(6)}>+6 Hours</button>
                <button type="button" onClick={() => handleQuickSet(12)}>+12 Hours</button>
                <button type="button" onClick={() => handleQuickSet(24)}>+1 Day</button>
                <button type="button" onClick={() => handleQuickSet(72)}>+3 Days</button>
                <button type="button" onClick={() => handleQuickSet(168)}>+1 Week</button>
              </div>
            </div>
          </div>

          <div className="picker-footer">
            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="confirm-btn">Start Timer</button>
          </div>
        </form>
      </div>
    </div>
  );
}
