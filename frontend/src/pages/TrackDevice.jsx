import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { readContract, fetchHistory, friendlyError, CATEGORIES, STATUS, shortAddr } from "../services/chain";
import { metadataHash } from "../services/hash";
import { api } from "../services/api";
import { StatusBadge, ErrorNote } from "../ui";
import { Search, Download, FileCheck, CheckCircle2, AlertTriangle, Clock, ArrowRight } from "lucide-react";

const ZERO = "0x" + "0".repeat(64);

export default function TrackDevice() {
  const [searchParams] = useSearchParams();
  const [id, setId] = useState(searchParams.get("id") || "");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDevice = async (devId) => {
    if (!devId) return;
    setError(null);
    setData(null);
    setLoading(true);
    try {
      const n = Number(devId);
      const d = await readContract().getDevice(n);
      const history = await fetchHistory(n);
      let meta = null;
      let integrity = { state: "unknown", note: "No off-chain details available (backend offline or none saved)." };

      try {
        const r = await api.device(n);
        if (r && r.ok && r.data && r.data.meta) {
          meta = r.data.meta;
          const hash = await metadataHash(meta);
          integrity =
            hash.toLowerCase() === String(d.metaHash).toLowerCase()
              ? { state: "ok", note: "Off-chain metadata matches the hash permanently anchored on the blockchain." }
              : { state: "bad", note: "MISMATCH: Off-chain metadata was modified after registration." };
        }
      } catch {
        // Backend offline graceful fallback
      }

      setData({ d, history, meta, integrity, id: n });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const paramId = searchParams.get("id");
    if (paramId) {
      setId(paramId);
      fetchDevice(paramId);
    }
  }, [searchParams]);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchDevice(id);
  };

  return (
    <div>
      <div className="page-header">
        <h1>Public Device Tracker</h1>
        <p style={{ color: "var(--text-muted)", margin: 0 }}>
          Verify the end-to-end custody chain, state transitions, and metadata integrity for any registered e-waste asset.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <input
              type="number"
              min="1"
              placeholder="Enter Device ID (e.g. 1, 2, 3...)"
              value={id}
              onChange={(e) => setId(e.target.value)}
              required
              style={{ width: "100%", padding: "10px 14px", fontSize: 15 }}
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Search size={16} /> {loading ? "Searching Chain..." : "Track Device"}
          </button>
        </form>
        {error && <div style={{ marginTop: 12 }}><ErrorNote text={error} /></div>}
      </div>

      {data && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Main Info Card */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: "0 0 4px", fontSize: 22 }}>
                  Device #{data.id}: {data.meta?.name || "Electronic Asset"}
                </h2>
                <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
                  Category: <strong>{CATEGORIES[Number(data.d.category) - 1] || "General"}</strong>
                </div>
              </div>
              <div>
                <StatusBadge status={Number(data.d.status)} />
              </div>
            </div>

            {/* Facts Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, background: "#f8fafc", padding: 16, borderRadius: 8, border: "1px solid #e2e8f0" }}>
              <div>
                <span style={{ fontSize: 12, color: "var(--text-muted)", display: "block" }}>Producer</span>
                <code style={{ fontSize: 13 }}>{shortAddr(data.d.producer)}</code>
              </div>
              <div>
                <span style={{ fontSize: 12, color: "var(--text-muted)", display: "block" }}>Consumer Owner</span>
                <code style={{ fontSize: 13 }}>{shortAddr(data.d.owner) || "Unclaimed"}</code>
              </div>
              <div>
                <span style={{ fontSize: 12, color: "var(--text-muted)", display: "block" }}>Current Custodian</span>
                <code style={{ fontSize: 13 }}>{shortAddr(data.d.custodian)}</code>
              </div>
              <div>
                <span style={{ fontSize: 12, color: "var(--text-muted)", display: "block" }}>Mass Balance Breakdown</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>
                  {Number(data.d.receivedGrams)}g in = {Number(data.d.recoveredGrams)}g recov + {Number(data.d.residualGrams)}g resid
                </span>
              </div>
            </div>

            {/* Metadata Integrity Card */}
            <div style={{ marginTop: 16, padding: 14, borderRadius: 8, border: "1px solid", borderColor: data.integrity.state === "ok" ? "#86efac" : data.integrity.state === "bad" ? "#fca5a5" : "#cbd5e1", background: data.integrity.state === "ok" ? "#f0fdf4" : data.integrity.state === "bad" ? "#fef2f2" : "#f8fafc" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 14, color: data.integrity.state === "ok" ? "#166534" : data.integrity.state === "bad" ? "#991b1b" : "var(--text)" }}>
                {data.integrity.state === "ok" ? <CheckCircle2 size={18} color="#16a34a" /> : <AlertTriangle size={18} color="var(--danger)" />}
                Metadata Integrity: {data.integrity.note}
              </div>
              {data.meta && (
                <div style={{ marginTop: 6, fontSize: 13, color: "var(--text-muted)" }}>
                  Registered Details: {data.meta.brand} {data.meta.model} {data.meta.serial ? `(Serial: ${data.meta.serial})` : ""}
                </div>
              )}
            </div>

            {/* Certificate Section if Recycled */}
            {data.d.certificateHash && data.d.certificateHash !== ZERO && (
              <div style={{ marginTop: 16, padding: 16, borderRadius: 8, background: "#ecfdf5", border: "1px solid #6ee7b7" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <h3 style={{ margin: "0 0 4px", fontSize: 16, color: "#065f46", display: "flex", alignItems: "center", gap: 6 }}>
                      <FileCheck size={18} /> Official Recycling Certificate Anchored
                    </h3>
                    <code style={{ fontSize: 12, color: "#047857" }}>{data.d.certificateHash}</code>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <a
                      href={api.certificateUrl(data.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-primary"
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}
                    >
                      <Download size={14} /> Download Certificate PDF
                    </a>
                    <Link
                      to="/verify"
                      className="btn btn-outline"
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}
                    >
                      Verify PDF <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* History Timeline */}
          <div className="card">
            <h3 style={{ margin: "0 0 16px", fontSize: 18, display: "flex", alignItems: "center", gap: 8 }}>
              <Clock size={18} /> Immutable Blockchain Audit Trail
            </h3>
            <ol className="timeline">
              {data.history.map((h, i) => (
                <li key={i}>
                  <strong>{STATUS[h.status]}</strong> · Actor: <code>{shortAddr(h.actor)}</code> · {new Date(h.timestamp * 1000).toLocaleString()}
                  {h.note ? <div style={{ color: "var(--text-muted)", marginTop: 2 }}>Note: "{h.note}"</div> : null}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
