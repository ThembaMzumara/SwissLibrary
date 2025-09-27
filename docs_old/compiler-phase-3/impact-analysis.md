<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# Impact Analysis (3.1.5)

Findings:
- Template compiler exists (`template-parser.ts`) but is not wired into `index.ts`.
- Capability identifier resolution supports string literals and local identifiers; imported constants are not resolved.
- Diagnostics are strongest in lifecycle transformer; standardization across transformers is desirable.

Risks:
- Integrating template emission changes output shape and may affect source maps.
- Extending identifier resolution requires TypeScript type-checker usage and can add complexity/perf cost.

Mitigations & plan:
1) Template integration (guarded)
   - Add optional pass in `index.ts` for `.1ui` files only; feature-flag via pragma or extension.
   - Add tests for elements/components, props/children, error paths.
2) Identifier resolution enhancement
   - Use TypeScript program/checker to resolve imported const string values; fall back with diagnostics.
   - Timebox and protect behind config flag initially.
3) Diagnostics consistency
   - Extract shared error helper to standardize codes/messages; update all transformers.

Rollout:
- Start with documentation (this series), then implement small PRs for diagnostics helper.
- Template integration as a separate RFC/PR with tests.
- Identifier resolution enhancement scheduled after template integration.
