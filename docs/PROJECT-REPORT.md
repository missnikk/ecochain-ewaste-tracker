# EcoChain V2: Blockchain-Based E-Waste Collection & Recycling Tracking
## Technical Project Report · Group 15 (Version 2)

---

### Abstract
Electronic waste (e-waste) is one of the fastest-growing solid waste streams globally. Traditional Extended Producer Responsibility (EPR) compliance suffers from information asymmetry, unverified recycling claims, forged recycling certificates, and centralized record manipulation. **EcoChain V2** is a decentralized, multi-stakeholder lifecycle management web application running on an Ethereum-compatible local blockchain (`chainId: 31337`). Powered by a single Solidity smart contract (`EWasteTracker.sol`), the system enforces a strict 6-stage lifecycle, self-service role onboarding, consumer warranty device claiming, mathematical mass-balance verification (`recoveredGrams + residualGrams == receivedGrams`), duplicate certificate protection, client-side PDF certificate generation and SHA-256 hash anchoring, and an automated Green Points reward and redemption economy. The architecture is supported by a resilient SQLite event indexer and a modern React single-page application supporting MetaMask and demo wallets across five role portals.

---

### 1. Introduction and Problem Statement
Rapid electronic obsolescence has created millions of tons of discarded hardware. Under current EPR laws, manufacturers must prove their products were responsibly collected and recycled. Key industry failures include:
- **Paper & PDF Forgery:** Recyclers often issue static PDF certificates that can be trivially edited, reused for multiple devices, or fabricated without verification.
- **Ghost Recycling & Weight Fraud:** Recyclers inflate recovered commodity weights while dumping hazardous fractions into informal landfills.
- **Traceability Gaps:** Ownership transfers between consumers, informal aggregators, logistics collectors, and recyclers lack an immutable audit trail.
- **Centralized Database Vulnerabilities:** Centralized registries are vulnerable to insider fraud, data tampering, or single points of failure.

---

### 2. Objectives
- Implement an immutable ledger tracking e-waste across six distinct operational states: `Registered → PickupRequested → Collected → InTransit → AtRecycler → Recycled`.
- Provide self-service cryptographic role registration (`Producer`, `Consumer`, `Collector`, `Recycler`) with Regulator oversight (suspension, role override, and circuit-breaker pause).
- Mathematically enforce the physical mass-balance invariant on-chain:
  $$\text{recoveredGrams} + \text{residualGrams} = \text{receivedGrams}$$
- Implement duplicate-proof certificate anchoring: ensure each certificate hash can only be used once on the entire blockchain.
- Provide client-side cryptographic certificate generation (jsPDF) and zero-login public file verification with 1-byte tamper demonstration.
- Automate a circular economic incentive model with Green Points earned by consumers and redeemed with registered producers.
- Ensure 100% local, free, reproducible execution without third-party cloud, IPFS, or paid API dependencies.

---

### 3. Literature Review & Related Work
The design synthesizes principles from supply-chain provenance and decentralized environmental compliance:
- **R. W. Ahmad, K. Salah, R. Jayaraman, I. Yaqoob, M. Omar (2021):** *"Blockchain for Waste Management in Smart Cities: A Survey," IEEE Access*, vol. 9. Emphasizes that trust deficits among unaligned commercial entities and the absence of verifiable physical-to-digital state tracking are the primary bottlenecks in smart waste management. EcoChain addresses these recommendations directly through smart contract state transitions and on-chain mass-balance constraints.
- **Related Open-Source Supply-Chain Implementations:** Conceptual architectures (such as *PlasticTrace* by Sai-Narayana, reviewed during initial project scoping) demonstrate multi-persona simulation on Hardhat. EcoChain implements an independent, full-stack e-waste architecture with mathematical mass-balance invariants, duplicate certificate protection, client-side PDF hashing, a resilient SQLite indexer, and dual-wallet connection without reusing third-party code.

---

### 4. Why Blockchain & Architectural Decisions
Blockchain is used strictly for state authority, access control, and mathematical proof:
- **State Machine Authority:** Only the smart contract decides whether a transition is valid. A consumer cannot register devices; a collector cannot complete recycling.
- **Dual-Layer Hash Anchoring:** Full product catalogs and raw PDFs are stored off-chain in SQLite to minimize gas costs, while their cryptographic SHA-256 hashes are anchored to the blockchain. If database records are edited off-chain, the frontend immediately flags a hash mismatch.
- **Decoupled Client Architecture:** The React frontend connects directly to the blockchain via RPC. If the backend server stops, the public dashboard, tracking, and role portals continue operating directly against the smart contract.

