const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { ethers } = require("../node_modules/ethers");
const { jsPDF } = require("../../frontend/node_modules/jspdf");
const { metadataHash } = require("../../backend/src/canonical");

const API = process.env.API_URL || "http://localhost:4000";
const RPC = "http://127.0.0.1:8545";

function sha256Hex(buf) {
  return "0x" + crypto.createHash("sha256").update(buf).digest("hex");
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

async function main() {
  console.log("========================================================");
  console.log("        EcoChain V2 End-to-End (E2E) Test Suite         ");
  console.log("========================================================");

  // Setup provider & contract
  const dataPath = path.join(__dirname, "../contracts/contractData.json");
  const altDataPath = path.join(__dirname, "../../backend/src/contractData.json");
  const finalPath = fs.existsSync(dataPath) ? dataPath : altDataPath;
  const contractData = JSON.parse(fs.readFileSync(finalPath, "utf8"));

  const provider = new ethers.JsonRpcProvider(RPC);
  const contract = new ethers.Contract(contractData.address, contractData.abi, provider);

  const signers = [];
  for (let i = 0; i < 10; i++) {
    signers.push(await provider.getSigner(i));
  }
  const [admin, producer, consumer, collector, recycler, spare, consumerB, tester] = signers;

  // 1. Connectivity & Health Check
  console.log("\n1. System Connectivity & Health Check");
  const blockNum = await provider.getBlockNumber();
  assert(blockNum > 0, `Blockchain node reachable on chainId 31337 (Block #${blockNum})`);

  let backendOk = false;
  try {
    const res = await fetch(`${API}/api/health`);
    const health = await res.json();
    backendOk = health.chainReachable && health.backend === "ok";
  } catch {}
  assert(backendOk, `Backend Express API reachable and synced at ${API}`);

  // 2. Self-Registration
  console.log("\n2. On-Chain Role Self-Registration");
  const testerAddr = await tester.getAddress();
  const currentRole = Number(await contract.roles(testerAddr));
  if (currentRole === 0) {
    const tx = await contract.connect(tester).selfRegister(3); // Consumer
    await tx.wait();
  }
  const assignedRole = Number(await contract.roles(testerAddr));
  assert(assignedRole === 3, `Account ${testerAddr.slice(0, 8)}... self-registered as Consumer (Role 3)`);

  // 3. Rejected Unauthorized Action
  console.log("\n3. Negative Security Test: Unauthorized Role Action");
  let unauthReverted = false;
  try {
    // Consumer attempts to call producer-only registerDevice
    await contract.connect(tester).registerDevice(1, ethers.ZeroHash, "Unauthorized injection attempt");
  } catch (err) {
    unauthReverted = err.message.includes("caller lacks required role");
  }
  assert(unauthReverted, `Smart contract rejected unauthorized Producer action from Consumer account`);

  // 4. Device Registration by Producer
  console.log("\n4. Producer Device Registration");
  const meta = {
    name: "ThinkStation Workstation",
    brand: "Lenovo",
    model: "P360 Ultra",
    serial: `E2E-${Date.now()}`,
    notes: "Automated E2E pipeline test asset",
  };
  const mHash = metadataHash(meta);
  const txReg = await contract.connect(producer).registerDevice(
    1,
    mHash,
    "Manufactured and logged to EcoChain"
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
  assert(devId > 0, `Device registered by Producer on-chain (Device #${devId})`);

  // Post metadata to backend
  let metaSaved = false;
  try {
    const res = await fetch(`${API}/api/devices/${devId}/metadata`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(meta),
    });
    const body = await res.json();
    metaSaved = res.ok && body.ok;
  } catch {}
  assert(metaSaved, `Device #${devId} canonical metadata successfully stored in backend`);

  // 5. Device Claiming by Consumer
  console.log("\n5. Consumer Ownership Claim");
  const txClaim = await contract.connect(consumer).claimDevice(devId, "Purchased by consumer");
  await txClaim.wait();
  const devClaimed = await contract.getDevice(devId);
  assert(devClaimed.owner.toLowerCase() === (await consumer.getAddress()).toLowerCase(), `Device #${devId} claimed by Consumer`);

  // 6. Pickup Request
  console.log("\n6. Pickup Request");
  const txPickup = await contract.connect(consumer).requestPickup(devId, "Scheduled doorstep e-waste pickup");
  await txPickup.wait();
  const devPickup = await contract.getDevice(devId);
  assert(Number(devPickup.status) === 1, `Status transitioned to PickupRequested (Status 1)`);

  // 7. Collector Confirm Collection
  console.log("\n7. Collector Pickup Confirmation");
  const txCollect = await contract.connect(collector).confirmCollection(devId, "Collected by certified logistics partner");
  await txCollect.wait();
  const devCollect = await contract.getDevice(devId);
  assert(Number(devCollect.status) === 2, `Status transitioned to Collected (Status 2) by Custodian ${devCollect.custodian.slice(0, 8)}...`);

  // 8. Collector Dispatch to Recycler
  console.log("\n8. Collector Consignment Dispatch");
  const recyclerAddr = await recycler.getAddress();
  const txDispatch = await contract.connect(collector).dispatchToRecycler(devId, recyclerAddr, "Secure transit consignment #88");
  await txDispatch.wait();
  const devDispatch = await contract.getDevice(devId);
  assert(Number(devDispatch.status) === 3 && devDispatch.pendingRecipient.toLowerCase() === recyclerAddr.toLowerCase(), `Status transitioned to InTransit (Status 3) designated to Recycler`);

  // 9. Recycler Receipt & Intake Weighing
  console.log("\n9. Recycler Intake & Gross Weighing");
  const grossWeight = 4000; // grams
  const txReceipt = await contract.connect(recycler).confirmReceipt(devId, grossWeight, "Received and weighed on calibrated scale");
  await txReceipt.wait();
  const devReceipt = await contract.getDevice(devId);
  assert(Number(devReceipt.status) === 4 && Number(devReceipt.receivedGrams) === grossWeight, `Status transitioned to AtRecycler (Status 4) with received weight ${grossWeight}g`);

  // 10. Negative Test: Mass Balance Invariant
  console.log("\n10. Negative Invariant Test: Mass-Balance Mismatch Rejection");
  let mismatchReverted = false;
  const dummyHash = sha256Hex(Buffer.from("dummy" + Date.now()));
  try {
    // 3000 recovered + 500 residual = 3500 != 4000 received
    await contract.connect(recycler).completeRecycling(devId, 3000, 500, dummyHash, "Bad mass balance");
  } catch (err) {
    mismatchReverted = err.message.includes("mass balance mismatch");
  }
  assert(mismatchReverted, `Smart contract strictly enforced mass balance: (3000g + 500g != 4000g) rejected`);

  // 11. Certificate Generation, Mass Balance, and Complete Recycling
  console.log("\n11. Certificate Generation & Complete Recycling");
  const recoveredGrams = 3400;
  const residualGrams = 600; // 3400 + 600 == 4000

  const doc = new jsPDF();
  doc.text(`Official Certificate for Device #${devId}`, 20, 20);
  doc.text(`Received: ${grossWeight}g = Recovered: ${recoveredGrams}g + Residual: ${residualGrams}g`, 20, 30);
  const certBytes = Buffer.from(doc.output("arraybuffer"));
  const certHash = sha256Hex(certBytes);

  const txComplete = await contract.connect(recycler).completeRecycling(
    devId,
    recoveredGrams,
    residualGrams,
    certHash,
    "Fully recycled and certified"
  );
  await txComplete.wait();
  const devRecycled = await contract.getDevice(devId);
  assert(Number(devRecycled.status) === 5 && devRecycled.certificateHash === certHash, `Status transitioned to Recycled (Status 5) with certificate hash permanently anchored`);

  // 12. Negative Security Test: Duplicate Certificate Hash Rejection
  console.log("\n12. Negative Security Test: Duplicate Certificate Hash Reuse Rejection");
  // Register another dummy device to stage 4
  const txRegDummy = await contract.connect(producer).registerDevice(1, sha256Hex(Buffer.from("dup" + Date.now())), "Dummy");
  const rcDummy = await txRegDummy.wait();
  let dummyId = null;
  for (const log of rcDummy.logs) {
    try {
      const p = contract.interface.parseLog(log);
      if (p && p.name === "DeviceRegistered") dummyId = Number(p.args.deviceId);
    } catch {}
  }
  await (await contract.connect(consumer).claimDevice(dummyId, "Claimed")).wait();
  await (await contract.connect(consumer).requestPickup(dummyId, "Pickup")).wait();
  await (await contract.connect(collector).confirmCollection(dummyId, "Collected")).wait();
  await (await contract.connect(collector).dispatchToRecycler(dummyId, recyclerAddr, "Dispatch")).wait();
  await (await contract.connect(recycler).confirmReceipt(dummyId, 1000, "1000g")).wait();

  let dupReverted = false;
  try {
    // Attempt to reuse same certHash
    await contract.connect(recycler).completeRecycling(dummyId, 800, 200, certHash, "Duplicate reuse attempt");
  } catch (err) {
    dupReverted = err.message.includes("certificate already used");
  }
  assert(dupReverted, `Smart contract prevented certificate duplicate reuse (certificate already used)`);

  // 13. Green Points Award & Redemption
  console.log("\n13. Green Points Lifecycle: Award and Redemption");
  const consumerAddr = await consumer.getAddress();
  const ptsBalance = Number(await contract.greenPoints(consumerAddr));
  assert(ptsBalance >= 34, `Consumer awarded Green Points: ${ptsBalance} pts (calculated as recoveredGrams / 100)`);

  const producerAddr = await producer.getAddress();
  const txRedeem = await contract.connect(consumer).redeemPoints(15, producerAddr, "Discount code REDEEM-15");
  await txRedeem.wait();
  const ptsAfter = Number(await contract.greenPoints(consumerAddr));
  const redeemedProd = Number(await contract.pointsRedeemedWith(producerAddr));
  assert(ptsAfter === ptsBalance - 15 && redeemedProd >= 15, `Consumer redeemed 15 Green Points with Producer; balance updated`);

  // 14. Backend Certificate Upload & Byte Download Verification
  console.log("\n14. Backend Certificate Upload & Byte-Level Verification");
  let certUploaded = false;
  try {
    const res = await fetch(`${API}/api/certificates/${devId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: `certificate-device-${devId}.pdf`,
        base64: certBytes.toString("base64"),
      }),
    });
    const body = await res.json();
    certUploaded = res.ok && body.ok;
  } catch {}
  assert(certUploaded, `Certificate raw PDF bytes uploaded to backend API and verified against on-chain hash`);

  let certDownloadMatch = false;
  try {
    const res = await fetch(`${API}/api/certificates/${devId}`);
    const downloadedBuf = Buffer.from(await res.arrayBuffer());
    certDownloadMatch = sha256Hex(downloadedBuf) === certHash;
  } catch {}
  assert(certDownloadMatch, `Downloaded binary PDF bytes match on-chain anchored hash byte-for-byte`);

  // 15. Public Verification: Authentic vs Tampered
  console.log("\n15. Public Verification: Authentic vs Tampered Demonstration");
  const lookupDevId = Number(await contract.certificateDevice(certHash));
  assert(lookupDevId === devId, `Public reverse lookup certificateDevice(certHash) resolved to Device #${devId} (Authentic ✅)`);

  const tamperedBuf = Buffer.from(certBytes);
  tamperedBuf[25] = tamperedBuf[25] ^ 0xff; // Invert single byte
  const tamperedHash = sha256Hex(tamperedBuf);
  const lookupTampered = Number(await contract.certificateDevice(tamperedHash));
  assert(lookupTampered === 0, `1-byte modified PDF hash returned 0 on blockchain (Tampered / Invalid ❌)`);

  // 16. Regulator Suspension & Reinstatement
  console.log("\n16. Regulator Account Suspension & Reinstatement Controls");
  const suspTx = await contract.connect(admin).setSuspended(testerAddr, true);
  await suspTx.wait();
  const isSusp = await contract.suspended(testerAddr);

  let suspBlocked = false;
  try {
    await contract.connect(tester).redeemPoints(1, producerAddr, "Attempt while suspended");
  } catch (err) {
    suspBlocked = err.message.includes("account suspended");
  }
  assert(isSusp && suspBlocked, `Regulator suspended account; smart contract blocked all transactions while suspended`);

  const reinstTx = await contract.connect(admin).setSuspended(testerAddr, false);
  await reinstTx.wait();
  const isSuspAfter = await contract.suspended(testerAddr);
  assert(!isSuspAfter, `Regulator reinstated account; normal operations restored`);

  // Summary
  console.log("\n========================================================");
  console.log(`E2E TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("========================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log(">>> ALL END-TO-END SPECIFICATION TESTS PASSED SUCCESSFULLY! <<<");
  }
}

main().catch((err) => {
  console.error("FATAL ERROR in E2E Suite:", err);
  process.exit(1);
});
