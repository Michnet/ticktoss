import { cache } from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/public';
import { mapProductData } from '@/lib/productHelpers';
import { constructMetadata, generateProductSchema } from '@/lib/seo';
import ProductClientPage from './ProductClientPage';
import { resizedImage } from '@/helpers/universal';

// Revalidate every 60s — flash-sale price/stock changes stay reasonably fresh
// without rebuilding the whole site on every write.
export const revalidate = 60;

export async function generateStaticParams() {
  const supabase = createClient();
  const { data } = await supabase
    .from('products')
    .select('slug')
    .eq('status', 'published');

  return (data ?? []).map(({ slug }) => ({ slug }));
}

// Shared per-request so generateMetadata and the page body don't double-fetch.
const getProduct = cache(async (slug) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      profiles:user_id(id, display_name, avatar),
      category:product_categories(id, name, slug, color, icon),
      product_variations(id, sku, price, sale_price, stock_quantity, attributes, featured_image, status),
      reviews(id, user_id, content, scores, overall_score, approved)
    `)
    .eq('slug', slug)
    .single();

  if (error || !data) return null;

  // Resolve tag objects from tag_ids array
  let resolvedTags = [];
  if (data.tag_ids?.length) {
    const { data: tagsData } = await supabase
      .from('tags')
      .select('id, name, slug, count')
      .in('id', data.tag_ids);
    resolvedTags = tagsData ?? [];
  }

  // Resolve all category objects from cat_ids array (full set, not just primary)
  let resolvedCategories = [];
  if (data.cat_ids?.length) {
    const { data: catsData } = await supabase
      .from('product_categories')
      .select('id, name, slug, color, icon, image_icon, description')
      .in('id', data.cat_ids);
    resolvedCategories = catsData ?? [];
  }

  return mapProductData({ ...data, tags: resolvedTags, all_categories: resolvedCategories });
});

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return constructMetadata({
      title: 'Product Not Found',
      description: 'The requested product could not be found.',
      noIndex: true,
    });
  }

  const imageUrl = product.featured_image?.url || product.featured_image?.src || null;
  const url = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://ticktoss.com'}/products/${product.slug}`;

  return constructMetadata({
    title: product.name,
    description: product.short_description || product.name,
    image: resizedImage(imageUrl, 'large'),
    url,
  });
}

export default async function ProductDetailPage({ params }) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  const jsonLd = generateProductSchema(product);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductClientPage product={product} />
    </>
  );
}
