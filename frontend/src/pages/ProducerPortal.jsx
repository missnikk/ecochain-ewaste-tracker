import React, { useEffect, useState } from "react";
import { useWallet } from "../wallet";
import { readContract, sendTx, CATEGORIES, STATUS, deviceIdFromReceipt } from "../services/chain";
import { metadataHash } from "../services/hash";
import { api } from "../services/api";
import { PlusCircle, Award, Box, Printer, CheckCircle2 } from "lucide-react";

export default function ProducerPortal() {
  const { signer, address } = useWallet();
  const [devices, setDevices] = useState([]);
  const [redeemedPoints, setRedeemedPoints] = useState(0);
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [registeredItem, setRegisteredItem] = useState(null);

  // Registration Form
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [serial, setSerial] = useState("");
  const [category, setCategory] = useState(1);
  const [notes, setNotes] = useState("Manufactured batch 2026");

  const loadProducerData = async () => {
    if (!address) return;
    try {
      const c = readContract();
      const pts = Number(await c.pointsRedeemedWith(address));
      setRedeemedPoints(pts);

      const all = await api.devices({ producer: address });
      setDevices(all);
    } catch (e) {
      console.warn(e.message);
    }
  };

  useEffect(() => {
    loadProducerData();
  }, [address]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name || !brand || !model) return;
    setBusy(true);
    setStatusMsg(null);
    setRegisteredItem(null);

    const meta = { name, brand, model, serial, notes };
    const hash = metadataHash(meta);

    const res = await sendTx(signer, "registerDevice", [Number(category), hash, `Registered ${name}`]);
    if (res.ok) {
      const id = deviceIdFromReceipt(res.contract, res.receipt);
      if (id) {
        await api.postMetadata(id, meta);
        const claimCode = `ECO-CLAIM-${id}-${hash.slice(2, 8).toUpperCase()}`;
        setRegisteredItem({ id, name, claimCode, hash });
      }
      setStatusMsg({ ok: true, text: `Product registered on blockchain! (Tx: ${res.hash.slice(0, 10)}…)` });
      setName("");
      setBrand("");
      setModel("");
      setSerial("");
      await loadProducerData();
    } else {
      setStatusMsg({ ok: false, text: res.error });
    }
    setBusy(false);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Producer Management Console</h1>
        <p>Register electronic hardware into the decentralized tracking stream, issue claim codes, and view voucher redemptions.</p>
      </div>

      {statusMsg && (
        <div className={`alert ${statusMsg.ok ? "alert-ok" : "alert-err"}`}>
          {statusMsg.text}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ backgroundColor: "#dbeafe", color: "#2563eb" }}><Box size={24} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Registered Products</span>
            <span className="kpi-value">{devices.length}</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ backgroundColor: "#dcfce7", color: "#16a34a" }}><Award size={24} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Points Redeemed With You</span>
            <span className="kpi-value">{redeemedPoints} pts</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ backgroundColor: "#fef3c7", color: "#d97706" }}><CheckCircle2 size={24} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Recycled End-of-Life</span>
            <span className="kpi-value">{devices.filter((d) => d.status === 5).length}</span>
          </div>
        </div>
      </div>

      {/* Generated Claim Code Success Modal/Card */}
      {registeredItem && (
        <div className="card" style={{ border: "2px solid #16a34a", background: "#f0fdf4", marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div>
              <span className="status-chip status-5" style={{ marginBottom: 6 }}>Device Created Successfully</span>
              <h2 style={{ margin: "4px 0", color: "#166534" }}>Device #{registeredItem.id}: {registeredItem.name}</h2>
              <p style={{ margin: "4px 0 10px", fontSize: 14, color: "#334155" }}>
                Provide this Claim Code to the purchasing consumer (print on packaging or warranty card):
              </p>
              <div style={{ display: "inline-block", background: "#fff", border: "2px dashed #16a34a", padding: "10px 18px", borderRadius: 8, fontFamily: "monospace", fontSize: 18, fontWeight: 700, color: "#15803d" }}>
                {registeredItem.claimCode}
              </div>
            </div>
            <button className="btn btn-secondary" onClick={() => window.print()} style={{ display: "flex", gap: 6 }}>
              <Printer size={16} /> Print Claim Voucher
            </button>
          </div>
        </div>
      )}

      {/* Register Product Form */}
      <div className="card" style={{ marginBottom: 28 }}>
        <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <PlusCircle size={20} color="#16a34a" /> Register New Electronic Product
        </h3>
        <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px" }}>
          This locks in the initial category and SHA-256 metadata hash on the blockchain. The owner field remains unclaimed until registered by a consumer.
        </p>

        <form onSubmit={handleRegister}>
          <div className="grid-2">
            <div className="form-group">
              <label>Product Name</label>
              <input type="text" placeholder="e.g. ThinkPad T14" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Manufacturer / Brand</label>
              <input type="text" placeholder="e.g. Lenovo" value={brand} onChange={(e) => setBrand(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Model Number</label>
              <input type="text" placeholder="e.g. 20W0003RUS" value={model} onChange={(e) => setModel(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Serial Number</label>
              <input type="text" placeholder="e.g. SN-883921" value={serial} onChange={(e) => setSerial(e.target.value)} />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Official Schedule I Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((cat, idx) => (
                  <option key={idx} value={idx + 1}>{idx + 1}. {cat}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Production Notes</label>
              <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={busy} style={{ marginTop: 8 }}>
            {busy ? "Submitting to Blockchain…" : "Register Product on Chain"}
          </button>
        </form>
      </div>

      {/* My Products Table */}
      <div className="card">
        <h3 className="card-title" style={{ marginBottom: 14 }}>My Registered Products Catalog</h3>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Product</th>
                <th>Category</th>
                <th>Owner Status</th>
                <th>Lifecycle Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {devices.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", color: "#64748b" }}>No products registered yet.</td></tr>
              ) : (
                devices.map((d) => (
                  <tr key={d.id}>
                    <td><strong>#{d.id}</strong></td>
                    <td>
                      <div><strong>{d.meta?.name || `Device #${d.id}`}</strong></div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{d.meta?.brand} {d.meta?.model}</div>
                    </td>
                    <td>{CATEGORIES[d.category - 1]}</td>
                    <td>
                      {d.owner ? (
                        <span style={{ fontFamily: "monospace", fontSize: 12 }}>Claimed: {d.owner.slice(0, 6)}…</span>
                      ) : (
                        <span className="status-chip status-0">Unclaimed (In Inventory)</span>
                      )}
                    </td>
                    <td>
                      <span className={`status-chip status-${d.status}`}>{STATUS[d.status]}</span>
                    </td>
                    <td>
                      <a href={`/track?id=${d.id}`} className="btn btn-secondary" style={{ padding: "4px 10px", fontSize: 12, textDecoration: "none" }}>
                        View Trace
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
