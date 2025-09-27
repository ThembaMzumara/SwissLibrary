<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# RFC: Integrate template-parser into compiler pipeline

- Status: Proposed
- Owners: Compiler Team
- Affects: `packages/compiler/src/index.ts`, `packages/compiler/src/template-parser.ts`, `packages/plugins/vite-plugin-swiss/`
- Related docs: `docs/compiler/phase-3/*`

## 1. Summary
Wire the existing `template-parser` into the compiler pipeline to transform `.1ui` templates into `createElement(...)` calls, guarded to avoid regressions.

## 2. Motivation
- Fulfills Phase 3 objectives by completing the template/codegen story.
- Avoids ad-hoc compiler changes by setting an explicit, reviewable contract.
- Enables realistic E2E for `.1ui` without manual JSX or runtime-only paths.

## 3. Scope
- In-scope: Using `packages/compiler/src/template-parser.ts` to emit `createElement(...)` for `.1ui` files.
- Out-of-scope: New syntax, AST format changes, SSR/streaming changes, runtime decorator semantics.

## 4. Goals / Non-goals
- Goals:
  - Deterministic transform of `.1ui` to `createElement` calls.
  - Clear diagnostics compatible with existing transformer style.
  - Guarded rollout (extension/pragma/config).
- Non-goals:
  - Rewriting decorators system.
  - Overhauling Vite plugin hook behavior.

## 5. Design Overview
- Entry: `packages/compiler/src/index.ts` detects `.1ui` and routes to a new template emit step before/alongside decorator transformers.
- Parser/Emitter: reuse `packages/compiler/src/template-parser.ts` to produce JS strings or TS factory nodes calling `createElement`.
- Imports: ensure `import { createElement, Fragment } from '@swissjs/core'` is present (existing behavior already inserts if missing).
- Composition: maintain existing decorator transformer order. Template emission runs prior to lifecycle/plugin/capability transforms when operating on `.1ui` sources.

## 6. Guard / Feature Flag
- Default: enabled for files ending with `.1ui` only.
- Future: allow pragma `/* @swiss-template */` or plugin config to toggle.

## 7. Compatibility
- Decorator transformers remain unchanged.
- Output continues to be ESM with explicit `.js` extensions preserved by import-rewrite steps.
- No changes to runtime APIs in `packages/core`.

## 8. Diagnostics
- Follow lifecycle transformer style: structured messages, include filename and node spans.
- Categories: syntax errors, unmatched tags, invalid props, unknown directives.
- Add shared helper for standardized error codes (optional follow-up).

## 9. Source Maps
- Preserve mappings where possible. If emitting from string, attach best-effort mappings; if using TS factory, rely on transformer source map support.
- Document known limitations in edge cases (nested complex templates).

## 10. Performance
- Parser is linear in input size; cache parse results per file content hash during a build.
- Measure in Vite HMR scenarios; avoid recompute if content unchanged.

## 11. Testing Plan
- Unit tests (compiler):
  - Elements/attributes/children
  - Components with props and nested children
  - Self-closing vs paired tags, text nodes, escape handling
  - Error cases: unmatched/invalid syntax
  - Sourcemap sanity (basic mapping exists)
- Integration (vite-plugin-swiss): `.1ui` is transformed end-to-end.

## 12. Rollout
- Phase 1: Land guarded integration + tests.
- Phase 2: Expand diagnostics and add shared error helper.
- Phase 3: Optional config/pragma controls and documentation.

## 13. Risks & Mitigations
- Risk: regressions in build due to codegen shape.
  - Mitigation: guard on `.1ui`, tests, and revert path.
- Risk: incomplete sourcemaps.
  - Mitigation: document limits; prioritize critical mappings.
- Risk: perf under HMR.
  - Mitigation: content-hash caching.

## 14. Open Questions
- Should we convert emitter to TS factory nodes immediately for better maps, or keep string-emission first?
- Do we need directive support v1, or keep minimal attribute-only semantics initially?

## 15. References
- `packages/compiler/src/index.ts`
- `packages/compiler/src/template-parser.ts`
- `packages/compiler/src/transformers/*`
- `packages/plugins/vite-plugin-swiss/`
