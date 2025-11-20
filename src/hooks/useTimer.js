import { useReducer, useEffect, useRef, useCallback } from 'react';

// Timer state management with useReducer for complex logic
const initialState = {
  targetDate: null,
  timeLeft: { days: 0, hours: 0, minutes: 0, seconds: 0, milliseconds: 0 },
  totalDuration: 0,
  isRunning: false,
  isPaused: false,
  isExpired: false,
  hasNotified: false,
  startTime: null,
  pausedTime: 0,
};

const ACTIONS = {
  SET_TARGET: 'SET_TARGET',
  UPDATE_TIME: 'UPDATE_TIME',
  PAUSE: 'PAUSE',
  RESUME: 'RESUME',
  RESET: 'RESET',
  EXPIRE: 'EXPIRE',
  NOTIFY: 'NOTIFY',
};

function timerReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_TARGET:
      const totalDuration = new Date(action.payload) - Date.now();
      return {
        ...state,
        targetDate: action.payload,
        totalDuration: totalDuration > 0 ? totalDuration : 0,
        isRunning: true,
        isPaused: false,
        isExpired: false,
        hasNotified: false,
        startTime: Date.now(),
        pausedTime: 0,
      };

    case ACTIONS.UPDATE_TIME:
      return {
        ...state,
        timeLeft: action.payload,
      };

    case ACTIONS.PAUSE:
      return {
        ...state,
        isPaused: true,
        isRunning: false,
        pausedTime: Date.now(),
      };

    case ACTIONS.RESUME:
      const pauseDuration = Date.now() - state.pausedTime;
      const newTarget = new Date(new Date(state.targetDate).getTime() + pauseDuration);
      return {
        ...state,
        isPaused: false,
        isRunning: true,
        targetDate: newTarget.toISOString(),
        pausedTime: 0,
      };

    case ACTIONS.RESET:
      return {
        ...initialState,
      };

    case ACTIONS.EXPIRE:
      return {
        ...state,
        isExpired: true,
        isRunning: false,
        timeLeft: { days: 0, hours: 0, minutes: 0, seconds: 0, milliseconds: 0 },
      };

    case ACTIONS.NOTIFY:
      return {
        ...state,
        hasNotified: true,
      };

    default:
      return state;
  }
}

export function useTimer() {
  const [state, dispatch] = useReducer(timerReducer, initialState, (initial) => {
    // Initialize from localStorage
    const saved = localStorage.getItem('timerState');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const now = Date.now();
        const target = new Date(parsed.targetDate);

        if (target > now && !parsed.isPaused) {
          return {
            ...initial,
            targetDate: parsed.targetDate,
            totalDuration: target - new Date(parsed.startTime),
            isRunning: true,
            startTime: parsed.startTime,
          };
        }
      } catch (e) {
        console.error('Failed to parse saved timer state:', e);
      }
    }
    return initial;
  });

  const animationFrameRef = useRef(null);
  const lastTickRef = useRef(0);
  const audioContextRef = useRef(null);

  // Calculate time left with high precision
  const calculateTimeLeft = useCallback(() => {
    if (!state.targetDate) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, milliseconds: 0 };
    }

    const difference = new Date(state.targetDate) - Date.now();

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, milliseconds: 0 };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      milliseconds: Math.floor((difference % 1000) / 10), // Show as centiseconds
    };
  }, [state.targetDate]);

  // Calculate progress percentage
  const calculateProgress = useCallback(() => {
    if (!state.targetDate || state.totalDuration <= 0) return 0;

    const remaining = new Date(state.targetDate) - Date.now();
    const progress = ((state.totalDuration - remaining) / state.totalDuration) * 100;

    return Math.max(0, Math.min(100, progress));
  }, [state.targetDate, state.totalDuration]);

  // Play tick sound (subtle)
  const playTickSound = useCallback(() => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        return; // Audio not supported
      }
    }

    try {
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.01, ctx.currentTime); // Very quiet
      gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.05);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.05);
    } catch (e) {
      // Ignore audio errors
    }
  }, []);

  // Play completion sound
  const playCompletionSound = useCallback(() => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        return;
      }
    }

    try {
      const ctx = audioContextRef.current;

      // Play a pleasant chord
      const frequencies = [523.25, 659.25, 783.99]; // C-E-G chord

      frequencies.forEach((freq, index) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = freq;
        oscillator.type = 'sine';

        const startTime = ctx.currentTime + index * 0.1;
        gainNode.gain.setValueAtTime(0.1, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, startTime + 1);

        oscillator.start(startTime);
        oscillator.stop(startTime + 1);
      });
    } catch (e) {
      // Ignore audio errors
    }
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  // Show notification
  const showNotification = useCallback(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('⏰ Timer Expired!', {
        body: 'Your countdown has finished!',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        vibrate: [200, 100, 200, 100, 200],
        tag: 'timer-complete',
        requireInteraction: true,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }, []);

  // High-precision timer loop using requestAnimationFrame
  useEffect(() => {
    if (!state.isRunning || state.isPaused) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const updateTimer = (timestamp) => {
      const timeLeft = calculateTimeLeft();

      // Check if expired
      if (timeLeft.days === 0 && timeLeft.hours === 0 &&
          timeLeft.minutes === 0 && timeLeft.seconds === 0 &&
          timeLeft.milliseconds === 0) {

        dispatch({ type: ACTIONS.EXPIRE });
        playCompletionSound();

        if (!state.hasNotified) {
          showNotification();
          dispatch({ type: ACTIONS.NOTIFY });
        }

        return;
      }

      // Update time
      dispatch({ type: ACTIONS.UPDATE_TIME, payload: timeLeft });

      // Play tick sound every second
      if (timestamp - lastTickRef.current >= 1000) {
        playTickSound();
        lastTickRef.current = timestamp;
      }

      animationFrameRef.current = requestAnimationFrame(updateTimer);
    };

    animationFrameRef.current = requestAnimationFrame(updateTimer);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [state.isRunning, state.isPaused, state.hasNotified, calculateTimeLeft, playTickSound, playCompletionSound, showNotification]);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (state.targetDate) {
      localStorage.setItem('timerState', JSON.stringify({
        targetDate: state.targetDate,
        isPaused: state.isPaused,
        startTime: state.startTime,
        totalDuration: state.totalDuration,
      }));
    }
  }, [state.targetDate, state.isPaused, state.startTime, state.totalDuration]);

  // Public API
  const setTimer = useCallback((hours) => {
    const target = new Date(Date.now() + hours * 3600000);
    dispatch({ type: ACTIONS.SET_TARGET, payload: target.toISOString() });
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  const setCustomTimer = useCallback((targetDate) => {
    dispatch({ type: ACTIONS.SET_TARGET, payload: targetDate });
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  const pause = useCallback(() => {
    dispatch({ type: ACTIONS.PAUSE });
  }, []);

  const resume = useCallback(() => {
    dispatch({ type: ACTIONS.RESUME });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: ACTIONS.RESET });
    localStorage.removeItem('timerState');
  }, []);

  return {
    ...state,
    timeLeft: state.timeLeft,
    progress: calculateProgress(),
    setTimer,
    setCustomTimer,
    pause,
    resume,
    reset,
  };
}
