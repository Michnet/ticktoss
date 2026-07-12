'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import useAppStore from '@/store/useAppStore';
import { computeUrgencyScore } from '@/lib/urgency';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { resizedImage } from '@/helpers/universal';

const productSchema = z.object({
  name: z.string().min(5, 'Product name is too short'),
  short_description: z.string().min(10, 'Provide a brief description'),
  long_description: z.string().optional(),
  price: z.number().min(1000, 'Original price must be valid'),
  sale_price: z.number().min(1000, 'Sale price must be valid'),
  stock: z.number().min(1, 'Must have at least 1 in stock'),
  unit_cost: z.number().optional().nullable(),
  sale_start_date: z.string().min(1, 'Please select a start date'),
  sale_end_date: z.string().min(1, 'Please select an end date'),
  store_index: z.string().min(1, 'Please select a store'),
  category: z.string().min(1, 'Please select a main category'),
}).refine(data => data.sale_price < data.price, {
  message: "Sale price must be lower than the original price",
  path: ['sale_price'],
}).refine(data => {
  const discountPct = ((data.price - data.sale_price) / data.price) * 100;
  return discountPct >= 5; // Enforce at least 5% discount
}, {
  message: "TickToss deals require a minimum 5% discount.",
  path: ['sale_price'],
}).refine(data => {
  return new Date(data.sale_end_date) > new Date(data.sale_start_date);
}, {
  message: "End date must be after the start date",
  path: ['sale_end_date'],
});

function ExpandableSection({ id, title, isOpen, onToggle, children, hasError }) {
  return (
    <div style={{ border: '1px solid var(--tt-border)', borderRadius: 'var(--tt-radius-sm)', marginBottom: '1rem', overflow: 'hidden', background: 'var(--tt-surface-2)' }}>
      <button 
        type="button" 
        onClick={() => onToggle(id)}
        style={{ width: '100%', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600, color: hasError ? 'var(--tt-danger)' : 'var(--tt-text)' }}
      >
        <span>{title} {hasError && <span style={{fontSize: '0.8rem', marginLeft: '0.5rem'}}>⚠️ Errors</span>}</span>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      {isOpen && (
        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--tt-border)', background: 'var(--tt-surface)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {children}
        </div>
      )}
    </div>
  );
}

