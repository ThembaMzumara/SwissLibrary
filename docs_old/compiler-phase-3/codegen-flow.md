<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# Compiler Codegen Flows (3.1.2)

Entry: `packages/compiler/src/index.ts`
- Applies a pipeline of TypeScript transformers to `.1ui` and TS files.
- Ensures `import { createElement, Fragment } from '@swissjs/core'` when needed.
- Rewrites `.1ui` imports to JS-compatible paths.

Transformer order (as wired):
1) `component-decorators.ts` — class-level `component/template/style`
2) `plugin-service-decorators.ts` — `@plugin` (class) and `@service` (property)
3) `lifecycle-render-decorators.ts` — lifecycle, `render`, `bind`, `computed`
4) `capability-annot.ts` — `@requires` → `static requires = [...]`
5) `provides-annot.ts` — `@provides` → `static provides = [...]`
6) (if present) additional capability-def transforms

Template pipeline:
- `packages/compiler/src/template-parser.ts` implements tokenizer/parser/AST and an emitter to `createElement(...)`.
- Not yet integrated into `index.ts` (future work, see impact-analysis).
