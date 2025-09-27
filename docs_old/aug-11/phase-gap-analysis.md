<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# Phase Gap Analysis (Aug 11)

Sources:
- `docs/plan/plan.md` (canonical plan)
- Compiler code and tests under `packages/compiler/`
- Core runtime under `packages/core/`

## Summary
- Phase 3 (Compiler Integration) is effectively complete for current scope: decorators audited, barrel enforcement, diagnostics standardized, imported-constant resolution (flagged), template pipeline integrated and tested.
- Remaining robustness work targets Context and Fenestration (spans Phase 2 and sets Stage for Phase 4/6).

## Status by Phase

- Phase 1 — Registry/Resolution Hardening
  - Pending: multi-registry strategy, global resolve() unification, extended security hooks.
  - Risk: subtle runtime drift without a single authoritative resolver.

- Phase 2 — Component API + Fenestration
  - In progress: Context robustness (defaults, dev warnings, subscriptions prototype).
  - Pending: `fenestrate()` ergonomics, policy composition helpers, unmount cleanup guarantees.

- Phase 3 — Compiler Integration
  - Done: decorator/codegen docs, diagnostics helper, `SWISS_RESOLVE_IMPORTED` flow, `.1ui` guarded pipeline.
  - Next: minor polish and docs-runner CI stability checks.

- Phase 4 — Plugin System
  - Pending: lifecycle/hook contracts formalization, richer typing without circular deps, capability audits.

- Phase 5 — Dev Tools
  - Pending: barrel compliance checker, docs-runner CI, bundle analysis, capability graph view.

- Phase 6 — Advanced
  - Pending: devtools for fenestration traces, SSR/streaming refinements, optional static metadata emission.

## Immediate Next Steps
- Finish Context subscriptions behind `SWISS_CONTEXT_SUBSCRIBE=1` and document API.
- Document fenestration overview and policy hooks.
- Lock Phase 3: rerun builds/tests, integrate docs links, and generate snapshot of compiler pipeline invariants.

## Risks & Mitigations
- Subscription memory leaks → use WeakMap, ensure unmount unsubscribes (follow-up task).
- Overhead creep → keep features flaggable and default-off; provide selectors/equality to minimize churn.
- Type instability → centralize shared types in barrels and avoid deep imports.
