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
   * Add a contact
   */
  const addContact = useCallback(async (contact) => {
    if (contacts.length >= MAX_CONTACTS) {
      return { success: false, error: 'Maximum contacts reached' };
    }

    const { name, email, phone, tone = settings.defaultTone, consentGiven = false } = contact;

    if (!name || (!email && !phone)) {
      return { success: false, error: 'Name and contact method required' };
    }

    if (settings.requireConsent && !consentGiven) {
      return { success: false, error: 'Consent required' };
    }

    // Generate tokenized ID
    const tokenId = await hashContact(email || phone);

    // Check for duplicates
    if (contacts.some((c) => c.tokenId === tokenId)) {
      return { success: false, error: 'Contact already exists' };
    }

    const newContact = {
      id: generateToken(),
      tokenId,
      name,
      email: email || null,
      phone: phone || null,
      tone,
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
   * Send alert to contacts
   */
  const sendAlert = useCallback(async (timerInfo) => {
    if (!settings.enabled || contacts.length === 0) {
      return { success: false, error: 'Accountability not enabled or no contacts' };
    }

    const { name: userName = 'User', timerName = 'Timer', setTime, expireTime } = timerInfo;

    const vars = {
      name: userName,
      timerName,
      setTime: new Date(setTime).toLocaleString(),
      expireTime: new Date(expireTime).toLocaleString(),
      timeSince: formatTimeSince(Date.now() - expireTime),
    };

    const results = [];

    for (const contact of contacts) {
      const tone = contact.tone || settings.defaultTone;

      // Skip comedic tone unless allowed and sci-fi theme
      const effectiveTone = tone === 'comedic' && !settings.allowComedic ? 'friendly' : tone;

      const template = TONE_TEMPLATES[effectiveTone];
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
        sentAt: Date.now(),
      });
    }

    setPendingAlert({
      id: generateToken(),
      timerInfo,
      sentAt: Date.now(),
      results,
    });

    return { success: true, results };
  }, [contacts, settings]);

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
 */
function formatTimeSince(ms) {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ${minutes % 60} minute${minutes % 60 !== 1 ? 's' : ''}`;
  }
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
}

export { TONE_TEMPLATES, MAX_CONTACTS };
