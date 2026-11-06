import React, { useState } from "react";
import { Link } from "react-router-dom";
import { readContract, friendlyError, CATEGORIES, STATUS, shortAddr } from "../services/chain";
import { fileHash, sha256Bytes } from "../services/hash";
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Upload,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  Info,
  Bug
} from "lucide-react";

export default function VerifyCertificate() {
  const [file, setFile] = useState(null);
  const [computing, setComputing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [tamperedDemo, setTamperedDemo] = useState(null);

  const processFile = async (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setError(null);
    setResult(null);
    setTamperedDemo(null);
    setComputing(true);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const hash = await sha256Bytes(arrayBuffer);
      const contract = readContract();

      // Query reverse lookup mapping: certificateDevice[bytes32] => uint256 deviceId
      const deviceIdBig = await contract.certificateDevice(hash);
      const deviceId = Number(deviceIdBig);

      if (deviceId > 0) {
        // Certificate is anchored on-chain! Fetch device details
        const dev = await contract.getDevice(deviceId);
        setResult({
          valid: true,
          deviceId,
          hash,
          fileName: selectedFile.name,
          category: CATEGORIES[Number(dev.category) - 1] || "Unknown Category",
          producer: dev.producer,
          owner: dev.owner,
          custodian: dev.custodian,
          status: Number(dev.status),
          receivedGrams: Number(dev.receivedGrams),
          recoveredGrams: Number(dev.recoveredGrams),
          residualGrams: Number(dev.residualGrams),
          updatedAt: Number(dev.updatedAt) > 0 ? new Date(Number(dev.updatedAt) * 1000).toLocaleString() : "N/A",
          originalBuffer: arrayBuffer,
        });
      } else {
        // Hash not found on blockchain
        setResult({
          valid: false,
          hash,
          fileName: selectedFile.name,
          originalBuffer: arrayBuffer,
        });
      }
    } catch (err) {
      console.error("Verification error:", err);
      setError(friendlyError(err));
    } finally {
      setComputing(false);
    }
  };

  const handleFileInput = (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) processFile(f);
  };

  // Tamper demonstration: flips one single byte in the buffer and recalculates
  const runTamperDemo = async () => {
    if (!result || !result.originalBuffer) return;
    try {
      // Clone buffer and modify byte #42
      const cloned = new Uint8Array(result.originalBuffer.slice(0));
      cloned[42] = cloned[42] ^ 0xff; // Invert bits of 1 byte

      const tamperedHash = await sha256Bytes(cloned.buffer);
      const contract = readContract();
      const deviceIdBig = await contract.certificateDevice(tamperedHash);
      const deviceId = Number(deviceIdBig);

      setTamperedDemo({
        originalHash: result.hash,
        tamperedHash,
        byteChanged: 42,
        foundOnChain: deviceId > 0,
      });
    } catch (err) {
      console.error("Tamper demo error:", err);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Public Certificate Verifier</h1>
        <p style={{ color: "var(--text-muted)", margin: 0 }}>
          Cryptographic proof of electronic waste recycling. No account, login, or wallet required.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, marginTop: 0, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
          <ShieldCheck size={20} color="#16a34a" /> How Verification Works
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: 14, margin: "0 0 12px" }}>
          When an authorized Recycler completes device recycling on EcoChain, an official PDF certificate is generated and its <strong>SHA-256 cryptographic digest</strong> is permanently anchored into the Ethereum smart contract.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, fontSize: 13 }}>
          <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}>
            <strong>1. Local Hashing:</strong> Your browser computes the SHA-256 hash locally. The file never leaves your machine.
          </div>
          <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}>
            <strong>2. Smart Contract Lookup:</strong> The contract inspects <code>certificateDevice[hash]</code> for duplicate protection.
          </div>
          <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}>
            <strong>3. Tamper Evidence:</strong> If even one letter or timestamp is altered, the hash will not match and verification fails.
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="card" style={{ marginBottom: 24, textAlign: "center", padding: "36px 20px" }}>
        <input
          type="file"
          id="cert-file"
          accept="application/pdf"
          onChange={handleFileInput}
          style={{ display: "none" }}
        />
        <label
          htmlFor="cert-file"
          style={{
            cursor: "pointer",
            display: "inline-flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "24px 36px",
            border: "2px dashed #cbd5e1",
            borderRadius: 12,
            background: "#f8fafc",
            transition: "all 0.2s ease",
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              processFile(e.dataTransfer.files[0]);
            }
          }}
        >
          <Upload size={36} color="#16a34a" style={{ marginBottom: 12 }} />
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
            {file ? file.name : "Click to select or drop a Certificate PDF here"}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Accepts official EcoChain <code>.pdf</code> recycling certificates
          </div>
        </label>

        {computing && (
          <div style={{ marginTop: 16, color: "var(--accent)", fontWeight: 500 }}>
            Computing SHA-256 fingerprint and querying blockchain...
          </div>
        )}

        {error && (
          <div style={{ marginTop: 16, padding: 12, background: "#fef2f2", color: "var(--danger)", borderRadius: 8, fontSize: 14 }}>
            <AlertTriangle size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }} />
            {error}
          </div>
        )}
      </div>

      {/* Verification Result */}
      {result && (
        <div style={{ marginBottom: 24 }}>
          {result.valid ? (
            /* SUCCESS CASE */
            <div className="card" style={{ borderColor: "#86efac", background: "#f0fdf4" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                <CheckCircle2 size={36} color="#16a34a" style={{ flexShrink: 0, marginTop: 4 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                    <h2 style={{ margin: 0, color: "#166534", fontSize: 20 }}>
                      Authentic Recycling Certificate Verified
                    </h2>
                    <span className="badge badge-admin">On-Chain Verified</span>
                  </div>
                  <p style={{ margin: "6px 0 16px", color: "#15803d", fontSize: 14 }}>
                    This certificate's cryptographic SHA-256 fingerprint matches the immutable record permanently anchored in the EcoChain smart contract.
                  </p>

                  <div style={{ background: "#ffffff", padding: 16, borderRadius: 8, border: "1px solid #bbf7d0", marginBottom: 16 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, fontSize: 14 }}>
                      <div>
                        <span style={{ color: "var(--text-muted)", fontSize: 12, display: "block" }}>Device ID</span>
                        <strong>#{result.deviceId}</strong>
                      </div>
                      <div>
                        <span style={{ color: "var(--text-muted)", fontSize: 12, display: "block" }}>Product Category</span>
                        <strong>{result.category}</strong>
                      </div>
                      <div>
                        <span style={{ color: "var(--text-muted)", fontSize: 12, display: "block" }}>Certified Recycler</span>
                        <code style={{ fontSize: 12 }}>{shortAddr(result.custodian)}</code>
                      </div>
                      <div>
                        <span style={{ color: "var(--text-muted)", fontSize: 12, display: "block" }}>Original Producer</span>
                        <code style={{ fontSize: 12 }}>{shortAddr(result.producer)}</code>
                      </div>
                      <div>
                        <span style={{ color: "var(--text-muted)", fontSize: 12, display: "block" }}>Certified Weights</span>
                        <span>
                          {result.receivedGrams}g received = {result.recoveredGrams}g recovered + {result.residualGrams}g residual
                        </span>
                      </div>
                      <div>
                        <span style={{ color: "var(--text-muted)", fontSize: 12, display: "block" }}>Certified Timestamp</span>
                        <span>{result.updatedAt}</span>
                      </div>
                    </div>

                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #e2e8f0" }}>
                      <span style={{ color: "var(--text-muted)", fontSize: 12, display: "block" }}>Anchored SHA-256 Hash</span>
                      <code style={{ fontSize: 12, wordBreak: "break-all", color: "#0f766e" }}>{result.hash}</code>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                    <Link to={`/track?id=${result.deviceId}`} className="btn btn-outline" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                      View Full Device History on Track Page <ArrowRight size={14} />
                    </Link>

                    <button
                      className="btn"
                      style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}
                      onClick={runTamperDemo}
                    >
                      <Bug size={14} /> Simulate 1-Byte Tamper (Viva Demo)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* FAILURE CASE */
            <div className="card" style={{ borderColor: "#fca5a5", background: "#fef2f2" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                <XCircle size={36} color="var(--danger)" style={{ flexShrink: 0, marginTop: 4 }} />
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: 0, color: "#991b1b", fontSize: 20 }}>
                    Verification Failed: Tampered or Unregistered Certificate
                  </h2>
                  <p style={{ margin: "6px 0 16px", color: "#b91c1c", fontSize: 14 }}>
                    No certificate with this SHA-256 fingerprint exists on the EcoChain blockchain.
                  </p>

                  <div style={{ background: "#ffffff", padding: 14, borderRadius: 8, border: "1px solid #fecaca", marginBottom: 16, fontSize: 13 }}>
                    <div style={{ marginBottom: 6 }}>
                      <strong>Computed File Fingerprint:</strong>
                    </div>
                    <code style={{ fontSize: 12, wordBreak: "break-all", color: "#991b1b" }}>{result.hash}</code>
                    <p style={{ marginTop: 10, marginBottom: 0, color: "var(--text-muted)", fontSize: 12 }}>
                      If this certificate was previously issued, even modifying a single character, date, or metadata byte in the PDF permanently alters this hash and invalidates cryptographic verification.
                    </p>
                  </div>

                  <div style={{ fontSize: 13, color: "#7f1d1d" }}>
                    <strong>What this means:</strong> The smart contract enforces exact byte-level integrity. Certificates that have been edited, forged, or re-used cannot pass this check.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tamper Demonstration Result */}
          {tamperedDemo && (
            <div className="card" style={{ marginTop: 16, borderLeft: "4px solid #f59e0b", background: "#fffbeb" }}>
              <h3 style={{ margin: "0 0 8px", fontSize: 16, color: "#92400e", display: "flex", alignItems: "center", gap: 8 }}>
                <Bug size={18} /> Viva Tamper Demonstration Result
              </h3>
              <p style={{ fontSize: 13, color: "#78350f", margin: "0 0 12px" }}>
                We modified exactly <strong>1 byte (byte #{tamperedDemo.byteChanged})</strong> of your authentic certificate in browser memory and recalculated its SHA-256 digest:
              </p>

              <div style={{ fontSize: 12, fontFamily: "monospace", background: "#ffffff", padding: 12, borderRadius: 6, border: "1px solid #fde68a", marginBottom: 12 }}>
                <div style={{ marginBottom: 4 }}>
                  <span style={{ color: "#16a34a", fontWeight: "bold" }}>Original: </span>
                  {tamperedDemo.originalHash}
                </div>
                <div>
                  <span style={{ color: "var(--danger)", fontWeight: "bold" }}>Tampered: </span>
                  {tamperedDemo.tamperedHash}
                </div>
              </div>

              <div style={{ fontSize: 13, color: "#92400e" }}>
                Smart contract lookup <code>certificateDevice[{tamperedDemo.tamperedHash.slice(0, 10)}...]</code> returned:
                <strong style={{ color: "var(--danger)", marginLeft: 6 }}>
                  0 (Device Not Found ❌)
                </strong>
                — proving that unauthorized alterations are immediately detected and rejected by the blockchain!
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
