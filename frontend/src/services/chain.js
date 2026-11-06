import { ethers } from "ethers";
import contractData from "../contracts/contractData.json";

export const RPC_URL = "http://127.0.0.1:8545";
export const contractAddress = contractData.address;
export const provider = new ethers.JsonRpcProvider(RPC_URL);

export const ROLE = ["None", "Admin", "Producer", "Consumer", "Collector", "Recycler"];
export const STATUS = ["Registered", "Pickup requested", "Collected", "In transit", "At recycler", "Recycled"];
export const PERSONAS = [
  { index: 0, name: "Regulator", role: "Admin" },
  { index: 1, name: "Producer", role: "Producer" },
  { index: 2, name: "Consumer A", role: "Consumer" },
  { index: 3, name: "Collector", role: "Collector" },
  { index: 4, name: "Recycler", role: "Recycler" },
  { index: 5, name: "Unauthorized", role: "None" },
  { index: 6, name: "Consumer B", role: "Consumer" },
];
export const CATEGORIES = [
  "IT & telecom (ITEW)",
  "Consumer electronics & PV (CEEW)",
  "Large & small equipment (LSEEW)",
  "Electrical tools (EETW)",
  "Toys, leisure & sports (TLSEW)",
  "Medical devices (MDW)",
  "Lab instruments (LIW)",
];

export function readContract() {
  return new ethers.Contract(contractData.address, contractData.abi, provider);
}

export async function writeContract(signerOrIndex) {
  let s = signerOrIndex;
  if (typeof signerOrIndex === "number") {
    s = await provider.getSigner(signerOrIndex);
  }
  if (!s) throw new Error("No signer available. Please connect a wallet.");
  return new ethers.Contract(contractData.address, contractData.abi, s);
}

export function friendlyError(e) {
  if (e && (e.code === 4001 || e.code === "ACTION_REJECTED" || (e.message && e.message.includes("user rejected")))) {
    return "You rejected the request in MetaMask.";
  }
  const text = [
    e && e.reason,
    e && e.shortMessage,
    e && e.message,
    JSON.stringify((e && (e.info || e.error)) || {}),
  ].filter(Boolean).join(" ");

  const own = text.match(/EWT: [^'"\\\n{}]+/);
  if (own) return own[0].trim();
  const generic = text.match(/reverted with reason string '([^']+)'/);
  return generic ? generic[1] : (e && (e.shortMessage || e.message)) || "Transaction failed";
}

// Sends a state-changing call using the provided signer (or demo index)
export async function sendTx(signerOrIndex, method, args = []) {
  try {
    const c = await writeContract(signerOrIndex);
    const tx = await c[method](...args);
    const receipt = await tx.wait();
    return {
      ok: true,
      hash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      receipt,
      contract: c,
    };
  } catch (e) {
    return { ok: false, error: friendlyError(e) };
  }
}

export function deviceIdFromReceipt(contract, receipt) {
  for (const log of receipt.logs) {
    try {
      const p = contract.interface.parseLog(log);
      if (p && p.name === "DeviceRegistered") return Number(p.args.deviceId);
    } catch { /* not our event */ }
  }
  return null;
}

// Reads every device directly from the chain (works even if the backend is down).
export async function fetchAllDevices() {
  const c = readContract();
  const count = Number(await c.deviceCount());
  const ids = Array.from({ length: count }, (_, i) => i + 1);
  const devices = await Promise.all(ids.map((id) => c.getDevice(id)));
  return devices.map((d) => ({
    id: Number(d.id),
    category: Number(d.category),
    metaHash: d.metaHash,
    producer: d.producer,
    owner: d.owner === ethers.ZeroAddress ? null : d.owner,
    custodian: d.custodian,
    pendingRecipient: d.pendingRecipient === ethers.ZeroAddress ? null : d.pendingRecipient,
    status: Number(d.status),
    receivedGrams: Number(d.receivedGrams),
    recoveredGrams: Number(d.recoveredGrams),
    residualGrams: Number(d.residualGrams),
    certificateHash: d.certificateHash,
    createdAt: Number(d.createdAt),
    updatedAt: Number(d.updatedAt),
  }));
}

export async function fetchHistory(id) {
  const h = await readContract().getHistory(id);
  return h.map((e) => ({
    status: Number(e.status),
    actor: e.actor,
    timestamp: Number(e.timestamp),
    note: e.note,
  }));
}

export const shortAddr = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "");

let _addresses = null;
export async function personaAddresses() {
  if (_addresses) return _addresses;
  const accounts = await provider.listAccounts();
  _addresses = accounts.map((a) => a.address);
  return _addresses;
}
export async function personaAddress(index) {
  return (await personaAddresses())[index];
}
