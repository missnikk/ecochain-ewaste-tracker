import React, { useEffect, useState } from "react";
import { useWallet } from "../wallet";
import { readContract, sendTx, ROLE, shortAddr } from "../services/chain";
import { api } from "../services/api";
import { ShieldAlert, ShieldCheck, PauseCircle, PlayCircle, Users, Activity } from "lucide-react";

export default function RegulatorPortal() {
  const { signer, address, role } = useWallet();
  const [paused, setPaused] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [events, setEvents] = useState([]);
  const [statusMsg, setStatusMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  // Manual assign form
  const [assignAddr, setAssignAddr] = useState("");
  const [assignRoleNum, setAssignRoleNum] = useState(2);

  const loadData = async () => {
    try {
      const c = readContract();
      setPaused(await c.paused());
      const p = await api.participants();
      setParticipants(p);
      const ev = await api.events(30);
      setEvents(ev);
    } catch (e) {
      console.warn(e.message);
    }
  };

  useEffect(() => {
    loadData();
    const t = setInterval(loadData, 5000);
    return () => clearInterval(t);
  }, []);

  const handleTogglePause = async () => {
    setBusy(true);
    setStatusMsg(null);
    const res = await sendTx(signer, "setPaused", [!paused]);
    if (res.ok) {
      setStatusMsg({ ok: true, text: `System ${!paused ? "Paused" : "Unpaused"} successfully` });
      setPaused(!paused);
    } else {
      setStatusMsg({ ok: false, text: res.error });
    }
    setBusy(false);
  };

  const handleToggleSuspend = async (accAddr, currentSuspended) => {
    setBusy(true);
    setStatusMsg(null);
    const res = await sendTx(signer, "setSuspended", [accAddr, !currentSuspended]);
    if (res.ok) {
      setStatusMsg({ ok: true, text: `Account ${shortAddr(accAddr)} ${!currentSuspended ? "suspended" : "reinstated"}` });
      await loadData();
    } else {
      setStatusMsg({ ok: false, text: res.error });
    }
    setBusy(false);
  };

  const handleAssignRole = async (e) => {
    e.preventDefault();
    if (!assignAddr) return;
    setBusy(true);
    setStatusMsg(null);
    const res = await sendTx(signer, "assignRole", [assignAddr.trim(), Number(assignRoleNum)]);
    if (res.ok) {
      setStatusMsg({ ok: true, text: `Role ${ROLE[assignRoleNum]} assigned to ${shortAddr(assignAddr)}` });
      setAssignAddr("");
      await loadData();
    } else {
      setStatusMsg({ ok: false, text: res.error });
    }
    setBusy(false);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Regulator Governance Console</h1>
        <p>Ecosystem surveillance, participant compliance, suspension authority, and circuit-breaker controls.</p>
      </div>

      {statusMsg && (
        <div className={`alert ${statusMsg.ok ? "alert-ok" : "alert-err"}`}>
          {statusMsg.text}
        </div>
      )}

      {/* Emergency System Control */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Emergency Circuit Breaker</h3>
          <span className={`network-chip ${paused ? "offline" : "online"}`}>
            System Status: {paused ? "PAUSED" : "OPERATIONAL"}
          </span>
        </div>
        <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 16px" }}>
          Pausing halts all state-changing transactions across all stakeholder portals immediately.
        </p>
        <button
          className={`btn ${paused ? "btn-primary" : "btn-danger"}`}
          onClick={handleTogglePause}
          disabled={busy}
        >
          {paused ? <PlayCircle size={18} /> : <PauseCircle size={18} />}
          {paused ? "Resume System Operations" : "Halt System (Emergency Pause)"}
        </button>
      </div>

      {/* Participants & Suspensions */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Authorized Ecosystem Participants</h3>
          <span className="role-badge Admin"><Users size={14} /> {participants.length} Detected</span>
        </div>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Wallet Address</th>
                <th>Assigned Role</th>
                <th>Status</th>
                <th>Updated Block</th>
                <th>Governance Action</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((p) => {
                const isSelf = p.address.toLowerCase() === (address || "").toLowerCase();
                return (
                  <tr key={p.address}>
                    <td style={{ fontFamily: "monospace", fontSize: 13 }}>{p.address}</td>
                    <td><span className={`role-badge ${ROLE[p.role]}`}>{ROLE[p.role] || "None"}</span></td>
                    <td>
                      {p.suspended ? (
                        <span className="status-chip status-3">Suspended</span>
                      ) : (
                        <span className="status-chip status-5">Active</span>
                      )}
                    </td>
                    <td>Block #{p.updated_block}</td>
                    <td>
                      {!isSelf && (
                        <button
                          className={`btn ${p.suspended ? "btn-primary" : "btn-secondary"}`}
                          style={{ padding: "4px 10px", fontSize: 12 }}
                          onClick={() => handleToggleSuspend(p.address, p.suspended)}
                          disabled={busy}
                        >
                          {p.suspended ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                          {p.suspended ? "Reinstate" : "Suspend"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Role Assignment */}
      <div className="card">
        <h3 className="card-title" style={{ marginBottom: 12 }}>Administrative Role Override</h3>
        <form onSubmit={handleAssignRole} style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div className="form-group" style={{ flex: 1, minWidth: 280, margin: 0 }}>
            <label>Target Account Address</label>
            <input
              type="text"
              placeholder="0x..."
              value={assignAddr}
              onChange={(e) => setAssignAddr(e.target.value)}
              required
            />
          </div>
          <div className="form-group" style={{ width: 180, margin: 0 }}>
            <label>Designated Role</label>
            <select value={assignRoleNum} onChange={(e) => setAssignRoleNum(e.target.value)}>
              <option value={0}>0 - None (Revoke)</option>
              <option value={2}>2 - Producer</option>
              <option value={3}>3 - Consumer</option>
              <option value={4}>4 - Collector</option>
              <option value={5}>5 - Recycler</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            Assign Role Override
          </button>
        </form>
      </div>

      {/* Audit Trail */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent On-Chain Activity Audit Feed</h3>
          <span className="network-chip online"><Activity size={14} /> Live Logs</span>
        </div>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Event</th>
                <th>Device ID</th>
                <th>Actor</th>
                <th>Block</th>
                <th>Tx Hash</th>
              </tr>
            </thead>
            <tbody>
              {events.slice(0, 10).map((ev) => (
                <tr key={ev.id}>
                  <td><strong>{ev.name}</strong></td>
                  <td>{ev.device_id ? `#${ev.device_id}` : "—"}</td>
                  <td style={{ fontFamily: "monospace", fontSize: 12 }}>{shortAddr(ev.actor)}</td>
                  <td>#{ev.block}</td>
                  <td style={{ fontFamily: "monospace", fontSize: 12 }}>
                    <a href={`#`} onClick={(e) => e.preventDefault()} style={{ color: "#0ea5e9" }}>
                      {shortAddr(ev.tx_hash)}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
