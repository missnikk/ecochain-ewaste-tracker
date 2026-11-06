import React, { useEffect, useState } from "react";
import { useWallet } from "../wallet";
import { readContract, sendTx, CATEGORIES, STATUS, shortAddr } from "../services/chain";
import { api } from "../services/api";
import { jsPDF } from "jspdf";
import { Scale, CheckCircle2, AlertTriangle, FileCheck, Download, Sparkles } from "lucide-react";

export default function RecyclerPortal() {
  const { signer, address } = useWallet();
  const [incomingDevices, setIncomingDevices] = useState([]);
  const [atRecyclerDevices, setAtRecyclerDevices] = useState([]);
  const [issuedCerts, setIssuedCerts] = useState([]);
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  // Form inputs
  const [weighInputs, setWeighInputs] = useState({}); // deviceId -> receivedGrams
  const [processInputs, setProcessInputs] = useState({}); // deviceId -> { recovered, residual }

  const loadRecyclerData = async () => {
    if (!address) return;
    try {
      const c = readContract();

      // 1. Incoming dispatches designated to me (status = 3)
      const inTransit = await api.devices({ status: 3 });
      const incoming = [];
      for (const d of inTransit) {
        const onChain = await c.getDevice(d.id);
        if (onChain.pendingRecipient.toLowerCase() === address.toLowerCase()) {
          incoming.push({ ...d, pendingRecipient: onChain.pendingRecipient });
        }
      }
      setIncomingDevices(incoming);

      // 2. Devices at recycler in my custody (status = 4)
      const atFacility = await api.devices({ status: 4 });
      const myFacility = [];
      for (const d of atFacility) {
        const onChain = await c.getDevice(d.id);
        if (onChain.custodian.toLowerCase() === address.toLowerCase()) {
          myFacility.push({
            ...d,
            custodian: onChain.custodian,
            receivedGrams: Number(onChain.receivedGrams),
          });
        }
      }
      setAtRecyclerDevices(myFacility);

      // 3. Completed recycled devices by me (status = 5)
      const allRecycled = await api.devices({ status: 5 });
      setIssuedCerts(allRecycled.filter((d) => (d.recycler || "").toLowerCase() === address.toLowerCase()));
    } catch (e) {
      console.warn(e.message);
    }
  };

  useEffect(() => {
    loadRecyclerData();
  }, [address]);

  // Step 1: Confirm Receipt & Weigh Package
  const handleConfirmReceipt = async (deviceId) => {
    const grams = Number(weighInputs[deviceId]);
    if (!grams || grams <= 0) {
      setStatusMsg({ ok: false, text: "Received weight must be a positive integer in grams." });
      return;
    }
    setBusy(true);
    setStatusMsg(null);

    const res = await sendTx(signer, "confirmReceipt", [deviceId, grams, `Received and weighed: ${grams}g`]);
    if (res.ok) {
      setStatusMsg({ ok: true, text: `Device #${deviceId} receipt confirmed at ${grams}g!` });
      await loadRecyclerData();
    } else {
      setStatusMsg({ ok: false, text: res.error });
    }
    setBusy(false);
  };

  // Step 2: Generate PDF Certificate, Compute SHA-256, and Submit completeRecycling
  const handleCompleteRecycling = async (dev) => {
    const input = processInputs[dev.id] || {};
    const recovered = Number(input.recovered || 0);
    const residual = Number(input.residual || 0);
    const received = Number(dev.receivedGrams);

    if (recovered + residual !== received) {
      setStatusMsg({
        ok: false,
        text: `Mass balance error: Recovered (${recovered}g) + Residual (${residual}g) = ${recovered + residual}g, but Received weight is ${received}g.`,
      });
      return;
    }

    setBusy(true);
    setStatusMsg(null);

    try {
      // 1. Build PDF Certificate once with jsPDF
      const doc = new jsPDF();
      const certNo = `ECO-CERT-${dev.id}-${Date.now()}`;
      const issueDate = new Date().toISOString();

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
      doc.text(`Certificate Number: ${certNo}`, 20, y); y += 8;
      doc.text(`Device ID: #${dev.id}`, 20, y); y += 8;
      doc.text(`Product Name: ${dev.meta?.name || "Electronic Device"} (${dev.meta?.brand || ""} ${dev.meta?.model || ""})`, 20, y); y += 8;
      doc.text(`Category: ${CATEGORIES[dev.category - 1]}`, 20, y); y += 8;
      doc.text(`Device Owner: ${dev.owner || "Unregistered"}`, 20, y); y += 8;
      doc.text(`Certified Recycler: ${address}`, 20, y); y += 8;
      doc.text(`Issue Timestamp: ${issueDate}`, 20, y); y += 12;

      doc.setFont("helvetica", "bold");
      doc.text("Material Mass-Balance Breakdown:", 20, y); y += 8;
      doc.setFont("helvetica", "normal");
      doc.text(`• Received Gross Weight: ${received} grams`, 25, y); y += 6;
      doc.text(`• Refined Recovered Commodity: ${recovered} grams`, 25, y); y += 6;
      doc.text(`• Safe Residual Waste: ${residual} grams`, 25, y); y += 6;
      doc.text(`• Mathematical Invariant: ${recovered}g + ${residual}g == ${received}g (VERIFIED)`, 25, y); y += 12;

      doc.setFont("helvetica", "bold");
      doc.setTextColor(22, 163, 74);
      doc.text("Green Points Awarded: " + Math.floor(recovered / 100) + " points", 20, y); y += 12;

      doc.setFont("helvetica", "italic");
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(9);
      doc.text("Verify this file authenticity at http://localhost:5173/verify by uploading this unaltered PDF.", 20, y);

      // 2. Get exact PDF bytes and compute SHA-256 hash
      const pdfArrayBuffer = doc.output("arraybuffer");
      const hashBuffer = await crypto.subtle.digest("SHA-256", pdfArrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const certHash = "0x" + hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

      // 3. Call smart contract completeRecycling on chain
      const res = await sendTx(signer, "completeRecycling", [
        dev.id,
        recovered,
        residual,
        certHash,
        `Recycling completed: ${recovered}g recovered, ${residual}g residual`,
      ]);

      if (!res.ok) {
        setStatusMsg({ ok: false, text: res.error });
        setBusy(false);
        return;
      }

      // 4. Upload raw PDF bytes to backend
      const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(pdfArrayBuffer)));
      await api.uploadCertificate(dev.id, {
        filename: `certificate-device-${dev.id}.pdf`,
        base64: base64Pdf,
      });

      setStatusMsg({
        ok: true,
        text: `Device #${dev.id} recycled! Certificate anchored to blockchain with hash ${certHash.slice(0, 10)}…`,
      });

      await loadRecyclerData();
    } catch (e) {
      setStatusMsg({ ok: false, text: e.message });
    }
    setBusy(false);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Certified Recycling Operations Console</h1>
        <p>Confirm material intake, enforce mathematical mass-balance, generate tampering-proof certificates, and award Green Points.</p>
      </div>

      {statusMsg && (
        <div className={`alert ${statusMsg.ok ? "alert-ok" : "alert-err"}`}>
          {statusMsg.text}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ backgroundColor: "#ffedd5", color: "#ea580c" }}><Scale size={24} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Incoming Dispatches</span>
            <span className="kpi-value">{incomingDevices.length}</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ backgroundColor: "#ccfbf1", color: "#0d9488" }}><CheckCircle2 size={24} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Ready for Processing</span>
            <span className="kpi-value">{atRecyclerDevices.length}</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ backgroundColor: "#dcfce7", color: "#16a34a" }}><FileCheck size={24} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Certificates Issued</span>
            <span className="kpi-value">{issuedCerts.length}</span>
          </div>
        </div>
      </div>

      {/* Step 1: Incoming Dispatches (Weigh & Receive) */}
      <div className="card" style={{ marginBottom: 28 }}>
        <h3 className="card-title">1. Incoming In-Transit Shipments (Intake & Weighing)</h3>
        <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px" }}>
          Logistics collectors have dispatched these devices to your facility. Measure gross weight on arrival and confirm intake.
        </p>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Device</th>
                <th>Category</th>
                <th>Intake Weight (Grams)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {incomingDevices.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: "center", color: "#64748b" }}>No incoming shipments en route.</td></tr>
              ) : (
                incomingDevices.map((d) => (
                  <tr key={d.id}>
                    <td><strong>#{d.id}</strong></td>
                    <td>
                      <div><strong>{d.meta?.name || `Device #${d.id}`}</strong></div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{d.meta?.brand} {d.meta?.model}</div>
                    </td>
                    <td>{CATEGORIES[d.category - 1]}</td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        placeholder="Weight in grams (e.g. 1500)"
                        value={weighInputs[d.id] || ""}
                        onChange={(e) => setWeighInputs({ ...weighInputs, [d.id]: e.target.value })}
                        style={{ width: 180 }}
                      />
                    </td>
                    <td>
                      <button className="btn btn-primary" style={{ padding: "6px 12px", fontSize: 13 }} onClick={() => handleConfirmReceipt(d.id)} disabled={busy}>
                        <Scale size={14} /> Confirm Intake & Weigh
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Step 2: Processing & Mass-Balance Certification */}
      <div className="card" style={{ marginBottom: 28 }}>
        <div className="card-header">
          <h3 className="card-title">2. Processing, Mass-Balance Enforcement & Certification</h3>
          <span className="network-chip online"><Sparkles size={14} /> EVM Mass-Balance Active</span>
        </div>
        <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px" }}>
          Enter recovered commodity weight and safe residual waste. The smart contract strictly enforces <code>recovered + residual == received</code>.
        </p>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>ID & Device</th>
                <th>Received</th>
                <th>Recovered (g)</th>
                <th>Residual (g)</th>
                <th>Mass Balance Check</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {atRecyclerDevices.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", color: "#64748b" }}>No devices currently ready for processing.</td></tr>
              ) : (
                atRecyclerDevices.map((d) => {
                  const input = processInputs[d.id] || {};
                  const rec = Number(input.recovered || 0);
                  const res = Number(input.residual || 0);
                  const sum = rec + res;
                  const target = d.receivedGrams;
                  const isMatch = sum === target && target > 0;

                  return (
                    <tr key={d.id}>
                      <td>
                        <strong>#{d.id}</strong> {d.meta?.name}
                        <div style={{ fontSize: 12, color: "#64748b" }}>{d.meta?.brand} {d.meta?.model}</div>
                      </td>
                      <td><strong>{target}g</strong></td>
                      <td>
                        <input
                          type="number"
                          placeholder="Recovered"
                          value={input.recovered || ""}
                          onChange={(e) => setProcessInputs({ ...processInputs, [d.id]: { ...input, recovered: e.target.value } })}
                          style={{ width: 110 }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          placeholder="Residual"
                          value={input.residual || ""}
                          onChange={(e) => setProcessInputs({ ...processInputs, [d.id]: { ...input, residual: e.target.value } })}
                          style={{ width: 110 }}
                        />
                      </td>
                      <td>
                        {sum === 0 ? (
                          <span style={{ fontSize: 12, color: "#64748b" }}>Enter weights</span>
                        ) : isMatch ? (
                          <span className="status-chip status-5" style={{ display: "inline-flex", gap: 4 }}>
                            <CheckCircle2 size={13} /> Balanced: {sum}g == {target}g
                          </span>
                        ) : (
                          <span className="status-chip status-1" style={{ display: "inline-flex", gap: 4, color: "#b91c1c", background: "#fee2e2" }}>
                            <AlertTriangle size={13} /> Mismatch: {sum}g ≠ {target}g
                          </span>
                        )}
                      </td>
                      <td>
                        <button
                          className="btn btn-primary"
                          style={{ padding: "6px 12px", fontSize: 13 }}
                          onClick={() => handleCompleteRecycling(d)}
                          disabled={busy || !isMatch}
                        >
                          Generate & Certify
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issued Certificates */}
      <div className="card">
        <h3 className="card-title" style={{ marginBottom: 14 }}>Issued Recycling Certificates</h3>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Device ID</th>
                <th>Recovered Commodity</th>
                <th>Certificate SHA-256 Fingerprint</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {issuedCerts.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: "center", color: "#64748b" }}>No certificates issued yet.</td></tr>
              ) : (
                issuedCerts.map((d) => (
                  <tr key={d.id}>
                    <td><strong>Device #{d.id}</strong></td>
                    <td>{d.recovered_grams} grams</td>
                    <td style={{ fontFamily: "monospace", fontSize: 12 }}>{shortAddr(d.certificate_hash)}</td>
                    <td>
                      <a href={`http://localhost:4000/api/certificates/${d.id}`} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: "4px 10px", fontSize: 12, textDecoration: "none" }}>
                        <Download size={13} /> Download PDF
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
