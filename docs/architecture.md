# EcoChain System Architecture & Diagrams

## 1. System Architecture Diagram

```mermaid
flowchart TB
    subgraph Client ["Frontend (Port 5173 - React 18 + Vite)"]
        UI["10 UI Views\n(Dashboard, Register, Track, Recycler, etc.)"]
        Switcher["Persona Switcher\n(Admin, Producer, Consumer, Collector, Recycler)"]
        Signer["ethers.js v6 Signer\n(Local Node Signers #0..#6)"]
        HashCalc["Browser SHA-256 Hashing\n(Crypto Subtle / Web APIs)"]
    end

    subgraph Blockchain ["Ethereum Compatible Node (Port 8545 - Hardhat 2.29)"]
        Node["Hardhat Local Node\n(chainId: 31337)"]
        Contract["EWasteTracker.sol\n- State Machine (6 stages)\n- Role-based Access Control\n- Mass-Balance Enforcement\n- Green Points Engine\n- Certificate & Metadata Anchors"]
    end

    subgraph BackendStore ["Backend & Indexer (Port 4000 - Node/Express)"]
        API["Express 4 REST Endpoints\n(/api/health, /api/catalog, /api/devices, /api/analytics)"]
        Indexer["Resilient Event Indexer\n(Syncs blocks & detects chain resets)"]
        DB[("better-sqlite3 Database\n(ecochain.db: events, devices, metadata, catalog)")]
    end

    %% Client Interactions
    UI --> Switcher
    Switcher --> Signer
    Signer -->|"Direct Transactions & Queries\n(writeContract / readContract)"| Contract
    HashCalc -->|"Precomputed Hashes\n(metaHash & certificateHash)"| UI
    UI -->|"Read Analytics & Off-Chain Metadata"| API

    %% Backend Interactions
    Indexer -->|"Polls Events / Logs\n(Provider.getLogs)"| Contract
    Indexer -->|"Persists Devices & Events"| DB
    API -->|"Reads Catalog & Analytics"| DB
```

---

## 2. E-Waste Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> Registered: registerDevice()\n[Producer Role]
    Registered --> PickupRequested: requestPickup()\n[Device Owner / Consumer]
    PickupRequested --> Collected: confirmCollection()\n[Collector Role]
    Collected --> InTransit: dispatchToRecycler()\n[Current Custodian / Collector]
    InTransit --> AtRecycler: confirmReceipt(weight)\n[Designated Recycler]
    AtRecycler --> Recycled: completeRecycling(recovered, residual, certHash)\n[Designated Recycler]\n(Enforces: recovered + residual == received)
    Recycled --> [*]

    note right of Recycled
        - Certificate SHA-256 hash anchored
        - Green Points awarded to Consumer
        (points = recoveredGrams / 100)
    end note
```

---

## 3. On-Chain vs. Off-Chain Data Storage Division

| Data Field | Storage Location | Security & Integrity Mechanism |
| :--- | :--- | :--- |
| **Device ID & Status (0..5)** | On-Chain (`EWasteTracker.sol`) | Immutable state machine with cryptographically enforced access control |
| **Custody & Ownership History** | On-Chain (`EWasteTracker.sol`) | Appended to `history` array on every validated transition |
| **Weights & Mass-Balance** | On-Chain (`EWasteTracker.sol`) | Smart contract assertion: `require(recovered + residual == received)` |
| **Certificate SHA-256 Hash** | On-Chain (`EWasteTracker.sol`) | Publicly verifiable via `verifyCertificate(deviceId, hash)` |
| **Metadata SHA-256 Hash** | On-Chain (`EWasteTracker.sol`) | Verified on-chain via `verifyMetadata(deviceId, hash)` |
| **Device Metadata (Name, Serial, Specs)** | Off-Chain (SQLite database) | Off-chain details can be altered, but any tampering mismatches on-chain `metaHash` |
| **E-Waste Catalog (7 Categories & Codes)**| Off-Chain (SQLite database) | Seeded from standard regulatory classifications (ITEW, CEEW, etc.) |
| **Historical Analytics & Aggregates** | Off-Chain (SQLite database) | Populated through continuous background indexing of blockchain event logs |
