# EcoChain V2 — Simple Step-by-Step Testing & Presentation Guide

This guide is designed to be **super easy to follow**. Every single step tells you exactly what to click and what will happen on your screen.

---

## 🚀 How to Start the App (1 Step)

1. Double-click the file named **`start-demo.bat`** in your `C:\ecochain` folder.
2. Wait about 20 seconds. Terminal windows will open, and your browser will automatically open to `http://localhost:5173`.
3. Look at the **top right corner** of the page. You will see a dropdown labeled **"Role:"**. You can switch roles from **any page, anytime** using this dropdown!

---

## 🎬 5-Minute Complete Demo (Follow Step-by-Step)

### Step 1: See the Public Dashboard
1. On the left sidebar, click **"Dashboard"**.
2. Look at the screen:
   - You will see 4 big KPI cards at the top: **Devices Registered**, **Recycling Rate**, **Material Recovered**, and **Green Points**.
   - You will see the **E-Waste Lifecycle Pipeline** showing the 6 stages.
   - You will see a colorful round **Donut Chart** and a **Category Bar Chart**.

---

### Step 2: Producer Makes a Laptop (Role: Demo #1)
1. At the top right, change the **Role:** dropdown to **"Demo #1: Producer"**.
2. In the left sidebar, click **"Producer Portal"**.
3. Under the box **"Register New E-Waste Device"**, type:
   - **Product Name:** `Dell XPS 15`
   - **Brand:** `Dell`
   - **Model Number:** `9520`
   - **Serial Number:** `DELL-2026-XPS`
   - **Category:** Select `IT & telecom (ITEW)`
4. Click the green button: **"Register Device on Blockchain"**.
5. Look at the message: It will give you your new **Device ID** (for example, `#36` or `#37`). **Remember this number!**

---

### Step 3: Consumer Buys & Requests Pickup (Role: Demo #2)
1. At the top right, change the **Role:** dropdown to **"Demo #2: Consumer A"**.
2. In the left sidebar, click **"Consumer Portal"**.
3. Under the box **"Claim a New Device"**:
   - In the **Device ID** box, type the number from Step 2 (e.g., `36` or `37`).
   - Click the green button: **"Claim Device Ownership"**.
   - Your device will now appear in your **"My Registered Electronic Devices"** table below!
4. On that table, find your device and click the yellow button: **"Schedule Eco-Pickup"**.
5. Click **"Submit On-Chain Pickup Request"**.
6. The status badge will change to yellow: **Pickup requested**.

---

### Step 4: Collector Picks Up the Device (Role: Demo #3)
1. At the top right, change the **Role:** dropdown to **"Demo #3: Collector"**.
2. In the left sidebar, click **"Collector Portal"**.
3. Under **"Pending E-Waste Pickups Queue"**, find your device number.
4. Click the purple button: **"Confirm Pickup"**.
   - The device moves down to **"Devices Currently in Collector Custody"**!
5. Now choose the Recycler from the dropdown: select **"Demo #4 (Licensed Recycler)"**.
6. Click the orange button: **"Dispatch Consignment"**.
7. The status badge will change to orange: **In transit**.

---

### Step 5: Recycler Weighs & Recycles with Mass Balance (Role: Demo #4)
1. At the top right, change the **Role:** dropdown to **"Demo #4: Recycler"**.
2. In the left sidebar, click **"Recycler Portal"**.
3. Under **"Incoming Consignments"**, find your device number.
4. In the weight box, type: `2000` (this means 2,000 grams).
5. Click the teal button: **"Confirm Physical Intake & Weighing"**.
   - The device moves to the **"Process & Certify"** box below!

#### 🔥 The "Viva Defense" Test (Showing the Teacher that Cheating is Blocked):
6. In **Recovered Weight (grams)**, type: `1500`.
7. In **Residual Waste (grams)**, type: `300`.
   - Look at the red warning: **"❌ Mass Balance Mismatch: 1500g + 300g = 1800g != 2000g"**.
   - The button is disabled! The smart contract will never allow a recycler to dump waste or lie about weights!
8. Now change **Residual Waste (grams)** to: `500`.
   - Look at the green message: **"✓ Mass Balance Invariant Satisfied: 1500g + 500g = 2000g"**!
9. Click the green button: **"Generate Certificate & Complete Recycling"**.
   - The app automatically generates the official PDF certificate and writes its SHA-256 fingerprint into the blockchain!
10. Click the button: **"Download Certificate PDF"** to save it to your computer.

---

### Step 6: Verify the Certificate (Public — Anti-Forgery Demo)
1. In the left sidebar, click **"Verify Certificate"**.
2. Click the big box that says **"Click to select or drop a Certificate PDF here"**.
3. Select the PDF you just downloaded in Step 5.
4. In less than 1 second, a big green card appears:
   - **"✅ Authentic Recycling Certificate Verified"**
   - It shows the Device ID, the Recycler address, and the exact weights!

#### 🔥 The "1-Byte Tamper" Demo (The Teacher's Favorite Feature):
5. Click the yellow button: **"Simulate 1-Byte Tamper (Viva Demo)"**.
6. Watch what happens:
   - It changes just **1 byte** of the PDF in memory.
   - The blockchain immediately flags it as **❌ Tampered / Invalid**!
   - **Explain to your examiner:** *"Even if someone changes one letter, date, or number in the PDF, the blockchain mathematical hash will not match and it will be rejected!"*

---

### Step 7: Consumer Gets Green Points & Discounts (Role: Demo #2)
1. At the top right, change the **Role:** dropdown to **"Demo #2: Consumer A"**.
2. In the left sidebar, click **"Consumer Portal"**.
3. Look at your **Green Points Balance** card: You now have points! (1 point for every 100g of material recovered).
4. Under **"Redeem Points for Partner Rewards"**:
   - Target Producer: Select `Demo #1 (Apple / Dell)`
   - Points to Redeem: Type `10`
   - Click **"Redeem Points with Producer"**.
5. Your points balance decreases by 10 points.
6. Now switch to **Demo #1: Producer** at the top right and go to **Producer Portal**:
   - The producer can see that 10 points have been redeemed with their brand!

---

### Step 8: Regulator Powers (Role: Demo #0)
1. At the top right, change the **Role:** dropdown to **"Demo #0: Regulator (Admin)"**.
2. In the left sidebar, click **"Regulator Portal"**.
3. You will see the list of all registered companies and users on the blockchain.
4. You can click **"Suspend Account"** on any user to freeze them, or **"Reinstate Account"** to unfreeze them.
5. You can also click **"Pause All Contract Activity"** in case of an emergency!

---

## 🎯 Summary for Your Exam
You have tested:
- 1. **Registration** by Producer
- 2. **Claiming & Pickup** by Consumer
- 3. **Custody & Transport** by Collector
- 4. **Mass-Balance Check ($1500 + 500 = 2000$)** by Recycler
- 5. **PDF Certificate Creation & Blockchain Anchoring**
- 6. **Tamper Proof Verification** (1 byte change fails)
- 7. **Green Points Circular Rewards**
- 8. **Regulator Governance & Suspensions**
