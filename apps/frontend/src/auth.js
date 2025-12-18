/* global process */
const API_URL = (() => {
  try {
    return (import.meta?.env?.VITE_BACKEND_URL) || "";
  } catch {
    if (typeof process !== 'undefined' && process?.env?.VITE_BACKEND_URL) {
      return process.env.VITE_BACKEND_URL;
    }
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
