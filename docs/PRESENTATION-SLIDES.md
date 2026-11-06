# EcoChain V2 Presentation Slides (12-Slide Master)
## Group 15 · Blockchain Technology Mini Project

---

### Slide 1: Title & Overview
- **Title:** EcoChain V2: Blockchain-Based E-Waste Collection & Recycling Tracking
- **Subtitle:** Verifiable Extended Producer Responsibility (EPR) & Anti-Greenwashing Protocol
- **Group:** Group 15 (Sohan Kateja, Rakshit Golhar, Nikita Khushalani)
- **Core Dish:** A free, fully local, verifiable Web3 application tracking electronic assets through 6 states on an Ethereum-compatible blockchain with mathematical mass balance, duplicate-proof PDF certificates, and Green Points.

---

### Slide 2: The E-Waste Compliance Problem
- **Global Crisis:** Over 60 million metric tons of e-waste generated annually; less than 22% documented.
- **Industry Vulnerabilities:**
  - **Certificate Forgery:** Recyclers issue static PDFs that can be edited, copied, or recycled on paper only.
  - **Ghost Weight Claims:** Recyclers claim recovery without mathematical proof of physical conservation.
  - **Centralized Silos:** Manufacturer registries cannot be independently audited by regulators or citizens.

---

### Slide 3: Key Architectural Innovations in V2
- **Self-Service Role Onboarding:** Open participation with on-chain role enforcement (`Producer`, `Consumer`, `Collector`, `Recycler`, `Admin`).
- **Warranty Device Claiming:** Consumers register ownership by Device ID directly on-chain.
- **On-Chain Mass-Balance Invariant:** Enforces $\text{recoveredGrams} + \text{residualGrams} = \text{receivedGrams}$ at the EVM bytecode level.
- **Duplicate-Proof PDF Certificates:** Built in browser via jsPDF, SHA-256 anchored, protected against hash reuse.
- **Zero-Login Public Verifier:** Drag-and-drop verification with instant 1-byte tamper demonstration.
- **Circular Economic Incentives:** Automated Green Points awarded upon verified recovery and redeemable with producers.

---

### Slide 4: Reference Paper & Literature Context
- **Primary Survey:** R. W. Ahmad et al., *"Blockchain for Waste Management in Smart Cities: A Survey," IEEE Access*, vol. 9, 2021.
- **Design Alignment:**
  - Directly implements paper recommendations: multi-party decentralized access control, transparent custody chains, and automated reward mechanisms.
  - Compares with open-source supply-chain architectures (e.g. *PlasticTrace* by Sai-Narayana, reviewed during planning) while implementing an original, zero-dependency e-waste protocol with mathematical mass-balance invariants.

---

### Slide 5: On-Chain vs. Off-Chain Partitioning
- **On-Chain (Single Source of Truth):**
  - State machine lifecycle (6 states)
  - Role registry & suspension flags
  - Custodian addresses & transfer history
  - Physical mass-balance invariant checks
  - Cryptographic hashes: `metaHash` (canonical JSON) and `certificateHash` (PDF bytes)
  - `certificateDevice[hash]` reverse lookup mapping
  - Green Points balance and redemption counters
- **Off-Chain (Decoupled Performance Layer):**
  - Descriptive specifications (brand, model, serial) stored in SQLite.
  - Raw certificate PDF binaries served via REST streams.
  - Time-series analytics and category aggregations.

---

### Slide 6: Three-Tier System Architecture
```
[ Frontend: React 18 + Vite (Port 5173) ]
     │  - 5 Role Portals with Route Guards
     │  - Dual Wallet: MetaMask (0x7a69) + Demo Accounts #0..#9
     │  - Pure SVG charts (No external chart libraries)
     ▼
[ Blockchain Node: Hardhat (Port 8545, chainId 31337) ]
     │  - EWasteTracker.sol (Solidity 0.8.24)
     │  - Direct RPC readContract / writeContract
     ▼
[ Backend API & Event Indexer: Express + SQLite (Port 4000) ]
     - Event indexer with automated chain-reset detection
     - 3MB payload support for certificate uploads and downloads
```

