import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { getAccessToken } from './zohoAuth';

const ZOHO_API_DOMAIN = process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.in';

async function main() {
    const token = await getAccessToken();

    // Get fields for Products
    const productsRes = await fetch(`${ZOHO_API_DOMAIN}/crm/v7/settings/fields?module=Products`, {
        headers: {
            Authorization: `Zoho-oauthtoken ${token}`
        }
    });

    const productsData = await productsRes.json();
    const productFields = productsData.fields?.filter((f: any) => f.field_label.toLowerCase().includes('catalog') || f.api_name.toLowerCase().includes('catalog')) || [];

    console.log("Products Catalog Fields:", productFields.map((f: any) => ({ label: f.field_label, api_name: f.api_name })));

    // Get fields for Variants
    const variantsRes = await fetch(`${ZOHO_API_DOMAIN}/crm/v7/settings/fields?module=Product_Variants`, {
        headers: {
            Authorization: `Zoho-oauthtoken ${token}`
        }
    });

    const variantsData = await variantsRes.json();
    const variantFields = variantsData.fields?.filter((f: any) => f.field_label.toLowerCase().includes('catalog') || f.api_name.toLowerCase().includes('catalog')) || [];

    console.log("Variants Catalog Fields:", variantFields.map((f: any) => ({ label: f.field_label, api_name: f.api_name })));
}

main().catch(console.error);
