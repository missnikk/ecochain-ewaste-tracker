import { STATUS } from "./services/chain";

export function StatusBadge({ status }) {
  return <span className={`badge s${status}`}>{STATUS[status]}</span>;
}

export function TxBanner({ result }) {
  if (!result) return null;
  if (!result.ok) return <div className="err">Rejected: {result.error}</div>;
  return (
    <div className="ok">
      {result.message} · Tx {result.hash} · block {result.blockNumber} · gas {result.gasUsed}
    </div>
  );
}

export function ActingAs({ persona }) {
  return <p className="acting">Acting as <strong>{persona.name}</strong> ({persona.role})</p>;
}

export function ErrorNote({ text }) {
  return text ? <div className="err">{text}</div> : null;
}
