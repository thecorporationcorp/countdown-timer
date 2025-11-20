import React, { memo } from 'react';
import './ProgressBar.css';

const ProgressBar = memo(function ProgressBar({ progress }) {
  const circumference = 2 * Math.PI * 120; // radius = 120
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="progress-container">
      {/* Linear progress bar */}
      <div className="progress-bar-linear">
        <div
          className="progress-fill"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin="0"
          aria-valuemax="100"
        />
      </div>

      {/* Circular progress */}
      <div className="progress-circle-container">
        <svg className="progress-circle" width="280" height="280">
          {/* Background circle */}
          <circle
            className="progress-circle-bg"
            cx="140"
            cy="140"
            r="120"
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            className="progress-circle-fill"
            cx="140"
            cy="140"
            r="120"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 140 140)"
          />
        </svg>
        <div className="progress-percentage" aria-live="polite">
          {Math.round(progress)}%
        </div>
      </div>
    </div>
  );
});

export default ProgressBar;
