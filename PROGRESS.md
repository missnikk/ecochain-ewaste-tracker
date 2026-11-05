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
