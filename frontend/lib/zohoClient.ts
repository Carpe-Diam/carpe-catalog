/**
 * Zoho CRM Data Client
 *
 * Fetches products and variants from Zoho CRM
 * and transforms them into the shape the frontend expects.
 */

import { getAccessToken } from './zohoAuth';

const ZOHO_API_DOMAIN = process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.in';

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

// These match the existing frontend types exactly
export type Media = {
    id: string | number;
    file_name: string;
    file_type: string;
    preview_url: string;
    download_url: string;
};

export type Variant = {
    variant_sku: string;
    carat_weight?: string | null;
    dia_quality?: string | null;
    metal_type?: string | null;
    metal_color?: string | null;
    setting?: string | null;
    diamond_count?: number | null;
    model?: string | null;
    dimensions?: string | null;
    weight_grams?: number | null;
    total_cost: number;
    media: Media[];
    // Additional Zoho fields
    ring_size?: string | null;
    style_size_inch?: string | null;
    website_name?: string | null;
    website_description?: string | null;
    raw_material_details?: string | null;
    sell_price_a?: number | null;
    sell_price_b?: number | null;
    sell_price_c?: number | null;
    sell_price_d?: number | null;
};

export type Product = {
    id: string | number;
    parent_sku: string;
    title: string;
    category?: string | null;
    subcategory?: string | null;
    base_price?: number | null;
    others?: string | null;
    variants: Variant[];
    // Additional Zoho fields
    website_name?: string | null;
    collection?: string | null;
    collection_2?: string | null;
};

/* -------------------------------------------------------------------------- */
/*                              ZOHO API HELPERS                              */
/* -------------------------------------------------------------------------- */

/**
 * Generic Zoho CRM API fetch helper
 */
