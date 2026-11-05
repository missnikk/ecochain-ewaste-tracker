import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { PERSONAS } from "./services/chain";
import { api } from "./services/api";
import { PersonaContext } from "./persona";
import Dashboard from "./pages/Dashboard";
import RegisterDevice from "./pages/RegisterDevice";
import MyDevices from "./pages/MyDevices";
import CollectorConsole from "./pages/CollectorConsole";
import RecyclerConsole from "./pages/RecyclerConsole";
import TrackDevice from "./pages/TrackDevice";
import VerifyCertificate from "./pages/VerifyCertificate";
import Admin from "./pages/Admin";
import Transactions from "./pages/Transactions";

export default function App() {
  const [persona, setPersona] = useState(PERSONAS[0]);
  const [backendUp, setBackendUp] = useState(true);

  useEffect(() => {
    let alive = true;
    const check = async () => { const r = await api.health(); if (alive) setBackendUp(r.ok); };
    check();
    const t = setInterval(check, 5000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  return (
    <PersonaContext.Provider value={{ persona, setPersona }}>
      <BrowserRouter>
        <header className="top">
          <strong className="brand">EcoChain</strong>
          <nav>
            <NavLink to="/">Dashboard</NavLink>
            <NavLink to="/register">Register</NavLink>
            <NavLink to="/my-devices">My devices</NavLink>
            <NavLink to="/collector">Collector</NavLink>
            <NavLink to="/recycler">Recycler</NavLink>
            <NavLink to="/track">Track</NavLink>
            <NavLink to="/verify">Verify</NavLink>
            <NavLink to="/admin">Admin</NavLink>
            <NavLink to="/transactions">Transactions</NavLink>
          </nav>
          <label className="persona">
            Acting as{" "}
            <select value={persona.index} onChange={(e) => setPersona(PERSONAS[Number(e.target.value)])}>
              {PERSONAS.map((p) => (
                <option key={p.index} value={p.index}>{p.name} ({p.role})</option>
              ))}
            </select>
          </label>
        </header>
        {!backendUp && (
          <div className="warn">Backend offline: blockchain features still work. Metadata and analytics are unavailable.</div>
        )}
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/register" element={<RegisterDevice />} />
            <Route path="/my-devices" element={<MyDevices />} />
            <Route path="/collector" element={<CollectorConsole />} />
            <Route path="/recycler" element={<RecyclerConsole />} />
            <Route path="/track" element={<TrackDevice />} />
            <Route path="/verify" element={<VerifyCertificate />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/transactions" element={<Transactions />} />
          </Routes>
        </main>
      </BrowserRouter>
    </PersonaContext.Provider>
  );
}
