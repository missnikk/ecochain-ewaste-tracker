# Architecture & Engineering Decisions (DECISIONS.md)

This log documents all architectural decisions, modifications, and rationales for the EcoChain project in accordance with AGENTS.md and README.md.

---

### D-01: Starter Scaffold Selection (Plan A)
- **Date:** 2026-11-05
- **Decision:** Selected Plan A (adapting `Sai-Narayana/plastic_trace` folder layout and persona-switcher pattern).
- **Rationale:** License confirmed MIT; verified test suite compiled with Solidity 0.8.24 cleanly; eliminated boilerplate overhead while writing 100% domain-specific EcoChain smart contract logic (`EWasteTracker.sol`), Express indexer, and 10 React views.
- **Reference:** `docs/starter-evaluation.md`

---

### D-02: Pinned Dependency Versions & Local Architecture
- **Date:** 2026-11-05
- **Decision:** Strictly pinned Node 22 LTS, Hardhat 2.29.1, hardhat-toolbox 5.0.0, Solidity 0.8.24, ethers 6.13.5, React 18.3.1, Vite 5, better-sqlite3 11, Express 4.
- **Rationale:** Prevents runtime breakage, breaking changes in ethers v6 vs v5, React 19 hook issues, or Vite 6 deprecations. Ensures 100% offline and reproducible execution with zero external cloud dependencies.

---

### D-03: Deploy Script Relative Path Resolution
- **Date:** 2026-11-05
- **Decision:** Updated path resolution in `blockchain/scripts/deploy.js` from `../` to `../../` relative to `__dirname` (`blockchain/scripts/`).
- **Rationale:** When `deploy.js` runs, `__dirname` is `<root>/blockchain/scripts`. Resolving to `../../frontend/src/contracts` and `../../backend/src` accurately targets the root workspace paths across all platforms (Windows, Linux, macOS) without creating accidental subdirectories inside `blockchain/`.

---

### D-04: Graceful Degradation & Resilient Chain Indexer
- **Date:** 2026-11-05
- **Decision:** Backend acts strictly as a read-only event indexer. If the local chain resets (re-deployed from block 0), the indexer detects the mismatch via `lastBlockHash` and clears SQLite tables automatically. If the backend is offline, the frontend falls back directly to RPC queries via `ethers.js` with a visual status banner.
- **Rationale:** Guarantees that the project core lifecycle demo is resilient during university evaluation, even if one service restarts.
