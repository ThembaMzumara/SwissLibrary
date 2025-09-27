<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# SwissContext: Usage and Behavior

Sources:

- Runtime factory: `packages/core/src/component/context.ts`
- Component integration: `packages/core/src/component/component.ts`

## Creating a Context

```ts
import { SwissContext } from '@swissjs/core/component/context';

const Theme = SwissContext.create<string>();
```

- `SwissContext.create<T>()` allocates an internal `Symbol` key and returns `{ Provider, Consumer }`.

## Providing a Value

```ts
// inside a component instance method (e.g., mount/init)
Theme.Provider('dark')(this);
```

- `Provider(value)` applies `component.provideContext(key, value)` to the current component.
- Values are stored on the instance and available to descendants.

## Consuming a Value

```ts
const theme = Theme.Consumer()(this); // 'dark' | undefined
```

- `Consumer()` produces a getter function that calls `component.useContext(key)`.
- Lookup walks parents to find the nearest provider.

## Component API

From `SwissComponent` in `component.ts`:

- `provideContext<T>(key: symbol, value: T)` stores value on the component.
- `useContext<T>(key: symbol): T | undefined` resolves nearest value by traversing `_parent` chain.

## Notes

- Keys are `Symbol`-scoped per `create<T>()`, avoiding name collisions.
- No default value semantics: if not provided up the tree, `undefined` is returned.
