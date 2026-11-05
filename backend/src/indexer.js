const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const { db, getState, setState, resetChainData } = require("./db");

const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const provider = new ethers.JsonRpcProvider(RPC_URL);
const DATA_PATH = path.join(__dirname, "contractData.json");

const status = { phase: "starting", lastBlock: null, address: null, error: null };

function loadContractData() {
  try { return JSON.parse(fs.readFileSync(DATA_PATH, "utf8")); } catch { return null; }
}

const insertEvent = db.prepare(`INSERT OR IGNORE INTO events
  (block, tx_hash, log_index, name, device_id, actor, data, ts) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

function applyEvent(parsed, log, ts) {
  const a = parsed.args;
  const data = {};
  parsed.fragment.inputs.forEach((inp, i) => { data[inp.name] = a[i].toString(); });
  const deviceId = data.deviceId !== undefined ? Number(data.deviceId) : null;
  const actor = data.actor || data.producer || data.recycler || data.by || data.account || null;
  insertEvent.run(log.blockNumber, log.transactionHash, log.index, parsed.name, deviceId, actor, JSON.stringify(data), ts);

  if (parsed.name === "DeviceRegistered") {
    db.prepare("INSERT OR REPLACE INTO devices (id, category, owner, status, recovered_grams, created_block) VALUES (?, ?, ?, 0, 0, ?)")
      .run(deviceId, Number(data.category), data.owner, log.blockNumber);
  } else if (parsed.name === "StatusChanged") {
    db.prepare("UPDATE devices SET status = ? WHERE id = ?").run(Number(data.status), deviceId);
  } else if (parsed.name === "CertificateAnchored") {
    db.prepare("UPDATE devices SET recovered_grams = ? WHERE id = ?").run(Number(data.recoveredGrams), deviceId);
  }
}

async function syncOnce() {
  const data = loadContractData();
  if (!data) { status.phase = "waiting-for-deploy-file"; return; }
  const code = await provider.getCode(data.address);
  if (code === "0x") { status.phase = "contract-not-found-on-chain"; return; }

  const current = await provider.getBlockNumber();
  const lastBlockRaw = getState("lastBlock");
  const lastHash = getState("lastBlockHash");
  const savedAddress = getState("contractAddress");

  let reset = false;
  if (savedAddress && savedAddress !== data.address) reset = true;
  if (lastBlockRaw !== null && Number(lastBlockRaw) > current) reset = true;
  if (lastBlockRaw !== null && !reset) {
    const blk = await provider.getBlock(Number(lastBlockRaw));
    if (!blk || blk.hash !== lastHash) reset = true;   // chain was restarted
  }
  if (reset) resetChainData();

  const lastBlock = getState("lastBlock");
  const start = lastBlock !== null ? Number(lastBlock) + 1 : data.deployBlock;
  if (start <= current) {
    const iface = new ethers.Interface(data.abi);
    const logs = await provider.getLogs({ address: data.address, fromBlock: start, toBlock: current });
    const times = new Map();
    const pending = [];
    for (const log of logs) {
      let parsed = null;
      try { parsed = iface.parseLog(log); } catch { parsed = null; }
      if (!parsed) continue;
      if (!times.has(log.blockNumber)) {
        const b = await provider.getBlock(log.blockNumber);
        times.set(log.blockNumber, b.timestamp);
      }
      pending.push([parsed, log, times.get(log.blockNumber)]);
    }
    db.transaction(() => { for (const p of pending) applyEvent(...p); })();
  }
  const tip = await provider.getBlock(current);
  setState("lastBlock", current);
  setState("lastBlockHash", tip.hash);
  setState("contractAddress", data.address);
  status.phase = "synced";
  status.lastBlock = current;
  status.address = data.address;
  status.error = null;
}

// Serialize syncs so a manual sync and the timer never overlap.
let chain = Promise.resolve();
function syncNow() {
  chain = chain.then(syncOnce).catch((e) => { status.error = e.message; status.phase = "error"; });
  return chain;
}

function start(intervalMs = 3000) {
  syncNow();
  setInterval(syncNow, intervalMs);
}

module.exports = { start, syncNow, status, provider, loadContractData };
