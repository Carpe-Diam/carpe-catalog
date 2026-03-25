/**
 * Zoho CRM OAuth2 Token Manager
 *
 * Uses the refresh token to automatically obtain and cache access tokens.
 * Access tokens expire every 60 minutes; this module handles transparent refresh.
 *
 * During Next.js builds, multiple worker processes may try to refresh simultaneously.
 * We use a file-based cache and a lock file in /tmp to coordinate across processes.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID!;
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET!;
const ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN!;
const ZOHO_ACCOUNTS_URL = (process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.in').replace(/\/$/, '');

// File paths for cross-process token caching and locking
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
        // Ignore read/parse errors
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
        // Ignore write errors
    }
}

/**
 * Get a valid Zoho access token.
 * Returns a cached token if still valid, otherwise refreshes automatically.
 */
export async function getAccessToken(): Promise<string> {
    const now = Date.now();
    const BUFFER_TIME = 2 * 60 * 1000; // 2 minute buffer

    // 1. Check in-memory cache first
    if (memoryCachedToken && now < memoryTokenExpiresAt - BUFFER_TIME) {
        return memoryCachedToken;
    }

    // 2. Check file cache
    const fileData = getFileCachedToken();
    if (fileData && now < fileData.expiresAt - BUFFER_TIME) {
        memoryCachedToken = fileData.accessToken;
        memoryTokenExpiresAt = fileData.expiresAt;
        return memoryCachedToken;
    }

    // 3. Deduplicate within the same process
    if (refreshPromise) {
        return refreshPromise;
    }

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

    // Check file cache again right before starting, in case another process refreshed it
    const fileData = getFileCachedToken();
    if (fileData && Date.now() < fileData.expiresAt - BUFFER_TIME) {
        memoryCachedToken = fileData.accessToken;
        memoryTokenExpiresAt = fileData.expiresAt;
        return memoryCachedToken;
    }

    // Cross-process locking: try to acquire lock
    let hasLock = false;
    try {
        // 'wx' flag fails if file exists
        fs.writeFileSync(LOCK_FILE_PATH, process.pid.toString(), { flag: 'wx' });
        hasLock = true;
    } catch (e) {
        // Lock exists, wait and retry checking the file cache
        if (retryCount < MAX_RETRIES) {
            const wait = 1000 + Math.random() * 2000;
            console.log(`[ZohoAuth] Waiting for lock... retry ${retryCount + 1}`);
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

        console.log(`[ZohoAuth] Fetching fresh token from ${ZOHO_ACCOUNTS_URL}...`);
        
        const res = await fetch(`${ZOHO_ACCOUNTS_URL}/oauth/v2/token`, {
            method: 'POST',
            body: params,
            // CRITICAL: Prevent Next.js from caching the token response (especially failures)
            cache: 'no-store',
            // @ts-ignore - for some versions of next
            next: { revalidate: 0 }
        });

        const data = await res.json();

        // Detect rate limit: Zoho India returns 400 for rate limits on refresh
        const errorDesc = (data.error_description || '').toLowerCase();
        const isRateLimit = res.status === 429 || 
            (res.status === 400 && (errorDesc.includes('too many requests') || errorDesc.includes('access denied')));

        if (isRateLimit && retryCount < MAX_RETRIES) {
            const delay = Math.pow(2, retryCount) * 3000 + Math.random() * 3000;
            console.warn(`[ZohoAuth] Rate limit hit. Retrying in ${Math.round(delay)}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            return refreshAccessToken(retryCount + 1);
        }

        if (!res.ok) {
            throw new Error(`Zoho token refresh failed: ${res.status} — ${JSON.stringify(data)}`);
        }

        if (data.error) {
            throw new Error(`Zoho token error: ${data.error} — ${data.error_description}`);
        }

        const expiresAt = Date.now() + (data.expires_in || 3600) * 1000;
        memoryCachedToken = data.access_token;
        memoryTokenExpiresAt = expiresAt;

        setFileCachedToken(memoryCachedToken!, expiresAt);
        console.log('✅ [ZohoAuth] Access token refreshed successfully.');
        return memoryCachedToken!;
    } finally {
        // Release lock
        if (hasLock) {
            try { fs.unlinkSync(LOCK_FILE_PATH); } catch (e) {}
        }
    }
}

/**
 * Invalidate the cached token.
 * ONLY invalidates if the provided token matches the current one,
 * preventing race conditions between parallel requests.
 */
export function invalidateToken(failedToken: string): void {
    if (!failedToken) return;

    if (memoryCachedToken === failedToken) {
        console.log('[ZohoAuth] Invalidating in-memory token.');
        memoryCachedToken = null;
        memoryTokenExpiresAt = 0;
    }

    const fileData = getFileCachedToken();
    if (fileData && fileData.accessToken === failedToken) {
        console.log('[ZohoAuth] Invalidating file-cached token.');
        try {
            if (fs.existsSync(TOKEN_CACHE_PATH)) {
                fs.unlinkSync(TOKEN_CACHE_PATH);
            }
        } catch (e) {}
    }
}
