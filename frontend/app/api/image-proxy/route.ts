import { NextRequest } from 'next/server';
import { getAccessToken } from '@/lib/zohoAuth';

const ZOHO_API_DOMAIN = process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.in';

/**
 * Proxies images/files from Zoho CRM.
 *
 * Supports two modes:
 *
 * 1) Record photo (profile image):
 *    /api/image-proxy?module=Product_Variants&id=RECORD_ID
 *
 * 2) File upload field attachment:
 *    /api/image-proxy?module=Product_Variants&id=RECORD_ID&attachment_id=FILE_ID
 */
export async function GET(req: NextRequest) {
    const module = req.nextUrl.searchParams.get('module') || 'Product_Variants';
    const recordId = req.nextUrl.searchParams.get('id');
    const attachmentId = req.nextUrl.searchParams.get('attachment_id');

    if (!recordId) {
        return new Response('Missing id parameter', { status: 400 });
    }

    // Validate record ID is numeric to prevent injection
    if (!/^\d+$/.test(recordId)) {
        return new Response('Invalid record ID', { status: 400 });
    }

    try {
        const token = await getAccessToken();

        let url: string;

        if (attachmentId) {
            // File upload field attachment download
            if (!/^\d+$/.test(attachmentId)) {
                return new Response('Invalid attachment ID', { status: 400 });
            }
            url = `${ZOHO_API_DOMAIN}/crm/v7/${module}/${recordId}/actions/download_fields_attachment?fields_attachment_id=${attachmentId}`;
        } else {
            // Record profile photo
            url = `${ZOHO_API_DOMAIN}/crm/v7/${module}/${recordId}/photo`;
        }

        const res = await fetch(url, {
            headers: {
                Authorization: `Zoho-oauthtoken ${token}`,
            },
        });

        if (!res.ok) {
            return new Response('Image not found', { status: 404 });
        }

        const contentType = res.headers.get('content-type') || 'image/jpeg';
        const buffer = await res.arrayBuffer();

        return new Response(buffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
        });
    } catch {
        return new Response('Error fetching image', { status: 500 });
    }
}
