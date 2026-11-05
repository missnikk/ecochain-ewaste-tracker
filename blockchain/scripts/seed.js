const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { metadataHash } = require("../../backend/src/canonical");

const API = process.env.API_URL || "http://localhost:4000";

// [name, brand, model, category (1..7), weight in grams]
const SAMPLES = [
  ["Laptop", "Dell", "Latitude 5420", 1, 2000],
  ["Mobile phone", "Samsung", "Galaxy A52", 1, 200],
  ["Tablet", "Apple", "iPad 8th Gen", 1, 490],
  ["Television", "LG", "43UM7290", 2, 8500],
  ["Digital camera", "Canon", "EOS 1500D", 2, 650],
  ["Refrigerator", "Whirlpool", "FP 263D", 3, 62000],
  ["Washing machine", "IFB", "Senator Aqua", 3, 38000],
  ["Microwave oven", "Samsung", "MS23K3513", 3, 11500],
  ["Electric drill", "Bosch", "GSB 500", 4, 1800],
  ["Electronic toy", "Funskool", "RC Car", 5, 450],
  ["Blood pressure monitor", "Omron", "HEM-7120", 6, 400],
  ["Gas analyser", "Testo", "310", 7, 1200],
];

// final stage per device: 0 Registered ... 5 Recycled
const STAGES = [5, 5, 4, 3, 2, 1, 0, 5, 5, 1];
const TOTAL_DEVICES = 30;

function sha256Hex(text) {
  return "0x" + crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

async function postMetadata(id, meta) {
  try {
    const res = await fetch(`${API}/api/devices/${id}/metadata`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(meta),
    });
    if (!res.ok) console.warn(`  metadata for device ${id} rejected:`, await res.text());
  } catch {
    console.warn(`  backend not reachable at ${API}; metadata for device ${id} not saved`);
  }
}

async function main() {
  const dataPath = path.join(__dirname, "../../backend/src/contractData.json");
  const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  const [, producer, consumer, collector, recycler, , consumer2] = await hre.ethers.getSigners();
  const consumers = [consumer, consumer2];
  const contract = await hre.ethers.getContractAt("EWasteTracker", data.address);

  for (let i = 0; i < TOTAL_DEVICES; i++) {
    const [name, brand, model, category, grams] = SAMPLES[i % SAMPLES.length];
    const owner = consumers[i % 2];
    const meta = { name, brand, model, serial: `SIM-${1000 + i}`, notes: "Simulated demo data" };
    const stage = STAGES[i % STAGES.length];

    const tx = await contract.connect(producer).registerDevice(category, metadataHash(meta), owner.address, "Registered by producer");
    const rc = await tx.wait();
    let id = null;
    for (const log of rc.logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed && parsed.name === "DeviceRegistered") id = Number(parsed.args.deviceId);
      } catch { /* not our event */ }
    }
    await postMetadata(id, meta);

    if (stage >= 1) await (await contract.connect(owner).requestPickup(id, "Pickup requested")).wait();
    if (stage >= 2) await (await contract.connect(collector).confirmCollection(id, "Collected from owner")).wait();
    if (stage >= 3) await (await contract.connect(collector).dispatchToRecycler(id, recycler.address, "Dispatched to recycler")).wait();
    if (stage >= 4) await (await contract.connect(recycler).confirmReceipt(id, grams, "Received and weighed")).wait();
    if (stage >= 5) {
      const recovered = Math.round(grams * 0.8);
      const residual = grams - recovered;
      const certHash = sha256Hex(`simulated-certificate-device-${id}`);
      await (await contract.connect(recycler).completeRecycling(id, recovered, residual, certHash, "Recycling completed")).wait();
    }
    console.log(`device ${id} (${name}) -> stage ${stage}`);
  }
  console.log("Seed complete (simulated demo data).");
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
