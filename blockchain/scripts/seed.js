const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { metadataHash } = require("../../backend/src/canonical");
const { jsPDF } = require("../../frontend/node_modules/jspdf");

const API = process.env.API_URL || "http://localhost:4000";

// [name, brand, model, category (1..7), weight in grams]
const SAMPLES = [
  ["Enterprise Laptop", "Dell", "Latitude 5420", 1, 2200],
  ["5G Smartphone", "Samsung", "Galaxy A52", 1, 190],
  ["Ultrabook", "Apple", "MacBook Air M1", 1, 1290],
  ["Smart Television", "LG", "43UM7290 4K", 2, 8500],
  ["DSLR Camera", "Canon", "EOS 1500D", 2, 650],
  ["Frost-Free Refrigerator", "Whirlpool", "FP 263D", 3, 62000],
  ["Front-Load Washing Machine", "IFB", "Senator Aqua", 3, 38000],
  ["Microwave Oven", "Samsung", "MS23K3513", 3, 11500],
  ["Impact Drill", "Bosch", "GSB 500 RE", 4, 1800],
  ["Robotic RC Drone", "Funskool", "AeroTech 4X", 5, 450],
  ["Digital BP Monitor", "Omron", "HEM-7120", 6, 400],
  ["Emission Flue Gas Analyser", "Testo", "310", 7, 1200],
];

// Distribution across the 6 states (0 Registered ... 5 Recycled)
const STAGES = [5, 5, 4, 3, 2, 1, 0, 5, 5, 2, 5, 3, 5, 0, 1];
const TOTAL_DEVICES = 30;

function sha256Hex(buf) {
  return "0x" + crypto.createHash("sha256").update(buf).digest("hex");
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
    // backend offline fallback
  }
}

