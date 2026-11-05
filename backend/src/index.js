require("dotenv").config();
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { ethers } = require("ethers");
const { db } = require("./db");
const indexer = require("./indexer");
const { metadataHash, canonicalMetadata } = require("./canonical");

const app = express();
app.use(cors());
app.use(express.json({ limit: "3mb" })); // 3MB limit for base64 PDF upload

app.get("/api/health", async (req, res) => {
  let chainReachable = false;
  try { await indexer.provider.getBlockNumber(); chainReachable = true; } catch { /* offline */ }
  res.json({ backend: "ok", chainReachable, ...indexer.status });
});

app.get("/api/catalog", (req, res) => {
  const cats = db.prepare("SELECT * FROM catalog ORDER BY category").all();
  const items = db.prepare("SELECT category, name FROM catalog_items ORDER BY id").all();
  res.json(cats.map((c) => ({ ...c, items: items.filter((i) => i.category === c.category).map((i) => i.name) })));
});

app.get("/api/participants", (req, res) => {
  const rows = db.prepare("SELECT address, role, suspended, updated_block FROM participants ORDER BY updated_block DESC").all();
  res.json(rows);
});

app.get("/api/devices", (req, res) => {
  const where = [];
  const params = [];
  if (req.query.status !== undefined) { where.push("d.status = ?"); params.push(Number(req.query.status)); }
  if (req.query.category !== undefined) { where.push("d.category = ?"); params.push(Number(req.query.category)); }
  if (req.query.owner) { where.push("lower(d.owner) = lower(?)"); params.push(String(req.query.owner)); }
  if (req.query.producer) { where.push("lower(d.producer) = lower(?)"); params.push(String(req.query.producer)); }
  const sql = `SELECT d.*, m.json AS meta FROM devices d LEFT JOIN metadata m ON m.device_id = d.id
               ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY d.id DESC LIMIT 500`;
  const rows = db.prepare(sql).all(...params).map((r) => ({ ...r, meta: r.meta ? JSON.parse(r.meta) : null }));
  res.json(rows);
});

app.get("/api/devices/:id", (req, res) => {
  const id = Number(req.params.id);
  const d = db.prepare("SELECT * FROM devices WHERE id = ?").get(id);
  if (!d) return res.status(404).json({ error: "Device not indexed" });
  const m = db.prepare("SELECT json, hash FROM metadata WHERE device_id = ?").get(id);
  const cert = db.prepare("SELECT filename, hash, created_at FROM certificates WHERE device_id = ?").get(id);
  const events = db.prepare("SELECT * FROM events WHERE device_id = ? ORDER BY id").all(id)
    .map((e) => ({ ...e, data: JSON.parse(e.data) }));
  res.json({
    ...d,
    meta: m ? JSON.parse(m.json) : null,
    metaHash: m ? m.hash : null,
    certificate: cert || null,
    events,
  });
});

