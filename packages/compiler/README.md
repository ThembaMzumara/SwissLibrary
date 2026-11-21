<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# @swissjs/compiler

SwissJS compiler provides minimal, focused AST transformations for Swiss libraries while treating `.ui` files as pure TypeScript sources. `.ui` files use `html` template literals for markup and are passed through unchanged (aside from import path adjustments performed by tooling where needed).

## Features

- Component decorators: `@component`, `@template`, `@style`
- Plugin/service decorators: `@plugin`, `@service`
- Lifecycle/render decorators: `@onMount`, `@onUpdate`, `@onDestroy`, `@onError`, `@render`, `@bind`, `@computed`
- Capability decorators: `@requires`, `@provides`, and capability definition annotations
- `.ui` pass-through: `.ui` files are pure TypeScript using `html`` template literals; no JSX or XML parsing

## `.ui` Authoring

Write `.ui` files as standard TypeScript modules and render using `html` template literals from `@swissjs/core`. Do not use JSX, `jsxImportSource` pragmas, or `<template>` blocks in `.ui`.

## Transform Pipeline

Order in `src/index.ts` (applies to non-`.ui` files; `.ui` are passed through):

1. `componentTemplateStyleTransformer()`
2. `pluginServiceTransformer()`
3. `lifecycleRenderTransformer()`
4. `capabilityTransformer()`
5. `providesTransformer()`
6. `capabilityDefTransformer()`

Each transformer removes source decorators and emits equivalent registration calls after the class to keep runtime behavior consistent and enable static analysis. `.ui` files are not transformed.

### Plugin/Service Decorators (AST)

The `pluginServiceTransformer()` handles `@plugin` (class) and `@service` (property) decorators by removing them and emitting runtime-equivalent registration calls.

- Placement
  - `@plugin(...)` on class declarations.
  - `@service(...)` on instance properties/fields.
- Arguments
  - Name: string literal or identifier (e.g., `'router'` or `RouterPluginName`).
  - Options (optional): object literal or identifier (e.g., `{ singleton: true }` or `opts`).
- Emitted calls
  - Class: `plugin(name, options?)(ClassName)`
  - Property: `service(name, options?)(ClassName.prototype, 'prop')`

These calls align with runtime decorator helpers in `@swissjs/core` so behavior is unchanged at runtime while enabling static analysis and tree-shaking.

## Diagnostics

- LC1001: `@render` must decorate a method
- LC1002: `@computed` must decorate a getter or method
- LC1003: Lifecycle decorators must decorate a method

## Notes

- Local ESM imports in TS must use explicit `.js` extensions in specifiers after build.
- Decorators are optional; TSX authoring with `render()` works without `@template/@style`.
