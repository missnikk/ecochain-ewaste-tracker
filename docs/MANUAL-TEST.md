# EcoChain V2 — Step-by-Step Manual Demonstration Script

This script is your exact, rehearsed guide for the viva examination, lab presentation, and project recording. Every label matches the exact text on the screen.

---

## Preparation (Before the Presentation)

1. Open your terminal in the project directory:
   ```cmd
   cd C:\ecochain
   ```
2. Double-click `start-demo.bat` (or execute `start-demo.bat` in Command Prompt).
3. Wait ~20 seconds as it launches the blockchain, deploys the contract, starts the backend, seeds 30 devices, and opens your browser at `http://localhost:5173`.
4. Ensure your browser is maximized at `http://localhost:5173`.

---

## Act 1: The Landing Page & Role Chooser (1 Minute)

1. **Observe the Hero Section:**
   - Point to the headline: **"Verifiable E-Waste Lifecycle Tracking on Blockchain"**.
   - Explain the 6 states on the diagram: `Registered → PickupRequested → Collected → InTransit → AtRecycler → Recycled`.

2. **Explore the Five Role Portals:**
   - Show the 5 role cards:
     - **Regulator:** EPR Oversight & Governance
     - **Producer:** Manufacturing & Product Registration
     - **Consumer:** Ownership & Green Points
     - **Collector:** Logistics & Pickup Verification
     - **Recycler:** Material Recovery & Certification

3. **Demonstrate Role Security (Negative Demo):**
   - Scroll to the bottom card: **"Viva Defense Demonstration: Negative Security Test"**.
   - Click the yellow button: **"Attempt Unauthorized Action (Send Producer Call from Consumer Wallet)"**.
   - Show the immediate red alert box:
     `❌ Transaction Rejected by Smart Contract: execution reverted: "EWT: caller lacks required role"`.
   - **Viva Explanation:** *"The smart contract validates permissions at the EVM bytecode level. Even if someone hacks the frontend, the blockchain immediately rejects unauthorized calls."*

---

## Act 2: Role Sign-In & Live Self-Registration (1 Minute)

1. **Connect a Wallet:**
   - On the top right of the landing page, click **"Use Demo Account"**.
   - A modal appears showing Accounts #0 through #9.
   - Point out that:
     - Account #0 is **Admin (Regulator)**
     - Account #1 is **Producer**
     - Account #2 is **Consumer**
     - Account #3 is **Collector**
     - Account #4 is **Recycler**
     - Account #5 is **Unregistered**
2. **Demonstrate Self-Registration:**
   - Click **"Connect"** on **Demo Account #5**.
   - The on-chain role detector identifies this address as unregistered and displays the **"Register on EcoChain"** card.
   - Select role: **Consumer**, and click **"Complete Registration on Blockchain"**.
   - The transaction confirms; the top-right badge turns green: **Consumer**.
   - Click **"Enter Consumer Portal"**.

---

## Act 3: Complete End-to-End E-Waste Lifecycle (3 Minutes)

### Step 1: Producer Registers a New Device
1. In the left sidebar, click **Switch Wallet** or go to Home and select **Demo Account #1 (Producer)**.
2. In the sidebar, click **Producer Portal**.
3. Under **"Register New E-Waste Device"**, fill in:
   - **Product Name:** `MacBook Pro M2`
   - **Brand:** `Apple`
   - **Model Number:** `A2779`
   - **Serial Number:** `C02G1234EPR`
   - **Category:** `IT & telecom (ITEW)`
4. Click **"Register Device on Blockchain"**.
5. Note the newly generated **Device ID** (e.g., `#37`) and the printable warranty claim card with its cryptographic metadata SHA-256 hash.

### Step 2: Consumer Claims Ownership & Requests Pickup
1. Switch wallet to **Demo Account #2 (Consumer)** and go to **Consumer Portal**.
2. Under **"Claim a New Device"**:
   - Enter the Device ID: `#37`.
   - Click **"Claim Device Ownership"**.
   - Device `#37` immediately appears in your **"My Registered Electronic Devices"** table.
3. Click the yellow **"Schedule Eco-Pickup"** button next to Device `#37`.
4. Enter address/notes: `Pickup from 4th Floor Tech Park`.
5. Click **"Submit On-Chain Pickup Request"**.
6. The status chip updates to **Pickup requested**.

### Step 3: Collector Confirms Collection & Dispatches to Recycler
1. Switch wallet to **Demo Account #3 (Collector)** and go to **Collector Portal**.
2. Under **"Pending E-Waste Pickups Queue"**, find Device `#37`.
3. Click **"Confirm Pickup"** (enters custody, status becomes **Collected**).
4. Under **"Devices Currently in Collector Custody"**, find Device `#37`.
5. Select destination recycler: **Demo Account #4 (Licensed Recycler)**.
6. Click **"Dispatch Consignment"**.
7. The status chip updates to **In transit**.

