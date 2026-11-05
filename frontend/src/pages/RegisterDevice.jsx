import { useEffect, useState } from "react";
import { usePersona } from "../persona";
import { PERSONAS, CATEGORIES, sendTx, deviceIdFromReceipt, personaAddress } from "../services/chain";
import { metadataHash } from "../services/hash";
import { api } from "../services/api";
import { ActingAs, TxBanner } from "../ui";

export default function RegisterDevice() {
  const { persona } = usePersona();
  const consumers = PERSONAS.filter((p) => p.role === "Consumer");
  const [catalog, setCatalog] = useState([]);
  const [form, setForm] = useState({
    category: 1, name: "", brand: "", model: "", serial: "", notes: "", consumerIndex: consumers[0].index,
  });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [metaNote, setMetaNote] = useState("");

  useEffect(() => { api.catalog().then((r) => r.ok && setCatalog(r.data)); }, []);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const samples = (catalog.find((c) => c.category === Number(form.category)) || { items: [] }).items;

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setResult(null); setMetaNote("");
    try {
      const meta = { name: form.name, brand: form.brand, model: form.model, serial: form.serial, notes: form.notes };
      const hash = await metadataHash(meta);
      const ownerAddr = await personaAddress(Number(form.consumerIndex));
      const tx = await sendTx(persona.index, "registerDevice", [Number(form.category), hash, ownerAddr, "Registered by producer"]);
      if (!tx.ok) { setResult(tx); return; }
      const id = deviceIdFromReceipt(tx.contract, tx.receipt);
      setResult({ ...tx, message: `Device #${id} registered on the blockchain.` });
      const saved = await api.saveMetadata(id, meta); // backend re-checks the hash against the chain
      setMetaNote(saved.ok ? "Details saved off-chain and verified against the on-chain hash."
                           : `Details not saved off-chain (${saved.error}). The blockchain record is still valid.`);
    } catch (err) {
      setResult({ ok: false, error: String(err.message || err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card">
      <h2>Register device</h2>
      <ActingAs persona={persona} />
      <label>Category
        <select value={form.category} onChange={(e) => set("category", e.target.value)}>
          {CATEGORIES.map((c, i) => <option key={i} value={i + 1}>{c}</option>)}
        </select>
      </label>
      {samples.length > 0 && <p className="hint">Examples: {samples.join(", ")}</p>}
      <label>Device name <input value={form.name} onChange={(e) => set("name", e.target.value)} required /></label>
      <label>Brand <input value={form.brand} onChange={(e) => set("brand", e.target.value)} required /></label>
      <label>Model <input value={form.model} onChange={(e) => set("model", e.target.value)} required /></label>
      <label>Serial (optional) <input value={form.serial} onChange={(e) => set("serial", e.target.value)} /></label>
      <label>Owner (consumer)
        <select value={form.consumerIndex} onChange={(e) => set("consumerIndex", e.target.value)}>
          {consumers.map((c) => <option key={c.index} value={c.index}>{c.name}</option>)}
        </select>
      </label>
      <button disabled={busy}>{busy ? "Sending..." : "Register on blockchain"}</button>
      <TxBanner result={result} />
      {metaNote && <p className="hint">{metaNote}</p>}
    </form>
  );
}