async function postCertificate(id, filename, pdfBuffer) {
  try {
    const base64 = pdfBuffer.toString("base64");
    const res = await fetch(`${API}/api/certificates/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename, base64 }),
    });
    if (!res.ok) console.warn(`  cert for device ${id} rejected:`, await res.text());
  } catch {
    // backend offline fallback
  }
}

function generateCertificatePdf(devId, sample, received, recovered, residual, recyclerAddr) {
  const doc = new jsPDF();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(22, 163, 74);
  doc.text("Official Recycling & Destruction Certificate", 20, 24);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text("EcoChain Decentralized Extended Producer Responsibility (EPR) Protocol", 20, 32);

  doc.setDrawColor(226, 232, 240);
  doc.line(20, 36, 190, 36);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);

  let y = 46;
  doc.text(`Certificate Number: ECO-CERT-${devId}-${Date.now()}`, 20, y); y += 8;
  doc.text(`Device ID: #${devId}`, 20, y); y += 8;
  doc.text(`Product Name: ${sample[0]} (${sample[1]} ${sample[2]})`, 20, y); y += 8;
  doc.text(`Category: Code ${sample[3]}`, 20, y); y += 8;
  doc.text(`Certified Recycler: ${recyclerAddr}`, 20, y); y += 8;
  doc.text(`Issue Timestamp: ${new Date().toISOString()}`, 20, y); y += 12;

  doc.setFont("helvetica", "bold");
  doc.text("Material Mass-Balance Breakdown:", 20, y); y += 8;
  doc.setFont("helvetica", "normal");
  doc.text(`• Received Gross Weight: ${received} grams`, 25, y); y += 6;
  doc.text(`• Refined Recovered Commodity: ${recovered} grams`, 25, y); y += 6;
  doc.text(`• Safe Residual Waste: ${residual} grams`, 25, y); y += 6;
  doc.text(`• Mathematical Invariant: ${recovered}g + ${residual}g == ${received}g (VERIFIED)`, 25, y); y += 12;

  doc.setFont("helvetica", "italic");
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  doc.text("Verify this file at the EcoChain Verify page (http://localhost:5173/verify)", 20, y);

  const arrayBuf = doc.output("arraybuffer");
  return Buffer.from(arrayBuf);
}

async function main() {
  const dataPath = path.join(__dirname, "../../backend/src/contractData.json");
  const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));

  const signers = await hre.ethers.getSigners();
  const admin = signers[0];
  const producer = signers[1];
  const consumerA = signers[2];
  const collector = signers[3];
  const recycler = signers[4];
  const spare = signers[5]; // Leave #5 unregistered
  const consumerB = signers[6];

  const consumers = [consumerA, consumerB];
  const contract = await hre.ethers.getContractAt("EWasteTracker", data.address);

  console.log("=== EcoChain V2 Seeding Script (Simulated Data) ===");

  // 1. Ensure Roles on-chain via selfRegister
  console.log("1. Setting up on-chain participant roles...");
  const roleProducer = Number(await contract.roles(producer.address));
  if (roleProducer === 0) {
    await (await contract.connect(producer).selfRegister(2)).wait();
    console.log(`  Producer (#1): ${producer.address} registered.`);
  }

  const roleConsumerA = Number(await contract.roles(consumerA.address));
  if (roleConsumerA === 0) {
    await (await contract.connect(consumerA).selfRegister(3)).wait();
    console.log(`  Consumer A (#2): ${consumerA.address} registered.`);
  }

  const roleConsumerB = Number(await contract.roles(consumerB.address));
  if (roleConsumerB === 0) {
    await (await contract.connect(consumerB).selfRegister(3)).wait();
    console.log(`  Consumer B (#6): ${consumerB.address} registered.`);
  }

  const roleCollector = Number(await contract.roles(collector.address));
  if (roleCollector === 0) {
    await (await contract.connect(collector).selfRegister(4)).wait();
    console.log(`  Collector (#3): ${collector.address} registered.`);
  }

  const roleRecycler = Number(await contract.roles(recycler.address));
  if (roleRecycler === 0) {
    await (await contract.connect(recycler).selfRegister(5)).wait();
    console.log(`  Recycler (#4): ${recycler.address} registered.`);
  }

  console.log(`  Spare (#5): ${spare.address} left unregistered for live sign-up demonstration.`);

  // 2. Register devices and progress through lifecycle
  console.log(`\n2. Seeding ${TOTAL_DEVICES} simulated devices across all 6 stages...`);
  const usedCertHashes = new Set();

  for (let i = 0; i < TOTAL_DEVICES; i++) {
    const sample = SAMPLES[i % SAMPLES.length];
    const [name, brand, model, category, grams] = sample;
    const assignedConsumer = consumers[i % consumers.length];
    const meta = {
      name,
      brand,
      model,
      serial: `SIM-${2000 + i}`,
      notes: "Simulated e-waste asset",
    };
    const targetStage = STAGES[i % STAGES.length];

    // Producer registers device (3 args: category, metaHash, note)
    const mHash = metadataHash(meta);
    const txReg = await contract.connect(producer).registerDevice(
      category,
      mHash,
      `Manufactured & logged to EcoChain: ${brand} ${model}`
    );
    const rcReg = await txReg.wait();

    let devId = null;
    for (const log of rcReg.logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed && parsed.name === "DeviceRegistered") {
          devId = Number(parsed.args.deviceId);
        }
      } catch {}
    }

    if (!devId) continue;

    // Save metadata to backend
    await postMetadata(devId, meta);

    // If targetStage >= 1 (or claimed): Consumer claims device
    if (targetStage >= 1) {
      await (await contract.connect(assignedConsumer).claimDevice(devId, "Warranty ownership claimed")).wait();
      await (await contract.connect(assignedConsumer).requestPickup(devId, "Scheduled home pickup")).wait();
    }

    // Stage 2: Collector confirms collection
    if (targetStage >= 2) {
      await (await contract.connect(collector).confirmCollection(devId, "Collected by EcoLogistics driver")).wait();
    }

    // Stage 3: Collector dispatches to Recycler
    if (targetStage >= 3) {
      await (await contract.connect(collector).dispatchToRecycler(devId, recycler.address, "Consignment van trip")).wait();
    }

    // Stage 4: Recycler confirms receipt & weighs
    if (targetStage >= 4) {
      await (await contract.connect(recycler).confirmReceipt(devId, grams, "Received and weighed at recycling facility")).wait();
    }

    // Stage 5: Recycler completes recycling with mass balance & unique certificate
    if (targetStage >= 5) {
      const recovered = Math.round(grams * 0.85);
      const residual = grams - recovered;

      // Generate real PDF certificate
      const pdfBytes = generateCertificatePdf(devId, sample, grams, recovered, residual, recycler.address);
      const certHash = sha256Hex(pdfBytes);

      await (
        await contract.connect(recycler).completeRecycling(
          devId,
          recovered,
          residual,
          certHash,
          "Disassembled, sorted, and certified recycled"
        )
      ).wait();

      // Post PDF bytes to backend API
      await postCertificate(devId, `certificate-device-${devId}.pdf`, pdfBytes);
    }

    process.stdout.write(`  [${i + 1}/${TOTAL_DEVICES}] Device #${devId} (${name}) -> Stage ${targetStage}\n`);
  }

  // 3. Consumer redeems some Green Points with Producer
  try {
    const pts = Number(await contract.greenPoints(consumerA.address));
    if (pts >= 20) {
      await (await contract.connect(consumerA).redeemPoints(20, producer.address, "Redeemed for 10% voucher")).wait();
      console.log(`\n3. Consumer A redeemed 20 Green Points with Producer.`);
    }
  } catch (err) {
    console.warn("  Could not redeem points:", err.message);
  }

  console.log("\nSeeding complete! 30 simulated devices across 6 lifecycle stages are ready.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
