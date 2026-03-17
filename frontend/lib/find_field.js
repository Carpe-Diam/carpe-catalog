import fs from 'fs';
import https from 'https';

// Simple polyfill to read env vars
const envFile = fs.readFileSync('.env.local', 'utf8');
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        process.env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
    }
});

const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID;
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET;
const ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN;
const ZOHO_AUTH_DOMAIN = process.env.ZOHO_AUTH_DOMAIN || 'https://accounts.zoho.in';
const ZOHO_API_DOMAIN = process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.in';

async function getAccessToken() {
    const params = new URLSearchParams({
        refresh_token: ZOHO_REFRESH_TOKEN || '',
        client_id: ZOHO_CLIENT_ID || '',
        client_secret: ZOHO_CLIENT_SECRET || '',
        grant_type: 'refresh_token',
    });

    const response = await fetch(`${ZOHO_AUTH_DOMAIN}/oauth/v2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
    });

    const data = await response.json();
    return data.access_token;
}

async function main() {
    const token = await getAccessToken();
    if (!token) {
        console.error("No token retrieved");
        return;
    }

    // Get fields for Products
    const productsRes = await fetch(`${ZOHO_API_DOMAIN}/crm/v7/settings/fields?module=Products`, {
        headers: { Authorization: `Zoho-oauthtoken ${token}` }
    });

    const productsData = await productsRes.json();
    const productFields = productsData.fields?.filter(f => 
        f.field_label.toLowerCase().includes('catalog') || f.api_name.toLowerCase().includes('catalog')
    ) || [];

    console.log("Products Catalog Fields:", productFields.map(f => ({ label: f.field_label, api_name: f.api_name })));

    // Get fields for Variants
    const variantsRes = await fetch(`${ZOHO_API_DOMAIN}/crm/v7/settings/fields?module=Product_Variants`, {
        headers: { Authorization: `Zoho-oauthtoken ${token}` }
    });

    const variantsData = await variantsRes.json();
    const variantFields = variantsData.fields?.filter(f => 
        f.field_label.toLowerCase().includes('catalog') || f.api_name.toLowerCase().includes('catalog')
    ) || [];

    console.log("Variants Catalog Fields:", variantFields.map(f => ({ label: f.field_label, api_name: f.api_name })));
}

main().catch(console.error);
