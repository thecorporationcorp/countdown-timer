import React, { useState, useEffect } from 'react';
import ThemeSwitcher from './components/ThemeSwitcher';
import './App.css';

function App() {
  const [targetDate, setTargetDate] = useState(() => {
    const saved = localStorage.getItem('targetDate');
    return saved || new Date(Date.now() + 3600000).toISOString();
  });

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(targetDate) - new Date();

      if (difference <= 0) {
        setIsExpired(true);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    setTimeLeft(calculateTimeLeft());
    return () => clearInterval(timer);
  }, [targetDate]);

  const handleSetTime = (hours) => {
    const newDate = new Date(Date.now() + hours * 3600000);
    setTargetDate(newDate.toISOString());
    localStorage.setItem('targetDate', newDate.toISOString());
    setIsExpired(false);
  };

  return (
    <div className="app">
      <ThemeSwitcher />

      <div className="container">
        <h1 className="title">
          <span className="quantum-text">QUANTUM</span>
          <span className="subtitle">COUNTDOWN</span>
        </h1>

        {isExpired ? (
          <div className="expired-message">
            <div className="expired-text">TIME EXPIRED</div>
            <button className="reset-btn" onClick={() => handleSetTime(1)}>
              RESET TIMER
            </button>
          </div>
        ) : (
          <div className="timer-grid">
            <div className="time-unit">
              <div className="time-value">{String(timeLeft.days).padStart(2, '0')}</div>
              <div className="time-label">DAYS</div>
            </div>
            <div className="time-unit">
              <div className="time-value">{String(timeLeft.hours).padStart(2, '0')}</div>
              <div className="time-label">HOURS</div>
            </div>
            <div className="time-unit">
              <div className="time-value">{String(timeLeft.minutes).padStart(2, '0')}</div>
              <div className="time-label">MINUTES</div>
            </div>
            <div className="time-unit">
              <div className="time-value">{String(timeLeft.seconds).padStart(2, '0')}</div>
              <div className="time-label">SECONDS</div>
            </div>
          </div>
        )}

        <div className="quick-actions">
          <button className="action-btn" onClick={() => handleSetTime(1)}>1 Hour</button>
          <button className="action-btn" onClick={() => handleSetTime(24)}>1 Day</button>
          <button className="action-btn" onClick={() => handleSetTime(168)}>1 Week</button>
        </div>
      </div>
    </div>
  );
}

export default App;
