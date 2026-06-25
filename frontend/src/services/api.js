const API_BASE_URL = "http://localhost:3000";

const TOKEN_KEY = "fitflow_token";

function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
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

  // x-user-role header intentionally omitted — all routes use JWT from Authorization

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
      err.httpStatus = response.status;
    }
    throw err;
  }

  return body.data;
}

export { API_BASE_URL, apiRequest };
