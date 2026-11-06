import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import {
  WalletProvider,
  useWallet,
  ROLES,
  ROLE_NAMES,
  ROLE_BADGES,
  shortAddress
} from "./wallet";
import { api } from "./services/api";
import { contractAddress } from "./services/chain";

// Pages
import Landing from "./pages/Landing";
import RegulatorPortal from "./pages/RegulatorPortal";
import ProducerPortal from "./pages/ProducerPortal";
import ConsumerPortal from "./pages/ConsumerPortal";
import CollectorPortal from "./pages/CollectorPortal";
import RecyclerPortal from "./pages/RecyclerPortal";
import Dashboard from "./pages/Dashboard";
import TrackDevice from "./pages/TrackDevice";
import VerifyCertificate from "./pages/VerifyCertificate";

// Lucide Icons
import {
  ShieldCheck,
  Factory,
  User,
  Truck,
  Wrench,
  LayoutDashboard,
  Search,
  FileCheck,
  Check,
  Copy,
  LogOut,
  Wallet,
  AlertTriangle,
  ExternalLink,
  Layers,
  Sparkles,
  ArrowRight,
  ArrowLeftRight
} from "lucide-react";

const DEMO_ACCOUNT_BY_ROLE = {
  [ROLES.Admin]: 0,
  [ROLES.Producer]: 1,
  [ROLES.Consumer]: 2,
  [ROLES.Collector]: 3,
  [ROLES.Recycler]: 4,
};