export default function VendorAddSingle({ initialData = null, onSuccess = null }) {
  const { user, profile, addToast } = useAppStore();
  const supabase = getSupabaseBrowserClient();
  const stores = profile?.tt_stores || [];
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [tagSearch, setTagSearch] = useState('');
  const [fullProductData, setFullProductData] = useState(initialData);
  const [selectedTags, setSelectedTags] = useState(initialData?.tag_ids || []);
  const [imageFile, setImageFile] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [existingGallery, setExistingGallery] = useState([]);
  
  // Array to store the hierarchy of selected category IDs
  const [selectedCatIds, setSelectedCatIds] = useState([]);
  
  const [attributeSelections, setAttributeSelections] = useState(() => {
    try {
      return typeof initialData?.attributes === 'string' 
        ? JSON.parse(initialData.attributes) 
        : (initialData?.attributes || {});
    } catch {
      return {};
    }
  });

  const [availableAttributes, setAvailableAttributes] = useState([]);

  useEffect(() => {
    async function fetchAttributes() {
      if (!selectedCatIds || selectedCatIds.length === 0) {
        setAvailableAttributes([]);
        return;
      }
      
      const { data: mappings, error } = await supabase
        .from('product_cat_attributes')
        .select(`
          attribute_id, 
          product_attributes(id, name, slug, options, custom_options)
        `)
        .in('category_id', selectedCatIds);
        
      if (mappings && !error) {
        const uniqueAttrs = new Map();
        mappings.forEach(m => {
          if (m.product_attributes && !uniqueAttrs.has(m.attribute_id)) {
            uniqueAttrs.set(m.attribute_id, m.product_attributes);
          }
        });
        setAvailableAttributes(Array.from(uniqueAttrs.values()));
      }
    }
    fetchAttributes();
  }, [selectedCatIds]);
  
  const [openSection, setOpenSection] = useState('basic');

  const isEditMode = !!initialData;

  useEffect(() => {
    async function fetchData() {
      const promises = [
        supabase.from('product_categories').select('id, name, parent').order('name'),
        supabase.from('tags').select('id, name').order('name')
      ];

      if (isEditMode && initialData?.id) {
        promises.push(supabase.from('products').select('*').eq('id', initialData.id).single());
      }

      const [catsRes, tagsRes, productRes] = await Promise.all(promises);
      
      const cats = catsRes?.data;
      const tg = tagsRes?.data;
      const product = productRes?.data;

      const dataToUse = product || initialData;
      setFullProductData(dataToUse);

      if (cats) {
        setCategories(cats);
        // If dataToUse has cat_ids, set them
        if (dataToUse?.cat_ids && dataToUse.cat_ids.length > 0) {
          setSelectedCatIds(dataToUse.cat_ids);
        } else if (dataToUse?.category) {
          setSelectedCatIds([dataToUse.category]);
        }
      }
      if (tg) setTags(tg);
      
      if (dataToUse?.tag_ids) {
        setSelectedTags(dataToUse.tag_ids);
      }
      if (dataToUse?.gallery) {
        setExistingGallery(dataToUse.gallery);
      }

      // Populate form values if full product data was fetched
      if (product) {
        setValue('name', product.name || '');
        setValue('short_description', product.short_description || '');
        setValue('long_description', product.long_description || '');
        setValue('price', product.price || '');
        setValue('sale_price', product.sale_price || '');
        setValue('stock', product.stock ?? 1);
        setValue('unit_cost', product.unit_cost || '');
        
        if (product.sale_start_date) {
          setValue('sale_start_date', new Date(product.sale_start_date).toISOString().slice(0, 16));
        }
        if (product.sale_end_date) {
          setValue('sale_end_date', new Date(product.sale_end_date).toISOString().slice(0, 16));
        }
        
        if (product.tt_location) {
          // Find the store index
          // We need access to `stores` which is from `profile?.tt_stores || []`
          // Let's assume stores is available
          const idx = (profile?.tt_stores || []).findIndex(s => s.name === product.tt_location.name);
          if (idx !== -1) {
            setValue('store_index', idx.toString());
          }
        }
        
        if (product.category) {
          setValue('category', String(product.category));
        }
      }
    }
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  let defaultStoreIndex = stores.length === 1 ? '0' : '';
  if (initialData?.tt_location) {
    const idx = stores.findIndex(s => s.name === initialData.tt_location.name);
    if (idx !== -1) defaultStoreIndex = idx.toString();
  }
  
  const formatForDateTimeLocal = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().slice(0, 16);
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name || '',
      short_description: initialData?.short_description || '',
      long_description: initialData?.long_description || '',
      price: initialData?.price || '',
      sale_price: initialData?.sale_price || '',
      stock: initialData?.stock ?? 1,
      unit_cost: initialData?.unit_cost || '',
      sale_start_date: formatForDateTimeLocal(initialData?.sale_start_date) || formatForDateTimeLocal(new Date().toISOString()),
      sale_end_date: formatForDateTimeLocal(initialData?.sale_end_date) || formatForDateTimeLocal(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()),
      store_index: defaultStoreIndex,
      category: initialData?.category ? String(initialData.category) : '',
    },
  });

  const watchPrice = watch('price');
  const watchSalePrice = watch('sale_price');
  const watchStartDate = watch('sale_start_date');
  const watchEndDate = watch('sale_end_date');
  const watchStock = watch('stock');

  const getFormattedDate = (val) => {
    if (!val) return null;
    const d = new Date(val);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  // Real-time calculation of discount and urgency score
  const originalPrice = Number(watchPrice) || 0;
  const salePrice = Number(watchSalePrice) || 0;
  const discountPct = originalPrice > 0 ? ((originalPrice - salePrice) / originalPrice) * 100 : 0;
  
  const hours_remaining = (watchStartDate && watchEndDate) ? Math.max(1, Math.round((new Date(watchEndDate) - new Date()) / (1000 * 60 * 60))) : 24;
  
  const estimatedScore = computeUrgencyScore({
    discount_pct: discountPct,
    hours_remaining: hours_remaining,
    stock: Number(watchStock) || 1
  });

  let urgencyLevel = 'low';
  if (estimatedScore >= 80) urgencyLevel = 'critical';
  else if (estimatedScore >= 50) urgencyLevel = 'high';
  else if (estimatedScore >= 20) urgencyLevel = 'medium';

  const toggleSection = (id) => {
    setOpenSection(openSection === id ? null : id);
  };

  const handleTagToggle = (tagId) => {
    setSelectedTags(prev => 
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const onSubmit = async (data) => {
    const selectedStore = stores[parseInt(data.store_index)];
    if (!selectedStore) {
      addToast({ type: 'error', message: 'Please select a valid store.' });
      return;
    }
    
    const pickup_lat = selectedStore.pickup_lat || selectedStore.lat || selectedStore.latitude || null;
    const pickup_lng = selectedStore.pickup_lng || selectedStore.lng || selectedStore.longitude || null;

    setIsSubmitting(true);
    try {
      const payload = {
        name: data.name,
        short_description: data.short_description,
        long_description: data.long_description || null,
        price: data.price,
        sale_price: data.sale_price,
        stock: data.stock,
        unit_cost: data.unit_cost || null,
        category: selectedCatIds.length > 0 ? selectedCatIds[selectedCatIds.length - 1] : null,
        cat_ids: selectedCatIds,
        tag_ids: selectedTags,
        discount_pct: discountPct,
        sale_start_date: new Date(data.sale_start_date).toISOString(),
        sale_end_date: new Date(data.sale_end_date).toISOString(),
        user_id: user.id,
        urgency_score: estimatedScore,
        pickup_address: selectedStore.location || selectedStore.name || '',
        pickup_lat: pickup_lat,
        pickup_lng: pickup_lng,
        tt_location: selectedStore,
        attributes: Object.keys(attributeSelections).length > 0 ? attributeSelections : null,
        status: 'published' // Publish immediately for MVP
      };

      if (!payload.category) {
        addToast({ type: 'error', message: 'Please select a category.' });
        setIsSubmitting(false);
        return;
      }

      let productId = fullProductData?.id;

      if (isEditMode) {
        const res = await fetch('/api/vendor/products', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: fullProductData.id,
            ...payload
          }),
        });
        
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to update deal');
        }
      } else {
        const res = await fetch('/api/vendor/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to create deal');
        }
        const responseData = await res.json();
        productId = responseData.product.id;
      }

      // Handle Image Upload if a file was selected
      if (imageFile && productId) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `featured_${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${productId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(filePath, imageFile, { upsert: true });

        if (uploadError) {
          throw new Error('Product saved, but image upload failed: ' + uploadError.message);
        }

        const { data: publicUrlData } = supabase.storage
          .from('uploads')
          .getPublicUrl(filePath);

        // Update product with the featured_image JSON
        if (publicUrlData?.publicUrl) {
          await supabase.from('products').update({
            featured_image: { url: publicUrlData.publicUrl }
          }).eq('id', productId);
        }
      }

      // Handle Gallery Images Upload
      let updatedGalleryUrls = [...existingGallery];

      if (galleryFiles.length > 0 && productId) {
        const uploadPromises = galleryFiles.map(async (file, index) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `gallery_${Date.now()}_${index}.${fileExt}`;
          const filePath = `${user.id}/${productId}/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('uploads')
            .upload(filePath, file, { upsert: true });

          if (uploadError) throw new Error('Gallery image upload failed: ' + uploadError.message);
          
          const { data: publicUrlData } = supabase.storage
            .from('uploads')
            .getPublicUrl(filePath);

          return publicUrlData?.publicUrl;
        });

        const newGalleryUrls = await Promise.all(uploadPromises);
        updatedGalleryUrls = [...updatedGalleryUrls, ...newGalleryUrls.filter(url => url)];
      }

      // Update the gallery in the database if it changed
      if (updatedGalleryUrls.length > 0 || (isEditMode && existingGallery.length !== (fullProductData?.gallery?.length || 0))) {
         await supabase.from('products').update({
           gallery: updatedGalleryUrls
         }).eq('id', productId);
      }

      addToast({ type: 'success', message: isEditMode ? 'Deal updated successfully!' : 'Deal posted successfully!' });
      
      if (onSuccess) {
        onSuccess();
      } else {
        setSuccess(true);
      }
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', message: err.message || 'An error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Derive dropdown options for category tiering
  const getChildren = (parentId) => categories.filter(c => c.parent === parentId);
  const dropdownLevels = [getChildren(null)];
  
  for (let i = 0; i < selectedCatIds.length; i++) {
    const children = getChildren(selectedCatIds[i]);
    if (children.length > 0) {
      dropdownLevels.push(children);
    }
  }

  const handleCategoryChange = (levelIndex, selectedId) => {
    if (!selectedId) {
      // If user selected the placeholder, trim the selection to the level before
      setSelectedCatIds(prev => prev.slice(0, levelIndex));
    } else {
      // Truncate any existing lower-level selections and append the new one
      const newSelection = [...selectedCatIds.slice(0, levelIndex), parseInt(selectedId)];
      setSelectedCatIds(newSelection);
    }
  };

  const handleResetCategories = () => {
    setSelectedCatIds([]);
  };

  const filteredTags = tags.filter(tag => tag.name.toLowerCase().includes(tagSearch.toLowerCase()));

  const hasErrors = (fields) => fields.some(field => errors[field]);

  if (success) {
    return (
      <div className="tt-card tt-glass" style={{ padding: '3rem', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔥</div>
        <h2 className="tt-section-title" style={{ marginBottom: '1rem' }}>Deal is <span>Live!</span></h2>
        <p style={{ color: 'var(--tt-muted)', marginBottom: '2rem' }}>
          Your urgency score is {estimatedScore.toFixed(0)}. Buyers will see it immediately.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button onClick={() => window.location.href = '/dashboard?view=vendor_products'} className="tt-btn tt-btn-ghost">View My Deals</button>
          <button onClick={() => window.location.reload()} className="tt-btn tt-btn-primary tt-shimmer">Post Another</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: isEditMode ? '0 auto' : undefined }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="tt-section-title" style={{ fontSize: '2rem' }}>
          {isEditMode ? 'Edit' : 'Post'} a <span>Deal</span>
        </h1>
        <p style={{ color: 'var(--tt-muted)' }}>
          {isEditMode ? 'Update your product details and urgency score.' : 'Set aggressive discounts and short timeframes to rank higher on the homepage.'}
        </p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5' style={{ alignItems: 'start' }}>
        
        {/* Form */}
        <form className='relative' onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column' }}>
          
          <ExpandableSection 
            id="basic" 
            title="1. Basic Information" 
            isOpen={openSection === 'basic'} 
            onToggle={toggleSection}
            hasError={hasErrors(['name', 'short_description', 'long_description'])}
          >
            <div>
              <label className="tt-label">Product Name</label>
              <input type="text" className="tt-input" placeholder="e.g. Samsung Galaxy S23 Ultra" {...register('name')} />
              {errors.name && <span style={{ color: 'var(--tt-danger)', fontSize: '0.8rem' }}>{errors.name.message}</span>}
            </div>

            <div>
              <label className="tt-label">Short Description</label>
              <textarea className="tt-input" rows={2} placeholder="Brief details about the condition and items included." {...register('short_description')} />
              {errors.short_description && <span style={{ color: 'var(--tt-danger)', fontSize: '0.8rem' }}>{errors.short_description.message}</span>}
            </div>

            <div>
              <label className="tt-label">Long Description (Optional)</label>
              <textarea className="tt-input" rows={4} placeholder="Full product details, specifications, and terms." {...register('long_description')} />
            </div>
          </ExpandableSection>

          <ExpandableSection 
            id="pricing" 
            title="2. Pricing & Inventory" 
            isOpen={openSection === 'pricing'} 
            onToggle={toggleSection}
            hasError={hasErrors(['price', 'sale_price', 'stock', 'unit_cost'])}
          >
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 200px' }}>
                <label className="tt-label">Original Price (UGX)</label>
                <input type="number" className="tt-input" {...register('price', { valueAsNumber: true })} />
                {errors.price && <span style={{ color: 'var(--tt-danger)', fontSize: '0.8rem' }}>{errors.price.message}</span>}
              </div>
              <div style={{ flex: '1 1 200px' }}>
                <label className="tt-label">Sale Price (UGX)</label>
                <input type="number" className="tt-input" {...register('sale_price', { valueAsNumber: true })} />
                {errors.sale_price && <span style={{ color: 'var(--tt-danger)', fontSize: '0.8rem' }}>{errors.sale_price.message}</span>}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 200px' }}>
                <label className="tt-label">Stock Available</label>
                <input type="number" className="tt-input" {...register('stock', { valueAsNumber: true })} />
                {errors.stock && <span style={{ color: 'var(--tt-danger)', fontSize: '0.8rem' }}>{errors.stock.message}</span>}
              </div>
              <div style={{ flex: '1 1 200px' }}>
                <label className="tt-label">Unit Cost (UGX - Optional)</label>
                <input type="number" className="tt-input" placeholder="For your profit tracking" {...register('unit_cost', { setValueAs: v => v === '' || Number.isNaN(Number(v)) ? null : Number(v) })} />
              </div>
            </div>
          </ExpandableSection>

          <ExpandableSection 
            id="meta" 
            title="3. Categorization" 
            isOpen={openSection === 'meta'} 
            onToggle={toggleSection}
            hasError={selectedCatIds.length === 0}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label className="tt-label" style={{ marginBottom: 0 }}>Category Hierarchy</label>
                {selectedCatIds.length > 0 && (
                  <button type="button" onClick={handleResetCategories} style={{ fontSize: '0.8rem', color: 'var(--tt-flame)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                    Reset Categories
                  </button>
                )}
              </div>
              
              {selectedCatIds.length > 0 && (
                <div style={{ marginBottom: '1rem', padding: '0.8rem', background: 'var(--tt-surface)', borderRadius: 'var(--tt-radius-sm)', border: '1px solid var(--tt-border)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--tt-muted)', display: 'block', marginBottom: '0.3rem' }}>Selected Path:</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
                    {selectedCatIds.map((id, idx) => {
                      const cat = categories.find(c => c.id === id);
                      if (!cat) return null;
                      return (
                        <span key={id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--tt-flame)' }}>{cat.name}</span>
                          {idx < selectedCatIds.length - 1 && <span style={{ color: 'var(--tt-muted)' }}>›</span>}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {dropdownLevels.map((options, index) => (
                  <select 
                    key={`cat-level-${index}`} 
                    className="tt-input" 
                    value={selectedCatIds[index] || ''} 
                    onChange={(e) => handleCategoryChange(index, e.target.value)}
                  >
                    <option value="">-- Select {index === 0 ? 'Main Category' : 'Subcategory'} --</option>
                    {options.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                ))}
              </div>
              {selectedCatIds.length === 0 && <span style={{ color: 'var(--tt-danger)', fontSize: '0.8rem' }}>Please select at least a main category</span>}
            </div>

            <div>
              <label className="tt-label">Tags</label>
              
              {selectedTags.length > 0 && (
                <div style={{ marginBottom: '1rem', padding: '0.8rem', background: 'var(--tt-surface)', borderRadius: 'var(--tt-radius-sm)', border: '1px solid var(--tt-border)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--tt-muted)', display: 'block', marginBottom: '0.5rem' }}>Selected Tags:</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {selectedTags.map(id => {
                      const tag = tags.find(t => t.id === id);
                      if (!tag) return null;
                      return (
                        <span key={id} style={{
                          background: 'var(--tt-flame)',
                          color: '#fff',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '99px',
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem'
                        }}>
                          {tag.name}
                          <button type="button" onClick={() => handleTagToggle(id)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, lineHeight: 1, fontSize: '1rem' }}>&times;</button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              <input 
                type="text" 
                placeholder="Search tags..." 
                className="tt-input" 
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                style={{ marginBottom: '0.5rem' }}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto', padding: '0.5rem', border: '1px solid var(--tt-border)', borderRadius: 'var(--tt-radius-sm)', background: 'var(--tt-surface)' }}>
                {filteredTags.map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleTagToggle(tag.id)}
                    style={{
                      padding: '0.3rem 0.6rem',
                      fontSize: '0.8rem',
                      borderRadius: '99px',
                      border: '1px solid',
                      borderColor: selectedTags.includes(tag.id) ? 'var(--tt-flame)' : 'var(--tt-border)',
                      background: selectedTags.includes(tag.id) ? 'rgba(255, 77, 0, 0.1)' : 'transparent',
                      color: selectedTags.includes(tag.id) ? 'var(--tt-flame)' : 'var(--tt-text)',
                      cursor: 'pointer'
                    }}
                  >
                    {tag.name}
                  </button>
                ))}
                {filteredTags.length === 0 && <span style={{ fontSize: '0.8rem', color: 'var(--tt-muted)' }}>No tags found.</span>}
              </div>
            </div>
          </ExpandableSection>

          <ExpandableSection 
            id="media" 
            title="4. Media & Assets" 
            isOpen={openSection === 'media'} 
            onToggle={toggleSection}
            hasError={false}
          >
            <div>
              <label className="tt-label">Featured Image</label>
              {fullProductData?.featured_image?.url && !imageFile && (
                <div style={{ marginBottom: '1rem' }}>
                  <img src={resizedImage(fullProductData.featured_image.url, 'thumbnail')} alt="Current featured" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: 'var(--tt-radius-sm)' }} />
                  <p style={{ fontSize: '0.8rem', color: 'var(--tt-muted)' }}>Current image. Upload a new one below to replace.</p>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*"
                className="tt-input" 
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    setImageFile(e.target.files[0]);
                  }
                }}
              />
              <p style={{ fontSize: '0.8rem', color: 'var(--tt-muted)', marginTop: '0.5rem' }}>Max file size: 5MB. Recommended square aspect ratio.</p>
            </div>

            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--tt-border)' }}>
              <label className="tt-label">Product Gallery</label>
              <input 
                type="file" 
                accept="image/*"
                multiple
                className="tt-input" 
                onChange={e => {
                  if (e.target.files) {
                    setGalleryFiles(prev => [...prev, ...Array.from(e.target.files)]);
                  }
                }}
              />
              <p style={{ fontSize: '0.8rem', color: 'var(--tt-muted)', marginTop: '0.5rem' }}>Upload additional angles or details. Max 5MB per image.</p>
              
              {/* Gallery Previews */}
              {(existingGallery.length > 0 || galleryFiles.length > 0) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
                  {existingGallery.map((img, idx) => (
                    <div key={`exist-${idx}`} style={{ position: 'relative' }}>
                      <img src={resizedImage(img.url, 'thumbnail')} alt={`Gallery ${idx}`} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: 'var(--tt-radius-sm)', border: '1px solid var(--tt-border)' }} />
                      <button 
                        type="button" 
                        onClick={() => setExistingGallery(prev => prev.filter((_, i) => i !== idx))}
                        style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--tt-danger)', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>&times;</button>
                    </div>
                  ))}
                  {galleryFiles.map((file, idx) => (
                    <div key={`new-${idx}`} style={{ position: 'relative' }}>
                      <img src={URL.createObjectURL(file)} alt={`New Gallery ${idx}`} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: 'var(--tt-radius-sm)', border: '1px solid var(--tt-border)' }} />
                      <button 
                        type="button" 
                        onClick={() => setGalleryFiles(prev => prev.filter((_, i) => i !== idx))}
                        style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--tt-danger)', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>&times;</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ExpandableSection>

          <ExpandableSection 
            id="attributes" 
            title="5. Product Attributes (Optional)" 
            isOpen={openSection === 'attributes'} 
            onToggle={toggleSection}
            hasError={false}
          >
            <div>
              {availableAttributes.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {availableAttributes.map(attr => (
                    <div key={attr.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ flex: '1 1 150px' }}>
                        <label className="tt-label" style={{ marginBottom: 0 }}>{attr.name}</label>
                      </div>
                      <div style={{ flex: '2 1 250px' }}>
                        <select 
                          className="tt-input" 
                          value={attributeSelections[attr.slug]?.values?.[0]?.slug || ''}
                          onChange={(e) => {
                            const selectedOption = attr.options?.find(o => o.slug === e.target.value);
                            setAttributeSelections(prev => {
                              const next = { ...prev };
                              if (!selectedOption) {
                                delete next[attr.slug];
                              } else {
                                next[attr.slug] = {
                                  name: attr.name,
                                  slug: attr.slug,
                                  values: [{ name: selectedOption.name, slug: selectedOption.slug }],
                                  is_variation: false
                                };
                              }
                              return next;
                            });
                          }}
                        >
                          <option value="">-- Select {attr.name} --</option>
                          {attr.options?.map(opt => (
                            <option key={opt.slug} value={opt.slug}>{opt.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--tt-muted)' }}>
                  Select a category to see relevant attributes.
                </p>
              )}
            </div>
          </ExpandableSection>

          <ExpandableSection 
            id="location" 
            title="6. Scheduling & Location" 
            isOpen={openSection === 'location'} 
            onToggle={toggleSection}
            hasError={hasErrors(['sale_start_date', 'sale_end_date', 'store_index'])}
          >
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 200px' }}>
                <label className="tt-label">Sale Start Date</label>
                <input type="datetime-local" className="tt-input" {...register('sale_start_date')} />
                {errors.sale_start_date ? (
                  <span style={{ color: 'var(--tt-danger)', fontSize: '0.8rem', display: 'block', marginTop: '0.3rem' }}>{errors.sale_start_date.message}</span>
                ) : getFormattedDate(watchStartDate) ? (
                  <span style={{ color: 'var(--tt-success)', fontSize: '0.8rem', display: 'block', marginTop: '0.3rem' }}>Starts: {getFormattedDate(watchStartDate)}</span>
                ) : null}
              </div>
              <div style={{ flex: '1 1 200px' }}>
                <label className="tt-label">Sale End Date</label>
                <input type="datetime-local" className="tt-input" {...register('sale_end_date')} />
                {errors.sale_end_date ? (
                  <span style={{ color: 'var(--tt-danger)', fontSize: '0.8rem', display: 'block', marginTop: '0.3rem' }}>{errors.sale_end_date.message}</span>
                ) : getFormattedDate(watchEndDate) ? (
                  <span style={{ color: 'var(--tt-success)', fontSize: '0.8rem', display: 'block', marginTop: '0.3rem' }}>Ends: {getFormattedDate(watchEndDate)}</span>
                ) : null}
              </div>
            </div>

            <div>
              <label className="tt-label">Select Store</label>
              <select className="tt-input" {...register('store_index')}>
                <option value="">-- Choose a store --</option>
                {stores.map((store, idx) => (
                  <option key={idx} value={idx}>
                    {store.name} {store.location ? `(${store.location})` : ''}
                  </option>
                ))}
              </select>
              {errors.store_index && <span style={{ color: 'var(--tt-danger)', fontSize: '0.8rem' }}>{errors.store_index.message}</span>}
              {stores.length === 0 && <span style={{ color: 'var(--tt-danger)', fontSize: '0.8rem' }}>No stores found in your profile. Please apply as a vendor or add a store first.</span>}
            </div>
          </ExpandableSection>

          <div style={{paddingTop: '1.5rem', marginTop: '0.5rem' }} className='sticky bottom-0'>
            {Object.keys(errors).length > 0 && (
              <div style={{ color: 'var(--tt-danger)', fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 600 }}>
                ⚠️ Please fix the errors in the sections above before submitting.
              </div>
            )}
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="tt-btn tt-btn-primary tt-shimmer" 
              style={{ width: '100%', padding: '1rem' }}
            >
              {isSubmitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Publish Deal Now'}
            </button>
          </div>

        </form>

        {/* Urgency Predictor Sidebar */}
        {/* <div className="tt-card tt-glass" style={{ padding: '1.5rem', position: 'sticky', top: 'var(--tt-nav-height)' }}>
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
        </div> */}

      </div>
    </div>
  );
}
