import { apiRequest } from "./api";

const TOKEN_KEY = "fitflow_token";
const USER_KEY = "fitflow_user";

function saveAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

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

function isAuthenticated() {
  return Boolean(getStoredToken());
}

async function login(email, password) {
  const data = await apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  saveAuth(data.token, data.user);
  return data;
}

async function logout() {
  try {
    await apiRequest("/api/auth/logout", { method: "POST" });
  } finally {
    clearAuth();
  }
}

export {
  login,
  logout,
  saveAuth,
  clearAuth,
  getStoredToken,
  getStoredUser,
  isAuthenticated,
};
