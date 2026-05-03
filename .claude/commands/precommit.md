---
description: Run typecheck, lint, and dead-code checks
allowed-tools: Bash(npm run *)
---

Run all three checks via Bash and report results concisely:

1. `npm run typecheck`
2. `npm run lint`
3. `npm run check:dead`

If all pass, say "all checks clean". Otherwise list each failing check with the specific errors. Don't fix anything yet — just report so the user can decide what to address.
