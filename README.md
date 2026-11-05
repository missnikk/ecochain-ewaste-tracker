# EcoChain — Blockchain-Based E-Waste Collection & Recycling Tracking

**Final Blueprint v2 · Mini Project (Blockchain) · Group 15**
Stack: Ethereum-compatible local chain (Hardhat) · Solidity · React · Node/Express · SQLite
**Cost to build and run: ₹0.** No cloud account, API key, faucet, real cryptocurrency, public testnet or mining.

---

## ⭐ NORTH STAR — THE LOCKED GOAL

> **Re-read this section (and `AGENTS.md`) at the start of every phase, after every error, and whenever you feel unsure.** It is the whole project in one page. Everything else in this README serves it. This is the "recipe card": the dish never changes, so a missing ingredient means *go and get the ingredient*, never *make a different dish*.

### N.1 The dish (final product)

EcoChain is a working web application that runs entirely on the student's laptop, for free. Seven personas (Regulator, Producer, two Consumers, Collector, Recycler, Unauthorized) move an e-waste device through six states — **Registered → PickupRequested → Collected → InTransit → AtRecycler → Recycled** — by sending transactions to one Solidity smart contract running on a local Ethereum-compatible blockchain (Hardhat, chainId 31337). The contract decides who may do what, validates the recycler's weights with a mass-balance rule, stores the SHA-256 hash of the recycling certificate and of the device metadata, and awards Green Points. A Node/Express + SQLite backend indexes the chain's events and stores device details; a React front end lets people use all of it. The project has 31 passing tests, 30 simulated demo devices, and a rehearsed 6-minute demo.

### N.2 The recipe card — ingredients that MUST exist at the end

| ID | Ingredient (exact spec) | How to prove it exists |
| :-- | :-- | :-- |
| I1 | `EWasteTracker.sol` exactly as README Section 8.1 | `npx hardhat compile` succeeds; spec table 8.1b matches |
| I2 | Hardhat local node on `127.0.0.1:8545`, chainId 31337 | `npm run chain` shows accounts; browser reads blocks |
| I3 | `deploy.js` deploys, assigns roles, writes `contractData.json` to **both** `backend/src/` and `frontend/src/contracts/` | Both files exist after `npm run deploy` |
| I4 | Express API on port 4000 with the 7 endpoints, SQLite file, event indexer that survives chain resets | `/api/health` shows `phase: "synced"` |
| I5 | React app on port 5173 with the 10 pages and persona switcher | Whole lifecycle works in the browser |
| I6 | Certificate verification (browser SHA-256 vs on-chain hash) | ✅ for the right PDF, ❌ after one character changes |
| I7 | Metadata integrity (hash of database record vs on-chain `metaHash`) | ✓ normally, ✗ after editing the database by hand |
| I8 | Mass-balance rule (recovered + residual = received) | Wrong sum is rejected with "EWT: mass balance mismatch" |
| I9 | Green Points = recovered grams / 100, only after Recycled | Consumer balance rises after recycling |
| I10 | 30 simulated devices from `seed.js` | Dashboard shows data; labelled "simulated" |
| I11 | Test evidence | `docs/test-output.txt` shows 31 passing |
| I12 | `docs/` evidence pack (screenshots, tx hashes, diagrams, report, slides) | Files exist (Part 15) |
| I13 | README credits, `LICENSE`, clean GitHub repo | No keys, no `.env`, no `node_modules` committed |

### N.3 Kitchen rules (constraints that never bend)

1. **Free and local.** No paid/cloud service, account, API key, faucet, public testnet, Docker or IPFS service.
2. **Pinned versions** (Section 4.4). Never upgrade or switch major versions.
3. **Plain JavaScript and plain CSS.** CommonJS in `blockchain/` and `backend/`. No TypeScript, Tailwind, UI/chart libraries, or OpenZeppelin imports.
4. **The contract of record is fixed** (8.1). Tests, backend and frontend are written against it.
5. **No private keys in code.** Front end signs with `provider.getSigner(index)`; backend is read-only on the chain.
6. **Honest claims only.** Simulated data is labelled; no fake results; no claim of testnet deployment.
7. **Simple enough to explain.** Every part must be explainable in two sentences by a beginner.
8. **Attribution is mandatory** for any reused code (Part 16).

### N.4 Substitution policy — what to do when an ingredient is missing

| Situation | ALLOWED | FORBIDDEN |
| :-- | :-- | :-- |
| A package will not install | Fix versions/Node, delete `node_modules` and retry; use a pre-approved alternate (Part 13) | Replace the technology |
| `better-sqlite3` cannot build | JSON-file store inside `db.js` with the same exported functions | Switching to MongoDB or a cloud database |
| A test fails | Find whether code or test deviates from spec table 8.1b and fix **that one** | Deleting, skipping or weakening the test |
| Compile error "Stack too deep" | Enable `viaIR: true` in the Solidity settings | Redesigning the lifecycle |
| Port busy | Stop the old process, or change the port in one place and in `.env`/`api.js` | Removing the service |
| Node/RPC unreachable | Start `npm run chain`; re-run deploy | Mocking the blockchain in code |
| Backend down | Front end keeps working with a banner | Moving logic to the backend |
| A page is too hard | Build the simple version of that page defined in 9.1 | Skipping the page |
| `provider.getSigner(i)` fails | Fallback: `new ethers.Wallet(<public Hardhat key printed by the node>, provider)` for local use only | Putting keys of any real wallet in code |

### N.5 Forbidden detours (the drift list)

Truffle · Ganache · Foundry · Hyperledger · Remix-only workflow · Next.js · TypeScript · MongoDB/Atlas · Firebase · Supabase · Docker · Pinata/IPFS · Infura/Alchemy · Sepolia as a requirement · ERC-20/ERC-721 · a fake in-memory "blockchain" · `localStorage` as the database · rewriting in another language · upgrading dependencies · removing or weakening tests · extra features or animations · changing the lifecycle or role list.

### N.6 Re-anchor ritual

Do this **before every phase, after every error, and after three consecutive edits without running anything**. Write the answers in `PROGRESS.md`:

1. What is the final product? (one sentence from N.1)
2. Which phase am I in and what is its DONE WHEN?
3. Which ingredient (I1–I13) am I working on?
4. Does my planned change alter the contract of record, a pinned version or a constraint? (If yes, do not do it.)

### N.7 Level parity — what classmates have, and what EcoChain adds

Typical classmate project: role-based contract + front end + hash or QR verification + a few tests.

| Capability | Classmates (typical) | EcoChain |
| :-- | :-- | :-- |
| Role-based access control with enforced state machine | ✅ | ✅ (6 states, 5 roles, 31 tests) |
| Front end with wallet/persona switching | ✅ | ✅ |
| Document hash verification | some | ✅ certificate + metadata hashes |
| Back end + database + event indexer | few | ✅ |
| Domain validation rule | few | ✅ mass balance |
| Incentive mechanism | rare | ✅ Green Points |
| Regulator dashboard and analytics | rare | ✅ |
| Documented negative tests and rejection demo | rare | ✅ |
| Security section, limitations, roadmap | some | ✅ |
| Chain-reset-safe indexer, graceful degradation | none | ✅ |

### N.8 How to explain it (memorize)

> "Many parties handle e-waste but each keeps its own editable records. We put the facts that must not change on a blockchain: who owns the device, what stage it is in, the certificate's hash, and the metadata's hash. A smart contract enforces who may act and in what order, and it rejects wrong weights. The database only holds details; if someone edits it, the hash on the blockchain exposes the change."

### N.9 What the faculty most likely expects (decoded from the assignment and the 16 sample titles)

- The sample titles cluster into: **multi-party tracking** (supply chain, pharma, agriculture, D-Mart), **registries and verification** (land, credentials, health records), **money flows** (crowdfunding, loans, charity, escrow), and **trust processes** (voting, alert notifier, rental agreement). Common expectation: *several actors, a state-changing workflow, smart-contract logic beyond store-and-retrieve, and verifiable records.*
- Titles 4 and 16 ("Impact of blockchain on retail…", "Potential of blockchain in charity…") are analysis-style, which suggests a survey paper as a *reference* is acceptable, as the faculty confirmed.
- The five written requirements read like a rubric: problem → architecture → prototype → test and verify transactions → submit with security and presentation. A complete, working, tested, documented, well-demonstrated project scores on every line.
- "Production level" most plausibly means *structured and complete with a credible path to production*, not cloud hosting.

---

## PART 0 — INSTRUCTIONS FOR THE AI CODING AGENT (read this first)

You are the lead developer for a student mini project. The student is a beginner and depends on you completely. This file is the single source of truth. Follow it exactly.

### 0.1 Operating rules

1. **Work phase by phase** (Part 10). Do not start a phase until the previous phase's "DONE WHEN" check passes. After each phase, print a short report: what was done, commands run, result of the check.
2. **Use only the pinned versions** in Section 4. Never run `npm install <pkg>` without the version shown here. Never upgrade a package, Node, Hardhat or Solidity. Never switch to Hardhat 3, React 19, Vite 6+ or ethers v5.
3. **Everything must be free and local.** Do not add paid services, API keys, cloud databases, Infura/Alchemy, Docker, IPFS pinning, or any package not listed here. If you believe an extra package is essential, stop and ask the student.
4. **The smart contract in Section 8.1 is the contract of record.** Its function names, arguments and revert strings are used by the tests, backend and frontend. If you must change it, update the tests, backend indexer and frontend together, and re-run all tests.
5. **No private keys in code.** The frontend signs through the local node's unlocked accounts using `provider.getSigner(index)`. The backend is read-only on the chain.
6. **Never invent data or results.** Do not fake test output, screenshots or transaction hashes. Seed data must be labelled as simulated.
7. **Keep attribution honest.** If any code is reused from another repository, keep that repository's LICENSE and copyright notice, and list it in Part 16 of this file (see Part 2). Do not remove credits.
8. **When something fails:** read the exact error, fix the root cause, re-run the failing command, and confirm. Do not skip failing tests, comment them out, or weaken assertions to make them pass. Try at most twice; if it still fails, report the exact error and the two fixes you tried, then stop and ask.
9. **Commit after every phase** with a clear message (`phase-2: contract and tests passing`).
10. **Prefer simple code.** Plain JavaScript (no TypeScript), plain CSS, no UI library, no chart library (use CSS bars or inline SVG). Comment non-obvious logic.
11. **Anchor on every turn.** At the start of every task, phase and error: read `AGENTS.md`, `PROGRESS.md` and the North Star. Fill the drift check in `PROGRESS.md`.
12. **A missing ingredient never changes the dish.** Fetch or fix the missing thing; follow the substitution policy (N.4) and the playbook (Part 13). Never change the goal to avoid an error.
13. **Proof over claims.** Never say a phase is done until you have run its DONE WHEN command and pasted the real output into `PROGRESS.md`.
14. **Update `PROGRESS.md` after every step.** It is your memory if the chat context resets.
15. **Stay on the path.** If you are about to do something not described in this README, stop and re-read the relevant section first.

### 0.2 Prompt the student pastes into the agent to start

> "Read AGENTS.md, then PROGRESS.md, then README.md completely (especially the North Star and Parts 0, 7, 8, 10 and 13). Obey every rule. Start with Phase 0 (starter repository evaluation, Part 7), then continue phase by phase through Part 10. Before each phase and after any error, re-anchor using the North Star and fill the drift check in PROGRESS.md. Never change the goal, the contract of record, the pinned versions or the constraints to avoid an error; follow the playbook in Part 13 instead. After each phase, stop and show me what you did and the real output of the DONE WHEN check."

### 0.3 Definition of done (final acceptance)

All items must be true and demonstrable:

- [ ] `npm test` in `blockchain/` shows all tests passing (31 expected) and the output is saved to `docs/test-output.txt`.
- [ ] Four services start with the commands in Section 10.2 and the full demo script (Part 11) runs without errors.
- [ ] Unauthorized actions are visibly rejected with the contract's revert message.
- [ ] Mass-balance mismatch is rejected; correct values are accepted.
- [ ] Certificate verification shows ✅ for the right PDF and ❌ after changing one character.
- [ ] Metadata integrity check shows ✓ for untouched data and ✗ after the SQLite row is edited by hand.
- [ ] Killing the backend does not stop the core lifecycle demo.
- [ ] README Part 16 (credits) and `docs/` (screenshots, tx hashes, test output, diagrams) are complete.
- [ ] No private keys, `.env` files or `node_modules` are committed.
- [ ] `PROGRESS.md` is fully ticked with real evidence pasted; no `BLOCKER.md` remains unresolved.
- [ ] Every ingredient I1–I13 in the North Star is demonstrably present.

---

## PART 1 — PROJECT CONTEXT AND WHAT THE FACULTY IS LOOKING FOR

> This section records the analysis of the assignment. The "mindset" parts are reasoned inferences from the assignment text, the 16 sample titles and the classmates' topics, not statements confirmed by the faculty.

### 1.1 The assignment (verbatim requirements, summarized)

