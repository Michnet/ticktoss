'use client';

import { createContext, useContext, useState, useMemo } from 'react';
import { alignAttributes } from '@/lib/productHelpers';

const ProductContext = createContext();

export const useProductContext = () => useContext(ProductContext);

export const ProductProvider = ({ children, product }) => {
    const [selectedOptions, setSelectedOptions] = useState({});
    
    // Extract variations from the fetched product data (via the join in useProduct)
    const variations = product?.product_variations || [];

    // Use alignAttributes to parse the raw JSONB attributes into standardized formats
    const alignedAttributes = useMemo(() => {
        return alignAttributes(product?.attributes);
    }, [product?.attributes]);

    const variationAttributes = useMemo(() => {
        return alignedAttributes.filter(a => a.is_variation);
    }, [alignedAttributes]);

    const metaAttributes = useMemo(() => {
        return alignedAttributes.filter(a => !a.is_variation);
    }, [alignedAttributes]);

    const selectedVariation = useMemo(() => {
        if (variationAttributes.length === 0) return null;
        
        const allSelected = variationAttributes.every(attr => !!selectedOptions[attr.slug]);
        if (!allSelected) return null;

        return variations.find(v => {
            if (!v.attributes) return false;
            // Handle variation.attributes matching the selected options
            return variationAttributes.every(attr => {
                 return v.attributes[attr.slug] === selectedOptions[attr.slug];
            });
        });
    }, [selectedOptions, variations, variationAttributes]);

    const updateOption = (slug, valueSlug) => {
        setSelectedOptions(prev => ({
            ...prev,
            [slug]: prev[slug] === valueSlug ? null : valueSlug
        }));
    };

    const value = {
        product,
        variations,
        variationAttributes,
        metaAttributes,
        selectedOptions,
        selectedVariation,
        updateOption
    };

    return (
        <ProductContext.Provider value={value}>
            {children}
        </ProductContext.Provider>
    );
};
