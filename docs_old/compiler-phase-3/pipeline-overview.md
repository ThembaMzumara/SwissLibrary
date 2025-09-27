<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# Compiler Pipeline Overview (Phase 3)

This document summarizes the current SwissJS compiler codegen pipeline, its transformers, template integration, emitted artifacts, diagnostics, optimizer, integration points, and test coverage.

Last updated: 2025-08-11

## 1) Pipeline Order

The pipeline is orchestrated in `packages/compiler/src/index.ts` (`UiCompiler`). For `.1ui` files a guarded template flow precedes AST transforms. For TypeScript/TSX sources the AST transforms run directly.

Order:

1. Template Guard (only for `.1ui`)
   - Parse: `parseTemplate()` from `packages/compiler/src/template-parser.ts`
   - Emit: `emitTemplateASTToJS()` from the same module
   - Hand off emitted JS to TypeScript printer
2. AST Transformers (TypeScript)
   - `componentTemplateStyleTransformer()`
   - `pluginServiceTransformer()`
   - `lifecycleRenderTransformer()`
   - `capabilityTransformer()`
   - `providesTransformer()`
   - `capabilityDefTransformer()`
3. Print/Rewrite
   - Print with `ts.createPrinter()`
   - Rewrite imports that end with `.1ui` → drop extension
   - Validate no `from '1ui'` pseudo-import remains
   - Ensure core JSX runtime import when needed: `import { createElement, Fragment } from '@swissjs/core'`

Refs:

- `packages/compiler/src/index.ts`
- `packages/compiler/src/transformers/*.ts`
- `packages/compiler/src/template-parser.ts`

## 2) Transformers

- `component-decorators.ts`
  - Strips runtime decorators (`@component`, style/template decorators) and emits equivalent metadata/registration after class declaration.
- `plugin-service-decorators.ts`
  - Transforms `@plugin`, `@service` metadata; registers and attaches capabilities to plugins/services.
- `lifecycle-render-decorators.ts`
  - Handles `@onMount`, `@onUpdate`, and potential render lifecycle decorations; attaches lifecycle tables and emits hooks.
- `capability-annot.ts`
  - Processes `@requires` annotations on components/services to ensure capability checks/metadata are attached.
- `provides-annot.ts`
  - Processes `@provides` annotations to expose provided capabilities/registrations.
- `capability-def-annot.ts`
  - Validates and emits capability definition metadata (IDs, shapes) for discovery and diagnostics.

Utilities/Diagnostics:

- `transformers/utils.ts` — common AST helpers
- `transformers/diagnostics.ts` — standardized compiler error helper `compilerError(code, message, file, node)`

## 3) Template Flow (.1ui)

- Tokenizer/Parser produce a strongly-typed AST: `TemplateASTNode` union (Elements, Text, Expressions, Slots, Conditionals, Loops, Components).
- Directives and modifiers are captured (`@click`, `@bind`, `.prevent`, etc.).
- Emission converts the template AST to JS/TSX-compatible code consumed by the TypeScript pipeline.

Refs:

- `packages/compiler/src/template-parser.ts`

## 4) Emitted Artifacts

- TypeScript source with decorators removed and replaced by explicit registration/metadata calls.
- Core JSX runtime import added where necessary: `createElement`, `Fragment` from `@swissjs/core`.
- `.1ui` import suffixes rewritten to bare specifiers (e.g., `./Card.1ui` → `./Card`).

## 5) Diagnostics

- Standardized via `compilerError(code, message, file?, node?)` in `transformers/diagnostics.ts`.
- Propagated with file/line context when available: `[SwissJS Compiler CODE] [file:line:col] message`.
- Example validations:
  - Invalid import `from '1ui'` → error with guidance to import runtime from `@swissjs/core`.
  - Non-relative `.1ui` imports are rejected.

## 6) Optimizer

- `packages/compiler/src/optimizer.ts` (prototype):
  - Example optimization toggles attributes when they target known core directives (`isCoreDirective`).
  - Runs on template ASTs and is a candidate for future passes (dead code, hoisting, etc.).

## 7) Integration

- Consumed by CLI/Vite during dev/build.
- TypeScript settings expected:
  - `experimentalDecorators: true`, `emitDecoratorMetadata: true`
  - `moduleResolution: node16` (in `tsconfig.base.json`)
  - `verbatimModuleSyntax: true`
- Barrel exports across packages ensure stable type resolution post-transform.

## 8) Testing Matrix

Existing tests (`packages/compiler/__tests__`):

- `lifecycle-render-transformer.test.ts`
- `plugin-service-transformer.test.ts`
- `tsx-transform.test.tsx`
- `template-integration.test.ts`
- `capability-import-resolution.test.ts`
- `compiler.test.ts` (smoke + parser sanity)

New tests (Phase 3):

- `invalid-oneui-import.test.ts` — validates diagnostics for `from '1ui'` and `.1ui` import rewrite
- `oneui-import-rewrite.test.ts` — ensures `from './Card.1ui'` becomes `from './Card'`

Coverage Gaps/Future:

- End-to-end decorator combos across complex inheritance
- Performance tests for very large templates
- More exhaustive capability definition/validation cases
