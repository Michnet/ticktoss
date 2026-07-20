'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useAppStore from '@/store/useAppStore';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import MapInput from '@/components/MapInput';

const storeSchema = z.object({
  business_name: z.string().min(2, 'Business name is required'),
  business_location: z.string().min(5, 'Physical location or district is required'),
  business_whatsapp: z.string().min(7, 'WhatsApp number is required'),
  pickup_lat: z.number().optional().nullable(),
  pickup_lng: z.number().optional().nullable(),
  note: z.string().optional(),
});

/**
 * Shared store details form used both by the vendor application flow
 * (create) and by the "edit store" UI (update). In edit mode, pass
 * `initialData` (the existing tt_store object) and `onSave` — this
 * component then only builds the payload and hands it back rather than
 * calling the application API itself, since editing patches a specific
 * index in profile.tt_stores server-side.
 */
export default function VendorStoreForm({ initialData = null, note = false, onSave, isSaving = false, submitLabel }) {
  const { user, profile, addToast } = useAppStore();
  const isEditMode = !!initialData;

  const [callNumbers, setCallNumbers] = useState(
    initialData?.calls?.length ? initialData.calls : ['']
  );

  const [locations, setLocations] = useState([]);
  const [selectedLocIds, setSelectedLocIds] = useState(initialData?.loc_ids || []);

  useEffect(() => {
    async function fetchLocations() {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.from('locations').select('id, name, parent').order('name');
      if (data) setLocations(data);
    }
    fetchLocations();
  }, []);

  const getLocChildren = (parentId) => locations.filter(l => l.parent === parentId);
  const locDropdownLevels = [getLocChildren(null)];
  for (let i = 0; i < selectedLocIds.length; i++) {
    const children = getLocChildren(selectedLocIds[i]);
    if (children.length > 0) {
      locDropdownLevels.push(children);
    }
  }

  const handleLocationChange = (levelIndex, selectedId) => {
    if (!selectedId) {
      setSelectedLocIds(prev => prev.slice(0, levelIndex));
    } else {
      setSelectedLocIds([...selectedLocIds.slice(0, levelIndex), parseInt(selectedId)]);
    }
  };

  const handleResetLocations = () => setSelectedLocIds([]);

  const initialLat = initialData?.pickup_lat ?? initialData?.lat ?? initialData?.latitude ?? null;
  const initialLng = initialData?.pickup_lng ?? initialData?.lng ?? initialData?.longitude ?? null;

  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(
    initialData?.cover_image ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${initialData.cover_image}` : null
  );
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      business_name: initialData?.name || '',
      business_location: initialData?.address || '',
      business_whatsapp: initialData?.whatsapp?.[0] || profile?.phone || '',
      pickup_lat: initialLat,
      pickup_lng: initialLng,
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
  const [apiError, setApiError] = useState('');

  const onSubmit = async (data) => {
    const validCalls = callNumbers.filter(p => p.trim().length >= 7);
    if (validCalls.length === 0) {
      setApiError('Please add at least one valid call number.');
      return;
    }

    if (selectedLocIds.length === 0) {
      setApiError('Please select a location.');
      return;
    }

    setApiError('');

    // Upload cover image first (if provided)
    const coverImagePath = coverFile ? await uploadCoverImage() : null;
    if (coverFile && !coverImagePath) return; // upload failed, toast already shown

    const ttStore = {
      name: data.business_name,
      calls: validCalls,
      whatsapp: data.business_whatsapp ? [data.business_whatsapp] : [],
      address: data.business_location,
      location: selectedLocIds[selectedLocIds.length - 1],
      loc_ids: selectedLocIds,
      pickup_lat: data.pickup_lat,
      pickup_lng: data.pickup_lng,
      cover_image: coverImagePath || initialData?.cover_image || null,
    };

    await onSave({ store: ttStore, note: data.note });
  };

  return (
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

      {/* Location Hierarchy (used to match your store against products/searches) */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <label className="tt-label" style={{ marginBottom: 0 }}>Service Area</label>
          {selectedLocIds.length > 0 && (
            <button type="button" onClick={handleResetLocations} style={{ fontSize: '0.8rem', color: 'var(--tt-flame)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
              Reset Location
            </button>
          )}
        </div>

        {selectedLocIds.length > 0 && (
          <div style={{ marginBottom: '1rem', padding: '0.8rem', background: 'var(--tt-surface)', borderRadius: 'var(--tt-radius-sm)', border: '1px solid var(--tt-border)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--tt-muted)', display: 'block', marginBottom: '0.3rem' }}>Selected Path:</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
              {selectedLocIds.map((id, idx) => {
                const loc = locations.find(l => l.id === id);
                if (!loc) return null;
                return (
                  <span key={id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--tt-flame)' }}>{loc.name}</span>
                    {idx < selectedLocIds.length - 1 && <span style={{ color: 'var(--tt-muted)' }}>›</span>}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {locDropdownLevels.map((options, index) => (
            <select
              key={`loc-level-${index}`}
              className="tt-input"
              value={selectedLocIds[index] || ''}
              onChange={(e) => handleLocationChange(index, e.target.value)}
            >
              <option value="">-- Select {index === 0 ? 'Region' : 'Sub-location'} --</option>
              {options.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          ))}
        </div>
        {selectedLocIds.length === 0 && <span style={{ color: 'var(--tt-danger)', fontSize: '0.8rem' }}>Please select at least a top-level location</span>}
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

      {/* Note (only shown for the initial vendor application) */}
      {note && (
        <div>
          <label className="tt-label">What types of products do you sell? <span style={{ color: 'var(--tt-muted)', fontWeight: 400 }}>(Optional)</span></label>
          <textarea className="tt-input" rows={3} placeholder="Electronics, Fashion, Groceries..." {...register('note')} />
        </div>
      )}

      <div style={{ marginTop: '1rem' }}>
        <button
          type="submit"
          disabled={isSaving || isUploadingCover}
          className="tt-btn tt-btn-primary tt-shimmer"
          style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', opacity: (isSaving || isUploadingCover) ? 0.7 : 1 }}
        >
          {isUploadingCover ? 'Uploading image...' : isSaving ? 'Saving...' : (submitLabel || (isEditMode ? 'Save Changes' : 'Submit Application'))}
        </button>
      </div>

    </form>
  );
}
