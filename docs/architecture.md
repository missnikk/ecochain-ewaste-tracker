# EcoChain V2 System Architecture & Specification

## 1. System Architecture Diagram

```mermaid
flowchart TB
    subgraph Client ["Frontend (Port 5173 - React 18 + Vite)"]
        UI["5 Role Portals + 4 Public Views\n(Regulator, Producer, Consumer, Collector, Recycler\nDashboard, Track, Verify, Landing)"]
        WalletLayer["Wallet Layer (wallet.jsx)\n- MetaMask BrowserProvider (0x7a69 / 31337)\n- Demo Accounts #0..#9 fallback\n- On-Chain Role & Suspension Detection"]
        Signer["Active ethers.js v6 Signer\n(Signs state transitions)"]
        HashCalc["Browser WebCrypto SHA-256 Engine\n- Metadata hashing (canonical JSON)\n- jsPDF raw bytes hashing"]
    end

    subgraph Blockchain ["Ethereum Compatible Node (Port 8545 - Hardhat 2.29.1)"]
        Node["Hardhat Local Node\n(chainId: 31337)"]
        Contract["EWasteTracker.sol (V2 Contract of Record)\n- Self-Service Role Registry (selfRegister)\n- Device Claiming (claimDevice)\n- Mass-Balance Invariant Enforcement\n- Certificate Hash Duplicate Guard (certificateDevice)\n- Green Points Engine & Redemption\n- Regulator Pause & Account Suspension"]
    end

    subgraph BackendStore ["Backend & Indexer (Port 4000 - Node 22 + Express)"]
        API["Express 4 REST Endpoints\n- /api/health (sync status)\n- /api/participants (from RoleAssigned)\n- /api/certificates/:id (POST with hash check, GET stream)\n- /api/analytics (KPIs, categories, daily trends, leaderboard)"]
        Indexer["Resilient Event Indexer\n(Syncs V2 events, handles chain resets)"]
        DB[("better-sqlite3 Database\n(ecochain.db: events, devices, metadata, participants, certificates)")]
    end

    %% Client Interactions
    UI --> WalletLayer
    WalletLayer --> Signer
    Signer -->|"Direct EVM Transactions\n(selfRegister, registerDevice, claimDevice, etc.)"| Contract
    HashCalc -->|"Anchored Hashes\n(metaHash & certificateHash)"| UI
    UI -->|"Read Indexed Metadata & Analytics"| API
    UI -->|"Public Reverse Lookup\n(certificateDevice(hash))"| Contract

    %% Backend Interactions
    Indexer -->|"Polls Event Logs\n(provider.getLogs)"| Contract
    Indexer -->|"Persists Tables"| DB
    API -->|"Queries Data & Serves PDFs"| DB
```

---

## 2. E-Waste Lifecycle State Machine (V2)

```mermaid
stateDiagram-v2
    [*] --> Registered: registerDevice(category, metaHash, note)\n[Producer Role]
    Registered --> Registered: claimDevice(id, note)\n[Consumer Role claims ownership]
    Registered --> PickupRequested: requestPickup(id, note)\n[Device Owner / Consumer]
    PickupRequested --> Collected: confirmCollection(id, note)\n[Collector Role]
    Collected --> InTransit: dispatchToRecycler(id, recycler, note)\n[Current Custodian / Collector]
    InTransit --> AtRecycler: confirmReceipt(id, receivedGrams, note)\n[Designated Recycler Role]
    AtRecycler --> Recycled: completeRecycling(id, recov, resid, certHash, note)\n[Designated Recycler Role]\nInvariant: recov + resid == received\nGuard: certificateDevice[certHash] == 0
    Recycled --> [*]

    note right of Recycled
        - Certificate SHA-256 hash anchored
        - Raw PDF uploaded to backend
        - Duplicate hash reuse blocked
        - Green Points awarded (recov / 100)
    end note
```

---

## 3. Certificate Generation & Verification Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Recycler as Recycler Wallet
    participant Frontend as Frontend Browser (jsPDF + WebCrypto)
    participant Contract as EWasteTracker.sol
    participant Backend as Backend API & SQLite
    actor Public as Public Verifier (Any Browser)

    Note over Recycler,Frontend: Device is in AtRecycler status
    Recycler->>Frontend: Enters recoveredGrams (1500g) + residualGrams (500g)
    Frontend->>Frontend: Generates official PDF certificate in memory (ECO-CERT-N)
    Frontend->>Frontend: Computes SHA-256 hash of PDF bytes
    Frontend->>Contract: completeRecycling(id, 1500, 500, certHash)
    Note over Contract: Checks mass balance & certificateDevice[certHash] == 0
    Contract-->>Frontend: Transaction Confirmed (Status = Recycled)
    Frontend->>Backend: POST /api/certificates/:id { filename, base64 }
    Note over Backend: Validates SHA-256(bytes) == contract.certificateHash
    Backend-->>Frontend: 200 OK (Stored)

    Note over Public,Contract: Public Verification (No Wallet Needed)
    Public->>Frontend: Uploads / Drops certificate PDF
    Frontend->>Frontend: Computes SHA-256 hash locally in browser
    Frontend->>Contract: certificateDevice(hash)
    alt Hash exists on chain
        Contract-->>Frontend: Returns deviceId > 0
        Frontend->>Contract: getDevice(deviceId)
        Frontend-->>Public: Displays ✅ Authentic Certificate with details & weights
    else Hash does not exist or tampered
        Contract-->>Frontend: Returns 0
        Frontend-->>Public: Displays ❌ Tampered / Unregistered Certificate
    end
```

---

## 4. On-Chain Role Matrix & Security Enforcements

| Role | Numerical ID | Onboarding Method | Primary Smart Contract Permissions |
| :--- | :---: | :--- | :--- |
| **None** | `0` | Default state for new wallets | Read-only queries (`getDevice`, `certificateDevice`, `getHistory`). Cannot send state transitions. |
| **Admin (Regulator)** | `1` | Deployer wallet (`msg.sender` in constructor) | `assignRole`, `setSuspended`, `setPaused`. Cannot change own role or suspend self. |
| **Producer** | `2` | `selfRegister(2)` or Admin override | `registerDevice`. Target for `redeemPoints`. |
| **Consumer** | `3` | `selfRegister(3)` or Admin override | `claimDevice`, `requestPickup`, `redeemPoints`. Receives Green Points. |
| **Collector** | `4` | `selfRegister(4)` or Admin override | `confirmCollection`, `dispatchToRecycler`. Acts as middleman logistics custodian. |
| **Recycler** | `5` | `selfRegister(5)` or Admin override | `confirmReceipt`, `completeRecycling` (anchors certificate hash & checks mass balance). |