async function fetchZoho(endpoint: string): Promise<any> {
    const token = await getAccessToken();

    const res = await fetch(`${ZOHO_API_DOMAIN}/crm/v7${endpoint}`, {
        headers: {
            Authorization: `Zoho-oauthtoken ${token}`,
        },
        cache: 'no-store',
    });

    // Zoho returns 204 No Content when search finds no results
    if (res.status === 204) {
        return { data: [] };
    }

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Zoho API error: ${res.status} — ${errorText}`);
    }

    const text = await res.text();
    if (!text) {
        return { data: [] };
    }

    return JSON.parse(text);
}

/**
 * Fetch all pages of results from Zoho CRM (handles pagination)
 */
async function fetchAllPages(
    baseEndpoint: string,
    fields: string[],
    extraParams: string = ''
): Promise<any[]> {
    const allRecords: any[] = [];
    let pageToken: string | null = null;
    let hasMore = true;

    while (hasMore) {
        let url = `${baseEndpoint}?fields=${fields.join(',')}&per_page=200`;
        if (extraParams) url += `&${extraParams}`;
        if (pageToken) url += `&page_token=${pageToken}`;

        const response = await fetchZoho(url);

        if (response.data) {
            allRecords.push(...response.data);
        }

        hasMore = response.info?.more_records ?? false;
        pageToken = response.info?.next_page_token ?? null;
    }

    return allRecords;
}

/* -------------------------------------------------------------------------- */
/*                           MEDIA URL HELPER                                 */
/* -------------------------------------------------------------------------- */

/**
 * Returns the media URL. Zoho WorkDrive URLs require auth, so we proxy them.
 */
export function getMediaUrl(url: string | null | undefined): string {
    if (!url) return '';
    // Route Zoho WorkDrive URLs through our proxy to avoid 401
    if (url.includes('zoho.in') || url.includes('zoho.com')) {
        return `/api/image-proxy?url=${encodeURIComponent(url)}`;
    }
    return url;
}

/* -------------------------------------------------------------------------- */
/*                           DATA TRANSFORMATION                              */
/* -------------------------------------------------------------------------- */

// Product fields to fetch from Zoho CRM
const PRODUCT_FIELDS = [
    'id',
    'Product_Name',
    'Product_Code',
    'Category',
    'Sub_Category',
    'Website_name',
    'Product_Active',
    'Collection',
    'Collection_2',
];

// Variant fields to fetch from Zoho CRM
const VARIANT_FIELDS = [
    'id',
    'Name',
    'Product_Design',
    'Variant_Image',
    'Record_Image',
    'Gross_Weight',
    'Total_Diamonds',
    'Cost_Price',
    'Total_Price',
    'A_Sell_Price',
    'B_Sell_Price',
    'C_Sell_Price',
    'D_Sell_Price',
    'Ring_Size',
    'Style_Size_Inch',
    'Website_name',
    'Website_description',
    'Website_Raw_material_details',
    // TODO: Add these custom field API names once created in Zoho CRM:
    // 'Metal_Type', 'Metal_Color', 'Dia_Quality', 'Carat_Weight', 'Setting', 'Diamond_Count'
];

/**
 * Parse variant attributes from the SKU name.
 * SKU format: {ProductName}-{MetalType}-{Carat}-{Color}-{...extra segments}
 *
 * Examples:
 *   SE022-G-10-W-4           → Gold, 10K, White
 *   CR10000-G-18-W-6         → Gold, 18K, White
 *   SR0001-G-10-Y-D-L-2-...  → Gold, 10K, Yellow
 *   CBR-G-22-W-S-SS-...      → Gold, 22K, White
 */
const METAL_TYPE_MAP: Record<string, string> = {
    G: 'Gold',
    S: 'Silver',
    P: 'Platinum',
};

const METAL_COLOR_MAP: Record<string, string> = {
    W: 'White',
    Y: 'Yellow',
    R: 'Rose',
};

function parseVariantSku(variantSku: string, parentSku: string) {
    // Remove the parent product name prefix to get the attribute segments
    let suffix = variantSku;
    if (variantSku.startsWith(parentSku + '-')) {
        suffix = variantSku.slice(parentSku.length + 1);
    }

    const parts = suffix.split('-');

    let metalType: string | null = null;
    let caratWeight: string | null = null;
    let metalColor: string | null = null;

    // Part 0: Metal Type (G/S/P)
    if (parts.length >= 1 && METAL_TYPE_MAP[parts[0]]) {
        metalType = METAL_TYPE_MAP[parts[0]];
    }

    // Part 1: Carat Weight (10, 14, 18, 22, etc.)
    if (parts.length >= 2 && /^\d+$/.test(parts[1])) {
        caratWeight = parts[1];
    }

    // Part 2: Metal Color (W/Y/R) — only if it matches known colors
    if (parts.length >= 3 && METAL_COLOR_MAP[parts[2]]) {
        metalColor = METAL_COLOR_MAP[parts[2]];
    }

    return { metalType, caratWeight, metalColor };
}

/**
 * Transform a Zoho variant record into the frontend Variant type
 */
function transformVariant(zohoVariant: any, parentSku: string = ''): Variant {
    // Build media array using the CRM record photo API
    // (WorkDrive preview URLs in Variant_Image are inaccessible externally)
    const media: Media[] = [];

    // Use CRM record photo endpoint if the record has an image
    if (zohoVariant.Record_Image || zohoVariant.Variant_Image) {
        const photoUrl = `/api/image-proxy?module=Product_Variants&id=${zohoVariant.id}`;
        media.push({
            id: `img-${zohoVariant.id}`,
            file_name: 'variant-image',
            file_type: 'image/jpeg',
            preview_url: photoUrl,
            download_url: photoUrl,
        });
    }

    // Find the lowest non-zero sell price
    const prices = [
        zohoVariant.A_Sell_Price,
        zohoVariant.B_Sell_Price,
        zohoVariant.C_Sell_Price,
        zohoVariant.D_Sell_Price,
    ].filter((p) => p != null && p > 0);

    const lowestPrice = prices.length > 0 ? Math.min(...prices) : zohoVariant.Total_Price ?? 0;

    // Parse attributes from SKU name (fallback if Zoho custom fields don't exist)
    const parsed = parseVariantSku(zohoVariant.Name || '', parentSku);

    return {
        variant_sku: zohoVariant.Name || '',
        metal_type: zohoVariant.Metal_Type ?? parsed.metalType,
        metal_color: zohoVariant.Metal_Color ?? parsed.metalColor,
        dia_quality: zohoVariant.Dia_Quality ?? null,
        carat_weight: zohoVariant.Carat_Weight ?? parsed.caratWeight,
        setting: zohoVariant.Setting ?? null,
        diamond_count: zohoVariant.Diamond_Count ?? zohoVariant.Total_Diamonds ?? null,
        weight_grams: zohoVariant.Gross_Weight ?? null,
        total_cost: lowestPrice,
        dimensions: zohoVariant.Style_Size_Inch ?? null,
        ring_size: zohoVariant.Ring_Size ?? null,
        style_size_inch: zohoVariant.Style_Size_Inch ?? null,
        website_name: zohoVariant.Website_name ?? null,
        website_description: zohoVariant.Website_description ?? null,
        raw_material_details: zohoVariant.Website_Raw_material_details ?? null,
        sell_price_a: zohoVariant.A_Sell_Price ?? null,
        sell_price_b: zohoVariant.B_Sell_Price ?? null,
        sell_price_c: zohoVariant.C_Sell_Price ?? null,
        sell_price_d: zohoVariant.D_Sell_Price ?? null,
        media,
    };
}

/**
 * Transform a Zoho product record + its variants into the frontend Product type
 */
function transformProduct(zohoProduct: any, variants: Variant[]): Product {
    // base_price = lowest total_cost across all variants
    const prices = variants.map((v) => v.total_cost).filter((p) => p > 0);
    const basePrice = prices.length > 0 ? Math.min(...prices) : null;

    return {
        id: zohoProduct.id,
        parent_sku: zohoProduct.Product_Name || zohoProduct.Product_Code || '',
        title: zohoProduct.Website_name || zohoProduct.Product_Name || '',
        category: zohoProduct.Category ?? null,
        subcategory: zohoProduct.Sub_Category ?? null,
        base_price: basePrice,
        others: null,
        website_name: zohoProduct.Website_name ?? null,
        collection: zohoProduct.Collection ?? null,
        collection_2: zohoProduct.Collection_2 ?? null,
        variants,
    };
}

/* -------------------------------------------------------------------------- */
/*                             PUBLIC API                                     */
/* -------------------------------------------------------------------------- */

/**
 * Fetch all active products with their variants
 */
export async function getProducts(): Promise<Product[]> {
    // 1. Fetch all products
    const allProducts = await fetchAllPages(
        '/Products',
        PRODUCT_FIELDS
    );

    // 2. Filter to only active products (client-side)
    const products = allProducts.filter((p: any) => p.Product_Active !== false);

    if (!products.length) return [];

    // 2. Fetch all variants
    const variants = await fetchAllPages('/Product_Variants', VARIANT_FIELDS);

    // 3. Group variants by parent product ID and build a product name map
    const productNameById: Record<string, string> = {};
    for (const p of products) {
        productNameById[p.id] = p.Product_Name || '';
    }

    const variantsByProductId: Record<string, Variant[]> = {};
    for (const v of variants) {
        const productId = v.Product_Design?.id;
        if (!productId) continue;
        if (!variantsByProductId[productId]) variantsByProductId[productId] = [];
        variantsByProductId[productId].push(transformVariant(v, productNameById[productId] || ''));
    }

    // 4. Combine products with their variants
    return products.map((p: any) =>
        transformProduct(p, variantsByProductId[p.id] || [])
    );
}

/**
 * Fetch a single product by its parent SKU (Product_Name)
 */
export async function getProductBySku(parentSku: string): Promise<Product | null> {
    // Search for the product by Product_Name
    const response = await fetchZoho(
        `/Products/search?criteria=((Product_Name:equals:${encodeURIComponent(parentSku)}))&fields=${PRODUCT_FIELDS.join(',')}`
    );

    const products = response.data || [];
    if (products.length === 0) return null;

    const product = products[0];

    // Fetch variants linked to this product
    const variantsResponse = await fetchZoho(
        `/Product_Variants/search?criteria=((Product_Design:equals:${product.id}))&fields=${VARIANT_FIELDS.join(',')}&per_page=200`
    );

    const rawVariants = variantsResponse.data || [];
    const productName = product.Product_Name || parentSku;
    const variants = rawVariants.map((v: any) => transformVariant(v, productName));

    return transformProduct(product, variants);
}

/**
 * Access a private collection by slug and password
 * Reads collection definitions from local data/collections.json
 */
export async function accessPrivateCollection(slug: string, password: string) {
    // Dynamic import to read the JSON file at runtime
    const fs = await import('fs/promises');
    const path = await import('path');

    const collectionsPath = path.join(process.cwd(), 'data', 'collections.json');

    let collections: any[];
    try {
        const raw = await fs.readFile(collectionsPath, 'utf-8');
        collections = JSON.parse(raw);
    } catch {
        throw new Error('Collection not found');
    }

    // Find collection by slug
    const collection = collections.find(
        (c: any) => c.slug === slug && c.isActive
    );

    if (!collection) {
        throw new Error('Collection not found');
    }

    // Verify password
    if (collection.password !== password) {
        throw new Error('Invalid password');
    }

    // Fetch each product by SKU
    const products: Product[] = [];
    for (const sku of collection.productSkus || []) {
        const product = await getProductBySku(sku);
        if (product) products.push(product);
    }

    return {
        title: collection.title,
        slug: collection.slug,
        products,
    };
}
