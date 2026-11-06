import React, { useEffect, useState } from "react";
import { useWallet } from "../wallet";
import { readContract, sendTx, CATEGORIES, STATUS, shortAddr } from "../services/chain";
import { api } from "../services/api";
import { Award, Gift, Smartphone, FileCheck, ArrowUpRight, Download } from "lucide-react";

export default function ConsumerPortal() {
  const { signer, address } = useWallet();
  const [points, setPoints] = useState(0);
  const [myDevices, setMyDevices] = useState([]);
  const [producers, setProducers] = useState([]);
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  // Claim Form
  const [claimId, setClaimId] = useState("");
  const [claimNote, setClaimNote] = useState("Claimed by consumer");

  // Redeem Form
  const [redeemPointsAmount, setRedeemPointsAmount] = useState(10);
  const [selectedProducer, setSelectedProducer] = useState("");
  const [redeemNote, setRedeemNote] = useState("10% store discount coupon");

  const loadConsumerData = async () => {
    if (!address) return;
    try {
      const c = readContract();
      const p = Number(await c.greenPoints(address));
      setPoints(p);

      const devs = await api.devices({ owner: address });
      setMyDevices(devs);

      const parts = await api.participants();
      const prodList = parts.filter((part) => part.role === 2 && !part.suspended);
      setProducers(prodList);
      if (prodList.length > 0 && !selectedProducer) {
        setSelectedProducer(prodList[0].address);
      }
    } catch (e) {
      console.warn(e.message);
    }
  };

  useEffect(() => {
    loadConsumerData();
  }, [address]);

  const handleClaim = async (e) => {
    e.preventDefault();
    const id = Number(claimId);
    if (!id || id < 1) return;
    setBusy(true);
    setStatusMsg(null);

    const res = await sendTx(signer, "claimDevice", [id, claimNote]);
    if (res.ok) {
      setStatusMsg({ ok: true, text: `Device #${id} successfully claimed and registered under your ownership!` });
      setClaimId("");
      await loadConsumerData();
    } else {
      setStatusMsg({ ok: false, text: res.error });
    }
    setBusy(false);
  };

  const handleRequestPickup = async (deviceId) => {
    setBusy(true);
    setStatusMsg(null);
    const res = await sendTx(signer, "requestPickup", [deviceId, "Consumer pickup requested"]);
    if (res.ok) {
      setStatusMsg({ ok: true, text: `Pickup requested for Device #${deviceId}! A collector will confirm collection soon.` });
      await loadConsumerData();
    } else {
      setStatusMsg({ ok: false, text: res.error });
    }
    setBusy(false);
  };

  const handleRedeem = async (e) => {
    e.preventDefault();
    const pts = Number(redeemPointsAmount);
    if (!pts || pts <= 0 || !selectedProducer) return;
    setBusy(true);
    setStatusMsg(null);

    const res = await sendTx(signer, "redeemPoints", [pts, selectedProducer, redeemNote]);
    if (res.ok) {
      setStatusMsg({ ok: true, text: `Successfully redeemed ${pts} Green Points with producer ${shortAddr(selectedProducer)}!` });
      await loadConsumerData();
    } else {
      setStatusMsg({ ok: false, text: res.error });
    }
    setBusy(false);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Consumer Ownership & Recycling Portal</h1>
        <p>Claim electronic devices, schedule certified e-waste pickups, track recycling progress, and redeem Green Points.</p>
      </div>

      {statusMsg && (
        <div className={`alert ${statusMsg.ok ? "alert-ok" : "alert-err"}`}>
          {statusMsg.text}
        </div>
      )}

      {/* Points & Summary KPI Cards */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="kpi-card" style={{ border: "2px solid #86efac", background: "#f0fdf4" }}>
          <div className="kpi-icon" style={{ backgroundColor: "#16a34a", color: "#fff" }}><Award size={26} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Available Green Points</span>
            <span className="kpi-value" style={{ color: "#166534" }}>{points} pts</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ backgroundColor: "#dbeafe", color: "#2563eb" }}><Smartphone size={24} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Claimed Devices</span>
            <span className="kpi-value">{myDevices.length}</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ backgroundColor: "#f3e8ff", color: "#7c3aed" }}><FileCheck size={24} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Recycled Devices</span>
            <span className="kpi-value">{myDevices.filter((d) => d.status === 5).length}</span>
          </div>
        </div>
      </div>

      {/* Claim a Device Form */}
      <div className="card" style={{ marginBottom: 28 }}>
        <h3 className="card-title">Claim a New Device (Warranty / Ownership Registration)</h3>
        <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px" }}>
          Enter the Device ID provided by your manufacturer on the warranty receipt or packaging to claim ownership.
        </p>
        <form onSubmit={handleClaim} style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div className="form-group" style={{ width: 140, margin: 0 }}>
            <label>Device ID</label>
            <input type="number" min="1" placeholder="e.g. 1" value={claimId} onChange={(e) => setClaimId(e.target.value)} required />
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: 240, margin: 0 }}>
            <label>Registration Note</label>
            <input type="text" value={claimNote} onChange={(e) => setClaimNote(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            Claim Device Ownership
          </button>
        </form>
      </div>

      {/* My Devices List */}
      <div className="card" style={{ marginBottom: 28 }}>
        <h3 className="card-title" style={{ marginBottom: 14 }}>My Electronic Devices</h3>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Product</th>
                <th>Category</th>
                <th>Current Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {myDevices.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: "center", color: "#64748b" }}>You have not claimed any devices yet.</td></tr>
              ) : (
                myDevices.map((d) => (
                  <tr key={d.id}>
                    <td><strong>#{d.id}</strong></td>
                    <td>
                      <div><strong>{d.meta?.name || `Device #${d.id}`}</strong></div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{d.meta?.brand} {d.meta?.model}</div>
                    </td>
                    <td>{CATEGORIES[d.category - 1]}</td>
                    <td><span className={`status-chip status-${d.status}`}>{STATUS[d.status]}</span></td>
                    <td>
                      {d.status === 0 && (
                        <button className="btn btn-primary" style={{ padding: "6px 12px", fontSize: 13 }} onClick={() => handleRequestPickup(d.id)} disabled={busy}>
                          Request Doorstep Pickup
                        </button>
                      )}
                      {d.status === 5 && (
                        <a href={`http://localhost:4000/api/certificates/${d.id}`} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: 13, textDecoration: "none" }}>
                          <Download size={14} /> Certificate PDF
                        </a>
                      )}
                      {d.status > 0 && d.status < 5 && (
                        <span style={{ fontSize: 13, color: "#64748b" }}>In Progress…</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Redeem Points Section */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Gift size={20} color="#16a34a" /> Redeem Green Points for Brand Discounts
          </h3>
          <span style={{ fontSize: 13, color: "#64748b" }}>1 Point = 100g recycled material</span>
        </div>
        <form onSubmit={handleRedeem}>
          <div className="grid-3">
            <div className="form-group">
              <label>Select Participating Producer</label>
              <select value={selectedProducer} onChange={(e) => setSelectedProducer(e.target.value)} required>
                {producers.length === 0 ? (
                  <option value="">No active producers registered</option>
                ) : (
                  producers.map((p) => (
                    <option key={p.address} value={p.address}>
                      Producer ({p.address.slice(0, 10)}…)
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="form-group">
              <label>Points to Redeem (Max: {points})</label>
              <input type="number" min="1" max={points} value={redeemPointsAmount} onChange={(e) => setRedeemPointsAmount(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Voucher Details</label>
              <input type="text" value={redeemNote} onChange={(e) => setRedeemNote(e.target.value)} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={busy || points <= 0 || !selectedProducer}>
            <ArrowUpRight size={16} /> Burn Points & Issue Producer Discount Voucher
          </button>
        </form>
      </div>
    </div>
  );
}