1. Real-world problem suited to blockchain: problem statement, objectives, proposed solution, benefits of blockchain.
2. System architecture: blockchain network, smart contracts, users, transactions, application workflow.
3. Working prototype with tools such as Ethereum/Solidity/Remix/MetaMask or Hyperledger Fabric.
4. Demonstrate and test transactions: contract deployment, execution, validation, transaction verification.
5. Demonstrate and submit: architecture, implementation, test results, security considerations, source code, final presentation.
6. Technical paper (IEEE/Springer/Scopus) in the last column and "implement the same". The faculty has approved the paper as a **reference/inspiration**.

### 1.2 Where classmates are (19 groups)

Most groups chose a role-based tracking or record-keeping dApp (voting, rental, property, charity, health records, insurance, credentials, provenance, ownership transfer, QR product security). A few chose ambitious or complex ideas (zero-knowledge plus onion routing, soulbound identity and royalties, escrow, crowdfunding with risk scoring). The faculty's 16 suggested titles are mostly supply-chain, registry and escrow style problems.

**Implication:** the expected baseline is *a working, role-based, multi-step dApp with a front end, tests and documentation*. The way to stand out is not an exotic idea; it is **completeness, reliability, clear explanation and extra rigor** on a sound idea.

### 1.3 What "production level" most likely means for this course

Not cloud hosting. Most likely: a complete, structured, documented project that could plausibly be taken to production, with real architecture (front end + back end + database + blockchain), access control, validation, automated tests, a security section and a deployment story. EcoChain targets that, and states honestly what a real rollout would still need (Part 12).

### 1.4 What will impress

1. A live demo that **does not fail**, with a rehearsed order.
2. **Negative tests shown live** (unauthorized account rejected, mass-balance mismatch rejected).
3. A crisp explanation of **what is on-chain and why** (Section 3.3).
4. **Evidence:** test output, transaction hashes, block numbers, gas used.
5. A **security section** and honest limitations (the oracle problem).
6. The reference paper tied to concrete features (Section 3.4).
7. A clean GitHub repository with this README.
8. Confident answers in Q&A (Part 14).

### 1.5 What would hurt

A demo that breaks; being unable to explain where blockchain is used; claiming things the code does not do (for example "deployed on a public testnet" when it was not); features that are shown but untested.

---

## PART 2 — ORIGIN OF THE CODE AND ATTRIBUTION

The student will start from an existing GitHub repository to save time, then adapt it. This is acceptable when handled openly:

- **Credit the source** in Part 16 with name, URL and license.
- **Keep the source's LICENSE file and copyright notice** if its license requires it (MIT does).
- **Only reuse repositories that have an open-source license** that permits reuse. If a repository has no license file, do not copy its code; use it only as inspiration for ideas.
- The student should be able to say, truthfully: *"We used an open-source scaffold and built the e-waste logic, backend, indexer, hashing, rewards and tests ourselves."* The adaptation work in Phases 2–6 must genuinely be done, and the student must understand it (Part 14).

