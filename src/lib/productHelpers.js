/**
 * Maps database product data to the local UI structure, 
 * calculating flash sales, discounts, and badges.
 */
export const mapProductData = (item) => {
    const isFlashSale = item.sale_price && item.sale_price < item.price;
    const badges = [];

    if (item.is_featured) {
        badges.push({ text: "Featured", color: "danger" });
    }

    if (isFlashSale) {
        badges.push({ text: "Sale", color: "warning" });
    }

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const updatedAt = new Date(item.updated_at || item.created_at);
    if (updatedAt > oneMonthAgo) {
        badges.push({ text: "New", color: "success" });
    }

    const primaryBadge = badges[0] || { text: "", color: "" };

    return {
        ...item,
        title: item.name,
        new_price: item.sale_price || item.price,
        old_price: isFlashSale ? item.price : null,
        discount: isFlashSale ? Math.round(((item.price - item.sale_price) / item.price) * 100) : 0,
        discountAmount: isFlashSale ? Math.round((item.price - item.sale_price)) : 0,
        img: item.featured_image?.url || item.featured_image?.src || null,
        badge_text: primaryBadge.text,
        badge_color: primaryBadge.color,
        badges,
    };
};

/**
 * Aligns product attributes between old (array) and new (object) formats
 * so they can be rendered consistently in the UI.
 * 
 * New format: Object where keys are slugs
 * Old format: Array of objects
 */
export const alignAttributes = (attributes) => {
    if (!attributes) return [];

    // New format: Object of objects
    if (typeof attributes === 'object' && !Array.isArray(attributes)) {
        return Object.values(attributes);
    }

    // Old format: Array of objects
    if (Array.isArray(attributes)) {
        return attributes.map(attr => ({
            name: attr.name,
            slug: attr.slug || attr.name?.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, ''),
            values: attr.options?.map(opt => ({
                name: opt.name,
                slug: opt.slug || opt.name?.toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, '')
            })) || [],
            is_variation: attr.variation || false,
            visible: attr.visible !== undefined ? attr.visible : true
        }));
    }

    return [];
};
