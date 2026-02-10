/**
 * Keycloak OIDC configuration with PKCE support.
 */

export const KC_CONFIG = {
  url: process.env.NEXT_PUBLIC_KC_URL || "http://localhost:8080",
  realm: process.env.NEXT_PUBLIC_KC_REALM || "pdms-home-spital",
  clientId: process.env.NEXT_PUBLIC_KC_CLIENT || "pdms-web",
};

const TOKEN_KEY = "pdms_token";
const REFRESH_KEY = "pdms_refresh";
const VERIFIER_KEY = "pdms_pkce_verifier";

/** Generate a cryptographic random string for PKCE */
function generateRandomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, length);
}

/** Create a SHA-256 code challenge from a verifier */
async function createCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);

  // crypto.subtle is only available in Secure Contexts (HTTPS or localhost)
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const digest = await crypto.subtle.digest("SHA-256", data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }

  // Fallback: use plain verifier as challenge (S256 won't work, but avoids crash)
  // This only happens on non-HTTPS non-localhost dev environments
  console.warn("crypto.subtle not available — PKCE S256 degraded to plain challenge");
  return btoa(verifier)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Build Keycloak login URL with PKCE */
export async function getLoginUrl(): Promise<string> {
  const verifier = generateRandomString(64);
  const challenge = await createCodeChallenge(verifier);
  sessionStorage.setItem(VERIFIER_KEY, verifier);

  const params = new URLSearchParams({
    client_id: KC_CONFIG.clientId,
    redirect_uri: `${window.location.origin}/callback`,
    response_type: "code",
    scope: "openid profile email",
    code_challenge: challenge,
    code_challenge_method: "S256",
  });
  return `${KC_CONFIG.url}/realms/${KC_CONFIG.realm}/protocol/openid-connect/auth?${params}`;
}

/** Exchange authorization code for tokens */
export async function exchangeCode(code: string): Promise<TokenResponse> {
  const verifier = sessionStorage.getItem(VERIFIER_KEY) || "";
  sessionStorage.removeItem(VERIFIER_KEY);

  const tokenUrl = `${KC_CONFIG.url}/realms/${KC_CONFIG.realm}/protocol/openid-connect/token`;
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: KC_CONFIG.clientId,
    code,
    redirect_uri: `${window.location.origin}/callback`,
    code_verifier: verifier,
  });

  const resp = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Token exchange failed: ${err}`);
  }
  return resp.json();
}

/** Refresh the access token */
export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const tokenUrl = `${KC_CONFIG.url}/realms/${KC_CONFIG.realm}/protocol/openid-connect/token`;
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: KC_CONFIG.clientId,
    refresh_token: refreshToken,
  });

  const resp = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!resp.ok) throw new Error("Token refresh failed");
  return resp.json();
}

/** Decode a JWT payload (without verification — server does that) */
export function parseJwt(token: string): JwtPayload {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
  return JSON.parse(jsonPayload);
}

export function getLogoutUrl(): string {
  const params = new URLSearchParams({
    client_id: KC_CONFIG.clientId,
    post_logout_redirect_uri: window.location.origin,
  });
  return `${KC_CONFIG.url}/realms/${KC_CONFIG.realm}/protocol/openid-connect/logout?${params}`;
}

// --- Token storage helpers ---
export function saveTokens(access: string, refresh: string) {
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

// --- Types ---
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
}

export interface JwtPayload {
  sub: string;
  preferred_username?: string;
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  realm_access?: { roles: string[] };
  exp: number;
  iat: number;
}
