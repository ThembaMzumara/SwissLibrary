<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

---
title: @swissjs/core API
---

# @swissjs/core API Reference

The core package provides the fundamental building blocks of SwissJS applications.

## Core Modules

### [Components](./components.md)
SwissComponent base class, lifecycle hooks, decorators, and event handling.

### [Reactivity](./reactivity.md)
Signals, effects, computed values, stores, and batch updates.

### [Plugins](./plugins.md)
Plugin system, registration, and capability-based APIs.

### [Virtual DOM](./vdom.md)
VDOM creation, diffing, and patching utilities.

### [Security](./security.md)
Capability checking, security gateway, and access control.

### [Devtools](./devtools.md)
Development tools bridge and debugging utilities.

### [Hooks](./hooks.md)
Framework lifecycle hooks and context management.

### [Runtime](./runtime.md)
Runtime services and development server.

### [Renderer](./renderer.md)
Hydration and rendering functions.

### [Utils](./utils.md)
HTML utilities, CSS helpers, and common functions.

## Import Patterns

```typescript
// Import specific exports
import { SwissComponent, signal, effect } from '@swissjs/core';

// Import entire modules
import * as Components from '@swissjs/core/component';
import * as Reactivity from '@swissjs/core/reactivity';

// Import types only
import type { SwissComponentOptions, Signal } from '@swissjs/core';
```

## Package Structure

The core package uses barrel exports for clean API organization:

- `@swissjs/core` - Main entry point with curated exports
- `@swissjs/core/component` - Component system
- `@swissjs/core/reactivity` - Reactivity system  
- `@swissjs/core/plugins` - Plugin system
- `@swissjs/core/security` - Security features
- `@swissjs/core/vdom` - Virtual DOM
- `@swissjs/core/hooks` - Lifecycle hooks
- `@swissjs/core/devtools` - Development tools
- `@swissjs/core/runtime` - Runtime services
- `@swissjs/core/renderer` - Rendering utilities
- `@swissjs/core/utils` - Helper functions
