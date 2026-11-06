const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function request(path, options, defaultArray = false) {
  try {
    const res = await fetch(`${BASE}${path}`, options);
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      if (defaultArray) {
        const arr = [];
        arr.ok = false;
        arr.data = [];
        arr.error = (body && body.error) || `HTTP ${res.status}`;
        return arr;
      }
      return { ok: false, error: (body && body.error) || `HTTP ${res.status}` };
    }
    if (Array.isArray(body)) {
      body.ok = true;
      body.data = body;
      body.error = null;
      return body;
    }
    return { ok: true, data: body };
  } catch (err) {
    if (defaultArray) {
      const arr = [];
      arr.ok = false;
      arr.data = [];
      arr.error = "Backend not reachable";
      return arr;
    }
    return { ok: false, error: "Backend not reachable" };
  }
}

function buildQuery(query) {
  if (!query) return "";
  if (typeof query === "string") return query.startsWith("?") ? query : `?${query}`;
  if (typeof query === "object") {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") {
        params.append(k, String(v));
      }
    }
    const s = params.toString();
    return s ? `?${s}` : "";
  }
  return "";
}

export const api = {
  health: () => request("/api/health"),
  catalog: () => request("/api/catalog", undefined, true),
  devices: (query = "") => request(`/api/devices${buildQuery(query)}`, undefined, true),
  device: (id) => request(`/api/devices/${id}`),
  saveMetadata: (id, meta) => request(`/api/devices/${id}/metadata`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(meta),
  }),
  postMetadata: (id, meta) => request(`/api/devices/${id}/metadata`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(meta),
  }),
  uploadCertificate: (id, payload) => request(`/api/certificates/${id}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  }),
  certificateUrl: (id) => `${BASE}/api/certificates/${id}`,
  events: (limit = 50) => request(`/api/events?limit=${limit}`, undefined, true),
  analytics: () => request("/api/analytics"),
  participants: () => request("/api/participants", undefined, true),
};
