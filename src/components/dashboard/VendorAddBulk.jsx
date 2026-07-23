'use client';

import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/localDb';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import useAppStore from '@/store/useAppStore';
import { computeUrgencyScore, computeDiscountPct } from '@/lib/urgency';
import { resizedImage } from '@/helpers/universal';
import { generateBlurhash } from '@/helpers/blurhash';
import { isAdmin } from '@/lib/roles';
import MediaLibraryModal from './MediaLibraryModal';

const TABS = ['url', 'pdf', 'csv', 'excel', 'import'];

// Only the fields that make sense to edit in a fast, excel-like grid live
// here. Anything requiring a richer picker (tags, attributes/variations,
// long description, gallery) is deliberately left for the vendor to add
// afterwards in the single-product form.
export default function VendorAddBulk() {
  const [activeTab, setActiveTab] = useState('url');
  const [isExtracting, setIsExtracting] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [csvInput, setCsvInput] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [excelFile, setExcelFile] = useState(null);
  const [importUrl, setImportUrl] = useState('');
  const [importCursor, setImportCursor] = useState(null);
  const [importPriceMode, setImportPriceMode] = useState('price');

  const { user, profile, addToast } = useAppStore();
  const supabase = getSupabaseBrowserClient();
  const userIsAdmin = isAdmin(user);

  // An admin may also be a vendor with their own stores. Default to their
  // own store; only admins get the option to switch and act on behalf of
  // another vendor.
  const [sourceMode, setSourceMode] = useState('own');
  const [vendors, setVendors] = useState([]);
  const [vendorsLoaded, setVendorsLoaded] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState('');

  useEffect(() => {
    if (sourceMode !== 'admin' || vendorsLoaded) return;
    async function fetchVendors() {
      try {
        const res = await fetch('/api/vendors?intent=admin_vendor_directory');
        const result = await res.json();
        if (res.ok) setVendors(result.vendors || []);
      } catch (err) {
        console.error('Failed to load vendor directory:', err);
      } finally {
        setVendorsLoaded(true);
      }
    }
    fetchVendors();
  }, [sourceMode, vendorsLoaded]);

  const selectedVendor = vendors.find(v => v.user_id === selectedVendorId);
  const stores = sourceMode === 'admin' ? (selectedVendor?.tt_stores || []) : (profile?.tt_stores || []);

  const draftProducts = useLiveQuery(() => db.draftProducts.toArray());
  const [isPublishing, setIsPublishing] = useState(false);
  const [mediaModalForId, setMediaModalForId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);

  const [globalDiscount, setGlobalDiscount] = useState(10);
  const [globalStoreIdx, setGlobalStoreIdx] = useState('');
  const [globalCategoryId, setGlobalCategoryId] = useState('');
  const [globalLocationId, setGlobalLocationId] = useState('');
  const [globalSaleStart, setGlobalSaleStart] = useState('');
  const [globalSaleEnd, setGlobalSaleEnd] = useState('');

  // When a vendor only has one registered store, there's no ambiguity to
  // resolve — every newly-added draft can default to it immediately.
  const applyDefaultStore = (p) => {
    if (stores.length !== 1) return p;
    const store = stores[0];
    return {
      ...p,
      tt_location: p.tt_location || store,
      pickup_address: p.pickup_address || store.address || store.name || '',
      pickup_lat: p.pickup_lat || store.pickup_lat || store.lat || store.latitude || null,
      pickup_lng: p.pickup_lng || store.pickup_lng || store.lng || store.longitude || null,
      location: p.location || store.location || null,
      loc_ids: p.loc_ids?.length ? p.loc_ids : (store.loc_ids?.length ? store.loc_ids : (store.location ? [store.location] : [])),
    };
  };

  // Seeds a default sale schedule (start now, end from whatever duration the
  // source suggested) so a draft is publish-ready without a vendor having to
  // touch the schedule at all, while still leaving room for them to push the
  // start into the future or extend the end date.
  const applyDefaultSchedule = (p) => ({
    ...p,
    sale_start_date: p.sale_start_date || new Date().toISOString(),
    sale_end_date: p.sale_end_date || new Date(Date.now() + (p.duration_hours || 24) * 60 * 60 * 1000).toISOString(),
  });

  // In admin mode, stamp whichever vendor is currently selected so a batch
  // extracted right after picking a vendor doesn't need a manual "Apply to
  // All" click. Switching vendors mid-session and extracting again correctly
  // tags the new batch with the newly-selected vendor.
  const applyDefaultVendor = (p) => {
    if (sourceMode !== 'admin' || !selectedVendorId) return p;
    return { ...p, vendor_id: p.vendor_id || selectedVendorId };
  };

  const toLocalInput = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 16);
  };

  useEffect(() => {
    async function fetchOptions() {
      const [{ data: cats }, { data: locs }] = await Promise.all([
        supabase.from('product_categories').select('id, name').order('name'),
        supabase.from('locations').select('id, name').order('name'),
      ]);
      if (cats) setCategories(cats);
      if (locs) setLocations(locs);
    }
    fetchOptions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      } else if (activeTab === 'excel') {
        if (!excelFile) throw new Error("Please select an Excel file");
        formData.append('file', excelFile);
      }

      const res = await fetch('/api/vendors/products/extract', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to extract");

      const toInsert = data.products.map(p => applyDefaultVendor(applyDefaultSchedule(applyDefaultStore({
        ...p,
        status: 'draft',
        user_id: user.id
      }))));
      await db.draftProducts.bulkAdd(toInsert);
      addToast({ type: 'success', message: `Extracted ${data.products.length} products.` });

      setUrlInput('');
      setCsvInput('');
      setPdfFile(null);
      setExcelFile(null);
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', message: err.message });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleImport = async () => {
    setIsExtracting(true);
    try {
      const res = await fetch('/api/vendors/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileUrl: importCursor || importUrl, priceMode: importPriceMode }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Import failed');

      const toInsert = data.products.map(p => applyDefaultVendor(applyDefaultSchedule(applyDefaultStore({
        ...p,
        status: 'draft',
        user_id: user.id
      }))));
      await db.draftProducts.bulkAdd(toInsert);

      if (!importCursor) setImportUrl('');
      setImportCursor(data.hasMore ? data.nextUrl : null);

      addToast({
        type: 'success',
        message: `Imported ${data.products.length} listing${data.products.length === 1 ? '' : 's'}${data.hasMore ? ' — more available' : ''}. Set a price/discount and category before publishing.`
      });
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', message: err.message });
    } finally {
      setIsExtracting(false);
    }
  };

  const isProductValid = (p) => {
    const discountPct = p.price > 0 ? ((p.price - p.sale_price) / p.price) * 100 : 0;
    const hasValidSchedule = !!p.sale_start_date && !!p.sale_end_date && new Date(p.sale_end_date) > new Date(p.sale_start_date);
    return !!p.name && p.price > 0 && p.sale_price > 0 && p.sale_price < p.price && discountPct >= 5
      && p.stock > 0 && hasValidSchedule
      && !!p.pickup_lat && !!p.pickup_lng
      && !!p.category && !!p.location
      && (sourceMode !== 'admin' || !!p.vendor_id);
  };

  const updateDraft = (id, patch) => db.draftProducts.update(id, patch);

  // Editing price, sale_price, or discount_pct recomputes whichever of the
  // other two is derivable, so a vendor can work from either direction.
  const handlePriceFieldChange = (p, field, rawValue) => {
    const value = rawValue === '' ? null : Number(rawValue);
    const patch = { [field]: value };
    const price = field === 'price' ? value : p.price;

    if (field === 'discount_pct') {
      if (price > 0 && value != null) {
        patch.sale_price = Math.round(price * (1 - value / 100));
      }
    } else {
      const salePrice = field === 'sale_price' ? value : p.sale_price;
      if (price > 0 && salePrice > 0) {
        patch.discount_pct = ((price - salePrice) / price) * 100;
      }
    }
    updateDraft(p.id, patch);
  };

  const applyGlobalDiscount = () => {
    if (!draftProducts?.length) return;
    const pct = Number(globalDiscount);
    if (!(pct > 0 && pct < 100)) {
      addToast({ type: 'error', message: 'Enter a discount percentage between 1 and 99.' });
      return;
    }
    const updates = draftProducts
      .filter(p => p.price > 0)
      .map(p => ({ ...p, sale_price: Math.round(p.price * (1 - pct / 100)), discount_pct: pct }));
    db.draftProducts.bulkPut(updates);
    addToast({ type: 'success', message: `Applied ${pct}% discount to ${updates.length} draft(s).` });
  };

  const applyGlobalVendor = () => {
    if (!draftProducts?.length || !selectedVendorId) return;
    const updates = draftProducts.map(p => ({ ...p, vendor_id: selectedVendorId }));
    db.draftProducts.bulkPut(updates);
    addToast({ type: 'success', message: 'Vendor applied to all drafts.' });
  };

  const applyGlobalStore = () => {
    if (!draftProducts?.length || globalStoreIdx === '') return;
    const store = stores[Number(globalStoreIdx)];
    if (!store) return;
    const pickup_lat = store.pickup_lat || store.lat || store.latitude || null;
    const pickup_lng = store.pickup_lng || store.lng || store.longitude || null;
    const loc_ids = store.loc_ids?.length ? store.loc_ids : (store.location ? [store.location] : []);
    const updates = draftProducts.map(p => ({
      ...p,
      tt_location: store,
      pickup_address: store.address || store.name || '',
      pickup_lat,
      pickup_lng,
      location: store.location ?? p.location ?? null,
      loc_ids,
    }));
    db.draftProducts.bulkPut(updates);
    addToast({ type: 'success', message: 'Store applied to all drafts.' });
  };

  const applyGlobalCategory = () => {
    if (!draftProducts?.length || !globalCategoryId) return;
    const updates = draftProducts.map(p => ({ ...p, category: Number(globalCategoryId) }));
    db.draftProducts.bulkPut(updates);
    addToast({ type: 'success', message: 'Category applied to all drafts.' });
  };

  const applyGlobalLocation = () => {
    if (!draftProducts?.length || !globalLocationId) return;
    const updates = draftProducts.map(p => ({ ...p, location: Number(globalLocationId), loc_ids: [Number(globalLocationId)] }));
    db.draftProducts.bulkPut(updates);
    addToast({ type: 'success', message: 'Location applied to all drafts.' });
  };

  const applyGlobalSchedule = () => {
    if (!draftProducts?.length || !globalSaleStart || !globalSaleEnd) return;
    const start = new Date(globalSaleStart);
    const end = new Date(globalSaleEnd);
    if (!(end > start)) {
      addToast({ type: 'error', message: 'Sale end must be after sale start.' });
      return;
    }
    const updates = draftProducts.map(p => ({ ...p, sale_start_date: start.toISOString(), sale_end_date: end.toISOString() }));
    db.draftProducts.bulkPut(updates);
    addToast({ type: 'success', message: 'Schedule applied to all drafts.' });
  };

  const deleteDraft = async (id) => {
    await db.draftProducts.delete(id);
    setSelectedIds(prev => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    addToast({ type: 'success', message: 'Deleted successfully.' });
  };

  const toggleSelectRow = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allSelected = !!draftProducts?.length && selectedIds.size === draftProducts.length;
  const toggleSelectAll = () => {
    if (!draftProducts?.length) return;
    setSelectedIds(allSelected ? new Set() : new Set(draftProducts.map(p => p.id)));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const deleteSelected = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    await db.draftProducts.bulkDelete(ids);
    setSelectedIds(new Set());
    addToast({ type: 'success', message: `Deleted ${ids.length} draft${ids.length === 1 ? '' : 's'} successfully.` });
  };

  const handleMediaSelect = async (selected) => {
    if (mediaModalForId != null) await updateDraft(mediaModalForId, { featured_image: selected });
    setMediaModalForId(null);
  };

  // Re-hosts an externally-sourced image (e.g. from a platform import) into
  // our own Storage bucket, mirroring the shape every other product image
  // already uses, rather than hotlinking a third-party CDN long-term.
  const materializeImage = async (featuredImage, index) => {
    if (!featuredImage) return null;
    if (!featuredImage.external) return featuredImage;

    const res = await fetch(`/api/vendors/products/import-image?url=${encodeURIComponent(featuredImage.url)}`);
    if (!res.ok) return null;
    const blob = await res.blob();
    const ext = (featuredImage.url.split('.').pop() || 'jpg').split('?')[0];
    const filePath = `${user.id}/imported_${Date.now()}_${index}.${ext}`;

    const { error: uploadError } = await supabase.storage.from('uploads').upload(filePath, blob, {
      upsert: true,
      contentType: blob.type || 'image/jpeg',
    });
    if (uploadError) return null;

    const blurhash = await generateBlurhash(resizedImage(filePath, 'thumbnail'));
    return { url: filePath, blurhash };
  };

  const handlePublishAllReady = async () => {
    if (!draftProducts) return;
    const readyProducts = draftProducts.filter(isProductValid);
    if (readyProducts.length === 0) {
      addToast({ type: 'error', message: "No fully valid products to publish." });
      return;
    }

    setIsPublishing(true);
    let publishedCount = 0;
    try {
      for (let i = 0; i < readyProducts.length; i++) {
        const p = readyProducts[i];
        const discountPct = computeDiscountPct({ price: p.price, salePrice: p.sale_price });
        const saleStartDate = new Date(p.sale_start_date);
        const saleEndDate = new Date(p.sale_end_date);
        const urgency_score = computeUrgencyScore({
          saleEndDate,
          discountPct,
          stock: p.stock,
        });
        const featured_image = await materializeImage(p.featured_image, i);

        const payload = {
          name: p.name,
          short_description: p.short_description || '',
          price: p.price,
          sale_price: p.sale_price,
          stock: p.stock,
          discount_pct: discountPct,
          urgency_score,
          category: p.category,
          cat_ids: [p.category],
          location: p.location,
          loc_ids: p.loc_ids?.length ? p.loc_ids : [p.location],
          sale_start_date: saleStartDate.toISOString(),
          sale_end_date: saleEndDate.toISOString(),
          pickup_address: p.pickup_address || '',
          pickup_lat: p.pickup_lat,
          pickup_lng: p.pickup_lng,
          tt_location: p.tt_location || null,
          featured_image,
          product_type: 'simple',
          status: 'published',
          vendor_id: p.vendor_id || user.id,
        };

        const res = await fetch('/api/vendors/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(`Failed on "${p.name}": ${errData.error || 'Unknown error'}`);
        }

        await db.draftProducts.delete(p.id);
        setSelectedIds(prev => {
          if (!prev.has(p.id)) return prev;
          const next = new Set(prev);
          next.delete(p.id);
          return next;
        });
        publishedCount++;
      }

      addToast({ type: 'success', message: `Successfully published ${publishedCount} deal${publishedCount === 1 ? '' : 's'}!` });
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', message: `Published ${publishedCount} before failing: ${err.message}` });
    } finally {
      setIsPublishing(false);
    }
  };

  const importDisabled = isExtracting || (!importUrl && !importCursor);
  const extractDisabled = isExtracting
    || (activeTab === 'url' && !urlInput)
    || (activeTab === 'csv' && !csvInput)
    || (activeTab === 'pdf' && !pdfFile)
    || (activeTab === 'excel' && !excelFile);

  return (<>
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="tt-section-title" style={{ fontSize: '2rem' }}>Bulk Add <span>(AI)</span></h1>
        <p style={{ color: 'var(--tt-muted)' }}>Paste a URL, upload a PDF or Excel file, paste CSV data, or import from another platform. AI will extract the products for you to review.</p>
      </div>

      {userIsAdmin && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button
            type="button"
            onClick={() => setSourceMode('own')}
            className="tt-btn"
            style={{
              background: sourceMode === 'own' ? 'var(--tt-surface-2)' : 'transparent',
              color: sourceMode === 'own' ? 'var(--tt-gold)' : 'var(--tt-text)',
              fontWeight: sourceMode === 'own' ? 600 : 400,
            }}
          >
            My Store
          </button>
          <button
            type="button"
            onClick={() => setSourceMode('admin')}
            className="tt-btn"
            style={{
              background: sourceMode === 'admin' ? 'var(--tt-surface-2)' : 'transparent',
              color: sourceMode === 'admin' ? 'var(--tt-gold)' : 'var(--tt-text)',
              fontWeight: sourceMode === 'admin' ? 600 : 400,
            }}
          >
            Any Vendor (Admin)
          </button>
        </div>
      )}

      {/* Import Section */}
      <div className="tt-card tt-glass" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--tt-border)', paddingBottom: '1rem' }}>
          {TABS.map(tab => (
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
              {tab === 'import' ? 'IMPORT' : tab.toUpperCase()}
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
          {activeTab === 'excel' && (
            <input
              type="file"
              accept=".xlsx,.xls"
              className="tt-input"
              onChange={e => setExcelFile(e.target.files[0])}
            />
          )}
          {activeTab === 'import' && (
            <div>
              <input
                type="url"
                placeholder="Paste your seller page URL, e.g. https://store-website/sellerpage-xxxx"
                className="tt-input"
                value={importUrl}
                onChange={e => { setImportUrl(e.target.value); setImportCursor(null); }}
              />
              <p style={{ fontSize: '0.8rem', color: 'var(--tt-muted)', marginTop: '0.5rem' }}>
                Paste a link to your seller page or any one of your existing listings — we&apos;ll pull in your catalog for you to price and publish here.
              </p>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginTop: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--tt-muted)' }}>The price on the source listing is the:</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input type="radio" name="importPriceMode" checked={importPriceMode === 'price'} onChange={() => setImportPriceMode('price')} />
                  Regular Price
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input type="radio" name="importPriceMode" checked={importPriceMode === 'sale_price'} onChange={() => setImportPriceMode('sale_price')} />
                  Sale Price
                </label>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={activeTab === 'import' ? handleImport : handleExtract}
          disabled={activeTab === 'import' ? importDisabled : extractDisabled}
          className="tt-btn tt-btn-primary tt-shimmer"
        >
          {activeTab === 'import'
            ? (isExtracting ? 'Importing...' : (importCursor ? 'Import More' : 'Import Listings'))
            : (isExtracting ? 'Extracting with AI...' : 'Extract Products')}
        </button>
      </div>

      {/* Sandbox Workspace */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontFamily: 'Syne' }}>Drafts Library</h2>
          <button
            onClick={handlePublishAllReady}
            disabled={isPublishing || !draftProducts?.some(isProductValid)}
            className="tt-btn tt-btn-primary tt-shimmer"
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            {isPublishing ? 'Adding...' : 'Add Store Items'}
          </button>
        </div>

        {/* Shared values — set once, stamp across every draft in the sandbox */}
        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--tt-surface-2)', borderRadius: 'var(--tt-radius-sm)' }}>
          <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--tt-muted)', marginBottom: '0.75rem' }}>Shared Values</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem 1.5rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <input type="number" className="tt-input" style={{ width: 70 }} value={globalDiscount} onChange={e => setGlobalDiscount(e.target.value)} />
              <span style={{ fontSize: '0.8rem', color: 'var(--tt-muted)' }}>% off →</span>
              <button type="button" onClick={applyGlobalDiscount} className="tt-btn tt-btn-ghost" style={{ fontSize: '0.8rem' }}>Apply to All</button>
            </div>

            {sourceMode === 'admin' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <select className="tt-input" value={selectedVendorId} onChange={e => setSelectedVendorId(e.target.value)}>
                  <option value="">-- Vendor --</option>
                  {vendors.map(v => <option key={v.user_id} value={v.user_id}>{v.display_name || v.email || v.user_id}</option>)}
                </select>
                <button type="button" onClick={applyGlobalVendor} className="tt-btn tt-btn-ghost" style={{ fontSize: '0.8rem' }}>Apply to All</button>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <select className="tt-input" value={globalStoreIdx} onChange={e => setGlobalStoreIdx(e.target.value)}>
                <option value="">-- Store --</option>
                {stores.map((s, idx) => <option key={idx} value={idx}>{s.name}</option>)}
              </select>
              <button type="button" onClick={applyGlobalStore} className="tt-btn tt-btn-ghost" style={{ fontSize: '0.8rem' }}>Apply to All</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <select className="tt-input" value={globalCategoryId} onChange={e => setGlobalCategoryId(e.target.value)}>
                <option value="">-- Category --</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button type="button" onClick={applyGlobalCategory} className="tt-btn tt-btn-ghost" style={{ fontSize: '0.8rem' }}>Apply to All</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <select className="tt-input" value={globalLocationId} onChange={e => setGlobalLocationId(e.target.value)}>
                <option value="">-- Location --</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
              <button type="button" onClick={applyGlobalLocation} className="tt-btn tt-btn-ghost" style={{ fontSize: '0.8rem' }}>Apply to All</button>
            </div>

            <div className='w-full flex-wrap' style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--tt-muted)' }}>Sale Schedule:</span>
              <input type="datetime-local" className="tt-input" value={globalSaleStart} onChange={e => setGlobalSaleStart(e.target.value)} />
              <span style={{ fontSize: '0.8rem', color: 'var(--tt-muted)' }}>to</span>
              <input type="datetime-local" className="tt-input" value={globalSaleEnd} onChange={e => setGlobalSaleEnd(e.target.value)} />
              <button type="button" onClick={applyGlobalSchedule} className="tt-btn tt-btn-ghost" style={{ fontSize: '0.8rem' }}>Apply to All</button>
            </div>
          </div>
        </div>

        

        {draftProducts?.length === 0 ? (
          <p style={{ color: 'var(--tt-muted)', textAlign: 'center', padding: '2rem 0' }}>No drafts yet. Extract or import some above.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--tt-border)', color: 'var(--tt-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>
                    <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
                  </th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Image</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Name</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Description</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Price</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Sale Price</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Disc %</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Stock</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Category</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Location</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Store</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Sale Start</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Sale End</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {draftProducts?.map(p => {
                  const isValid = isProductValid(p);
                  const storeIdx = stores.findIndex(s => s.name === p.tt_location?.name);
                  const invalidStyle = { borderColor: 'var(--tt-danger)' };
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: isValid ? 'transparent' : 'rgba(255, 45, 85, 0.05)' }}>
                      <td style={{ padding: '0.5rem' }}>
                        <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelectRow(p.id)} />
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                          {p.featured_image?.url ? (
                            <img
                              src={p.featured_image.external ? p.featured_image.url : resizedImage(p.featured_image.url, 'thumbnail')}
                              alt=""
                              style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }}
                            />
                          ) : (
                            <div style={{ width: 40, height: 40, borderRadius: 6, background: 'var(--tt-surface-2)' }} />
                          )}
                          <button type="button" onClick={() => setMediaModalForId(p.id)} className="tt-btn tt-btn-ghost" style={{ padding: '0.15rem 0.4rem', fontSize: '0.65rem' }}>
                            {p.featured_image ? 'Change' : 'Pick'}
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: '0.5rem', minWidth: '160px' }}>
                        <input className="tt-input" style={{ fontWeight: 600, ...(!p.name ? invalidStyle : {}) }} value={p.name || ''} onChange={e => updateDraft(p.id, { name: e.target.value })} placeholder="Product name" />
                      </td>
                      <td style={{ padding: '0.5rem', minWidth: '180px' }}>
                        <input className="tt-input" style={{ fontSize: '0.8rem' }} value={p.short_description || ''} onChange={e => updateDraft(p.id, { short_description: e.target.value })} placeholder="Short description" />
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <input type="number" className="tt-input" style={{ width: 90, ...(!(p.price > 0) ? invalidStyle : {}) }} value={p.price ?? ''} onChange={e => handlePriceFieldChange(p, 'price', e.target.value)} />
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <input type="number" className="tt-input" style={{ width: 90, ...((!(p.sale_price > 0) || p.sale_price >= p.price) ? invalidStyle : {}) }} value={p.sale_price ?? ''} onChange={e => handlePriceFieldChange(p, 'sale_price', e.target.value)} />
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <input type="number" className="tt-input" style={{ width: 65 }} value={p.discount_pct != null ? Math.round(p.discount_pct) : ''} onChange={e => handlePriceFieldChange(p, 'discount_pct', e.target.value)} />
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <input type="number" className="tt-input" style={{ width: 65, ...(!(p.stock > 0) ? invalidStyle : {}) }} value={p.stock ?? ''} onChange={e => updateDraft(p.id, { stock: e.target.value === '' ? null : Number(e.target.value) })} />
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <select className="tt-input" style={{ minWidth: 130, ...(!p.category ? invalidStyle : {}) }} value={p.category || ''} onChange={e => updateDraft(p.id, { category: e.target.value ? Number(e.target.value) : null })}>
                          <option value="">-- Category --</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <select className="tt-input" style={{ minWidth: 130, ...(!p.location ? invalidStyle : {}) }} value={p.location || ''} onChange={e => updateDraft(p.id, { location: e.target.value ? Number(e.target.value) : null, loc_ids: e.target.value ? [Number(e.target.value)] : [] })}>
                          <option value="">-- Location --</option>
                          {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <select
                          className="tt-input"
                          style={{ minWidth: 120, ...((!p.pickup_lat || !p.pickup_lng) ? invalidStyle : {}) }}
                          value={storeIdx}
                          onChange={e => {
                            const store = stores[Number(e.target.value)];
                            if (!store) return;
                            updateDraft(p.id, {
                              tt_location: store,
                              pickup_address: store.address || store.name || '',
                              pickup_lat: store.pickup_lat || store.lat || store.latitude || null,
                              pickup_lng: store.pickup_lng || store.lng || store.longitude || null,
                              location: store.location ?? p.location ?? null,
                              loc_ids: store.loc_ids?.length ? store.loc_ids : (store.location ? [store.location] : (p.loc_ids || [])),
                            });
                          }}
                        >
                          <option value={-1}>-- Store --</option>
                          {stores.map((s, idx) => <option key={idx} value={idx}>{s.name}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <input
                          type="datetime-local"
                          className="tt-input"
                          style={{ ...(!p.sale_start_date ? invalidStyle : {}) }}
                          value={toLocalInput(p.sale_start_date)}
                          onChange={e => updateDraft(p.id, { sale_start_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
                        />
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <input
                          type="datetime-local"
                          className="tt-input"
                          style={{ ...((!p.sale_end_date || new Date(p.sale_end_date) <= new Date(p.sale_start_date)) ? invalidStyle : {}) }}
                          value={toLocalInput(p.sale_end_date)}
                          onChange={e => updateDraft(p.id, { sale_end_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
                        />
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                        <button onClick={() => deleteDraft(p.id)} style={{ background: 'none', border: 'none', color: 'var(--tt-danger)', cursor: 'pointer', fontSize: '1rem' }}>×</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {mediaModalForId != null && (
        <MediaLibraryModal
          userId={user?.id}
          multiple={false}
          linkedImages={[]}
          onSelect={handleMediaSelect}
          onClose={() => setMediaModalForId(null)}
        />
      )}
    </div>

    {selectedIds.size > 0 && (
          <div className='bg-[var(--tt-theme)]  max-w-[95vw] overflow-x-auto fixed bottom-0 left-auto right-[5px]' style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', padding: '0.75rem 1rem', border: '1px solid var(--tt-danger)', borderRadius: 'var(--tt-radius-sm)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{selectedIds.size} selected</span>
            <button type="button" onClick={deleteSelected} className="tt-btn tt-btn-ghost" style={{ fontSize: '0.8rem', color: 'var(--tt-danger)' }}>Delete Selected</button>
            <button type="button" onClick={clearSelection} className="tt-btn tt-btn-ghost" style={{ fontSize: '0.8rem' }}>Clear Selection</button>
          </div>
        )}
    </>
  );
}
