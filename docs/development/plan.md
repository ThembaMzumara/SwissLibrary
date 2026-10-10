<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# SwissJS Development Plan (Phases 4–6)

This document defines the remaining sprint plan and standards. Follow precisely.

Last updated: 2025-08-21

---

## Phase 4: Plugin System Enhancement

### Goals

- Solidify `PluginManager` integration with capabilities (beyond Phase 1 sync).
- Eliminate circular deps via stable plugin types in `packages/core/src/plugins/plugin-types.ts` and proper barrel usage.
- Ensure service discovery, registration, and audits are consistent and documented.
- Strengthen tests across real plugins (e.g., file-router) for runtime + compiler interactions.

### Tasks

- **[types] Stable plugin contract**
  - Update `packages/core/src/plugins/plugin-types.ts` with:
    - `PluginName`, `PluginId`, `PluginKind`.
    - `PluginLifecycle` (init → load → activate → deactivate → dispose).
    - Hook registry types (e.g., `onRegisterServices`, `onCapabilityAudit`, `onCompile`, `onDevServer`, `onRoutesDiscovered`, `onRuntimeReady`).
    - Capability surface: `announcedCapabilities`, `requiredCapabilities`, `grantedBy`.
  - Refactor `packages/core/src/plugins/pluginInterface.ts` to a single canonical interface using the above.
    - Avoid `any`; break cycles via type-only imports and/or adapters.
  - Barrel hygiene: ensure `packages/core/src/plugins/index.ts` only re-exports public types; validate with `scripts/check-barrels.mjs`.

- **[manager] PluginManager integration**
  - Registration flow must call lifecycle hooks in order and handle failures with rollback:
    - `init` → `load` → `activate` (and `deactivate`/`dispose` on failure).
  - Capability audit pass:
    - Collect plugin capability declarations.
    - Validate compatibility and produce a structured audit object.
    - Expose via `PluginManager.getAudit()` and emit `onCapabilityAudit(audit)`.
  - Service discovery:
    - Standardize `registerService(id, impl)` and `getService(id)` with strong types.
    - Detect duplicates/overrides and warn consistently.

- **[logging] Plugin logging surface**
  - Provide `PluginLogger` via context with scoped tags (e.g., `[plugin:<name>]`).
  - Include capability/audit results and lifecycle timings.

- **[tests] Expanded coverage**
  - Core plugin tests: lifecycle, service registration, capability declarations, audit failures.
  - Real plugin (file-router) integration tests:
    - Init/load path, service exposure/consumption.
    - Capability announcement and audit pass.
  - Compiler hook tests: a test plugin exercising an `onCompile` pass.

### Deliverables

- Updated `plugin-types.ts`, `pluginInterface.ts`, `PluginManager` integration, service registry.
- New/expanded tests under `packages/core` and `packages/plugins/file-router`.
- Docs: `docs/development/plugins.md` with lifecycle, hooks, capabilities, and examples.

### Acceptance Criteria

- No circular deps in `core/plugins/*`.
- All plugin tests pass in CI.
- Capability audit exposes structured results and appears in logs.
- File-router plugin loads via `PluginManager` in tests and exposes its services.

### PR Breakdown (Sprint)

- PR1: Stable plugin types + lifecycle contract + barrel fixes.
- PR2: PluginManager capability audit + service registry + logging.
- PR3: Test expansion (core + file-router + compile hook).

---

## Phase 5: Developer Tools

### Goals

- Docs and CI tooling maturity.
- API docs determinism (isolated runner).
- Barrel compliance and public API reporting in CI.
- Bundle analysis integration.
- Developer docs for ESM `.js` import standard and repo conventions.

### Tasks

- **Docs runner determinism**
  - Isolate TypeDoc run; lock TS + TypeDoc versions (already partially enforced in `tools/docs-runner/generate.mjs`).
  - Pin Node via `.nvmrc` or Volta.
  - Normalize timestamps/ordering for deterministic outputs.

- **CI barrel compliance + public API report**
  - Enhance `scripts/check-barrels.mjs` to fail on violations.
  - Public API report:
    - Option A: Microsoft API Extractor per package (`etc/*.api.md` + `*.api.json`).
    - Option B: TypeDoc JSON → filtered, stable surface diff.
  - Add a GitHub Action to run barrel + API report checks per package.

- **Bundle analysis**
  - Integrate `rollup-plugin-visualizer` or `size-limit` per package.
  - Emit `dist/stats.html` artifacts in CI; track budget regressions.

