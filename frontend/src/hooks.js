import { useCallback, useEffect, useState } from "react";
import { fetchAllDevices } from "./services/chain";

// Loads every device straight from the blockchain (works even when the backend is down).
export function useDevices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setDevices(await fetchAllDevices());
      setError(null);
    } catch {
      setError("Cannot read the blockchain. Is the Hardhat node running and the contract deployed (npm run deploy)?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);
  return { devices, loading, error, reload };
}
