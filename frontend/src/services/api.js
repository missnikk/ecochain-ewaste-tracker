const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function request(path, options) {
  try {
    const res = await fetch(`${BASE}${path}`, options);
    const body = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, error: (body && body.error) || `HTTP ${res.status}` };
    return { ok: true, data: body };
  } catch {
    return { ok: false, error: "Backend not reachable" };   // pages must still render
  }
}

export const api = {
  health: () => request("/api/health"),
  catalog: () => request("/api/catalog"),
  devices: (query = "") => request(`/api/devices${query}`),
  device: (id) => request(`/api/devices/${id}`),
  saveMetadata: (id, meta) => request(`/api/devices/${id}/metadata`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(meta),
  }),
  uploadCertificate: (id, payload) => request(`/api/certificates/${id}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  }),
  certificateUrl: (id) => `${BASE}/api/certificates/${id}`,
  events: (limit = 50) => request(`/api/events?limit=${limit}`),
  analytics: () => request("/api/analytics"),
  participants: () => request("/api/participants"),
};
