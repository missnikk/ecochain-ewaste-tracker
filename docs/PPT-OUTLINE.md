# Presentation Slides Text Outline (docs/PPT-OUTLINE.md)

> **Instructions for the Student:** Copy and paste the text from each slide below into Microsoft PowerPoint or Google Slides. Add the corresponding screenshots from `docs/SCREENSHOT-CHECKLIST.md` where indicated.

---

### Slide 1: Title Slide
- **Title:** EcoChain: Decentralized E-Waste Lifecycle & Compliance Tracking
- **Subtitle:** An Ethereum-Compatible Multi-Party Accounting Prototype
- **Course:** Blockchain Technology Mini Project (Group 15)
- **Team Members:** Sohan Kateja, Rakshit Golhar, Nikita Khushalani
- **Visual:** EcoChain logo or system hero screen (`screenshots/01-landing-role-chooser.png`)

---

### Slide 2: The E-Waste Governance Problem
- **Rapid Technology Turnover:** Electronic waste is the world's fastest-growing domestic waste stream.
- **Critical Failure Points:**
  - **Information Asymmetry:** Devices pass through uncoordinated stakeholders (consumers, informal collectors, recyclers).
  - **Recycling Fraud / Greenwashing:** False reporting of recycling volumes to claim Extended Producer Responsibility (EPR) credits.
  - **Vulnerable Centralized Databases:** Paper trails and central spreadsheets are trivially altered during audits.

---

### Slide 3: Objectives & Key Innovations
- Establish an immutable single source of truth across five untrusted stakeholders.
- Enforce strict state-machine lifecycle rules at the EVM smart contract layer.
- **Mathematical Invariant Verification:** Automated on-chain mass-balance validation ($\text{recovered} + \text{residual} = \text{received}$).
- **Dual Cryptographic Anchoring:** SHA-256 fingerprinting for recycling certificates and device metadata.
- **Incentive Automation:** On-chain Green Points awarded to consumers and redeemable with producers.

---

### Slide 4: Literature Review & Context
- **Primary Reference:** R. W. Ahmad et al., *"Blockchain for Waste Management in Smart Cities: A Survey," IEEE Access*, vol. 9, 2021.
  - Highlights trust deficits between commercial competitors and absence of verifiable audit trails.
- **Related Work in Open Source:** Several supply chain tracking repos explore multi-party handoffs. EcoChain advances beyond generic tracking by introducing specific domain checks (mass-balance equations and non-duplicable certificates).

---

### Slide 5: Why Blockchain? (On-Chain vs. Off-Chain Partitioning)
- **On-Chain (Ethereum EVM):**
  - State machine transitions (6 lifecycle stages).
  - Role permissions and suspensions.
  - Mass-balance mathematical assertion.
  - SHA-256 certificate and metadata hashes.
  - Green Points ledger and point redemption counters.
- **Off-Chain (SQLite Cache & Files):**
  - Extended hardware descriptions, serial numbers, PDF certificate files.
- **Design Principle:** Minimizes blockchain execution overhead while using cryptographic hashes to make off-chain database tampering instantly detectable.

---

### Slide 6: System Architecture
- **Layer 1: Blockchain Core (Port 8545)**
  - Local Hardhat node (`chainId: 31337`) executing `EWasteTracker.sol`.
- **Layer 2: Event Indexer & Database (Port 4000)**
  - Node.js / Express event consumer maintaining a fast SQLite cache with chain-reset resilience.
- **Layer 3: Frontend Client (Port 5173)**
  - React 18 + Vite interface supporting both demo signers and MetaMask wallet extension.

---

### Slide 7: Stakeholder Roles & 6-Stage Lifecycle
- **5 Roles:** Regulator (Admin), Producer, Consumer, Collector, Recycler.
- **6 Operational Stages:**
  $$\text{Registered} \longrightarrow \text{PickupRequested} \longrightarrow \text{Collected} \longrightarrow \text{InTransit} \longrightarrow \text{AtRecycler} \longrightarrow \text{Recycled}$$
- **Self-Service Role Selection:** Wallets self-register once; the Regulator retains suspension powers for governance.

---

### Slide 8: Smart Contract Engineering Highlights
- Written in **Solidity 0.8.24** with custom error codes (`EWT: ...`).
- **Core Rules Enforced in Bytecode:**
  - `require(recoveredGrams + residualGrams == d.receivedGrams, "EWT: mass balance mismatch");`
  - `require(certificateDevice[certificateHash] == 0, "EWT: certificate already used");`
  - Emergency circuit breaker: `setPaused(true)` to halt operations during system audits.

---

### Slide 9: Live Demonstration Walkthrough
1. **Producer:** Registers laptop $\to$ generates Device ID & claim code.
2. **Consumer:** Claims device $\to$ requests pickup.
3. **Collector:** Confirms collection $\to$ dispatches to designated recycler.
4. **Recycler:** Weighs package $\to$ inputs recovered/residual mass $\to$ generates PDF certificate $\to$ anchors SHA-256 hash.
5. **Consumer:** Automatically receives Green Points $\to$ redeems points with Producer for discount voucher.

---

### Slide 10: Verification, Security & Testing
- **Automated Test Suite:** Comprehensive unit & integration tests covering positive flows and exploit vectors.
- **Rejection Demonstrations (Faculty Proof):**
  - Unauthorized actor invocation reverts with `"EWT: caller lacks required role"`.
  - Mismatched mass balance reverts with `"EWT: mass balance mismatch"`.
  - Tampered certificate fails verification with `"Does not match"`.
- **Zero Private Keys:** Unlocked development signers used locally without storing credentials in code.

---

### Slide 11: Real-World Limitations & Production Roadmap
- **Current Limitations:**
  - Local single-node development chain; physical weights rely on recycler honesty (oracle limitation).
  - Open self-registration requires regulator monitoring and off-chain licensing checks.
- **Production Roadmap:**
  - Deploy to an Ethereum Layer 2 rollup (Arbitrum/Optimism) for low transaction gas.
  - Connect certified industrial scales via IoT oracles (e.g., Chainlink) for tamper-proof weight data.
  - Store certificate files on decentralized storage (IPFS/Arweave).

---

### Slide 12: Conclusion & Q&A
- **Summary:** EcoChain demonstrates how blockchain smart contracts can replace fragile paper and database promises with verifiable mathematical accounting in e-waste recycling.
- **Open Source Repository:** `https://github.com/missnikk/ecochain-ewaste-tracker`
- **Thank you! We welcome your questions.**