---

### 5. System Architecture, Roles, and Lifecycle
The architecture partitions responsibilities across five distinct roles:
1. **Regulator (Admin):** Deploys the contract, oversees participant registries, holds emergency pause authority, and can suspend/reinstate non-compliant accounts.
2. **Producer:** Self-registers, registers manufactured electronic devices with canonical metadata hashes, and honors consumer Green Points vouchers.
3. **Consumer:** Self-registers, claims warranty ownership of purchased devices by ID, schedules certified e-waste pickups, and earns/redeems Green Points.
4. **Collector:** Self-registers, verifies physical collection from consumers, maintains custody, and dispatches consignments to licensed recyclers.
5. **Recycler:** Self-registers, confirms physical intake weighing, inputs recovered/residual material weights under mass-balance verification, generates and anchors official PDF certificates, and uploads files to the indexer.

The 6-stage lifecycle transitions strictly as:
$$\text{Registered (0)} \to \text{PickupRequested (1)} \to \text{Collected (2)} \to \text{InTransit (3)} \to \text{AtRecycler (4)} \to \text{Recycled (5)}$$

---

### 6. The Recycling Certificate: End-to-End
1. **Generation:** When a Recycler confirms mass balance, the frontend builds the official recycling certificate in browser memory using `jsPDF` (incorporating device ID, category, participant addresses, timestamps, and mass-balance breakdown).
2. **Hashing:** The browser calculates the SHA-256 digest of the exact PDF bytes using WebCrypto (`crypto.subtle.digest`).
3. **Anchoring:** The transaction `completeRecycling(..., certHash)` sends the hash to the contract. The contract checks `certificateDevice[certHash] == 0` (preventing certificate reuse) and maps the hash to the device ID.
4. **Storage:** The raw PDF bytes are uploaded to `POST /api/certificates/:deviceId`. The backend independently recalculates the SHA-256 hash and rejects any upload that does not match the on-chain hash.
5. **Public Verification:** Any citizen or regulator visits `/verify` without logging in. Dropping the PDF recalculates the SHA-256 hash in browser memory and queries `certificateDevice(hash)`. If found, the contract returns the device ID and displays full recycling proof (✅). If altered even by 1 byte, the hash differs and the check fails (❌).

---

### 7. Implementation Stack & Technical Metrics
- **Smart Contract:** Solidity `0.8.24` (EVM Paris, 200 optimizer runs), Hardhat `2.29.1`, `chainId: 31337`.
- **Backend:** Node.js 22 LTS, Express 4, `better-sqlite3` 11. Event indexer with automated chain-reset detection and 3MB payload support for binary PDF streams.
- **Frontend:** React `18.3.1`, Vite 5, `ethers@6.13.5`, `jspdf@2.5.2`, `lucide-react@0.383.0`. Plain CSS design system (`#0b3d33` dark green palette, pure SVG donut and bar charts, responsive tables).
- **Wallet Layer:** `WalletProvider` supporting both browser MetaMask (with automated chain switching to `0x7a69`) and unlocked Hardhat demo accounts #0 to #9.

---

### 8. Testing, Verification & Results
- **Unit Test Suite:** 54 passing automated tests in `blockchain/test/EWasteTracker.test.js` covering self-registration, role access controls, suspension/reinstatement, device claiming, mass balance, certificate uniqueness, Green Points, and pause circuit-breakers.
- **Simulated Population:** 30 simulated e-waste devices seeded across all 7 EPR categories and all 6 lifecycle stages with unique generated certificates.
- **End-to-End (E2E) Test Suite:** 22/22 passing automated tests in `blockchain/scripts/e2e.js` (`npm run e2e`) validating the full live pipeline, negative rejections, duplicate hash rejection, and byte-level certificate downloads.

---

### 9. Limitations & Boundaries
- **Physical Weighing:** While the smart contract proves that reported weights satisfy `received == recovered + residual`, it cannot physically verify scale accuracy without IoT-connected certified hardware scales.
- **Local Scope:** EcoChain V2 is designed as a self-contained local educational prototype; a production rollout would deploy to an enterprise L2 rollup or consortium network.

---

### 10. Conclusion
EcoChain V2 proves that combining domain-specific mass-balance invariants, cryptographic document hashing, and role-based smart contracts solves the critical trust and fraud vulnerabilities in modern electronic waste recycling.
