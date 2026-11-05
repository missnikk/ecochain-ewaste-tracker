# EcoChain: Blockchain-Based E-Waste Collection & Recycling Tracking
## Technical Project Report · Group 15

---

### Abstract
Electronic waste (e-waste) is one of the fastest-growing solid waste streams in the world. Traditional supply chains suffer from information asymmetry, unverified recycling claims, and vulnerability to centralized record manipulation. **EcoChain** implements a decentralized, multi-stakeholder lifecycle management system on an Ethereum-compatible blockchain. Using a single Solidity smart contract (`EWasteTracker.sol`), the system enforces a strict 6-stage lifecycle, role-based access control, mathematical mass-balance verification, cryptographic document hashing, and an automated Green Points incentive model. The architecture is supported by a local event indexer and React frontend, providing an end-to-end, zero-cost, verifiable solution.

---

### 1. Introduction and Problem Statement
Rapid technological turnover has resulted in unprecedented quantities of discarded consumer electronics and industrial equipment. Key industry challenges include:
- **Lack of Multi-Party Provenance:** Devices pass through consumers, informal aggregators, logistics providers, and recyclers without an unalterable audit trail.
- **Greenwashing & False Weight Reporting:** Recyclers may claim to recycle large volumes of e-waste while diverting toxic residuals to unsanctioned landfills.
- **Centralized Database Risks:** Centralized registries are vulnerable to insider fraud, unauthorized database edits, or single points of failure.

---

### 2. Objectives
- Implement an immutable ledger tracking e-waste through six distinct operational states.
- Cryptographically enforce role-based permissions (Regulator, Producer, Consumer, Collector, Recycler).
- Integrate on-chain mass-balance verification (`recoveredGrams + residualGrams == receivedGrams`).
- Enable dual-layer document verification (recycling certificate SHA-256 and device metadata integrity).
- Provide an automated consumer reward mechanism using Green Points.
- Ensure 100% local, free, reproducible execution without third-party cloud or testnet dependencies.

---

### 3. Literature Review
The design builds upon foundational research in decentralized waste accounting:
- **R. W. Ahmad, K. Salah, R. Jayaraman, I. Yaqoob, M. Omar (2021):** *"Blockchain for Waste Management in Smart Cities: A Survey," IEEE Access*, vol. 9. This survey highlights that the primary bottlenecks in smart waste management are trust deficits among unaligned commercial entities and the absence of verifiable physical-to-digital state tracking. EcoChain directly addresses these recommendations through automated state transitions and on-chain mass balance constraints.
- **Related Supply-Chain Projects:** Open-source supply-chain architectures (such as *PlasticTrace* by Sai-Narayana, which was reviewed conceptually during preliminary evaluation) demonstrate multi-persona simulation in local testing. EcoChain develops an independent, end-to-end e-waste lifecycle implementation featuring mathematical mass-balance invariants, automated Green Points, and a chain-reset-resilient SQLite indexer without copying third-party code.

---

### 4. Why Blockchain & Design Decisions
Blockchain is used exclusively for immutable state authority, access control, and mathematical guarantees:
- **State Machine Authority:** Only the smart contract decides whether a transition is permissible.
- **On-Chain vs. Off-Chain Partitioning:** Full technical specifications and catalog data are maintained in a lightweight SQLite database to conserve gas, while their cryptographic SHA-256 hashes are anchored to the blockchain. Any tampering with the database produces an immediate hash mismatch.
- **Decoupled Architecture:** The web frontend interacts directly with the smart contract via RPC, ensuring core operations function even if the indexing backend is offline.

---

### 5. System Architecture, Roles, and Lifecycle
The system partitions responsibilities across five distinct roles:
1. **Regulator (Admin):** Deploys the contract, assigns stakeholder roles, and holds emergency pause authority.
2. **Producer:** Registers manufactured devices into the system, locking in initial category and metadata hashes.
3. **Consumer:** Exercises device ownership and initiates pickup requests.
4. **Collector:** Confirms physical collection and dispatches devices to designated certified recyclers.
5. **Recycler:** Confirms received weights, processes materials, proves mass balance, and anchors certificate hashes.

