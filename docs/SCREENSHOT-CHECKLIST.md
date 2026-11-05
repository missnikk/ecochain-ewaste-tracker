# Student Screenshot Checklist (docs/SCREENSHOT-CHECKLIST.md)

> **Important for the Student:** The AI agent runs via command-line tools and cannot capture browser window screenshots. You must capture these screens from your own browser (`http://localhost:5173`) to include in your final project report and presentation slides.

---

## Required Screenshots for Final Submission

| # | Screen Name | URL / Path | Role / State to Show | File Name to Save As |
| :--- | :--- | :--- | :--- | :--- |
| **S1** | **Landing / Role Chooser** | `/` | Initial state showing the 5 role cards and wallet connection buttons | `screenshots/01-landing-role-chooser.png` |
| **S2** | **Producer Portal — Register Product** | `/producer` | Producer registering a new laptop with category and claim code generated | `screenshots/02-producer-register.png` |
| **S3** | **Consumer Portal — Claim & Devices** | `/consumer` | Consumer dashboard showing claimed devices, Green Points, and "Request pickup" | `screenshots/03-consumer-portal.png` |
| **S4** | **Collector Portal — Custody & Dispatch** | `/collector` | Collector confirming collection and selecting a certified recycler from dropdown | `screenshots/04-collector-portal.png` |
| **S5** | **Recycler Portal — Process & Certify** | `/recycler` | Weighing screen showing recovered grams, residual grams, and mass balance check | `screenshots/05-recycler-process.png` |
| **S6** | **Public Verify Page — Certificate Match** | `/verify` | Successful verification showing ✅ Authentic with on-chain metadata | `screenshots/06-verify-authentic.png` |
| **S7** | **Public Verify Page — Tamper Detection** | `/verify` | Verification failure showing ❌ Does not match after altering a certificate file | `screenshots/07-verify-tampered.png` |
| **S8** | **Regulator Dashboard** | `/dashboard` or `/admin` | Full analytics dashboard showing KPI cards, charts, and pipeline status | `screenshots/08-regulator-dashboard.png` |
| **S9** | **Rejection Demo — Unauthorized Role** | Any portal | On-screen error banner showing `EWT: caller lacks required role` | `screenshots/09-rejection-unauthorized.png` |
| **S10** | **Rejection Demo — Mass Balance Mismatch**| `/recycler` | On-screen error banner showing `EWT: mass balance mismatch` | `screenshots/10-rejection-mass-balance.png` |
| **S11** | **Terminal Test Suite** | Terminal | Powershell window showing `npm test` with `≥ 45 passing` | `screenshots/11-terminal-tests-passing.png` |
| **S12** | **MetaMask Connection (Optional)** | Browser popup | MetaMask prompt showing connection to "EcoChain Local (31337)" | `screenshots/12-metamask-connection.png` |