- **Developer docs**
  - `docs/development/conventions.md`: ESM `.js` imports, barrel rules, public API surfaces, commit/changesets flow, release policy.

### Acceptance Criteria

- CI fails on barrel issues or public API drift.
- Docs build deterministic across runners.
- Bundle size reports generated per package with baselines.

### Current Status

- PR4 is implemented:
  - Deterministic docs via `tools/docs-runner/generate.mjs` (also emits JSON reflections per package)
  - Node pinned via `.nvmrc` and `engines.node` in root `package.json`
  - Barrel compliance via `scripts/check-barrels.mjs`
  - Public API baselines and drift check via `scripts/api-report-build.mjs` and `scripts/api-report-check.mjs`
  - Root scripts:
    - `pnpm docs:api`
    - `pnpm -w check:barrels`
    - `pnpm api:build`
    - `pnpm api:check`
  - CI workflow: `.github/workflows/ci-devtools.yml` runs docs, barrels, API build/check and uploads artifacts

### PR Breakdown (Sprint)

- PR4: Deterministic docs runner + CI workflows (barrels/API report). [COMPLETED]
- PR5: Bundle analysis integration + developer conventions docs.

---

## Phase 6: Advanced Features

### Goals

- Fenestration devtools (Explorer), runtime visualization, capability flow logging.
- Template/SSR/streaming improvements.
- Optional static metadata bags (e.g., `Foo.__swiss`) once runtime is ready.

### Tasks

- **Devtools**
  - Enhance `packages/devtools/fenestration_explorer` to visualize:
    - Component tree, capability graph, plugin services, cross-layer traces.
  - Wire logging sinks from `PluginManager` capability audits and runtime events.

- **Template pipeline**
  - Wire `packages/compiler/src/template-parser.ts` into `packages/compiler/src/index.ts`.
  - Tests: SSR + streaming validations, directive processing.

- **Capability resolution**
  - Handle imported constants; add richer diagnostics (locations, suggestions).

### Acceptance Criteria

- Explorer shows live capability graph and plugin service map.
- Compiler tests pass for template parsing → SSR output (including streaming).
- Diagnostics include imported constants scenarios.

### PR Breakdown (Sprint)

- PR6: Explorer capability graph + runtime hook wiring.
- PR7: Template pipeline wiring + SSR/streaming tests.
- PR8: Capability resolution improvements + diagnostics.

---

## CI and Versioning Gates

- Changesets independent versions per package; internal prereleases when needed.
- CI gates: lint, type-check, tests, docs, barrels/API report, bundle budgets.
- Release: internal prerelease tags for sprint drops.

---

## Execution Notes

- Keep PRs small and scoped to the breakdown above.
- Each PR must update tests and docs where applicable.
- All changes must pass pre-commit hooks and CI gates.

---

## Detailed Subtasks (Per Phase)

### Phase 4 — Plugin System Enhancement (Detailed)

- **Types & Contract**
  - `packages/core/src/plugins/plugin-types.ts`
    - Define: `PluginName`, `PluginId`, `PluginKind`.
    - Define lifecycle: `PluginLifecycle` = `init | load | activate | deactivate | dispose`.
    - Define hook types: `onRegisterServices`, `onCapabilityAudit`, `onCompile`, `onDevServer`, `onRoutesDiscovered`, `onRuntimeReady`.
    - Define capability surface: `announcedCapabilities`, `requiredCapabilities`, `grantedBy`.
    - Define `AuditResult` (summary, per-plugin entries, warnings/errors) for capability audit.
  - `packages/core/src/plugins/pluginInterface.ts`
    - Consume the above types via `import type`.
    - Provide adapter for legacy plugins (default hooks, optional fields).
    - Avoid `any`; if a cycle appears, add a thin adapter module.
  - `packages/core/src/plugins/index.ts`
    - Export only public types and interfaces; retain current exports.
    - Validate with `scripts/check-barrels.mjs` (run `pnpm -w check:barrels`).

- **PluginManager Integration (feature-flagged)**
  - `packages/core/src/plugins/PluginManager.ts`
    - Lifecycle orchestration: `init → load → activate` with rollback using `deactivate`/`dispose` on failure.
    - Feature flag the new path behind `SWISS_EXPERIMENTAL_PLUGIN_LIFECYCLE`.
    - Capability audit: aggregate declarations, validate compat, produce `AuditResult`.
    - Expose `getAudit()` and emit `onCapabilityAudit(audit)` when flag is ON.
    - Service registry: `registerService(id, impl)` / `getService(id)`; generics + duplicate detection warnings.

