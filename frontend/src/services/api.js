const API_BASE_URL = "http://localhost:3000";

const TOKEN_KEY = "fitflow_token";
const USER_KEY = "fitflow_user";

function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function apiRequest(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const token = getStoredToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const user = getStoredUser();
  if (user && user.userRole) {
    headers["x-user-role"] = user.userRole;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error("Unexpected server response.");
  }

  if (!response.ok || body.success === false) {
    const err = new Error(
      (body.error && body.error.message) || "Request failed."
    );
    if (body.error) {
      err.code = body.error.code;
      err.details = body.error.details;
    }
    throw err;
  }

  return body.data;
}

export { API_BASE_URL, apiRequest };
