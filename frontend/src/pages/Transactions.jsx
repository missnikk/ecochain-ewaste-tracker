import { useEffect, useState } from "react";
import { readContract, STATUS, shortAddr } from "../services/chain";
import { api } from "../services/api";

export default function Transactions() {
  const [rows, setRows] = useState([]);
  const [source, setSource] = useState("");

  useEffect(() => {
    (async () => {
      const r = await api.events(50);
      if (r.ok) {
        setSource("indexed database (backend)");
        setRows(r.data.map((e) => ({
          key: `${e.tx_hash}-${e.log_index}`, name: e.name, device: e.device_id, actor: e.actor,
          block: e.block, hash: e.tx_hash, detail: e.data.status !== undefined ? STATUS[Number(e.data.status)] : "",
        })));
        return;
      }
      try {
        const logs = await readContract().queryFilter("StatusChanged", 0, "latest");
        setSource("read directly from the blockchain (backend offline)");
        setRows(logs.slice(-50).reverse().map((l) => ({
          key: `${l.transactionHash}-${l.index}`, name: "StatusChanged", device: Number(l.args.deviceId),
          actor: l.args.actor, block: l.blockNumber, hash: l.transactionHash, detail: STATUS[Number(l.args.status)],
        })));
      } catch { setSource("blockchain not reachable"); }
    })();
  }, []);

  return (
    <div className="card">
      <h2>Transactions</h2>
      <p className="hint">Source: {source}. Each row is a blockchain transaction event with its hash and block number.</p>
      <table>
        <thead><tr><th>Event</th><th>Device</th><th>Stage</th><th>Actor</th><th>Block</th><th>Tx hash</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              <td>{r.name}</td><td>{r.device ?? "-"}</td><td>{r.detail}</td>
              <td>{shortAddr(r.actor)}</td><td>{r.block}</td><td className="mono">{r.hash.slice(0, 18)}...</td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan="6">No transactions yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
