/**
 * VIDEO BACKGROUND COMPONENT
 *
 * Renders theme-specific ambient video backgrounds.
 * - Seamless looping
 * - Muted (no audio)
 * - Graceful fallback if video fails to load
 * - Respects reduced motion preference
 * - Lazy loading for performance
 *
 * @module VideoBackground
 */

import React, { useState, useEffect, useRef, memo } from 'react';
import './VideoBackground.css';

// Video sources per theme
// Place your videos in /public/videos/
const THEME_VIDEOS = {
  'sci-fi': '/videos/scifi-background.mp4',
  'calm': '/videos/calm-background.mp4',
  'minimal': null, // No video for minimal theme
};

// Fallback poster images (optional, for loading state)
const THEME_POSTERS = {
  'sci-fi': '/videos/scifi-poster.jpg',
  'calm': '/videos/calm-poster.jpg',
  'minimal': null,
};

function VideoBackground({ theme = 'minimal', enabled = true }) {
  const videoRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handler = (e) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Handle video source changes
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);

    const video = videoRef.current;
    if (!video) return;

    const videoSrc = THEME_VIDEOS[theme];

    // No video for this theme
    if (!videoSrc) {
      return;
    }

    // Reset and load new source
    video.load();
  }, [theme]);

  // Handle video events
  const handleCanPlay = () => {
    setIsLoaded(true);
    setHasError(false);

    // Start playing
    const video = videoRef.current;
    if (video) {
      video.play().catch(() => {
        // Autoplay blocked - that's okay, we tried
        console.log('[VideoBackground] Autoplay blocked by browser');
      });
    }
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(false);
    console.warn('[VideoBackground] Failed to load video for theme:', theme);
  };

  // Determine if we should show video
  const videoSrc = THEME_VIDEOS[theme];
  const posterSrc = THEME_POSTERS[theme];
  const shouldShowVideo = enabled && videoSrc && !reducedMotion && !hasError;

  if (!shouldShowVideo) {
    return null;
  }

  return (
    <div className={`video-background ${isLoaded ? 'loaded' : 'loading'}`}>
      <video
        ref={videoRef}
        className="video-background-video"
        autoPlay
        loop
        muted
        playsInline
        poster={posterSrc}
        onCanPlay={handleCanPlay}
        onError={handleError}
      >
        <source src={videoSrc} type="video/mp4" />
        {/* WebM fallback for better compression */}
        <source src={videoSrc.replace('.mp4', '.webm')} type="video/webm" />
      </video>

      {/* Overlay for dimming/color adjustment */}
      <div className="video-background-overlay" />
    </div>
  );
}

export default memo(VideoBackground);
