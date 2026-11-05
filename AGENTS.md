# AGENTS.md — EcoChain goal lock (read at the start of EVERY task, phase and error)

This file is short on purpose. The full blueprint is `README.md`. This file never changes during the project.

## 1. THE DISH (final product — never change it)

> **VERSION 2 is current.** README **Part V2** is the active spec and overrides older parts wherever they conflict (contract of record, roles, UI, tests, phases). Start with Phase U0 (audit), then U1 to U7. Version 1 is in git history (tag `phase-7-done`).

**EcoChain** is a free, fully local web app that tracks an e-waste device through six states on a local Ethereum-compatible blockchain:

`Registered → PickupRequested → Collected → InTransit → AtRecycler → Recycled`

- **Blockchain:** Hardhat local node (chainId 31337) + one Solidity contract `EWasteTracker.sol` (the "contract of record" in README Section 8.1). Roles: Admin, Producer, Consumer, Collector, Recycler.
- **Backend:** Node + Express (port 4000) + SQLite. Read-only on the chain. Event indexer, metadata store, analytics.
- **Frontend:** React + Vite (port 5173), persona switcher, 10 pages (README Section 9.1).
- **Special features that must exist:** mass-balance validation, certificate-hash verification, metadata-hash integrity check, Green Points, regulator dashboard, rejected-transaction demo, 31 passing tests, 30 seeded simulated devices.
- **Audience:** a university blockchain mini project. It must be *easy to explain* and *technically strong*.

## 2. KITCHEN RULES (hard constraints)

1. **Everything free and local.** No paid or cloud service, API key, account, faucet, public testnet, Docker, IPFS service, Infura/Alchemy, MongoDB Atlas, Firebase, Supabase.
2. **Pinned versions only** (README Section 4.4): Node 22 LTS, Hardhat 2.29.1, hardhat-toolbox 5.0.0, Solidity 0.8.24, ethers 6.13.5, React 18.3.1, Vite 5, better-sqlite3 11, Express 4. Never upgrade. Never use Hardhat 3, ethers v5, React 19.
3. **Plain JavaScript (CommonJS in blockchain/ and backend/), plain CSS.** No TypeScript, no Tailwind, no chart library, no OpenZeppelin imports. **Only two extra frontend packages are allowed in V2: `jspdf@2.5.2` (certificate PDF) and `lucide-react@0.383.0` (icons).** MetaMask (browser extension) is allowed and expected, with a demo-wallet fallback.
4. **The V2 contract in README Section V2.3 is the contract of record (it supersedes 8.1).** Do not rename functions, change signatures, change revert strings or change the lifecycle. If a change is truly required, change contract + tests + backend + frontend together and log why in `docs/DECISIONS.md`.
5. **No private keys in code.** The frontend signs with `provider.getSigner(index)`. The backend never sends transactions.
6. **Honest output.** Never fake test results, hashes or screenshots. Seed data is labelled "simulated". Never claim a testnet/mainnet deployment.
7. **Attribution.** If code is reused from another repo, keep its LICENSE and credit it in README Part 16.
8. **No scope creep.** Build only what README Part 9 and Part 10 list.

## 3. RULE ZERO — A MISSING INGREDIENT NEVER CHANGES THE DISH

If something is missing or broken (a package will not install, a command fails, a port is busy), **fix or fetch that thing**. Do **not** swap the technology, simplify the goal, mock the blockchain, skip a test or delete a feature. Only the pre-approved alternates in README Part 13 are allowed.

## 4. FORBIDDEN DETOURS

Truffle, Ganache, Foundry, Hyperledger, Remix-only workflows, Next.js, TypeScript, MongoDB, Firebase, Supabase, Docker, Pinata/IPFS, ERC-20/ERC-721 tokens, a fake in-memory "blockchain", localStorage as the database, rewriting the project in another language, upgrading dependencies, commenting out or weakening tests, adding unrequested features or animations.

## 5. ERROR PROTOCOL (do this every time something fails)

1. **STOP.** Do not keep editing blindly.
2. **RE-ANCHOR.** Re-read sections 1–4 of this file and `PROGRESS.md`.
3. **CAPTURE.** Copy the exact error text, the command, and the file/line.
4. **LOOK UP** the symptom in README Part 13 (playbook). Use the listed fix first.
5. **FIX SMALL.** Smallest change that keeps the dish. Never fix an error by removing a requirement.
6. **VERIFY.** Re-run the failing command, then the phase's DONE WHEN check.
7. **LOG** one line in `PROGRESS.md` → "Error log".
8. After **two failed attempts** on the same error: try the alternate listed in the playbook. If still failing: write `BLOCKER.md` (exact error, commands run, two fixes tried, your best hypothesis) and **stop and ask the student**. Do not wander.

## 6. DRIFT CHECK (answer in `PROGRESS.md` before each phase and after any error)

1. What is the final product? (one sentence)
2. Which phase am I in, and what is its DONE WHEN?
3. Which README ingredient (I1–I13) am I working on?
4. Does my planned change alter the contract of record, a pinned version or a constraint? If yes → do not do it.

## 7. WORKING RULES

- Work phase by phase (README V2.12: U0 audit, U1 contract + tests, U2 backend, U3 wallet, U4 UI portals, U5 certificates, U6 dashboard, U7 finish). Do not start a phase before the previous DONE WHEN passes.
- Never say "done" without running the check and pasting its **real output** into `PROGRESS.md`.
- Update `PROGRESS.md` after every step (it is the memory when the chat context resets).
- Commit after each phase: `phase-N: what was done`.
- Keep answers short; the student is a beginner. After each phase show: what changed, commands run, real output, next step.
- If you are about to do something not described in README, stop and re-read the relevant section first.
- If the student says **"Fast Track"** (or time is short), follow README Part 10.0: finish Tier 1 first (backend comes later in Tier 2). Record the mode in `PROGRESS.md`.

## 8. STARTING / RESUMING

- New task: read this file → `PROGRESS.md` → README Part V2 (and older Parts only when needed) → continue from the first unchecked item.
- Resuming after a context reset: read `PROGRESS.md`, run the last DONE WHEN check to see the real state, continue from there. Do not redo finished phases.

## 9. NEVER CLAIM (honesty list)

No claims of: reentrancy tests, mining/consensus as a project concept, reorg handling (only resets), soulbound tokens, EIP-Pausable, worldwide uniqueness, uncited statistics, "verified in browser" unless actually done, or a third-party starter being used when it was not. The certificate proves a file is unchanged and was issued by a wallet; it does not prove physical recycling.
