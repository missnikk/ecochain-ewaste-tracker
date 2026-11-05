import { useEffect, useState } from "react";
import { readContract, STATUS, CATEGORIES } from "../services/chain";
import { api } from "../services/api";
import { ErrorNote } from "../ui";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const c = readContract();
        const count = Number(await c.deviceCount());
        const byStatus = await Promise.all([0, 1, 2, 3, 4, 5].map((i) => c.statusCount(i)));
        const grams = Number(await c.totalRecoveredGrams());
        setStats({ count, byStatus: byStatus.map(Number), grams });
      } catch {
        setError("Cannot read the blockchain. Start the node (npm run chain) and deploy (npm run deploy).");
      }
      const a = await api.analytics();
      if (a.ok) setAnalytics(a.data);
    })();
  }, []);

  const max = stats ? Math.max(1, ...stats.byStatus) : 1;

  return (
    <div className="card">
      <h2>Dashboard</h2>
      <ErrorNote text={error} />
      {stats && (
        <>
          <div className="tiles">
            <div className="tile"><span>{stats.count}</span>Devices registered</div>
            <div className="tile"><span>{stats.byStatus[5]}</span>Recycled</div>
            <div className="tile"><span>{(stats.grams / 1000).toFixed(2)} kg</span>Material recovered</div>
          </div>
          <h3>Devices by stage (from the blockchain)</h3>
          {STATUS.map((s, i) => (
            <div className="bar" key={s}>
              <label>{s}</label>
              <div className="track"><div className={`fill s${i}`} style={{ width: `${(stats.byStatus[i] / max) * 100}%` }} /></div>
              <b>{stats.byStatus[i]}</b>
            </div>
          ))}
        </>
      )}
      {analytics && (
        <>
          <h3>Devices by category (from the indexed database)</h3>
          <ul className="facts">
            {analytics.byCategory.map((c) => <li key={c.category}>{CATEGORIES[c.category - 1]}: {c.count}</li>)}
          </ul>
          <h3>Registrations per day</h3>
          <ul className="facts">
            {analytics.registeredPerDay.map((d) => <li key={d.day}>{d.day}: {d.count}</li>)}
          </ul>
        </>
      )}
      {!analytics && stats && <p className="hint">Category and daily analytics appear when the backend is running.</p>}
    </div>
  );
}
