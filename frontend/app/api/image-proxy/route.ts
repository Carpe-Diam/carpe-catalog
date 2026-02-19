import { NextRequest } from 'next/server';
import { getAccessToken } from '@/lib/zohoAuth';

/**
 * Proxies Zoho WorkDrive image URLs.
 * The browser can't access these directly (401), so we fetch server-side
 * with the Zoho OAuth token and stream the image through.
 */
export async function GET(req: NextRequest) {
    const imageUrl = req.nextUrl.searchParams.get('url');

    if (!imageUrl) {
        return new Response('Missing url parameter', { status: 400 });
    }

    // Only allow Zoho domains
    if (!imageUrl.includes('zoho.in') && !imageUrl.includes('zoho.com')) {
        return new Response('Invalid image URL', { status: 400 });
    }

    try {
        const token = await getAccessToken();

        const res = await fetch(imageUrl, {
            headers: {
                'Authorization': `Zoho-oauthtoken ${token}`,
                'User-Agent': 'Mozilla/5.0',
            },
        });

        if (!res.ok) {
            // If auth fails, try without auth (some URLs may be public)
            const publicRes = await fetch(imageUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0',
                },
            });

            if (!publicRes.ok) {
                return new Response('Failed to fetch image', { status: publicRes.status });
            }

            const contentType = publicRes.headers.get('content-type') || 'image/jpeg';
            const buffer = await publicRes.arrayBuffer();

            return new Response(buffer, {
                headers: {
                    'Content-Type': contentType,
                    'Cache-Control': 'public, max-age=86400',
                },
            });
        }

        const contentType = res.headers.get('content-type') || 'image/jpeg';
        const buffer = await res.arrayBuffer();

        return new Response(buffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400',
            },
        });
    } catch {
        return new Response('Error fetching image', { status: 500 });
    }
}
