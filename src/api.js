// -----------------------------
// Base API URL from .env file
// -----------------------------
const API_BASE = import.meta.env.VITE_API_URL;

// -----------------------------
// Helper: Build request headers
// -----------------------------
function buildHeaders() {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
}

// -----------------------------
// GET REQUEST
// -----------------------------
export async function apiGet(url) {
  const res = await fetch(API_BASE + url, {
    method: "GET",
    headers: buildHeaders(),
  });

  // Auto logout on 401
  if (res.status === 401) {
    localStorage.clear();
    window.location.href = "/login";
    return;
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "GET request failed");
  }

  return await res.json();
}

// -----------------------------
// POST REQUEST
// -----------------------------
export async function apiPost(url, body) {
  const res = await fetch(API_BASE + url, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });

  // Auto logout on unauthorized
  if (res.status === 401) {
    localStorage.clear();
    window.location.href = "/login";
    return;
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "POST request failed");
  }

  return await res.json();
}

// -----------------------------
// PUT REQUEST
// -----------------------------
export async function apiPut(url, body) {
  const res = await fetch(API_BASE + url, {
    method: "PUT",
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });

  if (res.status === 401) {
    localStorage.clear();
    window.location.href = "/login";
    return;
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "PUT request failed");
  }

  return await res.json();
}

// -----------------------------
// DELETE REQUEST
// -----------------------------
export async function apiDelete(url) {
  const res = await fetch(API_BASE + url, {
    method: "DELETE",
    headers: buildHeaders(),
  });

  if (res.status === 401) {
    localStorage.clear();
    window.location.href = "/login";
    return;
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "DELETE request failed");
  }

  return await res.json();
}
