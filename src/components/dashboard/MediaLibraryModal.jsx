'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2 } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import useAppStore from '@/store/useAppStore';
import { resizedImage, getStoragePath } from '@/helpers/universal';
import { generateBlurhash } from '@/helpers/blurhash';
import { extractVibrantPalette } from '@/helpers/vibrantPalette';

const PAGE_SIZE = 30;

export default function MediaLibraryModal({ userId, multiple = false, linkedImages = [], onSelect, onClose }) {
  const supabase = getSupabaseBrowserClient();
  const { addToast } = useAppStore();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [deletingName, setDeletingName] = useState(null);
  const [computingName, setComputingName] = useState(null);
  const [selected, setSelected] = useState([]);
  const [loaderNode, setLoaderNode] = useState(null);

  const loadingRef = useRef(false);
  const pageRef = useRef(0);
  const blurhashCacheRef = useRef(new Map());
  const paletteCacheRef = useRef(new Map());
  // Callback ref (not a plain ref) so the observer effect re-runs once the
  // sentinel actually mounts — it doesn't exist yet on the first render,
  // when the library is still showing its "Loading..." state.
  const loaderRef = useCallback((node) => setLoaderNode(node), []);

  // Store the storage-relative path (not a full public URL) so this matches
  // the shape products already save their featured_image/gallery entries in.
  const buildUrl = useCallback((item) => `${userId}/${item.name}`, [userId]);

  // Normalize whatever shape each product's featured_image/gallery entries
  // happen to be in (bare path, full object-URL, or a raw Storage list item
  // that also carries a `url`) down to a minimal { name, url } pair, so the
  // "Linked to this product" section renders immediately without waiting for
  // bucket pagination to happen to reach those particular files.
  const linkedItemsMap = new Map();
  (linkedImages || []).forEach((raw) => {
    const rawUrl = typeof raw === 'string' ? raw : raw?.url;
    const path = getStoragePath(rawUrl);
    if (!path) return;
    const name = path.includes('/') ? path.slice(path.lastIndexOf('/') + 1) : path;
    if (!linkedItemsMap.has(path)) {
      linkedItemsMap.set(path, { id: `linked-${path}`, name });
      // Reuse the blurhash/palette already stored on the product, if any,
      // instead of recomputing them if this same image gets picked again.
      if (raw?.blurhash && !blurhashCacheRef.current.has(name)) {
        blurhashCacheRef.current.set(name, raw.blurhash);
      }
      if (raw?.palette && !paletteCacheRef.current.has(name)) {
        paletteCacheRef.current.set(name, raw.palette);
      }
    }
  });
  const linkedItems = Array.from(linkedItemsMap.values());
  const linkedUrls = new Set(linkedItemsMap.keys());

  // Loads the next page of images directly from the vendor's Storage folder
  // (uploads/{userId}/*), rather than scanning the products table for
  // previously-attached images.
  const fetchNextPage = useCallback(async () => {
    if (!userId || loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    const nextPage = pageRef.current + 1;
    const offset = (nextPage - 1) * PAGE_SIZE;

    const { data, error } = await supabase.storage
      .from('uploads')
      .list(userId, {
        limit: PAGE_SIZE,
        offset,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      console.error('Failed to load media library:', error);
      setHasMore(false);
    } else {
      const files = (data || []).filter(item => item.id); // exclude folder placeholders
      setImages(prev => {
        const existingNames = new Set(prev.map(i => i.name));
        const additions = files.filter(f => !existingNames.has(f.name));
        return [...prev, ...additions];
      });
      pageRef.current = nextPage;
      setHasMore((data || []).length === PAGE_SIZE);
    }

    loadingRef.current = false;
    setLoading(false);
  }, [userId, supabase]);

  // Reset and load the first page whenever the vendor changes
  useEffect(() => {
    setImages([]);
    setHasMore(true);
    pageRef.current = 0;
    loadingRef.current = false;
    if (userId) {
      fetchNextPage();
    } else {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Infinite scroll: fetch the next page once the sentinel scrolls into view
  useEffect(() => {
    if (!loaderNode || !hasMore) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        fetchNextPage();
      }
    }, { rootMargin: '200px' });

    observer.observe(loaderNode);
    return () => observer.disconnect();
  }, [loaderNode, hasMore, fetchNextPage]);

  // Library items don't carry a precomputed blurhash (Storage metadata has
  // no such field), so it's generated lazily on selection and cached per
  // file name to avoid recomputing on repeat picks within this session.
  const getBlurhashFor = useCallback(async (item) => {
    const cache = blurhashCacheRef.current;
    if (cache.has(item.name)) return cache.get(item.name);
    const blurhash = await generateBlurhash(resizedImage(`${userId}/${item.name}`, 'thumbnail'));
    cache.set(item.name, blurhash);
    return blurhash;
  }, [userId]);

  // Same lazy-compute/cache-per-file-name treatment as the blurhash, so the
  // vibrant swatch palette (see useVibrantImageColor) is only ever extracted
  // once per image, on first selection.
  const getPaletteFor = useCallback(async (item) => {
    const cache = paletteCacheRef.current;
    if (cache.has(item.name)) return cache.get(item.name);
    const palette = await extractVibrantPalette(resizedImage(`${userId}/${item.name}`, 'thumbnail'));
    cache.set(item.name, palette);
    return palette;
  }, [userId]);

  const toggleSelect = async (item) => {
    const url = buildUrl(item);

    if (multiple && selected.some(i => i.url === url)) {
      setSelected(prev => prev.filter(i => i.url !== url));
      return;
    }

    setComputingName(item.name);
    const [blurhash, palette] = await Promise.all([getBlurhashFor(item), getPaletteFor(item)]);
    setComputingName(null);
    const img = { url, blurhash, palette };

    if (!multiple) {
      onSelect(img);
      return;
    }
    setSelected(prev => (prev.some(i => i.url === url) ? prev : [...prev, img]));
  };

  const confirmSelection = () => {
    onSelect(selected);
  };

  const handleDelete = async (item, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this image from your library? This cannot be undone.')) return;

    setDeletingName(item.name);
    const { error } = await supabase.storage.from('uploads').remove([`${userId}/${item.name}`]);

    if (error) {
      addToast({ type: 'error', message: 'Failed to delete image.' });
      setDeletingName(null);
      return;
    }

    const removedUrl = buildUrl(item);
    blurhashCacheRef.current.delete(item.name);
    paletteCacheRef.current.delete(item.name);
    setImages(prev => prev.filter(i => i.name !== item.name));
    setSelected(prev => prev.filter(i => i.url !== removedUrl));
    setDeletingName(null);
  };

  const renderThumb = (item) => {
    const url = buildUrl(item);
    const isSelected = multiple && selected.some(i => i.url === url);
    const isDeleting = deletingName === item.name;
    const isComputing = computingName === item.name;
    const isBusy = isDeleting || isComputing;
    return (
      <div key={item.id || item.name} style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => toggleSelect(item)}
          disabled={isBusy}
          style={{
            display: 'block',
            width: '100%',
            padding: 0,
            border: isSelected ? '2px solid var(--tt-flame)' : '2px solid transparent',
            borderRadius: 'var(--tt-radius-sm)',
            overflow: 'hidden',
            cursor: isBusy ? 'not-allowed' : 'pointer',
            aspectRatio: '1 / 1',
            background: 'var(--tt-surface-2)',
            opacity: isBusy ? 0.5 : 1,
          }}
        >
          <img src={resizedImage(`${userId}/${item.name}`, 'thumbnail')} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </button>
        <button
          type="button"
          onClick={(e) => handleDelete(item, e)}
          disabled={isBusy}
          title="Delete from library"
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            background: 'rgba(0,0,0,0.6)',
            color: '#fff',
            border: 'none',
            borderRadius: '50%',
            width: '22px',
            height: '22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isBusy ? 'not-allowed' : 'pointer',
          }}
        >
          <Trash2 size={12} />
        </button>
      </div>
    );
  };

  const otherImages = images.filter(item => !linkedUrls.has(buildUrl(item)));

  return (
    <AnimatePresence>
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="tt-card tt-glass"
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '700px',
            maxHeight: '80vh',
            overflowY: 'auto',
            padding: '2rem',
            background: 'var(--tt-surface)',
            borderTop: '4px solid var(--tt-flame)',
          }}
        >
          <button
            onClick={onClose}
            style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--tt-muted)' }}
          >
            <X size={22} />
          </button>

          <h3 className="tt-section-title" style={{ fontSize: '1.3rem', marginBottom: '1.5rem' }}>Media Library</h3>

          {linkedItems.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--tt-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Linked to this product</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.75rem' }}>
                {linkedItems.map(renderThumb)}
              </div>
            </div>
          )}

          {loading && images.length === 0 ? (
            <p style={{ color: 'var(--tt-muted)' }}>Loading your uploaded images...</p>
          ) : images.length === 0 ? (
            <p style={{ color: 'var(--tt-muted)' }}>No previously uploaded images found. Upload a new image to get started.</p>
          ) : (
            <>
              {linkedItems.length > 0 && otherImages.length > 0 && (
                <span style={{ fontSize: '0.75rem', color: 'var(--tt-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>All images</span>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.75rem' }}>
                {otherImages.map(renderThumb)}
              </div>

              <div ref={loaderRef} style={{ textAlign: 'center', padding: '1rem 0', minHeight: '1px' }}>
                {loading && <span style={{ fontSize: '0.8rem', color: 'var(--tt-muted)' }}>Loading more...</span>}
                {!hasMore && !loading && <span style={{ fontSize: '0.8rem', color: 'var(--tt-muted)' }}>No more images</span>}
              </div>
            </>
          )}

          {multiple && selected.length > 0 && (
            <div className='action_bar sticky bottom-1' style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={confirmSelection} disabled={selected.length === 0} className="tt-btn tt-btn-primary">
                Add {selected.length > 0 ? `${selected.length} ` : ''}Image{selected.length === 1 ? '' : 's'}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
