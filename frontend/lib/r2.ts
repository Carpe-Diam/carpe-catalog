/**
 * Cloudflare R2 Image Sync
 *
 * Syncs Zoho CRM images to Cloudflare R2 (free egress CDN) during ISR cache
 * revalidation. Once an image is in R2, it is served directly from Cloudflare's
 * global edge — zero Vercel origin transfer, zero function invocations per image.
 *
 * Required env vars:
 *   R2_ACCOUNT_ID        — Cloudflare account ID
 *   R2_ACCESS_KEY_ID     — R2 API token (R2 Token → Access Key ID)
 *   R2_SECRET_ACCESS_KEY — R2 API token (R2 Token → Secret Access Key)
 *   R2_BUCKET_NAME       — R2 bucket name (must be public)
 *   R2_PUBLIC_URL        — Public bucket URL (e.g. https://assets.yourdomain.com)
 *
 * Falls back to the image proxy transparently if R2 is not configured.
 */

import { S3Client, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getAccessToken } from './zohoAuth';

const ZOHO_API_DOMAIN = process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.in';

export const R2_ENABLED = !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME &&
    process.env.R2_PUBLIC_URL
);

const CDN_URL = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');

let _r2: S3Client | null = null;
function r2(): S3Client {
    if (!_r2) {
        _r2 = new S3Client({
            region: 'auto',
            endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID!,
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
            },
        });
    }
    return _r2;
}

async function existsInR2(key: string): Promise<boolean> {
    try {
        await r2().send(new HeadObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME!,
            Key: key,
        }));
        return true;
    } catch {
        return false;
    }
}

async function fetchZohoImage(url: string): Promise<{ buffer: ArrayBuffer; contentType: string } | null> {
    try {
        const token = await getAccessToken();
        const res = await fetch(url, {
            headers: { Authorization: `Zoho-oauthtoken ${token}` },
        });
        if (!res.ok || res.status === 204) return null;
        const buffer = await res.arrayBuffer();
        const contentType = res.headers.get('content-type') || 'image/jpeg';
        return { buffer, contentType };
    } catch {
        return null;
    }
}

/**
 * Ensure an image exists in R2, uploading from Zoho if needed.
 * Returns the public CDN URL, or null on failure.
 */
export async function syncToR2(key: string, zohoUrl: string): Promise<string | null> {
    if (!R2_ENABLED) return null;

    if (await existsInR2(key)) {
        return `${CDN_URL}/${key}`;
    }

    const image = await fetchZohoImage(zohoUrl);
    if (!image) return null;

    try {
        await r2().send(new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME!,
            Key: key,
            Body: Buffer.from(image.buffer),
            ContentType: image.contentType,
            CacheControl: 'public, max-age=31536000, immutable',
        }));
        return `${CDN_URL}/${key}`;
    } catch (err) {
        console.error(`[R2] Upload failed for ${key}:`, err);
        return null;
    }
}

/**
 * Parse an image-proxy URL into the R2 key and the direct Zoho source URL.
 * Returns null if the input is not a proxy URL.
 */
export function parseProxyUrl(proxyUrl: string): { r2Key: string; zohoUrl: string } | null {
    if (!proxyUrl?.startsWith('/api/image-proxy')) return null;

    const qs = proxyUrl.indexOf('?');
    if (qs === -1) return null;

    const params = new URLSearchParams(proxyUrl.slice(qs + 1));
    const module = params.get('module') || 'Product_Variants';
    const id = params.get('id');
    const attachmentId = params.get('attachment_id');

    if (!id) return null;

    if (attachmentId) {
        return {
            r2Key: `images/${module}/${id}/${attachmentId}`,
            zohoUrl: `${ZOHO_API_DOMAIN}/crm/v7/${module}/${id}/actions/download_fields_attachment?fields_attachment_id=${attachmentId}`,
        };
    }

    return {
        r2Key: `images/${module}/${id}/photo`,
        zohoUrl: `${ZOHO_API_DOMAIN}/crm/v7/${module}/${id}/photo`,
    };
}
