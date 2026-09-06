<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# Core

Overview of SwissJS core runtime: components, lifecycle, reactivity, and plugin system.

## Package Structure

The `@swissjs/core` package is organized with barrel exports for clean API surface:

- **Components** (`./component`): SwissComponent base, lifecycle hooks, events, decorators
- **Reactivity** (`./reactivity`): signals, effects, computed values, stores, batch updates
- **Plugins** (`./plugins`): plugin system, types, and capability-based APIs
- **Virtual DOM** (`./vdom`): VDOM creation, diffing, and patching
- **Hooks** (`./hooks`): framework lifecycle hooks and context
- **Security** (`./security`): capability checking and security gateway
- **Runtime** (`./runtime`): runtime services and dev server
- **Renderer** (`./renderer`): hydration and rendering functions
- **Utils** (`./utils`): HTML utilities, CSS helpers, and common functions

## Core Modules

- [Components](./components.md): SwissComponent base, lifecycle hooks, events
- [Reactivity](./reactivity.md): signals, effects, computed
- [Plugins](./plugins.md): registration and capability-based APIs
- [SSR](./ssr.md): render to string and hydration

## Import Patterns

```typescript
// Import everything from a module
import * as Reactivity from '@swissjs/core/reactivity';

// Import specific exports
import { signal, effect, computed } from '@swissjs/core';

// Import types only
import type { SwissComponentOptions } from '@swissjs/core';
```

The barrel structure ensures consistent imports and clear module boundaries.
