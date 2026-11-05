# STANDING RULE: GIT AND GITHUB

> **This section is permanent. It must survive chat resets. Do not delete or move it.**

**Repository URL:** https://github.com/missnikk/ecochain-ewaste-tracker

| Rule | Description |
|------|-------------|
| **R1** | Every phase ends with a commit and push: check `git status`, then `git add -A`, `git commit -m "phase-N: <what was done>"`, `git push`. Also commit and push after any significant working step (passing test suite, working page). |
| **R2** | After each successful DONE WHEN check, create and push a tag: `git tag phase-N-done` and `git push origin phase-N-done`. |
| **R3** | Before any risky change (changing the contract, a big refactor), commit first. |
| **R4** | Never commit secrets or generated files: `.env`, private keys, tokens, database files, `node_modules`, `contractData.json`. Always read `git status` before `git add -A`. If a secret was committed, stop and tell the student. |
| **R5** | Never force-push, never rewrite pushed history, and never run `git reset --hard`, `git clean -fd` or delete branches without asking the student first and explaining the effect. |
| **R6** | If a push fails, fix the cause (authentication, network, remote URL) and tell the student. Do not skip pushing. |
| **R7** | If something breaks, roll back safely: show `git log --oneline` and the tags, create a new branch from the last good tag (`git switch -c recovery-from-phase-N phase-N-done`), explain what will change, and continue only with student approval. |
| **R8** | Record each commit hash and tag in PROGRESS.md under Evidence. |
| **R9** | These rules never change the goal or constraints in AGENTS.md. Never edit AGENTS.md. Edit README.md only where it tells you to (Part 16 credits and documentation). |

---

# PROGRESS.md — the agent's memory (update after EVERY step)

> Rules: tick a box only after running its check and pasting the REAL output under "Evidence". Never edit old evidence. If the chat context resets, this file is how you know where you are.

## Goal (copy of AGENTS.md section 1, one line)
EcoChain: free local e-waste lifecycle tracker — Hardhat + Solidity contract + Express/SQLite + React — 31 tests, 10 pages, 30 simulated devices.

## Current status
- Mode: Fast Track (Tier 1 first: Phases 0, 1, 2, 3, then Phase 5 pages 1–9, then Phase 7)
- Current phase: 4
- Last completed step: Phase 3 — Local chain + deploy (contract address 0x5FbDB2315678afecb367f032d93F642f64180aa3)
- Next step: Phase 4 — Backend (`npm run backend`)
- Plan chosen (A = adapt starter, B = build from README code): **Plan A — adapt PlasticTrace starter (MIT license confirmed; 23/23 tests pass)**

## Drift check — Phase 2 (filled 2026-11-05)
1. Final product: EcoChain — free, fully local e-waste lifecycle tracker on Hardhat/Solidity + Express/SQLite + React, 31 tests, 10 pages, 30 simulated devices.
2. Phase 2 — DONE WHEN: `npx hardhat compile` succeeds and `npm test` shows 31 passing. Save output to `docs/test-output.txt`.
3. Ingredient being worked on: I1 (Contract of record), I11 (Test evidence).
4. Does the planned change touch the contract of record / pinned versions / constraints? NO.

## Drift check — Phase 3 (filled 2026-11-05)
1. Final product: EcoChain — free, fully local e-waste lifecycle tracker on Hardhat/Solidity + Express/SQLite + React, 31 tests, 10 pages, 30 simulated devices.
2. Phase 3 — DONE WHEN: the terminal prints a contract address and both `contractData.json` files exist.
3. Ingredient being worked on: I2 (Local chain), I3 (Deploy script writes both contractData.json).
4. Does the planned change touch the contract of record / pinned versions / constraints? NO.

## Drift check — Phase 4 (filled 2026-11-05)
1. Final product: EcoChain — free, fully local e-waste lifecycle tracker on Hardhat/Solidity + Express/SQLite + React, 31 tests, 10 pages, 30 simulated devices.
2. Phase 4 — DONE WHEN: `http://localhost:4000/api/health` shows `chainReachable: true` and `phase: "synced"`, and `/api/catalog` returns 7 categories.
3. Ingredient being worked on: I4 (Backend + SQLite + indexer).
4. Does the planned change touch the contract of record / pinned versions / constraints? NO.

