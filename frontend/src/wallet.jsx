import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { provider, readContract, ROLE, shortAddr } from "./services/chain";

const WalletContext = createContext(null);

export const ROLES = {
  None: 0,
  Admin: 1,
  Producer: 2,
  Consumer: 3,
  Collector: 4,
  Recycler: 5,
};

export const ROLE_NAMES = ["Unregistered", "Admin", "Producer", "Consumer", "Collector", "Recycler"];

export const ROLE_BADGES = {
  0: "badge-none",
  1: "badge-admin",
  2: "badge-producer",
  3: "badge-consumer",
  4: "badge-collector",
  5: "badge-recycler",
};

export function shortAddress(addr) {
  if (!addr) return "";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within a WalletProvider");
  return ctx;
}

const LOCAL_CHAIN_ID_HEX = "0x7a69"; // 31337

export function WalletProvider({ children }) {
  const [kind, setKind] = useState(null); // 'metamask' | 'demo' | null
  const [demoIndex, setDemoIndex] = useState(null);
  const [address, setAddress] = useState(null);
  const [signer, setSigner] = useState(null);
  const [role, setRole] = useState(0); // 0 None..5 Recycler
  const [suspended, setSuspended] = useState(false);
  const [error, setError] = useState(null);
  const [demoAccounts, setDemoAccounts] = useState([]);
  const [connecting, setConnecting] = useState(false);

  // Read role and suspended status from chain for any address
  const fetchOnChainRole = useCallback(async (addr) => {
    if (!addr) return { role: 0, suspended: false };
    try {
      const c = readContract();
      const r = Number(await c.roles(addr));
      const s = Boolean(await c.suspended(addr));
      return { role: r, suspended: s };
    } catch {
      return { role: 0, suspended: false };
    }
  }, []);

  // Refresh active wallet's on-chain status
  const refreshRole = useCallback(async () => {
    if (!address) return;
    const { role: r, suspended: s } = await fetchOnChainRole(address);
    setRole(r);
    setSuspended(s);
  }, [address, fetchOnChainRole]);

  // Load demo accounts list (#0 to #9) with their current on-chain roles
  const loadDemoAccounts = useCallback(async () => {
    try {
      const accounts = await provider.listAccounts();
      const c = readContract();
      const results = await Promise.all(
        accounts.slice(0, 10).map(async (acc, idx) => {
          let r = 0;
          let s = false;
          try {
            r = Number(await c.roles(acc.address));
            s = Boolean(await c.suspended(acc.address));
          } catch {}
          return {
            index: idx,
            address: acc.address,
            role: r,
            roleName: ROLE[r] || "None",
            suspended: s,
          };
        })
      );
      setDemoAccounts(results);
    } catch (e) {
      console.warn("Failed to list demo accounts:", e.message);
    }
  }, []);

  useEffect(() => {
    loadDemoAccounts();
  }, [loadDemoAccounts]);

  // 1. Connect Demo Wallet by Index (0..9)
  const connectDemo = useCallback(async (index) => {
    setConnecting(true);
    setError(null);
    try {
      const s = await provider.getSigner(index);
      const addr = await s.getAddress();
      const { role: r, suspended: susp } = await fetchOnChainRole(addr);
      setKind("demo");
      setDemoIndex(index);
      setSigner(s);
      setAddress(addr);
      setRole(r);
      setSuspended(susp);
      setConnecting(false);
      return { ok: true, address: addr, role: r };
    } catch (e) {
      setError(e.message);
      setConnecting(false);
      return { ok: false, error: e.message };
    }
  }, [fetchOnChainRole]);

  // 2. Connect MetaMask
  const connectMetaMask = useCallback(async () => {
    setConnecting(true);
    setError(null);
    if (typeof window === "undefined" || !window.ethereum) {
      const msg = "MetaMask is not installed. Please use a Demo Wallet or install the MetaMask extension.";
      setError(msg);
      setConnecting(false);
      return { ok: false, error: msg };
    }

    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      // Ensure local network (31337)
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: LOCAL_CHAIN_ID_HEX }],
        });
      } catch (switchError) {
        // Chain 31337 not added yet
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: LOCAL_CHAIN_ID_HEX,
                chainName: "EcoChain Local",
                rpcUrls: ["http://127.0.0.1:8545"],
                nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
              },
            ],
          });
        } else if (switchError.code === 4001 || switchError.code === "ACTION_REJECTED") {
          throw new Error("You rejected the network switch in MetaMask.");
        }
      }

      await browserProvider.send("eth_requestAccounts", []);
      const s = await browserProvider.getSigner();
      const addr = await s.getAddress();
      const { role: r, suspended: susp } = await fetchOnChainRole(addr);

      setKind("metamask");
      setDemoIndex(null);
      setSigner(s);
      setAddress(addr);
      setRole(r);
      setSuspended(susp);
      setConnecting(false);

      return { ok: true, address: addr, role: r };
    } catch (e) {
      const msg = e.code === 4001 || e.code === "ACTION_REJECTED"
        ? "You rejected the request in MetaMask."
        : e.message || "Failed to connect to MetaMask.";
      setError(msg);
      setConnecting(false);
      return { ok: false, error: msg };
    }
  }, [fetchOnChainRole]);

  // Handle MetaMask account and chain change events
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    const handleAccountsChanged = async (accounts) => {
      if (kind !== "metamask") return;
      if (!accounts || accounts.length === 0) {
        disconnect();
      } else {
        const addr = accounts[0];
        const { role: r, suspended: s } = await fetchOnChainRole(addr);
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        const newSigner = await browserProvider.getSigner();
        setAddress(addr);
        setSigner(newSigner);
        setRole(r);
        setSuspended(s);
      }
    };

    const handleChainChanged = () => {
      if (kind === "metamask") {
        window.location.reload();
      }
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [kind, fetchOnChainRole]);

  const disconnect = useCallback(() => {
    setKind(null);
    setDemoIndex(null);
    setAddress(null);
    setSigner(null);
    setRole(0);
    setSuspended(false);
    setError(null);
  }, []);

  const value = {
    kind,
    demoIndex,
    address,
    shortAddress: shortAddr(address),
    role,
    roleName: ROLE[role] || "None",
    suspended,
    signer,
    error,
    connecting,
    demoAccounts,
    connectDemo,
    connectMetaMask,
    disconnect,
    refreshRole,
    loadDemoAccounts,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}
