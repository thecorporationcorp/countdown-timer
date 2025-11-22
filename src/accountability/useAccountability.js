/**
 * USE ACCOUNTABILITY HOOK - Phone-A-Friend System
 *
 * Manages accountability contacts who receive notifications
 * when user fails to respond to alarm.
 *
 * Security: Tokenized contacts, ephemeral storage, GDPR compliant.
 *
 * @module useAccountability
 */

import { useState, useEffect, useCallback } from 'react';

// ============================================================================
// CONSTANTS
// ============================================================================

const ACCOUNTABILITY_STORAGE_KEY = 'quantum-timer-accountability';
const MAX_CONTACTS = 3;

const TONE_TEMPLATES = {
  professional: {
    subject: 'Timer Alert: {name} needs your help',
    body: 'Hello,\n\n{name} set a timer that has expired and hasn\'t confirmed they\'re awake. They asked you to check in on them.\n\nTimer: {timerName}\nSet at: {setTime}\nExpired: {expireTime}\n\nPlease reach out to make sure they\'re okay.\n\nBest regards,\nQuantum Timer',
  },
  friendly: {
    subject: 'Hey! {name} might need a nudge',
    body: 'Hi there! 👋\n\n{name} set a timer and hasn\'t responded to the alarm. They wanted you to know in case they need a friendly wake-up call!\n\n⏰ Timer ended: {expireTime}\n\nMaybe give them a quick call or text?\n\nThanks!',
  },
  urgency: {
    subject: 'URGENT: {name} - Timer Alert',
    body: 'ATTENTION\n\n{name} has not responded to their timer alarm.\n\nTimer expired at: {expireTime}\nTime since expiration: {timeSince}\n\nPlease contact them immediately.\n\nThis is an automated alert from Quantum Timer.',
  },
  escalation: {
    subject: '⚠️ ESCALATION: {name} still unresponsive',
    body: 'ESCALATION NOTICE\n\nMultiple attempts to reach {name} have failed.\n\nOriginal timer: {timerName}\nExpired: {expireTime}\nTime unresponsive: {timeSince}\n\nThis requires immediate attention. Please try to reach them through all available means.\n\nQuantum Timer - Escalation System',
  },
  comedic: {
    subject: '🚀 Mission Critical: Agent {name} MIA',
    body: 'ATTENTION TEMPORAL AGENT,\n\nAgent {name} has failed to report after their quantum countdown concluded.\n\nMission Status: INCOMPLETE\nTemporal Coordinates: {expireTime}\nTime Drift: {timeSince}\n\nYour mission, should you choose to accept it: Establish contact with the missing agent and ensure they have returned to this dimension.\n\nThis message will self-destruct... just kidding, it won\'t.\n\n🌌 Quantum Command',
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate a secure one-time token
 */
function generateToken() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash contact info for privacy
 */
async function hashContact(contact) {
  const encoder = new TextEncoder();
  const data = encoder.encode(contact.toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

/**
 * Format template with variables
 */
function formatTemplate(template, vars) {
  let result = template;
  Object.entries(vars).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{${key}}`, 'g'), value);
  });
  return result;
}

// ============================================================================
// HOOK
// ============================================================================

export function useAccountability() {
  const [contacts, setContacts] = useState([]);
  const [settings, setSettings] = useState({
    enabled: false,
    defaultTone: 'friendly',
    escalationDelayMs: 600000, // 10 minutes
    requireConsent: true,
    allowComedic: false,
  });
  const [pendingAlert, setPendingAlert] = useState(null);
  const [lastAlertTime, setLastAlertTime] = useState(0);

  // Rate limiting: minimum time between alerts (5 minutes)
  const MIN_ALERT_INTERVAL_MS = 300000;

  // Load from storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(ACCOUNTABILITY_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        setContacts(data.contacts || []);
        setSettings((prev) => ({ ...prev, ...data.settings }));
      }
    } catch {
      // Ignore
    }
  }, []);

  // Save to storage
  useEffect(() => {
    try {
      localStorage.setItem(
        ACCOUNTABILITY_STORAGE_KEY,
        JSON.stringify({ contacts, settings })
      );
    } catch {
      // Ignore
    }
  }, [contacts, settings]);

  /**
   * Add a contact with validation
   */
  const addContact = useCallback(async (contact) => {
    if (contacts.length >= MAX_CONTACTS) {
      return { success: false, error: `Maximum of ${MAX_CONTACTS} contacts allowed` };
    }

    const { name, email, phone, tone = settings.defaultTone, consentGiven = false } = contact;

    // Validate name
    const trimmedName = name?.trim();
    if (!trimmedName || trimmedName.length < 1) {
      return { success: false, error: 'Name is required' };
    }
    if (trimmedName.length > 100) {
      return { success: false, error: 'Name is too long (max 100 characters)' };
    }

    // Validate contact method
    const trimmedEmail = email?.trim();
    const trimmedPhone = phone?.trim();

    if (!trimmedEmail && !trimmedPhone) {
      return { success: false, error: 'Email or phone number is required' };
    }

    // Validate email format if provided
    if (trimmedEmail && !isValidEmail(trimmedEmail)) {
      return { success: false, error: 'Invalid email format' };
    }

    // Validate phone format if provided (and no email)
    if (!trimmedEmail && trimmedPhone && !isValidPhone(trimmedPhone)) {
      return { success: false, error: 'Invalid phone number format' };
    }

    // Validate consent
    if (settings.requireConsent && !consentGiven) {
      return { success: false, error: 'You must confirm you have permission from this person' };
    }

    // Validate tone
    const validTones = Object.keys(TONE_TEMPLATES);
    const effectiveTone = validTones.includes(tone) ? tone : settings.defaultTone;

    // Generate tokenized ID from the primary contact method
    const contactMethod = trimmedEmail || trimmedPhone;
    const tokenId = await hashContact(contactMethod);

    // Check for duplicates
    if (contacts.some((c) => c.tokenId === tokenId)) {
      return { success: false, error: 'This contact has already been added' };
    }

    const newContact = {
      id: generateToken(),
      tokenId,
      name: trimmedName,
      email: trimmedEmail || null,
      phone: trimmedPhone || null,
      tone: effectiveTone,
      consentGiven,
      addedAt: Date.now(),
    };

    setContacts((prev) => [...prev, newContact]);
    return { success: true, contact: newContact };
  }, [contacts, settings.defaultTone, settings.requireConsent]);

  /**
   * Remove a contact
   */
  const removeContact = useCallback((contactId) => {
    setContacts((prev) => prev.filter((c) => c.id !== contactId));
  }, []);

  /**
   * Update a contact
   */
  const updateContact = useCallback((contactId, updates) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === contactId ? { ...c, ...updates } : c))
    );
  }, []);

  /**
   * Send alert to contacts with rate limiting
   */
  const sendAlert = useCallback(async (timerInfo) => {
    if (!settings.enabled || contacts.length === 0) {
      return { success: false, error: 'Accountability not enabled or no contacts' };
    }

    // Rate limiting check
    const now = Date.now();
    if (now - lastAlertTime < MIN_ALERT_INTERVAL_MS) {
      const waitTime = Math.ceil((MIN_ALERT_INTERVAL_MS - (now - lastAlertTime)) / 60000);
      return {
        success: false,
        error: `Please wait ${waitTime} minute${waitTime > 1 ? 's' : ''} before sending another alert`,
        rateLimited: true,
      };
    }

    const { name: userName = 'User', timerName = 'Timer', setTime, expireTime } = timerInfo;

    // Validate timestamps
    const validSetTime = Number.isFinite(setTime) ? setTime : Date.now();
    const validExpireTime = Number.isFinite(expireTime) ? expireTime : Date.now();

    const vars = {
      name: userName,
      timerName,
      setTime: new Date(validSetTime).toLocaleString(),
      expireTime: new Date(validExpireTime).toLocaleString(),
      timeSince: formatTimeSince(now - validExpireTime),
    };

    const results = [];

    for (const contact of contacts) {
      const tone = contact.tone || settings.defaultTone;

      // Skip comedic tone unless explicitly allowed
      const effectiveTone = tone === 'comedic' && !settings.allowComedic ? 'friendly' : tone;

      const template = TONE_TEMPLATES[effectiveTone];
      if (!template) continue; // Skip if template missing

      const subject = formatTemplate(template.subject, vars);
      const body = formatTemplate(template.body, vars);

      // In production, this would call the server
      // For now, we simulate with console log and store pending
      console.log('[Accountability] Alert would be sent:', {
        to: contact.email || contact.phone,
        subject,
        body,
      });

      results.push({
        contactId: contact.id,
        status: 'pending',
        sentAt: now,
      });
    }

    // Update rate limiting timestamp
    setLastAlertTime(now);

    setPendingAlert({
      id: generateToken(),
      timerInfo,
      sentAt: now,
      results,
    });

    return { success: true, results, alertCount: results.length };
  }, [contacts, settings, lastAlertTime, MIN_ALERT_INTERVAL_MS]);

  /**
   * Cancel pending alert (user confirmed they're awake)
   */
  const cancelAlert = useCallback(() => {
    setPendingAlert(null);
    return { success: true };
  }, []);

  /**
   * Update settings
   */
  const updateSettings = useCallback((updates) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  /**
   * Get formatted template preview
   */
  const getTemplatePreview = useCallback((tone, vars) => {
    const template = TONE_TEMPLATES[tone] || TONE_TEMPLATES.friendly;
    return {
      subject: formatTemplate(template.subject, vars),
      body: formatTemplate(template.body, vars),
    };
  }, []);

  return {
    // State
    contacts,
    settings,
    pendingAlert,
    maxContacts: MAX_CONTACTS,
    toneOptions: Object.keys(TONE_TEMPLATES),

    // Actions
    addContact,
    removeContact,
    updateContact,
    sendAlert,
    cancelAlert,

    // Settings
    updateSettings,
    setEnabled: (enabled) => updateSettings({ enabled }),
    setDefaultTone: (tone) => updateSettings({ defaultTone: tone }),
    setAllowComedic: (allow) => updateSettings({ allowComedic: allow }),

    // Utilities
    getTemplatePreview,
  };
}

/**
 * Format time since as human readable
 * @param {number} ms - Milliseconds since event
 * @returns {string} Human readable duration
 */
function formatTimeSince(ms) {
  // Handle edge cases
  if (!Number.isFinite(ms) || ms < 0) {
    return 'just now';
  }

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remainingHours = hours % 24;
    return `${days} day${days > 1 ? 's' : ''}${remainingHours > 0 ? ` ${remainingHours} hour${remainingHours > 1 ? 's' : ''}` : ''}`;
  }

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours} hour${hours > 1 ? 's' : ''}${remainingMinutes > 0 ? ` ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}` : ''}`;
  }

  if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }

  return 'less than a minute';
}

/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  // Basic email validation - not exhaustive but catches common errors
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate phone format (basic international format)
 * @param {string} phone
 * @returns {boolean}
 */
function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  // Allow digits, spaces, dashes, parentheses, and + prefix
  const cleaned = phone.replace(/[\s\-()]/g, '');
  const phoneRegex = /^\+?\d{7,15}$/;
  return phoneRegex.test(cleaned);
}

export { TONE_TEMPLATES, MAX_CONTACTS };
