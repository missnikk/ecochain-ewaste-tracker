const Database = require("better-sqlite3");
const path = require("path");
const { seedCatalog } = require("./catalog.seed");

const db = new Database(process.env.DB_PATH || path.join(__dirname, "..", "ecochain.db"));
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS catalog (
  category INTEGER PRIMARY KEY, code TEXT NOT NULL, name TEXT NOT NULL, official_item_count INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS catalog_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT, category INTEGER NOT NULL, name TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS metadata (
  device_id INTEGER PRIMARY KEY, json TEXT NOT NULL, hash TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT, block INTEGER NOT NULL, tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL, name TEXT NOT NULL, device_id INTEGER, actor TEXT,
  data TEXT NOT NULL, ts INTEGER NOT NULL, UNIQUE (tx_hash, log_index));
CREATE TABLE IF NOT EXISTS devices (
  id INTEGER PRIMARY KEY, category INTEGER NOT NULL, owner TEXT NOT NULL,
  status INTEGER NOT NULL DEFAULT 0, recovered_grams INTEGER NOT NULL DEFAULT 0,
  created_block INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS sync_state (key TEXT PRIMARY KEY, value TEXT NOT NULL);
`);

seedCatalog(db);

function getState(key) {
  const row = db.prepare("SELECT value FROM sync_state WHERE key = ?").get(key);
  return row ? row.value : null;
}
function setState(key, value) {
  db.prepare("INSERT INTO sync_state (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
    .run(key, String(value));
}
// Wipes everything derived from the chain. Metadata is wiped too because device IDs restart at 1 on a new chain.
function resetChainData() {
  db.transaction(() => {
    db.exec("DELETE FROM events; DELETE FROM devices; DELETE FROM metadata; DELETE FROM sync_state;");
  })();
}

module.exports = { db, getState, setState, resetChainData };
