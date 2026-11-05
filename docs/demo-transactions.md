# EcoChain Real Transaction Logs & Negative Test Verification

This document records live on-chain execution evidence from the EcoChain deployment on Hardhat local node (Chain ID `31337`).

---

## 1. Deployment Information

- **Contract Name:** `EWasteTracker`
- **Contract Address:** `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- **Admin / Deployer:** `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` (Hardhat Account #0)
- **Deployment Transaction:** Block 0 -> 1

### Initial Role Assignments (Deploy Script)
| Role Name | Enum ID | Assigned Address | Transaction Hash | Block |
| :--- | :--- | :--- | :--- | :--- |
| **Producer** | 2 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0xc759d6a4d6380ee81e423967a770898cecda55d6d91ad4e97a1313bc69fe2ec0` | 1 |
| **Consumer A** | 3 | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | `0x392982dd265743170f37acc4f03d9673bffa917e44a197b710254e20293d8f0d` | 2 |
| **Consumer B** | 3 | `0x976EA74026E726554dB657fA54763abd0C3a0aa9` | `0xff3922964b6332b901a08b53c8e9b946e5107308db846484ff9b4ba02c9b441d` | 3 |
| **Collector** | 4 | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | `0xd125df4c7d3d657dc1c2e89ebdd1eb194655d99d598b060d93116143ccd81e98` | 4 |
| **Recycler** | 5 | `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` | `0x4877992322562af14d19efee4525638676f77547f3c06740518d079cc2c9be31` | 5 |

---

## 2. Complete Positive Lifecycle Trace (Device ID #1: Dell Latitude 5420)

| Stage | Action / Function | Calling Persona & Address | Tx Hash | Block | Gas / Output |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **0. Registered** | `registerDevice(1, metaHash, owner, "Registered by producer")` | Producer (`0x7099...79C8`) | `0x04af3755ee1d211bdae7f70588ab7b1622001fb7af34153e73401f465cada498` | 7 | Device ID 1 created |
| **1. PickupRequested** | `requestPickup(1, "Pickup requested")` | Consumer A (`0x3C44...93BC`) | `0xf06199d6ca2468bced4c74cd68e763e9ea78594b3a481d6e56f6e66ce22d2679` | 8 | Status -> 1 |
| **2. Collected** | `confirmCollection(1, "Collected from owner")` | Collector (`0x90F7...b906`) | `0xfaf6caa87f3f4bebd61f52642298f388bc84e74181d9a8721e8253c8eb2d8bbb` | 9 | Custodian -> Collector |
| **3. InTransit** | `dispatchToRecycler(1, recyclerAddr, "Dispatched to recycler")` | Collector (`0x90F7...b906`) | `0x0e48f6288ba7d0e5293cfcc68adf76ef9e86dd2cfeb437ad90b84d2e20855569` | 10 | Pending Recipient -> Recycler |
| **4. AtRecycler** | `confirmReceipt(1, 2000, "Received and weighed")` | Recycler (`0x15d3...6A65`) | `0x2418a0fbbb67f95572db92984c74dba412c59266806126509c315c6a4a20be8b` | 11 | Received: 2000g |
| **5. Recycled** | `completeRecycling(1, 1600, 400, certHash, "Recycling completed")` | Recycler (`0x15d3...6A65`) | `0x30840a1b07003cbbe6eff60daf081e4eb9ba23f5e6a3a5da1f401fa160ee0434` | 12 | Mass balance: 1600 + 400 = 2000g. Points: 16 |

---

## 3. Negative Tests & Rejection Demonstrations

### Test 1: Role-Based Access Control Violation
- **Attempt:** Unauthorized account (`0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc`, Signer #5) calls `registerDevice()`.
- **Expected Result:** Revert with `"EWT: caller lacks required role"`.
- **Observed Terminal Output:**
  ```
  revert={ "args": [ "EWT: caller lacks required role" ], "name": "Error" }
  friendlyError: "EWT: caller lacks required role"
  ```
- **Verification Status:** PASSED.

### Test 2: Mass-Balance Mathematical Validation Violation
- **Attempt:** Recycler attempts `completeRecycling(deviceId: 3, recovered: 400, residual: 50, ...)` where received weight was `490g` (`400 + 50 = 450 != 490`).
- **Expected Result:** Revert with `"EWT: mass balance mismatch"`.
- **Observed Terminal Output:**
  ```
  execution reverted: "EWT: mass balance mismatch"
  friendlyError: "EWT: mass balance mismatch"
  ```
- **Verification Status:** PASSED.

### Test 3: Unauthorized Stage Skipping
- **Attempt:** Recycler attempts to confirm receipt before the device is collected and dispatched (`confirmReceipt` on status 0 device).
- **Expected Result:** Revert with `"EWT: invalid stage transition"`.
- **Verification Status:** PASSED (covered by Test Suite 31/31 and contract guard clauses).

### Test 4: Document Hash Verification
- **Attempt:** Validating certificate hash for Device 1 with matching hash vs mutated hash.
- **Result:**
  - Original certificate hash (`0xbb0afbdf...`): `verifyCertificate()` returns `true` (Authentic).
  - Mutated certificate hash (`0x00000000...`): `verifyCertificate()` returns `false` (Does not match).
- **Verification Status:** PASSED.
