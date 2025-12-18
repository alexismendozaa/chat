/* global process */
const API_URL = (() => {
  if (typeof globalThis !== 'undefined' && globalThis.__APP_BACKEND_URL) {
    return globalThis.__APP_BACKEND_URL;
  }
  if (typeof process !== 'undefined' && process?.env?.VITE_BACKEND_URL) {
    return process.env.VITE_BACKEND_URL;
  }
  try {
    return new Function(
      'return (typeof import !== "undefined" && import.meta && import.meta.env && import.meta.env.VITE_BACKEND_URL) ? import.meta.env.VITE_BACKEND_URL : "";'
    )();
  } catch {
    return "";
  }
})();

export async function login(username, password) {
  const r = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "login failed");
  return data.token;
}

export async function register(username, password) {
  const r = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "register failed");
  return true;
}
