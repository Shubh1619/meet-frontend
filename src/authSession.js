export const AUTH_MESSAGE_KEY = "auth_message";

export function getAccessToken() {
  return localStorage.getItem("token");
}

export function getRefreshToken() {
  return localStorage.getItem("refresh_token");
}

export function setAuthSession(accessToken, refreshToken, user = null) {
  if (accessToken) {
    localStorage.setItem("token", accessToken);
  } else {
    localStorage.removeItem("token");
  }
  if (refreshToken) {
    localStorage.setItem("refresh_token", refreshToken);
  } else {
    localStorage.removeItem("refresh_token");
  }
  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
  }
}

export function clearAuthSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
}

export function setAuthMessage(message) {
  if (message) sessionStorage.setItem(AUTH_MESSAGE_KEY, message);
}

export function popAuthMessage() {
  const msg = sessionStorage.getItem(AUTH_MESSAGE_KEY) || "";
  if (msg) sessionStorage.removeItem(AUTH_MESSAGE_KEY);
  return msg;
}

function parseJwt(token) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

export function isAccessTokenValid(token) {
  if (!token) return false;
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return false;
  const now = Math.floor(Date.now() / 1000);
  return Number(payload.exp) > now + 5;
}

export function forceLogoutAndRedirect(message = "Session expired, please login again") {
  clearAuthSession();
  setAuthMessage(message);
  if (window.location.pathname !== "/login") {
    window.location.replace("/login");
  }
}
