/**
 * RTC SCHEDULER - Server-Side Alarm Scheduling (Mock)
 *
 * In production, this would run on a server with:
 * - Real-time clock for precise scheduling
 * - Push notification services
 * - SMS/Email integration
 *
 * This is a client-side mock for development.
 *
 * @module rtcScheduler
 */

// ============================================================================
// MOCK SERVER STATE
// ============================================================================

const scheduledAlarms = new Map();

// ============================================================================
// RTC SCHEDULER API
// ============================================================================

const rtcScheduler = {
  /**
   * Schedule an alarm
   * @param {object} alarm
   * @param {string} alarm.id - Unique alarm ID
   * @param {number} alarm.triggerAt - Unix timestamp to trigger
   * @param {string} alarm.userId - User identifier
   * @param {object} alarm.payload - Alarm payload
   * @returns {object}
   */
  schedule(alarm) {
    const { id, triggerAt, userId, payload } = alarm;

    if (!id || !triggerAt) {
      return { success: false, error: 'Missing required fields' };
    }

    const now = Date.now();
    if (triggerAt <= now) {
      return { success: false, error: 'Trigger time must be in the future' };
    }

    const alarmEntry = {
      id,
      triggerAt,
      userId,
      payload,
      createdAt: now,
      status: 'scheduled',
    };

    scheduledAlarms.set(id, alarmEntry);

    // In production: Register with push service, set up RTC timer
    console.log('[RTC] Alarm scheduled:', alarmEntry);

    return {
      success: true,
      alarm: alarmEntry,
      serverTime: now,
    };
  },

  /**
   * Cancel a scheduled alarm
   * @param {string} alarmId
   * @returns {object}
   */
  cancel(alarmId) {
    if (!scheduledAlarms.has(alarmId)) {
      return { success: false, error: 'Alarm not found' };
    }

    scheduledAlarms.delete(alarmId);
    console.log('[RTC] Alarm cancelled:', alarmId);

    return { success: true };
  },

  /**
   * Get alarm status
   * @param {string} alarmId
   * @returns {object}
   */
  getStatus(alarmId) {
    const alarm = scheduledAlarms.get(alarmId);

    if (!alarm) {
      return { success: false, error: 'Alarm not found' };
    }

    return {
      success: true,
      alarm,
      timeRemaining: alarm.triggerAt - Date.now(),
    };
  },

  /**
   * List all scheduled alarms for a user
   * @param {string} userId
   * @returns {object}
   */
  listAlarms(userId) {
    const userAlarms = Array.from(scheduledAlarms.values()).filter(
      (a) => a.userId === userId
    );

    return {
      success: true,
      alarms: userAlarms,
      count: userAlarms.length,
    };
  },

  /**
   * Update alarm payload
   * @param {string} alarmId
   * @param {object} updates
   * @returns {object}
   */
  update(alarmId, updates) {
    const alarm = scheduledAlarms.get(alarmId);

    if (!alarm) {
      return { success: false, error: 'Alarm not found' };
    }

    const updatedAlarm = {
      ...alarm,
      ...updates,
      updatedAt: Date.now(),
    };

    scheduledAlarms.set(alarmId, updatedAlarm);

    return { success: true, alarm: updatedAlarm };
  },

  /**
   * Simulate server time sync
   * @returns {object}
   */
  getServerTime() {
    return {
      serverTime: Date.now(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  },

  /**
   * Clear all alarms (for testing)
   */
  clearAll() {
    scheduledAlarms.clear();
    return { success: true };
  },
};

export { rtcScheduler };
