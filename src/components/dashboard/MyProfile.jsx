'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import useAppStore from '@/store/useAppStore';
import { Camera, User, Phone, Mail, Save, Loader2 } from 'lucide-react';

export default function MyProfile() {
  const { user, profile, setProfile } = useAppStore();
  const supabase = getSupabaseBrowserClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      first_name: '',
      last_name: '',
      display_name: '',
      phone: '',
    },
  });

  useEffect(() => {
    if (profile) {
      setValue('first_name', profile.first_name || '');
      setValue('last_name', profile.last_name || '');
      setValue('display_name', profile.display_name || '');
      setValue('phone', profile.phone || '');
    }
  }, [profile, setValue]);

  const handleAvatarUpload = async (event) => {
    try {
      const file = event.target.files?.[0];
      if (!file || !user) return;

      setIsUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/profile/${fileName}`;

      // Upload image
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get resizable public URL
      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath, {
          transform: {
            width: 400,
            height: 400,
            resize: 'cover',
          },
        });

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Update local store
      setProfile({ ...profile, avatar: publicUrl });
      alert('Profile photo updated successfully!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Failed to upload profile photo.');
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data) => {
    if (!user) return;
    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile({ ...profile, ...data });
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="tt-card tt-glass" style={{ padding: '2rem' }}>
      <h2 className="tt-section-title" style={{ marginBottom: '0.5rem' }}>My Profile</h2>
      <p style={{ color: 'var(--tt-muted)', marginBottom: '2rem' }}>
        Manage your personal information and preferences.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '600px' }}>
        
        {/* Avatar Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div 
            style={{ 
              width: '100px', 
              height: '100px', 
              borderRadius: '50%', 
              background: 'var(--tt-surface-2)',
              border: '2px solid var(--tt-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            {isUploading ? (
              <Loader2 className="animate-spin text-muted" />
            ) : profile?.avatar ? (
              <img src={profile.avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={40} color="var(--tt-muted)" />
            )}
          </div>
          <div>
            <button 
              className="tt-btn tt-btn-outline" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Camera size={16} />
              Change Photo
            </button>
            <p style={{ fontSize: '0.8rem', color: 'var(--tt-muted)' }}>JPG, GIF or PNG. Max size of 2MB.</p>
            <input 
              type="file" 
              accept="image/*" 
              style={{ display: 'none' }} 
              ref={fileInputRef}
              onChange={handleAvatarUpload}
            />
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--tt-text)', fontWeight: 600 }}>First Name</label>
              <input
                type="text"
                className="tt-input"
                placeholder="John"
                {...register('first_name')}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--tt-text)', fontWeight: 600 }}>Last Name</label>
              <input
                type="text"
                className="tt-input"
                placeholder="Doe"
                {...register('last_name')}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--tt-text)', fontWeight: 600 }}>Display Name</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--tt-muted)' }} />
              <input
                type="text"
                className="tt-input"
                placeholder="johndoe"
                style={{ paddingLeft: '2.5rem' }}
                {...register('display_name')}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--tt-text)', fontWeight: 600 }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--tt-muted)' }} />
              <input
                type="email"
                className="tt-input"
                value={profile?.email || user?.email || ''}
                disabled
                style={{ paddingLeft: '2.5rem', opacity: 0.7, cursor: 'not-allowed' }}
              />
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--tt-muted)', marginTop: '0.4rem' }}>Email cannot be changed directly.</p>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--tt-text)', fontWeight: 600 }}>Phone Number</label>
            <div style={{ position: 'relative' }}>
              <Phone size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--tt-muted)' }} />
              <input
                type="tel"
                className="tt-input"
                placeholder="+256 700 000 000"
                style={{ paddingLeft: '2.5rem' }}
                {...register('phone')}
              />
            </div>
          </div>

          <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--tt-border)' }}>
            <button 
              type="submit" 
              className="tt-btn tt-btn-primary" 
              disabled={isLoading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {isLoading ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
