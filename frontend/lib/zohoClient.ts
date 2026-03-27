/**
 * Zoho CRM Data Client
 *
 * Fetches products and variants from Zoho CRM
 * and transforms them into the shape the frontend expects.
 */

import { getAccessToken, invalidateToken } from './zohoAuth';
import { unstable_cache } from 'next/cache';

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
    sku_segments: string[];
    carat_weight?: string | null;
    dia_quality?: string | null;
    metal_type?: string | null;
    metal_color?: string | null;
    metric_size?: string | null;
    setting?: string | null;
    diamond_count?: number | null;
    model?: string | null;
    dimensions?: string | null;
    weight_grams?: number | null;
    net_weight?: number | null;
    polki_weight?: number | null;
    stone_type?: string | null;
    sub_group?: string | null;
    parsed_size?: string | null;
    sub_sub_group?: string | null;
    total_cost: number;
    sell_price?: number | null;
    media: Media[];
    diamond_weight?: number | null;
    website_description?: string | null;
};

export interface Product {
    id: string | number;
    parent_sku: string;
    title: string;
    product_category?: string | null;
    category?: string | null;
    subcategory?: string | null;
    collection?: string[] | null;
    base_price?: number | null;
    others?: string | null;
    product_description?: string | null;
    type_of_order?: string | null;
    record_image?: string | null;
    variants: Variant[];
    metal_type?: string | null;
    stone_type?: string | null;
}

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
        next: { revalidate: 900 },
    });

    // Zoho returns 204 No Content when search finds no results
    if (res.status === 204) {
        return { data: [] };
    }

    // If token expired/invalid, clear cache, get fresh token, and retry once
    if (res.status === 401) {
        console.warn(`[ZohoClient] 401 Unauthorized for ${endpoint}. Invalidating token...`);
        invalidateToken(token);
        const freshToken = await getAccessToken();

        const retryRes = await fetch(`${ZOHO_API_DOMAIN}/crm/v7${endpoint}`, {
            headers: {
                Authorization: `Zoho-oauthtoken ${freshToken}`,
            },
            // Prevent caching the retry attempt if it fails
            cache: 'no-store'
        });

        if (retryRes.status === 204) {
            return { data: [] };
        }

        if (!retryRes.ok) {
            const errorText = await retryRes.text();
            throw new Error(`Zoho API error: ${retryRes.status} — ${errorText}`);
        }

        const retryText = await retryRes.text();
        if (!retryText) {
            return { data: [] };
        }

        return JSON.parse(retryText);
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
 * Split an array of fields into chunks of at most `maxSize`.
 * Always includes 'id' in every chunk so results can be merged.
 */
function chunkFields(fields: string[], maxSize: number = 50): string[][] {
    // 'id' must be in every chunk for merging
    const withoutId = fields.filter((f) => f !== 'id');
    const chunks: string[][] = [];
    for (let i = 0; i < withoutId.length; i += maxSize - 1) {
        chunks.push(['id', ...withoutId.slice(i, i + maxSize - 1)]);
    }
    return chunks.length > 0 ? chunks : [['id']];
}

/**
 * Merge multiple arrays of records by `id`.
 * Properties from later arrays overwrite earlier ones (shallow merge per record).
 */
function mergeRecords(arrays: any[][]): any[] {
    const map = new Map<string, any>();
    for (const arr of arrays) {
        for (const record of arr) {
            const existing = map.get(record.id);
            map.set(record.id, existing ? { ...existing, ...record } : record);
        }
    }
    return Array.from(map.values());
}

/**
 * Fetch all pages of results from Zoho CRM (handles pagination + field chunking)
 * Zoho CRM limits requests to 50 fields, so if we have more, we split into
 * multiple requests and merge the results by record id.
 */
async function fetchAllPages(
    baseEndpoint: string,
    fields: string[],
    extraParams: string = ''
): Promise<any[]> {
    const fieldChunks = chunkFields(fields);

    // Fetch all pages for each chunk of fields
    const chunkResults: any[][] = [];
    for (const chunk of fieldChunks) {
        const records: any[] = [];
        let pageToken: string | null = null;
        let hasMore = true;

        while (hasMore) {
            let url = `${baseEndpoint}?fields=${chunk.join(',')}&per_page=200`;
            if (extraParams) url += `&${extraParams}`;
            if (pageToken) url += `&page_token=${pageToken}`;

            const response = await fetchZoho(url);

            if (response.data) {
                records.push(...response.data);
            }

            hasMore = response.info?.more_records ?? false;
            pageToken = response.info?.next_page_token ?? null;
        }
        chunkResults.push(records);
    }

    // If only one chunk, no merging needed
    if (chunkResults.length === 1) return chunkResults[0];

    // Merge all chunks by record id
    return mergeRecords(chunkResults);
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

// Product fields to fetch from Zoho CRM (only fields used in the catalog)
const PRODUCT_FIELDS = [
    'id',
    'Product_Name',
    'Product_Code',
    'Category',
    'Sub_Category',
    'Collection',
    'Website_name',
    'Product_Active',
    'Show_on_Catalog',
    'Type_of_Order',
    'Product_display_Image',
    'Product_Description',
    'Product_Category',
];

// Variant fields to fetch from Zoho CRM (only fields used in the catalog)
const VARIANT_FIELDS = [
    'id',
    'Name',
    'Product_Design',
    'Show_on_Catalog',
    'Variant_Image',
    'Record_Image',
    // Images / File uploads
    'CAD_attachment',
    'Image_Upload_3',      // CAD image (File Upload)
    'Catalog_Images',
    'Creative_Image',
    'Model_Image',
    'Production_Instruction_Image',
    'White_Background_Image',
    'Video',
    // Weights
    'Gross_Weight',        // gemstone_weight (stone weight)
    'Net_Weight',          // gold net weight
    'Polki_Weight',        // polki weight
    'Total_Diamonds',      // diamond_count + diamond_weight
    // Pricing
    'Total_Price',
    'A_Sell_Price',
    'B_Sell_Price',
    'C_Sell_Price',
    'D_Sell_Price',
    // Details
    'Style_Size_Inch',
    'Website_description',
];

/**
 * Parse variant attributes from the SKU name.
 * SKU format: {ProductName}-{Material}-{Carat}-{Color}-{Stone}-{SubGroup}-{Size}-{SubSubGroup}
 *
 * Examples:
 *   SE022-G-10-W-4              → Gold, 10K, White
 *   CR10000-G-18-W-6            → Gold, 18K, White
 *   SR0001-G-10-Y-D-L-2-NA      → Gold, 10K, Yellow, Diamond, LabGrown, Size 2, Not Applicable
 *   CBR-G-22-W-S-SS-...         → Gold, 22K, White
 *
 * Material codes: BD=Beads, G=Gold, S=Silver, P=Platinum, D=Diamond, PE=Pearl, PO=Polki, GE=Gemstone
 * Sub-group codes: GF=GlassFlied, H=Heated, L=LabGrown, NN=Nano, N=Natural, NA=Not Applicable, 95=PT950
 */
const METAL_TYPE_MAP: Record<string, string> = {
    G: 'Gold',
    S: 'Silver',
    P: 'Platinum',
    D: 'Diamond',
    BD: 'Beads',
    PE: 'Pearl',
    PO: 'Polki',
    GE: 'Gemstone',
};

const METAL_COLOR_MAP: Record<string, string> = {
    W: 'White',
    Y: 'Yellow',
    R: 'Rose',
};

// Stone type codes (used in segment after color)
const STONE_TYPE_MAP: Record<string, string> = {
    D: 'Diamond',
    PE: 'Pearl',
    PO: 'Polki',
    GE: 'Gemstone',
    BD: 'Beads',
    S: 'Silver',
};

// Sub-group codes (e.g. Diamond sub-types)
const SUB_GROUP_MAP: Record<string, string> = {
    GF: 'GlassFlied',
    H: 'Heated',
    L: 'LabGrown',
    NN: 'Nano',
    N: 'Natural',
    NA: 'Not Applicable',
    '95': 'PT950',
};

// Sub-sub-group codes (colors, diamond grades, stone types)
const SUB_SUB_GROUP_MAP: Record<string, string> = {
    // Colors
    W: 'White',
    'W/Y': 'White/Yellow',
    'Y/R': 'Yellow/Rose',
    'R/W': 'Rose/White',
    Y: 'Yellow',
    R: 'Rose',
    'R/W/Y': 'Rose/White/Yellow',
    // Diamond grades
    '1': 'DEVVS',
    '2': 'GHVVS',
    '3': 'DEVS',
    '4': 'GHVS',
    '5': 'DESI',
    '6': 'GHSI',
    // Stone types
    EM: 'Emerald',
    REM: 'Russian Emerald',
    M: 'Malachite',
    BS: 'Blue Sapphire',
    YS: 'Yellow Sapphire',
    TM: 'Tourmaline',
    AQ: 'Aquamarine',
    PD: 'Peridot',
    NG: 'Navgraha',
    WS: 'White Sapphire',
    RB: 'Ruby',
    TS: 'Tsavorite',
    POP: 'Pink Opal',
    TQ: 'Turquoise',
    MX: 'Mix-Shape',
    BLS: 'Black Sapphire',
    CO: 'Coral',
    TN: 'Tanzanite',
    AM: 'Amethyst',
};

/**
 * Try to match a multi-character code from the parts array.
 * Checks 2-char codes first (e.g. "PE", "PO", "BD", "GE", "GF", "NN", "NA"),
 * then falls back to single-char codes.
 * Returns [matchedValue, numberOfPartsConsumed] or [null, 0].
 */
function matchCode(
    parts: string[],
    startIndex: number,
    map: Record<string, string>
): [string | null, number] {
    if (startIndex >= parts.length) return [null, 0];

    // Try 2-char code by joining current + next part (e.g. parts like "P","E" → "PE")
    // But first, check if the current single part itself is a multi-char key
    const current = parts[startIndex];

    // Direct match on current part (handles both single-char "G" and multi-char "BD", "PE" etc.)
    if (map[current]) {
        return [map[current], 1];
    }

    return [null, 0];
}

function parseVariantSku(variantSku: string, parentSku: string) {
    // Remove the parent product name prefix to get the attribute segments
    let suffix = variantSku;
    if (variantSku.startsWith(parentSku + '-')) {
        suffix = variantSku.slice(parentSku.length + 1);
    }

    const parts = suffix.split('-');
    let idx = 0;

    let metalType: string | null = null;
    let caratWeight: string | null = null;
    let metalColor: string | null = null;
    let stoneType: string | null = null;
    let subGroup: string | null = null;
    let size: string | null = null;
    let subSubGroup: string | null = null;

    // Segment: Material Type (G, S, P, D, BD, PE, PO, GE)
    if (idx < parts.length) {
        const [val, consumed] = matchCode(parts, idx, METAL_TYPE_MAP);
        if (val) {
            metalType = val;
            idx += consumed;
        } else {
            idx++;
        }
    }

    // Segment: Carat Weight (10, 14, 18, 22, etc.)
    if (idx < parts.length && /^\d+$/.test(parts[idx])) {
        caratWeight = parts[idx];
        idx++;
    }

    // Segment: Metal Color (W/Y/R)
    if (idx < parts.length) {
        const [val, consumed] = matchCode(parts, idx, METAL_COLOR_MAP);
        if (val) {
            metalColor = val;
            idx += consumed;
        }
    }

    // Segment: Stone Type (D, PE, PO, GE, BD, S)
    if (idx < parts.length) {
        const [val, consumed] = matchCode(parts, idx, STONE_TYPE_MAP);
        if (val) {
            stoneType = val;
            idx += consumed;
        }
    }

    // Segment: Sub Group (L, N, GF, H, NN, NA, 95)
    if (idx < parts.length) {
        const [val, consumed] = matchCode(parts, idx, SUB_GROUP_MAP);
        if (val) {
            subGroup = val;
            idx += consumed;
        }
    }

    // Segment: Size (numeric)
    if (idx < parts.length && /^\d+$/.test(parts[idx])) {
        size = parts[idx];
        idx++;
    }

    // Segment: Sub Sub Group
    if (idx < parts.length) {
        const [val, consumed] = matchCode(parts, idx, SUB_SUB_GROUP_MAP);
        if (val) {
            subSubGroup = val;
            idx += consumed;
        } else {
            // Use raw value as fallback
            subSubGroup = parts[idx];
        }
    }

    return { metalType, caratWeight, metalColor, stoneType, subGroup, size, subSubGroup };
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

    // Additional image fields (file uploads) → append to media array
    // Zoho file upload fields return an array of file objects:
    //   [{ file_Id: "123", File_Name: "image.jpg", Size: 12345 }, ...]
    const imageFields = [
        { field: 'CAD_attachment', name: 'cad-attachment' },
        { field: 'Image_Upload_3', name: 'cad-image' },
        { field: 'Catalog_Images', name: 'catalog-images' },
        { field: 'Creative_Image', name: 'creative-image' },
        { field: 'Model_Image', name: 'model-image' },
        { field: 'Production_Instruction_Image', name: 'production-instruction-image' },
        { field: 'White_Background_Image', name: 'white-background-image' },
    ];
    for (const { field, name } of imageFields) {
        const fieldData = zohoVariant[field];
        if (fieldData && Array.isArray(fieldData)) {
            // Multiple files per field
            for (let i = 0; i < fieldData.length; i++) {
                const file = fieldData[i];
                const fileId = file.file_Id || file.id;
                if (fileId) {
                    const proxiedUrl = `/api/image-proxy?module=Product_Variants&id=${zohoVariant.id}&attachment_id=${fileId}`;
                    media.push({
                        id: `${name}-${zohoVariant.id}-${i}`,
                        file_name: file.File_Name || file.file_name || name,
                        file_type: file.Content_Type || file.content_type || 'image/jpeg',
                        preview_url: proxiedUrl,
                        download_url: proxiedUrl,
                    });
                }
            }
        } else if (fieldData && typeof fieldData === 'string') {
            // Fallback: field might be a simple URL string
            const proxiedUrl = `/api/image-proxy?module=Product_Variants&id=${zohoVariant.id}&attachment_id=${fieldData}`;
            media.push({
                id: `${name}-${zohoVariant.id}`,
                file_name: name,
                file_type: 'image/jpeg',
                preview_url: proxiedUrl,
                download_url: proxiedUrl,
            });
        }
    }

    // Video field (also a file upload, can have multiple files)
    const videoData = zohoVariant.Video;
    if (videoData && Array.isArray(videoData)) {
        for (let i = 0; i < videoData.length; i++) {
            const file = videoData[i];
            const fileId = file.file_Id || file.id;
            if (fileId) {
                const proxiedUrl = `/api/image-proxy?module=Product_Variants&id=${zohoVariant.id}&attachment_id=${fileId}`;
                media.push({
                    id: `video-${zohoVariant.id}-${i}`,
                    file_name: file.File_Name || file.file_name || 'video',
                    file_type: file.Content_Type || file.content_type || 'video/mp4',
                    preview_url: proxiedUrl,
                    download_url: proxiedUrl,
                });
            }
        }
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

    // Extract raw SKU segments (everything after parent product name prefix)
    const variantName = zohoVariant.Name || '';
    let skuSuffix = variantName;
    if (variantName.startsWith(parentSku + '-')) {
        skuSuffix = variantName.slice(parentSku.length + 1);
    }
    const skuSegments = skuSuffix ? skuSuffix.split('-') : [];

    return {
        variant_sku: zohoVariant.Name || '',
        sku_segments: skuSegments,
        metal_type: parsed.metalType,
        metal_color: parsed.metalColor,
        dia_quality: null,
        carat_weight: parsed.caratWeight,
        setting: null,
        diamond_count: zohoVariant.Total_Diamonds ?? null,
        model: null,
        weight_grams: zohoVariant.Gross_Weight ?? null,
        net_weight: zohoVariant.Net_Weight ?? null,
        polki_weight: zohoVariant.Polki_Weight ?? null,
        stone_type: parsed.stoneType,
        sub_group: parsed.subGroup,
        parsed_size: parsed.size,
        sub_sub_group: parsed.subSubGroup,
        total_cost: lowestPrice,
        sell_price: zohoVariant.A_Sell_Price ?? null,
        dimensions: zohoVariant.Style_Size_Inch ?? null,
        diamond_weight: zohoVariant.Total_Diamonds ?? null,
        media,
        website_description: zohoVariant.Website_description ?? null,
    };
}

/**
 * Transform a Zoho product record + its variants into the frontend Product type
 */
function transformProduct(zohoProduct: any, variants: Variant[]): Product {
    // base_price = lowest total_cost across all variants
    const prices = variants.map((v) => v.total_cost).filter((p) => p > 0);
    const basePrice = prices.length > 0 ? Math.min(...prices) : null;

    // Build product display image URL from the file upload field
    let recordImage: string | null = null;
    const displayImg = zohoProduct.Product_display_Image;
    if (displayImg && Array.isArray(displayImg) && displayImg.length > 0) {
        const fileId = displayImg[0].file_Id || displayImg[0].id;
        if (fileId) {
            recordImage = `/api/image-proxy?module=Products&id=${zohoProduct.id}&attachment_id=${fileId}`;
        }
    } else if (displayImg && typeof displayImg === 'string') {
        recordImage = `/api/image-proxy?module=Products&id=${zohoProduct.id}`;
    }

    // Zoho multiselect returns an array of strings, or null
    const collection: string[] | null = Array.isArray(zohoProduct.Collection)
        ? zohoProduct.Collection
        : zohoProduct.Collection
            ? [zohoProduct.Collection]
            : null;

    return {
        id: zohoProduct.id,
        parent_sku: zohoProduct.Product_Name || zohoProduct.Product_Code || '',
        title: zohoProduct.Website_name || zohoProduct.Product_Name || '',
        product_category: zohoProduct.Product_Category ?? null,
        category: zohoProduct.Category ?? null,
        subcategory: zohoProduct.Sub_Category ?? null,
        collection,
        base_price: basePrice,
        others: null,
        product_description: zohoProduct.Product_Description ?? null,
        type_of_order: zohoProduct.Type_of_Order ?? null,
        record_image: recordImage,
        variants,
    };
}

/* -------------------------------------------------------------------------- */
/*                             PUBLIC API                                     */
/* -------------------------------------------------------------------------- */

/**
 * Fetch variants for a single product using the search endpoint.
 * Searches by Product_Design lookup, which returns complete field data.
 */
async function fetchVariantsForProduct(productId: string): Promise<any[]> {
    const fieldChunks = chunkFields(VARIANT_FIELDS);
    const chunkResults: any[][] = [];

    for (const chunk of fieldChunks) {
        const records: any[] = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
            const response = await fetchZoho(
                `/Product_Variants/search?criteria=((Product_Design:equals:${productId}))&fields=${chunk.join(',')}&per_page=200&page=${page}`
            );

            if (response.data) {
                records.push(...response.data);
            }

            hasMore = response.info?.more_records ?? false;
            page++;
        }
        chunkResults.push(records);
    }

    if (chunkResults.length === 1) return chunkResults[0];
    return mergeRecords(chunkResults);
}

/**
 * Process items in batches to avoid Zoho API rate limits
 */
async function processBatched<T, R>(
    items: T[],
    batchSize: number,
    fn: (item: T) => Promise<R>
): Promise<R[]> {
    const results: R[] = [];
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(fn));
        results.push(...batchResults);
    }
    return results;
}

