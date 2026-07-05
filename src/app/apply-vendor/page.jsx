'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useAppStore from '@/store/useAppStore';
import AuthForm from '@/components/auth/AuthForm';

const applicationSchema = z.object({
  business_name: z.string().min(2, 'Business name is required'),
  business_phone: z.string().min(9, 'Valid phone number is required'),
  business_location: z.string().min(5, 'Physical location or district is required'),
  note: z.string().optional(),
});

export default function ApplyVendorPage() {
  const { user, profile, addToast } = useAppStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [apiError, setApiError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      business_name: '',
      business_phone: profile?.phone || '',
      business_location: '',
      note: '',
    },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setApiError('');

    try {
      const res = await fetch('/api/vendor/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || 'Failed to submit application');
      }

      setIsSuccess(true);
      addToast({ type: 'success', message: 'Application submitted successfully!' });
    } catch (err) {
      setApiError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Force Login First
  if (!user) {
    return (
      <div className="tt-container" style={{ padding: '4rem 1.5rem', textAlign: 'center', maxWidth: '600px' }}>
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

  // 2. Already a Vendor
  if (profile?.roles?.includes('vendor')) {
    return (
      <div className="tt-container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
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
      <div className="tt-container" style={{ padding: '4rem 1.5rem', textAlign: 'center', maxWidth: '600px' }}>
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
    <div className="tt-container" style={{ padding: '4rem 1.5rem', maxWidth: '600px' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 className="tt-section-title">
          Apply to <span>Sell</span>
        </h1>
        <p style={{ color: 'var(--tt-muted)', marginTop: '0.5rem' }}>
          Reach thousands of local buyers with urgency-driven flash sales.
        </p>
      </div>

      <div className="tt-card tt-glass" style={{ padding: '2.5rem' }}>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {apiError && (
            <div style={{ background: 'rgba(255,45,85,0.1)', color: 'var(--tt-danger)', padding: '1rem', borderRadius: 'var(--tt-radius-sm)', border: '1px solid rgba(255,45,85,0.2)', fontSize: '0.9rem' }}>
              {apiError}
            </div>
          )}

          <div>
            <label className="tt-label">Business Name</label>
            <input type="text" className="tt-input" placeholder="e.g. Kampala Electronics Ltd" {...register('business_name')} />
            {errors.business_name && <span style={{ color: 'var(--tt-danger)', fontSize: '0.8rem' }}>{errors.business_name.message}</span>}
          </div>

          <div>
            <label className="tt-label">Business Phone</label>
            <input type="tel" className="tt-input" placeholder="07XX XXX XXX" {...register('business_phone')} />
            {errors.business_phone && <span style={{ color: 'var(--tt-danger)', fontSize: '0.8rem' }}>{errors.business_phone.message}</span>}
          </div>

          <div>
            <label className="tt-label">Physical Location</label>
            <input type="text" className="tt-input" placeholder="e.g. Oasis Mall, Ground Floor" {...register('business_location')} />
            {errors.business_location && <span style={{ color: 'var(--tt-danger)', fontSize: '0.8rem' }}>{errors.business_location.message}</span>}
          </div>

          <div>
            <label className="tt-label">What types of products do you sell? (Optional)</label>
            <textarea className="tt-input" rows={3} placeholder="Electronics, Fashion, Groceries..." {...register('note')} />
          </div>

          <div style={{ marginTop: '1rem' }}>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="tt-btn tt-btn-primary tt-shimmer" 
              style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', opacity: isSubmitting ? 0.7 : 1 }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
