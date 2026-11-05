import { useEffect, useState } from "react";
import { usePersona } from "../persona";
import { useDevices } from "../hooks";
import { sendTx, personaAddress, CATEGORIES } from "../services/chain";
import { fileHash } from "../services/hash";
import { StatusBadge, TxBanner, ActingAs, ErrorNote } from "../ui";

function ReceiptRow({ device, persona, onDone }) {
  const [grams, setGrams] = useState("");
  async function confirm() {
    const r = await sendTx(persona.index, "confirmReceipt", [device.id, Number(grams), "Received and weighed"]);
    onDone(r.ok ? { ...r, message: `Device #${device.id} received (${grams} g).` } : r);
  }
  return (
    <tr>
      <td>#{device.id}</td><td>{CATEGORIES[device.category - 1]}</td>
      <td><StatusBadge status={device.status} /></td>
      <td><input type="number" min="0" placeholder="weight in grams" value={grams} onChange={(e) => setGrams(e.target.value)} /></td>
      <td><button onClick={confirm}>Confirm receipt</button></td>
    </tr>
  );
}

function CompleteRow({ device, persona, onDone }) {
  const [recovered, setRecovered] = useState("");
  const [residual, setResidual] = useState("");
  const [file, setFile] = useState(null);
  const sum = Number(recovered || 0) + Number(residual || 0);
  const balanced = sum === device.receivedGrams;

  async function complete() {
    if (!file) return onDone({ ok: false, error: "Choose the certificate PDF first." });
    const hash = await fileHash(file);
    const r = await sendTx(persona.index, "completeRecycling",
      [device.id, Number(recovered || 0), Number(residual || 0), hash, "Recycling completed"]);
    onDone(r.ok ? { ...r, message: `Device #${device.id} recycled. Certificate hash stored: ${hash.slice(0, 18)}...` } : r);
  }
  return (
    <tr>
      <td>#{device.id}</td><td>{CATEGORIES[device.category - 1]}</td>
      <td>{device.receivedGrams} g</td>
      <td>
        <input type="number" min="0" placeholder="recovered g" value={recovered} onChange={(e) => setRecovered(e.target.value)} />{" "}
        <input type="number" min="0" placeholder="residual g" value={residual} onChange={(e) => setResidual(e.target.value)} />
        <div className={balanced ? "okText" : "warnText"}>
          {recovered === "" && residual === "" ? "" : `Sum ${sum} g vs received ${device.receivedGrams} g ${balanced ? "(balanced)" : "(will be rejected)"}`}
        </div>
      </td>
      <td><input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files[0] || null)} /></td>
      <td><button onClick={complete}>Complete recycling</button></td>
    </tr>
  );
}

export default function RecyclerConsole() {
  const { persona } = usePersona();
  const { devices, error, reload } = useDevices();
  const [me, setMe] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    personaAddress(persona.index).then(setMe).catch(() => setMe(null));
  }, [persona]);

  const done = (r) => { setResult(r); reload(); };
  const incoming = devices.filter((d) => d.status === 3 && me && d.pendingRecipient.toLowerCase() === me.toLowerCase());
  const atMe = devices.filter((d) => d.status === 4 && me && d.custodian.toLowerCase() === me.toLowerCase());

  return (
    <div className="card">
      <h2>Recycler console</h2>
      <ActingAs persona={persona} />
      <ErrorNote text={error} />
      <h3>Incoming devices</h3>
      <table>
        <thead><tr><th>ID</th><th>Category</th><th>Status</th><th>Weight</th><th></th></tr></thead>
        <tbody>
          {incoming.map((d) => <ReceiptRow key={d.id} device={d} persona={persona} onDone={done} />)}
          {incoming.length === 0 && <tr><td colSpan="5">Nothing incoming for this persona.</td></tr>}
        </tbody>
      </table>
      <h3>Ready to recycle</h3>
      <p className="hint">The certificate PDF is hashed in your browser; only its SHA-256 hash goes on the blockchain. Keep this exact file for verification later.</p>
      <table>
        <thead><tr><th>ID</th><th>Category</th><th>Received</th><th>Recovered + residual (g)</th><th>Certificate</th><th></th></tr></thead>
        <tbody>
          {atMe.map((d) => <CompleteRow key={d.id} device={d} persona={persona} onDone={done} />)}
          {atMe.length === 0 && <tr><td colSpan="6">No devices waiting at this recycler.</td></tr>}
        </tbody>
      </table>
      <TxBanner result={result} />
    </div>
  );
}
