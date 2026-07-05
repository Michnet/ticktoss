
const supabase_url = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const s3MediaUrl = `${supabase_url}/storage/v1/object/public/uploads/`;
export const s3RenderedMediaUrl = `${supabase_url}/storage/v1/render/image/public/uploads/`;
export const s3RenderedAppMediaUrl = `${supabase_url}/storage/v1/render/image/public/app/`;