app.post("/api/devices/:id/metadata", async (req, res) => {
  try {
    await indexer.syncNow();
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "Invalid device id" });
    const m = req.body || {};
    for (const k of ["name", "brand", "model"]) {
      if (!m[k] || !String(m[k]).trim()) return res.status(400).json({ error: `Missing field: ${k}` });
    }
    const data = indexer.loadContractData();
    if (!data) return res.status(503).json({ error: "Contract not deployed yet" });
    const contract = new ethers.Contract(data.address, data.abi, indexer.provider);
    let dev;
    try { dev = await contract.getDevice(id); } catch { return res.status(404).json({ error: "Device not found on chain" }); }
    const hash = metadataHash(m);
    if (hash.toLowerCase() !== String(dev.metaHash).toLowerCase()) {
      return res.status(400).json({ error: "Metadata hash does not match the on-chain hash" });
    }
    db.prepare("INSERT OR REPLACE INTO metadata (device_id, json, hash, created_at) VALUES (?, ?, ?, ?)")
      .run(id, canonicalMetadata(m), hash, new Date().toISOString());
    res.json({ ok: true, hash });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Certificate endpoints: upload PDF bytes and retrieve
app.post("/api/certificates/:deviceId", async (req, res) => {
  try {
    await indexer.syncNow();
    const deviceId = Number(req.params.deviceId);
    if (!Number.isInteger(deviceId) || deviceId < 1) return res.status(400).json({ error: "Invalid device id" });

    const { filename, base64 } = req.body || {};
    if (!base64) return res.status(400).json({ error: "Missing base64 data" });

    const buf = Buffer.from(base64, "base64");
    const hash = "0x" + crypto.createHash("sha256").update(buf).digest("hex");

    const data = indexer.loadContractData();
    if (!data) return res.status(503).json({ error: "Contract not deployed" });

    const contract = new ethers.Contract(data.address, data.abi, indexer.provider);
    let dev;
    try { dev = await contract.getDevice(deviceId); } catch { return res.status(404).json({ error: "Device not found on chain" }); }

    if (hash.toLowerCase() !== String(dev.certificateHash).toLowerCase()) {
      return res.status(400).json({ error: "Certificate hash does not match on-chain hash" });
    }

    db.prepare("INSERT OR REPLACE INTO certificates (device_id, filename, mime, data, hash, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .run(deviceId, filename || `certificate-${deviceId}.pdf`, "application/pdf", buf, hash, new Date().toISOString());

    res.json({ ok: true, hash, deviceId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/certificates/:deviceId", (req, res) => {
  const deviceId = Number(req.params.deviceId);
  const cert = db.prepare("SELECT * FROM certificates WHERE device_id = ?").get(deviceId);
  if (!cert) return res.status(404).json({ error: "Certificate not found" });

  res.setHeader("Content-Type", cert.mime);
  res.setHeader("Content-Disposition", `inline; filename="${cert.filename}"`);
  res.send(cert.data);
});

app.get("/api/events", (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 500);
  const rows = db.prepare("SELECT * FROM events ORDER BY id DESC LIMIT ?").all(limit)
    .map((e) => ({ ...e, data: JSON.parse(e.data) }));
  res.json(rows);
});

app.get("/api/analytics", (req, res) => {
  const byStatus = db.prepare("SELECT status, COUNT(*) AS count FROM devices GROUP BY status ORDER BY status").all();
  const byCategory = db.prepare(`SELECT c.category, c.code, c.name, COUNT(d.id) AS count
    FROM catalog c LEFT JOIN devices d ON d.category = c.category
    GROUP BY c.category ORDER BY c.category`).all();

  const totalRegistered = db.prepare("SELECT COUNT(*) AS count FROM devices").get().count;
  const totalRecycled = db.prepare("SELECT COUNT(*) AS count FROM devices WHERE status = 5").get().count;
  const totalRecoveredGrams = db.prepare("SELECT COALESCE(SUM(recovered_grams), 0) AS grams FROM devices").get().grams;

  // Calculate redeemed points from PointsRedeemed events
  const redeemedRows = db.prepare("SELECT data FROM events WHERE name = 'PointsRedeemed'").all();
  let totalPointsRedeemed = 0;
  for (const r of redeemedRows) {
    try { totalPointsRedeemed += Number(JSON.parse(r.data).points || 0); } catch {}
  }
  const totalPointsIssued = Math.floor(totalRecoveredGrams / 100);

  const kpis = {
    devicesRegistered: totalRegistered,
    devicesRecycled: totalRecycled,
    recycledPercent: totalRegistered > 0 ? Math.round((totalRecycled / totalRegistered) * 100) : 0,
    materialRecoveredGrams: totalRecoveredGrams,
    materialRecoveredKg: (totalRecoveredGrams / 1000).toFixed(2),
    pointsIssued: totalPointsIssued,
    pointsRedeemed: totalPointsRedeemed,
  };

  const registeredPerDay = db.prepare(`SELECT date(ts, 'unixepoch') AS day, COUNT(*) AS count FROM events
    WHERE name = 'DeviceRegistered' GROUP BY day ORDER BY day`).all();

  const recycledPerDay = db.prepare(`SELECT date(ts, 'unixepoch') AS day, COUNT(*) AS count FROM events
    WHERE name = 'StatusChanged' AND json_extract(data, '$.status') = '5' GROUP BY day ORDER BY day`).all();

  const topRecyclers = db.prepare(`SELECT recycler, SUM(recovered_grams) AS recovered_grams, COUNT(*) AS count
    FROM devices WHERE status = 5 AND recycler IS NOT NULL GROUP BY recycler ORDER BY recovered_grams DESC LIMIT 5`).all();

  const recentActivity = db.prepare("SELECT id, name, device_id, actor, ts, tx_hash FROM events ORDER BY id DESC LIMIT 10").all();

  res.json({
    kpis,
    byStatus,
    byCategory,
    perDay: {
      registered: registeredPerDay,
      recycled: recycledPerDay,
    },
    topRecyclers,
    recentActivity,
  });
});

const PORT = Number(process.env.PORT) || 4000;
indexer.start();
app.listen(PORT, () => console.log(`EcoChain API v2 listening on http://localhost:${PORT}`));