function RouteGuard({ requiredRole, roleName, children }) {
  const { address, role, suspended, connectDemo, connectMetaMask } = useWallet();
  const navigate = useNavigate();

  if (!address) {
    return (
      <div className="card" style={{ maxWidth: 600, margin: "40px auto", textAlign: "center", padding: "36px 24px" }}>
        <Wallet size={48} color="#0ea5e9" style={{ margin: "0 auto 16px" }} />
        <h2>Wallet Connection Required</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>
          The <strong>{roleName} Portal</strong> requires an active wallet connection on the EcoChain network.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn btn-primary" onClick={() => connectDemo(DEMO_ACCOUNT_BY_ROLE[requiredRole] ?? 0)}>
            Switch to {roleName} (Demo Account)
          </button>
          <button className="btn btn-secondary" onClick={connectMetaMask}>
            Connect MetaMask
          </button>
          <button className="btn btn-outline" onClick={() => navigate("/")}>
            Go to Landing Page
          </button>
        </div>
      </div>
    );
  }

  if (suspended) {
    return (
      <div className="card" style={{ maxWidth: 600, margin: "40px auto", textAlign: "center", padding: "36px 24px", borderColor: "var(--danger)" }}>
        <AlertTriangle size={48} color="var(--danger)" style={{ margin: "0 auto 16px" }} />
        <h2 style={{ color: "var(--danger)" }}>Account Suspended</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>
          Wallet <code>{address}</code> has been suspended by the EcoChain Regulator.
        </p>
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
          All state-modifying actions are blocked by the smart contract while suspended.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 20 }}>
          <button className="btn btn-primary" onClick={() => connectDemo(0)}>
            Switch to Regulator (Demo #0) to Reinstate
          </button>
          <button className="btn btn-outline" onClick={() => navigate("/")}>
            Return to Landing
          </button>
        </div>
      </div>
    );
  }

  if (role !== requiredRole) {
    const currentRoleName = ROLE_NAMES[role] || "Unregistered";
    const recommendedDemoIndex = DEMO_ACCOUNT_BY_ROLE[requiredRole] ?? 0;

    return (
      <div className="card" style={{ maxWidth: 640, margin: "40px auto", padding: "32px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <AlertTriangle color="var(--warning)" size={32} />
          <h2 style={{ margin: 0 }}>Role Access Mismatch</h2>
        </div>
        <p style={{ marginBottom: 16, color: "var(--text)" }}>
          You are currently acting as <span className={`badge ${ROLE_BADGES[role]}`}>{currentRoleName}</span> with wallet:
          <br />
          <code style={{ fontSize: 13, background: "#e2e8f0", padding: "3px 8px", borderRadius: 4, display: "inline-block", marginTop: 6 }}>
            {address}
          </code>
        </p>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
          This portal requires the <strong>{roleName}</strong> role. The smart contract validates permissions on-chain.
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap", alignItems: "center" }}>
          <button
            className="btn btn-primary"
            onClick={() => connectDemo(recommendedDemoIndex)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <ArrowLeftRight size={15} /> Switch to {roleName} (Demo #{recommendedDemoIndex})
          </button>

          {role === ROLES.Admin && <Link to="/regulator" className="btn btn-secondary">Go to Regulator Portal</Link>}
          {role === ROLES.Producer && <Link to="/producer" className="btn btn-secondary">Go to Producer Portal</Link>}
          {role === ROLES.Consumer && <Link to="/consumer" className="btn btn-secondary">Go to Consumer Portal</Link>}
          {role === ROLES.Collector && <Link to="/collector" className="btn btn-secondary">Go to Collector Portal</Link>}
          {role === ROLES.Recycler && <Link to="/recycler" className="btn btn-secondary">Go to Recycler Portal</Link>}
          {role === ROLES.None && <Link to="/" className="btn btn-secondary">Register on Landing</Link>}

          <button className="btn btn-outline" onClick={() => navigate("/")}>
            Choose Another Account
          </button>
        </div>
      </div>
    );
  }

  return children;
}

function AppShell() {
  const {
    kind,
    demoIndex,
    address,
    role,
    suspended,
    disconnect,
    connectDemo,
    connectMetaMask
  } = useWallet();

  const [copied, setCopied] = useState(false);
  const [backendUp, setBackendUp] = useState(true);

  useEffect(() => {
    let alive = true;
    const check = async () => {
      try {
        const r = await api.health();
        if (alive) setBackendUp(r.ok);
      } catch {
        if (alive) setBackendUp(false);
      }
    };
    check();
    const interval = setInterval(check, 6000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, []);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const currentSelectValue = kind === "demo" ? String(demoIndex ?? 0) : kind === "metamask" ? "metamask" : "0";

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div style={{ background: "rgba(255,255,255,0.15)", padding: 6, borderRadius: 8, display: "flex" }}>
            <Layers size={22} color="#4ade80" />
          </div>
          <div>
            <Link to="/" className="brand-title">EcoChain</Link>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>V2 Lifecycle Tracker</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Public Views</div>
          <NavLink to="/" end className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
            <Sparkles size={16} /> Home / Role Chooser
          </NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
            <LayoutDashboard size={16} /> Dashboard
          </NavLink>
          <NavLink to="/track" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
            <Search size={16} /> Track Device
          </NavLink>
          <NavLink to="/verify" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
            <FileCheck size={16} /> Verify Certificate
          </NavLink>

          <div className="nav-section-title" style={{ marginTop: 16 }}>Role Portals</div>
          <NavLink to="/regulator" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
            <ShieldCheck size={16} /> Regulator Portal
          </NavLink>
          <NavLink to="/producer" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
            <Factory size={16} /> Producer Portal
          </NavLink>
          <NavLink to="/consumer" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
            <User size={16} /> Consumer Portal
          </NavLink>
          <NavLink to="/collector" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
            <Truck size={16} /> Collector Portal
          </NavLink>
          <NavLink to="/recycler" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
            <Wrench size={16} /> Recycler Portal
          </NavLink>
        </nav>

        {/* Sidebar Footer info */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.1)", fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span>Network:</span>
            <span style={{ color: "#4ade80", fontWeight: 600 }}>Local (31337)</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span>Contract:</span>
            <span style={{ fontFamily: "monospace" }}>{contractAddress ? contractAddress.slice(0, 6) + "..." + contractAddress.slice(-4) : "Loaded"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: backendUp ? "#4ade80" : "#f87171" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: backendUp ? "#4ade80" : "#f87171", display: "inline-block" }}></span>
            <span>{backendUp ? "Backend Synced" : "Backend Offline (Chain OK)"}</span>
          </div>
        </div>
      </aside>

      {/* Main Wrapper */}
      <div className="main-wrapper">
        {/* Top Bar */}
        <header className="topbar">
          <div className="topbar-left" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="network-chip online">
              EcoChain Local (31337)
            </span>
            {!backendUp && (
              <span style={{ fontSize: 12, color: "var(--danger)", display: "flex", alignItems: "center", gap: 4 }}>
                <AlertTriangle size={14} /> Backend offline (read-only SQLite unavailable)
              </span>
            )}
          </div>

          <div className="topbar-right" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* 1-Click Role / Account Switcher Dropdown */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>Role:</span>
              <select
                value={currentSelectValue}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "metamask") {
                    connectMetaMask();
                  } else {
                    connectDemo(Number(val));
                  }
                }}
                style={{
                  padding: "5px 10px",
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                  fontSize: 13,
                  fontWeight: 600,
                  background: "#f8fafc",
                  cursor: "pointer",
                  color: "#0f172a",
                }}
                title="Switch active role / demo account"
              >
                <option value="0">Demo #0: Regulator (Admin)</option>
                <option value="1">Demo #1: Producer</option>
                <option value="2">Demo #2: Consumer A</option>
                <option value="3">Demo #3: Collector</option>
                <option value="4">Demo #4: Recycler</option>
                <option value="5">Demo #5: Unregistered</option>
                <option value="6">Demo #6: Consumer B</option>
                <option value="metamask">🦊 MetaMask Wallet</option>
              </select>
            </div>

            {address && (
              <>
                <span className={`badge ${ROLE_BADGES[role]}`}>
                  {ROLE_NAMES[role] || "Unregistered"}
                  {suspended && " (SUSPENDED)"}
                </span>

                <div className="wallet-chip">
                  <span>{shortAddress(address)}</span>
                  <button className="copy-btn" onClick={copyAddress} title="Copy address to clipboard">
                    {copied ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="page-container">
          <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/track" element={<TrackDevice />} />
            <Route path="/verify" element={<VerifyCertificate />} />

            {/* Role Portals with Guards */}
            <Route
              path="/regulator"
              element={
                <RouteGuard requiredRole={ROLES.Admin} roleName="Regulator">
                  <RegulatorPortal />
                </RouteGuard>
              }
            />
            <Route
              path="/producer"
              element={
                <RouteGuard requiredRole={ROLES.Producer} roleName="Producer">
                  <ProducerPortal />
                </RouteGuard>
              }
            />
            <Route
              path="/consumer"
              element={
                <RouteGuard requiredRole={ROLES.Consumer} roleName="Consumer">
                  <ConsumerPortal />
                </RouteGuard>
              }
            />
            <Route
              path="/collector"
              element={
                <RouteGuard requiredRole={ROLES.Collector} roleName="Collector">
                  <CollectorPortal />
                </RouteGuard>
              }
            />
            <Route
              path="/recycler"
              element={
                <RouteGuard requiredRole={ROLES.Recycler} roleName="Recycler">
                  <RecyclerPortal />
                </RouteGuard>
              }
            />

            {/* Backwards compatibility aliases */}
            <Route path="/admin" element={<RouteGuard requiredRole={ROLES.Admin} roleName="Regulator"><RegulatorPortal /></RouteGuard>} />
            <Route path="/register" element={<RouteGuard requiredRole={ROLES.Producer} roleName="Producer"><ProducerPortal /></RouteGuard>} />
            <Route path="/my-devices" element={<RouteGuard requiredRole={ROLES.Consumer} roleName="Consumer"><ConsumerPortal /></RouteGuard>} />

            {/* Fallback */}
            <Route path="*" element={<Landing />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </WalletProvider>
  );
}