The 6-stage lifecycle transitions strictly as:
$$\text{Registered (0)} \to \text{PickupRequested (1)} \to \text{Collected (2)} \to \text{InTransit (3)} \to \text{AtRecycler (4)} \to \text{Recycled (5)}$$

---

### 6. Smart Contract Design
`EWasteTracker.sol` is written in Solidity `0.8.24` and compiled using EVM Paris with optimizer runs set to 200:
- **Custom Error Codes:** Standardized `EWT: ...` error prefixes ensure clear revert attribution.
- **Mass Balance Enforcement:**
  $$\text{recoveredGrams} + \text{residualGrams} = \text{receivedGrams}$$
  Transactions failing this assertion revert immediately, preventing fraudulent weight documentation.
- **Dual Hash Verification:**
  - `verifyCertificate(deviceId, certificateHash)`: Validates that the submitted recycling certificate matches the finalized certificate anchored by the recycler.
  - `verifyMetadata(deviceId, metaHash)`: Ensures the device's technical specifications have not been tampered with off-chain.
- **Green Points Distribution:** Automatically credits the original consumer account with $\lfloor \text{recoveredGrams} / 100 \rfloor$ upon completion of recycling.

---

### 7. Implementation Details
- **Blockchain Layer:** Hardhat local node on chainId 31337. Local signers simulate seven distinct personas without hardcoding private keys in source files.
- **Backend Layer:** Express 4 server on port 4000 utilizing `better-sqlite3`. The event indexer synchronizes logs through `ethers.provider.getLogs` and automatically detects chain restarts (resetting SQLite data when block tip hashes change).
- **Frontend Layer:** React 18.3.1 with Vite 5, providing 10 specialized views including persona switching, live lifecycle consoles, document hash comparison, and responsive CSS bar analytics.

---

### 8. Testing and Results
- **Automated Test Suite:** 31 tests executed with Mocha/Chai covering access control, state machine integrity, mass balance assertions, Green Points calculation, pause mechanisms, and negative exploit attempts. All 31 tests passed.
- **Simulated Population:** 30 simulated e-waste devices seeded across all seven official categories (ITEW, CEEW, LSEEW, EETW, TLSEW, MDW, LIW) and all six lifecycle stages.
- **Negative Test Confirmations:** Live transactions confirmed rejections for unauthorized actors (`EWT: caller lacks required role`), invalid weight balances (`EWT: mass balance mismatch`), and tampered hashes.

---

### 9. Security Considerations
- **No Private Keys in Code:** Signers are unlocked development accounts managed by the local node.
- **SQL Injection Prevention:** All database queries utilize parameterized prepared statements.
- **Input Sanitization:** String inputs and weights undergo explicit boundary checks (`receivedGrams > 0`, non-empty hashes).
- **Circuit Breaker:** Emergency `pause()` and `unpause()` functions allow administrators to halt operations during system audits.

---

### 10. Limitations and Future Work
- **Oracle Dependency:** Material weights currently rely on recycler input; future work includes integrating certified IoT industrial scales connected via decentralized oracles (e.g., Chainlink).
- **Layer 2 Deployment:** Deployment on an Ethereum L2 rollup (such as Arbitrum or Base) to support high transaction throughput with negligible gas costs.
- **Decentralized Storage:** Migration of PDF certificates and extended metadata from local SQLite to IPFS/Arweave.
- **Fungible Green Points:** Wrapping Green Points into an ERC-20 standard token to facilitate redemption across partner retail ecosystems.

---

### 11. Conclusion
EcoChain demonstrates a robust, transparent, and computationally verifiable model for managing the e-waste lifecycle. By embedding domain-level mass-balance rules and cryptographic verification into Solidity smart contracts, the system eliminates administrative fraud and greenwashing while incentivizing responsible disposal.
