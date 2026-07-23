'use client';

// One simple address, reused as both the shipping and billing address on
// the order — TickToss doesn't distinguish the two.
import { useState, useEffect, useRef } from 'react';
import { Plus, ArrowLeft, Loader2, Check } from 'lucide-react';
import useAppStore from '@/store/useAppStore';

const BLANK_ADDRESS = { firstName: '', lastName: '', phone: '', address: '', city: '' };

export default function AddressForm({ value, onChange }) {
  const { user, profile, setProfile } = useAppStore();
  const savedAddresses = profile?.shopping_addresses || [];
  const [showNewForm, setShowNewForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // Logged-in users must save a new address before it's used for checkout
  // (so it's there next time) — drafted separately from `value` until then.
  // Guests have no profile to save to, so they edit `value` directly.
  const [draft, setDraft] = useState(BLANK_ADDRESS);
  const userToggledRef = useRef(false);

  useEffect(() => {
    // Profile loads asynchronously after mount — once saved addresses show
    // up, default into picker mode unless the user already toggled the
    // view themselves.
    if (savedAddresses.length > 0 && !userToggledRef.current) {
      setShowNewForm(false);
    }
  }, [savedAddresses.length]);

  const formValue = user ? draft : value;

  const handleField = (field) => (e) => {
    const next = { ...formValue, [field]: e.target.value };
    if (user) {
      setDraft(next);
    } else {
      onChange(next);
    }
  };

  const isSelected = (addr) =>
    value?.address === addr.address && value?.phone === addr.phone && value?.firstName === addr.firstName;

  const goToNewForm = () => {
    userToggledRef.current = true;
    setDraft(BLANK_ADDRESS);
    setShowNewForm(true);
  };

  const backToSelection = () => {
    userToggledRef.current = true;
    setShowNewForm(false);
  };

  const handleSaveAddress = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/profile/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: draft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save address');

      setProfile(data.profile);
      onChange(draft);
      backToSelection();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const isValueComplete = ['firstName', 'lastName', 'phone', 'address', 'city'].every((field) => formValue?.[field]?.trim());

  if (savedAddresses.length > 0 && !showNewForm) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {savedAddresses.map((addr, idx) => (
          <button
            type="button"
            key={idx}
            onClick={() => onChange(addr)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
              textAlign: 'left',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--tt-radius-md)',
              border: `1px solid ${isSelected(addr) ? 'var(--tt-flame)' : 'var(--tt-border)'}`,
              background: isSelected(addr) ? 'rgba(255, 77, 0, 0.08)' : 'var(--tt-surface-2)',
              cursor: 'pointer',
            }}
          >
            <span>
              <span style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem' }}>
                {addr.firstName} {addr.lastName}
              </span>
              <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--tt-muted)' }}>
                {addr.address}, {addr.city}
              </span>
            </span>
            {isSelected(addr) && <Check size={16} style={{ color: 'var(--tt-flame)', flexShrink: 0 }} />}
          </button>
        ))}
        <button
          type="button"
          onClick={goToNewForm}
          className="tt-btn tt-btn-ghost"
          style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
        >
          <Plus size={14} /> Add a new address
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {savedAddresses.length > 0 && (
        <button
          type="button"
          onClick={backToSelection}
          className="tt-btn tt-btn-ghost"
          style={{ alignSelf: 'flex-start', fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
        >
          <ArrowLeft size={14} /> Use a saved address
        </button>
      )}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <input
          className="tt-input"
          placeholder="First name"
          required
          value={formValue.firstName || ''}
          onChange={handleField('firstName')}
        />
        <input
          className="tt-input"
          placeholder="Last name"
          required
          value={formValue.lastName || ''}
          onChange={handleField('lastName')}
        />
      </div>
      <input
        className="tt-input"
        placeholder="Phone number"
        required
        value={formValue.phone || ''}
        onChange={handleField('phone')}
      />
      <input
        className="tt-input"
        placeholder="Address (street, area, landmark)"
        required
        value={formValue.address || ''}
        onChange={handleField('address')}
      />
      <input
        className="tt-input"
        placeholder="City"
        required
        value={formValue.city || ''}
        onChange={handleField('city')}
      />

      {user && (
        <button
          type="button"
          onClick={handleSaveAddress}
          disabled={!isValueComplete || isSaving}
          className="tt-btn tt-btn-primary"
          style={{ fontSize: '0.85rem', alignSelf: 'flex-start' }}
        >
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          {isSaving ? 'Saving...' : 'Save & Use this Address'}
        </button>
      )}
    </div>
  );
}
