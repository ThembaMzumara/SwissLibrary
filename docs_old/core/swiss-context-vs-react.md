<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# SwissContext vs React Context

## Similarities

- Provider/Consumer pattern.
- Parent-to-child propagation, nearest provider wins.
- Works across component boundaries.

## Differences

- SwissContext uses a simple factory that returns functions operating on a `SwissComponent` instance (`Provider(value)(component)`), not JSX elements.
- No default value on `create()`; unresolved lookups return `undefined`.
- Implementation is minimal and framework-agnostic; relies on `SwissComponent.provideContext/useContext` with parent traversal.
- No render-trigger semantics are defined here; consumers must re-render when needed using framework mechanisms.

## Integration Points

- Runtime: `packages/core/src/component/context.ts` (factory)
- Component: `packages/core/src/component/component.ts` (`provideContext`, `useContext`)
