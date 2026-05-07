const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID;
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET;
const ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN;
const ZOHO_API_DOMAIN = process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.in';
const ZOHO_ACCOUNTS_URL = (process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.in').replace(/\/$/, '');

const EXCEL_PATH = path.join(__dirname, '../Link data.xlsx');
const DOMAIN = 'https://catalog.carpediam.in';

async function getAccessToken() {
    const params = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: ZOHO_CLIENT_ID,
        client_secret: ZOHO_CLIENT_SECRET,
        refresh_token: ZOHO_REFRESH_TOKEN,
    });

    const res = await fetch(`${ZOHO_ACCOUNTS_URL}/oauth/v2/token`, {
        method: 'POST',
        body: params,
    });

    const data = await res.json();
    if (!res.ok || data.error) {
        throw new Error(`Zoho refresh failed: ${data.error || res.status}`);
    }
    return data.access_token;
}

async function fetchZoho(endpoint, token) {
    const res = await fetch(`${ZOHO_API_DOMAIN}/crm/v7${endpoint}`, {
        headers: {
            Authorization: `Zoho-oauthtoken ${token}`,
        },
    });

    if (res.status === 204) return { data: [] };
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Zoho API error: ${res.status} - ${text}`);
    }
    return res.json();
}

async function getAllActiveProducts(token) {
    console.log('Fetching all active products...');
    let products = [];
    let pageToken = null;
    let hasMore = true;

    while (hasMore) {
        let url = `/Products?fields=id,Product_Name,Product_Code,Product_Active,Show_on_Catalog&per_page=200`;
        if (pageToken) url += `&page_token=${pageToken}`;

        const response = await fetchZoho(url, token);
        if (response.data) {
            products.push(...response.data);
        }
        hasMore = response.info?.more_records ?? false;
        pageToken = response.info?.next_page_token ?? null;
    }

    return products.filter(p => p.Product_Active !== false && p.Show_on_Catalog === 'Yes');
}

async function fetchVariantsForProduct(productId, token) {
    let variants = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        const url = `/Product_Variants/search?criteria=((Product_Design:equals:${productId}))&fields=id,Name,Show_on_Catalog&per_page=200&page=${page}`;
        const response = await fetchZoho(url, token);
        if (response.data) {
            variants.push(...response.data);
        }
        hasMore = response.info?.more_records ?? false;
        page++;
    }

    return variants.filter(v => v.Show_on_Catalog === 'Yes');
}

async function processBatched(items, batchSize, fn) {
    const results = [];
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        console.log(`Processing batch ${i / batchSize + 1}/${Math.ceil(items.length / batchSize)}...`);
        const batchResults = await Promise.all(batch.map(fn));
        results.push(...batchResults);
    }
    return results;
}

async function main() {
    try {
        const token = await getAccessToken();
        const activeProducts = await getAllActiveProducts(token);
        console.log(`Found ${activeProducts.length} active products.`);

        const productsWithVariants = {};
        await processBatched(activeProducts, 10, async (p) => {
            const variants = await fetchVariantsForProduct(p.id, token);
            const parentSku = p.Product_Name || p.Product_Code || '';
            productsWithVariants[parentSku] = variants.map(v => v.Name);
        });

        console.log('Reading Excel file...');
        const workbook = XLSX.readFile(EXCEL_PATH);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log('Updating links...');
        const updatedData = data.map(row => {
            const designNo = row['Design No'];
            const variantSkus = productsWithVariants[designNo] || [];
            
            if (variantSkus.length > 0) {
                const links = variantSkus.map(vSku => `${DOMAIN}/share/${designNo}?variant=${encodeURIComponent(vSku)}`);
                row['link'] = links.join('\n');
            } else {
                row['link'] = 'Product not found or no active variants';
            }
            return row;
        });

        const newWorksheet = XLSX.utils.json_to_sheet(updatedData);
        
        // Add some style/width to the link column if possible
        const colWidths = [
            { wch: 15 }, // Label No.
            { wch: 30 }, // Item Name
            { wch: 15 }, // Design No
            { wch: 10 }, // Metal ID
            { wch: 10 }, // Gross Wt.
            { wch: 10 }, // Net Wt.
            { wch: 10 }, // Diamond Wt
            { wch: 10 }, // Stone Wt
            { wch: 5 },  // Pcs
            { wch: 15 }, // In Stock
            { wch: 100 } // link
        ];
        newWorksheet['!cols'] = colWidths;

        workbook.Sheets[sheetName] = newWorksheet;
        XLSX.writeFile(workbook, EXCEL_PATH);

        console.log('Excel file updated successfully.');
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

main();
