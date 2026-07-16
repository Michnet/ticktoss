'use client';

import useAppStore from '@/store/useAppStore';

export default function MyStores() {
  const { profile } = useAppStore();
  const stores = profile?.tt_stores || [];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="tt-section-title" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>My <span>Stores</span></h1>
          <p style={{ color: 'var(--tt-muted)' }}>Manage the business locations associated with your vendor account.</p>
        </div>
      </div>

      {stores.length === 0 ? (
        <div className="tt-card tt-glass" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>🏬</div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontFamily: 'Syne', fontWeight: 700 }}>No Stores Found</h3>
          <p style={{ color: 'var(--tt-muted)', marginBottom: '1.5rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
            It looks like you don't have any stores linked to your account yet. Apply to become a vendor or contact support to add a store.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {stores.map((store, idx) => (
            <div key={idx} className="tt-card tt-glass" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {store.cover_image ? (
                <div style={{ height: '140px', background: 'var(--tt-surface-2)', position: 'relative' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${store.cover_image}`} 
                    alt={store.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                  />
                  <div style={{ display: 'none', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', background: 'var(--tt-surface-2)' }}>
                    <span style={{ fontSize: '2rem', opacity: 0.2 }}>🏬</span>
                  </div>
                </div>
              ) : (
                <div style={{ height: '140px', background: 'var(--tt-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '3rem', opacity: 0.2 }}>🏬</span>
                </div>
              )}
              
              <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontFamily: 'Syne', fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>{store.name}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--tt-muted)', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <span>📍</span> 
                    {store.address || 'No physical location provided'}
                  </p>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: 'auto' }}>
                  {store.calls && store.calls.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                      <span>📞</span>
                      <span style={{ color: 'var(--tt-text)' }}>{store.calls.join(', ')}</span>
                    </div>
                  )}
                  {store.whatsapp && store.whatsapp.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--tt-success)' }}>💬</span>
                      <span style={{ color: 'var(--tt-text)' }}>{store.whatsapp.join(', ')}</span>
                    </div>
                  )}
                  {(store.lat || store.pickup_lat) && (store.lng || store.pickup_lng) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                      <span style={{ background: 'rgba(255,45,85,0.1)', color: 'var(--tt-flame)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>GPS Configured</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
