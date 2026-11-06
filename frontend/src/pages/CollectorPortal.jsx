import React, { useEffect, useState } from "react";
import { useWallet } from "../wallet";
import { readContract, sendTx, CATEGORIES, STATUS, shortAddr } from "../services/chain";
import { api } from "../services/api";
import { Truck, CheckCircle, Send, Package } from "lucide-react";

export default function CollectorPortal() {
  const { signer, address } = useWallet();
  const [pickupQueue, setPickupQueue] = useState([]);
  const [custodyDevices, setCustodyDevices] = useState([]);
  const [recyclers, setRecyclers] = useState([]);
  const [selectedRecyclers, setSelectedRecyclers] = useState({});
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const loadCollectorData = async () => {
    try {
      // 1. Devices requesting pickup (status = 1)
      const pending = await api.devices({ status: 1 });
      setPickupQueue(pending);

      // 2. Devices in my custody (status = 2)
      const allCollected = await api.devices({ status: 2 });
      // In on-chain contract, custodian is tracked
      const c = readContract();
      const myCustody = [];
      for (const d of allCollected) {
        const onChain = await c.getDevice(d.id);
        if (onChain.custodian.toLowerCase() === (address || "").toLowerCase()) {
          myCustody.push({ ...d, custodian: onChain.custodian });
        }
      }
      setCustodyDevices(myCustody);

      // 3. Certified recyclers list
      const parts = await api.participants();
      const recList = parts.filter((p) => p.role === 5 && !p.suspended);
      setRecyclers(recList);
    } catch (e) {
      console.warn(e.message);
    }
  };

  useEffect(() => {
    loadCollectorData();
  }, [address]);

  const handleConfirmCollection = async (deviceId) => {
    setBusy(true);
    setStatusMsg(null);
    const res = await sendTx(signer, "confirmCollection", [deviceId, "Collected by logistics agent"]);
    if (res.ok) {
      setStatusMsg({ ok: true, text: `Device #${deviceId} marked as Collected. Custody transferred to your account!` });
      await loadCollectorData();
    } else {
      setStatusMsg({ ok: false, text: res.error });
    }
    setBusy(false);
  };

  const handleDispatch = async (deviceId) => {
    const rec = selectedRecyclers[deviceId] || (recyclers[0] && recyclers[0].address);
    if (!rec) {
      setStatusMsg({ ok: false, text: "Please select a certified recycler destination." });
      return;
    }
    setBusy(true);
    setStatusMsg(null);
    const res = await sendTx(signer, "dispatchToRecycler", [deviceId, rec, "Dispatched in transit to certified facility"]);
    if (res.ok) {
      setStatusMsg({ ok: true, text: `Device #${deviceId} successfully dispatched to recycler ${shortAddr(rec)}!` });
      await loadCollectorData();
    } else {
      setStatusMsg({ ok: false, text: res.error });
    }
    setBusy(false);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Logistics & Collection Portal</h1>
        <p>Manage e-waste pickup requests from consumers, maintain custody chain, and dispatch shipments to certified recycling plants.</p>
      </div>

      {statusMsg && (
        <div className={`alert ${statusMsg.ok ? "alert-ok" : "alert-err"}`}>
          {statusMsg.text}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ backgroundColor: "#fef3c7", color: "#d97706" }}><Truck size={24} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Awaiting Collection</span>
            <span className="kpi-value">{pickupQueue.length} devices</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ backgroundColor: "#dbeafe", color: "#2563eb" }}><Package size={24} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Currently in Custody</span>
            <span className="kpi-value">{custodyDevices.length} devices</span>
          </div>
        </div>
      </div>

      {/* Awaiting Pickup Requests Table */}
      <div className="card" style={{ marginBottom: 28 }}>
        <h3 className="card-title">Pending Consumer Doorstep Pickup Requests</h3>
        <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px" }}>
          Consumers have flagged these devices for disposal. Confirm collection to take on-chain custodial responsibility.
        </p>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Device</th>
                <th>Category</th>
                <th>Owner Address</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pickupQueue.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: "center", color: "#64748b" }}>No pickup requests waiting.</td></tr>
              ) : (
                pickupQueue.map((d) => (
                  <tr key={d.id}>
                    <td><strong>#{d.id}</strong></td>
                    <td>
                      <div><strong>{d.meta?.name || `Device #${d.id}`}</strong></div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{d.meta?.brand} {d.meta?.model}</div>
                    </td>
                    <td>{CATEGORIES[d.category - 1]}</td>
                    <td style={{ fontFamily: "monospace", fontSize: 13 }}>{shortAddr(d.owner)}</td>
                    <td>
                      <button className="btn btn-primary" style={{ padding: "6px 12px", fontSize: 13 }} onClick={() => handleConfirmCollection(d.id)} disabled={busy}>
                        <CheckCircle size={14} /> Confirm Collection
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* In Custody / Dispatch Table */}
      <div className="card">
        <h3 className="card-title">Devices in Your Physical Custody (Ready for Dispatch)</h3>
        <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px" }}>
          Select a licensed recycling facility and execute on-chain transit dispatch.
        </p>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Device</th>
                <th>Category</th>
                <th>Select Certified Recycler Destination</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {custodyDevices.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: "center", color: "#64748b" }}>No devices currently in your custody.</td></tr>
              ) : (
                custodyDevices.map((d) => (
                  <tr key={d.id}>
                    <td><strong>#{d.id}</strong></td>
                    <td>
                      <div><strong>{d.meta?.name || `Device #${d.id}`}</strong></div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{d.meta?.brand} {d.meta?.model}</div>
                    </td>
                    <td>{CATEGORIES[d.category - 1]}</td>
                    <td>
                      <select
                        value={selectedRecyclers[d.id] || (recyclers[0]?.address || "")}
                        onChange={(e) => setSelectedRecyclers({ ...selectedRecyclers, [d.id]: e.target.value })}
                        style={{ width: "100%", maxWidth: 280 }}
                      >
                        {recyclers.map((r) => (
                          <option key={r.address} value={r.address}>
                            Recycler ({r.address.slice(0, 10)}…)
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button className="btn btn-primary" style={{ padding: "6px 12px", fontSize: 13 }} onClick={() => handleDispatch(d.id)} disabled={busy || recyclers.length === 0}>
                        <Send size={14} /> Dispatch to Recycler
                      </button>
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