Repositories reviewed during planning (for the student's information):

| Repository | Observation |
| :-- | :-- |
| `Sai-Narayana/plastic_trace` | MIT license, Hardhat + React + ethers, local chain, tests, persona switcher. No backend or database. **Recommended scaffold.** |
| `nasar777/e-waste-traceability-and-recycling-verification-system` | Very close topic and stack, but no license file seen on its page. Do **not** copy code. |
| `Vanshika135-svvv/Blockchain-project` | Flask + MongoDB variant; license not checked. Not used. |
| `annac-dima/Blockchain_HashTheTrash` | Notebook-based simulation using Ganache; not a web app. Ideas only. |
| `akj2018/Blockchain-E-waste-Tracking-System-BETS-` | React/Web3.js with ML notebooks; no run instructions, no license seen. Ideas only. |

---

## PART 3 — CONCEPT

### 3.1 Problem statement
E-waste passes through many parties (consumers, collectors, recyclers). Records live in separate, editable systems, so it is hard to prove where a device went, whether it reached an authorized recycler, or how much material was recovered. India's E-Waste (Management) Rules 2022 place 106 equipment types in 7 categories under producer responsibility, so verifiable records matter.

### 3.2 Objectives
1. Register each device and record every custody change as an immutable, timestamped transaction.
2. Allow only authorized roles to perform each step (contract-enforced access control).
3. Validate recycling with a **mass-balance rule** (recovered + residual = received weight).
4. Anchor the **SHA-256 hash of the recycling certificate** on-chain for public verification.
5. Anchor the **hash of device metadata** so tampering with the off-chain database is detectable.
6. Reward consumers with **Green Points** when their device is verifiably recycled.
7. Give a regulator a dashboard and complete audit trail with transaction hashes.

### 3.3 Why blockchain, and what is on-chain

> "The database holds details, but a database admin can edit it. The blockchain holds the facts that must not be editable: device ID, owner, status, certificate hash, metadata hash. Every step is a transaction signed by that role's account and the contract refuses invalid actions. Anyone can verify a certificate by hashing the file and comparing it with the chain."

| On-chain (smart contract) | Off-chain (SQLite) |
| :-- | :-- |
| Device ID, category, status, owner, custodian | Device name, brand, model, serial, notes |
| Role of each account | Equipment catalog (Schedule I) |
| Metadata hash and certificate hash | Indexed copy of events for fast dashboards |
| Weights, mass balance, Green Points | — |
| Full status history and events | — |

No personal data is stored on-chain. Blockchain proves records were not altered after submission; it does not prove physical recycling happened (the "oracle problem"). State this honestly.

### 3.4 Relation to the reference paper
**"Blockchain for Waste Management in Smart Cities: A Survey"**, R. W. Ahmad, K. Salah, R. Jayaraman, I. Yaqoob, M. Omar, *IEEE Access*, vol. 9, 2021 (IEEE Xplore document 9540705). It is a survey, so EcoChain applies its ideas instead of copying a system.

| Idea in the survey | EcoChain feature |
| :-- | :-- |
| Manual, centralized waste systems are manipulable and a single point of failure | Shared ledger; no single database is the source of truth |
| Traceability and transparency | Per-device timeline with actor, time, tx hash |
| Immutability and audit | Append-only history and events |
| Validating waste documents by comparing hashes/signatures | Certificate hash anchoring and public verify page |
| Open challenges (physical-digital gap, privacy, scalability) | Documented limitations and roadmap |

Before presenting, the student should read the survey's sections on traceability, incentives and challenges and align slide wording with the paper.

---

## PART 4 — ARCHITECTURE, ROLES, STACK

### 4.1 Architecture

```
┌──────────────────────────────────────────────────────────┐
│  React (Vite) frontend            http://localhost:5173   │
│  Persona switcher: 6 Hardhat accounts (+ optional MetaMask)│
│  Signs transactions through the local node                │
└───────────────┬──────────────────────────────┬────────────┘
        REST (metadata, analytics)       JSON-RPC (ethers v6)
                │                              │
┌───────────────▼───────────────┐   ┌──────────▼─────────────┐
│ Express API    :4000          │   │ Hardhat node  :8545     │
│ SQLite database               │◄──┤ EWasteTracker.sol       │
│ Event indexer (READ-ONLY)     │   │ chainId 31337           │
└───────────────────────────────┘   └─────────────────────────┘
```

Design rules: the backend never holds keys or sends transactions; the frontend signs every transaction so the contract sees the real caller; if the backend is down the core lifecycle demo still works.

### 4.2 Roles and Hardhat accounts

| Role | Account index | Address (public Hardhat default) | Actions |
| :-- | :-- | :-- | :-- |
| Admin / Regulator | 0 | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | Assign roles, pause/unpause |
| Producer | 1 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | Register devices |
| Consumer A | 2 | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | Request pickup, earn points |
| Collector | 3 | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | Collect, dispatch |
| Recycler | 4 | `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` | Receive, complete recycling |
| Unauthorized | 5 | `0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc` | No role (shows rejections) |
| Consumer B | 6 | (account #6 of the node) | Second consumer for seed data |

### 4.3 Lifecycle

```
Registered → requestPickup → PickupRequested → confirmCollection → Collected
→ dispatchToRecycler → InTransit → confirmReceipt → AtRecycler
→ completeRecycling → Recycled   (+ Green Points)
```
Faculty wording "registered → collected → transferred → recycled" maps to these states.

### 4.4 Technology stack (pinned)

| Layer | Tool | Version |
| :-- | :-- | :-- |
| Runtime | Node.js LTS | **22.x** (20.x acceptable) |
| Local blockchain | Hardhat | **2.29.1** |
| Contract language | Solidity | **0.8.24** (no imports) |
| Test tooling | @nomicfoundation/hardhat-toolbox | **5.0.0** |
| Chain client | ethers | **6.13.5** |
| Backend | express **4.x**, cors, dotenv | 4.x |
| Database | better-sqlite3 | **11.x** |
| Frontend | react / react-dom | **18.3.1** |
| Build tool | vite + @vitejs/plugin-react | **5.x + 4.x** |
| Router | react-router-dom | **6.x** |

---

## PART 5 — REPOSITORY STRUCTURE

```
ecochain/
├── blockchain/
│   ├── contracts/EWasteTracker.sol
│   ├── scripts/deploy.js
│   ├── scripts/seed.js
│   ├── test/EWasteTracker.test.js
│   ├── hardhat.config.js
│   └── package.json
├── backend/
│   ├── src/index.js
│   ├── src/db.js
│   ├── src/indexer.js
│   ├── src/canonical.js
│   ├── src/catalog.seed.js
│   ├── src/contractData.json        (generated by deploy.js, git-ignored)
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── src/main.jsx
│   ├── src/App.jsx
│   ├── src/contracts/contractData.json   (generated by deploy.js, git-ignored)
│   ├── src/services/chain.js
│   ├── src/services/hash.js
│   ├── src/services/api.js
│   ├── src/pages/*.jsx
│   └── package.json
├── docs/                 (screenshots, test-output.txt, diagrams, report, slides)
├── AGENTS.md             (short goal-lock file; never edit)
├── PROGRESS.md           (agent memory; update every step)
├── .agents/rules/ecochain.md   (optional copy of AGENTS.md)
├── _starter/             (cloned starter repo, git-ignored, read-only)
├── package.json          (root scripts)
├── .gitignore
├── LICENSE
└── README.md
```

`.gitignore` must contain: `_starter/`, `node_modules/`, `.env`, `backend/ecochain.db*`, `backend/src/contractData.json`, `frontend/src/contracts/contractData.json`, `blockchain/artifacts/`, `blockchain/cache/`, `frontend/dist/`.

---

## PART 6 — PREREQUISITES (check before anything else)

1. Node.js 22 LTS and Git installed. Check: `node -v`, `npm -v`, `git --version`. Check the CPU type with `echo %PROCESSOR_ARCHITECTURE%` (Windows): `AMD64` = x64 machine, `ARM64` = ARM machine. Use the matching Node installer; if a native package fails on ARM64, see the `better-sqlite3` row in Part 13.
2. Internet is needed once for `npm install` and for Hardhat to download the Solidity compiler on the first compile. After that, everything works offline.
3. Windows: use Command Prompt or Git Bash if PowerShell blocks npm scripts.
4. Browser: Chrome, Edge or Firefox. MetaMask is optional (Section 7.4).

---

## PART 7 — PHASE 0: STARTER REPOSITORY EVALUATION AND ADAPTATION

The student will provide a starter repository (recommended: `Sai-Narayana/plastic_trace`, MIT; or the student's own project). **Test it first; do not modify anything before it passes.**

### 7.1 Evaluation procedure

1. Clone into the folder `_starter/` **inside the workspace root**: `git clone https://github.com/Sai-Narayana/plastic_trace.git _starter` (add `_starter/` to `.gitignore`; never edit files inside `_starter/` — copy what you need into `blockchain/` and `frontend/`). Read its README and `LICENSE`. Record: name, URL, license type.
2. **License gate:** if there is no LICENSE file or the license forbids reuse, stop. Tell the student; use the repo only as inspiration and continue with Plan B (build from this README's code).
3. In each of its package folders: `npm install` (if the install fails because of version problems, pin to the versions in Section 4.4 and retry).
4. Run its tests (for a Hardhat project: `npx hardhat test`).
5. Run its app: start the local node, deploy, start the frontend, open the browser, click through the main flow.
6. Write `docs/starter-evaluation.md`: license, what ran, what failed, versions used, and a verdict.

### 7.2 Decision rule

| Result | Action |
| :-- | :-- |
| Tests and app both work | **Plan A:** adapt the starter (Section 7.3) |
| Tests or app broken, fixable in two attempts | Fix, then Plan A |
| Still broken, no license, or very different structure | **Plan B:** build from scratch using the Part 8 code (this README is complete enough to do so) |

### 7.3 Plan A adaptation map (for a PlasticTrace-style starter)

| Starter piece | Action |
| :-- | :-- |
| Plastic contract (`PlasticWasteTraceability.sol`) | **Replace** with `EWasteTracker.sol` (Part 8, Section 8.1) |
| Deploy / seed scripts | **Replace** with Sections 8.3 and 8.4 |
| Contract tests | **Replace** with Section 8.5 |
| Layout, header, sidebar, role/persona switcher components | **Keep and adapt** names and roles |
| Pages (batch, transfer, process, explorer, verify) | **Rewrite** per Section 9.1 |
| Mass-balance idea | Reuse the concept (already in the contract) |
| Backend and database | **Add** (Section 8.6) — starter has none |
| Certificate hash, metadata hash, Green Points, catalog, analytics | **Add** |
| Project names, strings, README, report text | **Rename** everything to EcoChain / e-waste |

Rules while adapting: remove all plastic-specific wording; keep the LICENSE and copyright of the starter; add the credit text in Part 16; re-run all tests after every contract change; do not leave dead code or unused pages.

### 7.4 Optional MetaMask mode (do last, only if everything else is done)
Add a toggle "Use MetaMask": `new ethers.BrowserProvider(window.ethereum)` then `getSigner()`. In MetaMask add a network manually (RPC `http://127.0.0.1:8545`, chain ID `31337`, symbol ETH) and import a Hardhat account using a private key printed by `npx hardhat node` in the terminal. Those keys are public test keys; never use them on a real network. If MetaMask shows "nonce too high" after a node restart: Settings → Advanced → Clear activity tab data.

---
## PART 8 — SOURCE CODE (contract of record)

> All code below is the reference implementation. Create each file exactly at the path shown. It was written to be consistent across files (names, enums, revert strings). It has been reviewed by reading but **not executed** by the author of this blueprint, so the agent must run it, and fix any errors found, following the rules in Part 0.

### 8.1 `blockchain/contracts/EWasteTracker.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title EWasteTracker - role-gated e-waste lifecycle with certificate anchoring
/// @notice Academic prototype. Roles are enforced with a mapping and modifiers (RBAC).
contract EWasteTracker {
    enum Role { None, Admin, Producer, Consumer, Collector, Recycler }
    enum Status { Registered, PickupRequested, Collected, InTransit, AtRecycler, Recycled }

    struct Device {
        uint256 id;
        uint8 category;          // 1..7 = Schedule I category index
        bytes32 metaHash;        // SHA-256 of canonical off-chain metadata
        address producer;
        address owner;           // original owner, receives Green Points
        address custodian;       // current holder
        address pendingRecipient;
        Status status;
        uint256 receivedGrams;
        uint256 recoveredGrams;
        uint256 residualGrams;
        bytes32 certificateHash; // SHA-256 of the recycling certificate file
        uint256 createdAt;
        uint256 updatedAt;
    }

    struct Entry {
        Status status;
        address actor;
        uint256 timestamp;
        string note;
    }

    uint256 public constant GRAMS_PER_POINT = 100;

    address public admin;
    bool public paused;
    uint256 public deviceCount;
    uint256 public totalRecoveredGrams;

    mapping(address => Role) public roles;
    mapping(address => uint256) public greenPoints;
    mapping(Status => uint256) public statusCount;
    mapping(uint256 => Device) private devices;
    mapping(uint256 => Entry[]) private history;

    event RoleAssigned(address indexed account, Role role);
    event DeviceRegistered(uint256 indexed deviceId, uint8 category, address indexed owner, address indexed producer, bytes32 metaHash);
    event StatusChanged(uint256 indexed deviceId, Status status, address indexed actor, string note);
    event CertificateAnchored(uint256 indexed deviceId, bytes32 certificateHash, address indexed recycler, uint256 recoveredGrams);
    event PointsAwarded(address indexed owner, uint256 indexed deviceId, uint256 points);
    event PausedStateChanged(bool paused, address indexed by);

    modifier onlyRole(Role r) {
        require(roles[msg.sender] == r, "EWT: caller lacks required role");
        _;
    }
    modifier whenNotPaused() {
        require(!paused, "EWT: system paused");
        _;
    }
    modifier exists(uint256 id) {
        require(id > 0 && id <= deviceCount, "EWT: unknown device");
        _;
    }

    constructor() {
        admin = msg.sender;
        roles[msg.sender] = Role.Admin;
        emit RoleAssigned(msg.sender, Role.Admin);
    }

    // ---------- administration ----------
    function assignRole(address account, Role role) external onlyRole(Role.Admin) {
        require(account != address(0), "EWT: zero address");
        require(account != msg.sender, "EWT: admin cannot change own role");
        roles[account] = role;
        emit RoleAssigned(account, role);
    }

    function setPaused(bool state) external onlyRole(Role.Admin) {
        paused = state;
        emit PausedStateChanged(state, msg.sender);
    }

    // ---------- lifecycle ----------
    function registerDevice(
        uint8 category,
        bytes32 metaHash,
        address owner_,
        string calldata note
    ) external onlyRole(Role.Producer) whenNotPaused returns (uint256 id) {
        require(category >= 1 && category <= 7, "EWT: invalid category");
        require(metaHash != bytes32(0), "EWT: empty metadata hash");
        require(roles[owner_] == Role.Consumer, "EWT: owner must be a registered consumer");

        id = ++deviceCount;
        Device storage d = devices[id];
        d.id = id;
        d.category = category;
        d.metaHash = metaHash;
        d.producer = msg.sender;
        d.owner = owner_;
        d.custodian = owner_;
        d.status = Status.Registered;
        d.createdAt = block.timestamp;
        d.updatedAt = block.timestamp;

        statusCount[Status.Registered] += 1;
        history[id].push(Entry(Status.Registered, msg.sender, block.timestamp, note));

        emit DeviceRegistered(id, category, owner_, msg.sender, metaHash);
        emit StatusChanged(id, Status.Registered, msg.sender, note);
    }

    function requestPickup(uint256 id, string calldata note) external exists(id) whenNotPaused {
        Device storage d = devices[id];
        require(msg.sender == d.owner, "EWT: only the device owner");
        require(d.status == Status.Registered, "EWT: invalid state");
        _move(d, Status.PickupRequested, note);
    }

    function confirmCollection(uint256 id, string calldata note)
        external onlyRole(Role.Collector) exists(id) whenNotPaused
    {
        Device storage d = devices[id];
        require(d.status == Status.PickupRequested, "EWT: invalid state");
        d.custodian = msg.sender;
        _move(d, Status.Collected, note);
    }

    function dispatchToRecycler(uint256 id, address recycler, string calldata note)
        external onlyRole(Role.Collector) exists(id) whenNotPaused
    {
        Device storage d = devices[id];
        require(d.status == Status.Collected, "EWT: invalid state");
        require(d.custodian == msg.sender, "EWT: not the custodian");
        require(roles[recycler] == Role.Recycler, "EWT: recipient is not a recycler");
        d.pendingRecipient = recycler;
        _move(d, Status.InTransit, note);
    }

    function confirmReceipt(uint256 id, uint256 receivedGrams, string calldata note)
        external onlyRole(Role.Recycler) exists(id) whenNotPaused
    {
        Device storage d = devices[id];
        require(d.status == Status.InTransit, "EWT: invalid state");
        require(d.pendingRecipient == msg.sender, "EWT: not the designated recycler");
        require(receivedGrams > 0, "EWT: weight must be positive");
        d.receivedGrams = receivedGrams;
        d.custodian = msg.sender;
        d.pendingRecipient = address(0);
        _move(d, Status.AtRecycler, note);
    }

    function completeRecycling(
        uint256 id,
        uint256 recoveredGrams,
        uint256 residualGrams,
        bytes32 certificateHash,
        string calldata note
    ) external onlyRole(Role.Recycler) exists(id) whenNotPaused {
        Device storage d = devices[id];
        require(d.status == Status.AtRecycler, "EWT: invalid state");
        require(d.custodian == msg.sender, "EWT: not the custodian");
        require(certificateHash != bytes32(0), "EWT: certificate hash required");
        require(recoveredGrams + residualGrams == d.receivedGrams, "EWT: mass balance mismatch");

        d.recoveredGrams = recoveredGrams;
        d.residualGrams = residualGrams;
        d.certificateHash = certificateHash;
        totalRecoveredGrams += recoveredGrams;

        uint256 pts = recoveredGrams / GRAMS_PER_POINT;
        greenPoints[d.owner] += pts;

        _move(d, Status.Recycled, note);
        emit CertificateAnchored(id, certificateHash, msg.sender, recoveredGrams);
        emit PointsAwarded(d.owner, id, pts);
    }

    // ---------- views ----------
    function getDevice(uint256 id) external view exists(id) returns (Device memory) {
        return devices[id];
    }

    function getHistory(uint256 id) external view exists(id) returns (Entry[] memory) {
        return history[id];
    }

    function verifyCertificate(uint256 id, bytes32 fileHash) external view exists(id) returns (bool) {
        Device storage d = devices[id];
        return d.status == Status.Recycled && d.certificateHash == fileHash;
    }

    function verifyMetadata(uint256 id, bytes32 metaHash) external view exists(id) returns (bool) {
        return devices[id].metaHash == metaHash;
    }

    // ---------- internal ----------
    function _move(Device storage d, Status next, string memory note) internal {
        statusCount[d.status] -= 1;
        statusCount[next] += 1;
        d.status = next;
        d.updatedAt = block.timestamp;
        history[d.id].push(Entry(next, msg.sender, block.timestamp, note));
        emit StatusChanged(d.id, next, msg.sender, note);
    }
}
```

Enum values in JavaScript: **Role** None 0, Admin 1, Producer 2, Consumer 3, Collector 4, Recycler 5. **Status** Registered 0, PickupRequested 1, Collected 2, InTransit 3, AtRecycler 4, Recycled 5.

### 8.1b Contract specification table (use this to decide whether code or a test is wrong)

Every revert string starts with `EWT:`. Global checks: role-gated functions revert `EWT: caller lacks required role`; state-changing functions (except `assignRole`, `setPaused`) revert `EWT: system paused` when paused; functions with an `id` revert `EWT: unknown device` if `id` is 0 or above `deviceCount`.

| Function | Caller | Other requirements (revert string) | Effect |
| :-- | :-- | :-- | :-- |
| `assignRole(account, role)` | Admin | account ≠ 0 (`EWT: zero address`); account ≠ caller (`EWT: admin cannot change own role`) | Sets role, emits `RoleAssigned` |
| `setPaused(state)` | Admin | — | Sets pause flag, emits `PausedStateChanged` |
| `registerDevice(category, metaHash, owner_, note)` | Producer | category 1..7 (`EWT: invalid category`); metaHash ≠ 0 (`EWT: empty metadata hash`); owner_ has Consumer role (`EWT: owner must be a registered consumer`) | New device, status Registered, id = ++deviceCount |
| `requestPickup(id, note)` | Device owner | status Registered (`EWT: invalid state`); caller is owner (`EWT: only the device owner`) | → PickupRequested |
| `confirmCollection(id, note)` | Collector | status PickupRequested (`EWT: invalid state`) | custodian = caller, → Collected |
| `dispatchToRecycler(id, recycler, note)` | Collector | status Collected (`EWT: invalid state`); caller is custodian (`EWT: not the custodian`); recipient has Recycler role (`EWT: recipient is not a recycler`) | pendingRecipient = recycler, → InTransit |
| `confirmReceipt(id, receivedGrams, note)` | Recycler | status InTransit (`EWT: invalid state`); caller is pendingRecipient (`EWT: not the designated recycler`); grams > 0 (`EWT: weight must be positive`) | custodian = caller, → AtRecycler |
| `completeRecycling(id, recovered, residual, certHash, note)` | Recycler | status AtRecycler (`EWT: invalid state`); caller is custodian (`EWT: not the custodian`); certHash ≠ 0 (`EWT: certificate hash required`); recovered + residual = received (`EWT: mass balance mismatch`) | Stores weights and hash, points = recovered / 100 to owner, → Recycled |
| `getDevice(id)`, `getHistory(id)` | anyone (view) | id exists | Returns struct / entries |
| `verifyCertificate(id, fileHash)` | anyone (view) | — | true only if status Recycled and hash equals stored certificate hash |
| `verifyMetadata(id, hash)` | anyone (view) | — | true if hash equals stored metadata hash |

When a test fails, compare **both** the contract and the test with this table. Fix whichever one deviates. If both match the table and it still fails, the problem is the environment or the fixture, not the spec.

---

### 8.2 `blockchain/hardhat.config.js` and `blockchain/package.json`

```js
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: "paris" },
  },
  networks: {
    hardhat: { chainId: 31337 },
    localhost: { url: "http://127.0.0.1:8545", chainId: 31337 },
  },
};
```

`package.json` scripts: `"node": "hardhat node"`, `"compile": "hardhat compile"`, `"test": "hardhat test"`, `"deploy": "hardhat run scripts/deploy.js --network localhost"`, `"seed": "hardhat run scripts/seed.js --network localhost"`.
Install: `npm install --save-dev hardhat@2.29.1 @nomicfoundation/hardhat-toolbox@5.0.0` (do **not** use `--legacy-peer-deps` here: it skips installing the toolbox's required peer packages; if npm reports a peer conflict, see the playbook row in Part 13).

### 8.3 `blockchain/scripts/deploy.js`

```js
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const signers = await hre.ethers.getSigners();
  // 0 admin, 1 producer, 2 consumer A, 3 collector, 4 recycler, 5 unauthorized, 6 consumer B
  const [admin, producer, consumer, collector, recycler, , consumer2] = signers;

  const Factory = await hre.ethers.getContractFactory("EWasteTracker");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  const receipt = await contract.deploymentTransaction().wait();

  // Role enum: Producer 2, Consumer 3, Collector 4, Recycler 5
  await (await contract.assignRole(producer.address, 2)).wait();
  await (await contract.assignRole(consumer.address, 3)).wait();
  await (await contract.assignRole(consumer2.address, 3)).wait();
  await (await contract.assignRole(collector.address, 4)).wait();
  await (await contract.assignRole(recycler.address, 5)).wait();

  const artifact = await hre.artifacts.readArtifact("EWasteTracker");
  const network = await hre.ethers.provider.getNetwork();
  const data = {
    address,
    abi: artifact.abi,
    chainId: Number(network.chainId),
    deployBlock: receipt.blockNumber,
  };

  for (const rel of ["../frontend/src/contracts", "../backend/src"]) {
    const dir = path.join(__dirname, rel);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "contractData.json"), JSON.stringify(data, null, 2));
  }
  console.log("EWasteTracker deployed to:", address);
  console.log("Admin:", admin.address);
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
```

### 8.4 `blockchain/scripts/seed.js` (simulated demo data; the backend must be running)

```js
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { metadataHash } = require("../../backend/src/canonical");

