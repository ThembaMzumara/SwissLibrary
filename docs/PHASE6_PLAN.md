<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# SWISS Phase 6 – Authoritative Implementation Plan

Last updated: 2025-09-03 13:25:01 (+02:00)

This document is the authoritative, non-lossy source of truth for the remainder of Phase 6. All work must trace to these tasks exactly as written.

If an item requires change, open a PR that updates this file and references the affected tasks.

---

## Objectives

- Deliver advanced devtools features for SwissJS, centered on capability visibility, runtime introspection, template debugging, production diagnostics/telemetry, a Plugin Development Kit, and an accessible template component library.
- Maintain production-grade quality: type safety, tests, performance, CI packaging/publishing, and docs.

---

## Global Constraints & Principles

- Keep security and capability boundaries explicit and enforced.
- Ensure excellent developer UX and performance.
- Prefer TypeScript, ESM, and composable architecture.
- Tests should be fast by default; opt-in for heavy integration.

---

## Task Breakdown (Exact)

- [ ] Core Capability Explorer
  - [ ] Render component hierarchy with capability bindings
  - [ ] Visualize capability providers/consumers
  - [ ] Highlight capability conflicts
  - [ ] Implement zoom/pan controls
  - [ ] Add search/filter functionality

- [ ] Runtime Inspector
  - [ ] Real-time component state
  - [ ] Capability usage tracking
  - [ ] Performance metrics overlay
  - [ ] Event timeline with filtering
  - [ ] State snapshot/restore
  - [ ] Time-travel debugging

- [ ] Template Debugging Suite
  - [ ] Syntax highlighting for .swiss
  - [ ] Real-time preview
  - [ ] Component tree visualization
  - [ ] Hydration mismatch detection
  - [ ] Server/client state diff
  - [ ] Streaming SSR metrics
  - [ ] Memory leak detection

- [ ] Production Error Handling & Telemetry
  - [ ] Capability-aware error boundaries
  - [ ] Helpful remediation messages with docs links
  - [ ] Graceful degradation paths
  - [ ] Performance metrics capture (opt-in)
  - [ ] Error analytics (PII-safe)
  - [ ] Custom event tracking

- [ ] Plugin Development Kit (PDK)
  - [ ] CLI: create-swiss-plugin
  - [ ] Template repo
  - [ ] Dev server integration
  - [ ] Test harness with mock capabilities
  - [ ] E2E testing example

- [ ] Template Component Library
  - [ ] Form controls, navigation, layout, feedback
  - [ ] WCAG 2.1 AA compliance
  - [ ] Keyboard navigation
  - [ ] Screen reader testing
  - [ ] Storybook docs + examples

- [x] VSCode Extension: LSP for .ui files
  - [x] Register .ui as TSX/TypeScript React for LSP
  - [x] Ensure markup in .ui files is parsed and errors surfaced like .tsx
  - [x] Test LSP features (hover, completion, diagnostics, etc.)
  - [x] Full system design for robust VSCode extension
  - [x] Repository analysis to align with SWISS library design
  - [x] Redesign packaging: bundle with esbuild/webpack, depend on published packages, strict files whitelist, automate in CI
  - [x] Phase B: Navigation, code actions, capability indexer
  - [x] Phase 1: Basic Setup
    - [x] Create extension scaffold (file structure, barrel pattern)
    - [x] Define language ID and activation in package.json
    - [x] Implement basic TextMate grammar for SwissJS markup in `.ui` files
    - [x] Remove legacy files (src/client.ts, src/extension.ts, server/src/server.ts)
    - [x] Create new barrel-pattern structure (client/server/shared dirs, minimal stubs)
      - [x] Create shared types, utils, and index barrels
      - [x] Create server astTypes and parser stub
      - [x] Scaffold server parser barrel, diagnostics, completions providers
      - [x] Scaffold server symbols provider and language barrel
      - [x] Scaffold remaining client/provider/command stubs
      - [x] Create SwissJS language configuration (language-configuration.json)
      - [x] Create/extend SwissJS TextMate grammar (swissjs.tmLanguage.json)
      - [x] Create SwissJS snippets file (snippets/swissjs.json)
  - [x] Phase 2: Language Server
    - [x] Build SwissJS parser (hybrid TypeScript/markup)
    - [x] Provide basic diagnostics and completion
    - [x] Implement hover information
    - [x] Implement go-to-definition
    - [x] Improve error reporting and validation for SwissJS rules
    - [x] Implement parser, nodeAtPosition, and wire to diagnostics
    - [x] Return hierarchical DocumentSymbol[] in symbols provider
    - [x] Wire formatting and code actions providers; fix server handler types
  - [x] Phase 3: Advanced Features
    - [x] Add formatting and deeper TypeScript integration
    - [x] Implement code actions and capability indexer
  - [x] Phase 4: Testing and Polish
    - [x] Unit/integration tests for grammar, parser, LSP
    - [x] Fix test runner integration for VSCode extension
    - [x] Add test helpers and unit tests for hover, definition, and diagnostics providers
    - [x] Finalize test/codegen setup and resolve lints
    - [x] Update parser and AST types for offset/parent support
    - [x] Test extension with real-world SwissJS projects
    - [x] Performance and UX polish
  - [x] Phase 5: Publishing
    - [x] Finalize packaging

---

## Notes

- GitHub automation for Phase 6 EPIC and sub-issues was attempted; connectivity issues blocked it. Proceeded manually per this plan.
- VSCode extension packaging and CI are complete; VSIX ready for publishing.
- EPIC B is complete; EPIC C (Language Client) is the next target as needed.

---

## How To Use This Plan

- Treat each checkbox as a trackable deliverable.
- Open an issue per task/subtask when starting work; link to this file.
- Keep this file updated in PRs to reflect reality (only after consensus).
