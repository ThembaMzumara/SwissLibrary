<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# Windsurf Monorepo Migration & Compiler Integration Plan

This plan tracks the SwissJS (.1ui) monorepo migration and integration work. It is organized into six phases and used to coordinate codegen, runtime, plugins, and developer tooling.

Notes
- Focus: auditing decorators, codegen flows, barrel pattern enforcement, context API analysis, and unifying type dependencies.
- Decorators (e.g., `@component`, `@onMount`, `@plugin`, `@service`, `@requires`, `@provides`) are compiled by AST transformers; runtime uses Reflect metadata and helper appliers.
- Update-not-replace: changes must be additive and backward compatible; perform impact analysis before edits.

---

## Phase 1: Core Capability Registry Enhancement

- Task 1.1: Audit all CapabilityManager usages
  - 1.1.1: Document usages in `packages/core/src/security/index.ts`
  - 1.1.2: Document usages in `packages/core/src/component/decorators.ts`
  - 1.1.3: Document usages in `packages/core/src/component/component.ts`
  - 1.1.4: Document usages in `packages/core/src/component/event-system.ts`
  - 1.1.5: Impact analysis for all usage points

- Task 1.2: Extend CapabilityManager with runtime registry (additive)
  - 1.2.1: Private registry map for capability→service
  - 1.2.2: `registerService()`
  - 1.2.3: `unregisterService()`
  - 1.2.4: Persistence (serialize/deserialize)
  - 1.2.5: Backward compatibility

- Task 1.3: Implement capability resolution (`resolve()`)
  - 1.3.1: `resolve()` returns executable functions
  - 1.3.2: Parameter validation
  - 1.3.3: Errors for unresolved capabilities
  - 1.3.4: Caching
  - 1.3.5: Async support

- Task 1.4: Validation & security for capability requests
  - 1.4.1: Scope validation (global/component/plugin)
  - 1.4.2: Permission checking with context
  - 1.4.3: Audit logging
  - 1.4.4: Rate limiting
  - 1.4.5: Fallback mechanisms

- Task 1.5: Integrate with plugin/service system (additive)
  - 1.5.1: Registry ↔ PluginManager services
  - 1.5.2: Auto capability registration from plugins
  - 1.5.3: Capability discovery
  - 1.5.4: Cross-plugin resolution
  - 1.5.5: Backward-compatible service resolution

- Task 1.6: Maintain `has()/hasAll()` compatibility
  - 1.6.1: Verify `has()`
  - 1.6.2: Verify `hasAll()`
  - 1.6.3: Back-compat tests
  - 1.6.4: Document behavioral changes (if any)
  - 1.6.5: Update docs while preserving old API
  - 1.6.6: Resolve plugin-file-router circular dependency (tests)

---

## Phase 2: Component API Enhancement

- Task 2.1: Audit SwissComponent & capability access
  - 2.1.1: Document SwissComponent usages
  - 2.1.2: Document capability access patterns
  - 2.1.3: Document lifecycle implementations
  - 2.1.4: Document error handling
  - 2.1.5: Impact analysis for component changes

- Task 2.2: Add `fenestrate()` (additive)
  - 2.2.1: Implement `fenestrate(capability: string, ...)`
  - 2.2.2: Support parameters
  - 2.2.3: Return value handling
  - 2.2.4: Overloads for patterns
  - 2.2.5: Optional, non-breaking

- Task 2.3: Integrate with CapabilityManager
  - 2.3.1: Wire `fenestrate()` to resolution
  - 2.3.2: Validation before resolution
  - 2.3.3: Caching within component context
  - 2.3.4: Error handling for failures
  - 2.3.5: Performance monitoring

- Task 2.4: Secure, scoped resolution & errors
  - 2.4.1: Component-level scoping
  - 2.4.2: Security context validation
  - 2.4.3: Detailed error messages
  - 2.4.4: Fallbacks
  - 2.4.5: Retry logic

- Task 2.5: Back-compat
  - 2.5.1: Verify components work without `fenestrate()`
  - 2.5.2: Tests for with/without fenestration
  - 2.5.3: Migration docs
  - 2.5.4: Usage examples
  - 2.5.5: Update component docs with fenestration API

---

## Phase 3: Compiler Integration

- Task 3.1: Audit decorators & codegen
  - 3.1.1: Document decorator usages in components
  - 3.1.2: Document compiler codegen flows
  - 3.1.3: Document metadata handling
  - 3.1.4: Document transformation patterns
  - 3.1.5: Impact analysis for compiler modifications
  
  Documentation links:
  - `docs/compiler/phase-3/decorator-usage.md`
  - `docs/compiler/phase-3/codegen-flow.md`
  - `docs/compiler/phase-3/metadata-handling.md`
  - `docs/compiler/phase-3/transformation-patterns.md`
  - `docs/compiler/phase-3/impact-analysis.md`

- Task 3.2: Enforce barrel pattern (per monorepo docs)
  - 3.2.1: Remove default exports (use named)
  - 3.2.2: Fix deep imports bypassing barrels
  - 3.2.3: Ensure barrel re-exports use explicit `.js`
  - 3.2.4: Report each package’s public API via barrel

- Docs & tests
  - Set up docs-runner for clean API docs
  - Generate per-package API docs (skipErrorChecking)
  - Add/validate tests for `@plugin`/`@service` transformer

---

## Phase 4: Plugin System Enhancement

- Goals
  - Solidify `PluginManager` integration with capabilities (beyond Phase 1 sync)
  - Eliminate circular deps via stable plugin types in `packages/core/src/plugins/plugin-types.ts` and proper barrel usage
  - Ensure service discovery, registration, and audits are consistent and documented
  - Strengthen tests across real plugins (e.g., file-router) for runtime + compiler interactions

- Tasks
  - Define plugin lifecycle & hooks contract in `pluginInterface.ts` with stable types
  - Add capability audit hooks and logging surface for plugins
  - Expand plugin tests (init/load/service exposure/capability announcements)

---

## Phase 5: Developer Tools

- Goals
  - Docs and CI tooling maturity
  - API docs determinism (isolated runner)
  - Barrel compliance and public API reporting in CI

- Tasks
  - Docs runner and scripts
  - CI barrel compliance and per-package API report
  - Bundle analysis integration for packages
  - Developer docs for ESM `.js` import standard and repo conventions

---

## Phase 6: Advanced Features

- Goals
  - Fenestration devtools (Explorer), runtime visualization, capability flow logging
  - Template/SSR/streaming improvements
  - Optional static metadata bags (e.g., `Foo.__swiss`) once runtime is ready

- Tasks
  - Devtools: capability graph, cross-layer tracing
  - Template pipeline: wire `template-parser.ts` into `compiler/src/index.ts` with tests
  - Extend capability resolution to handle imported constants and richer diagnostics