const API = process.env.API_URL || "http://localhost:4000";

// [name, brand, model, category (1..7), weight in grams]
const SAMPLES = [
  ["Laptop", "Dell", "Latitude 5420", 1, 2000],
  ["Mobile phone", "Samsung", "Galaxy A52", 1, 200],
  ["Tablet", "Apple", "iPad 8th Gen", 1, 490],
  ["Television", "LG", "43UM7290", 2, 8500],
  ["Digital camera", "Canon", "EOS 1500D", 2, 650],
  ["Refrigerator", "Whirlpool", "FP 263D", 3, 62000],
  ["Washing machine", "IFB", "Senator Aqua", 3, 38000],
  ["Microwave oven", "Samsung", "MS23K3513", 3, 11500],
  ["Electric drill", "Bosch", "GSB 500", 4, 1800],
  ["Electronic toy", "Funskool", "RC Car", 5, 450],
  ["Blood pressure monitor", "Omron", "HEM-7120", 6, 400],
  ["Gas analyser", "Testo", "310", 7, 1200],
];

// final stage per device: 0 Registered ... 5 Recycled
const STAGES = [5, 5, 4, 3, 2, 1, 0, 5, 5, 1];
const TOTAL_DEVICES = 30;

function sha256Hex(text) {
  return "0x" + crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

async function postMetadata(id, meta) {
  try {
    const res = await fetch(`${API}/api/devices/${id}/metadata`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(meta),
    });
    if (!res.ok) console.warn(`  metadata for device ${id} rejected:`, await res.text());
  } catch {
    console.warn(`  backend not reachable at ${API}; metadata for device ${id} not saved`);
  }
}

async function main() {
  const dataPath = path.join(__dirname, "../../backend/src/contractData.json");
  const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  const [, producer, consumer, collector, recycler, , consumer2] = await hre.ethers.getSigners();
  const consumers = [consumer, consumer2];
  const contract = await hre.ethers.getContractAt("EWasteTracker", data.address);

  for (let i = 0; i < TOTAL_DEVICES; i++) {
    const [name, brand, model, category, grams] = SAMPLES[i % SAMPLES.length];
    const owner = consumers[i % 2];
    const meta = { name, brand, model, serial: `SIM-${1000 + i}`, notes: "Simulated demo data" };
    const stage = STAGES[i % STAGES.length];

    const tx = await contract.connect(producer).registerDevice(category, metadataHash(meta), owner.address, "Registered by producer");
    const rc = await tx.wait();
    let id = null;
    for (const log of rc.logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed && parsed.name === "DeviceRegistered") id = Number(parsed.args.deviceId);
      } catch { /* not our event */ }
    }
    await postMetadata(id, meta);

    if (stage >= 1) await (await contract.connect(owner).requestPickup(id, "Pickup requested")).wait();
    if (stage >= 2) await (await contract.connect(collector).confirmCollection(id, "Collected from owner")).wait();
    if (stage >= 3) await (await contract.connect(collector).dispatchToRecycler(id, recycler.address, "Dispatched to recycler")).wait();
    if (stage >= 4) await (await contract.connect(recycler).confirmReceipt(id, grams, "Received and weighed")).wait();
    if (stage >= 5) {
      const recovered = Math.round(grams * 0.8);
      const residual = grams - recovered;
      const certHash = sha256Hex(`simulated-certificate-device-${id}`);
      await (await contract.connect(recycler).completeRecycling(id, recovered, residual, certHash, "Recycling completed")).wait();
    }
    console.log(`device ${id} (${name}) -> stage ${stage}`);
  }
  console.log("Seed complete (simulated demo data).");
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
```

### 8.5 `blockchain/test/EWasteTracker.test.js` (31 tests)

```js
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const Role = { None: 0, Admin: 1, Producer: 2, Consumer: 3, Collector: 4, Recycler: 5 };
const Status = { Registered: 0, PickupRequested: 1, Collected: 2, InTransit: 3, AtRecycler: 4, Recycled: 5 };
const META = ethers.sha256(ethers.toUtf8Bytes("device-metadata"));
const CERT = ethers.sha256(ethers.toUtf8Bytes("certificate-pdf-bytes"));
const OTHER = ethers.sha256(ethers.toUtf8Bytes("tampered-file"));

async function deployFixture() {
  const [admin, producer, consumer, collector, recycler, outsider, consumer2, collector2, recycler2] =
    await ethers.getSigners();
  const factory = await ethers.getContractFactory("EWasteTracker");
  const c = await factory.deploy();
  await c.waitForDeployment();
  await c.assignRole(producer.address, Role.Producer);
  await c.assignRole(consumer.address, Role.Consumer);
  await c.assignRole(consumer2.address, Role.Consumer);
  await c.assignRole(collector.address, Role.Collector);
  await c.assignRole(collector2.address, Role.Collector);
  await c.assignRole(recycler.address, Role.Recycler);
  await c.assignRole(recycler2.address, Role.Recycler);
  return { c, admin, producer, consumer, consumer2, collector, collector2, recycler, recycler2, outsider };
}

// Registers device #1 and moves it to the requested stage (0..5)
async function toStage(f, stage) {
  const { c, producer, consumer, collector, recycler } = f;
  await c.connect(producer).registerDevice(1, META, consumer.address, "registered");
  if (stage >= 1) await c.connect(consumer).requestPickup(1, "pickup requested");
  if (stage >= 2) await c.connect(collector).confirmCollection(1, "collected");
  if (stage >= 3) await c.connect(collector).dispatchToRecycler(1, recycler.address, "dispatched");
  if (stage >= 4) await c.connect(recycler).confirmReceipt(1, 2000, "received");
  if (stage >= 5) await c.connect(recycler).completeRecycling(1, 1500, 500, CERT, "recycled");
}

describe("EWasteTracker", function () {
  describe("Roles", function () {
    it("deployer is admin", async function () {
      const { c, admin } = await loadFixture(deployFixture);
      expect(await c.admin()).to.equal(admin.address);
      expect(await c.roles(admin.address)).to.equal(Role.Admin);
    });
    it("admin can assign a role and event is emitted", async function () {
      const { c, outsider } = await loadFixture(deployFixture);
      await expect(c.assignRole(outsider.address, Role.Consumer))
        .to.emit(c, "RoleAssigned").withArgs(outsider.address, Role.Consumer);
    });
    it("non-admin cannot assign roles", async function () {
      const { c, outsider } = await loadFixture(deployFixture);
      await expect(c.connect(outsider).assignRole(outsider.address, Role.Admin))
        .to.be.revertedWith("EWT: caller lacks required role");
    });
    it("zero address is rejected", async function () {
      const { c } = await loadFixture(deployFixture);
      await expect(c.assignRole(ethers.ZeroAddress, Role.Consumer)).to.be.revertedWith("EWT: zero address");
    });
    it("admin cannot change own role", async function () {
      const { c, admin } = await loadFixture(deployFixture);
      await expect(c.assignRole(admin.address, Role.None)).to.be.revertedWith("EWT: admin cannot change own role");
    });
  });

  describe("Registration", function () {
    it("producer registers a device and event is emitted", async function () {
      const { c, producer, consumer } = await loadFixture(deployFixture);
      await expect(c.connect(producer).registerDevice(1, META, consumer.address, "reg"))
        .to.emit(c, "DeviceRegistered").withArgs(1, 1, consumer.address, producer.address, META);
      const d = await c.getDevice(1);
      expect(d.status).to.equal(Status.Registered);
      expect(d.owner).to.equal(consumer.address);
    });
    it("non-producer cannot register", async function () {
      const { c, outsider, consumer } = await loadFixture(deployFixture);
      await expect(c.connect(outsider).registerDevice(1, META, consumer.address, "x"))
        .to.be.revertedWith("EWT: caller lacks required role");
    });
    it("invalid category is rejected (0 and 8)", async function () {
      const { c, producer, consumer } = await loadFixture(deployFixture);
      await expect(c.connect(producer).registerDevice(0, META, consumer.address, "x")).to.be.revertedWith("EWT: invalid category");
      await expect(c.connect(producer).registerDevice(8, META, consumer.address, "x")).to.be.revertedWith("EWT: invalid category");
    });
    it("empty metadata hash is rejected", async function () {
      const { c, producer, consumer } = await loadFixture(deployFixture);
      await expect(c.connect(producer).registerDevice(1, ethers.ZeroHash, consumer.address, "x"))
        .to.be.revertedWith("EWT: empty metadata hash");
    });
    it("owner must be a registered consumer", async function () {
      const { c, producer, outsider } = await loadFixture(deployFixture);
      await expect(c.connect(producer).registerDevice(1, META, outsider.address, "x"))
        .to.be.revertedWith("EWT: owner must be a registered consumer");
    });
    it("device IDs increment", async function () {
      const { c, producer, consumer } = await loadFixture(deployFixture);
      await c.connect(producer).registerDevice(1, META, consumer.address, "a");
      await c.connect(producer).registerDevice(2, META, consumer.address, "b");
      expect(await c.deviceCount()).to.equal(2);
      expect((await c.getDevice(2)).id).to.equal(2);
    });
  });

  describe("Lifecycle", function () {
    it("full happy path ends in Recycled with 6 history entries", async function () {
      const f = await loadFixture(deployFixture);
      await toStage(f, 5);
      expect((await f.c.getDevice(1)).status).to.equal(Status.Recycled);
      expect((await f.c.getHistory(1)).length).to.equal(6);
    });
    it("only the owner can request pickup", async function () {
      const f = await loadFixture(deployFixture);
      await toStage(f, 0);
      await expect(f.c.connect(f.consumer2).requestPickup(1, "x")).to.be.revertedWith("EWT: only the device owner");
    });
    it("collection before pickup request is rejected", async function () {
      const f = await loadFixture(deployFixture);
      await toStage(f, 0);
      await expect(f.c.connect(f.collector).confirmCollection(1, "x")).to.be.revertedWith("EWT: invalid state");
    });
    it("dispatch only by the current custodian", async function () {
      const f = await loadFixture(deployFixture);
      await toStage(f, 2);
      await expect(f.c.connect(f.collector2).dispatchToRecycler(1, f.recycler.address, "x"))
        .to.be.revertedWith("EWT: not the custodian");
    });
    it("dispatch to a non-recycler is rejected", async function () {
      const f = await loadFixture(deployFixture);
      await toStage(f, 2);
      await expect(f.c.connect(f.collector).dispatchToRecycler(1, f.consumer2.address, "x"))
        .to.be.revertedWith("EWT: recipient is not a recycler");
    });
    it("only the designated recycler can confirm receipt", async function () {
      const f = await loadFixture(deployFixture);
      await toStage(f, 3);
      await expect(f.c.connect(f.recycler2).confirmReceipt(1, 2000, "x"))
        .to.be.revertedWith("EWT: not the designated recycler");
    });
    it("skipping a stage is rejected", async function () {
      const f = await loadFixture(deployFixture);
      await toStage(f, 0);
      await expect(f.c.connect(f.recycler).completeRecycling(1, 1, 1, CERT, "x")).to.be.revertedWith("EWT: invalid state");
    });
    it("zero received weight is rejected", async function () {
      const f = await loadFixture(deployFixture);
      await toStage(f, 3);
      await expect(f.c.connect(f.recycler).confirmReceipt(1, 0, "x")).to.be.revertedWith("EWT: weight must be positive");
    });
    it("unknown device ID is rejected", async function () {
      const { c } = await loadFixture(deployFixture);
      await expect(c.getDevice(99)).to.be.revertedWith("EWT: unknown device");
    });
  });

  describe("Recycling", function () {
    it("mass balance mismatch is rejected", async function () {
      const f = await loadFixture(deployFixture);
      await toStage(f, 4);
      await expect(f.c.connect(f.recycler).completeRecycling(1, 1500, 400, CERT, "x"))
        .to.be.revertedWith("EWT: mass balance mismatch");
    });
    it("exact mass balance is accepted and totals update", async function () {
      const f = await loadFixture(deployFixture);
      await toStage(f, 5);
      const d = await f.c.getDevice(1);
      expect(d.recoveredGrams).to.equal(1500);
      expect(d.residualGrams).to.equal(500);
      expect(await f.c.totalRecoveredGrams()).to.equal(1500);
    });
    it("certificate hash is required", async function () {
      const f = await loadFixture(deployFixture);
      await toStage(f, 4);
      await expect(f.c.connect(f.recycler).completeRecycling(1, 1500, 500, ethers.ZeroHash, "x"))
        .to.be.revertedWith("EWT: certificate hash required");
    });
    it("Green Points equal recovered grams / 100", async function () {
      const f = await loadFixture(deployFixture);
      await toStage(f, 5);
      expect(await f.c.greenPoints(f.consumer.address)).to.equal(15);
    });
    it("verifyCertificate is true only for the right hash after recycling", async function () {
      const f = await loadFixture(deployFixture);
      await toStage(f, 4);
      expect(await f.c.verifyCertificate(1, CERT)).to.equal(false);
      await f.c.connect(f.recycler).completeRecycling(1, 1500, 500, CERT, "done");
      expect(await f.c.verifyCertificate(1, CERT)).to.equal(true);
      expect(await f.c.verifyCertificate(1, OTHER)).to.equal(false);
    });
    it("history records the correct actors in order", async function () {
      const f = await loadFixture(deployFixture);
      await toStage(f, 5);
      const h = await f.c.getHistory(1);
      expect(h[0].actor).to.equal(f.producer.address);
      expect(h[1].actor).to.equal(f.consumer.address);
      expect(h[2].actor).to.equal(f.collector.address);
      expect(h[5].actor).to.equal(f.recycler.address);
      expect(h[5].status).to.equal(Status.Recycled);
    });
    it("statusCount tracks transitions", async function () {
      const f = await loadFixture(deployFixture);
      await toStage(f, 5);
      expect(await f.c.statusCount(Status.Recycled)).to.equal(1);
      expect(await f.c.statusCount(Status.Registered)).to.equal(0);
    });
    it("verifyMetadata matches only the registered hash", async function () {
      const f = await loadFixture(deployFixture);
      await toStage(f, 0);
      expect(await f.c.verifyMetadata(1, META)).to.equal(true);
      expect(await f.c.verifyMetadata(1, OTHER)).to.equal(false);
    });
  });

  describe("Pause", function () {
    it("admin pauses and registration reverts", async function () {
      const { c, producer, consumer } = await loadFixture(deployFixture);
      await c.setPaused(true);
      await expect(c.connect(producer).registerDevice(1, META, consumer.address, "x"))
        .to.be.revertedWith("EWT: system paused");
    });
    it("unpausing restores operation", async function () {
      const { c, producer, consumer } = await loadFixture(deployFixture);
      await c.setPaused(true);
      await c.setPaused(false);
      await expect(c.connect(producer).registerDevice(1, META, consumer.address, "x")).to.not.be.reverted;
    });
    it("non-admin cannot pause", async function () {
      const { c, outsider } = await loadFixture(deployFixture);
      await expect(c.connect(outsider).setPaused(true)).to.be.revertedWith("EWT: caller lacks required role");
    });
  });
});
```

Count check: Roles 5 + Registration 6 + Lifecycle 9 + Recycling 8 + Pause 3 = 31 tests.

### 8.6 Backend

Install in `backend/`: `npm install express@4 cors ethers@6.13.5 better-sqlite3@11 dotenv`. Add script `"start": "node src/index.js"`. Use CommonJS (default). `.env.example`:

```
PORT=4000
RPC_URL=http://127.0.0.1:8545
```

**`backend/src/canonical.js`**

```js
const crypto = require("crypto");

