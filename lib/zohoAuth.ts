/**
 * Zoho CRM OAuth2 Token Manager
 *
 * Uses the refresh token to automatically obtain and cache access tokens.
 * Access tokens expire every 60 minutes; this module handles transparent refresh.
 *
 * This implementation uses both a file-based cache for cross-process build coordination
 * and Next.js's `unstable_cache` for cross-lambda runtime caching on Vercel.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { unstable_cache } from 'next/cache';

const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID!;
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET!;
const ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN!;
const ZOHO_ACCOUNTS_URL = (process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.in').replace(/\/$/, '');

// File paths for cross-process coordination during build (single instance)
const TOKEN_CACHE_PATH = path.join(os.tmpdir(), 'zoho-token-cache.json');
const LOCK_FILE_PATH = path.join(os.tmpdir(), 'zoho-token.lock');

interface TokenData {
    accessToken: string;
    expiresAt: number;
}

let memoryCachedToken: string | null = null;
let memoryTokenExpiresAt: number = 0;
let refreshPromise: Promise<string> | null = null;

/**
 * Read token from file cache
 */
function getFileCachedToken(): TokenData | null {
    try {
        if (fs.existsSync(TOKEN_CACHE_PATH)) {
            const data = fs.readFileSync(TOKEN_CACHE_PATH, 'utf-8');
            const parsed = JSON.parse(data);
            if (parsed && parsed.accessToken && parsed.expiresAt) {
                return parsed;
            }
        }
    } catch (e) {
        // Ignore errors
    }
    return null;
}

/**
 * Write token to file cache
 */
function setFileCachedToken(token: string, expiresAt: number) {
    try {
        const data: TokenData = { accessToken: token, expiresAt };
        fs.writeFileSync(TOKEN_CACHE_PATH, JSON.stringify(data), 'utf-8');
    } catch (e) {
        // Ignore errors
    }
}

/**
 * Performs the actual OAuth refresh.
 * Wrapped in unstable_cache below to share across Vercel lambdas.
 */
const getCachedZohoToken = unstable_cache(
    async (): Promise<TokenData> => {
        const params = new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: ZOHO_CLIENT_ID,
            client_secret: ZOHO_CLIENT_SECRET,
            refresh_token: ZOHO_REFRESH_TOKEN,
        });

        console.log(`[ZohoAuth] Refreshing token at runtime from ${ZOHO_ACCOUNTS_URL}...`);
        
        const res = await fetch(`${ZOHO_ACCOUNTS_URL}/oauth/v2/token`, {
            method: 'POST',
            body: params,
            cache: 'no-store',
        });

        const data = await res.json();

        if (!res.ok || data.error) {
            console.error(`[ZohoAuth] Refresh failed: ${res.status} — ${JSON.stringify(data)}`);
            throw new Error(`Zoho refresh failed: ${data.error || res.status}`);
        }

        const expiresAt = Date.now() + (data.expires_in || 3600) * 1000;
        return { accessToken: data.access_token, expiresAt };
    },
    ['zoho-access-token'],
    {
        revalidate: 3300, // Revalidate every 55 mins (Zoho tokens last 60 mins)
        tags: ['zoho-token']
    }
);

/**
 * Get a valid Zoho access token.
 */
export async function getAccessToken(): Promise<string> {
    const now = Date.now();
    const BUFFER_TIME = 2 * 60 * 1000;

    // 1. Memory check (process-local)
    if (memoryCachedToken && now < memoryTokenExpiresAt - BUFFER_TIME) {
        return memoryCachedToken;
    }

    // 2. File check (build-worker coordination)
    const fileData = getFileCachedToken();
    if (fileData && now < fileData.expiresAt - BUFFER_TIME) {
        memoryCachedToken = fileData.accessToken;
        memoryTokenExpiresAt = fileData.expiresAt;
        return memoryCachedToken;
    }

    // 3. Centralized Next.js Cache (cross-lambda runtime coordination)
    // This is the primary fix for the "Access Denied" error on Vercel
    try {
        const data = await getCachedZohoToken();
        if (data && data.accessToken) {
            memoryCachedToken = data.accessToken;
            memoryTokenExpiresAt = data.expiresAt;
            
            // Also update file cache for this worker
            setFileCachedToken(data.accessToken, data.expiresAt);
            
            return data.accessToken;
        }
    } catch (e) {
        console.error('[ZohoAuth] unstable_cache fetch failed, falling back to direct refresh.');
    }

    // 4. Fallback: Direct refresh (with local process deduplication)
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
        try {
            return await refreshAccessToken();
        } finally {
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}

async function refreshAccessToken(retryCount = 0): Promise<string> {
    const MAX_RETRIES = 5;
    const BUFFER_TIME = 2 * 60 * 1000;

    // Lock file check
    let hasLock = false;
    try {
        fs.writeFileSync(LOCK_FILE_PATH, process.pid.toString(), { flag: 'wx' });
        hasLock = true;
    } catch (e) {
        if (retryCount < MAX_RETRIES) {
            const wait = 1000 + Math.random() * 2000;
            await new Promise(resolve => setTimeout(resolve, wait));
            return refreshAccessToken(retryCount + 1);
        }
    }

    try {
        const params = new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: ZOHO_CLIENT_ID,
            client_secret: ZOHO_CLIENT_SECRET,
            refresh_token: ZOHO_REFRESH_TOKEN,
        });

        const res = await fetch(`${ZOHO_ACCOUNTS_URL}/oauth/v2/token`, {
            method: 'POST',
            body: params,
            cache: 'no-store',
        });

        const data = await res.json();
        const errorDesc = (data.error_description || '').toLowerCase();
        const isRateLimit = res.status === 429 || 
            (res.status === 400 && (errorDesc.includes('too many requests') || errorDesc.includes('access denied')));

        if (isRateLimit && retryCount < MAX_RETRIES) {
            const delay = Math.pow(2, retryCount) * 3000 + Math.random() * 3000;
            console.warn(`[ZohoAuth] Fallback rate limit hit. Retrying in ${Math.round(delay)}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            return refreshAccessToken(retryCount + 1);
        }

        if (!res.ok || data.error) {
            throw new Error(`Zoho fallback refresh failed: ${data.error || res.status}`);
        }

        const expiresAt = Date.now() + (data.expires_in || 3600) * 1000;
        memoryCachedToken = data.access_token;
        memoryTokenExpiresAt = expiresAt;

        setFileCachedToken(memoryCachedToken!, expiresAt);
        return memoryCachedToken!;
    } finally {
        if (hasLock) {
            try { fs.unlinkSync(LOCK_FILE_PATH); } catch (e) {}
        }
    }
}

/**
 * Invalidate the cached token.
 */
export function invalidateToken(failedToken: string): void {
    if (!failedToken) return;

    if (memoryCachedToken === failedToken) {
        memoryCachedToken = null;
        memoryTokenExpiresAt = 0;
    }

    const fileData = getFileCachedToken();
    if (fileData && fileData.accessToken === failedToken) {
        try { if (fs.existsSync(TOKEN_CACHE_PATH)) fs.unlinkSync(TOKEN_CACHE_PATH); } catch (e) {}
    }
}
