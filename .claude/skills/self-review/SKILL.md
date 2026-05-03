---
name: self-review
description: Self-review checklist. Use after generating or editing code, before reporting work as done.
---

# Self-review before reporting work as done

After generating or editing code, run through this checklist. Hook covers hard rules; this list covers judgment calls the hook can't make.

When in doubt about whether to add something, **lean toward deleting**. Adding code is cheap, removing it later costs more.

## 1. Over-engineering (delete unless justified)

- **Dead code**: any new port, adapter, use case, env var, route, or interface with **zero callers**? Either wire it in or delete it. Don't leave "for future use" stubs.
- **Premature port**: did I add a `domain/ports/<x>.port.ts` for a single concrete implementation with no test seam or swap motivation? Inline the impl in `infrastructure/`.
- **1-property wrapper interface**: any `interface AppX { only: SomeType }` with one consumer? Pass the value directly.
- **Trivial use case**: is the new use case purely `repo.findX() + throw NotFound` with no business logic? OK to keep for consistency, but flag in the report — don't pretend it adds value.
- **Env config flag**: any new env var that toggles behavior nobody currently needs to toggle? Inline the constant. Bias against "configurable for the future".
- **Fallback/default**: did I write `value ?? fallback`, `if (env.X === 'production') ... else ...`, or `.default(...)` in `env.ts`? Replace with explicit required env vars or remove.
- **Backwards-compat shims**: renamed `_var` placeholders, re-exports for moved files, "// removed" comments. If unused, delete fully.

## 2. Codebase conventions

- All relative imports end in `.js` (NodeNext).
- Array/index accesses are guarded (`noUncheckedIndexedAccess` is on).
- Zod schema fields mirror the entity; serializer maps `Date → ISO string`.
- Throw `AppError` subclasses, not plain `Error`, for any error that should surface to the client.
- DB schema change → mention `db:generate` + `db:migrate` in the report (don't run silently).
- Pagination/sort use the shared helpers — don't redefine `{ items, total, limit, offset }` shape.
- New use case → registered in `services.plugin.ts` AND wired to a route. Otherwise it's dead.

## 3. Reporting

State concretely what changed, what was deleted, and what trade-offs the user owns (e.g. "shorter access TTL means more refresh calls", "in-memory denylist won't work multi-pod"). Don't oversell. **Flag any code you added that you suspect violates architecture or is over-engineered** — let the user decide whether to keep.
