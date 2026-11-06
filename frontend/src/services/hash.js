// Must match backend/src/canonical.js exactly (same keys, same order, trimmed).
export function canonicalMetadata(m) {
  return JSON.stringify({
    name: String(m.name || "").trim(),
    brand: String(m.brand || "").trim(),
    model: String(m.model || "").trim(),
    serial: String(m.serial || "").trim(),
    notes: String(m.notes || "").trim(),
  });
}

export async function sha256Bytes(buffer) {
  // crypto.subtle works on http://localhost (secure context). It will not work on a plain LAN IP.
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return "0x" + Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function metadataHash(m) {
  return sha256Bytes(new TextEncoder().encode(canonicalMetadata(m)));
}

export async function fileHash(file) {
  return sha256Bytes(await file.arrayBuffer());
}
