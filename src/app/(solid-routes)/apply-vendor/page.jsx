'use client';

import { useState } from 'react';
import useAppStore from '@/store/useAppStore';
import AuthForm from '@/components/auth/AuthForm';
import VendorStoreForm from '@/components/vendor/VendorStoreForm';

export default function ApplyVendorPage() {
  const { user, profile, addToast } = useAppStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSave = async ({ store, note }) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/vendors/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meta: { tt_store: store },
          note,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to submit application');
      }

      setIsSuccess(true);
      addToast({ type: 'success', message: 'Application submitted successfully!' });
    } catch (err) {
      addToast({ type: 'error', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Guards ─────────────────────────────────────────────────────────────────

  // 1. Force Login First
  if (!user) {
    return (
      <div className="tt-container tt-container-padding" style={{ padding: '4rem 1.5rem', textAlign: 'center', maxWidth: '600px' }}>
        <h1 className="tt-section-title" style={{ marginBottom: '1.5rem' }}>
          Become a <span>Vendor</span>
        </h1>
        <p style={{ color: 'var(--tt-muted)', marginBottom: '3rem' }}>
          You must have a TickToss account to apply as a vendor. Please sign in or create an account first.
        </p>
        <AuthForm defaultMode="register" redirectTo="/apply-vendor" />
      </div>
    );
  }

  // 2. Already a Vendor (tt_vendor role)
  if (profile?.roles?.includes('tt_vendor')) {
    return (
      <div className="tt-container tt-container-padding" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h1 className="tt-section-title">You are already a <span>Vendor!</span></h1>
        <p style={{ color: 'var(--tt-muted)', marginTop: '1rem', marginBottom: '2rem' }}>
          Your vendor account is fully active. Start posting deals!
        </p>
        <button onClick={() => window.location.href = '/vendor'} className="tt-btn tt-btn-primary tt-shimmer">
          Go to Vendor Dashboard
        </button>
      </div>
    );
  }

  // 3. Application Success State
  if (isSuccess) {
    return (
      <div className="tt-container tt-container-padding" style={{ padding: '4rem 1.5rem', textAlign: 'center', maxWidth: '600px' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
        <h1 className="tt-section-title">Application <span>Received</span></h1>
        <p style={{ color: 'var(--tt-muted-2)', marginTop: '1rem', fontSize: '1.1rem', lineHeight: 1.6 }}>
          Thank you for applying to sell on TickToss! Our team will review your business details and activate your vendor dashboard shortly.
        </p>
        <button onClick={() => window.location.href = '/'} className="tt-btn tt-btn-ghost" style={{ marginTop: '2rem' }}>
          Return to Homepage
        </button>
      </div>
    );
  }

  // 4. Application Form
  return (
    <div className="tt-container tt-container-padding" style={{ padding: '4rem 1.5rem', maxWidth: '600px' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 className="tt-section-title">
          Apply to <span>Sell</span>
        </h1>
        <p style={{ color: 'var(--tt-muted)', marginTop: '0.5rem' }}>
          Reach thousands of local buyers with urgency-driven flash sales.
        </p>
      </div>

      <div className="tt-card tt-glass" style={{ padding: '2.5rem' }}>
        <VendorStoreForm
          note
          onSave={handleSave}
          isSaving={isSubmitting}
          submitLabel="Submit Application"
        />
      </div>
    </div>
  );
}