### Step 4: Recycler Intake & Live Mass-Balance Enforcement
1. Switch wallet to **Demo Account #4 (Recycler)** and go to **Recycler Portal**.
2. Under **"Incoming Consignments (Awaiting Physical Intake)"**, locate Device `#37`.
3. Enter received gross weight: `2000` grams.
4. Click **"Confirm Physical Intake & Weighing"**.
5. The device moves to **"Active Recycling: Mass-Balance Processing & Certification"**.

#### Negative Test: Demonstrate Mass-Balance Rejection
- Enter: **Recovered Weight:** `1500g`, **Residual Waste:** `300g` (Sum = 1800g != 2000g).
- Notice the live red mathematical alert: `❌ Mass Balance Mismatch: 1500g + 300g = 1800g != 2000g`.
- The button is disabled. If submitted, the smart contract reverts with `EWT: mass balance mismatch`.

#### Positive Test: Complete Recycling & Anchor Certificate
- Correct the residual weight to: `500g` (Sum = 1500g + 500g = 2000g).
- Notice the live green alert: `✓ Mass Balance Invariant Satisfied: 1500g + 500g = 2000g`.
- Click **"Generate Certificate & Complete Recycling"**.
- The app builds the official PDF certificate in browser memory using jsPDF, computes its exact SHA-256 hash, anchors the hash to the smart contract, and uploads the raw PDF to the backend.
- The status chip permanently updates to **Recycled**!

---

## Act 4: Public Verification & Cryptographic Tamper Demo (1 Minute)

1. In the sidebar, click **Verify Certificate** (Public view, no wallet required).
2. Click **"Click to select or drop a Certificate PDF here"** and select the PDF downloaded in Act 3 (or from `C:\ecochain` or browser Downloads).
3. The browser calculates the SHA-256 fingerprint locally in under 10ms and queries the smart contract reverse mapping `certificateDevice(hash)`.
4. **Authentic Result:**
   - A bright green card appears: **"Authentic Recycling Certificate Verified"**.
   - Displays Device ID, Recycler address, Producer, verified weights (`1500g recovered + 500g residual = 2000g received`), and timestamp.
5. **The Viva Tamper Demo (Killer Feature):**
   - Click the yellow button: **"Simulate 1-Byte Tamper (Viva Demo)"**.
   - Explain to the examiner: *"We modified exactly one single byte in memory (byte #42) of the authentic PDF and re-computed the SHA-256 hash."*
   - Show the result:
     - Original Hash: `0x9a3fcb...` → Device #37 (Authentic ✅)
     - Tampered Hash: `0x6505c6...` → Device 0 (Rejected ❌)
   - **Viva Explanation:** *"Even a one-letter alteration in the certificate invalidates the mathematical fingerprint. The regulator and public can trust the certificate without trusting any human intermediary."*

---

## Act 5: Green Points & Circular Economy (30 Seconds)

1. Switch back to **Demo Account #2 (Consumer)** and open **Consumer Portal**.
2. Notice the Green Points balance card has credited **15 points** (1 point per 100g of recovered material).
3. Under **"Redeem Points for Partner Rewards"**:
   - Select Producer: `Demo #1 (Apple)`
   - Enter points: `10`
   - Click **"Redeem Points with Producer"**.
4. The on-chain balance updates immediately to `5 points`.
5. Switch to **Producer Portal**: under **"Rewards Program"**, the Producer sees that 10 points have been redeemed with their brand!

---

## Act 6: Regulator Governance & Offline Resilience (1 Minute)

1. Switch to **Demo Account #0 (Regulator)** and open **Regulator Portal**.
2. Under **"Registered Network Participants"**:
   - Locate any participant address.
   - Click **"Suspend Account"**.
   - Switch to that suspended account: an on-screen banner confirms `Account Suspended`. Any attempted transaction reverts with `EWT: account suspended`.
   - Click **"Reinstate Account"** to restore permissions.
3. Open **Dashboard**:
   - Show the 4 KPI cards, the 6-stage lifecycle pipeline strip, the pure SVG Donut chart, and the category breakdown.
4. **Demonstrate Graceful Offline Fallback:**
   - In your backend terminal window, press `Ctrl+C` to stop the backend server.
   - Refresh the Dashboard.
   - Show the yellow notice: `Offline Notice: Backend SQLite indexer is offline. Top KPI cards, Donut chart, and Pipeline strip are running live from the Ethereum smart contract.`
   - Point out that all 4 KPI cards and the Donut chart still work 100% directly from the blockchain!

---

## Conclusion
You have just demonstrated a full, production-grade Web3 application fulfilling every requirement of Extended Producer Responsibility (EPR) tracking, mass-balance invariant proof, cryptographic document tamper-evidence, and role-based access control.
