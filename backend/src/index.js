require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { ethers } = require("ethers");
const { db } = require("./db");
const indexer = require("./indexer");
const { metadataHash, canonicalMetadata } = require("./canonical");

const app = express();
app.use(cors());
app.use(express.json({ limit: "100kb" }));

app.get("/api/health", async (req, res) => {
  let chainReachable = false;
  try { await indexer.provider.getBlockNumber(); chainReachable = true; } catch { /* node offline */ }
  res.json({ backend: "ok", chainReachable, ...indexer.status });
});

app.get("/api/catalog", (req, res) => {
  const cats = db.prepare("SELECT * FROM catalog ORDER BY category").all();
  const items = db.prepare("SELECT category, name FROM catalog_items ORDER BY id").all();
  res.json(cats.map((c) => ({ ...c, items: items.filter((i) => i.category === c.category).map((i) => i.name) })));
});

app.get("/api/devices", (req, res) => {
  const where = [];
  const params = [];
  if (req.query.status !== undefined) { where.push("d.status = ?"); params.push(Number(req.query.status)); }
  if (req.query.category !== undefined) { where.push("d.category = ?"); params.push(Number(req.query.category)); }
  if (req.query.owner) { where.push("lower(d.owner) = lower(?)"); params.push(String(req.query.owner)); }
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
  const events = db.prepare("SELECT * FROM events WHERE device_id = ? ORDER BY id").all(id)
    .map((e) => ({ ...e, data: JSON.parse(e.data) }));
  res.json({ ...d, meta: m ? JSON.parse(m.json) : null, metaHash: m ? m.hash : null, events });
});

app.post("/api/devices/:id/metadata", async (req, res) => {
  try {
    await indexer.syncNow(); // makes sure a chain reset is handled before saving
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

app.get("/api/events", (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 500);
  const rows = db.prepare("SELECT * FROM events ORDER BY id DESC LIMIT ?").all(limit)
    .map((e) => ({ ...e, data: JSON.parse(e.data) }));
  res.json(rows);
});

app.get("/api/analytics", (req, res) => {
  const byStatus = db.prepare("SELECT status, COUNT(*) AS count FROM devices GROUP BY status ORDER BY status").all();
  const byCategory = db.prepare("SELECT category, COUNT(*) AS count FROM devices GROUP BY category ORDER BY category").all();
  const recovered = db.prepare("SELECT COALESCE(SUM(recovered_grams), 0) AS grams FROM devices").get().grams;
  const perDay = db.prepare(`SELECT date(ts, 'unixepoch') AS day, COUNT(*) AS count FROM events
                             WHERE name = 'DeviceRegistered' GROUP BY day ORDER BY day`).all();
  res.json({ byStatus, byCategory, recoveredGrams: recovered, registeredPerDay: perDay });
});

const PORT = Number(process.env.PORT) || 4000;
indexer.start();
app.listen(PORT, () => console.log(`EcoChain API listening on http://localhost:${PORT}`));
