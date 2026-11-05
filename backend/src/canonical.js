const crypto = require("crypto");

// Fixed key order and trimmed values: frontend and backend MUST produce the same string.
function canonicalMetadata(m) {
  return JSON.stringify({
    name: String(m.name || "").trim(),
    brand: String(m.brand || "").trim(),
    model: String(m.model || "").trim(),
    serial: String(m.serial || "").trim(),
    notes: String(m.notes || "").trim(),
  });
}

function metadataHash(m) {
  return "0x" + crypto.createHash("sha256").update(canonicalMetadata(m), "utf8").digest("hex");
}

module.exports = { canonicalMetadata, metadataHash };
