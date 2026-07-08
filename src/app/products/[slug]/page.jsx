import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { mapProductData } from '@/lib/productHelpers';
import { constructMetadata, generateProductSchema } from '@/lib/seo';
import ProductClientPage from './ProductClientPage';

// Helper function to fetch product for SEO
async function getProductForSEO(slug) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      profiles:user_id(id, display_name, avatar),
      product_categories(id, name, slug, color, icon),
      product_variations(id, sku, price, sale_price, stock_quantity, attributes, featured_image, status),
      reviews(id, user_id, content, scores, overall_score, approved)
    `)
    .eq('slug', slug)
    .single();

  if (error || !data) return null;
  return mapProductData(data);
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await getProductForSEO(slug);

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
    image: imageUrl,
    url,
  });
}

export default async function ProductDetailPage({ params }) {
  const { slug } = await params;
  const product = await getProductForSEO(slug);

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
      <ProductClientPage slug={slug} />
    </>
  );
}
