import { useEffect, useState } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState(
    localStorage.getItem('appTheme') || 'sci-fi'
  );

  useEffect(() => {
    const body = document.body;
    // Remove all theme classes
    body.classList.remove('theme-sci-fi', 'theme-calm', 'theme-minimal');
    // Add current theme class
    body.classList.add(`theme-${theme}`);
    // Persist to localStorage
    localStorage.setItem('appTheme', theme);
  }, [theme]);

  return { theme, setTheme };
}
