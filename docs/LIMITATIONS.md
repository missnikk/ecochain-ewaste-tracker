# EcoChain V2 — System Boundaries & Limitations

This document provides a rigorous, honest, and technically precise statement of the assumptions, cryptographic guarantees, and boundaries of the EcoChain V2 prototype. It is intended for examiners, reviewers, and project evaluators.

---

## 1. Local Prototype Architecture

### Why Services Must Be Running Locally
EcoChain is designed as a **free, fully local, self-contained educational prototype**:
- The Ethereum-compatible blockchain runs as a local Hardhat node on `127.0.0.1:8545` (Chain ID `31337`).
- The backend API runs as an Express server on `127.0.0.1:4000` with an embedded SQLite database (`ecochain.db`).
- The frontend runs as a client-side React + Vite single-page application on `127.0.0.1:5173`.

**Operational Consequence:** The application functions only while these background processes are actively executing on the host machine. If the terminal running `npm run chain` is terminated, the blockchain stops producing blocks. The background indexer polling the RPC node every few seconds is the normal synchronization mechanism of an event-driven blockchain indexer.

### Production Contrast
In an enterprise production deployment:
- The smart contract would be deployed to an enterprise permissioned consortium network (e.g., Hyperledger Besu, Polygon Supernets) or a public Ethereum Layer-2 rollup (e.g., Arbitrum, Optimism).
- The indexer and API would run in clustered containers on redundant cloud nodes (e.g., AWS ECS, Kubernetes).
- Wallets would interact through hardware security modules (HSMs) or hardware wallets rather than unlocked local test keys.

---

## 2. Cryptographic Guarantees: What the System Proves

| Component | What EcoChain PROVES Cryptographically | What EcoChain DOES NOT Prove |
| :--- | :--- | :--- |
| **Recycling Certificate** | Proves that an exact, byte-for-byte identical PDF document was certified by an authenticated Recycler wallet address at a verifiable block timestamp. Proves that the document has never been tampered with (even by 1 byte) and has never been reused for another device. | Does **not** prove that the physical electronic device was actually melted down, shredded, or recycled in the physical world. Physical destruction requires external physical plant audits or tamper-evident seals. |
| **Device Metadata** | Proves that the off-chain manufacturer specifications (name, brand, model, serial) stored in SQLite match the cryptographic SHA-256 hash anchored to the blockchain at registration. Any database tampering is immediately detected. | Does **not** prove worldwide uniqueness of physical serial numbers outside the EcoChain contract registry. |
| **Mass-Balance Invariant** | Proves that on-chain reports mathematically satisfy `receivedGrams == recoveredGrams + residualGrams`. Eliminates calculation fraud, over-reporting of recovered materials, and ghost credits. | Does **not** prove that the recycler's physical scales were calibrated correctly or that the weighing process was not falsified off-chain. |
| **Role Authentication** | Proves that only wallets holding the cryptographic role modifier (`Admin`, `Producer`, `Consumer`, `Collector`, `Recycler`) can call corresponding state-transition functions on the smart contract. | Does **not** prevent private key theft if a user's machine or browser extension is compromised. |
| **Green Points** | Proves that tokens/points are deterministically credited according to `recoveredGrams / 100` and can only be redeemed by the legitimate consumer owner with a verified active producer. | Does **not** enforce off-chain commercial terms, tax deductions, or legal warranty obligations. |

---

## 3. Honest Statement of Non-Features (What EcoChain Is NOT)

1. **No Reentrancy Protection Needed:** The contract holds no ETH and transfers no native funds; reentrancy attacks are physically impossible on pure state transition mappings.
2. **No Soulbound Tokens (SBTs) or ERC-721:** Device assets and certificates are tracked through direct Solidity `struct` records, mappings, and events rather than token wrappers, avoiding unnecessary gas overhead.
3. **No Consensus or Mining Mechanism Created:** EcoChain leverages standard Ethereum EVM consensus (PoA / dev automine on Hardhat); it does not innovate or claim new consensus algorithms.
4. **No Off-Chain IPFS Dependency:** Certificate PDFs are stored locally in the backend database and anchored by their cryptographic SHA-256 fingerprint on-chain, keeping the project 100% free, offline, and reliable without pinning fees or external gateways.
5. **Reorg Handling:** The local indexer detects chain resets by comparing the deployed contract code hash and genesis block, wiping the SQLite mirror cleanly when a reset occurs. It does not implement complex multi-block probabilistic reorganization rollbacks because local and consortium networks operate with single-block finality.

---

## 4. Hardware & Scaling Limits

- **Throughput:** Hardhat local node processes transactions in dev-mining mode (instantaneous execution). On an active network, throughput is governed by the underlying EVM block gas limit (~30 million gas / block).
- **Storage:** Storing full PDF binaries in SQLite is suitable for thousands of university demonstration certificates (~3.6 KB per PDF). In large-scale industrial deployment, raw PDF blobs would reside in an S3-compatible decentralized storage network (such as Filecoin or Arweave), with only the hash on-chain.
