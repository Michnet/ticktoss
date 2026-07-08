export function constructMetadata({
  title = "TickToss — Uganda's Urgency Marketplace",
  description = "Discover deeply discounted deals with a countdown clock.",
  image,
  url,
  noIndex = false,
  ...rest
} = {}) {
  const defaultImage = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://ticktoss.com'}/og-image.jpg`; // Placeholder default

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      images: [
        {
          url: image || defaultImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image || defaultImage],
    },
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
    ...rest,
  };
}

export function generateProductSchema(product) {
  const url = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://ticktoss.com'}/products/${product.slug}`;
  const imageUrl = product.featured_image?.url || product.featured_image?.src || '';
  const price = product.sale_price || product.price || 0;
  
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: imageUrl ? [imageUrl] : [],
    description: product.short_description || product.name,
    sku: product.sku || product.id?.toString(),
    brand: {
      '@type': 'Brand',
      name: product.profiles?.display_name || 'TickToss Vendor',
    },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'UGX',
      price: price.toString(),
      availability: (product.stock > 0 || product.stock === null) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: product.profiles?.display_name || 'TickToss Vendor',
      },
    },
  };

  if (product.sale_end_date) {
    schema.offers.priceValidUntil = new Date(product.sale_end_date).toISOString().split('T')[0];
  }

  // Aggregate Reviews
  if (product.reviews && Array.isArray(product.reviews)) {
    const validReviews = product.reviews.filter(r => r.approved || r.approved === undefined);
    if (validReviews.length > 0) {
      const sum = validReviews.reduce((acc, curr) => acc + (curr.overall_score || 0), 0);
      const avg = sum / validReviews.length;
      
      schema.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: avg.toFixed(1),
        reviewCount: validReviews.length,
        bestRating: '5',
        worstRating: '1',
      };
      
      schema.review = validReviews.slice(0, 5).map(review => ({
        '@type': 'Review',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: (review.overall_score || 0).toString(),
          bestRating: '5',
          worstRating: '1'
        },
        author: {
          '@type': 'Person',
          name: review.user_name || 'Anonymous'
        },
        reviewBody: review.content || ''
      }));
    }
  }

  return schema;
}