## Phase checklist
- [x] Phase 0 — Starter evaluation (`docs/starter-evaluation.md` written; license checked; verdict recorded)
- [x] Phase 1 — Setup (`npx hardhat --version` prints 2.22.18 / 2.29.1)
- [x] Phase 2 — Contract + tests (`npm test`: 31 passing; `docs/test-output.txt` saved)
- [x] Phase 3 — Local chain + deploy (contract address printed; both contractData.json files exist)
- [ ] Phase 4 — Backend (`/api/health` chainReachable true and phase "synced"; `/api/catalog` returns 7)
- [ ] Phase 5 — Frontend (whole lifecycle for one device works in the browser)
- [ ] Phase 6 — Seed + polish + edge cases (30 devices; backend-down and node-restart tests pass)
- [ ] Phase 7 — Evidence + documents (`docs/` complete; credits filled in README Part 16)
- [ ] Phase 8 — Optional MetaMask mode (only if all above done)
- [ ] Final acceptance (README Section 0.3 all ticked)

## Ingredient checklist (what must exist at the end)
- [x] I1 Contract of record  - [x] I2 Local chain  - [x] I3 Deploy script writes both contractData.json
- [ ] I4 Backend + SQLite + indexer  - [ ] I5 Frontend 10 pages  - [ ] I6 Certificate hash verify
- [ ] I7 Metadata integrity check  - [ ] I8 Mass balance  - [ ] I9 Green Points
- [ ] I10 30 simulated devices  - [x] I11 Test evidence  - [ ] I12 docs/ evidence  - [ ] I13 README credits + LICENSE

## Evidence (paste real command output here, newest at the bottom)

### Phase 3 — 2026-11-05
```
$ npm run deploy

> ecochain@1.0.0 deploy
> npm --prefix blockchain run deploy


> ecochain-blockchain@1.0.0 deploy
> hardhat run scripts/deploy.js --network localhost

EWasteTracker deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Admin: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```
Both `backend/src/contractData.json` and `frontend/src/contracts/contractData.json` generated and verified.  
Tag: `phase-3-done`

### Phase 2 — 2026-11-05
```
$ npx hardhat test
  EWasteTracker
    Roles
      √ deployer is admin (690ms)
      √ admin can assign a role and event is emitted
      √ non-admin cannot assign roles
      √ zero address is rejected
      √ admin cannot change own role
    Registration
      √ producer registers a device and event is emitted
      √ non-producer cannot register
      √ invalid category is rejected (0 and 8)
      √ empty metadata hash is rejected
      √ owner must be a registered consumer
      √ device IDs increment
    Lifecycle
      √ full happy path ends in Recycled with 6 history entries
      √ only the owner can request pickup
      √ collection before pickup request is rejected
      √ dispatch only by the current custodian
      √ dispatch to a non-recycler is rejected
      √ only the designated recycler can confirm receipt
      √ skipping a stage is rejected
      √ zero received weight is rejected
      √ unknown device ID is rejected
    Recycling
      √ mass balance mismatch is rejected
      √ exact mass balance is accepted and totals update
      √ certificate hash is required
      √ Green Points equal recovered grams / 100
      √ verifyCertificate is true only for the right hash after recycling
      √ history records the correct actors in order
      √ statusCount tracks transitions
      √ verifyMetadata matches only the registered hash
    Pause
      √ admin pauses and registration reverts
      √ unpausing restores operation
      √ non-admin cannot pause

  31 passing (949ms)
```
Saved to `docs/test-output.txt`.
Commit: 2f10875 · tag: phase-2-done

### Phase 1 — 2026-11-05
```
npx hardhat --version → 2.22.18
npm install --legacy-peer-deps → exit 0
```
Created: blockchain/package.json, blockchain/hardhat.config.js, root package.json, LICENSE, folder structure.  
Commit: (see below after push)

### Phase 0 — 2026-11-05
```
git clone https://github.com/Sai-Narayana/plastic_trace.git _starter  → succeeded
cd _starter/blockchain && npm install  → exit 0 (50 audit warnings, not blocking)
npx hardhat test → 23 passing (1s)  — Solidity 0.8.24 compiled OK
```
**Verdict:** Plan A. MIT license confirmed in README badge and Section 20.  
`docs/starter-evaluation.md` created.  
Commit: b1f0838 · tag: phase-0-done

## Error log (one line each: date | phase | exact error | fix applied | result)

## Decisions (also copy to docs/DECISIONS.md)

## Open questions for the student
