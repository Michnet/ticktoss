// src/lib/orderUtils.js

/**
 * Clusters an array of order line items (each already carrying a
 * resolved `vendor_id`) by vendor. Returns an array of objects:
 * { vendor_id, items } — one entry per vendor, each becoming its own
 * product_orders row.
 */
export const clusterItemsByVendor = (items) => {
  const clusters = {};

  items.forEach(item => {
    // If no vendor_id is present, group them under 'system'
    const vendorId = item.vendor_id || 'system';
    if (!clusters[vendorId]) {
      clusters[vendorId] = [];
    }
    clusters[vendorId].push(item);
  });

  return Object.keys(clusters).map(vendorId => ({
    vendor_id: vendorId === 'system' ? null : vendorId,
    items: clusters[vendorId]
  }));
};

/**
 * Computes the total_amount for a specific subset of items securely.
 */
export const calculateOrderTotal = (items, shippingCost = 0) => {
  const subtotal = items.reduce((sum, item) => {
    const price = item.price || item.sale_price || 0;
    const quantity = item.quantity || 1;
    return sum + (price * quantity);
  }, 0);
  
  return subtotal + shippingCost;
};

/**
 * Generates a unique alphanumeric tracking string using a prefix.
 */
export const generateTrackingNumber = (prefix = 'TT') => {
  const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
  const timestamp = Date.now().toString().slice(-4);
  return `${prefix}-${randomChars}${timestamp}`;
};

/**
 * Resolves who to contact about a single order item — the store snapshot
 * saved on the item at order time (item.tt_location), falling back to the
 * vendor's first listed store for orders placed before that snapshot
 * existed. Contact is resolved per item (not per order) since a vendor can
 * run multiple stores and a buyer's items may not all come from one.
 */
export const getItemContact = (item, vendorProfile) => {
  const loc = item?.tt_location || vendorProfile?.tt_stores?.[0] || null;
  if (!loc) return null;

  return {
    storeName: loc.name || vendorProfile?.display_name || 'Vendor',
    phone: loc.calls?.[0] || null,
    whatsapp: loc.whatsapp?.[0] || null,
    address: loc.address || loc.location || null,
  };
};
