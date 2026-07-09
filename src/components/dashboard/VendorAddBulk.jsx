'use client';

import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/localDb';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import useAppStore from '@/store/useAppStore';
import { computeUrgencyScore } from '@/lib/urgency';

export default function VendorAddBulk() {
  const [activeTab, setActiveTab] = useState('url');
  const [isExtracting, setIsExtracting] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [csvInput, setCsvInput] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  
  const { user, addToast } = useAppStore();
  const supabase = getSupabaseBrowserClient();
  
  const draftProducts = useLiveQuery(() => db.draftProducts.toArray());
  const [editingProduct, setEditingProduct] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);

  const handleExtract = async () => {
    setIsExtracting(true);
    try {
      const formData = new FormData();
      formData.append('type', activeTab);
      
      if (activeTab === 'url') formData.append('payload', urlInput);
      else if (activeTab === 'csv') formData.append('payload', csvInput);
      else if (activeTab === 'pdf') {
        if (!pdfFile) throw new Error("Please select a PDF file");
        formData.append('file', pdfFile);
      }

      const res = await fetch('/api/vendor/products/extract', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to extract");

      // Save to IndexedDB
      const toInsert = data.products.map(p => ({
        ...p,
        status: 'draft',
        user_id: user.id
      }));
      await db.draftProducts.bulkAdd(toInsert);
      addToast({ type: 'success', message: `Extracted ${data.products.length} products.` });
      
      // Clear inputs
      setUrlInput('');
      setCsvInput('');
      setPdfFile(null);
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', message: err.message });
    } finally {
      setIsExtracting(false);
    }
  };

  const isProductValid = (p) => {
    return p.name && p.price > 0 && p.sale_price > 0 && p.sale_price < p.price && p.stock > 0 && p.duration_hours > 0 && p.pickup_lat && p.pickup_lng;
  };

  const handlePublishAllReady = async () => {
    if (!draftProducts) return;
    const readyProducts = draftProducts.filter(isProductValid);
    if (readyProducts.length === 0) {
      addToast({ type: 'error', message: "No fully valid products to publish." });
      return;
    }

    setIsPublishing(true);
    try {
      const payload = readyProducts.map(p => {
        const discountPct = ((p.price - p.sale_price) / p.price) * 100;
        const urgency_score = computeUrgencyScore({
          discount_pct: discountPct,
          hours_remaining: p.duration_hours,
          stock: p.stock
        });

        const sale_end_date = new Date();
        sale_end_date.setHours(sale_end_date.getHours() + p.duration_hours);

        return {
          name: p.name,
          short_description: p.short_description,
          price: p.price,
          sale_price: p.sale_price,
          stock: p.stock,
          duration_hours: p.duration_hours,
          discount_pct: discountPct,
          urgency_score: urgency_score,
          pickup_address: p.pickup_address,
          pickup_lat: p.pickup_lat,
          pickup_lng: p.pickup_lng,
          user_id: user.id,
          sale_end_date: sale_end_date.toISOString(),
          status: 'published'
        };
      });

      const { error } = await supabase.from('products').insert(payload);
      if (error) throw error;

      // Delete published ones from IndexedDB
      const readyIds = readyProducts.map(p => p.id);
      await db.draftProducts.bulkDelete(readyIds);

      addToast({ type: 'success', message: `Successfully published ${readyIds.length} deals!` });
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', message: "Failed to publish: " + err.message });
    } finally {
      setIsPublishing(false);
    }
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    await db.draftProducts.update(editingProduct.id, editingProduct);
    setEditingProduct(null);
    addToast({ type: 'success', message: 'Draft updated' });
  };

  const deleteDraft = async (id) => {
    await db.draftProducts.delete(id);
  };

  const captureGlobalLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          if (!draftProducts) return;
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const updates = draftProducts.map(p => ({ ...p, pickup_lat: lat, pickup_lng: lng }));
          await db.draftProducts.bulkPut(updates);
          addToast({ type: 'success', message: 'Location applied to all drafts' });
        },
        (err) => addToast({ type: 'error', message: 'Failed to get location' })
      );
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="tt-section-title" style={{ fontSize: '2rem' }}>Bulk Add <span>(AI)</span></h1>
        <p style={{ color: 'var(--tt-muted)' }}>Paste a URL, upload a PDF, or paste CSV data. AI will extract the products for you to review.</p>
      </div>

      {/* Import Section */}
      <div className="tt-card tt-glass" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--tt-border)', paddingBottom: '1rem' }}>
          {['url', 'pdf', 'csv'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? 'var(--tt-surface-2)' : 'transparent',
                color: activeTab === tab ? 'var(--tt-gold)' : 'var(--tt-text)',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: 'var(--tt-radius-sm)',
                cursor: 'pointer',
                fontWeight: activeTab === tab ? 600 : 400
              }}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          {activeTab === 'url' && (
            <input 
              type="url" 
              placeholder="https://example-store.com/products" 
              className="tt-input" 
              value={urlInput} 
              onChange={e => setUrlInput(e.target.value)} 
            />
          )}
          {activeTab === 'csv' && (
            <textarea 
              rows={4} 
              placeholder="Paste CSV text here..." 
              className="tt-input" 
              value={csvInput} 
              onChange={e => setCsvInput(e.target.value)} 
            />
          )}
          {activeTab === 'pdf' && (
            <input 
              type="file" 
              accept=".pdf" 
              className="tt-input" 
              onChange={e => setPdfFile(e.target.files[0])} 
            />
          )}
        </div>

        <button 
          onClick={handleExtract} 
          disabled={isExtracting || (activeTab === 'url' && !urlInput) || (activeTab === 'csv' && !csvInput) || (activeTab === 'pdf' && !pdfFile)}
          className="tt-btn tt-btn-primary tt-shimmer"
        >
          {isExtracting ? 'Extracting with AI...' : 'Extract Products'}
        </button>
      </div>

      {/* Sandbox Workspace */}
      <div className="tt-card tt-glass" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontFamily: 'Syne' }}>Draft Sandbox</h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={captureGlobalLocation} className="tt-btn tt-btn-ghost" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              📍 Set Location For All
            </button>
            <button 
              onClick={handlePublishAllReady} 
              disabled={isPublishing || !draftProducts?.some(isProductValid)}
              className="tt-btn tt-btn-primary tt-shimmer" 
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            >
              {isPublishing ? 'Publishing...' : 'Publish Ready Items'}
            </button>
          </div>
        </div>

        {draftProducts?.length === 0 ? (
          <p style={{ color: 'var(--tt-muted)', textAlign: 'center', padding: '2rem 0' }}>No drafts yet. Extract some above.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--tt-border)', color: 'var(--tt-muted)' }}>
                  <th style={{ textAlign: 'left', padding: '1rem 0.5rem' }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '1rem 0.5rem' }}>Original Price</th>
                  <th style={{ textAlign: 'left', padding: '1rem 0.5rem' }}>Sale Price</th>
                  <th style={{ textAlign: 'left', padding: '1rem 0.5rem' }}>Stock</th>
                  <th style={{ textAlign: 'left', padding: '1rem 0.5rem' }}>Location</th>
                  <th style={{ textAlign: 'right', padding: '1rem 0.5rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {draftProducts?.map(p => {
                  const isValid = isProductValid(p);
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: isValid ? 'transparent' : 'rgba(255, 45, 85, 0.05)' }}>
                      <td style={{ padding: '1rem 0.5rem' }}>
                        <div style={{ fontWeight: 600 }}>{p.name || <span style={{ color: 'var(--tt-danger)' }}>Missing</span>}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--tt-muted)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.short_description}</div>
                      </td>
                      <td style={{ padding: '1rem 0.5rem', color: !p.price ? 'var(--tt-danger)' : 'inherit' }}>{p.price || 'Missing'}</td>
                      <td style={{ padding: '1rem 0.5rem', color: (!p.sale_price || p.sale_price >= p.price) ? 'var(--tt-danger)' : 'inherit' }}>{p.sale_price || 'Missing'}</td>
                      <td style={{ padding: '1rem 0.5rem', color: !p.stock ? 'var(--tt-danger)' : 'inherit' }}>{p.stock || 'Missing'}</td>
                      <td style={{ padding: '1rem 0.5rem', color: (!p.pickup_lat || !p.pickup_lng) ? 'var(--tt-danger)' : 'inherit' }}>
                        {p.pickup_lat ? 'Set' : 'Missing'}
                      </td>
                      <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                        <button onClick={() => setEditingProduct(p)} className="tt-btn tt-btn-ghost" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', marginRight: '0.5rem' }}>Edit</button>
                        <button onClick={() => deleteDraft(p.id)} style={{ background: 'none', border: 'none', color: 'var(--tt-danger)', cursor: 'pointer' }}>×</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingProduct && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={saveEdit} className="tt-card tt-glass" style={{ padding: '2rem', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', fontFamily: 'Syne' }}>Edit Draft Product</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="tt-label">Name</label>
                <input className="tt-input" value={editingProduct.name || ''} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} required />
              </div>
              <div>
                <label className="tt-label">Description</label>
                <textarea className="tt-input" rows={2} value={editingProduct.short_description || ''} onChange={e => setEditingProduct({...editingProduct, short_description: e.target.value})} required />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="tt-label">Original Price</label>
                  <input type="number" className="tt-input" value={editingProduct.price || ''} onChange={e => setEditingProduct({...editingProduct, price: Number(e.target.value)})} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="tt-label">Sale Price</label>
                  <input type="number" className="tt-input" value={editingProduct.sale_price || ''} onChange={e => setEditingProduct({...editingProduct, sale_price: Number(e.target.value)})} required />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="tt-label">Stock</label>
                  <input type="number" className="tt-input" value={editingProduct.stock || ''} onChange={e => setEditingProduct({...editingProduct, stock: Number(e.target.value)})} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="tt-label">Duration (Hours)</label>
                  <input type="number" className="tt-input" value={editingProduct.duration_hours || ''} onChange={e => setEditingProduct({...editingProduct, duration_hours: Number(e.target.value)})} required />
                </div>
              </div>
              <div>
                <label className="tt-label">Pickup Address</label>
                <input className="tt-input" value={editingProduct.pickup_address || ''} onChange={e => setEditingProduct({...editingProduct, pickup_address: e.target.value})} required />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setEditingProduct(null)} className="tt-btn tt-btn-ghost" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="tt-btn tt-btn-primary tt-shimmer" style={{ flex: 1 }}>Save Draft</button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