// Fixed key order and trimmed values: frontend and backend MUST produce the same string.
function canonicalMetadata(m) {
  return JSON.stringify({
    name: String(m.name || "").trim(),
    brand: String(m.brand || "").trim(),
    model: String(m.model || "").trim(),
    serial: String(m.serial || "").trim(),
    notes: String(m.notes || "").trim(),
  });
}

function metadataHash(m) {
  return "0x" + crypto.createHash("sha256").update(canonicalMetadata(m), "utf8").digest("hex");
}

module.exports = { canonicalMetadata, metadataHash };
```

**`backend/src/catalog.seed.js`** (categories verified from Schedule I of the E-Waste (Management) Rules 2022; sample items are generic names typed by the group, no invented item codes)

```js
const CATEGORIES = [
  { category: 1, code: "ITEW",  name: "IT and telecommunication equipment", count: 27,
    items: ["Laptop", "Desktop computer", "Mobile phone", "Tablet", "Printer", "Router"] },
  { category: 2, code: "CEEW",  name: "Consumer electrical and electronics, and photovoltaic panels", count: 19,
    items: ["Television", "Digital camera", "Music system", "Solar panel"] },
  { category: 3, code: "LSEEW", name: "Large and small electrical and electronic equipment", count: 34,
    items: ["Refrigerator", "Washing machine", "Microwave oven", "Air conditioner"] },
  { category: 4, code: "EETW",  name: "Electrical and electronic tools", count: 8,
    items: ["Electric drill", "Electric saw"] },
  { category: 5, code: "TLSEW", name: "Toys, leisure and sports equipment", count: 6,
    items: ["Electronic toy", "Video game console"] },
  { category: 6, code: "MDW",   name: "Medical devices", count: 10,
    items: ["Blood pressure monitor", "Digital thermometer"] },
  { category: 7, code: "LIW",   name: "Laboratory instruments", count: 2,
    items: ["Gas analyser"] },
];

function seedCatalog(db) {
  const has = db.prepare("SELECT COUNT(*) AS n FROM catalog").get().n;
  if (has > 0) return;
  const insCat = db.prepare("INSERT INTO catalog (category, code, name, official_item_count) VALUES (?, ?, ?, ?)");
  const insItem = db.prepare("INSERT INTO catalog_items (category, name) VALUES (?, ?)");
  db.transaction(() => {
    for (const c of CATEGORIES) {
      insCat.run(c.category, c.code, c.name, c.count);
      for (const it of c.items) insItem.run(c.category, it);
    }
  })();
}

module.exports = { CATEGORIES, seedCatalog };
```

**`backend/src/db.js`**

```js
const Database = require("better-sqlite3");
const path = require("path");
const { seedCatalog } = require("./catalog.seed");

const db = new Database(process.env.DB_PATH || path.join(__dirname, "..", "ecochain.db"));
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS catalog (
  category INTEGER PRIMARY KEY, code TEXT NOT NULL, name TEXT NOT NULL, official_item_count INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS catalog_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT, category INTEGER NOT NULL, name TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS metadata (
  device_id INTEGER PRIMARY KEY, json TEXT NOT NULL, hash TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT, block INTEGER NOT NULL, tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL, name TEXT NOT NULL, device_id INTEGER, actor TEXT,
  data TEXT NOT NULL, ts INTEGER NOT NULL, UNIQUE (tx_hash, log_index));
CREATE TABLE IF NOT EXISTS devices (
  id INTEGER PRIMARY KEY, category INTEGER NOT NULL, owner TEXT NOT NULL,
  status INTEGER NOT NULL DEFAULT 0, recovered_grams INTEGER NOT NULL DEFAULT 0,
  created_block INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS sync_state (key TEXT PRIMARY KEY, value TEXT NOT NULL);
`);

seedCatalog(db);

function getState(key) {
  const row = db.prepare("SELECT value FROM sync_state WHERE key = ?").get(key);
  return row ? row.value : null;
}
function setState(key, value) {
  db.prepare("INSERT INTO sync_state (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
    .run(key, String(value));
}
// Wipes everything derived from the chain. Metadata is wiped too because device IDs restart at 1 on a new chain.
function resetChainData() {
  db.transaction(() => {
    db.exec("DELETE FROM events; DELETE FROM devices; DELETE FROM metadata; DELETE FROM sync_state;");
  })();
}

module.exports = { db, getState, setState, resetChainData };
```

**`backend/src/indexer.js`**

```js
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const { db, getState, setState, resetChainData } = require("./db");

const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const provider = new ethers.JsonRpcProvider(RPC_URL);
const DATA_PATH = path.join(__dirname, "contractData.json");

const status = { phase: "starting", lastBlock: null, address: null, error: null };

function loadContractData() {
  try { return JSON.parse(fs.readFileSync(DATA_PATH, "utf8")); } catch { return null; }
}

const insertEvent = db.prepare(`INSERT OR IGNORE INTO events
  (block, tx_hash, log_index, name, device_id, actor, data, ts) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

function applyEvent(parsed, log, ts) {
  const a = parsed.args;
  const data = {};
  parsed.fragment.inputs.forEach((inp, i) => { data[inp.name] = a[i].toString(); });
  const deviceId = data.deviceId !== undefined ? Number(data.deviceId) : null;
  const actor = data.actor || data.producer || data.recycler || data.by || data.account || null;
  insertEvent.run(log.blockNumber, log.transactionHash, log.index, parsed.name, deviceId, actor, JSON.stringify(data), ts);

  if (parsed.name === "DeviceRegistered") {
    db.prepare("INSERT OR REPLACE INTO devices (id, category, owner, status, recovered_grams, created_block) VALUES (?, ?, ?, 0, 0, ?)")
      .run(deviceId, Number(data.category), data.owner, log.blockNumber);
  } else if (parsed.name === "StatusChanged") {
    db.prepare("UPDATE devices SET status = ? WHERE id = ?").run(Number(data.status), deviceId);
  } else if (parsed.name === "CertificateAnchored") {
    db.prepare("UPDATE devices SET recovered_grams = ? WHERE id = ?").run(Number(data.recoveredGrams), deviceId);
  }
}

async function syncOnce() {
  const data = loadContractData();
  if (!data) { status.phase = "waiting-for-deploy-file"; return; }
  const code = await provider.getCode(data.address);
  if (code === "0x") { status.phase = "contract-not-found-on-chain"; return; }

  const current = await provider.getBlockNumber();
  const lastBlockRaw = getState("lastBlock");
  const lastHash = getState("lastBlockHash");
  const savedAddress = getState("contractAddress");

  let reset = false;
  if (savedAddress && savedAddress !== data.address) reset = true;
  if (lastBlockRaw !== null && Number(lastBlockRaw) > current) reset = true;
  if (lastBlockRaw !== null && !reset) {
    const blk = await provider.getBlock(Number(lastBlockRaw));
    if (!blk || blk.hash !== lastHash) reset = true;   // chain was restarted
  }
  if (reset) resetChainData();

  const lastBlock = getState("lastBlock");
  const start = lastBlock !== null ? Number(lastBlock) + 1 : data.deployBlock;
  if (start <= current) {
    const iface = new ethers.Interface(data.abi);
    const logs = await provider.getLogs({ address: data.address, fromBlock: start, toBlock: current });
    const times = new Map();
    const pending = [];
    for (const log of logs) {
      let parsed = null;
      try { parsed = iface.parseLog(log); } catch { parsed = null; }
      if (!parsed) continue;
      if (!times.has(log.blockNumber)) {
        const b = await provider.getBlock(log.blockNumber);
        times.set(log.blockNumber, b.timestamp);
      }
      pending.push([parsed, log, times.get(log.blockNumber)]);
    }
    db.transaction(() => { for (const p of pending) applyEvent(...p); })();
  }
  const tip = await provider.getBlock(current);
  setState("lastBlock", current);
  setState("lastBlockHash", tip.hash);
  setState("contractAddress", data.address);
  status.phase = "synced";
  status.lastBlock = current;
  status.address = data.address;
  status.error = null;
}

// Serialize syncs so a manual sync and the timer never overlap.
let chain = Promise.resolve();
function syncNow() {
  chain = chain.then(syncOnce).catch((e) => { status.error = e.message; status.phase = "error"; });
  return chain;
}

function start(intervalMs = 3000) {
  syncNow();
  setInterval(syncNow, intervalMs);
}

module.exports = { start, syncNow, status, provider, loadContractData };
```

**`backend/src/index.js`**

```js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { ethers } = require("ethers");
const { db } = require("./db");
const indexer = require("./indexer");
const { metadataHash, canonicalMetadata } = require("./canonical");

const app = express();
app.use(cors());
app.use(express.json({ limit: "100kb" }));

app.get("/api/health", async (req, res) => {
  let chainReachable = false;
  try { await indexer.provider.getBlockNumber(); chainReachable = true; } catch { /* node offline */ }
  res.json({ backend: "ok", chainReachable, ...indexer.status });
});

app.get("/api/catalog", (req, res) => {
  const cats = db.prepare("SELECT * FROM catalog ORDER BY category").all();
  const items = db.prepare("SELECT category, name FROM catalog_items ORDER BY id").all();
  res.json(cats.map((c) => ({ ...c, items: items.filter((i) => i.category === c.category).map((i) => i.name) })));
});

app.get("/api/devices", (req, res) => {
  const where = [];
  const params = [];
  if (req.query.status !== undefined) { where.push("d.status = ?"); params.push(Number(req.query.status)); }
  if (req.query.category !== undefined) { where.push("d.category = ?"); params.push(Number(req.query.category)); }
  if (req.query.owner) { where.push("lower(d.owner) = lower(?)"); params.push(String(req.query.owner)); }
  const sql = `SELECT d.*, m.json AS meta FROM devices d LEFT JOIN metadata m ON m.device_id = d.id
               ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY d.id DESC LIMIT 500`;
  const rows = db.prepare(sql).all(...params).map((r) => ({ ...r, meta: r.meta ? JSON.parse(r.meta) : null }));
  res.json(rows);
});

app.get("/api/devices/:id", (req, res) => {
  const id = Number(req.params.id);
  const d = db.prepare("SELECT * FROM devices WHERE id = ?").get(id);
  if (!d) return res.status(404).json({ error: "Device not indexed" });
  const m = db.prepare("SELECT json, hash FROM metadata WHERE device_id = ?").get(id);
  const events = db.prepare("SELECT * FROM events WHERE device_id = ? ORDER BY id").all(id)
    .map((e) => ({ ...e, data: JSON.parse(e.data) }));
  res.json({ ...d, meta: m ? JSON.parse(m.json) : null, metaHash: m ? m.hash : null, events });
});

app.post("/api/devices/:id/metadata", async (req, res) => {
  try {
    await indexer.syncNow(); // makes sure a chain reset is handled before saving
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "Invalid device id" });
    const m = req.body || {};
    for (const k of ["name", "brand", "model"]) {
      if (!m[k] || !String(m[k]).trim()) return res.status(400).json({ error: `Missing field: ${k}` });
    }
    const data = indexer.loadContractData();
    if (!data) return res.status(503).json({ error: "Contract not deployed yet" });
    const contract = new ethers.Contract(data.address, data.abi, indexer.provider);
    let dev;
    try { dev = await contract.getDevice(id); } catch { return res.status(404).json({ error: "Device not found on chain" }); }
    const hash = metadataHash(m);
    if (hash.toLowerCase() !== String(dev.metaHash).toLowerCase()) {
      return res.status(400).json({ error: "Metadata hash does not match the on-chain hash" });
    }
    db.prepare("INSERT OR REPLACE INTO metadata (device_id, json, hash, created_at) VALUES (?, ?, ?, ?)")
      .run(id, canonicalMetadata(m), hash, new Date().toISOString());
    res.json({ ok: true, hash });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/events", (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 500);
  const rows = db.prepare("SELECT * FROM events ORDER BY id DESC LIMIT ?").all(limit)
    .map((e) => ({ ...e, data: JSON.parse(e.data) }));
  res.json(rows);
});

app.get("/api/analytics", (req, res) => {
  const byStatus = db.prepare("SELECT status, COUNT(*) AS count FROM devices GROUP BY status ORDER BY status").all();
  const byCategory = db.prepare("SELECT category, COUNT(*) AS count FROM devices GROUP BY category ORDER BY category").all();
  const recovered = db.prepare("SELECT COALESCE(SUM(recovered_grams), 0) AS grams FROM devices").get().grams;
  const perDay = db.prepare(`SELECT date(ts, 'unixepoch') AS day, COUNT(*) AS count FROM events
                             WHERE name = 'DeviceRegistered' GROUP BY day ORDER BY day`).all();
  res.json({ byStatus, byCategory, recoveredGrams: recovered, registeredPerDay: perDay });
});

const PORT = Number(process.env.PORT) || 4000;
indexer.start();
app.listen(PORT, () => console.log(`EcoChain API listening on http://localhost:${PORT}`));
```

If `better-sqlite3` cannot be installed on the student's machine, keep the same exports (`db`-like functions) and replace the internals of `db.js` with a JSON-file store; no other file should change. Try this only after two failed install attempts.

### 8.7 Frontend

Install in `frontend/`: `npm install react@18.3.1 react-dom@18.3.1 react-router-dom@6 ethers@6.13.5` and `npm install --save-dev vite@5 @vitejs/plugin-react@4`. Scripts: `"dev": "vite"`, `"build": "vite build"`. `vite.config.js`: `import { defineConfig } from "vite"; import react from "@vitejs/plugin-react"; export default defineConfig({ plugins: [react()], server: { port: 5173 } });`. Create `index.html` with `<div id="root"></div>` and `<script type="module" src="/src/main.jsx"></script>`. `contractData.json` must exist (run deploy) before `npm run dev`.

**`frontend/src/services/hash.js`**

```js
// Must match backend/src/canonical.js exactly (same keys, same order, trimmed).
export function canonicalMetadata(m) {
  return JSON.stringify({
    name: String(m.name || "").trim(),
    brand: String(m.brand || "").trim(),
    model: String(m.model || "").trim(),
    serial: String(m.serial || "").trim(),
    notes: String(m.notes || "").trim(),
  });
}

async function sha256Bytes(buffer) {
  // crypto.subtle works on http://localhost (secure context). It will not work on a plain LAN IP.
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return "0x" + Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function metadataHash(m) {
  return sha256Bytes(new TextEncoder().encode(canonicalMetadata(m)));
}

export async function fileHash(file) {
  return sha256Bytes(await file.arrayBuffer());
}
```

**`frontend/src/services/api.js`**

```js
const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function request(path, options) {
  try {
    const res = await fetch(`${BASE}${path}`, options);
    const body = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, error: (body && body.error) || `HTTP ${res.status}` };
    return { ok: true, data: body };
  } catch {
    return { ok: false, error: "Backend not reachable" };   // pages must still render
  }
}

export const api = {
  health: () => request("/api/health"),
  catalog: () => request("/api/catalog"),
  devices: (query = "") => request(`/api/devices${query}`),
  device: (id) => request(`/api/devices/${id}`),
  saveMetadata: (id, meta) => request(`/api/devices/${id}/metadata`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(meta),
  }),
  events: (limit = 50) => request(`/api/events?limit=${limit}`),
  analytics: () => request("/api/analytics"),
};
```

**`frontend/src/services/chain.js`**

```js
import { ethers } from "ethers";
import contractData from "../contracts/contractData.json";

