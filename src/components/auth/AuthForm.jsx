'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import useAppStore from '@/store/useAppStore';

// Schemas for validation
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  phone: z.string().min(9, 'Valid phone number is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

/**
 * Reusable AuthForm component.
 * Can toggle between 'login' and 'register' modes.
 * Can be embedded on pages or inside modals.
 *
 * @param {{ defaultMode?: 'login'|'register', onSuccess?: function, redirectTo?: string }} props
 */
export default function AuthForm({ defaultMode = 'login', onSuccess, redirectTo = '/' }) {
  const [mode, setMode] = useState(defaultMode);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { addToast, setUser, setProfile } = useAppStore();
  const supabase = getSupabaseBrowserClient();

  const isLogin = mode === 'login';
  const schema = isLogin ? loginSchema : registerSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      password: '',
    },
  });

  const toggleMode = () => {
    setMode(isLogin ? 'register' : 'login');
    setAuthError('');
    reset();
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    setAuthError('');

    try {
      if (isLogin) {
        // Login
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        
        if (error) throw error;
        
        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', authData.user.id)
          .single();
          console.log({profileData})

        setUser(authData.user);
        if (profileData) setProfile(profileData);

        addToast({ type: 'success', message: 'Welcome back!' });
        if (onSuccess) onSuccess(authData.user);
        else window.location.href = redirectTo;
        
      } else {
        // Register
        const { data: authData, error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              first_name: data.firstName,
              last_name: data.lastName,
              phone: data.phone,
              display_name: `${data.firstName} ${data.lastName}`,
            },
          },
        });

        if (error) throw error;

        // If email confirmation is off, user is logged in. Otherwise, prompt to check email.
        if (authData?.user?.identities?.length === 0) {
          throw new Error('This email is already registered. Please sign in instead.');
        }


        setUser(authData.user);
        addToast({ type: 'success', message: 'Account created successfully!' });
        if (onSuccess) onSuccess(authData.user);
        else window.location.href = redirectTo;
      }
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="tt-card tt-glass" style={{ padding: '2.5rem', width: '100%', maxWidth: '440px', margin: '0 auto' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 className="tt-section-title" style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
          {isLogin ? (
            <>Welcome <span>Back</span></>
          ) : (
            <>Create <span>Account</span></>
          )}
        </h2>
        <p style={{ color: 'var(--tt-muted)', fontSize: '0.9rem' }}>
          {isLogin 
            ? 'Sign in to access your bookings and saved deals.' 
            : 'Join TickToss to book exclusive deals.'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {authError && (
          <div style={{ background: 'rgba(255,45,85,0.1)', color: 'var(--tt-danger)', padding: '0.75rem', borderRadius: 'var(--tt-radius-sm)', border: '1px solid rgba(255,45,85,0.2)', fontSize: '0.85rem' }}>
            {authError}
          </div>
        )}

        {/* Register Fields */}
        {!isLogin && (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label className="tt-label">First Name</label>
              <input type="text" className="tt-input" placeholder="John" {...register('firstName')} />
              {errors.firstName && <span style={{ color: 'var(--tt-danger)', fontSize: '0.75rem' }}>{errors.firstName.message}</span>}
            </div>
            <div style={{ flex: 1 }}>
              <label className="tt-label">Last Name</label>
              <input type="text" className="tt-input" placeholder="Doe" {...register('lastName')} />
              {errors.lastName && <span style={{ color: 'var(--tt-danger)', fontSize: '0.75rem' }}>{errors.lastName.message}</span>}
            </div>
          </div>
        )}

        {!isLogin && (
          <div>
            <label className="tt-label">Phone Number</label>
            <input type="tel" className="tt-input" placeholder="07XX XXX XXX" {...register('phone')} />
            {errors.phone && <span style={{ color: 'var(--tt-danger)', fontSize: '0.75rem' }}>{errors.phone.message}</span>}
          </div>
        )}

        {/* Common Fields */}
        <div>
          <label className="tt-label">Email Address</label>
          <input type="email" className="tt-input" placeholder="you@example.com" {...register('email')} />
          {errors.email && <span style={{ color: 'var(--tt-danger)', fontSize: '0.75rem' }}>{errors.email.message}</span>}
        </div>

        <div>
          <label className="tt-label">Password</label>
          <div style={{ position: 'relative' }}>
            <input 
              type={showPassword ? "text" : "password"} 
              className="tt-input" 
              placeholder="••••••••" 
              {...register('password')} 
              style={{ paddingRight: '2.5rem' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--tt-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0
              }}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              )}
            </button>
          </div>
          {errors.password && <span style={{ color: 'var(--tt-danger)', fontSize: '0.75rem', display: 'block', marginTop: '0.25rem' }}>{errors.password.message}</span>}
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className="tt-btn tt-btn-primary tt-shimmer" 
          style={{ padding: '0.875rem', fontSize: '1rem', marginTop: '0.5rem', opacity: isLoading ? 0.7 : 1 }}
        >
          {isLoading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
        </button>

      </form>

      <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid var(--tt-border)', paddingTop: '1.5rem' }}>
        <p style={{ color: 'var(--tt-muted)', fontSize: '0.9rem' }}>
          {isLogin ? "Don't have an account?" : "Already have an account?"}
        </p>
        <button 
          type="button" 
          onClick={toggleMode}
          style={{ background: 'none', border: 'none', color: 'var(--tt-text)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', marginTop: '0.5rem', borderBottom: '1px solid var(--tt-text)' }}
        >
          {isLogin ? 'Create an account' : 'Sign in instead'}
        </button>
      </div>

    </div>
  );
}
