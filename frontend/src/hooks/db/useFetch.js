const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
 
/**
 * Yhtenäinen fetch-apuri error-käsittelyllä.
 * Heittää virheen HTTP-virheen tai verkkohäiriön sattuessa.
 */
export async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`${options.method ?? "GET"} ${path} → HTTP ${res.status}`);
  return res.json();
}