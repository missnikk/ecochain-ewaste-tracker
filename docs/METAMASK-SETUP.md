# MetaMask Setup Guide for EcoChain (docs/METAMASK-SETUP.md)

This guide explains how to connect MetaMask to the local EcoChain blockchain.

> **Note:** MetaMask is optional. The application includes a built-in **Demo Wallet Mode** that lets you test all 5 roles with 1-click selection without installing any extensions.

---

## 1. Install MetaMask

1. Install the free MetaMask browser extension from the official site: [https://metamask.io/download/](https://metamask.io/download/).
2. Create a test wallet or open your existing extension.

---

## 2. Add the EcoChain Local Network

1. In MetaMask, click the network dropdown at top-left and select **Add Network** -> **Add a network manually**.
2. Fill in the network details:
   - **Network Name:** `EcoChain Local`
   - **New RPC URL:** `http://127.0.0.1:8545`
   - **Chain ID:** `31337`
   - **Currency Symbol:** `ETH`
3. Click **Save** and switch to `EcoChain Local`.

*(Alternatively: When you click **Connect MetaMask** in the EcoChain web app, the browser will automatically prompt you to approve adding and switching to this network).*

---

## 3. Import Local Test Accounts

Hardhat provides 20 pre-funded test accounts with 10,000 local test ETH.

> ⚠️ **SECURITY WARNING:** These private keys are publicly known development keys from Hardhat. **NEVER use these keys on Ethereum Mainnet or send real funds to them.**

To import test personas into MetaMask:
1. Click the account circle at the top-right of MetaMask -> **Add account or hardware wallet** -> **Import account**.
2. Paste the private key corresponding to the role you want to test:

| Persona | Account # | Public Address | Hardhat Development Private Key |
| :--- | :--- | :--- | :--- |
| **Admin (Regulator)** | #0 | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| **Producer** | #1 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| **Consumer A** | #2 | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | `0x5de4111afa1a4b94908f83103eb2f95410822a034d743474473f7e8e7c148ca4` |
| **Collector** | #3 | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6` |
| **Recycler** | #4 | `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` | `0x47e179ec346fe86抱58079a04a737f701c4e57ec2710f608397d3e5c937408a` |
| **Spare / Unregistered** | #5 | `0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc` | `0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba` |

3. Name each imported account in MetaMask (e.g. "EcoChain Admin", "EcoChain Producer", etc.) so you can easily switch between them.

---

## 4. Troubleshooting: "Nonce too high" Error

When you stop and restart `npm run chain`, the local blockchain resets to block 0, but MetaMask remembers previous transaction counts (nonces).

**Fix (10 seconds):**
1. In MetaMask, open **Settings** -> **Advanced**.
2. Click **Clear activity tab data** (or **Reset account** in older versions).
3. This resets MetaMask's local nonce cache without affecting your keys.
