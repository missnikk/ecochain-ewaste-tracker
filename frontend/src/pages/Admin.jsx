import { useEffect, useState } from "react";
import { usePersona } from "../persona";
import { PERSONAS, ROLE, sendTx, readContract, personaAddresses, shortAddr } from "../services/chain";
import { ActingAs, TxBanner, ErrorNote } from "../ui";

export default function Admin() {
  const { persona } = usePersona();
  const [rows, setRows] = useState([]);
  const [paused, setPaused] = useState(false);
  const [target, setTarget] = useState(1);
  const [role, setRole] = useState(3);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function refresh() {
    try {
      const c = readContract();
      const addrs = await personaAddresses();
      const list = [];
      for (const p of PERSONAS) list.push({ persona: p, address: addrs[p.index], role: Number(await c.roles(addrs[p.index])) });
      setRows(list);
      setPaused(await c.paused());
      setError(null);
    } catch {
      setError("Cannot read the blockchain. Is the Hardhat node running and the contract deployed?");
    }
  }
  useEffect(() => { refresh(); }, []);

  async function assign(e) {
    e.preventDefault();
    const addrs = await personaAddresses();
    const r = await sendTx(persona.index, "assignRole", [addrs[Number(target)], Number(role)]);
    setResult(r.ok ? { ...r, message: "Role updated." } : r);
    refresh();
  }
  async function togglePause() {
    const r = await sendTx(persona.index, "setPaused", [!paused]);
    setResult(r.ok ? { ...r, message: paused ? "System resumed." : "System paused." } : r);
    refresh();
  }

  return (
    <div className="card">
      <h2>Admin (regulator)</h2>
      <ActingAs persona={persona} />
      <ErrorNote text={error} />
      <p>System status: <strong>{paused ? "PAUSED" : "running"}</strong>{" "}
        <button onClick={togglePause}>{paused ? "Resume system" : "Pause system"}</button></p>
      <h3>Roles</h3>
      <table>
        <thead><tr><th>Persona</th><th>Address</th><th>Role on-chain</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.persona.index}><td>{r.persona.name}</td><td>{shortAddr(r.address)}</td><td>{ROLE[r.role]}</td></tr>
          ))}
        </tbody>
      </table>
      <h3>Assign a role</h3>
      <form onSubmit={assign} className="inline">
        <select value={target} onChange={(e) => setTarget(e.target.value)}>
          {PERSONAS.filter((p) => p.index !== 0).map((p) => <option key={p.index} value={p.index}>{p.name}</option>)}
        </select>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          {ROLE.map((r, i) => <option key={r} value={i}>{r}</option>)}
        </select>
        <button>Assign</button>
      </form>
      <TxBanner result={result} />
    </div>
  );
}
