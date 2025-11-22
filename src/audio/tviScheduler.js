/**
 * TVI SCHEDULER - Driftless Interval Scheduling
 *
 * Schedules announcements at precise intervals without drift.
 * Uses absolute timestamps rather than relative delays.
 *
 * Formula: nextTriggerTimestamp = sessionStart + (n * intervalMs)
 *
 * @module tviScheduler
 */

import { tviEngine } from './tviEngine';
import { tviVoices } from './tviVoices';

// ============================================================================
// MILESTONE DEFINITIONS
// ============================================================================

const MILESTONES = {
  HALFWAY: 0.5,
  QUARTER_LEFT: 0.25,
  ONE_MINUTE: 60000,
  THIRTY_SECONDS: 30000,
  TEN_SECONDS: 10000,
  FIVE_SECONDS: 5000,
};

// ============================================================================
// SCHEDULER CLASS
// ============================================================================

class TVIScheduler {
  constructor() {
    this.sessionStart = null;
    this.totalDuration = null;
    this.intervalMs = null;
    this.scheduledAnnouncements = new Map();
    this.announcedMilestones = new Set();
    this.rafId = null;
    this.isRunning = false;
    this.theme = 'minimal';
    this.lastAnnouncementTime = 0;
    this.minAnnouncementGap = 3000; // Minimum 3s between announcements
  }

  /**
   * Start scheduling announcements
   * @param {object} config
   * @param {number} config.totalDuration - Total timer duration in ms
   * @param {number} config.intervalMs - Announcement interval in ms
   * @param {string} config.theme - Current theme
   */
  start({ totalDuration, intervalMs, theme }) {
    this.sessionStart = Date.now();
    this.totalDuration = totalDuration;
    this.intervalMs = intervalMs;
    this.theme = theme;
    this.announcedMilestones.clear();
    this.isRunning = true;
    this.lastAnnouncementTime = 0;

    // Set personality
    tviEngine.setPersonality(theme);

    // Start the scheduling loop
    this.scheduleLoop();
  }

  /**
   * Main scheduling loop using RAF for precision
   */
  scheduleLoop() {
    if (!this.isRunning) return;

    const now = Date.now();
    const elapsed = now - this.sessionStart;
    const remaining = this.totalDuration - elapsed;

    if (remaining <= 0) {
      this.announceComplete();
      this.stop();
      return;
    }

    // Check for interval announcements
    this.checkIntervalAnnouncements(elapsed, remaining);

    // Check for milestone announcements
    this.checkMilestones(elapsed, remaining);

    // Continue loop
    this.rafId = requestAnimationFrame(() => this.scheduleLoop());
  }

  /**
   * Check and trigger interval-based announcements
   * @param {number} elapsed - Time elapsed since start
   * @param {number} remaining - Time remaining
   */
  checkIntervalAnnouncements(elapsed, remaining) {
    if (!this.intervalMs) return;

    // Calculate which interval we should be at
    const intervalCount = Math.floor(elapsed / this.intervalMs);
    const nextTrigger = this.sessionStart + (intervalCount * this.intervalMs);

    // Check if we should announce (within 100ms tolerance)
    const now = Date.now();
    const diff = now - nextTrigger;

    if (diff >= 0 && diff < 100) {
      const key = `interval-${intervalCount}`;
      if (!this.scheduledAnnouncements.has(key) && this.canAnnounce()) {
        this.scheduledAnnouncements.set(key, true);
        this.announceTimeRemaining(remaining);
      }
    }
  }

