<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# Technical Debt Register

This document tracks intentional short-term compromises to unblock delivery. Each entry includes context, impact, and a plan to resolve.

## 2025-09-02 — VSCode Extension Unit Tests Skipped Temporarily

- Package: `packages/devtools/vscode_extension`
- Context: Unit tests run via Mocha + ts-node and are slow (cold on-the-fly TS transpilation and type-checking across a sizable graph). This was slowing down EPIC B (Language Server Core) delivery.
- Current State:
  - CI workflow step "Unit tests" is temporarily disabled with an explicit FIXME.
    - File: `packages/devtools/vscode_extension/.github/workflows/extension-ci.yml`
    - Change: step renamed to "Unit tests (temporarily skipped)" and guarded with `if: ${{ false }}`.
  - Local script `test` now points to a faster path (`test:fast`) but can still be changed back to `test:unit` when addressing this item.
- Impact: Reduced safety net for regressions in completions/hover/definitions/diagnostics providers.
- Mitigations:
  - Keep TypeScript type-checking in `pnpm type-check`.
  - Keep linting in CI.
  - Manual smoke testing on critical flows until tests are re-enabled.
- Proposed Fix Plan:
  1. Precompile tests (build to JS) and run Mocha on JS outputs OR switch to `tsx`/`esbuild-register` for faster runtime transpilation.
  2. Use `TS_NODE_TRANSPILE_ONLY=1` in CI but keep a separate `pnpm type-check` step to retain type safety.
  3. Narrow test scope or split providers to reduce module graph size.
  4. Re-enable CI unit tests after the above optimizations.
- Owner: VSCode extension team
- Priority: High before publishing the extension

---

## 2025-09-18 — Devtools Bridge (Inspector) Minimal State/Event Plumbing

- Packages: `packages/core/src/devtools/bridge.ts`, `packages/core/src/component/component.ts`
- Context: To unblock the Runtime Inspector MVP, we introduced a minimal in-memory devtools bridge with shallow state snapshots and a simple event buffer. Component updates now send a shallow `stateSummary` and record basic `mount/update/unmount` events.
- Current Compromises:
  - `InMemoryBridge` stores state snapshots but does not apply `restoreState` to live component instances. It only persists the snapshot for display and records a `restore` event.
  - Event buffer is a simple array with a fixed cap (1000) and no backpressure or structured categories beyond `type/msg/t`.
  - `component.ts` builds `stateSummary` via a shallow spread; sensitive fields are not redacted and non-serializable values may be dropped.
- Impact:
  - Inspector cannot actually time-travel/restore yet; only displays stored snapshots.
  - Potential leakage of sensitive fields in dev-only contexts; lack of canonical serializer for consistent summaries.
  - Event model is not yet stable for external tools.
- Fix Plan:
  1. Introduce a devtools serializer with redaction rules and stable shapes (e.g., depth limit, symbol filtering, function placeholders).
  2. Add a bridge channel to request state restore via a controlled runtime API that validates shape and ensures scheduler-safe updates.
  3. Replace ad-hoc events with a typed `DevtoolsEvent` union and categorical streams (component, capability, performance, error).
  4. Move buffer to a ring buffer with backpressure and per-category caps.
- Owner: Core Runtime / Devtools
- Priority: Medium (post-MVP Inspector)

---

## 2025-09-18 — Runtime Inspector MVP Gaps

- Package: `packages/devtools/runtime_inspector`
- Context: Inspector UI is scaffolded to visualize components, shallow state, and a simple timeline.
- Current Compromises:
  - `DataService.getShallowState()` relies on bridge `getStateSnapshot()` only; there is no live state channel.
  - `drainEvents()` purely proxies bridge buffer; no pagination or cursoring.
  - No component-name index for fast filtering; filtering is linear in the current array.
- Impact: Limited functionality for time-travel; filtering can degrade with large event volumes.
- Fix Plan:
  1. Add snapshot history per-component with capped ring buffers and timestamped entries.
  2. Provide a request/response bridge method to fetch an on-demand fresh state snapshot (not just the last stored one).
  3. Introduce a small index for component names/ids to speed filter queries.
- Owner: Devtools
- Priority: Medium

---

## 2025-09-18 — Capability Explorer Performance and UX Shortcuts

- Package: `packages/devtools/capability-explorer`
- Context: Explorer gained search/filter, zoom/pan, and inline capability badges.
- Current Compromises:
  - Search filter performs recursive tree copies on each keystroke; no memoization or worker offloading.
  - Zoom/pan is CSS transform-based only (no virtualization for very large trees).
  - Auto-refresh via `setInterval(2000)`; no bridge-driven change notifications.
- Impact: Potential UI jank on large graphs; elevated CPU usage during active typing.
- Fix Plan:
  1. Add memoized filtering (e.g., cache previous query results by node id) and debounce input.
  2. Consider virtualization (windowing) for tree rendering when node count exceeds a threshold.
  3. Replace polling with bridge events to refresh on deltas.
- Owner: Devtools
- Priority: Low/Medium (optimize after functional completion)
