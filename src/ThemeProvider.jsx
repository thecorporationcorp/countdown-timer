import React from 'react';
import { useTheme } from './hooks/useTheme';
import './themes/theme.css';
import './themes/sciFi.css';
import './themes/calm.css';
import './themes/minimal.css';

export default function ThemeProvider({ children }) {
  useTheme(); // Initialize and manage theme
  return children;
}