  /**
   * Check and trigger milestone announcements
   * @param {number} elapsed - Time elapsed
   * @param {number} remaining - Time remaining
   */
  checkMilestones(elapsed, remaining) {
    const progress = elapsed / this.totalDuration;

    // Halfway point
    if (!this.announcedMilestones.has('halfway') && progress >= MILESTONES.HALFWAY && progress < 0.55) {
      if (this.canAnnounce()) {
        this.announcedMilestones.add('halfway');
        this.announce('halfwayPoint', { priority: 2 });
      }
    }

    // One minute remaining
    if (!this.announcedMilestones.has('oneMinute') && remaining <= MILESTONES.ONE_MINUTE && remaining > MILESTONES.THIRTY_SECONDS) {
      if (this.canAnnounce()) {
        this.announcedMilestones.add('oneMinute');
        this.announce('oneMinute', { priority: 2 });
      }
    }

    // Thirty seconds remaining
    if (!this.announcedMilestones.has('thirtySeconds') && remaining <= MILESTONES.THIRTY_SECONDS && remaining > MILESTONES.TEN_SECONDS) {
      if (this.canAnnounce()) {
        this.announcedMilestones.add('thirtySeconds');
        this.announce('thirtySeconds', { priority: 2 });
      }
    }

    // Ten seconds remaining
    if (!this.announcedMilestones.has('tenSeconds') && remaining <= MILESTONES.TEN_SECONDS && remaining > MILESTONES.FIVE_SECONDS) {
      if (this.canAnnounce()) {
        this.announcedMilestones.add('tenSeconds');
        this.announce('tenSeconds', { priority: 3, critical: true });
      }
    }

    // Five second countdown
    if (!this.announcedMilestones.has('fiveSeconds') && remaining <= MILESTONES.FIVE_SECONDS && remaining > 1000) {
      if (this.canAnnounce()) {
        this.announcedMilestones.add('fiveSeconds');
        this.announce('fiveSeconds', { priority: 3, critical: true });
      }
    }
  }

  /**
   * Check if enough time has passed since last announcement
   * @returns {boolean}
   */
  canAnnounce() {
    const now = Date.now();
    if (now - this.lastAnnouncementTime >= this.minAnnouncementGap) {
      this.lastAnnouncementTime = now;
      return true;
    }
    return false;
  }

  /**
   * Announce time remaining
   * @param {number} remaining - Remaining time in ms
   */
  announceTimeRemaining(remaining) {
    const timeString = this.formatTime(remaining);
    const text = tviVoices.getAnnouncement(this.theme, 'timeRemaining', timeString);
    tviEngine.speak(text, { priority: 1 });
  }

  /**
   * Announce a specific event
   * @param {string} event - Event key
   * @param {object} options - Speech options
   */
  announce(event, options = {}) {
    const text = tviVoices.getAnnouncement(this.theme, event);
    if (text) {
      tviEngine.speak(text, options);
    }
  }

  /**
   * Announce timer completion
   */
  announceComplete() {
    const text = tviVoices.getAnnouncement(this.theme, 'complete');
    tviEngine.speak(text, { priority: 3, critical: true, interrupt: true });
  }

  /**
   * Announce pause
   */
  announcePause() {
    if (this.canAnnounce()) {
      const text = tviVoices.getAnnouncement(this.theme, 'paused');
      tviEngine.speak(text, { priority: 2 });
    }
  }

  /**
   * Announce resume
   */
  announceResume() {
    if (this.canAnnounce()) {
      const text = tviVoices.getAnnouncement(this.theme, 'resumed');
      tviEngine.speak(text, { priority: 2 });
    }
  }

  /**
   * Pause scheduling
   */
  pause() {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.announcePause();
  }

  /**
   * Resume scheduling with adjusted start time
   * @param {number} remainingTime - Remaining time in ms
   */
  resume(remainingTime) {
    this.sessionStart = Date.now() - (this.totalDuration - remainingTime);
    this.isRunning = true;
    this.announceResume();
    this.scheduleLoop();
  }

  /**
   * Stop scheduling completely
   */
  stop() {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.scheduledAnnouncements.clear();
    this.announcedMilestones.clear();
    tviEngine.cancel();
  }

  /**
   * Update interval mid-session
   * @param {number} newIntervalMs - New interval in ms
   */
  setInterval(newIntervalMs) {
    this.intervalMs = newIntervalMs;
    // Clear scheduled announcements to recalculate
    this.scheduledAnnouncements.clear();
  }

  /**
   * Format milliseconds to human-readable time
   * @param {number} ms
   * @returns {string}
   */
  formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    if (minutes > 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ${seconds > 0 ? `and ${seconds} second${seconds !== 1 ? 's' : ''}` : ''}`;
    }
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const tviScheduler = new TVIScheduler();
export { MILESTONES };
