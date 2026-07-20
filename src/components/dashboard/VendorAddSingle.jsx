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
import { generateBlurhash } from '@/helpers/blurhash';
import TiptapEditor from '@/components/common/TiptapEditor';
import MediaLibraryModal from './MediaLibraryModal';

function stripHtml(html) {
  return (html || '').replace(/<[^>]*>/g, '').trim();
}

const productSchema = z.object({
  name: z.string().min(5, 'Product name is too short'),
  product_type: z.enum(['simple', 'subscription', 'booking', 'downloadable', 'virtual']).default('simple'),
  short_description: z.string().refine(val => stripHtml(val).length >= 10, 'Provide a brief description'),
  long_description: z.string().optional(),
  price: z.number().min(1000, 'Original price must be valid'),
  sale_price: z.number().min(1000, 'Sale price must be valid'),
  stock: z.number().min(1, 'Must have at least 1 in stock'),
  stock_alert_level: z.number().optional().nullable(),
  unit_cost: z.number().optional().nullable(),
  sale_start_date: z.string().min(1, 'Please select a start date'),
  sale_end_date: z.string().min(1, 'Please select an end date'),
  store_index: z.string().min(1, 'Please select a store'),
  category: z.string().min(1, 'Please select a main category'),
  location: z.string().min(1, 'Please select a location'),
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
}).refine(data => {
  return data.stock_alert_level == null || data.stock_alert_level < data.stock;
}, {
  message: "Alert level must be less than total stock",
  path: ['stock_alert_level'],
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
  const [fullProductData, setFullProductData] = useState(initialData);
  const [selectedTags, setSelectedTags] = useState([]); // Array of {id, name} tag objects
  const [tagSearch, setTagSearch] = useState('');
  const [tagResults, setTagResults] = useState([]);
  const [searchingTags, setSearchingTags] = useState(false);
  const [tagPage, setTagPage] = useState(0);
  const [hasMoreTags, setHasMoreTags] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [featuredImage, setFeaturedImage] = useState(initialData?.featured_image || null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [existingGallery, setExistingGallery] = useState([]);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaModalMode, setMediaModalMode] = useState('featured'); // 'featured' or 'gallery'

  const [productMeta, setProductMeta] = useState(() => {
    try {
      return typeof initialData?.meta === 'string' ? JSON.parse(initialData.meta) : (initialData?.meta || {});
    } catch {
      return {};
    }
  });

  const [codeViews, setCodeViews] = useState({ short: false, long: false });

  // Array to store the hierarchy of selected category IDs
  const [selectedCatIds, setSelectedCatIds] = useState([]);

  const [locations, setLocations] = useState([]);
  // Array to store the hierarchy of selected location IDs. For a new product,
  // default to the vendor's first store so the fields aren't left empty.
  const [selectedLocIds, setSelectedLocIds] = useState(() => {
    if (initialData) return [];
    const defaultStore = stores[0];
    if (defaultStore?.loc_ids?.length) return defaultStore.loc_ids;
    if (defaultStore?.location) return [defaultStore.location];
    return [];
  });
  // Tracks whether the vendor has manually edited the location picker, so a
  // later store change doesn't clobber a deliberate choice.
  const [locationTouched, setLocationTouched] = useState(false);

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
  const [newOptionInputs, setNewOptionInputs] = useState({}); // { attributeId: "new option name" }
  const [addingOption, setAddingOption] = useState(false);
  const [variations, setVariations] = useState([]);
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    async function fetchCountries() {
      try {
        const res = await fetch('/api/vendors/products/countries');
        const result = await res.json();
        if (res.ok) setCountries(result.data || []);
      } catch (error) {
        console.error('Failed to fetch countries:', error);
      }
    }
    fetchCountries();
  }, []);

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
        supabase.from('locations').select('id, name, parent').order('name'),
      ];

      if (isEditMode && initialData?.id) {
        promises.push(supabase.from('products').select('*').eq('id', initialData.id).single());
        promises.push(supabase.from('product_variations').select('*').eq('product_id', initialData.id));
      }

      const results = await Promise.all(promises);
      const catsRes = results[0];
      const locsRes = results[1];
      const productRes = isEditMode ? results[2] : null;
      const variationsRes = isEditMode ? results[3] : null;

      const cats = catsRes?.data;
      const locs = locsRes?.data;
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

      if (locs) {
        setLocations(locs);
        // If dataToUse has loc_ids, set them
        if (dataToUse?.loc_ids && dataToUse.loc_ids.length > 0) {
          setSelectedLocIds(dataToUse.loc_ids);
        } else if (dataToUse?.location) {
          setSelectedLocIds([dataToUse.location]);
        }
      }

      if (dataToUse?.tag_ids?.length > 0) {
        const { data: tagRows } = await supabase.from('tags').select('id, name').in('id', dataToUse.tag_ids);
        if (tagRows) setSelectedTags(tagRows);
      }
      if (dataToUse?.gallery) {
        setExistingGallery(dataToUse.gallery);
      }
      if (dataToUse?.featured_image) {
        setFeaturedImage(dataToUse.featured_image);
      }
      if (variationsRes?.data) {
        setVariations(variationsRes.data);
      }

      // Populate form values if full product data was fetched
      if (product) {
        setValue('name', product.name || '');
        setValue('product_type', product.product_type || 'simple');
        setValue('short_description', product.short_description || '');
        setValue('long_description', product.long_description || '');
        setValue('price', product.price || '');
        setValue('sale_price', product.sale_price || '');
        setValue('stock', product.stock ?? 1);
        setValue('stock_alert_level', product.stock_alert_level ?? '');
        setValue('unit_cost', product.unit_cost || '');

        try {
          setProductMeta(typeof product.meta === 'string' ? JSON.parse(product.meta) : (product.meta || {}));
        } catch {
          setProductMeta({});
        }

        try {
          setAttributeSelections(typeof product.attributes === 'string' ? JSON.parse(product.attributes) : (product.attributes || {}));
        } catch {
          setAttributeSelections({});
        }

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

  // Debounced server-side tag search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (tagSearch.length >= 3) {
        searchTags();
      } else {
        setTagResults([]);
      }
    }, 2000);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagSearch]);

  const searchTags = async () => {
    setSearchingTags(true);
    setTagPage(0);
    try {
      const res = await fetch(`/api/tags?q=${encodeURIComponent(tagSearch)}&page=0&limit=50`);
      const data = await res.json();
      setTagResults(data.data || []);
      setHasMoreTags(data.hasMore || false);
    } catch (error) {
      console.error('Tag search failed:', error);
    } finally {
      setSearchingTags(false);
    }
  };

  const loadMoreTags = async () => {
    if (searchingTags || !hasMoreTags) return;
    setSearchingTags(true);
    const nextPage = tagPage + 1;
    try {
      const res = await fetch(`/api/tags?q=${encodeURIComponent(tagSearch)}&page=${nextPage}&limit=50`);
      const data = await res.json();
      setTagResults(prev => [...prev, ...(data.data || [])]);
      setTagPage(nextPage);
      setHasMoreTags(data.hasMore || false);
    } catch (error) {
      console.error('Loading more tags failed:', error);
    } finally {
      setSearchingTags(false);
    }
  };

  const handleTagSelect = (tag) => {
    if (!selectedTags.some(t => t.id === tag.id)) {
      setSelectedTags(prev => [...prev, tag]);
    }
    setTagSearch('');
    setTagResults([]);
  };

  const removeTag = (tagId) => {
    setSelectedTags(prev => prev.filter(t => t.id !== tagId));
  };

  const createNewTag = async () => {
    if (!tagSearch || searchingTags) return;
    setSearchingTags(true);
    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tagSearch }),
      });
      const newTag = await res.json();
      if (newTag.id) {
        handleTagSelect(newTag);
      } else {
        addToast({ type: 'error', message: newTag.error || 'Failed to create tag' });
      }
    } catch (error) {
      console.error('Failed to create tag:', error);
    } finally {
      setSearchingTags(false);
    }
  };

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
      product_type: initialData?.product_type || 'simple',
      short_description: initialData?.short_description || '',
      long_description: initialData?.long_description || '',
      price: initialData?.price || '',
      sale_price: initialData?.sale_price || '',
      stock: initialData?.stock ?? 1,
      stock_alert_level: initialData?.stock_alert_level ?? '',
      unit_cost: initialData?.unit_cost || '',
      sale_start_date: formatForDateTimeLocal(initialData?.sale_start_date) || formatForDateTimeLocal(new Date().toISOString()),
      sale_end_date: formatForDateTimeLocal(initialData?.sale_end_date) || formatForDateTimeLocal(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()),
      store_index: defaultStoreIndex,
      category: initialData?.category ? String(initialData.category) : '',
      location: initialData?.location ? String(initialData.location) : '',
    },
  });

  const watchPrice = watch('price');
  const watchSalePrice = watch('sale_price');
  const watchStartDate = watch('sale_start_date');
  const watchEndDate = watch('sale_end_date');
  const watchStock = watch('stock');
  const watchProductType = watch('product_type');
  const watchShortDescription = watch('short_description');
  const watchLongDescription = watch('long_description');
  const watchStoreIndex = watch('store_index');

  // For a new product, adopt the selected store's location as the product's
  // location, unless the vendor has deliberately edited the location picker.
  useEffect(() => {
    if (locationTouched) return;
    const store = stores[parseInt(watchStoreIndex)];
    if (!store) return;
    if (store.loc_ids?.length) {
      setSelectedLocIds(store.loc_ids);
    } else if (store.location) {
      setSelectedLocIds([store.location]);
    } else {
      console.warn('[VendorAddSingle] Selected store has no location/loc_ids to auto-fill from:', store);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchStoreIndex]);

  // Keep the RHF `category` field in sync with the category-hierarchy picker,
  // which is driven by plain state rather than a registered input.
  useEffect(() => {
    const lastCat = selectedCatIds.length > 0 ? String(selectedCatIds[selectedCatIds.length - 1]) : '';
    setValue('category', lastCat, { shouldValidate: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCatIds]);

  // Keep the RHF `location` field in sync with the location-hierarchy picker,
  // which is driven by plain state rather than a registered input.
  useEffect(() => {
    const lastLoc = selectedLocIds.length > 0 ? String(selectedLocIds[selectedLocIds.length - 1]) : '';
    setValue('location', lastLoc, { shouldValidate: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLocIds]);

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

  const estimatedScore = computeUrgencyScore({
    saleEndDate: watchEndDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    discountPct: discountPct,
    stock: Number(watchStock) || 1
  });

  let urgencyLevel = 'low';
  if (estimatedScore >= 80) urgencyLevel = 'critical';
  else if (estimatedScore >= 50) urgencyLevel = 'high';
  else if (estimatedScore >= 20) urgencyLevel = 'medium';

  const toggleSection = (id) => {
    setOpenSection(openSection === id ? null : id);
  };

  const toggleAttributeOption = (attr, opt) => {
    const slug = attr.slug;
    setAttributeSelections(prev => {
      const currentAttr = prev[slug] || {
        name: attr.name,
        slug: attr.slug,
        values: [],
        is_variation: false
      };

      const isSelected = currentAttr.values.some(v => v.slug === opt.slug);
      let newValues;

      if (isSelected) {
        newValues = currentAttr.values.filter(v => v.slug !== opt.slug);
      } else {
        newValues = [...currentAttr.values, { name: opt.name, slug: opt.slug }];
      }

      if (newValues.length === 0) {
        const newState = { ...prev };
        delete newState[slug];
        return newState;
      }

      return {
        ...prev,
        [slug]: {
          ...currentAttr,
          values: newValues
        }
      };
    });
  };

  const handleCountrySelect = (attr, countryId) => {
    const slug = attr.slug;
    setAttributeSelections(prev => {
      const country = countries.find(c => String(c.id) === countryId);
      if (!country) {
        const newState = { ...prev };
        delete newState[slug];
        return newState;
      }
      return {
        ...prev,
        [slug]: {
          name: attr.name,
          slug: attr.slug,
          values: [{ name: country.name, slug: country.slug }],
          is_variation: prev[slug]?.is_variation || false
        }
      };
    });
  };

  const handleVariationToggle = (slug) => {
    setAttributeSelections(prev => {
      if (!prev[slug]) return prev;
      return {
        ...prev,
        [slug]: {
          ...prev[slug],
          is_variation: !prev[slug].is_variation
        }
      };
    });
  };

  const handleAddCustomOption = async (attr) => {
    const optionName = newOptionInputs[attr.id];
    if (!optionName || !optionName.trim() || addingOption) return;

    setAddingOption(true);
    try {
      const res = await fetch('/api/vendors/products/attributes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attribute_id: attr.id, option_name: optionName }),
      });
      const result = await res.json();

      if (res.ok && result.attribute) {
        setAvailableAttributes(prev => prev.map(a => (a.id === attr.id ? result.attribute : a)));
        setNewOptionInputs(prev => ({ ...prev, [attr.id]: '' }));
      } else {
        addToast({ type: 'error', message: result.error || 'Failed to add option' });
      }
    } catch (error) {
      console.error('Error adding custom option:', error);
      addToast({ type: 'error', message: 'An error occurred while adding the option.' });
    } finally {
      setAddingOption(false);
    }
  };

  const generateVariations = () => {
    const varAttrs = Object.values(attributeSelections).filter(a => a.is_variation);
    if (varAttrs.length === 0) {
      addToast({ type: 'error', message: 'No attributes marked for variations.' });
      return;
    }

    // Cartesian product generator
    const cartesian = (...a) => a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));

    const attrValues = varAttrs.map(a => a.values.map(v => ({
      attr_slug: a.slug,
      val_slug: v.slug,
      val_name: v.name
    })));

    const combinations = varAttrs.length > 1 ? cartesian(...attrValues) : attrValues[0].map(v => [v]);

    const newVariations = combinations.map(combo => {
      const comboAttrObj = {};
      combo.forEach(c => { comboAttrObj[c.attr_slug] = c.val_slug; });

      // Preserve edits already made to this combination, if it existed before
      const existing = variations.find(v => JSON.stringify(v.attributes) === JSON.stringify(comboAttrObj));
      if (existing) return existing;

      return {
        attributes: comboAttrObj,
        sku: Object.values(comboAttrObj).join('-'),
        price: watchPrice || null,
        sale_price: watchSalePrice || null,
        unit_cost: null,
        stock_quantity: 0
      };
    });

    setVariations(newVariations);
  };

  const handleVariationDataChange = (index, field, value) => {
    const newVars = [...variations];
    newVars[index] = { ...newVars[index], [field]: value };
    setVariations(newVars);
  };

  const removeVariation = (index) => {
    setVariations(variations.filter((_, i) => i !== index));
  };

  const openMediaLibrary = (mode) => {
    setMediaModalMode(mode);
    setShowMediaModal(true);
  };

  const handleMediaSelect = (selected) => {
    if (mediaModalMode === 'featured') {
      setFeaturedImage(selected);
    } else {
      const items = Array.isArray(selected) ? selected : [selected];
      setExistingGallery(prev => {
        const urls = new Set(prev.map(i => i.url));
        const additions = items.filter(i => i?.url && !urls.has(i.url));
        return [...prev, ...additions];
      });
    }
    setShowMediaModal(false);
  };

  const onSubmit = async (data) => {
    const selectedStore = stores[parseInt(data.store_index)];
    if (!selectedStore) {
      addToast({ type: 'error', message: 'Please select a valid store.' });
      return;
    }

    const totalVariationStock = variations.reduce((sum, v) => sum + (parseFloat(v.stock_quantity) || 0), 0);
    if (variations.length > 0 && totalVariationStock > data.stock) {
      addToast({ type: 'error', message: `Total variation stock (${totalVariationStock}) cannot exceed main product stock (${data.stock}).` });
      return;
    }

    // Only fall back to the selected store's own values when the product
    // doesn't already have its own (e.g. a manual override on an existing
    // product should never be silently clobbered by the store default).
    const storePickupLat = selectedStore.pickup_lat || selectedStore.lat || selectedStore.latitude || null;
    const storePickupLng = selectedStore.pickup_lng || selectedStore.lng || selectedStore.longitude || null;
    const storePickupAddress = selectedStore.address || selectedStore.name || '';

    const pickup_lat = fullProductData?.pickup_lat ?? storePickupLat;
    const pickup_lng = fullProductData?.pickup_lng ?? storePickupLng;
    const pickup_address = fullProductData?.pickup_address || storePickupAddress;

    const chosenLocationId = selectedLocIds.length > 0 ? selectedLocIds[selectedLocIds.length - 1] : null;
    const location = chosenLocationId ?? selectedStore.location ?? null;
    const loc_ids = selectedLocIds.length > 0
      ? selectedLocIds
      : (selectedStore.loc_ids?.length ? selectedStore.loc_ids : (selectedStore.location ? [selectedStore.location] : []));

    setIsSubmitting(true);
    try {
      const payload = {
        name: data.name,
        product_type: data.product_type,
        short_description: data.short_description,
        long_description: data.long_description || null,
        price: data.price,
        sale_price: data.sale_price,
        stock: data.stock,
        stock_alert_level: data.stock_alert_level ?? null,
        unit_cost: data.unit_cost || null,
        category: selectedCatIds.length > 0 ? selectedCatIds[selectedCatIds.length - 1] : null,
        cat_ids: selectedCatIds,
        location: location,
        loc_ids: loc_ids,
        tag_ids: selectedTags.map(t => t.id),
        discount_pct: discountPct,
        sale_start_date: new Date(data.sale_start_date).toISOString(),
        sale_end_date: new Date(data.sale_end_date).toISOString(),
        user_id: user.id,
        urgency_score: estimatedScore,
        pickup_address: pickup_address,
        pickup_lat: pickup_lat,
        pickup_lng: pickup_lng,
        tt_location: selectedStore,
        attributes: Object.keys(attributeSelections).length > 0 ? attributeSelections : null,
        featured_image: featuredImage || null,
        meta: Object.keys(productMeta).length > 0 ? productMeta : null,
        status: 'published' // Publish immediately for MVP
      };

      if (!payload.category) {
        addToast({ type: 'error', message: 'Please select a category.' });
        setIsSubmitting(false);
        return;
      }

      if (!payload.location) {
        addToast({ type: 'error', message: 'Please select a location.' });
        setIsSubmitting(false);
        return;
      }

      let productId = fullProductData?.id;

      if (isEditMode) {
        const res = await fetch('/api/vendors/products', {
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
        const res = await fetch('/api/vendors/products', {
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

      // Handle Image Upload if a file was selected. Store the storage path
      // (not the public URL) as `url` so it matches the shape produced by
      // the media library, and attach a blurhash for blur-up rendering.
      if (imageFile && productId) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `featured_${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const [{ error: uploadError }, blurhash] = await Promise.all([
          supabase.storage.from('uploads').upload(filePath, imageFile, { upsert: true }),
          generateBlurhash(imageFile),
        ]);

        if (uploadError) {
          throw new Error('Product saved, but image upload failed: ' + uploadError.message);
        }

        await supabase.from('products').update({
          featured_image: { url: filePath, blurhash }
        }).eq('id', productId);
      }

      // Handle Gallery Images Upload
      let updatedGalleryUrls = [...existingGallery];

      if (galleryFiles.length > 0 && productId) {
        const uploadPromises = galleryFiles.map(async (file, index) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `gallery_${Date.now()}_${index}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;

          const [{ error: uploadError }, blurhash] = await Promise.all([
            supabase.storage.from('uploads').upload(filePath, file, { upsert: true }),
            generateBlurhash(file),
          ]);

          if (uploadError) throw new Error('Gallery image upload failed: ' + uploadError.message);

          return { url: filePath, blurhash };
        });

        const newGalleryEntries = await Promise.all(uploadPromises);
        updatedGalleryUrls = [...updatedGalleryUrls, ...newGalleryEntries.filter(entry => entry.url)];
      }

      // Update the gallery in the database if it changed
      if (updatedGalleryUrls.length > 0 || (isEditMode && existingGallery.length !== (fullProductData?.gallery?.length || 0))) {
         await supabase.from('products').update({
           gallery: updatedGalleryUrls
         }).eq('id', productId);
      }

      // Save variations (replaces the full set for this product)
      if (productId) {
        const finalizedVariations = variations.map(v => ({
          ...(v.id ? { id: v.id } : {}),
          sku: `product-${productId}-${Object.values(v.attributes).join('-')}`,
          price: v.price ?? null,
          sale_price: v.sale_price ?? null,
          unit_cost: v.unit_cost ?? null,
          stock_quantity: v.stock_quantity ?? 0,
          attributes: v.attributes,
        }));

        const variationsRes = await fetch('/api/vendors/products/variations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: productId, variations: finalizedVariations }),
        });

        if (!variationsRes.ok) {
          const errData = await variationsRes.json();
          throw new Error(errData.error || 'Failed to save variations');
        }
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

  // Derive dropdown options for location tiering
  const getLocChildren = (parentId) => locations.filter(l => l.parent === parentId);
  const locDropdownLevels = [getLocChildren(null)];

  for (let i = 0; i < selectedLocIds.length; i++) {
    const children = getLocChildren(selectedLocIds[i]);
    if (children.length > 0) {
      locDropdownLevels.push(children);
    }
  }

  const handleLocationChange = (levelIndex, selectedId) => {
    setLocationTouched(true);
    if (!selectedId) {
      setSelectedLocIds(prev => prev.slice(0, levelIndex));
    } else {
      const newSelection = [...selectedLocIds.slice(0, levelIndex), parseInt(selectedId)];
      setSelectedLocIds(newSelection);
    }
  };

  const handleResetLocations = () => {
    setSelectedLocIds([]);
    setLocationTouched(false);
  };

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
              <label className="tt-label">Product Type</label>
              <select className="tt-input" {...register('product_type')}>
                <option value="simple">📦 Simple Product</option>
                <option value="subscription">💳 Subscription</option>
                <option value="booking">📅 Booking / Appointment</option>
                <option value="downloadable">📥 Downloadable Digital Product</option>
                <option value="virtual">☁️ Virtual Product</option>
              </select>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label className="tt-label" style={{ marginBottom: 0 }}>Short Description</label>
                <button
                  type="button"
                  onClick={() => setCodeViews(prev => ({ ...prev, short: !prev.short }))}
                  className="tt-btn tt-btn-ghost"
                  style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}
                >
                  {codeViews.short ? 'View Formatted' : 'Raw Mode'}
                </button>
              </div>
              {/* {codeViews.short ? ( */}
                <textarea
                  className="tt-input"
                  rows={4}
                  //style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                  value={watchShortDescription}
                  onChange={(e) => setValue('short_description', e.target.value, { shouldValidate: true })}
                />
              {/* ) : (
                <TiptapEditor
                  value={watchShortDescription}
                  onChange={(html) => setValue('short_description', html, { shouldValidate: true })}
                  placeholder="Brief details about the condition and items included."
                  style={{ height: '120px' }}
                />
              )} */}
              {errors.short_description && <span style={{ color: 'var(--tt-danger)', fontSize: '0.8rem' }}>{errors.short_description.message}</span>}
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label className="tt-label" style={{ marginBottom: 0 }}>Long Description (Optional)</label>
                <button
                  type="button"
                  onClick={() => setCodeViews(prev => ({ ...prev, long: !prev.long }))}
                  className="tt-btn tt-btn-ghost"
                  style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}
                >
                  {codeViews.long ? 'View Formatted' : 'Raw Mode'}
                </button>
              </div>
              {codeViews.long ? (
                <textarea
                  className="tt-input"
                  rows={6}
                  style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                  value={watchLongDescription}
                  onChange={(e) => setValue('long_description', e.target.value)}
                />
              ) : (
                <TiptapEditor
                  value={watchLongDescription}
                  onChange={(html) => setValue('long_description', html)}
                  placeholder="Full product details, specifications, and terms."
                  style={{ height: '200px' }}
                />
              )}
            </div>
          </ExpandableSection>

          <ExpandableSection
            id="pricing"
            title="2. Pricing & Inventory"
            isOpen={openSection === 'pricing'}
            onToggle={toggleSection}
            hasError={hasErrors(['price', 'sale_price', 'stock', 'unit_cost', 'stock_alert_level'])}
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
              <div style={{ flex: '1 1 200px' }}>
                <label className="tt-label">Low Stock Alert Level (Optional)</label>
                <input type="number" className="tt-input" placeholder="0" {...register('stock_alert_level', { setValueAs: v => v === '' || Number.isNaN(Number(v)) ? null : Number(v) })} />
                {errors.stock_alert_level && <span style={{ color: 'var(--tt-danger)', fontSize: '0.8rem' }}>{errors.stock_alert_level.message}</span>}
              </div>
            </div>

            {watchProductType === 'subscription' && (
              <div style={{ padding: '1rem', border: '1px solid var(--tt-border)', borderRadius: 'var(--tt-radius-sm)', background: 'var(--tt-surface-2)' }}>
                <label className="tt-label" style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: 'var(--tt-flame)' }}>Subscription Settings</label>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                  <div style={{ flex: '1 1 150px' }}>
                    <label className="tt-label">Billing Interval</label>
                    <input type="number" className="tt-input" placeholder="1" value={productMeta.subscription_interval || ''} onChange={(e) => setProductMeta(prev => ({ ...prev, subscription_interval: e.target.value === '' ? null : parseFloat(e.target.value) }))} />
                  </div>
                  <div style={{ flex: '1 1 150px' }}>
                    <label className="tt-label">Billing Period</label>
                    <select className="tt-input" value={productMeta.subscription_period || 'month'} onChange={(e) => setProductMeta(prev => ({ ...prev, subscription_period: e.target.value }))}>
                      <option value="day">Day(s)</option>
                      <option value="week">Week(s)</option>
                      <option value="month">Month(s)</option>
                      <option value="year">Year(s)</option>
                    </select>
                  </div>
                  <div style={{ flex: '1 1 150px' }}>
                    <label className="tt-label">Trial Period (Days)</label>
                    <input type="number" className="tt-input" placeholder="0" value={productMeta.subscription_trial || ''} onChange={(e) => setProductMeta(prev => ({ ...prev, subscription_trial: e.target.value === '' ? null : parseFloat(e.target.value) }))} />
                  </div>
                </div>
              </div>
            )}

            {watchProductType === 'booking' && (
              <div style={{ padding: '1rem', border: '1px solid var(--tt-border)', borderRadius: 'var(--tt-radius-sm)', background: 'var(--tt-surface-2)' }}>
                <label className="tt-label" style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: 'var(--tt-flame)' }}>Booking Settings</label>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                  <div style={{ flex: '1 1 200px' }}>
                    <label className="tt-label">Duration (Minutes)</label>
                    <input type="number" className="tt-input" placeholder="60" value={productMeta.booking_duration || ''} onChange={(e) => setProductMeta(prev => ({ ...prev, booking_duration: e.target.value === '' ? null : parseFloat(e.target.value) }))} />
                  </div>
                  <div style={{ flex: '1 1 200px' }}>
                    <label className="tt-label">Slots / Capacity</label>
                    <input type="number" className="tt-input" placeholder="1" value={productMeta.booking_slots || ''} onChange={(e) => setProductMeta(prev => ({ ...prev, booking_slots: e.target.value === '' ? null : parseFloat(e.target.value) }))} />
                  </div>
                </div>
              </div>
            )}

            {watchProductType === 'downloadable' && (
              <div style={{ padding: '1rem', border: '1px solid var(--tt-border)', borderRadius: 'var(--tt-radius-sm)', background: 'var(--tt-surface-2)' }}>
                <label className="tt-label" style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: 'var(--tt-flame)' }}>Downloadable Settings</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
                  <div>
                    <label className="tt-label">File URL / Source</label>
                    <input type="text" className="tt-input" placeholder="https://..." value={productMeta.download_url || ''} onChange={(e) => setProductMeta(prev => ({ ...prev, download_url: e.target.value }))} />
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 200px' }}>
                      <label className="tt-label">Download Limit</label>
                      <input type="number" className="tt-input" placeholder="Unlimited" value={productMeta.download_limit || ''} onChange={(e) => setProductMeta(prev => ({ ...prev, download_limit: e.target.value === '' ? null : parseFloat(e.target.value) }))} />
                    </div>
                    <div style={{ flex: '1 1 200px' }}>
                      <label className="tt-label">Download Expiry (Days)</label>
                      <input type="number" className="tt-input" placeholder="Never" value={productMeta.download_expiry || ''} onChange={(e) => setProductMeta(prev => ({ ...prev, download_expiry: e.target.value === '' ? null : parseFloat(e.target.value) }))} />
                    </div>
                  </div>
                </div>
              </div>
            )}
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
                    {selectedTags.map(tag => (
                      <span key={tag.id} style={{
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
                        <button type="button" onClick={() => removeTag(tag.id)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, lineHeight: 1, fontSize: '1rem' }}>&times;</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search tags (min 3 characters)..."
                  className="tt-input"
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                />

                {tagSearch.length >= 3 && (
                  <div style={{ border: '1px solid var(--tt-border)', borderRadius: 'var(--tt-radius-sm)', background: 'var(--tt-surface)', marginTop: '0.5rem', padding: '0.75rem', maxHeight: '200px', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                      {searchingTags && tagResults.length === 0 && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--tt-muted)' }}>Searching...</span>
                      )}
                      {tagResults.map(tag => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => handleTagSelect(tag)}
                          disabled={selectedTags.some(t => t.id === tag.id)}
                          style={{
                            padding: '0.3rem 0.6rem',
                            fontSize: '0.8rem',
                            borderRadius: '99px',
                            border: '1px solid var(--tt-border)',
                            background: 'transparent',
                            color: 'var(--tt-text)',
                            cursor: 'pointer'
                          }}
                        >
                          {tag.name}
                        </button>
                      ))}

                      {hasMoreTags && (
                        <button
                          type="button"
                          onClick={loadMoreTags}
                          disabled={searchingTags}
                          style={{ fontSize: '0.8rem', color: 'var(--tt-flame)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                        >
                          Load More
                        </button>
                      )}

                      {!searchingTags && !tagResults.some(t => t.name.toLowerCase() === tagSearch.toLowerCase()) && (
                        <button
                          type="button"
                          onClick={createNewTag}
                          style={{ fontSize: '0.8rem', color: 'var(--tt-flame)', fontWeight: 600, background: 'transparent', border: 'none', cursor: 'pointer' }}
                        >
                          + Create New Tag: "{tagSearch}"
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--tt-muted)', marginTop: '0.5rem' }}>Type at least 3 characters to search for tags. If not found, you can create it.</p>
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
              {featuredImage?.url && !imageFile && (
                <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <img src={resizedImage(featuredImage.url, 'thumbnail')} alt="Current featured" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: 'var(--tt-radius-sm)' }} />
                  <button type="button" onClick={() => setFeaturedImage(null)} style={{ fontSize: '0.8rem', color: 'var(--tt-danger)', background: 'transparent', border: 'none', cursor: 'pointer' }}>Remove</button>
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input
                  type="file"
                  accept="image/*"
                  className="tt-input"
                  style={{ flex: '1 1 200px' }}
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setImageFile(e.target.files[0]);
                    }
                  }}
                />
                <button type="button" className="tt-btn tt-btn-ghost" onClick={() => openMediaLibrary('featured')}>Browse Library</button>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--tt-muted)', marginTop: '0.5rem' }}>Max file size: 5MB. Recommended square aspect ratio.</p>
            </div>

            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--tt-border)' }}>
              <label className="tt-label">Product Gallery</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="tt-input"
                  style={{ flex: '1 1 200px' }}
                  onChange={e => {
                    if (e.target.files) {
                      setGalleryFiles(prev => [...prev, ...Array.from(e.target.files)]);
                    }
                  }}
                />
                <button type="button" className="tt-btn tt-btn-ghost" onClick={() => openMediaLibrary('gallery')}>Browse Library</button>
              </div>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {availableAttributes.map(attr => (
                    <div key={attr.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <label className="tt-label" style={{ marginBottom: 0 }}>{attr.name}</label>
                        {attr.slug !== 'country_of_origin' && <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--tt-muted)', cursor: attributeSelections[attr.slug] ? 'pointer' : 'not-allowed' }}>
                          <input
                            type="checkbox"
                            checked={attributeSelections[attr.slug]?.is_variation || false}
                            onChange={() => handleVariationToggle(attr.slug)}
                            disabled={!attributeSelections[attr.slug]}
                          />
                          Use for variations
                        </label>}
                      </div>
                      {attr.slug === 'country_of_origin' ? (
                        <select
                          className="tt-input"
                          value={countries.find(c => c.slug === attributeSelections[attr.slug]?.values?.[0]?.slug)?.id ?? ''}
                          onChange={(e) => handleCountrySelect(attr, e.target.value)}
                        >
                          <option value="">Select a country...</option>
                          {countries.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '0.5rem', border: '1px solid var(--tt-border)', borderRadius: 'var(--tt-radius-sm)', background: 'var(--tt-surface)' }}>
                          {attr.options?.map(opt => {
                            const isSelected = attributeSelections[attr.slug]?.values?.some(v => v.slug === opt.slug);
                            return (
                              <button
                                key={opt.slug}
                                type="button"
                                onClick={() => toggleAttributeOption(attr, opt)}
                                style={{
                                  padding: '0.3rem 0.6rem',
                                  fontSize: '0.8rem',
                                  borderRadius: '99px',
                                  border: '1px solid',
                                  borderColor: isSelected ? 'var(--tt-flame)' : 'var(--tt-border)',
                                  background: isSelected ? 'rgba(255, 77, 0, 0.1)' : 'transparent',
                                  color: isSelected ? 'var(--tt-flame)' : 'var(--tt-text)',
                                  cursor: 'pointer'
                                }}
                              >
                                {opt.name}
                              </button>
                            );
                          })}
                          {attr.custom_options && (
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <input
                                type="text"
                                placeholder="Add custom..."
                                className="tt-input"
                                style={{ width: '150px', padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                                value={newOptionInputs[attr.id] || ''}
                                onChange={(e) => setNewOptionInputs(prev => ({ ...prev, [attr.id]: e.target.value }))}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomOption(attr))}
                              />
                              <button
                                type="button"
                                onClick={() => handleAddCustomOption(attr)}
                                disabled={addingOption || !newOptionInputs[attr.id]?.trim()}
                                className="tt-btn tt-btn-ghost"
                                style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}
                              >
                                {addingOption ? '...' : '+ Add'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--tt-muted)' }}>
                  Select a category to see relevant attributes.
                </p>
              )}

              {Object.values(attributeSelections).some(a => a.is_variation) && (
                variations.length > 0 ? (
                  <div style={{ marginTop: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <label className="tt-label" style={{ marginBottom: 0 }}>Product Variations</label>
                      <button type="button" onClick={generateVariations} className="tt-btn tt-btn-ghost" style={{ fontSize: '0.8rem' }}>Re-generate</button>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ textAlign: 'left', color: 'var(--tt-muted)', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                            <th style={{ padding: '0.5rem' }}>Attributes</th>
                            <th style={{ padding: '0.5rem' }}>SKU</th>
                            <th style={{ padding: '0.5rem' }}>Unit Cost</th>
                            <th style={{ padding: '0.5rem' }}>Price</th>
                            <th style={{ padding: '0.5rem' }}>Sale Price</th>
                            <th style={{ padding: '0.5rem' }}>Stock</th>
                            <th style={{ padding: '0.5rem' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {variations.map((v, idx) => (
                            <tr key={idx} style={{ borderTop: '1px solid var(--tt-border)' }}>
                              <td style={{ padding: '0.5rem' }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                                  {Object.values(v.attributes).map((val, i) => (
                                    <span key={i} style={{ background: 'var(--tt-surface-2)', border: '1px solid var(--tt-border)', borderRadius: '6px', padding: '0.1rem 0.4rem', fontSize: '0.75rem' }}>{val}</span>
                                  ))}
                                </div>
                              </td>
                              <td style={{ padding: '0.5rem', color: 'var(--tt-muted)' }}>{v.sku}</td>
                              <td style={{ padding: '0.5rem' }}>
                                <input type="number" className="tt-input" style={{ width: '100px' }} value={v.unit_cost ?? ''} onChange={(e) => handleVariationDataChange(idx, 'unit_cost', e.target.value === '' ? null : parseFloat(e.target.value))} />
                              </td>
                              <td style={{ padding: '0.5rem' }}>
                                <input type="number" className="tt-input" style={{ width: '100px' }} value={v.price ?? ''} onChange={(e) => handleVariationDataChange(idx, 'price', e.target.value === '' ? null : parseFloat(e.target.value))} />
                              </td>
                              <td style={{ padding: '0.5rem' }}>
                                <input type="number" className="tt-input" style={{ width: '100px' }} value={v.sale_price ?? ''} onChange={(e) => handleVariationDataChange(idx, 'sale_price', e.target.value === '' ? null : parseFloat(e.target.value))} />
                              </td>
                              <td style={{ padding: '0.5rem' }}>
                                <input type="number" className="tt-input" style={{ width: '80px' }} value={v.stock_quantity ?? 0} onChange={(e) => handleVariationDataChange(idx, 'stock_quantity', parseInt(e.target.value) || 0)} />
                              </td>
                              <td style={{ padding: '0.5rem' }}>
                                <button type="button" onClick={() => removeVariation(idx)} style={{ background: 'transparent', border: 'none', color: 'var(--tt-danger)', cursor: 'pointer', fontSize: '1rem' }}>&times;</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', marginTop: '1.5rem', padding: '1.5rem', border: '1px dashed var(--tt-border)', borderRadius: 'var(--tt-radius-sm)' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--tt-muted)', marginBottom: '0.75rem' }}>You have attributes set for variations. Generate them to set specific prices and stock.</p>
                    <button type="button" onClick={generateVariations} className="tt-btn tt-btn-primary" style={{ padding: '0.5rem 1.5rem' }}>Generate Variations</button>
                  </div>
                )
              )}
            </div>
          </ExpandableSection>

          <ExpandableSection
            id="location"
            title="6. Scheduling & Location"
            isOpen={openSection === 'location'}
            onToggle={toggleSection}
            hasError={hasErrors(['sale_start_date', 'sale_end_date', 'store_index', 'location']) || selectedLocIds.length === 0}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label className="tt-label" style={{ marginBottom: 0 }}>Listing Location</label>
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

            <div>
              <label className="tt-label">Select Store</label>
              <select className="tt-input" {...register('store_index')}>
                <option value="">-- Choose a store --</option>
                {stores.map((store, idx) => (
                  <option key={idx} value={idx}>
                    {store.name} {store.address ? `(${store.address})` : ''}
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

      {showMediaModal && (
        <MediaLibraryModal
          userId={user?.id}
          multiple={mediaModalMode === 'gallery'}
          linkedImages={[featuredImage, ...existingGallery].filter(img => img?.url)}
          onSelect={handleMediaSelect}
          onClose={() => setShowMediaModal(false)}
        />
      )}
    </div>
  );
}
