// src/lib/orderUtils.js

/**
 * Maps frontend cart items to the database-compatible items JSON array.
 * Ensures only necessary fields are sent.
 */
export const formatLineItems = (cartItems) => {
  return cartItems.map(item => ({
    product_id: item.id || item.product_id,
    name: item.name,
    attributes: item.attributes || {},
    quantity: item.quantity || 1,
    price: item.price || item.sale_price || 0,
    vendor_id: item.user_id || null,
    image: item.featured_image || item.image || null,
  }));
};

/**
 * Clusters an array of cart items by their vendor_id.
 * Returns an array of objects: { vendor_id, items }
 */
export const clusterItemsByVendor = (cartItems) => {
  const clusters = {};

  cartItems.forEach(item => {
    // If no vendor_id is present, group them under 'system'
    const vendorId = item.user_id || 'system';
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
