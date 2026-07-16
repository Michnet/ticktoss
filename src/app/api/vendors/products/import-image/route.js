import { NextResponse } from 'next/server';
import { isAllowedImageHost } from '@/lib/importers/jiji';

// Re-hosts an externally-sourced image (from a platform import) through the
// server so the browser can upload it into our own Storage bucket without
// hitting cross-origin restrictions. Restricted to an allowlist of known
// import-source hosts so this can't be used as an open image proxy.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 });
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
  }

  if (!isAllowedImageHost(parsed.hostname)) {
    return NextResponse.json({ error: 'Image host not allowed' }, { status: 403 });
  }

  const res = await fetch(parsed.toString());
  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 502 });
  }

  const buffer = await res.arrayBuffer();
  return new NextResponse(buffer, {
    headers: { 'Content-Type': res.headers.get('content-type') || 'image/jpeg' },
  });
}
