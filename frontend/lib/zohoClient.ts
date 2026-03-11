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

export type BillOfMaterialsRow = {
    group?: string | null;
    sub_group?: string | null;
    sub_sub_group?: string | null;
    shape?: string | null;
    size?: string | null;
    weight?: number | null;
    pieces?: number | null;
    total_weight?: number | null;
    rate_per_unit?: number | null;
    price?: number | null;
    gross_weight?: number | null;
    a_sell_rate_per_unit?: number | null;
    b_sell_rate_per_unit?: number | null;
    c_sell_rate_per_unit?: number | null;
    d_sell_rate_per_unit?: number | null;
    a_sell_price?: number | null;
    b_sell_price?: number | null;
    c_sell_price?: number | null;
    d_sell_price?: number | null;
    created_by?: string | null;
};

export type OtherOperationsRow = {
    operations?: string | null;
    sub_operations?: string | null;
    weight?: number | null;
    rate_per_unit?: number | null;
    price?: number | null;
    a_sell_rate_per_unit?: number | null;
    b_sell_rate_per_unit?: number | null;
    c_sell_rate_per_unit?: number | null;
    d_sell_rate_per_unit?: number | null;
    sell_price_a?: number | null;
    sell_price_b?: number | null;
    sell_price_c?: number | null;
    sell_price_d?: number | null;
    created_by?: string | null;
};

export type Variant = {
    variant_sku: string;
    sku_segments: string[];
    carat_weight?: string | null;
    dia_quality?: string | null;
    metal_type?: string | null;
    metal_color?: string | null;
    setting?: string | null;
    diamond_count?: number | null;
    model?: string | null;
    dimensions?: string | null;
    weight_grams?: number | null;
    stone_type?: string | null;
    sub_group?: string | null;
    parsed_size?: string | null;
    sub_sub_group?: string | null;
    total_cost: number;
    media: Media[];
    // Additional Zoho fields
    product_url?: string | null;
    product_variant_name?: string | null;
    cad_person_name?: string | null;
    ring_size?: string | null;
    style_size_inch?: string | null;
    website_name?: string | null;
    website_description?: string | null;
    raw_material_details?: string | null;
    work_drive_download_link?: string | null;
    portal_user?: string | null;
    product_design?: any | null;
    owner?: any | null;
    connected_to?: any | null;
    created_by?: string | null;
    modified_by?: string | null;
    modified_date?: string | null;
    modified_bom_date?: string | null;
    modified_name_reason?: string | null;
    additional_instructions?: string | null;
    engraving_instruction?: string | null;
    finding_instruction?: string | null;
    finish_instruction?: string | null;
    rhodium_instruction?: string | null;
    tag?: string | null;
    variant_image?: string | null;
    email?: string | null;
    email_opt_out?: boolean | null;
    secondary_email?: string | null;
    total_price?: number | null;
    // Pricing
    sell_price_a?: number | null;
    sell_price_b?: number | null;
    sell_price_c?: number | null;
    sell_price_d?: number | null;
    total_sell_price_a?: number | null;
    total_sell_price_b?: number | null;
    total_sell_price_c?: number | null;
    total_sell_price_d?: number | null;
    cost_price?: number | null;
    operations_total_price?: number | null;
    // Weights
    net_weight?: number | null;
    diamond_weight?: number | null;
    polki_weight?: number | null;
    stone_weight?: number | null;
    // Subforms
    bill_of_materials?: BillOfMaterialsRow[];
    other_operations?: OtherOperationsRow[];
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
    collection?: string[] | null;
    finish?: string | null;
    cad_attachment?: any | null;
    cad_person?: string | null;
    cad_person_name?: string | null;
    cad_reference_images?: any | null;
    carat_weight?: number | null;
    commission_rate?: number | null;
    connected_to?: any | null;
    created_by?: string | null;
    customer_remarks?: string | null;
    description?: string | null;
    designer?: string | null;
    gross_wt_calculation?: number | null;
    group?: string | null;
    handler?: any | null;
    lock_finding?: string | null;
    main_variant?: any | null;
    making_charges?: number | null;
    manufacturer?: string | null;
    modified_by?: string | null;
    net_wt_calculation?: number | null;
    portal_user?: any | null;
    product_active?: boolean | null;
    product_category?: string | null;
    product_code?: string | null;
    record_image?: string | null;
    product_name?: string | null;
    owner?: any | null;
    qty_ordered?: number | null;
    qty_in_demand?: number | null;
    qty_in_stock?: number | null;
    reference_image?: any | null;
    reorder_level?: number | null;
    rhodium?: string | null;
    sales_end_date?: string | null;
    sales_start_date?: string | null;
    sell_rate_per_unit?: number | null;
    shape?: string | null;
    size?: string | null;
    sketch_image?: any | null;
    style_size?: string | null;
    sub_group?: string | null;
    sub_sub_group?: string | null;
    support_expiry_date?: string | null;
    support_start_date?: string | null;
    tag?: string | null;
    tax?: string[] | null;
    taxable?: boolean | null;
    total_cost?: number | null;
    type_of_order?: string | null;
    unit_price?: number | null;
    usage_unit?: string | null;
    variant?: any | null;
    vendor_name?: any | null;
    wt_in_material_unit?: number | null;
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
    'Finish',
    'CAD_attachment',
    'CAD_person',
    'CAD_person_name',
    'CAD_Reference_Images',
    'Carat_Weight',
    'Commission_Rate',
    'Connected_To__s',
    'Created_By',
    'customer_remarks',
    'Description',
    'Designer',
    'Gross_Wt_calculation',
    'Group',
    'Handler',
    'Lock_Finding',
    'Main_Variant',
    'Making_Charges',
    'Manufacturer',
    'Modified_By',
    'Net_Wt_Calculation',
    'Portal_User',
    'Product_Category',
    'Record_Image',
    'Owner',
    'Qty_Ordered',
    'Qty_in_Demand',
    'Qty_in_Stock',
    'Reference_Image',
    'Reorder_Level',
    'Rhodium',
    'Sales_End_Date',
    'Sales_Start_Date',
    'Sell_Rate_Per_Unit',
    'Shape',
    'Size',
    'Sketch_Image',
    'Style_Size',
    'Sub_Group',
    'Sub_Sub_Group',
    'Support_Expiry_Date',
    'Support_Start_Date',
    'Tag',
    'Tax',
    'Taxable',
    'Total_Cost',
    'Type_of_Order',
    'Unit_Price',
    'Usage_Unit',
    'Variant',
    'Vendor_Name',
    'Wt_in_Material_Unit',
];

