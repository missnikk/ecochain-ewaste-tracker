import { useEffect, useState } from "react";
import { usePersona } from "../persona";
import { useDevices } from "../hooks";
import { sendTx, readContract, personaAddress, CATEGORIES, shortAddr } from "../services/chain";
import { StatusBadge, TxBanner, ActingAs, ErrorNote } from "../ui";

export default function MyDevices() {
  const { persona } = usePersona();
  const { devices, loading, error, reload } = useDevices();
  const [me, setMe] = useState(null);
  const [points, setPoints] = useState(0);
  const [result, setResult] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const addr = await personaAddress(persona.index);
        setMe(addr);
        setPoints(Number(await readContract().greenPoints(addr)));
      } catch { setPoints(0); }
    })();
  }, [persona, devices]);

  async function requestPickup(id) {
    const r = await sendTx(persona.index, "requestPickup", [id, "Pickup requested by owner"]);
    setResult(r.ok ? { ...r, message: `Pickup requested for device #${id}.` } : r);
    reload();
  }

  const mine = devices.filter((d) => me && d.owner.toLowerCase() === me.toLowerCase());

  return (
    <div className="card">
      <h2>My devices</h2>
      <ActingAs persona={persona} />
      <p className="points">Green Points: <strong>{points}</strong></p>
      {persona.role !== "Consumer" && <p className="hint">Switch to a Consumer persona to see devices you own.</p>}
      <ErrorNote text={error} />
      {loading && <p>Loading...</p>}
      <table>
        <thead><tr><th>ID</th><th>Category</th><th>Status</th><th>Held by</th><th>Recovered (g)</th><th></th></tr></thead>
        <tbody>
          {mine.map((d) => (
            <tr key={d.id}>
              <td>#{d.id}</td>
              <td>{CATEGORIES[d.category - 1]}</td>
              <td><StatusBadge status={d.status} /></td>
              <td>{shortAddr(d.custodian)}</td>
              <td>{d.recoveredGrams || "-"}</td>
              <td>{d.status === 0 && <button onClick={() => requestPickup(d.id)}>Request pickup</button>}</td>
            </tr>
          ))}
          {mine.length === 0 && !loading && <tr><td colSpan="6">No devices for this persona.</td></tr>}
        </tbody>
      </table>
      <TxBanner result={result} />
    </div>
  );
}
