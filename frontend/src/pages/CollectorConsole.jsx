import { useEffect, useState } from "react";
import { usePersona } from "../persona";
import { useDevices } from "../hooks";
import { PERSONAS, sendTx, personaAddress, CATEGORIES, shortAddr } from "../services/chain";
import { StatusBadge, TxBanner, ActingAs, ErrorNote } from "../ui";

export default function CollectorConsole() {
  const { persona } = usePersona();
  const { devices, error, reload } = useDevices();
  const [me, setMe] = useState(null);
  const [recyclers, setRecyclers] = useState([]);
  const [choice, setChoice] = useState({});
  const [result, setResult] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setMe(await personaAddress(persona.index));
        const list = [];
        for (const p of PERSONAS.filter((x) => x.role === "Recycler")) {
          list.push({ name: p.name, address: await personaAddress(p.index) });
        }
        setRecyclers(list);
      } catch { /* node offline; the error note above explains it */ }
    })();
  }, [persona]);

  async function collect(id) {
    const r = await sendTx(persona.index, "confirmCollection", [id, "Collected from owner"]);
    setResult(r.ok ? { ...r, message: `Device #${id} collected.` } : r);
    reload();
  }
  async function dispatch(id) {
    const to = choice[id] || (recyclers[0] && recyclers[0].address);
    const r = await sendTx(persona.index, "dispatchToRecycler", [id, to, "Dispatched to recycler"]);
    setResult(r.ok ? { ...r, message: `Device #${id} dispatched to the recycler.` } : r);
    reload();
  }

  const waiting = devices.filter((d) => d.status === 1);
  const holding = devices.filter((d) => d.status === 2 && me && d.custodian.toLowerCase() === me.toLowerCase());

  return (
    <div className="card">
      <h2>Collector console</h2>
      <ActingAs persona={persona} />
      <ErrorNote text={error} />
      <h3>Pickup requests</h3>
      <table>
        <thead><tr><th>ID</th><th>Category</th><th>Owner</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {waiting.map((d) => (
            <tr key={d.id}>
              <td>#{d.id}</td><td>{CATEGORIES[d.category - 1]}</td><td>{shortAddr(d.owner)}</td>
              <td><StatusBadge status={d.status} /></td>
              <td><button onClick={() => collect(d.id)}>Confirm collection</button></td>
            </tr>
          ))}
          {waiting.length === 0 && <tr><td colSpan="5">No pickup requests.</td></tr>}
        </tbody>
      </table>
      <h3>Collected by me</h3>
      <table>
        <thead><tr><th>ID</th><th>Category</th><th>Send to recycler</th><th></th></tr></thead>
        <tbody>
          {holding.map((d) => (
            <tr key={d.id}>
              <td>#{d.id}</td><td>{CATEGORIES[d.category - 1]}</td>
              <td>
                <select value={choice[d.id] || ""} onChange={(e) => setChoice({ ...choice, [d.id]: e.target.value })}>
                  {recyclers.map((r) => <option key={r.address} value={r.address}>{r.name}</option>)}
                </select>
              </td>
              <td><button onClick={() => dispatch(d.id)}>Dispatch</button></td>
            </tr>
          ))}
          {holding.length === 0 && <tr><td colSpan="4">Nothing collected by this persona yet.</td></tr>}
        </tbody>
      </table>
      <TxBanner result={result} />
    </div>
  );
}
