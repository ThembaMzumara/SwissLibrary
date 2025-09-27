<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# Decorator Usages in Components (3.1.1)

This document inventories decorators handled by the compiler and how they are used in the codebase. Runtime definitions live in `packages/core/src/component/decorators.ts`.

- Component/class-level
  - `@component(opts?)`, `@template(tpl)`, `@style(css)`
    - Transformer: `packages/compiler/src/transformers/component-decorators.ts`
    - Emission: `component(opts)(Class)`, `template(tpl)(Class)`, `style(css)(Class)` (appended after class).
- Lifecycle and rendering
  - `@onMount`, `@onUpdate`, `@onDestroy`, `@onError`, `@render`
    - Transformer: `packages/compiler/src/transformers/lifecycle-render-decorators.ts`
    - Placement: methods only (validation enforced). Emits registration using `Class.prototype` + descriptor.
  - Bindings/computed
    - `@bind`, `@computed`
    - Transformer: same as above; properties/getters validated and registered.
- Plugin/service
  - `@plugin(nameOrOpts)`: class decorator (registers plugin)
  - `@service(nameOrOpts)`: property decorator (injects service)
    - Transformer: `packages/compiler/src/transformers/plugin-service-decorators.ts`
    - Emission: decorator call(s) appended after class.
- Capabilities
  - `@requires(...caps)`, `@provides(...caps)`
    - Transformers: `packages/compiler/src/transformers/capability-annot.ts`, `packages/compiler/src/transformers/provides-annot.ts`
    - Emission: `static requires/provides = [ ... ]` on class (string literals or resolved local identifiers).

Runtime consumption:
- `packages/core/src/component/decorators.ts` — applies Reflect metadata and wires lifecycle/render/services at runtime.