export const RPC_URL = "http://127.0.0.1:8545";
export const provider = new ethers.JsonRpcProvider(RPC_URL);

export const PERSONAS = [
  { index: 0, name: "Regulator", role: "Admin" },
  { index: 1, name: "Producer", role: "Producer" },
  { index: 2, name: "Consumer A", role: "Consumer" },
  { index: 3, name: "Collector", role: "Collector" },
  { index: 4, name: "Recycler", role: "Recycler" },
  { index: 5, name: "Unauthorized", role: "None" },
  { index: 6, name: "Consumer B", role: "Consumer" },
];

export const ROLE = ["None", "Admin", "Producer", "Consumer", "Collector", "Recycler"];
export const STATUS = ["Registered", "Pickup requested", "Collected", "In transit", "At recycler", "Recycled"];
export const CATEGORIES = [
  "IT & telecom (ITEW)", "Consumer electronics & PV (CEEW)", "Large & small equipment (LSEEW)",
  "Electrical tools (EETW)", "Toys, leisure & sports (TLSEW)", "Medical devices (MDW)", "Lab instruments (LIW)",
];

export function readContract() {
  return new ethers.Contract(contractData.address, contractData.abi, provider);
}

export async function writeContract(personaIndex) {
  const signer = await provider.getSigner(personaIndex);   // unlocked Hardhat account, no private key in code
  return new ethers.Contract(contractData.address, contractData.abi, signer);
}

export function friendlyError(e) {
  const text = [e && e.reason, e && e.shortMessage, e && e.message, JSON.stringify((e && (e.info || e.error)) || {})]
    .filter(Boolean).join(" ");
  const own = text.match(/EWT: [^'"\\\n{}]+/);
  if (own) return own[0].trim();
  const generic = text.match(/reverted with reason string '([^']+)'/);
  return generic ? generic[1] : (e && (e.shortMessage || e.message)) || "Transaction failed";
}

// Sends a state-changing call as the chosen persona and returns a uniform result object.
export async function sendTx(personaIndex, method, args = []) {
  try {
    const c = await writeContract(personaIndex);
    const tx = await c[method](...args);
    const receipt = await tx.wait();
    return {
      ok: true, hash: tx.hash, blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(), receipt, contract: c,
    };
  } catch (e) {
    return { ok: false, error: friendlyError(e) };
  }
}

export function deviceIdFromReceipt(contract, receipt) {
  for (const log of receipt.logs) {
    try {
      const p = contract.interface.parseLog(log);
      if (p && p.name === "DeviceRegistered") return Number(p.args.deviceId);
    } catch { /* not our event */ }
  }
  return null;
}

// Reads every device directly from the chain (works even if the backend is down).
export async function fetchAllDevices() {
  const c = readContract();
  const count = Number(await c.deviceCount());
  const ids = Array.from({ length: count }, (_, i) => i + 1);
  const devices = await Promise.all(ids.map((id) => c.getDevice(id)));
  return devices.map((d) => ({
    id: Number(d.id), category: Number(d.category), metaHash: d.metaHash, producer: d.producer,
    owner: d.owner, custodian: d.custodian, pendingRecipient: d.pendingRecipient,
    status: Number(d.status), receivedGrams: Number(d.receivedGrams), recoveredGrams: Number(d.recoveredGrams),
    residualGrams: Number(d.residualGrams), certificateHash: d.certificateHash,
    createdAt: Number(d.createdAt), updatedAt: Number(d.updatedAt),
  }));
}

export async function fetchHistory(id) {
  const h = await readContract().getHistory(id);
  return h.map((e) => ({ status: Number(e.status), actor: e.actor, timestamp: Number(e.timestamp), note: e.note }));
}

export const shortAddr = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "");
```

**`frontend/src/App.jsx`** (shape; the agent completes the pages)

```jsx
import { createContext, useContext, useState } from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { PERSONAS } from "./services/chain";
import Dashboard from "./pages/Dashboard";
import RegisterDevice from "./pages/RegisterDevice";
import MyDevices from "./pages/MyDevices";
import CollectorConsole from "./pages/CollectorConsole";
import RecyclerConsole from "./pages/RecyclerConsole";
import TrackDevice from "./pages/TrackDevice";
import VerifyCertificate from "./pages/VerifyCertificate";
import Admin from "./pages/Admin";
import Transactions from "./pages/Transactions";

export const PersonaContext = createContext({ persona: PERSONAS[0], setPersona: () => {} });
export const usePersona = () => useContext(PersonaContext);

