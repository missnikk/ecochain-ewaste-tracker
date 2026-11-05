# PROGRESS.md — the agent's memory (update after EVERY step)

> Rules: tick a box only after running its check and pasting the REAL output under "Evidence". Never edit old evidence. If the chat context resets, this file is how you know where you are.

## Goal (copy of AGENTS.md section 1, one line)
EcoChain: free local e-waste lifecycle tracker — Hardhat + Solidity contract + Express/SQLite + React — 31 tests, 10 pages, 30 simulated devices.

## Current status
- Mode: (Full or Fast Track — see README Part 10.0)
- Current phase: 0
- Last completed step: (none)
- Next step: Phase 0 — evaluate the starter repository (README Part 7)
- Plan chosen (A = adapt starter, B = build from README code): (decide in Phase 0)

## Drift check (fill before each phase and after each error)
1. Final product: 
2. Phase and its DONE WHEN: 
3. Ingredient (I1–I13) being worked on: 
4. Does the planned change touch the contract of record / pinned versions / constraints? (must be NO): 

## Phase checklist
- [ ] Phase 0 — Starter evaluation (`docs/starter-evaluation.md` written; license checked; verdict recorded)
- [ ] Phase 1 — Setup (`npx hardhat --version` prints 2.22.18)
- [ ] Phase 2 — Contract + tests (`npm test`: 31 passing; `docs/test-output.txt` saved)
- [ ] Phase 3 — Local chain + deploy (contract address printed; both contractData.json files exist)
- [ ] Phase 4 — Backend (`/api/health` chainReachable true and phase "synced"; `/api/catalog` returns 7)
- [ ] Phase 5 — Frontend (whole lifecycle for one device works in the browser)
- [ ] Phase 6 — Seed + polish + edge cases (30 devices; backend-down and node-restart tests pass)
- [ ] Phase 7 — Evidence + documents (`docs/` complete; credits filled in README Part 16)
- [ ] Phase 8 — Optional MetaMask mode (only if all above done)
- [ ] Final acceptance (README Section 0.3 all ticked)

## Ingredient checklist (what must exist at the end)
- [ ] I1 Contract of record  - [ ] I2 Local chain  - [ ] I3 Deploy script writes both contractData.json
- [ ] I4 Backend + SQLite + indexer  - [ ] I5 Frontend 10 pages  - [ ] I6 Certificate hash verify
- [ ] I7 Metadata integrity check  - [ ] I8 Mass balance  - [ ] I9 Green Points
- [ ] I10 30 simulated devices  - [ ] I11 Test evidence  - [ ] I12 docs/ evidence  - [ ] I13 README credits + LICENSE

## Evidence (paste real command output here, newest at the bottom)

## Error log (one line each: date | phase | exact error | fix applied | result)

## Decisions (also copy to docs/DECISIONS.md)

## Open questions for the student
