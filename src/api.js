import {
  getAccessToken,
  getRefreshToken,
  setAuthSession,
} from "./authSession";
import { formatApiError } from "./utils/formUtils";

const RAW_API_BASE = (import.meta.env.VITE_API_URL || "").trim().replace(/\/+$/, "");
const IS_LOCAL_HOST =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

export const API_BASE =
  RAW_API_BASE || (IS_LOCAL_HOST ? "http://127.0.0.1:8000" : "https://ai-meeting-assistant-zigx.onrender.com");

export function getApiErrorMessage(payload, fallback = "Request failed") {
  if (!payload || typeof payload !== "object") return fallback;
  return formatApiError(payload.detail ?? payload.message ?? payload.error, fallback);
}

function buildHeaders(extra = {}) {
  const token = getAccessToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

let refreshInFlight = null;

async function refreshAccessToken() {
  if (refreshInFlight) return refreshInFlight;

  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data?.access_token) return null;
      setAuthSession(data.access_token, data.refresh_token || refreshToken);
      return data.access_token;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

async function apiRequest(url, options = {}, allowRetry = true) {
  const res = await fetch(`${API_BASE}${url}`, options);
  if (res.status === 401 && allowRetry && getRefreshToken()) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      const retryHeaders = {
        ...(options.headers || {}),
        Authorization: `Bearer ${newToken}`,
      };
      return apiRequest(url, { ...options, headers: retryHeaders }, false);
    }
  }
  return res;
}

// -----------------------------
// GET REQUEST
// -----------------------------
export async function apiGet(url) {
  const res = await apiRequest(url, {
    method: "GET",
    headers: buildHeaders(),
  });

  if (!res) return;

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(getApiErrorMessage(error, "GET request failed"));
  }

  return await res.json();
}

// -----------------------------
// POST REQUEST
// -----------------------------
export async function apiPost(url, body) {
  const res = await apiRequest(url, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });

  if (!res) return;

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(getApiErrorMessage(error, "POST request failed"));
  }

  return await res.json();
}

// -----------------------------
// PUT REQUEST
// -----------------------------
export async function apiPut(url, body) {
  const res = await apiRequest(url, {
    method: "PUT",
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });

  if (!res) return;

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(getApiErrorMessage(error, "PUT request failed"));
  }

  return await res.json();
}

// -----------------------------
// DELETE REQUEST
// -----------------------------
export async function apiDelete(url) {
  const res = await apiRequest(url, {
    method: "DELETE",
    headers: buildHeaders(),
  });

  if (!res) return;

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(getApiErrorMessage(error, "DELETE request failed"));
  }

  return await res.json();
}
