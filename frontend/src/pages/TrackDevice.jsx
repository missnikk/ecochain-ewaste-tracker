import { useState } from "react";
import { readContract, fetchHistory, friendlyError, CATEGORIES, STATUS, shortAddr } from "../services/chain";
import { metadataHash } from "../services/hash";
import { api } from "../services/api";
import { StatusBadge, ErrorNote } from "../ui";

const ZERO = "0x" + "0".repeat(64);

export default function TrackDevice() {
  const [id, setId] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  async function load(e) {
    e.preventDefault();
    setError(null); setData(null);
    try {
      const n = Number(id);
      const d = await readContract().getDevice(n);
      const history = await fetchHistory(n);
      let meta = null;
      let integrity = { state: "unknown", note: "No off-chain details available (backend offline or none saved)." };
      const r = await api.device(n);
      if (r.ok && r.data.meta) {
        meta = r.data.meta;
        const hash = await metadataHash(meta);
        integrity = hash.toLowerCase() === String(d.metaHash).toLowerCase()
          ? { state: "ok", note: "Off-chain details match the hash stored on the blockchain." }
          : { state: "bad", note: "MISMATCH: the off-chain details were changed after registration." };
      }
      setData({ d, history, meta, integrity });
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  return (
    <div className="card">
      <h2>Track device</h2>
      <form onSubmit={load} className="inline">
        <input type="number" min="1" placeholder="Device ID" value={id} onChange={(e) => setId(e.target.value)} required />
        <button>Track</button>
      </form>
      <ErrorNote text={error} />
      {data && (
        <>
          <h3>Device #{Number(data.d.id)} <StatusBadge status={Number(data.d.status)} /></h3>
          <ul className="facts">
            <li>Category: {CATEGORIES[Number(data.d.category) - 1]}</li>
            <li>Producer: {shortAddr(data.d.producer)}</li>
            <li>Owner: {shortAddr(data.d.owner)}</li>
            <li>Current holder: {shortAddr(data.d.custodian)}</li>
            <li>Received: {Number(data.d.receivedGrams)} g, recovered: {Number(data.d.recoveredGrams)} g, residual: {Number(data.d.residualGrams)} g</li>
            <li>Certificate hash: {data.d.certificateHash === ZERO ? "not issued yet" : data.d.certificateHash}</li>
            <li>Metadata hash: {String(data.d.metaHash).slice(0, 22)}...</li>
          </ul>
          {data.meta && (
            <p>Details: <strong>{data.meta.name}</strong>, {data.meta.brand} {data.meta.model}
              {data.meta.serial ? ` (serial ${data.meta.serial})` : ""}</p>
          )}
          <div className={data.integrity.state === "ok" ? "ok" : data.integrity.state === "bad" ? "err" : "warn"}>
            Metadata integrity: {data.integrity.state === "ok" ? "✓ " : data.integrity.state === "bad" ? "✗ " : ""}{data.integrity.note}
          </div>
          <h3>Timeline</h3>
          <ol className="timeline">
            {data.history.map((h, i) => (
              <li key={i}>
                <strong>{STATUS[h.status]}</strong> · {shortAddr(h.actor)} · {new Date(h.timestamp * 1000).toLocaleString()}
                {h.note ? ` · ${h.note}` : ""}
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
