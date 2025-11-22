/**
 * ACCOUNTABILITY DISPATCHER - Server-Side Alert System (Mock)
 *
 * In production, this would:
 * - Send actual SMS via Twilio/similar
 * - Send emails via SendGrid/similar
 * - Generate secure one-time links
 * - Track delivery and confirmations
 *
 * This is a client-side mock for development.
 *
 * @module dispatcher
 */

// SMS templates are loaded from smsTemplates.json (mock implementation)
// In production, templates would be fetched from the server

// ============================================================================
// MOCK STATE
// ============================================================================

const pendingAlerts = new Map();
const sentAlerts = [];
const confirmationLinks = new Map();

// ============================================================================
// DISPATCHER API
// ============================================================================

const accountabilityDispatcher = {
  /**
   * Send alert to a contact
   * @param {object} params
   * @returns {object}
   */
  async sendAlert(params) {
    const {
      contactId,
      contactMethod, // 'email' or 'sms'
      recipient,
      subject,
      body,
      tone,
      userId,
      timerInfo,
    } = params;

    // Generate one-time confirmation link
    const confirmToken = this.generateSecureToken();
    const confirmUrl = `${window.location.origin}/confirm/${confirmToken}`;

    confirmationLinks.set(confirmToken, {
      contactId,
      userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      confirmed: false,
    });

    const alert = {
      id: this.generateSecureToken(),
      contactId,
      contactMethod,
      recipient,
      subject,
      body,
      tone,
      userId,
      timerInfo,
      confirmUrl,
      sentAt: Date.now(),
      status: 'sent',
      deliveryStatus: 'pending',
    };

    // Simulate sending (in production: actual API call)
    console.log('[Dispatcher] Alert sent:', {
      method: contactMethod,
      to: recipient,
      subject,
      confirmUrl,
    });

    sentAlerts.push(alert);
    pendingAlerts.set(alert.id, alert);

    // Simulate delivery confirmation after 2 seconds
    setTimeout(() => {
      this.updateDeliveryStatus(alert.id, 'delivered');
    }, 2000);

    return {
      success: true,
      alertId: alert.id,
      confirmUrl,
    };
  },

  /**
   * Check confirmation link
   * @param {string} token
   * @returns {object}
   */
  checkConfirmation(token) {
    const link = confirmationLinks.get(token);

    if (!link) {
      return { success: false, error: 'Invalid or expired link' };
    }

    if (Date.now() > link.expiresAt) {
      confirmationLinks.delete(token);
      return { success: false, error: 'Link expired' };
    }

    return {
      success: true,
      confirmed: link.confirmed,
      contactId: link.contactId,
    };
  },

  /**
   * Confirm alert was received
   * @param {string} token
   * @returns {object}
   */
  confirmAlert(token) {
    const link = confirmationLinks.get(token);

    if (!link) {
      return { success: false, error: 'Invalid link' };
    }

    link.confirmed = true;
    link.confirmedAt = Date.now();

    // Update related alerts
    pendingAlerts.forEach((alert) => {
      if (alert.contactId === link.contactId) {
        alert.status = 'confirmed';
        alert.confirmedAt = Date.now();
      }
    });

    return { success: true };
  },

  /**
   * Update delivery status
   * @param {string} alertId
   * @param {string} status
   */
  updateDeliveryStatus(alertId, status) {
    const alert = pendingAlerts.get(alertId);
    if (alert) {
      alert.deliveryStatus = status;
      alert.statusUpdatedAt = Date.now();
    }
  },

  /**
   * Get alert status
   * @param {string} alertId
   * @returns {object}
   */
  getAlertStatus(alertId) {
    const alert = pendingAlerts.get(alertId);

    if (!alert) {
      return { success: false, error: 'Alert not found' };
    }

    return {
      success: true,
      alert,
    };
  },

  /**
   * List sent alerts for a user
   * @param {string} userId
   * @returns {object}
   */
  listAlerts(userId) {
    const userAlerts = sentAlerts.filter((a) => a.userId === userId);

    return {
      success: true,
      alerts: userAlerts,
      count: userAlerts.length,
    };
  },

  /**
   * Cancel pending alert
   * @param {string} alertId
   * @returns {object}
   */
  cancelAlert(alertId) {
    const alert = pendingAlerts.get(alertId);

    if (!alert) {
      return { success: false, error: 'Alert not found' };
    }

    alert.status = 'cancelled';
    alert.cancelledAt = Date.now();

    return { success: true };
  },

  /**
   * Generate secure token
   * @returns {string}
   */
  generateSecureToken() {
    const array = new Uint8Array(24);
    crypto.getRandomValues(array);
    return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
  },

  /**
   * Cleanup expired links (GDPR compliance)
   */
  cleanupExpired() {
    const now = Date.now();

    confirmationLinks.forEach((link, token) => {
      if (now > link.expiresAt) {
        confirmationLinks.delete(token);
      }
    });

    // Remove alerts older than 7 days
    const cutoff = now - 7 * 24 * 60 * 60 * 1000;
    pendingAlerts.forEach((alert, id) => {
      if (alert.sentAt < cutoff) {
        pendingAlerts.delete(id);
      }
    });
  },
};

export { accountabilityDispatcher };
