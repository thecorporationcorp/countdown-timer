/**
 * PHONE A FRIEND UI COMPONENT
 *
 * Accountability partner management interface.
 * Non-destructive addition to existing UI.
 */

import React, { memo, useState, useCallback } from 'react';
import './PhoneAFriendUI.css';

function PhoneAFriendUI({
  contacts,
  settings,
  maxContacts,
  toneOptions,
  onAddContact,
  onRemoveContact,
  onUpdateContact,
  onUpdateSettings,
  onGetPreview,
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    phone: '',
    tone: settings?.defaultTone || 'friendly',
    consentGiven: false,
  });
  const [previewTone, setPreviewTone] = useState(null);
  const [error, setError] = useState(null);

  const handleAddContact = useCallback(async () => {
    setError(null);

    const result = await onAddContact(newContact);

    if (result.success) {
      setNewContact({
        name: '',
        email: '',
        phone: '',
        tone: settings?.defaultTone || 'friendly',
        consentGiven: false,
      });
      setShowAddForm(false);
    } else {
      setError(result.error);
    }
  }, [newContact, onAddContact, settings?.defaultTone]);

  const handlePreviewTone = useCallback((tone) => {
    if (onGetPreview) {
      const preview = onGetPreview(tone, {
        name: 'John',
        expireTime: new Date().toLocaleString(),
        timeSince: '5 minutes',
        timerName: 'Morning Alarm',
      });
      setPreviewTone({ tone, ...preview });
    }
  }, [onGetPreview]);

  const formatToneName = (tone) => {
    return tone.charAt(0).toUpperCase() + tone.slice(1);
  };

  return (
    <div className="paf-settings">
      <h4>Accountability Partners</h4>

      <div className="paf-setting-row">
        <label className="paf-toggle">
          <input
            type="checkbox"
            checked={settings?.enabled || false}
            onChange={() => onUpdateSettings?.({ enabled: !settings?.enabled })}
          />
          <span className="paf-toggle-slider" />
          <span className="paf-toggle-label">Enable Alerts</span>
        </label>
      </div>

      <p className="paf-description">
        Add trusted contacts who will be notified if you don&apos;t respond to your alarm.
      </p>

      {/* Contact List */}
      <div className="paf-contacts">
        {contacts?.length === 0 ? (
          <p className="paf-no-contacts">No contacts added yet.</p>
        ) : (
          contacts?.map((contact) => (
            <div key={contact.id} className="paf-contact">
              <div className="paf-contact-info">
                <span className="paf-contact-name">{contact.name}</span>
                <span className="paf-contact-method">
                  {contact.email || contact.phone}
                </span>
                <span className="paf-contact-tone">
                  {formatToneName(contact.tone)}
                </span>
              </div>
              <button
                type="button"
                className="paf-remove-btn"
                onClick={() => onRemoveContact?.(contact.id)}
                aria-label={`Remove ${contact.name}`}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add Contact Button/Form */}
      {!showAddForm && contacts?.length < maxContacts && (
        <button
          type="button"
          className="paf-add-btn"
          onClick={() => setShowAddForm(true)}
        >
          + Add Contact
        </button>
      )}

      {showAddForm && (
        <div className="paf-add-form">
          <h5>Add Accountability Partner</h5>

          {error && <p className="paf-error">{error}</p>}

          <div className="paf-form-field">
            <label>Name</label>
            <input
              type="text"
              value={newContact.name}
              onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
              placeholder="Their name"
            />
          </div>

          <div className="paf-form-field">
            <label>Email or Phone</label>
            <input
              type="text"
              value={newContact.email || newContact.phone}
              onChange={(e) => {
                const value = e.target.value;
                if (value.includes('@')) {
                  setNewContact({ ...newContact, email: value, phone: '' });
                } else {
                  setNewContact({ ...newContact, phone: value, email: '' });
                }
              }}
              placeholder="email@example.com or +1234567890"
            />
          </div>

          <div className="paf-form-field">
            <label>Message Tone</label>
            <select
              value={newContact.tone}
              onChange={(e) => setNewContact({ ...newContact, tone: e.target.value })}
            >
              {toneOptions?.filter(t => t !== 'comedic' || settings?.allowComedic).map((tone) => (
                <option key={tone} value={tone}>
                  {formatToneName(tone)}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="paf-preview-btn"
              onClick={() => handlePreviewTone(newContact.tone)}
            >
              Preview
            </button>
          </div>

          <div className="paf-form-field paf-consent">
            <label className="paf-checkbox">
              <input
                type="checkbox"
                checked={newContact.consentGiven}
                onChange={(e) => setNewContact({ ...newContact, consentGiven: e.target.checked })}
              />
              <span>I have permission from this person to add them</span>
            </label>
          </div>

          <div className="paf-form-actions">
            <button
              type="button"
              className="paf-cancel-btn"
              onClick={() => {
                setShowAddForm(false);
                setError(null);
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="paf-submit-btn"
              onClick={handleAddContact}
              disabled={!newContact.name || (!newContact.email && !newContact.phone) || !newContact.consentGiven}
            >
              Add Contact
            </button>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewTone && (
        <div className="paf-preview-overlay" onClick={() => setPreviewTone(null)}>
          <div className="paf-preview-modal" onClick={(e) => e.stopPropagation()}>
            <h5>{formatToneName(previewTone.tone)} Preview</h5>
            <div className="paf-preview-subject">
              <strong>Subject:</strong> {previewTone.subject}
            </div>
            <div className="paf-preview-body">
              <pre>{previewTone.body}</pre>
            </div>
            <button
              type="button"
              className="paf-preview-close"
              onClick={() => setPreviewTone(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(PhoneAFriendUI);
