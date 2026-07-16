import { NextResponse } from 'next/server';
import { isJijiUrl, fetchJijiListings } from '@/lib/importers/jiji';

export async function POST(request) {
  try {
    const { profileUrl, priceMode } = await request.json();
    if (!profileUrl) {
      return NextResponse.json({ success: false, error: 'Please provide a URL to import from.' }, { status: 400 });
    }

    if (!isJijiUrl(profileUrl)) {
      return NextResponse.json({ success: false, error: 'Unsupported platform. Currently only Jiji.ug links are supported.' }, { status: 400 });
    }

    const { products, hasMore, nextUrl } = await fetchJijiListings(profileUrl, {
      priceMode: priceMode === 'sale_price' ? 'sale_price' : 'price',
    });

    if (products.length === 0) {
      return NextResponse.json({ success: false, error: 'No listings found for that seller.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, products, hasMore, nextUrl });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Import failed' }, { status: 500 });
  }
}
