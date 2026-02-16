export const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

/**
 * Generic Strapi fetch helper
 */
async function fetchStrapi(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`/api${endpoint}`, STRAPI_URL);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const res = await fetch(url.toString(), { cache: 'no-store' });

  if (!res.ok) {
    throw new Error(`Strapi fetch failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * Helper to build Strapi media URL from relative path
 */
export function getStrapiMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${STRAPI_URL}${url}`;
}

/**
 * Transform Strapi response to match the shape the frontend expects
 * (flattens the Strapi { id, attributes } structure if present)
 */
function flattenStrapiItem(item: any): any {
  if (!item) return null;

  // Strapi v5 returns flat data by default (no nested attributes)
  // but let's handle both formats for safety
  if (item.attributes) {
    return { id: item.id, ...item.attributes };
  }
  return item;
}

function transformMedia(mediaArray: any[]): any[] {
  if (!mediaArray || !Array.isArray(mediaArray)) return [];
  return mediaArray.map((m: any) => ({
    id: m.id,
    file_name: m.name || m.fileName,
    file_type: m.mime || '',
    preview_url: getStrapiMediaUrl(m.url),
    download_url: getStrapiMediaUrl(m.url),
  }));
}

function transformVariant(variant: any): any {
  const v = flattenStrapiItem(variant);
  if (!v) return v;

  return {
    ...v,
    media: transformMedia(v.media),
  };
}

export function transformProduct(product: any): any {
  const p = flattenStrapiItem(product);
  if (!p) return p;

  return {
    ...p,
    variants: (p.variants || []).map((v: any) => transformVariant(v)),
  };
}

/**
 * Fetch all products with nested variants and media
 */
export async function getProducts() {
  const response = await fetchStrapi('/products', {
    'populate[variants][populate]': 'media',
    'pagination[pageSize]': '100',
    'status': 'published',
  });

  return (response.data || []).map((item: any) => transformProduct(item));
}

/**
 * Fetch a single product by parent_sku with its variants and media
 */
export async function getProductBySku(parentSku: string) {
  const response = await fetchStrapi('/products', {
    'filters[parent_sku][$eq]': parentSku,
    'populate[variants][populate]': 'media',
    'status': 'published',
  });

  const items = response.data || [];
  if (items.length === 0) return null;

  return transformProduct(items[0]);
}

/**
 * Access a private collection by slug and password
 */
export async function accessPrivateCollection(slug: string, password: string) {
  const response = await fetch(`${STRAPI_URL}/api/private-collections/access`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ slug, password }),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new Error('Invalid password');
    if (response.status === 404) throw new Error('Collection not found');
    throw new Error('Failed to access collection');
  }

  const collection = await response.json();

  // Transform products within the collection
  if (collection.products && Array.isArray(collection.products)) {
    collection.products = collection.products.map(transformProduct);
  }

  return collection;
}