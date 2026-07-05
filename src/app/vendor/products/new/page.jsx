'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import useAppStore from '@/store/useAppStore';
import { computeUrgencyScore } from '@/lib/urgency';

const productSchema = z.object({
  name: z.string().min(5, 'Product name is too short'),
  short_description: z.string().min(10, 'Provide a brief description'),
  price: z.number().min(1000, 'Original price must be valid'),
  sale_price: z.number().min(1000, 'Sale price must be valid'),
  stock: z.number().min(1, 'Must have at least 1 in stock'),
  duration_hours: z.number().min(1).max(72, 'Flash sales can only last up to 72 hours'),
  pickup_address: z.string().min(5, 'Pickup address is required'),
  pickup_lat: z.number({ required_error: 'Please capture your location' }),
  pickup_lng: z.number({ required_error: 'Please capture your location' }),
}).refine(data => data.sale_price < data.price, {
  message: "Sale price must be lower than the original price",
  path: ['sale_price'],
}).refine(data => {
  const discountPct = ((data.price - data.sale_price) / data.price) * 100;
  return discountPct >= 5; // Enforce at least 5% discount
}, {
  message: "TickToss deals require a minimum 5% discount.",
  path: ['sale_price'],
});

export default function NewProductPage() {
  const { user, addToast } = useAppStore();
  const supabase = getSupabaseBrowserClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      short_description: '',
      price: '',
      sale_price: '',
      stock: 1,
      duration_hours: 24, // Default 24 hours
      pickup_address: '',
      pickup_lat: null,
      pickup_lng: null,
    },
  });

  const watchPrice = watch('price');
  const watchSalePrice = watch('sale_price');
  const watchDuration = watch('duration_hours');
  const watchStock = watch('stock');

  // Real-time calculation of discount and urgency score
  const originalPrice = Number(watchPrice) || 0;
  const salePrice = Number(watchSalePrice) || 0;
  const discountPct = originalPrice > 0 ? ((originalPrice - salePrice) / originalPrice) * 100 : 0;
  
  const estimatedScore = computeUrgencyScore({
    discount_pct: discountPct,
    hours_remaining: Number(watchDuration) || 24,
    stock: Number(watchStock) || 1
  });

  let urgencyLevel = 'low';
  if (estimatedScore >= 80) urgencyLevel = 'critical';
  else if (estimatedScore >= 50) urgencyLevel = 'high';
  else if (estimatedScore >= 20) urgencyLevel = 'medium';

  const onSubmit = async (data) => {
    if (!data.pickup_lat || !data.pickup_lng) {
      addToast({ type: 'error', message: 'Please set your pickup location using the button below.' });
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Calculate sale_end_date based on duration
      const sale_end_date = new Date();
      sale_end_date.setHours(sale_end_date.getHours() + data.duration_hours);

      const payload = {
        name: data.name,
        short_description: data.short_description,
        price: data.price,
        sale_price: data.sale_price,
        stock: data.stock,
        discount_pct: discountPct,
        sale_end_date: sale_end_date.toISOString(),
        vendor_id: user.id,
        urgency_score: estimatedScore,
        pickup_address: data.pickup_address,
        pickup_lat: data.pickup_lat,
        pickup_lng: data.pickup_lng,
        status: 'published' // Publish immediately for MVP
      };

      const { error } = await supabase.from('products').insert([payload]);
      
      if (error) throw error;
      
      setSuccess(true);
      addToast({ type: 'success', message: 'Deal posted successfully!' });
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', message: err.message || 'Failed to post deal' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="tt-card tt-glass" style={{ padding: '3rem', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔥</div>
        <h2 className="tt-section-title" style={{ marginBottom: '1rem' }}>Deal is <span>Live!</span></h2>
        <p style={{ color: 'var(--tt-muted)', marginBottom: '2rem' }}>
          Your urgency score is {estimatedScore.toFixed(0)}. Buyers will see it immediately.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button onClick={() => window.location.href = '/vendor/products'} className="tt-btn tt-btn-ghost">View My Deals</button>
          <button onClick={() => window.location.reload()} className="tt-btn tt-btn-primary tt-shimmer">Post Another</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="tt-section-title" style={{ fontSize: '2rem' }}>Post a <span>Deal</span></h1>
        <p style={{ color: 'var(--tt-muted)' }}>Set aggressive discounts and short timeframes to rank higher on the homepage.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem', alignItems: 'start' }}>
        
        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="tt-card tt-glass" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div>
            <label className="tt-label">Product Name</label>
            <input type="text" className="tt-input" placeholder="e.g. Samsung Galaxy S23 Ultra" {...register('name')} />
            {errors.name && <span style={{ color: 'var(--tt-danger)', fontSize: '0.8rem' }}>{errors.name.message}</span>}
          </div>

          <div>
            <label className="tt-label">Short Description</label>
            <textarea className="tt-input" rows={3} placeholder="Brief details about the condition and items included." {...register('short_description')} />
            {errors.short_description && <span style={{ color: 'var(--tt-danger)', fontSize: '0.8rem' }}>{errors.short_description.message}</span>}
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label className="tt-label">Original Price (UGX)</label>
              <input type="number" className="tt-input" {...register('price', { valueAsNumber: true })} />
              {errors.price && <span style={{ color: 'var(--tt-danger)', fontSize: '0.8rem' }}>{errors.price.message}</span>}
            </div>
            <div style={{ flex: 1 }}>
              <label className="tt-label">Sale Price (UGX)</label>
              <input type="number" className="tt-input" {...register('sale_price', { valueAsNumber: true })} />
              {errors.sale_price && <span style={{ color: 'var(--tt-danger)', fontSize: '0.8rem' }}>{errors.sale_price.message}</span>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label className="tt-label">Stock Available</label>
              <input type="number" className="tt-input" {...register('stock', { valueAsNumber: true })} />
              {errors.stock && <span style={{ color: 'var(--tt-danger)', fontSize: '0.8rem' }}>{errors.stock.message}</span>}
            </div>
            <div style={{ flex: 1 }}>
              <label className="tt-label">Flash Sale Duration (Hours)</label>
              <input type="number" className="tt-input" max={72} {...register('duration_hours', { valueAsNumber: true })} />
              {errors.duration_hours && <span style={{ color: 'var(--tt-danger)', fontSize: '0.8rem' }}>{errors.duration_hours.message}</span>}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--tt-surface-2)', padding: '1.5rem', borderRadius: 'var(--tt-radius-sm)', border: '1px solid var(--tt-border)' }}>
            <h3 style={{ fontSize: '1.1rem', fontFamily: 'Syne', color: 'var(--tt-gold)' }}>Pickup Location</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--tt-muted)' }}>Buyers will use this location to see how close this deal is to them in the "Near Me" section.</p>
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label className="tt-label">Pickup Address Instructions</label>
                <input type="text" className="tt-input" placeholder="e.g. Shop 4B, Oasis Mall" {...register('pickup_address')} />
                {errors.pickup_address && <span style={{ color: 'var(--tt-danger)', fontSize: '0.8rem' }}>{errors.pickup_address.message}</span>}
              </div>
              
              <button 
                type="button" 
                className="tt-btn tt-btn-ghost"
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        setValue('pickup_lat', pos.coords.latitude, { shouldValidate: true });
                        setValue('pickup_lng', pos.coords.longitude, { shouldValidate: true });
                        addToast({ type: 'success', message: 'Location captured successfully!' });
                      },
                      (err) => addToast({ type: 'error', message: 'Failed to get location. Please check browser permissions.' })
                    );
                  }
                }}
                style={{ padding: '0.65rem 1rem', whiteSpace: 'nowrap' }}
              >
                📍 Use Current GPS
              </button>
            </div>
            {(errors.pickup_lat || errors.pickup_lng) && <span style={{ color: 'var(--tt-danger)', fontSize: '0.8rem' }}>Please click "Use Current GPS" to capture coordinates.</span>}
          </div>

          <div style={{ borderTop: '1px solid var(--tt-border)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="tt-btn tt-btn-primary tt-shimmer" 
              style={{ width: '100%', padding: '1rem' }}
            >
              {isSubmitting ? 'Posting...' : 'Publish Deal Now'}
            </button>
          </div>

        </form>

        {/* Urgency Predictor Sidebar */}
        <div className="tt-card tt-glass" style={{ padding: '1.5rem', position: 'sticky', top: 'var(--tt-nav-height)' }}>
          <h3 style={{ fontFamily: 'Syne', fontSize: '1.1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--tt-border)', paddingBottom: '0.5rem' }}>
            Algorithm Predictor
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--tt-muted)' }}>Discount:</span>
              <span style={{ fontWeight: 600, color: discountPct > 20 ? 'var(--tt-success)' : 'var(--tt-text)' }}>
                {discountPct > 0 ? `${discountPct.toFixed(1)}%` : '0%'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--tt-muted)' }}>Scarcity:</span>
              <span style={{ fontWeight: 600, color: (watchStock > 0 && watchStock <= 5) ? 'var(--tt-flame)' : 'var(--tt-text)' }}>
                {watchStock || 0} left
              </span>
            </div>
          </div>

          <div style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--tt-surface-2)', borderRadius: 'var(--tt-radius-md)' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--tt-muted)', marginBottom: '0.5rem' }}>Estimated Score</p>
            <p style={{ fontFamily: 'Syne', fontSize: '3rem', fontWeight: 800, color: `var(--tt-${urgencyLevel === 'critical' ? 'danger' : urgencyLevel === 'high' ? 'flame' : urgencyLevel === 'medium' ? 'gold' : 'success'})`, lineHeight: 1 }}>
              {estimatedScore > 0 ? estimatedScore.toFixed(0) : '0'}
            </p>
            <div style={{ marginTop: '1rem', height: '4px', background: 'var(--tt-border)', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(100, estimatedScore)}%`, background: `var(--tt-${urgencyLevel === 'critical' ? 'danger' : urgencyLevel === 'high' ? 'flame' : urgencyLevel === 'medium' ? 'gold' : 'success'})`, transition: 'width 0.3s' }} />
            </div>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--tt-muted)', marginTop: '1rem', textAlign: 'center' }}>
            Higher scores rank first on the homepage. Decrease duration or stock to boost your score!
          </p>
        </div>

      </div>
    </div>
  );
}
