/**
 * Type-safe API client for PDMS backend.
 */

import { getStoredToken } from "@/lib/auth";

// Use relative URL so requests go through Next.js rewrites (avoids CORS)
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
const REQUEST_TIMEOUT_MS = 10_000;

interface RequestOptions extends RequestInit {
  token?: string;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token: explicitToken, ...fetchOptions } = options;
  const token = explicitToken || getStoredToken();
  const isFormData = typeof FormData !== "undefined" && fetchOptions.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((fetchOptions.headers as Record<string, string>) || {}),
  };

  const hasContentType = Object.keys(headers).some((k) => k.toLowerCase() === "content-type");
  if (!isFormData && !hasContentType) {
    headers["Content-Type"] = "application/json";
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...fetchOptions,
      headers,
      signal: fetchOptions.signal ?? controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError(408, "Anfrage-Timeout: Server antwortet nicht rechtzeitig");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: "Unbekannter Fehler" }));
    throw new ApiError(response.status, body.detail || response.statusText);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export const api = {
  get: <T>(path: string, token?: string) => request<T>(path, { method: "GET", token }),
  post: <T>(path: string, body: unknown, token?: string) =>
    request<T>(path, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
      token,
    }),
  put: <T>(path: string, body: unknown, token?: string) =>
    request<T>(path, {
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body),
      token,
    }),
  patch: <T>(path: string, body: unknown, token?: string) =>
    request<T>(path, {
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body),
      token,
    }),
  delete: (path: string, token?: string) => request<void>(path, { method: "DELETE", token }),
};

export { ApiError };
