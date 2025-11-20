# Quantum Countdown Timer

A beautiful, multi-theme countdown timer with full PWA support and Android app capability.

## Features

### 🎨 Three Beautiful Themes
- **Sci-Fi**: Quantum-inspired design with cyber effects and animated starfield
- **Calm/Nature**: Soft gradients and peaceful animations
- **Minimal**: Clean, modern interface with subtle elegance

### 📱 Progressive Web App (PWA)
- Full offline support
- Install to home screen
- Service worker caching
- Background sync ready
- Push notification support (ready for future implementation)

### 🤖 Android Ready
- Trusted Web Activity (TWA) wrapper
- Google Play Store deployment ready
- Native app feel

### ⚡ Core Features
- Real-time countdown display
- Quick action buttons (1 hour, 1 day, 1 week)
- LocalStorage persistence
- Responsive design
- Theme preference saving

## Development

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## PWA Deployment

1. Build the app: `npm run build`
2. Deploy the `dist` folder to your hosting service (Netlify, Vercel, etc.)
3. Ensure HTTPS is enabled
4. The service worker will automatically activate

## Android App Generation

### Prerequisites
- Node.js and npm installed
- JDK 8 or higher
- Android SDK

### Generate Android App

1. Install Bubblewrap CLI globally:
```bash
npm install -g @bubblewrap/cli
```

2. Initialize TWA project:
```bash
bubblewrap init --manifest=https://your-deployed-url.com/manifest.json
```

3. Build the Android app:
```bash
bubblewrap build
```

4. The APK/AAB will be generated in the `android` folder

5. Upload the `.aab` file to Google Play Console

### Configuration
Edit `twa-manifest.json` after initialization to customize:
- App name
- Package name
- Icon
- Theme colors
- Splash screen

## Theme System

The theme system is modular and non-destructive:

- **Theme files**: `src/themes/` contains CSS for each theme
- **Theme hook**: `src/hooks/useTheme.js` manages theme state
- **Theme provider**: `src/ThemeProvider.jsx` applies themes globally
- **Theme switcher**: `src/components/ThemeSwitcher.jsx` provides UI

### Adding a New Theme

1. Create `src/themes/yourTheme.css`
2. Define CSS variables:
```css
.theme-yourtheme {
  --bg-main: your-background;
  --text-main: your-text-color;
  --accent: your-accent-color;
  --danger: your-danger-color;
  --font-family: your-font;
}
```
3. Import in `src/ThemeProvider.jsx`
4. Add option to `src/components/ThemeSwitcher.jsx`

## Project Structure

```
countdown-timer/
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── service-worker.js      # Service worker for offline support
│   └── icons/                 # App icons
├── src/
│   ├── components/
│   │   ├── ThemeSwitcher.jsx  # Theme selection UI
│   │   └── ThemeSwitcher.css
│   ├── hooks/
│   │   └── useTheme.js        # Theme management hook
│   ├── themes/
│   │   ├── theme.css          # Shared variables
│   │   ├── sciFi.css          # Sci-Fi theme
│   │   ├── calm.css           # Calm/Nature theme
│   │   └── minimal.css        # Minimal theme
│   ├── App.jsx                # Main app component
│   ├── App.css                # App styles
│   ├── ThemeProvider.jsx      # Theme provider wrapper
│   └── main.jsx               # App entry point
├── index.html
├── vite.config.js
└── package.json
```

## Technologies Used

- **React 18**: UI framework
- **Vite**: Build tool and dev server
- **CSS Variables**: Dynamic theming
- **Service Workers**: PWA functionality
- **LocalStorage**: State persistence
- **Bubblewrap**: Android TWA wrapper

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (iOS 11.3+)
- Samsung Internet: Full support

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