- **Logging Surface**
  - Provide `PluginLogger` via context: include `[plugin:<name>]` tags, lifecycle timings, audit summary.
  - Implement a no-op default to avoid breaking existing plugins.
  - Allow injection for tests.

- **Tests**
  - Core tests at `packages/core/__tests__/plugins/*`:
    - Lifecycle order + rollback (flag ON).
    - Service registry contract + duplicate detection.
    - Capability audit structure and emissions.
  - File-router integration at `packages/plugins/file-router/__tests__/*`:
    - Init/load/activate with `PluginManager` (flag ON).
    - Ensure behavior unchanged with flag OFF.
  - Compiler hook smoke test: minimal plugin implementing `onCompile` (flag ON).

- **Docs**
  - `docs/development/plugins.md`: lifecycle, hooks, capabilities, service registry, examples.

---

### Phase 5 — Developer Tools (Detailed)

- **Docs Runner Determinism**
  - `tools/docs-runner/generate.mjs`:
    - Ensure pinned TypeDoc/TS versions (already partially pinned).
    - Normalize output ordering, timestamps, and line endings.
    - Provide idempotent "clean + generate" mode.
  - Add Node pin: `.nvmrc` or Volta config at repo root.

- **CI Barrel Compliance + Public API Report**
  - `scripts/check-barrels.mjs`:
    - Add fail-on-violation mode and per-package reporting.
  - Public API report (choose approach):
    - A) API Extractor per package (`etc/*.api.md`, `*.api.json`).
    - B) TypeDoc JSON → filter public surface → stable diff.
  - GitHub Actions workflow:
    - Run: lint, type-check, tests, docs/api build, barrel checks, API report.
    - Upload API reports and docs artifacts for inspection.

- **Bundle Analysis**
  - Integrate `rollup-plugin-visualizer` or `size-limit` per package.
  - Emit `dist/stats.html` and configure budgets; gate in CI.

- **Developer Docs**
  - `docs/development/conventions.md`:
    - ESM `.js` import standard, barrel rules, public API surfaces.
    - Commit/changesets flow and release policy.
    - Dev/CI scripts overview and troubleshooting.

---

### Phase 6 — Advanced Features (Detailed)

- **Devtools Explorer**
  - `packages/devtools/fenestration_explorer`:
    - Visualize component tree, capability graph, plugin services.
    - Show cross-layer traces and runtime/PluginManager audit logs.
    - Add RPC/channel if needed for runtime → devtools comms.

- **Template Pipeline**
  - Wire `packages/compiler/src/template-parser.ts` into `packages/compiler/src/index.ts`.
  - Expand tests for SSR + streaming; directive processing snapshots.

- **Capability Resolution**
  - Support imported constants in capability annotations.
  - Diagnostics include locations and suggestions; cross-reference plugin capabilities.

- **SSR/Streaming Improvements**
  - Extend server rendering + streaming hooks/contracts.
  - Cover edge cases with tests (long tasks, suspense-like patterns).

---

## Integration Safeguards and Invariants

- Do not change public APIs of `packages/compiler/src/index.ts` or `packages/core/src/index.ts` during Phases 4–5.
- Keep `core/plugins/*` free of circular deps via `import type` and adapters.
- New runtime behavior behind `SWISS_EXPERIMENTAL_PLUGIN_LIFECYCLE` feature flag; default OFF.
- Preserve docs output structure under `docs/api/*` (no path changes).
- Maintain strict CI gates: lint, type-check, tests, docs, barrels/API report, markdownlint, bundle budgets.
- Use Changesets with clear notes; mark flagged features as experimental.

---

## Rollout Controls and PR Sequencing

- PR1 (Phase 4): Types + lifecycle contract + barrels (no runtime change).
- PR2 (Phase 4): PluginManager lifecycle + capability audit + service registry + logging (feature-flagged).
- PR3 (Phase 4): Tests (core + file-router + compile hook) and docs.
- PR4 (Phase 5): Deterministic docs runner + CI workflows (barrels/API report).
- PR5 (Phase 5): Bundle analysis + developer conventions docs.
- PR6 (Phase 6): Explorer capability graph + runtime hook wiring.
- PR7 (Phase 6): Template pipeline wiring + SSR/streaming tests.
- PR8 (Phase 6): Capability resolution improvements + diagnostics.
