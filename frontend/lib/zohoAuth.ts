/**
 * Zoho CRM OAuth2 Token Manager
 *
 * Uses the refresh token to automatically obtain and cache access tokens.
 * Access tokens expire every 60 minutes; this module handles transparent refresh.
 */

const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID!;
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET!;
const ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN!;
const ZOHO_ACCOUNTS_URL = process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.in';

let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Get a valid Zoho access token.
 * Returns a cached token if still valid, otherwise refreshes automatically.
 */
export async function getAccessToken(): Promise<string> {
    // Return cached token if it hasn't expired (with 5-minute buffer)
    if (cachedToken && Date.now() < tokenExpiresAt - 5 * 60 * 1000) {
        return cachedToken;
    }

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

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Zoho token refresh failed: ${res.status} — ${errorText}`);
    }

    const data = await res.json();

    if (data.error) {
        throw new Error(`Zoho token error: ${data.error}`);
    }

    cachedToken = data.access_token;
    tokenExpiresAt = Date.now() + data.expires_in * 1000;

    return cachedToken!;
}
