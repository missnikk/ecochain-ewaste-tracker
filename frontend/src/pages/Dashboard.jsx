import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { readContract, STATUS, CATEGORIES, shortAddr } from "../services/chain";
import { api } from "../services/api";
import {
  Layers,
  Recycle,
  Scale,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Activity,
  Award,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Clock,
  Building,
  Check,
  Copy
} from "lucide-react";

const STAGE_COLORS = [
  "#3b82f6", // 0: Registered (Blue)
  "#f59e0b", // 1: Pickup requested (Amber)
  "#a855f7", // 2: Collected (Purple)
  "#f97316", // 3: In transit (Orange)
  "#14b8a6", // 4: At recycler (Teal)
  "#16a34a", // 5: Recycled (Green)
];

export default function Dashboard() {
  const [chainStats, setChainStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [backendUp, setBackendUp] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedTx, setCopiedTx] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    // 1. Load directly from Smart Contract
    try {
      const c = readContract();
      const count = Number(await c.deviceCount());
      const byStatusPromises = [0, 1, 2, 3, 4, 5].map((i) => c.statusCount(i));
      const byStatusRaw = await Promise.all(byStatusPromises);
      const byStatus = byStatusRaw.map(Number);
      const grams = Number(await c.totalRecoveredGrams());
      let redeemedPoints = 0;
      try {
        redeemedPoints = Number(await c.totalPointsRedeemed());
      } catch {}

      const recycledCount = byStatus[5] || 0;
      const rate = count > 0 ? Math.round((recycledCount / count) * 100) : 0;
      const pointsIssued = Math.floor(grams / 100);

      setChainStats({
        deviceCount: count,
        byStatus,
        recycledCount,
        recycledRate: rate,
        recoveredGrams: grams,
        recoveredKg: (grams / 1000).toFixed(2),
        pointsIssued,
        pointsRedeemed: redeemedPoints,
      });
    } catch (err) {
      console.error("Chain read error:", err);
      setError("Cannot connect to local blockchain. Ensure node is running (npm run chain).");
    }

    // 2. Load from Backend Analytics (if available)
    try {
      const res = await api.analytics();
      if (res && res.ok && res.data) {
        setAnalytics(res.data);
        setBackendUp(true);
      } else {
        setBackendUp(false);
      }
    } catch {
      setBackendUp(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 8000);
    return () => clearInterval(interval);
  }, []);

  const copyTx = (tx) => {
    if (tx) {
      navigator.clipboard.writeText(tx);
      setCopiedTx(tx);
      setTimeout(() => setCopiedTx(null), 2000);
    }
  };

  // Prepare data for Donut Chart
  const statusCounts = chainStats ? chainStats.byStatus : [0, 0, 0, 0, 0, 0];
  const totalCount = chainStats ? chainStats.deviceCount : 0;
  const radius = 65;
  const circumference = 2 * Math.PI * radius;
  let accumulatedOffset = 0;

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: "0 0 6px" }}>Public Network Dashboard</h1>
          <p style={{ color: "var(--text-muted)", margin: 0 }}>
            Real-time on-chain metrics, material recovery telemetry, and circular lifecycle audit trail.
          </p>
        </div>
        <button
          className="btn btn-outline"
          onClick={loadData}
          disabled={loading}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}
        >
          <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh Telemetry
        </button>
      </div>

      {!backendUp && (
        <div style={{ marginBottom: 20, padding: 12, borderRadius: 8, background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
          <AlertTriangle size={18} color="#d97706" />
          <span>
            <strong>Offline Notice:</strong> Backend SQLite indexer is offline. Top KPI cards, Donut chart, and Pipeline strip are running live from the Ethereum smart contract. Category and daily trends will resume when backend restarts.
          </span>
        </div>
      )}

      {error && (
        <div style={{ marginBottom: 20, padding: 14, borderRadius: 8, background: "#fef2f2", color: "var(--danger)", border: "1px solid #fecaca" }}>
          <AlertTriangle size={18} style={{ display: "inline", verticalAlign: "middle", marginRight: 8 }} />
          {error}
        </div>
      )}

      {/* TOP ROW: KPI CARDS */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="kpi-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span className="kpi-label">Devices Registered</span>
            <div style={{ background: "#e0f2fe", padding: 6, borderRadius: 8 }}>
              <Layers size={18} color="#0284c7" />
            </div>
          </div>
          <div className="kpi-value">{chainStats ? chainStats.deviceCount : "—"}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
            Total unique e-waste assets tracked
          </div>
        </div>

        <div className="kpi-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span className="kpi-label">Recycling Rate</span>
            <div style={{ background: "#dcfce7", padding: 6, borderRadius: 8 }}>
              <Recycle size={18} color="#16a34a" />
            </div>
          </div>
          <div className="kpi-value">
            {chainStats ? `${chainStats.recycledRate}%` : "—"}
          </div>
          <div style={{ fontSize: 12, color: "#16a34a", marginTop: 4 }}>
            {chainStats ? `${chainStats.recycledCount} of ${chainStats.deviceCount} recycled` : "Pending data"}
          </div>
        </div>

        <div className="kpi-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span className="kpi-label">Material Recovered</span>
            <div style={{ background: "#ccfbf1", padding: 6, borderRadius: 8 }}>
              <Scale size={18} color="#0f766e" />
            </div>
          </div>
          <div className="kpi-value">
            {chainStats ? `${chainStats.recoveredKg} kg` : "—"}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
            {chainStats ? `${chainStats.recoveredGrams.toLocaleString()} grams verified` : "On-chain mass balance"}
          </div>
        </div>

        <div className="kpi-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span className="kpi-label">Green Points Issued</span>
            <div style={{ background: "#fef3c7", padding: 6, borderRadius: 8 }}>
              <Sparkles size={18} color="#d97706" />
            </div>
          </div>
          <div className="kpi-value">
            {chainStats ? chainStats.pointsIssued : "—"}
          </div>
          <div style={{ fontSize: 12, color: "#d97706", marginTop: 4 }}>
            {chainStats ? `${chainStats.pointsRedeemed} pts redeemed with producers` : "1 pt per 100g recovered"}
          </div>
        </div>
      </div>

      {/* PIPELINE STRIP */}
      <div className="card" style={{ marginBottom: 24, padding: "20px 24px" }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <TrendingUp size={18} color="var(--primary)" /> E-Waste Lifecycle Pipeline
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
          {STATUS.map((name, idx) => {
            const count = statusCounts[idx] || 0;
            const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
            return (
              <div
                key={name}
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderTop: `4px solid ${STAGE_COLORS[idx]}`,
                  borderRadius: 8,
                  padding: "12px 14px",
                }}
              >
                <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                  Stage {idx}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", margin: "4px 0" }}>
                  {name}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 8 }}>
                  <span style={{ fontSize: 20, fontWeight: 700, color: STAGE_COLORS[idx] }}>{count}</span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TWO COLUMN GRID: DONUT CHART + CATEGORY BAR CHART */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(440px, 1fr))", gap: 24, marginBottom: 24 }}>
        {/* DONUT CHART */}
        <div className="card">
          <h3 style={{ margin: "0 0 16px", fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <Activity size={18} color="var(--primary)" /> Stage Distribution (On-Chain)
          </h3>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", flexWrap: "wrap", gap: 20 }}>
            {/* SVG Donut */}
            <div style={{ position: "relative", width: 170, height: 170 }}>
              <svg viewBox="0 0 170 170" width="170" height="170">
                <circle
                  cx="85"
                  cy="85"
                  r={radius}
                  fill="transparent"
                  stroke="#e2e8f0"
                  strokeWidth="20"
                />
                {totalCount > 0 &&
                  STATUS.map((name, idx) => {
                    const count = statusCounts[idx] || 0;
                    if (count === 0) return null;
                    const strokeDash = (count / totalCount) * circumference;
                    const strokeOffset = -accumulatedOffset;
                    accumulatedOffset += strokeDash;
                    return (
                      <circle
                        key={name}
                        cx="85"
                        cy="85"
                        r={radius}
                        fill="transparent"
                        stroke={STAGE_COLORS[idx]}
                        strokeWidth="20"
                        strokeDasharray={`${strokeDash} ${circumference}`}
                        strokeDashoffset={strokeOffset}
                        transform="rotate(-90 85 85)"
                        style={{ transition: "all 0.5s ease" }}
                      />
                    );
                  })}
              </svg>
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  pointerEvents: "none",
                }}
              >
                <span style={{ fontSize: 24, fontWeight: 700, color: "var(--text)" }}>{totalCount}</span>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Devices</span>
              </div>
            </div>

            {/* Legend */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13, minWidth: 180 }}>
              {STATUS.map((name, idx) => {
                const count = statusCounts[idx] || 0;
                const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
                return (
                  <div key={name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: STAGE_COLORS[idx] }}></span>
                      <span>{name}</span>
                    </div>
                    <strong>{count} <span style={{ color: "var(--text-muted)", fontSize: 11 }}>({pct}%)</span></strong>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CATEGORY BAR CHART */}
        <div className="card">
          <h3 style={{ margin: "0 0 16px", fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <Layers size={18} color="var(--primary)" /> Devices by Category
          </h3>
          {analytics && analytics.byCategory ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {analytics.byCategory.map((cat) => {
                const maxCount = Math.max(1, ...analytics.byCategory.map((c) => c.count));
                const barWidth = Math.max(3, Math.round((cat.count / maxCount) * 100));
                return (
                  <div key={cat.category}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                      <span style={{ fontWeight: 500 }}>{cat.name} ({cat.code})</span>
                      <strong>{cat.count}</strong>
                    </div>
                    <div style={{ background: "#e2e8f0", height: 10, borderRadius: 5, overflow: "hidden" }}>
                      <div
                        style={{
                          background: "#0284c7",
                          width: `${barWidth}%`,
                          height: "100%",
                          borderRadius: 5,
                          transition: "width 0.4s ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px 20px", fontSize: 13 }}>
              Category breakdown is populated from off-chain metadata indexed in SQLite.
              <br />
              (Available when backend is running)
            </div>
          )}
        </div>
      </div>

      {/* TWO COLUMN GRID: DAILY TRENDS + TOP RECYCLERS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(440px, 1fr))", gap: 24, marginBottom: 24 }}>
        {/* DAILY TRENDS CHART */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <TrendingUp size={18} color="var(--primary)" /> Daily Activity Trends
            </h3>
            <div style={{ display: "flex", gap: 14, fontSize: 12 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#0284c7" }}></span> Registered
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a" }}></span> Recycled
              </span>
            </div>
          </div>

          {analytics && analytics.perDay && analytics.perDay.registered ? (
            <div>
              {/* Daily Bars/Timeline */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {analytics.perDay.registered.map((item, idx) => {
                  const regCount = item.count;
                  const recObj = analytics.perDay.recycled.find((r) => r.day === item.day);
                  const recCount = recObj ? recObj.count : 0;
                  return (
                    <div key={item.day} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13 }}>
                      <span style={{ width: 90, color: "var(--text-muted)", fontFamily: "monospace", fontSize: 12 }}>
                        {item.day}
                      </span>
                      <div style={{ flex: 1, display: "flex", gap: 6, alignItems: "center" }}>
                        <div style={{ flex: 1, background: "#e2e8f0", height: 16, borderRadius: 4, display: "flex", overflow: "hidden" }}>
                          <div style={{ width: `${regCount * 25}%`, background: "#0284c7", color: "#fff", fontSize: 10, textAlign: "center", lineHeight: "16px", minWidth: regCount > 0 ? 16 : 0 }}>
                            {regCount > 0 ? regCount : ""}
                          </div>
                          <div style={{ width: `${recCount * 25}%`, background: "#16a34a", color: "#fff", fontSize: 10, textAlign: "center", lineHeight: "16px", minWidth: recCount > 0 ? 16 : 0 }}>
                            {recCount > 0 ? recCount : ""}
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, width: 80, textAlign: "right" }}>
                        {regCount} reg / {recCount} rec
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px 20px", fontSize: 13 }}>
              Daily timeline is populated by indexed blockchain timestamps.
            </div>
          )}
        </div>

        {/* TOP RECYCLERS */}
        <div className="card">
          <h3 style={{ margin: "0 0 16px", fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <Award size={18} color="#f59e0b" /> Top Recyclers Leaderboard
          </h3>

          {analytics && analytics.topRecyclers && analytics.topRecyclers.length > 0 ? (
            <div className="table-responsive">
              <table style={{ width: "100%", fontSize: 13 }}>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Recycler Address</th>
                    <th>Recovered</th>
                    <th>Certificates</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.topRecyclers.map((r, i) => (
                    <tr key={r.recycler}>
                      <td>
                        <span style={{ fontWeight: 700, color: i === 0 ? "#d97706" : "var(--text)" }}>
                          #{i + 1}
                        </span>
                      </td>
                      <td>
                        <code style={{ fontSize: 12 }}>{shortAddr(r.recycler)}</code>
                      </td>
                      <td>
                        <strong>{(r.recovered_grams / 1000).toFixed(2)} kg</strong>
                      </td>
                      <td>
                        <span className="badge badge-recycler">{r.count} issued</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px 20px", fontSize: 13 }}>
              Leaderboard updates as licensed recyclers anchor certificates on-chain.
            </div>
          )}
        </div>
      </div>

      {/* RECENT ACTIVITY AUDIT TRAIL */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <Clock size={18} color="var(--primary)" /> Real-Time Blockchain Activity Feed
          </h3>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Last 10 indexed block events</span>
        </div>

        {analytics && analytics.recentActivity && analytics.recentActivity.length > 0 ? (
          <div className="table-responsive">
            <table style={{ width: "100%", fontSize: 13 }}>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Device</th>
                  <th>Actor</th>
                  <th>Timestamp</th>
                  <th>Transaction Hash</th>
                </tr>
              </thead>
              <tbody>
                {analytics.recentActivity.map((ev) => (
                  <tr key={ev.id}>
                    <td>
                      <span className="badge badge-admin">{ev.name}</span>
                    </td>
                    <td>
                      <Link to={`/track?id=${ev.device_id}`} style={{ fontWeight: 600, color: "#0284c7" }}>
                        #{ev.device_id}
                      </Link>
                    </td>
                    <td>
                      <code style={{ fontSize: 12 }}>{shortAddr(ev.actor)}</code>
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: 12 }}>
                      {new Date(ev.ts * 1000).toLocaleTimeString()}
                    </td>
                    <td>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <code style={{ fontSize: 11 }}>{ev.tx_hash.slice(0, 10)}...</code>
                        <button
                          className="copy-btn"
                          onClick={() => copyTx(ev.tx_hash)}
                          title="Copy full transaction hash"
                        >
                          {copiedTx === ev.tx_hash ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "30px 20px", fontSize: 13 }}>
            Activity stream is indexed from Ethereum event logs.
          </div>
        )}
      </div>
    </div>
  );
}