/**
 * Fetch all active products with their variants
 */
export const getProducts = unstable_cache(
    async (): Promise<Product[]> => {
        // 1. Fetch all products (bulk, paginated)
        const allProducts = await fetchAllPages(
            '/Products',
            PRODUCT_FIELDS
        );

        // 2. Filter to only active products that are marked to show on catalog
        const products = allProducts.filter(
            (p: any) => p.Product_Active !== false && p.Show_on_Catalog === 'Yes'
        );

        if (!products.length) return [];

        // 3. Fetch variants individually for each product (5 at a time to avoid rate limits)
        const variantsByProductId: Record<string, Variant[]> = {};

        await processBatched(products, 5, async (p: any) => {
            const rawVariants = await fetchVariantsForProduct(p.id);
            const parentName = p.Product_Name || '';
            // Only include variants marked to show on catalog
            const catalogVariants = rawVariants.filter((v: any) => v.Show_on_Catalog === 'Yes');
            variantsByProductId[p.id] = catalogVariants.map((v: any) =>
                transformVariant(v, parentName)
            );
        });

        // 4. Combine products with their variants
        return products.map((p: any) =>
            transformProduct(p, variantsByProductId[p.id] || [])
        );
    }, ['zoho-products'], { revalidate: 900, tags: ['products'] });

