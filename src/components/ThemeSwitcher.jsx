import React from 'react';
import { useTheme } from '../hooks/useTheme';
import './ThemeSwitcher.css';

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="theme-switcher">
      <div className="theme-label">THEME</div>
      <select
        className="theme-select"
        value={theme}
        onChange={e => setTheme(e.target.value)}
      >
        <option value="sci-fi">Sci-Fi</option>
        <option value="calm">Calm / Nature</option>
        <option value="minimal">Minimal</option>
      </select>
    </div>
  );
}
