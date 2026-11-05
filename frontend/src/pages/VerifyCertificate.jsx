import { useState } from "react";
import { readContract, friendlyError } from "../services/chain";
import { fileHash } from "../services/hash";
import { ErrorNote } from "../ui";

export default function VerifyCertificate() {
  const [id, setId] = useState("");
  const [file, setFile] = useState(null);
  const [outcome, setOutcome] = useState(null);
  const [error, setError] = useState(null);

  async function verify(e) {
    e.preventDefault();
    setError(null); setOutcome(null);
    try {
      const hash = await fileHash(file);
      const ok = await readContract().verifyCertificate(Number(id), hash);
      setOutcome({ ok, hash });
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  return (
    <div className="card">
      <h2>Verify recycling certificate</h2>
      <p className="hint">Anyone can check a certificate. Your browser computes the file's SHA-256 hash and the smart contract compares it with the hash stored when the device was recycled.</p>
      <form onSubmit={verify}>
        <label>Device ID <input type="number" min="1" value={id} onChange={(e) => setId(e.target.value)} required /></label>
        <label>Certificate PDF <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files[0] || null)} required /></label>
        <button disabled={!file}>Verify</button>
      </form>
      <ErrorNote text={error} />
      {outcome && (
        <div className={outcome.ok ? "big ok" : "big err"}>
          {outcome.ok ? "✅ Authentic: matches the blockchain record" : "❌ Does not match the blockchain record"}
          <div className="hash">File hash: {outcome.hash}</div>
        </div>
      )}
    </div>
  );
}
