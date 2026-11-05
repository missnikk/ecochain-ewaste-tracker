# EcoChain Presentation Slides (12-Slide Master)

---

### Slide 1: Title & Team
- **Title:** EcoChain: Blockchain-Based E-Waste Collection & Recycling Tracking
- **Subtitle:** A Verifiable, Multi-Party Lifecycle Accounting Architecture
- **Group:** Group 15
- **Members:** Sohan Kateja, Rakshit Golhar, Nikita Khushalani
- **Course:** Blockchain Technology Mini Project

---

### Slide 2: The E-Waste Problem
- Global e-waste generation exceeds 60 million metric tons annually; less than 20% is properly documented and recycled.
- Centralized tracking systems suffer from:
  - Isolated siloed databases prone to internal tampering.
  - Fraudulent weight claims and recycling greenwashing.
  - Lack of trust between producers, consumers, informal collectors, and certified recyclers.

---

### Slide 3: Objectives & Key Innovations
- Establish an immutable single source of truth across 5 untrusted stakeholders.
- Enforce strict state-machine lifecycle rules at the smart contract EVM level.
- Introduce **domain-level mass-balance mathematical validation** (`recovered + residual == received`).
- Provide dual cryptographic integrity: recycling certificate hash and off-chain metadata hash.
- Automate circular economy incentives via on-chain **Green Points**.

---

### Slide 4: Reference Paper & Literature Mapping
- **Reference:** R. W. Ahmad et al., *"Blockchain for Waste Management in Smart Cities: A Survey,"* IEEE Access, vol. 9, 2021.
- **Mapping:**
  - Addresses the surveyed gaps in multi-stakeholder governance and lack of verifiable audit trails.
  - Combines on-chain state authority with lightweight, zero-cost local indexing.

---

### Slide 5: Why Blockchain? (On-Chain vs. Off-Chain Partitioning)
- **On-Chain:** State machine status, role permissions, custody history, mass-balance assertions, certificate & metadata SHA-256 hashes, Green Points ledger.
- **Off-Chain:** Full descriptive metadata (device specifications, serials), regulatory catalog descriptions, and aggregated time-series analytics.
- **Why?** Minimizes gas overhead while cryptographically preventing off-chain database alterations.

---

### Slide 6: System Architecture
- **Layer 1 (Blockchain):** Local Ethereum-compatible node (Hardhat, chainId 31337) executing `EWasteTracker.sol`.
- **Layer 2 (Indexer & Cache):** Node.js/Express + SQLite engine indexing chain events with automatic chain-reset recovery.
- **Layer 3 (Frontend):** React 18 + Vite client with direct RPC signing via unlocked persona wallets.

---

### Slide 7: Stakeholder Roles & 6-Stage Lifecycle
- **Roles:** Admin (Regulator), Producer, Consumer, Collector, Recycler.
- **State Machine:**
  $$\text{Registered} \longrightarrow \text{PickupRequested} \longrightarrow \text{Collected} \longrightarrow \text{InTransit} \longrightarrow \text{AtRecycler} \longrightarrow \text{Recycled}$$
- Only authorized actors can invoke specific transitions; out-of-order transitions strictly revert.

---

### Slide 8: Smart Contract Highlights
- Written in **Solidity 0.8.24** with custom error codes (`EWT: ...`).
- **Modifiers:** `onlyRole`, `whenNotPaused`, `validStageTransition`.
- **Mass-Balance Check:**
  ```solidity
  require(recoveredGrams + residualGrams == dev.receivedGrams, "EWT: mass balance mismatch");
  ```
- **Emergency Circuit Breaker:** Admin-controlled pause/unpause for incident management.

---

### Slide 9: Live Demonstration Workflow
1. **Producer** registers a device (Dell Latitude 5420) with SHA-256 metadata hash.
2. **Consumer** requests pickup from their dashboard.
3. **Collector** confirms collection and dispatches to certified recycler.
4. **Recycler** confirms received weight (2000g).
5. **Recycler** inputs mass balance (1600g recovered + 400g residual = 2000g) and anchors certificate hash.
6. **Consumer** instantly receives 16 Green Points; public verifies certificate authenticity.

---

### Slide 10: Testing, Verification & Security
- **Comprehensive Test Suite:** 31 unit & integration tests covering positive paths, boundary conditions, and negative exploits.
- **Documented Rejections:**
  - Unauthorized invocation: Reverted with `"EWT: caller lacks required role"`.
  - Mismatched mass balance: Reverted with `"EWT: mass balance mismatch"`.
  - Fake certificates: Rejected by `verifyCertificate()`.
- Zero private keys in code; sanitized database queries; strict input validations.

---

### Slide 11: Limitations & Production Roadmap
- **Current Constraints:** Local Hardhat environment, unlocked development accounts, simulated seed data.
- **Production Roadmap:**
  - Migration to Ethereum Layer 2 rollup (Arbitrum/Optimism) for low transaction fees.
  - Integration with decentralized storage (IPFS/Filecoin) for PDF certificate hosting.
  - Hardware IoT oracle integration (RFID/smart weighing scales at collection centers).
  - ERC-20 token standard conversion for Green Points with exchange utility.

---

### Slide 12: Conclusion & Q&A
- EcoChain successfully demonstrates that decentralized trust, verifiable custody, and strict domain validation can eliminate greenwashing in e-waste recycling.
- Fully free, local, reproducible, and verifiable.
- **Thank you! Questions & Answers.**
