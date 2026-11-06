import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useWallet } from "../wallet";
import { sendTx, ROLE } from "../services/chain";
import {
  ShieldAlert,
  Building2,
  UserCheck,
  Truck,
  Recycle,
  ShieldCheck,
  Wallet,
  ArrowRight,
  AlertTriangle,
  FileCheck,
  Search,
  LayoutDashboard,
  Sparkles,
} from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();
  const {
    kind,
    address,
    role,
    roleName,
    suspended,
    signer,
    connectMetaMask,
    connectDemo,
    disconnect,
    demoAccounts,
    refreshRole,
  } = useWallet();

  const [selectedRole, setSelectedRole] = useState(null); // 1 Admin..5 Recycler
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState(null);
  const [unauthDemoResult, setUnauthDemoResult] = useState(null);
  const [testingUnauth, setTestingUnauth] = useState(false);

  const ROLES_INFO = [
    {
      id: 3,
      name: "Consumer",
      portal: "/consumer",
      icon: <UserCheck size={32} color="#16a34a" />,
      bg: "#dcfce7",
      desc: "Claim electronics, schedule door-step pickups, earn and redeem Green Points.",
    },
    {
      id: 2,
      name: "Producer",
      portal: "/producer",
      icon: <Building2 size={32} color="#2563eb" />,
      bg: "#dbeafe",
      desc: "Register manufactured products, fulfill EPR compliance quotas, and monitor vouchers.",
    },
    {
      id: 4,
      name: "Collector",
      portal: "/collector",
      icon: <Truck size={32} color="#d97706" />,
      bg: "#fef3c7",
      desc: "Accept consumer pickup requests, maintain physical custody, and dispatch to recyclers.",
    },
    {
      id: 5,
      name: "Recycler",
      portal: "/recycler",
      icon: <Recycle size={32} color="#7c3aed" />,
      bg: "#f3e8ff",
      desc: "Verify material weights, enforce mass balance, and anchor recycling certificates.",
    },
    {
      id: 1,
      name: "Regulator",
      portal: "/regulator",
      icon: <ShieldCheck size={32} color="#dc2626" />,
      bg: "#fee2e2",
      desc: "Oversee ecosystem compliance, audit transactions, and exercise suspension powers.",
    },
  ];

  const handleRoleCardClick = (roleObj) => {
    setSelectedRole(roleObj);
    if (address) {
      if (role === roleObj.id) {
        navigate(roleObj.portal);
      }
    }
  };

  const handleSelfRegister = async () => {
    if (!selectedRole || !signer) return;
    setRegistering(true);
    setRegisterError(null);
    const res = await sendTx(signer, "selfRegister", [selectedRole.id]);
    if (res.ok) {
      await refreshRole();
      navigate(selectedRole.portal);
    } else {
      setRegisterError(res.error);
    }
    setRegistering(false);
  };

  const handleUnauthorizedDemo = async () => {
    setTestingUnauth(true);
    setUnauthDemoResult(null);
    try {
      // Intentionally call registerDevice as Consumer/Unregistered to demonstrate contract revert
      const res = await sendTx(signer || 2, "registerDevice", [1, "0x" + "aa".repeat(32), "Unauthorized attempt"]);
      if (res.ok) {
        setUnauthDemoResult({ ok: true, msg: "Unexpected success: transaction succeeded!" });
      } else {
        setUnauthDemoResult({ ok: false, msg: `Reverted by smart contract: "${res.error}"` });
      }
    } catch (e) {
      setUnauthDemoResult({ ok: false, msg: e.message });
    }
    setTestingUnauth(false);
  };

  return (
    <div className="page-container">
      {/* Hero Section */}
      <div style={{ textAlign: "center", padding: "40px 20px 20px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#ecfdf5", padding: "6px 14px", borderRadius: 20, color: "#166534", fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
          <Sparkles size={16} /> Extended Producer Responsibility (EPR) on Ethereum
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 800, margin: "0 0 12px", color: "#0f172a", letterSpacing: "-1px" }}>
          EcoChain: Verifiable E-Waste Lifecycle Tracking
        </h1>
        <p style={{ fontSize: 17, color: "#64748b", maxWidth: 640, margin: "0 auto 28px" }}>
          An immutable smart-contract state machine enforcing material mass-balance, digital certificate anchoring, and automated circular-economy rewards.
        </p>

        {/* Wallet Connection Buttons */}
        <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap", marginBottom: 32 }}>
          {!address ? (
            <>
              <button className="btn btn-primary" onClick={connectMetaMask} style={{ padding: "12px 22px", fontSize: 15 }}>
                <Wallet size={18} /> Connect MetaMask
              </button>
              <button className="btn btn-secondary" onClick={() => setShowDemoModal(true)} style={{ padding: "12px 22px", fontSize: 15 }}>
                Use Demo Wallet (1-Click)
              </button>
            </>
          ) : (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "#fff", border: "1px solid #cbd5e1", padding: "8px 16px", borderRadius: 30 }}>
              <span className="network-chip online">Connected via {kind === "metamask" ? "MetaMask" : "Demo Wallet"}</span>
              <span style={{ fontFamily: "monospace", fontSize: 13 }}>{address.slice(0, 8)}…{address.slice(-6)}</span>
              <span className={`role-badge ${roleName}`}>{roleName}</span>
              <button className="btn btn-secondary" onClick={disconnect} style={{ padding: "4px 10px", fontSize: 12 }}>
                Disconnect
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Account Suspended Alert */}
      {suspended && (
        <div className="alert alert-err" style={{ maxWidth: 800, margin: "0 auto 20px" }}>
          <ShieldAlert size={20} />
          <div>
            <strong>Account Suspended:</strong> This wallet has been suspended by the Regulator. You cannot perform state-changing lifecycle actions until reinstated.
          </div>
        </div>
      )}

      {/* Role Selection Prompt / Status */}
      {address && !suspended && (
        <div className="card" style={{ maxWidth: 800, margin: "0 auto 28px", border: "2px solid #86efac", background: "#f0fdf4" }}>
          <h3 style={{ margin: "0 0 8px", color: "#166534" }}>
            {role === 0 ? "Choose Your Stakeholder Role to Get Started" : `Wallet Active as ${roleName}`}
          </h3>
          {role === 0 ? (
            <p style={{ margin: "0 0 14px", color: "#334155", fontSize: 14 }}>
              Your connected wallet is unregistered. Click any role card below to self-register directly on the blockchain.
            </p>
          ) : (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <span style={{ fontSize: 14, color: "#334155" }}>
                This address is registered on-chain as <strong>{roleName}</strong>.
              </span>
              <button className="btn btn-primary" onClick={() => navigate(ROLES_INFO.find((r) => r.id === role)?.portal || "/dashboard")}>
                Go to {roleName} Portal <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Self-Registration Modal Prompt */}
      {selectedRole && address && role === 0 && (
        <div className="card" style={{ maxWidth: 800, margin: "0 auto 28px", border: "2px solid #3b82f6", background: "#eff6ff" }}>
          <h3 style={{ margin: "0 0 8px", color: "#1d4ed8" }}>Register as {selectedRole.name}?</h3>
          <p style={{ margin: "0 0 14px", color: "#334155", fontSize: 14 }}>
            Would you like to register wallet <code>{address.slice(0, 10)}…</code> as an official <strong>{selectedRole.name}</strong> on the smart contract? This choice is permanently recorded on-chain.
          </p>
          {registerError && <div className="alert alert-err">{registerError}</div>}
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-primary" onClick={handleSelfRegister} disabled={registering}>
              {registering ? "Registering on Chain…" : `Confirm Self-Registration as ${selectedRole.name}`}
            </button>
            <button className="btn btn-secondary" onClick={() => setSelectedRole(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Role Selection Cards Grid */}
      <div className="grid-5" style={{ marginBottom: 36 }}>
        {ROLES_INFO.map((r) => {
          const isCurrent = address && role === r.id;
          return (
            <div
              key={r.id}
              className={`role-card ${selectedRole?.id === r.id ? "selected" : ""}`}
              onClick={() => handleRoleCardClick(r)}
            >
              <div className="role-icon-box" style={{ backgroundColor: r.bg }}>
                {r.icon}
              </div>
              <h3 style={{ margin: 0, fontSize: 18 }}>{r.name}</h3>
              <p style={{ margin: 0, fontSize: 13, color: "#64748b", flex: 1 }}>{r.desc}</p>
              <div style={{ marginTop: 8, width: "100%" }}>
                {isCurrent ? (
                  <span className="btn btn-primary" style={{ width: "100%", padding: "8px 12px", fontSize: 13 }}>
                    Open Portal
                  </span>
                ) : (
                  <span className="btn btn-secondary" style={{ width: "100%", padding: "8px 12px", fontSize: 13 }}>
                    Select Role
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Public Pages Quick Nav */}
      <div className="card" style={{ marginBottom: 28 }}>
        <h3 className="card-title" style={{ marginBottom: 14 }}>Public Services (No Wallet Required)</h3>
        <div className="grid-3">
          <Link to="/dashboard" style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ padding: 16, border: "1px solid #e2e8f0", borderRadius: 8, display: "flex", alignItems: "center", gap: 12 }}>
              <LayoutDashboard size={24} color="#16a34a" />
              <div>
                <strong style={{ display: "block" }}>Public Analytics Dashboard</strong>
                <span style={{ fontSize: 13, color: "#64748b" }}>Live KPIs, mass balances, and stage distribution.</span>
              </div>
            </div>
          </Link>
          <Link to="/track" style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ padding: 16, border: "1px solid #e2e8f0", borderRadius: 8, display: "flex", alignItems: "center", gap: 12 }}>
              <Search size={24} color="#0ea5e9" />
              <div>
                <strong style={{ display: "block" }}>Track Device Provenance</strong>
                <span style={{ fontSize: 13, color: "#64748b" }}>View 6-stage timeline and check metadata integrity.</span>
              </div>
            </div>
          </Link>
          <Link to="/verify" style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ padding: 16, border: "1px solid #e2e8f0", borderRadius: 8, display: "flex", alignItems: "center", gap: 12 }}>
              <FileCheck size={24} color="#7c3aed" />
              <div>
                <strong style={{ display: "block" }}>Verify Recycling Certificate</strong>
                <span style={{ fontSize: 13, color: "#64748b" }}>Drop any PDF to test its SHA-256 fingerprint on-chain.</span>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Faculty Demonstration Helper: Unauthorized Rejection Demo */}
      <div className="card" style={{ border: "1px dashed #cbd5e1", background: "#f8fafc" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div>
            <strong style={{ display: "block", color: "#334155" }}>Faculty Viva Demo: Smart Contract Rejection Test</strong>
            <span style={{ fontSize: 13, color: "#64748b" }}>
              Demonstrate that the smart contract rejects unauthorized actions with the exact revert string.
            </span>
          </div>
          <button className="btn btn-secondary" onClick={handleUnauthorizedDemo} disabled={testingUnauth}>
            <AlertTriangle size={16} color="#d97706" /> {testingUnauth ? "Testing…" : "Test Unauthorized Rejection"}
          </button>
        </div>
        {unauthDemoResult && (
          <div className={`alert ${unauthDemoResult.ok ? "alert-ok" : "alert-err"}`} style={{ marginTop: 14 }}>
            {unauthDemoResult.msg}
          </div>
        )}
      </div>

      {/* Demo Wallet Picker Modal */}
      {showDemoModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
          <div className="card" style={{ maxWidth: 500, width: "100%", maxHeight: "80vh", overflowY: "auto" }}>
            <div className="card-header">
              <h3 className="card-title">Select Local Demo Account</h3>
              <button onClick={() => setShowDemoModal(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer" }}>✕</button>
            </div>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 14px" }}>
              These correspond to the 10 unlocked accounts pre-funded by Hardhat (Chain ID 31337).
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {demoAccounts.map((acc) => (
                <div
                  key={acc.index}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer", background: address === acc.address ? "#f0fdf4" : "#fff" }}
                  onClick={() => {
                    connectDemo(acc.index);
                    setShowDemoModal(false);
                  }}
                >
                  <div>
                    <strong style={{ fontSize: 14 }}>Account #{acc.index}</strong>
                    <div style={{ fontFamily: "monospace", fontSize: 12, color: "#64748b" }}>
                      {acc.address.slice(0, 10)}…{acc.address.slice(-6)}
                    </div>
                  </div>
                  <span className={`role-badge ${acc.roleName}`}>{acc.roleName}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