export default function App() {
  const [persona, setPersona] = useState(PERSONAS[0]);
  return (
    <PersonaContext.Provider value={{ persona, setPersona }}>
      <BrowserRouter>
        <header className="top">
          <strong>EcoChain</strong>
          <nav>
            <NavLink to="/">Dashboard</NavLink>
            <NavLink to="/register">Register</NavLink>
            <NavLink to="/my-devices">My devices</NavLink>
            <NavLink to="/collector">Collector</NavLink>
            <NavLink to="/recycler">Recycler</NavLink>
            <NavLink to="/track">Track</NavLink>
            <NavLink to="/verify">Verify</NavLink>
            <NavLink to="/admin">Admin</NavLink>
            <NavLink to="/transactions">Transactions</NavLink>
          </nav>
          <select value={persona.index} onChange={(e) => setPersona(PERSONAS[Number(e.target.value)])}>
            {PERSONAS.map((p) => <option key={p.index} value={p.index}>{p.name} ({p.role})</option>)}
          </select>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/register" element={<RegisterDevice />} />
            <Route path="/my-devices" element={<MyDevices />} />
            <Route path="/collector" element={<CollectorConsole />} />
            <Route path="/recycler" element={<RecyclerConsole />} />
            <Route path="/track" element={<TrackDevice />} />
            <Route path="/verify" element={<VerifyCertificate />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/transactions" element={<Transactions />} />
          </Routes>
        </main>
      </BrowserRouter>
    </PersonaContext.Provider>
  );
}
```

**Reference page `frontend/src/pages/RegisterDevice.jsx`** (pattern every action page should follow)

```jsx
import { useEffect, useState } from "react";
import { usePersona } from "../App";
import { PERSONAS, CATEGORIES, provider, sendTx, deviceIdFromReceipt } from "../services/chain";
import { metadataHash } from "../services/hash";
import { api } from "../services/api";

export default function RegisterDevice() {
  const { persona } = usePersona();
  const consumers = PERSONAS.filter((p) => p.role === "Consumer");
  const [catalog, setCatalog] = useState([]);
  const [form, setForm] = useState({ category: 1, name: "", brand: "", model: "", serial: "", notes: "", consumerIndex: consumers[0].index });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => { api.catalog().then((r) => r.ok && setCatalog(r.data)); }, []);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setResult(null);
    const meta = { name: form.name, brand: form.brand, model: form.model, serial: form.serial, notes: form.notes };
    const hash = await metadataHash(meta);
    const ownerAddr = (await provider.getSigner(Number(form.consumerIndex))).address;
    const tx = await sendTx(persona.index, "registerDevice", [Number(form.category), hash, ownerAddr, "Registered by producer"]);
    if (!tx.ok) { setResult({ ok: false, message: tx.error }); setBusy(false); return; }
    const id = deviceIdFromReceipt(tx.contract, tx.receipt);
    const saved = await api.saveMetadata(id, meta);   // backend re-checks the hash against the chain
    setResult({ ok: true, id, hash: tx.hash, block: tx.blockNumber, gas: tx.gasUsed,
      metaNote: saved.ok ? "Metadata saved and verified against on-chain hash." : `Metadata not saved: ${saved.error}` });
    setBusy(false);
  }

  return (
    <form onSubmit={submit}>
      <h2>Register device (acting as {persona.name})</h2>
      <select value={form.category} onChange={(e) => set("category", e.target.value)}>
        {CATEGORIES.map((c, i) => <option key={i} value={i + 1}>{c}</option>)}
      </select>
      <input placeholder="Device name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
      <input placeholder="Brand" value={form.brand} onChange={(e) => set("brand", e.target.value)} required />
      <input placeholder="Model" value={form.model} onChange={(e) => set("model", e.target.value)} required />
      <input placeholder="Serial (optional)" value={form.serial} onChange={(e) => set("serial", e.target.value)} />
      <select value={form.consumerIndex} onChange={(e) => set("consumerIndex", e.target.value)}>
        {consumers.map((c) => <option key={c.index} value={c.index}>{c.name}</option>)}
      </select>
      <button disabled={busy}>{busy ? "Sending…" : "Register on blockchain"}</button>
      {result && (result.ok ? (
        <div className="ok">Device #{result.id} registered. Tx {result.hash} · block {result.block} · gas {result.gas}. {result.metaNote}</div>
      ) : (<div className="err">Rejected: {result.message}</div>))}
    </form>
  );
}
```

The consumer's address comes from `provider.getSigner(index)` (the node's unlocked account), so no addresses or keys are hard-coded.

---
## PART 9 — FRONTEND PAGES AND DATA

### 9.1 Pages (build in this order)

Every action page follows the pattern of `RegisterDevice.jsx`: read the current persona, call `sendTx(persona.index, method, args)`, show the **real revert message** on failure, and on success show **tx hash, block number and gas used**. Disable buttons while a transaction is pending. Never crash if the backend is offline; show a small "Backend offline — blockchain features still work" banner using `api.health()`.

| # | Page | Persona | Content and behavior |
| :-- | :-- | :-- | :-- |
| 1 | Header + persona switcher | all | Shows selected persona name, role badge and short address. Switching only changes which signer index is used |
| 2 | Register Device | Producer | Form per the reference page; computes metadata hash; saves metadata to backend after the transaction |
| 3 | My Devices | Consumer | Lists devices owned by the persona (from `fetchAllDevices()` filtered by owner), "Request pickup" button for status 0, Green Points balance (`greenPoints(address)`) |
| 4 | Collector Console | Collector | Table of status 1 devices with "Confirm collection"; table of status 2 devices held by this collector with a recycler dropdown and "Dispatch" |
| 5 | Recycler Console | Recycler | Status 3 devices designated to this recycler: weight input and "Confirm receipt". Status 4 devices: recovered grams, residual grams, certificate PDF picker; compute `fileHash(file)` and call `completeRecycling`. Show the live sum "recovered + residual vs received" |
| 6 | Track Device | all | Device ID input; shows device fields, timeline from `fetchHistory(id)` (status name, actor, time, note), and "Metadata integrity": fetch metadata from `api.device(id)`, hash it with `metadataHash`, compare with on-chain `metaHash` → ✓ or ✗ |
| 7 | Verify Certificate | public | Device ID plus PDF file input; compute `fileHash(file)`; call `readContract().verifyCertificate(id, hash)`; show a large ✅ Authentic or ❌ Does not match |
| 8 | Admin | Admin | Assign role form (address, role dropdown) and Pause/Unpause button; shows current `paused()` |
| 9 | Dashboard | all | Counters from the contract (`deviceCount`, `statusCount(0..5)`, `totalRecoveredGrams`), CSS bar chart of statuses, and from `/api/analytics`: devices per category and registered per day (hide the backend part if offline) |
| 10 | Transactions | all | Table from `/api/events`: event name, device, actor, block, tx hash; plus a session list of transactions sent from this browser with gas used |

Styling: simple, clean, consistent CSS in one `styles.css` (cards, tables, badges, green/red result banners). No UI library.

### 9.2 Persona behavior
Seven personas exist (Section 4.2). The "Unauthorized" persona has no role and is used to demonstrate rejected transactions. Show the persona's role on screen at all times.

### 9.3 Data (no external dataset, no licensing risk)

1. **Equipment catalog (real reference data):** the 7 categories of Schedule I of the E-Waste (Management) Rules, 2022, with official item counts (27, 19, 34, 8, 6, 10, 2) as in `catalog.seed.js`. Sample items are generic names written by the group. **Do not invent item codes such as "ITEW5"**; add item codes only if copied from the official Schedule I text, and cite that source in the report.
2. **Synthetic demo data:** `seed.js` creates 30 devices across two consumers and varied stages. Label it "simulated demo data" in the report and slides.
3. **Context statistic:** use one headline e-waste figure from the UN Global E-waste Monitor on the problem slide, cited. Verify the number at the source before using it.

---

## PART 10 — BUILD PHASES (each has a DONE WHEN check)

### 10.0 Time-boxed tiers ("Fast Track" — use this when time is short)

The architecture is layered so the project can be **submitted after Tier 1** and improved afterwards. The front end reads and writes the smart contract directly, so the backend is not needed for the core demo.

| Tier | What it contains | Phases and pages | Submittable? |
| :-- | :-- | :-- | :-- |
| **Tier 1 — Minimum Submission** | Contract + 31 tests, local chain, deploy, front end with persona switcher, Register, My Devices, Collector, Recycler, Track (timeline), Verify Certificate, Admin, Dashboard (on-chain counters only), evidence pack | Phases 0, 1, 2, 3, then **Phase 5 (pages 1–9)**, then Phase 7 | **Yes.** Meets all five written requirements |
| **Tier 2 — Full stack** | Backend + SQLite + event indexer, metadata store and integrity check, Transactions page, analytics, 30 seeded devices, edge-case tests | Phase 4, Transactions page, Phase 6 | Yes (stronger) |
| **Tier 3 — Stretch** | MetaMask mode, extra polish | Phase 8 | Optional |

Fast Track rules:
1. Finish a tier's DONE WHEN before starting the next tier. Never skip Phase 2 (tests).
2. In Tier 1, device details (name, brand, model) are hashed and sent on-chain but not stored off-chain, so the device list shows ID, category and status; the metadata-integrity check and analytics arrive in Tier 2. `seed.js` can still run without the backend (it prints a warning and continues).
3. **Tier 1 acceptance:** 31 tests pass · the full lifecycle runs in the browser · Unauthorized account is rejected on screen · mass-balance mismatch is rejected · certificate verify shows ✅ then ❌ after tampering · `docs/` has screenshots, test output and transaction hashes.
4. Record the chosen mode in `PROGRESS.md` ("Mode: Full" or "Mode: Fast Track").

### 10.1 Phases

**Phase 0 — Starter evaluation** (Part 7). *DONE WHEN:* `docs/starter-evaluation.md` exists with license, results and verdict (Plan A or Plan B).

**Phase 1 — Project setup (30 min).** Create the folder structure (Part 5). In `blockchain/`: `npm init -y`, install pinned dev dependencies (Section 8.2), add `hardhat.config.js` and scripts. Add root `.gitignore`, `LICENSE` (MIT, group names), root `package.json` scripts (Section 10.2).
*DONE WHEN:* `npx hardhat --version` prints 2.29.1.

**Phase 2 — Contract and tests (half a day).** Add `EWasteTracker.sol` (8.1) and the test file (8.5).
*DONE WHEN:* `npx hardhat compile` succeeds and `npm test` shows **31 passing**. Save output: `npm test > ../docs/test-output.txt` (or copy the terminal text).

**Phase 3 — Local chain and deploy (1 hour).** Terminal 1: `npm run node` (leave running). Terminal 2: `npm run deploy` (script 8.3).
*DONE WHEN:* the terminal prints a contract address and both `contractData.json` files exist.

**Phase 4 — Backend (half a day).** Create backend files (8.6) and run `npm start`.
*DONE WHEN:* `http://localhost:4000/api/health` shows `chainReachable: true` and `phase: "synced"`, and `/api/catalog` returns 7 categories.

**Phase 5 — Frontend (1 to 2 days).** Build services and pages in the order of Section 9.1.
*DONE WHEN:* the whole lifecycle for one device runs from the browser (register → pickup → collect → dispatch → receive → recycle) and Track Device shows the full timeline.

**Phase 6 — Seed, polish, edge cases (half a day).** Run `npm run seed` (backend must be running). Add loading and error states. Test: backend killed mid-demo, node restarted, unauthorized account.
*DONE WHEN:* the dashboard shows data from 30 seeded devices, and every item in Section 0.3 passes.

**Phase 7 — Evidence and documents (1 day).** Collect screenshots, transaction hashes, test output, the architecture diagram, report and slides (Part 15). Fill Part 16 (credits).
*DONE WHEN:* `docs/` contains the items listed in Part 15 and the demo script (Part 11) has been rehearsed twice.

**Phase 8 — Optional stretch.** MetaMask mode (7.4). Only if every previous DONE WHEN passed.

### 10.2 Daily start (4 terminals) and root scripts

1. `npm run chain`   (Hardhat node, keep open)
2. `npm run deploy`
3. `npm run backend`
4. `npm run seed`, then `npm run frontend`

Root `package.json` scripts:
`"chain": "npm --prefix blockchain run node"`, `"deploy": "npm --prefix blockchain run deploy"`, `"seed": "npm --prefix blockchain run seed"`, `"test": "npm --prefix blockchain test"`, `"backend": "npm --prefix backend start"`, `"frontend": "npm --prefix frontend run dev"`.

### 10.3 Reset rule
Whenever the Hardhat node is stopped and restarted, the chain is empty. Run deploy again, then seed. The backend detects the reset on its own within a few seconds (Section 8.6); refresh the browser.

---

## PART 11 — DEMO SCRIPT (about 6 minutes; rehearse twice)

1. Show the Hardhat node terminal (real local chain) and the Dashboard counters.
2. Admin persona: show the roles table.
3. Producer: register a laptop for Consumer A. Point out tx hash, block number, gas used.
4. **Negative:** switch to Unauthorized and attempt to register. Show the revert message.
5. Consumer A: request pickup.
6. Collector: confirm collection, dispatch to the recycler.
7. Recycler: confirm receipt (2000 g). Try recovered 1500 + residual 400 → **rejected (mass balance)**. Then 1500 + 500 with a certificate PDF → accepted.
8. Consumer A: Green Points increased (15).
9. Track Device: full timeline; metadata integrity ✓.
10. Verify Certificate: correct PDF → ✅. Edit one character in the PDF, save, retry → ❌.
11. Show `docs/test-output.txt` (31 passing) and the Transactions page.
12. Optional wow: open the SQLite file, edit a device name by hand, refresh Track Device → metadata integrity ✗ (explains why the hash is on-chain).

Prepare in advance: a sample certificate PDF (any one-page PDF named `certificate-1.pdf`) and a tampered copy.

---

## PART 12 — SECURITY AND PRODUCTION-ORIENTED DESIGN

### 12.1 Security considerations

| Topic | Handling |
| :-- | :-- |
| Access control | Role mapping plus modifiers on every state change; verified by negative tests |
| State machine | Each function requires the exact previous status; no skipping |
| Input validation | Category range, non-empty hashes, positive weight, zero-address checks, mass balance |
| Reentrancy | No ether transfers and no external calls; state is updated before events |
| Integer safety | Solidity 0.8 reverts on overflow/underflow |
| Emergency stop | Admin can pause all state changes |
| Key handling | No private keys in code or backend; local test accounts only; `.env` git-ignored |
| Data privacy | Only hashes and addresses on-chain; no personal details |
| Frontend trust | The UI cannot cheat; the contract enforces every rule |
| Backend integrity | Metadata accepted only if its hash matches the on-chain hash; integrity re-checked in the UI |
| Known limits | Single trusted admin; physical events depend on honest reporting (oracle problem); local chain only |

### 12.2 What "production-oriented" means here

| Implemented in this project | Roadmap for a real rollout (not implemented) |
| :-- | :-- |
| Layered architecture (UI, API, DB, chain) | Admin as multi-signature wallet |
| Role-based access control in the contract | Authenticated users, KYC of recyclers |
| Mass-balance validation | Weighbridge/IoT or RFID/QR tagging to bridge physical and digital |
| 31 automated tests | Independent security audit |
| Event indexer, analytics | Public testnet then mainnet or a Layer-2 |
| Pausable contract, validation, error handling | IPFS or cloud storage for certificate files |
| Environment config, README, MIT license | CI pipeline, monitoring, upgradeable contract pattern |
| SQLite | PostgreSQL |

---

## PART 13 — ERROR RECOVERY PROTOCOL AND PLAYBOOK

> Errors are expected. **An error is never a reason to change the goal.** Handle every error with this protocol, then look up the symptom in the playbook.

### 13.1 Protocol (same as `AGENTS.md` section 5)

1. **STOP** editing. 2. **RE-ANCHOR** (North Star N.6). 3. **CAPTURE** the exact error text, command and file/line. 4. **CLASSIFY** it: *environment* (Node, ports, internet, OS), *dependency* (versions, install), *code* (syntax, logic), *data* (stale chain, stale database), or *wiring* (contractData.json, addresses, ports). 5. **FIX SMALL** using the playbook. 6. **VERIFY** by re-running the failing command and then the phase's DONE WHEN. 7. **LOG** one line in `PROGRESS.md` → Error log.