---

### Slide 7: Five Stakeholder Roles & 6-Stage Lifecycle
- **Regulator (Admin):** Participant management, account suspension/reinstatement, circuit-breaker pause.
- **Producer:** Device registration with printable warranty claim cards, points redemption counter.
- **Consumer:** Warranty device claiming, eco-pickup requests, Green Points management.
- **Collector:** Pickup confirmation, in-custody inventory, consignments to licensed recyclers.
- **Recycler:** Gross intake weighing, mass-balance breakdown, certificate generation & hash anchoring.

$$\text{Registered} \xrightarrow{\text{claim + pickup}} \text{PickupRequested} \xrightarrow{\text{collect}} \text{Collected} \xrightarrow{\text{dispatch}} \text{InTransit} \xrightarrow{\text{weigh}} \text{AtRecycler} \xrightarrow{\text{certify}} \text{Recycled}$$

---

### Slide 8: The Recycling Certificate Protocol
1. **Intake:** Recycler records received gross weight on-chain (`confirmReceipt`).
2. **Mass Balance:** Recycler specifies recovered commodity and residual waste. Frontend and smart contract enforce `recovered + residual == received`.
3. **jsPDF Generation:** App compiles official certificate PDF once with full provenance metadata.
4. **Byte Hashing:** Browser computes SHA-256 fingerprint of the exact PDF array buffer.
5. **On-Chain Anchoring:** `completeRecycling` verifies that `certificateDevice[hash] == 0` (duplicate protection) and stores the hash permanently.
6. **Backend Storage:** Exact raw bytes uploaded to backend; backend verifies hash before storing.

---

### Slide 9: Public Verification & Tamper Demonstration
- **Zero-Login Verification:** Any citizen or regulator opens `/verify`, drops the PDF, and the browser hashes it locally.
- **Reverse Lookup:** Smart contract inspects `certificateDevice(hash)`:
  - If valid: displays Device ID, Recycler address, Producer, timestamp, and certified weights (✅).
  - If tampered: returns 0; UI alerts that file has been altered or forged (❌).
- **The Viva 1-Byte Tamper Demo:** Clicking the test button modifies byte #42 of the authentic PDF in memory. The SHA-256 hash completely changes, instantly proving cryptographic tamper-evidence live!

---

### Slide 10: Circular Economy: Green Points Model
- **Deterministic Earning:** $\lfloor \text{recoveredGrams} / 100 \rfloor$ Green Points awarded directly to the original consumer owner upon verified recycling completion.
- **Producer Redemption:** Consumers spend points with registered manufacturers (`redeemPoints`) to receive warranty discounts or purchase credits.
- **On-Chain Proof:** Producer counters track cumulative points redeemed, proving real corporate sustainability engagement to regulators.

---

### Slide 11: Testing, Verification & Metrics
- **Mocha/Chai Unit Tests:** **54 passing tests** (target was $\ge 45$) covering all modifiers, invariants, roles, and edge cases.
- **Automated E2E Suite:** **22 passing tests** (`npm run e2e`) executing the complete live flow on running nodes.
- **Simulated Population:** 30 realistic devices seeded across all 7 EPR categories and all 6 lifecycle stages.
- **Fault-Tolerant Offline Behavior:** If the backend indexer stops, the public dashboard and role portals degrade gracefully and continue reading live data directly from the blockchain.

---

### Slide 12: Summary & Impact
- **Trustless EPR Accounting:** Eliminates greenwashing by replacing unverifiable paper claims with on-chain mass-balance math and cryptographic document fingerprints.
- **100% Free & Local:** Built without paid APIs, testnets, or cloud services; starts with a single double-click on `start-demo.bat`.
- **Examiner Takeaway:** EcoChain is technically sound, mathematically validated, fully tested, and ready for immediate live defense.
