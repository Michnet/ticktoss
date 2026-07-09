'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useAppStore from '@/store/useAppStore';
import AuthForm from '@/components/auth/AuthForm';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import MapInput from '@/components/MapInput';

const applicationSchema = z.object({
  business_name: z.string().min(2, 'Business name is required'),
  business_location: z.string().min(5, 'Physical location or district is required'),
  business_whatsapp: z.string().min(7, 'WhatsApp number is required'),
  pickup_lat: z.number().optional().nullable(),
  pickup_lng: z.number().optional().nullable(),
  note: z.string().optional(),
});

export default function ApplyVendorPage() {
  const { user, profile, addToast } = useAppStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [apiError, setApiError] = useState('');

  // Multiple call numbers (dynamic list)
  const [callNumbers, setCallNumbers] = useState(['']);

  // Cover image upload state
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      business_name: '',
      business_location: '',
      business_whatsapp: profile?.phone || '',
      pickup_lat: null,
      pickup_lng: null,
      note: '',
    },
  });

  // ── Phone list helpers ─────────────────────────────────────────────────────
  const addPhone = () => setCallNumbers(prev => [...prev, '']);
  const removePhone = (idx) => setCallNumbers(prev => prev.filter((_, i) => i !== idx));
  const updatePhone = (idx, val) =>
    setCallNumbers(prev => prev.map((p, i) => (i === idx ? val : p)));

  // ── Cover image helpers ────────────────────────────────────────────────────
  const handleCoverChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const uploadCoverImage = async () => {
    if (!coverFile || !user) return null;
    setIsUploadingCover(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const ext = coverFile.name.split('.').pop();
      const fileId = `cover_${Date.now()}.${ext}`;
      const filePath = `${user.id}/${fileId}`;

      const { error } = await supabase.storage
        .from('uploads')
        .upload(filePath, coverFile, { upsert: true });

      if (error) throw error;
      // Return the path that resizedImage() understands (relative to uploads bucket)
      return filePath;
    } catch (err) {
      console.error('Cover image upload failed:', err);
      addToast({ type: 'error', message: 'Failed to upload cover image.' });
      return null;
    } finally {
      setIsUploadingCover(false);
    }
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    const validCalls = callNumbers.filter(p => p.trim().length >= 7);
    if (validCalls.length === 0) {
      setApiError('Please add at least one valid call number.');
      return;
    }

    setIsSubmitting(true);
    setApiError('');

    try {
      // Upload cover image first (if provided)
      const coverImagePath = coverFile ? await uploadCoverImage() : null;

      const ttStore = {
        name: data.business_name,
        calls: validCalls,
        whatsapp: data.business_whatsapp ? [data.business_whatsapp] : [],
        location: data.business_location,
        pickup_lat: data.pickup_lat,
        pickup_lng: data.pickup_lng,
        ...(coverImagePath ? { cover_image: coverImagePath } : {}),
      };

      const res = await fetch('/api/vendor/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meta: { tt_store: ttStore },
          note: data.note,
        }),
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

  // ── Guards ─────────────────────────────────────────────────────────────────

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

  // 2. Already a Vendor (tt_vendor role)
  if (profile?.roles?.includes('tt_vendor')) {
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

          {/* Business Name */}
          <div>
            <label className="tt-label">Business Name</label>
            <input type="text" className="tt-input" placeholder="e.g. Kampala Electronics Ltd" {...register('business_name')} />
            {errors.business_name && <span style={{ color: 'var(--tt-danger)', fontSize: '0.8rem' }}>{errors.business_name.message}</span>}
          </div>

          {/* Call Numbers (dynamic list) */}
          <div>
            <label className="tt-label">Call Numbers</label>
            <p style={{ color: 'var(--tt-muted)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
              Add all numbers customers can call for your business.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {callNumbers.map((phone, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="tel"
                    className="tt-input"
                    placeholder="07XX XXX XXX"
                    value={phone}
                    onChange={(e) => updatePhone(idx, e.target.value)}
                    style={{ flex: 1 }}
                  />
                  {callNumbers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePhone(idx)}
                      style={{
                        background: 'rgba(255,45,85,0.1)',
                        color: 'var(--tt-danger)',
                        border: '1px solid rgba(255,45,85,0.2)',
                        borderRadius: 'var(--tt-radius-sm)',
                        padding: '0.4rem 0.7rem',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        lineHeight: 1,
                      }}
                      aria-label="Remove number"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addPhone}
              className="tt-btn tt-btn-ghost"
              style={{ marginTop: '0.5rem', padding: '0.4rem 1rem', fontSize: '0.85rem' }}
            >
              + Add another number
            </button>
          </div>

          {/* WhatsApp */}
          <div>
            <label className="tt-label">WhatsApp Number</label>
            <input type="tel" className="tt-input" placeholder="e.g. +256700000000" {...register('business_whatsapp')} />
            {errors.business_whatsapp && <span style={{ color: 'var(--tt-danger)', fontSize: '0.8rem' }}>{errors.business_whatsapp.message}</span>}
          </div>

          {/* Physical Location with Map */}
          <div>
            <label className="tt-label">Physical Location</label>
            <MapInput watch={watch} setValue={setValue} />
            <input type="hidden" {...register('business_location')} />
            {errors.business_location && <span style={{ color: 'var(--tt-danger)', fontSize: '0.8rem' }}>{errors.business_location.message}</span>}
          </div>

          {/* Cover Image */}
          <div>
            <label className="tt-label">Store Cover Image <span style={{ color: 'var(--tt-muted)', fontWeight: 400 }}>(Optional)</span></label>
            <p style={{ color: 'var(--tt-muted)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
              A banner image shown on your store profile.
            </p>
            {coverPreview && (
              <div style={{ marginBottom: '0.75rem', borderRadius: 'var(--tt-radius-sm)', overflow: 'hidden', maxHeight: '160px' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverPreview} alt="Cover preview" style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="tt-input"
              style={{ padding: '0.5rem' }}
              onChange={handleCoverChange}
            />
          </div>

          {/* Note */}
          <div>
            <label className="tt-label">What types of products do you sell? <span style={{ color: 'var(--tt-muted)', fontWeight: 400 }}>(Optional)</span></label>
            <textarea className="tt-input" rows={3} placeholder="Electronics, Fashion, Groceries..." {...register('note')} />
          </div>

          <div style={{ marginTop: '1rem' }}>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingCover}
              className="tt-btn tt-btn-primary tt-shimmer"
              style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', opacity: (isSubmitting || isUploadingCover) ? 0.7 : 1 }}
            >
              {isUploadingCover ? 'Uploading image...' : isSubmitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
