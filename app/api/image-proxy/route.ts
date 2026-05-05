import { NextRequest } from 'next/server';
import { getAccessToken, invalidateToken } from '@/lib/zohoAuth';

const ZOHO_API_DOMAIN = process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.in';

/**
 * Proxies images/files from Zoho CRM.
 *
 * Supports two modes:
 *
 * 1) Record photo:
 *    /api/image-proxy?module=Product_Variants&id=RECORD_ID
 *
 * 2) File upload field attachment:
 *    /api/image-proxy?module=Product_Variants&id=RECORD_ID&attachment_id=FILE_ID
 */
export async function GET(req: NextRequest) {
    const module = req.nextUrl.searchParams.get('module') || 'Product_Variants';
    const recordId = req.nextUrl.searchParams.get('id');
    const attachmentId = req.nextUrl.searchParams.get('attachment_id');

    if (!recordId || !/^\d+$/.test(recordId)) {
        return new Response('Invalid record ID', { status: 400 });
    }
    if (attachmentId && !/^\d+$/.test(attachmentId)) {
        return new Response('Invalid attachment ID', { status: 400 });
    }

    const zohoUrl = attachmentId
        ? `${ZOHO_API_DOMAIN}/crm/v7/${module}/${recordId}/actions/download_fields_attachment?fields_attachment_id=${attachmentId}`
        : `${ZOHO_API_DOMAIN}/crm/v7/${module}/${recordId}/photo`;

    const context = `${module}/${recordId}${attachmentId ? `/${attachmentId}` : '/photo'}`;

    // Attempt the fetch up to twice — second attempt uses a freshly-minted token
    // in case the cached one expired between ISR cycles.
    for (let attempt = 1; attempt <= 2; attempt++) {
        let token: string;
        try {
            token = await getAccessToken();
        } catch (err: any) {
            console.error(`[image-proxy] auth-error attempt=${attempt} ${context} — ${err?.message}`);
            // 503 = temporary, tells the browser/CDN to retry
            return new Response('Service temporarily unavailable', { status: 503 });
        }

        let res: Response;
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 12_000);
            res = await fetch(zohoUrl, {
                headers: { Authorization: `Zoho-oauthtoken ${token}` },
                signal: controller.signal,
            });
            clearTimeout(timeout);
        } catch (err: any) {
            const timedOut = err?.name === 'AbortError';
            console.error(`[image-proxy] fetch-${timedOut ? 'timeout' : 'error'} attempt=${attempt} ${context} — ${err?.message}`);
            return new Response(timedOut ? 'Upstream timeout' : 'Upstream error', {
                status: timedOut ? 504 : 502,
            });
        }

        // Token was rejected — invalidate it and retry once with a fresh one
        if (res.status === 401) {
            console.warn(`[image-proxy] 401 attempt=${attempt} ${context} — invalidating token`);
            invalidateToken(token);
            if (attempt < 2) continue;
            return new Response('Image not found', { status: 404 });
        }

        if (!res.ok || res.status === 204) {
            const body = res.status !== 204 ? await res.text().catch(() => '') : 'No content';
            console.error(`[image-proxy] zoho-${res.status} ${context} — ${body.slice(0, 300)}`);
            return new Response('Image not found', { status: 404 });
        }

        const contentType = res.headers.get('content-type') || 'image/jpeg';

        // Stream directly — avoids buffering the entire image in memory,
        // which can OOM the function for large product photos.
        return new Response(res.body, {
            headers: {
                'Content-Type': contentType,
                // Vercel CDN edge cache: serve from edge indefinitely, revalidate in background
                'Cache-Control': 'public, max-age=86400, s-maxage=31536000, stale-while-revalidate=86400',
                'CDN-Cache-Control': 'public, max-age=31536000, immutable',
                'Vercel-CDN-Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    }

    return new Response('Image not found', { status: 404 });
}
