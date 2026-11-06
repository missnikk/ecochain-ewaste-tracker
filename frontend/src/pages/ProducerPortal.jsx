import React, { useEffect, useState } from "react";
import { useWallet } from "../wallet";
import { readContract, sendTx, CATEGORIES, STATUS, deviceIdFromReceipt } from "../services/chain";
import { metadataHash } from "../services/hash";
import { api } from "../services/api";
import { PlusCircle, Award, Box, Printer, CheckCircle2, RefreshCw } from "lucide-react";

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
      try {
        const pts = Number(await c.pointsRedeemedWith(address));
        setRedeemedPoints(pts);
      } catch {}

      const res = await api.devices({ producer: address });
      const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      setDevices(list);
    } catch (e) {
      console.warn("ProducerPortal load error:", e.message);
      setDevices([]);
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

    try {
      const meta = { name, brand, model, serial, notes };
      const hash = await metadataHash(meta);

      const res = await sendTx(signer, "registerDevice", [Number(category), hash, `Registered ${name}`]);
      if (res.ok) {
        const id = deviceIdFromReceipt(res.contract, res.receipt);
        if (id) {
          await api.saveMetadata(id, meta);
          const claimCode = `ECO-CLAIM-${id}-${hash.slice(2, 8).toUpperCase()}`;
          setRegisteredItem({ id, name, claimCode, hash });
        }
        setStatusMsg({ ok: true, text: `Product registered on blockchain! (Tx: ${res.hash ? res.hash.slice(0, 10) : ""}…)` });
        setName("");
        setBrand("");
        setModel("");
        setSerial("");
        await loadProducerData();
      } else {
        setStatusMsg({ ok: false, text: res.error });
      }
    } catch (err) {
      setStatusMsg({ ok: false, text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const devList = Array.isArray(devices) ? devices : [];
  const recycledCount = devList.filter((d) => d && d.status === 5).length;

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: "0 0 6px" }}>Producer Management Console</h1>
          <p style={{ color: "var(--text-muted)", margin: 0 }}>
            Register electronic hardware into the decentralized tracking stream, issue claim codes, and view voucher redemptions.
          </p>
        </div>
        <button
          className="btn btn-outline"
          onClick={loadProducerData}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}
        >
          <RefreshCw size={14} /> Refresh Catalog
        </button>
      </div>

      {statusMsg && (
        <div style={{ marginBottom: 20, padding: 12, borderRadius: 8, background: statusMsg.ok ? "#f0fdf4" : "#fef2f2", color: statusMsg.ok ? "#166534" : "#991b1b", border: `1px solid ${statusMsg.ok ? "#bbf7d0" : "#fecaca"}`, fontSize: 14 }}>
          {statusMsg.text}
        </div>
      )}

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="kpi-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span className="kpi-label">Registered Products</span>
            <div style={{ background: "#dbeafe", padding: 6, borderRadius: 8 }}>
              <Box size={18} color="#2563eb" />
            </div>
          </div>
          <div className="kpi-value">{devList.length}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
            Manufactured and anchored on-chain
          </div>
        </div>

        <div className="kpi-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span className="kpi-label">Points Redeemed With You</span>
            <div style={{ background: "#dcfce7", padding: 6, borderRadius: 8 }}>
              <Award size={18} color="#16a34a" />
            </div>
          </div>
          <div className="kpi-value">{redeemedPoints} pts</div>
          <div style={{ fontSize: 12, color: "#16a34a", marginTop: 4 }}>
            Customer discount vouchers redeemed
          </div>
        </div>

        <div className="kpi-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span className="kpi-label">Recycled End-of-Life</span>
            <div style={{ background: "#fef3c7", padding: 6, borderRadius: 8 }}>
              <CheckCircle2 size={18} color="#d97706" />
            </div>
          </div>
          <div className="kpi-value">{recycledCount}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
            Devices certified recycled
          </div>
        </div>
      </div>

      {/* Generated Claim Code Success Modal/Card */}
      {registeredItem && (
        <div className="card" style={{ border: "2px solid #16a34a", background: "#f0fdf4", marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div>
              <span className="badge badge-recycler" style={{ marginBottom: 6, display: "inline-block" }}>Device Created Successfully</span>
              <h2 style={{ margin: "4px 0", color: "#166534" }}>Device #{registeredItem.id}: {registeredItem.name}</h2>
              <p style={{ margin: "4px 0 10px", fontSize: 14, color: "#334155" }}>
                Provide this Claim Code to the purchasing consumer (print on packaging or warranty card):
              </p>
              <div style={{ display: "inline-block", background: "#fff", border: "2px dashed #16a34a", padding: "10px 18px", borderRadius: 8, fontFamily: "monospace", fontSize: 18, fontWeight: 700, color: "#15803d" }}>
                {registeredItem.claimCode}
              </div>
            </div>
            <button className="btn btn-outline" onClick={() => window.print()} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Printer size={16} /> Print Claim Voucher
            </button>
          </div>
        </div>
      )}

      {/* Register Product Form */}
      <div className="card" style={{ marginBottom: 28 }}>
        <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 8px" }}>
          <PlusCircle size={20} color="#16a34a" /> Register New Electronic Product
        </h3>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 16px" }}>
          This locks in the initial category and SHA-256 metadata hash on the blockchain. The owner field remains unclaimed until claimed by a consumer.
        </p>

        <form onSubmit={handleRegister}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 14 }}>
            <div className="form-group">
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Product Name</label>
              <input type="text" placeholder="e.g. ThinkPad T14" value={name} onChange={(e) => setName(e.target.value)} required style={{ width: "100%", padding: "8px 12px" }} />
            </div>
            <div className="form-group">
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Manufacturer / Brand</label>
              <input type="text" placeholder="e.g. Lenovo" value={brand} onChange={(e) => setBrand(e.target.value)} required style={{ width: "100%", padding: "8px 12px" }} />
            </div>
            <div className="form-group">
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Model Number</label>
              <input type="text" placeholder="e.g. 20W0003RUS" value={model} onChange={(e) => setModel(e.target.value)} required style={{ width: "100%", padding: "8px 12px" }} />
            </div>
            <div className="form-group">
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Serial Number</label>
              <input type="text" placeholder="e.g. SN-883921" value={serial} onChange={(e) => setSerial(e.target.value)} style={{ width: "100%", padding: "8px 12px" }} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 16 }}>
            <div className="form-group">
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Official Schedule I Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: "100%", padding: "8px 12px" }}>
                {CATEGORIES.map((cat, idx) => (
                  <option key={idx} value={idx + 1}>{idx + 1}. {cat}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Production Notes</label>
              <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ width: "100%", padding: "8px 12px" }} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Submitting to Blockchain…" : "Register Device on Blockchain"}
          </button>
        </form>
      </div>

      {/* My Products Table */}
      <div className="card">
        <h3 className="card-title" style={{ margin: "0 0 14px", fontSize: 18 }}>My Registered Products Catalog</h3>
        <div className="table-responsive">
          <table style={{ width: "100%", fontSize: 13 }}>
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
              {devList.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", color: "#64748b", padding: 24 }}>No products registered under this wallet yet. Register one above!</td></tr>
              ) : (
                devList.map((d) => (
                  <tr key={d.id}>
                    <td><strong>#{d.id}</strong></td>
                    <td>
                      <div><strong>{d.meta?.name || `Device #${d.id}`}</strong></div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{d.meta?.brand} {d.meta?.model}</div>
                    </td>
                    <td>{CATEGORIES[d.category - 1] || "General"}</td>
                    <td>
                      {d.owner ? (
                        <code style={{ fontSize: 12 }}>Claimed: {d.owner.slice(0, 6)}…</code>
                      ) : (
                        <span className="badge badge-none">Unclaimed (In Inventory)</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge badge-admin`}>{STATUS[d.status]}</span>
                    </td>
                    <td>
                      <a href={`/track?id=${d.id}`} className="btn btn-outline" style={{ padding: "3px 8px", fontSize: 12, textDecoration: "none" }}>
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