// Variant fields to fetch from Zoho CRM
const VARIANT_FIELDS = [
    'id',
    'Name',
    'Product_Design',
    'Product_URL',
    'Variant_Image',
    'Record_Image',
    // Images / File uploads
    'CAD_attachment',
    'CAD_person_name',
    'Image_Upload_3',      // CAD image (File Upload)
    'Catalog_Images',
    'Creative_Image',
    'Model_Image',
    'Production_Instruction_Image',
    'White_Background_Image',
    'Video',
    // Weights
    'Gross_Weight',        // Stone Weight (Formula)
    'Total_Diamonds',      // Diamond Weight (Formula)
    'Net_Weight',
    'Polki_Weight',
    // Pricing
    'Cost_Price',
    'Total_Price',
    'A_Sell_Price',
    'B_Sell_Price',
    'C_Sell_Price',
    'D_Sell_Price',
    'Total_Sell_Price_A',
    'Total_Sell_Price_B',
    'Total_Sell_Price_C',
    'Total_Sell_Price_D',
    'Operations_Price',
    // Details
    'Ring_Size',
    'Style_Size_Inch',
    'Website_name',
    'Website_description',
    'Website_Raw_material_details',
    'Work_Drive_Download_Link',
    'Portal_User',
    'Owner',
    'Connected_To__s',
    'Created_By',
    'Modified_By',
    'Modified_Date',
    'Modified_BOM_Date',
    'Modified_Name_Reason',
    'Additional_Instructions',
    'Engraving_Instruction',
    'Finding_Instruction',
    'Finish_Instruction',
    'Rhodium_Instruction',
    'Tag',
    'Email',
    'Email_Opt_Out',
    'Secondary_Email',
    // Subforms
    'Bill_Of_Materials',
    'Other_Operations',
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
        const [val, consumed] = matchCode(parts, idx, SUB_GROUP_MAP);
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

    // Transform Bill of Materials subform rows
    const billOfMaterials: BillOfMaterialsRow[] = (zohoVariant.Bill_Of_Materials || []).map((row: any) => ({
        group: row.Group ?? null,
        sub_group: row.Sub_Group ?? null,
        sub_sub_group: row.Sub_Sub_Group ?? null,
        shape: row.Shape ?? null,
        size: row.Size ?? null,
        weight: row.Weight ?? null,
        pieces: row.Pieces ?? null,
        total_weight: row.Total_Weights ?? null,
        rate_per_unit: row.Rate_Per_Unit ?? null,
        price: row.Price ?? null,
        gross_weight: row.Gross_Weight ?? null,
        a_sell_rate_per_unit: row.A_Sell_Rate_Per_Unit ?? null,
        b_sell_rate_per_unit: row.B_Sell_Rate_Per_Unit ?? null,
        c_sell_rate_per_unit: row.C_Sell_Rate_Per_Unit ?? null,
        d_sell_rate_per_unit: row.D_Sell_Rate_Per_Unit ?? null,
        a_sell_price: row.A_Sell_Price ?? null,
        b_sell_price: row.B_Sell_Price ?? null,
        c_sell_price: row.C_Sell_Price ?? null,
        d_sell_price: row.D_Sell_Price ?? null,
        created_by: row.Created_By ?? null,
    }));

    // Transform Other Operations subform rows
    const otherOperations: OtherOperationsRow[] = (zohoVariant.Other_Operations || []).map((row: any) => ({
        operations: row.Operations ?? null,
        sub_operations: row.Sub_Operations ?? null,
        weight: row.Weight ?? null,
        rate_per_unit: row.Rate_Per_Unit ?? null,
        price: row.Price ?? null,
        a_sell_rate_per_unit: row.A_Sell_Rate_Per_Unit ?? null,
        b_sell_rate_per_unit: row.B_Sell_Rate_Per_Unit ?? null,
        c_sell_rate_per_unit: row.C_Sell_Rate_Per_Unit ?? null,
        d_sell_rate_per_unit: row.D_Sell_Rate_Per_Unit ?? null,
        sell_price_a: row.Sell_Price_A ?? null,
        sell_price_b: row.Sell_Price_B ?? null,
        sell_price_c: row.Sell_Price_C ?? null,
        sell_price_d: row.Sell_Price_D ?? null,
        created_by: row.Created_By ?? null,
    }));

    // Portal User (lookup field → extract name)
    const portalUser = zohoVariant.Portal_User
        ? (typeof zohoVariant.Portal_User === 'object' ? zohoVariant.Portal_User.name : zohoVariant.Portal_User)
        : null;

    // Owner (lookup field → extract name)
    const owner = zohoVariant.Owner
        ? (typeof zohoVariant.Owner === 'object' ? zohoVariant.Owner.name : zohoVariant.Owner)
        : null;

    return {
        variant_sku: zohoVariant.Name || '',
        sku_segments: skuSegments,
        product_variant_name: zohoVariant.Name || '',
        product_url: zohoVariant.Product_URL ?? null,
        metal_type: zohoVariant.Metal_Type ?? parsed.metalType,
        metal_color: zohoVariant.Metal_Color ?? parsed.metalColor,
        dia_quality: zohoVariant.Dia_Quality ?? null,
        carat_weight: zohoVariant.Carat_Weight ?? parsed.caratWeight,
        setting: zohoVariant.Setting ?? null,
        diamond_count: zohoVariant.Diamond_Count ?? zohoVariant.Total_Diamonds ?? null,
        weight_grams: zohoVariant.Gross_Weight ?? null,
        stone_type: parsed.stoneType,
        sub_group: parsed.subGroup,
        parsed_size: parsed.size,
        sub_sub_group: parsed.subSubGroup,
        total_cost: lowestPrice,
        dimensions: zohoVariant.Style_Size_Inch ?? null,
        ring_size: zohoVariant.Ring_Size ?? null,
        style_size_inch: zohoVariant.Style_Size_Inch ?? null,
        cad_person_name: zohoVariant.CAD_person_name ?? null,
        website_name: zohoVariant.Website_name ?? null,
        website_description: zohoVariant.Website_description ?? null,
        raw_material_details: zohoVariant.Website_Raw_material_details ?? null,
        work_drive_download_link: zohoVariant.Work_Drive_Download_Link ?? null,
        portal_user: portalUser,
        product_design: zohoVariant.Product_Design ?? null,
        owner,
        connected_to: zohoVariant.Connected_To__s ?? null,
        created_by: zohoVariant.Created_By ?? null,
        modified_by: zohoVariant.Modified_By ?? null,
        modified_date: zohoVariant.Modified_Date ?? null,
        modified_bom_date: zohoVariant.Modified_BOM_Date ?? null,
        modified_name_reason: zohoVariant.Modified_Name_Reason ?? null,
        additional_instructions: zohoVariant.Additional_Instructions ?? null,
        engraving_instruction: zohoVariant.Engraving_Instruction ?? null,
        finding_instruction: zohoVariant.Finding_Instruction ?? null,
        finish_instruction: zohoVariant.Finish_Instruction ?? null,
        rhodium_instruction: zohoVariant.Rhodium_Instruction ?? null,
        tag: zohoVariant.Tag ?? null,
        variant_image: zohoVariant.Variant_Image ?? null,
        email: zohoVariant.Email ?? null,
        email_opt_out: zohoVariant.Email_Opt_Out ?? null,
        secondary_email: zohoVariant.Secondary_Email ?? null,
        total_price: zohoVariant.Total_Price ?? null,
        // Pricing
        sell_price_a: zohoVariant.A_Sell_Price ?? null,
        sell_price_b: zohoVariant.B_Sell_Price ?? null,
        sell_price_c: zohoVariant.C_Sell_Price ?? null,
        sell_price_d: zohoVariant.D_Sell_Price ?? null,
        total_sell_price_a: zohoVariant.Total_Sell_Price_A ?? null,
        total_sell_price_b: zohoVariant.Total_Sell_Price_B ?? null,
        total_sell_price_c: zohoVariant.Total_Sell_Price_C ?? null,
        total_sell_price_d: zohoVariant.Total_Sell_Price_D ?? null,
        cost_price: zohoVariant.Cost_Price ?? null,
        operations_total_price: zohoVariant.Operations_Price ?? null,
        // Weights
        net_weight: zohoVariant.Net_Weight ?? null,
        diamond_weight: zohoVariant.Total_Diamonds ?? null,
        polki_weight: zohoVariant.Polki_Weight ?? null,
        stone_weight: zohoVariant.Gross_Weight ?? null,
        // Subforms
        bill_of_materials: billOfMaterials,
        other_operations: otherOperations,
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

    // Lookup fields → extract name
    const handler = zohoProduct.Handler
        ? (typeof zohoProduct.Handler === 'object' ? zohoProduct.Handler.name : zohoProduct.Handler)
        : null;
    const mainVariant = zohoProduct.Main_Variant
        ? (typeof zohoProduct.Main_Variant === 'object' ? zohoProduct.Main_Variant.name : zohoProduct.Main_Variant)
        : null;
    const productOwner = zohoProduct.Owner
        ? (typeof zohoProduct.Owner === 'object' ? zohoProduct.Owner.name : zohoProduct.Owner)
        : null;
    const portalUser = zohoProduct.Portal_User
        ? (typeof zohoProduct.Portal_User === 'object' ? zohoProduct.Portal_User.name : zohoProduct.Portal_User)
        : null;
    const variant = zohoProduct.Variant
        ? (typeof zohoProduct.Variant === 'object' ? zohoProduct.Variant.name : zohoProduct.Variant)
        : null;
    const vendorName = zohoProduct.Vendor_Name
        ? (typeof zohoProduct.Vendor_Name === 'object' ? zohoProduct.Vendor_Name.name : zohoProduct.Vendor_Name)
        : null;

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
        finish: zohoProduct.Finish ?? null,
        cad_attachment: zohoProduct.CAD_attachment ?? null,
        cad_person: zohoProduct.CAD_person ?? null,
        cad_person_name: zohoProduct.CAD_person_name ?? null,
        cad_reference_images: zohoProduct.CAD_Reference_Images ?? null,
        carat_weight: zohoProduct.Carat_Weight ?? null,
        commission_rate: zohoProduct.Commission_Rate ?? null,
        connected_to: zohoProduct.Connected_To__s ?? null,
        created_by: zohoProduct.Created_By ?? null,
        customer_remarks: zohoProduct.customer_remarks ?? null,
        description: zohoProduct.Description ?? null,
        designer: zohoProduct.Designer ?? null,
        gross_wt_calculation: zohoProduct.Gross_Wt_calculation ?? null,
        group: zohoProduct.Group ?? null,
        handler,
        lock_finding: zohoProduct.Lock_Finding ?? null,
        main_variant: mainVariant,
        making_charges: zohoProduct.Making_Charges ?? null,
        manufacturer: zohoProduct.Manufacturer ?? null,
        modified_by: zohoProduct.Modified_By ?? null,
        net_wt_calculation: zohoProduct.Net_Wt_Calculation ?? null,
        portal_user: portalUser,
        product_active: zohoProduct.Product_Active ?? null,
        product_category: zohoProduct.Product_Category ?? null,
        product_code: zohoProduct.Product_Code ?? null,
        record_image: zohoProduct.Record_Image ?? null,
        product_name: zohoProduct.Product_Name ?? null,
        owner: productOwner,
        qty_ordered: zohoProduct.Qty_Ordered ?? null,
        qty_in_demand: zohoProduct.Qty_in_Demand ?? null,
        qty_in_stock: zohoProduct.Qty_in_Stock ?? null,
        reference_image: zohoProduct.Reference_Image ?? null,
        reorder_level: zohoProduct.Reorder_Level ?? null,
        rhodium: zohoProduct.Rhodium ?? null,
        sales_end_date: zohoProduct.Sales_End_Date ?? null,
        sales_start_date: zohoProduct.Sales_Start_Date ?? null,
        sell_rate_per_unit: zohoProduct.Sell_Rate_Per_Unit ?? null,
        shape: zohoProduct.Shape ?? null,
        size: zohoProduct.Size ?? null,
        sketch_image: zohoProduct.Sketch_Image ?? null,
        style_size: zohoProduct.Style_Size ?? null,
        sub_group: zohoProduct.Sub_Group ?? null,
        sub_sub_group: zohoProduct.Sub_Sub_Group ?? null,
        support_expiry_date: zohoProduct.Support_Expiry_Date ?? null,
        support_start_date: zohoProduct.Support_Start_Date ?? null,
        tag: zohoProduct.Tag ?? null,
        tax: zohoProduct.Tax ?? null,
        taxable: zohoProduct.Taxable ?? null,
        total_cost: zohoProduct.Total_Cost ?? null,
        type_of_order: zohoProduct.Type_of_Order ?? null,
        unit_price: zohoProduct.Unit_Price ?? null,
        usage_unit: zohoProduct.Usage_Unit ?? null,
        variant,
        vendor_name: vendorName,
        wt_in_material_unit: zohoProduct.Wt_in_Material_Unit ?? null,
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
export async function getProducts(): Promise<Product[]> {
    // 1. Fetch all products (bulk, paginated)
    const allProducts = await fetchAllPages(
        '/Products',
        PRODUCT_FIELDS
    );

    // 2. Filter to only active products (client-side)
    const products = allProducts.filter((p: any) => p.Product_Active !== false);

    if (!products.length) return [];

    // 3. Fetch variants individually for each product (5 at a time to avoid rate limits)
    const variantsByProductId: Record<string, Variant[]> = {};

    await processBatched(products, 5, async (p: any) => {
        const rawVariants = await fetchVariantsForProduct(p.id);
        const parentName = p.Product_Name || '';
        variantsByProductId[p.id] = rawVariants.map((v: any) =>
            transformVariant(v, parentName)
        );
    });

    // 4. Combine products with their variants
    return products.map((p: any) =>
        transformProduct(p, variantsByProductId[p.id] || [])
    );
}

/**
 * Fetch a single product by its parent SKU (Product_Name)
 */
export async function getProductBySku(parentSku: string): Promise<Product | null> {
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