/**
 * Fetch a single product by its parent SKU (Product_Name)
 */
export const getProductBySku = unstable_cache(
    async (parentSku: string): Promise<Product | null> => {
        // Search for the product by Product_Name (with field chunking)
        const productFieldChunks = chunkFields(PRODUCT_FIELDS);
        const productChunkResults: any[][] = [];
        for (const chunk of productFieldChunks) {
            const response = await fetchZoho(
                `/Products/search?criteria=((Product_Name:equals:${encodeURIComponent(parentSku)}))&fields=${chunk.join(',')}`
            );
            productChunkResults.push(response.data || []);
        }
        const products = productChunkResults.length === 1
            ? productChunkResults[0]
            : mergeRecords(productChunkResults);

        if (products.length === 0) return null;

        const product = products[0];

        // Fetch variants linked to this product (with field chunking)
        const variantFieldChunks = chunkFields(VARIANT_FIELDS);
        const variantChunkResults: any[][] = [];
        for (const chunk of variantFieldChunks) {
            const response = await fetchZoho(
                `/Product_Variants/search?criteria=((Product_Design:equals:${product.id}))&fields=${chunk.join(',')}&per_page=200`
            );
            variantChunkResults.push(response.data || []);
        }
        const rawVariants = variantChunkResults.length === 1
            ? variantChunkResults[0]
            : mergeRecords(variantChunkResults);

        const productName = product.Product_Name || parentSku;
        // Only include variants marked to show on catalog
        const catalogVariants = rawVariants.filter((v: any) => v.Show_on_Catalog === 'Yes');
        const variants = catalogVariants.map((v: any) => transformVariant(v, productName));

        return transformProduct(product, variants);
    }, ['zoho-product'], { revalidate: 900, tags: ['product'] });

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

    if (collection.password !== password) {
        throw new Error('Invalid password');
    }

    // Fetch products for this collection
    const allProducts = await getProducts();
    const collectionProducts = allProducts.filter((p) =>
        p.collection?.includes(collection.name)
    );

    return {
        title: collection.name,
        slug: collection.slug,
        products: collectionProducts,
    };
}