**Escalation:** same error twice → use the listed alternate. Still failing → write `BLOCKER.md` (exact error, commands, two attempts, hypothesis) and **stop and ask the student**.

### 13.2 Is my fix allowed? (decision test)

A fix is **allowed** only if all answers are YES: Does it keep the dish (N.1) unchanged? Does it keep every constraint (N.3)? Does it keep the contract of record and the pinned versions? Is it the smallest change that works? If any answer is NO, do not apply it; use the playbook alternate or escalate.

### 13.3 Playbook by symptom

**Environment and install**

| Symptom | Likely cause | Fix | Never |
| :-- | :-- | :-- | :-- |
| `node: command not found` or Node is 18/24 and tools warn | Wrong or missing Node | Install Node 22 LTS, reopen the terminal, `node -v` | Upgrade packages to match a newer Node |
| `npm ERR! ERESOLVE` in `blockchain/` (for example hardhat-chai-matchers wants a newer hardhat) | Hardhat version does not satisfy a toolbox peer | The Hardhat pin is **2.29.1**. In `blockchain/` run `npm install --save-dev hardhat@2.29.1 @nomicfoundation/hardhat-toolbox@5.0.0`. If another peer complains, read which hardhat range it asks for and pick a Hardhat **2.x** version inside it | `--legacy-peer-deps` or `--force` (they skip needed peers and break tests); moving to Hardhat 3 |
| `Cannot find module '@nomicfoundation/hardhat-toolbox'` | Installed in the wrong folder | `cd blockchain` and install there (not in root) | Create a second config elsewhere |
| `HH19` / "ESM project" error | `"type": "module"` in `blockchain/package.json` | Remove it; use CommonJS | Convert Hardhat config to ESM |
| `HH502` / cannot download compiler list | No internet on first compile | Connect to internet, rerun `npx hardhat compile` | Change the Solidity version |
| PowerShell blocks npm scripts | Execution policy | Use Command Prompt or Git Bash | Disable Windows security globally |
| `EADDRINUSE` on 8545, 4000 or 5173 | Old process running | Stop the old process (close its terminal); or change the port in one place and update `.env`/`api.js`/`chain.js` | Remove the service |
| `better-sqlite3` build/load error (node-gyp, Python, Visual Studio) | No prebuilt binary for this setup | Use Node 22 LTS, delete `node_modules` and `package-lock.json` in `backend/`, reinstall. After two failures: (a) on **Windows ARM64** machines, install the **x64** Node 22 MSI instead (it runs under Windows' built-in emulation and has prebuilt native modules), delete `node_modules` and retry; (b) still failing: JSON-file store inside `db.js` with identical exports (`db`-style helpers, `getState`, `setState`, `resetChainData`) | Switch to a cloud or other database |

**Compile and tests**

| Symptom | Likely cause | Fix | Never |
| :-- | :-- | :-- | :-- |
| `TypeError`/`DeclarationError` in the contract | Typo from editing | Compare with Section 8.1 character by character; restore | Rename public functions |
| `Stack too deep` | Compiler limit | Add `viaIR: true` to the Solidity `settings` in `hardhat.config.js` | Split the lifecycle into new contracts |
| `revertedWith is not a function` | Toolbox not loaded | Ensure `require("@nomicfoundation/hardhat-toolbox")` is the first line of the config | Replace chai matchers with try/catch hacks |
| `loadFixture` import error | Wrong import path | `require("@nomicfoundation/hardhat-toolbox/network-helpers")` | Remove fixtures |
| A test fails with a different revert string | Code or test deviates | Check table 8.1b and fix the one that deviates | Loosen the assertion |
| `getDevice(99)` test does not revert | `exists` modifier missing on a view | Add `exists(id)` per Section 8.1 | Delete the test |
| BigInt comparison oddities | ethers v6 returns bigint | Compare with numbers via chai matchers or wrap `Number(...)` | Convert everything to strings |

**Chain and wiring**

| Symptom | Likely cause | Fix | Never |
| :-- | :-- | :-- | :-- |
| `ECONNREFUSED 127.0.0.1:8545` | Node not running | Start `npm run chain` in its own terminal and leave it open | Point to a public RPC |
| `call revert exception` / `could not decode result` in the browser | No contract at that address on the current chain (node restarted) | `npm run deploy`, restart backend, hard refresh the browser | Hard-code an address |
| `Cannot find contractData.json` | Deploy not run | `npm run deploy` | Create a fake file with made-up data (a temporary empty placeholder is allowed only to let Vite start, and must be overwritten by deploy) |
| Frontend still uses an old contract | Vite cached the JSON | Stop and restart `npm run dev`; hard refresh | — |
| `provider.getSigner(i)` throws / unknown account | RPC not Hardhat or accounts locked | Confirm the node is Hardhat; fallback `new ethers.Wallet(<public Hardhat key printed by node>, provider)` (local use only) | Use a key from a real wallet |
| Revert text not displayed | Error shape differs | Log the raw error; extend the regex in `friendlyError`, keep the `EWT:` match | Show only "Transaction failed" |
| `TypeError: Do not know how to serialize a BigInt` | BigInt in JSON | Convert with `Number()` or `.toString()` before `JSON.stringify` | — |

**Backend and data**

| Symptom | Likely cause | Fix | Never |
| :-- | :-- | :-- | :-- |
| `/api/health` shows `waiting-for-deploy-file` | `backend/src/contractData.json` missing | `npm run deploy` | — |
| `contract-not-found-on-chain` | Node restarted, contract gone | Redeploy; the indexer resets itself within seconds | Delete the indexer's reset logic |
| Dashboard empty after restarting the chain | Not re-seeded | `npm run deploy`, wait 3 s, `npm run seed` | — |
| Metadata POST returns 400 "hash does not match" | Frontend/backend canonical strings differ | Compare `canonicalMetadata` in both files: same keys, same order, `trim()` | Disable the hash check |
| "Metadata integrity ✗" for a fresh device | Metadata saved with changed fields | Re-save with the same exact input; confirm `hash.js` equals `canonical.js` | Hide the ✗ |
| CORS error in the browser | `cors()` middleware missing | Ensure `app.use(cors())` before routes | Disable browser security |
| `crypto.subtle` is undefined | Opened via IP address | Use `http://localhost:5173` | Install a hashing library that bypasses the browser |
| Seed script: "backend not reachable" | Backend not started | Start backend first, then seed | — |

**Frontend**

| Symptom | Likely cause | Fix | Never |
| :-- | :-- | :-- | :-- |
| Vite: failed to resolve `contractData.json` | Deploy never ran | Run deploy before `npm run dev` | — |
| Blank page, console error about hooks/React | Version mismatch | Reinstall `react@18.3.1 react-dom@18.3.1` | Upgrade to React 19 |
| Button does nothing | Wrong persona (no role) | Check the persona; read the on-screen revert message | Remove role checks |
| Transaction hangs "pending" | Node stopped | Restart node → deploy → seed | — |

**Agent behavior**

| Symptom | Fix |
| :-- | :-- |
| The agent proposes a new framework, database or tool | Reject. Quote N.5 and N.4. Continue with the planned path |
| The agent wants to "simplify" by removing a feature | Reject. Every ingredient I1–I13 is mandatory |
| The agent loops on the same error | Apply 13.1 escalation: alternate → `BLOCKER.md` → stop |
| The agent forgot the plan after a long session | Tell it to re-read `AGENTS.md`, `PROGRESS.md`, North Star, then run the last DONE WHEN check |
| The agent claims success without proof | Require the real command output pasted into `PROGRESS.md` |

### 13.4 When everything seems broken: clean restart sequence

1. Close all terminals. 2. `npm run chain` (new terminal). 3. `npm run deploy`. 4. `npm run backend`. 5. `npm run seed`. 6. `npm run frontend`. 7. Open `http://localhost:5173` and hard refresh. If any step fails, handle that step with the playbook.

---

## PART 14 — VIVA PREPARATION (questions and model answers)

1. **Why blockchain and not just a database?** Parties do not fully trust a single operator; a database admin can edit records. The chain gives an append-only, shared audit trail, and the contract enforces rules.
2. **What exactly is on-chain?** IDs, owner, custodian, status, weights, certificate hash, metadata hash, roles, points and events. Details and files stay off-chain.
3. **How do you prevent fake recyclers?** Only addresses given the Recycler role by the Admin can receive or complete. In production the admin would be a regulator multisig with KYC.
4. **Does blockchain prove the device was really recycled?** No. It proves the record was not altered afterwards. Bridging the physical world needs weighbridge/IoT or audits (oracle problem). We validate with mass balance and certificate hashes.
5. **How does certificate verification work?** The browser hashes the PDF with SHA-256; the contract compares it with the stored hash. Any change flips the result.
6. **What is the metadata hash for?** If someone edits the database, the recomputed hash no longer matches the on-chain value, so tampering is visible.
7. **How is access control implemented?** A role mapping and an `onlyRole` modifier; each function also checks state and ownership.
8. **Why a local blockchain?** Free, fast, deterministic, no real funds. The same Solidity contract can be deployed to a public network by changing the network configuration.
9. **Where are private keys?** Not in the code. Local test accounts sign through the node; MetaMask holds keys in the optional mode.
10. **What happens if the backend is down?** The core lifecycle still works because the front end reads and writes the contract directly.
11. **How are Green Points calculated and can they be abused?** Points = recovered grams / 100, credited only after a Recycler completes the process. Abuse requires a compromised recycler; roadmap includes audits and staking.
12. **What are gas costs?** Each transaction shows gas used on screen; local gas is free, on a public chain it would cost, so an L2 would be used.
13. **How does your project relate to the IEEE paper?** The survey identifies traceability, immutability, audit and hash-based document validation as blockchain benefits for waste management; we implement them for e-waste (Section 3.4).
14. **What would you add for production?** Multisig admin, authentication, IoT weighing, IPFS, audit, public network or L2, CI and monitoring (Section 12.2).
15. **What is original in your work?** The e-waste lifecycle contract, mass-balance validation, certificate and metadata hash anchoring, Green Points, indexer and analytics, test suite and documentation. (If a starter repository was used, state it and what was replaced.)
16. **Limitations?** Single admin, simulated data, local chain, oracle problem, no real identity verification.

---

## PART 15 — DELIVERABLES

### 15.1 `docs/` folder contents
Screenshots of every page and each rejected transaction · `test-output.txt` · transaction hashes with block numbers and gas · architecture diagram · lifecycle state diagram · `starter-evaluation.md` · final report (PDF) · slides · demo video if time allows.

### 15.2 Report outline
1. Introduction and problem statement · 2. Objectives · 3. Literature review: reference paper plus 2–3 related works (cite the repositories and papers you actually read) · 4. Why blockchain and design decisions · 5. System architecture, roles, lifecycle · 6. Smart contract design (functions, events, access control) · 7. Implementation (backend, indexer, frontend, hashing) · 8. Testing and results (31 tests, demo screenshots, gas table) · 9. Security considerations · 10. Limitations and future work · 11. Conclusion · References · Appendix: code listing and links.

### 15.3 Slides outline (12 slides)
1 Title and group · 2 Problem · 3 Objectives · 4 Reference paper and mapping · 5 Why blockchain (on/off-chain table) · 6 Architecture · 7 Roles and lifecycle · 8 Smart contract highlights · 9 Live demo · 10 Test results and security · 11 Limitations and production roadmap · 12 Conclusion and Q&A.

### 15.4 Requirement mapping

| Faculty requirement | Where it is satisfied |
| :-- | :-- |
| Problem, objectives, solution, benefits | Part 3 |
| Architecture: network, contract, users, transactions, workflow | Part 4, Section 8.1 |
| Working prototype (Ethereum, Solidity, Hardhat, MetaMask) | Parts 8–9, Section 7.4 |
| Deployment, execution, validation, transaction verification | Phases 2–3, Transactions page, receipts, tests |
| Demonstration and submission: architecture, implementation, tests, security, code, presentation | Parts 11, 12, 15, GitHub repository |
| Technical paper | Section 3.4 (reference and mapping) |

---

## PART 16 — CREDITS AND LICENSE

- Reference paper: R. W. Ahmad, K. Salah, R. Jayaraman, I. Yaqoob, M. Omar, "Blockchain for Waste Management in Smart Cities: A Survey," *IEEE Access*, vol. 9, 2021 (IEEE Xplore document 9540705).
- Open-source libraries: Hardhat, ethers.js, React, Vite, Express, better-sqlite3, each under its own license.
- **Starter repository (fill in if used):** name / URL / license / what was reused / what was changed. Example for an MIT-licensed starter:
  > "Project scaffolding (Hardhat/React folder layout and persona-switcher idea) is adapted from *PlasticTrace* by Sai-Narayana (MIT License, https://github.com/Sai-Narayana/plastic_trace). The EcoChain contract, backend, indexer, catalog, certificate and metadata hashing, Green Points and tests were developed by our group."
- This project is released under the MIT License. Keep any third-party `LICENSE` text and copyright notices that apply.
- Group 15: Sohan Kateja, Rakshit Golhar, Nikita Khushalani.
