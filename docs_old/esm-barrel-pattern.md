<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# SwissJS Pure ESM Barrel Pattern

> **Zero CommonJS. Optimized for tree-shaking, static analysis, and native browser modules.**

---

## Core Philosophy

1. **ESM Exclusivity**
   - No CommonJS (`require/module.exports`)
   - `.js` extensions in all imports (`import x from './file.js'`)
   - Top-level `await` supported
2. **Encapsulation**
   - Hide internals: `src/_internal/` for private code
   - Only `index.js` exposes public API
3. **Tree-Shaking First**
   - Named exports only (no defaults)
   - Side-effect-free modules

---

## Directory Structure

```bash
src/
├── types/                  # Type definitions
│   ├── core.d.ts           # Shared types
│   ├── api.d.ts            # API contracts
│   └── index.js            # Type barrel
├── components/             # SwissJS components
│   ├── Card/
│   │   ├── Card.js         # Implementation
│   │   ├── Card.test.js    # Tests
│   │   └── index.js        # Component barrel
├── hooks/                  # SwissJS hooks
│   ├── useStore.js
│   └── index.js
├── utils/                  # Pure functions
│   ├── validation.js
│   └── index.js
├── _internal/              # PRIVATE (never exported)
│   └── caching.js          
└── index.js                # Public API entry
```

---

## Barrel File Rules

### Root `index.js`
```js
// ✅ CORRECT: Public API surface
export * from './components/index.js';
export * from './hooks/index.js';
export * from './utils/index.js';
export { Logger } from './services/logger.js';

// ❌ FORBIDDEN
export * from './_internal'; // Internal leak!
export { Card } from './components/Card/Card.js'; // Deep import
```

### Category Barrels (`components/index.js`)
```js
// Named exports only
export { Card } from './Card/index.js';
export { Modal } from './Modal/index.js';

// Async export (top-level await)
export { LazyChart } from './Chart/async-wrapper.js';
```

---

## SwissJS ESM Implementation Guide

### 1. Component Pattern
```js
// components/Card/Card.js
export const Card = (props) => {
  return <div class="card">{props.children}</div>;
};

// components/Card/index.js
export { Card } from './Card.js';
export * from './Card.types.js'; // Type-only exports
```

### 2. Type Export Strategy
```ts
// types/api.d.ts
export interface ApiResponse<T> {
  data: T;
  status: 'success' | 'error';
}

// types/index.js
export * from './api.js';
export * from './core.js';
```

### 3. Utility Modules
```js
// utils/validation.js
export const isEmail = (str) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);

// utils/index.js
export * from './validation.js';
export { formatDate } from './date-format.js';
```

---

## Tooling Configuration

### `package.json`
```json
{
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "./components": {
      "types": "./dist/components/index.d.ts",
      "default": "./dist/components/index.js"
    }
  },
  "sideEffects": false,
  "files": ["dist"]
}
```

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "dist",
    "declaration": true
  }
}
```

---

## Consumer Experience

### Correct Usage
```js
// Browser/Node (ESM only)
import { Card, isEmail } from 'your-lib';

// Tree-shaken import
import { useStore } from 'your-lib/hooks';
```

### Blocked Anti-Patterns
```js
// ❌ Deep imports disabled
import Card from 'your-lib/dist/components/Card.js';

// ❌ CommonJS usage fails
const { Card } = require('your-lib'); // Throws error
```

---

## Best Practices
1. **File Extensions**
   - Always use `.js` in imports (even in TypeScript)
2. **Export Isolation**
   ```js
   // ✅ Good
   export { A } from './a.js';
   
   // ❌ Bad (exports utils internals)
   export * from './utils';
   ```
3. **Type Safety**
   - Separate `.d.ts` files colocated with implementations
4. **Private Enforcement**
   - Use `_internal` prefix for non-exported modules
   - Add build check:
   ```bash
   # Prevent internal exports
   grep -r 'export .*_internal' src && exit 1
   ```

---

## Performance Optimizations
1. **Static Imports Only**
   - Dynamic imports only for code-split entry points
2. **Side-Effect Detection**
   ```json
   {
     "sideEffects": [
       "**/*.css",
       "**/polyfills.js"
     ]
   }
   ```
3. **Dual-Mode Ban**
   - No `conditional exports` for CJS/ESM - pure ESM only

---

## Migration Checklist
1. Replace all `require()` with `import`
2. Add `.js` to every relative import
3. Convert `module.exports` → named exports
4. Delete `__esModule` interop
5. Set `"type": "module"` in package.json
6. Verify with:
   ```bash
   node --eval "import pkg from './dist/index.js'; console.log(pkg)" 
   ```

---

## Why This Matters
| Metric          | CommonJS       | Pure ESM        |  
|-----------------|----------------|-----------------|  
| Tree-shaking    | Limited        | Optimal         |  
| Load Time       | Slower         | Faster          |  
| Bundle Size     | +25-40%        | Minimal         |  
| Browser Support | Transpilation  | Native Support  |  
| Async Top-Level | Impossible     | Supported       |  

**Final Directive**:
> Every new SwissJS library MUST use this pattern. Existing packages migrate by Q4 2024.  
> Tools will reject PRs containing:  
> - `require()`  
> - `.ts`/`.tsx` imports without `.js`  
> - Default exports  
> - `_internal` exports 

---

# SwissJS Dual Runtime Architecture (2024+)

SwissJS supports both Node.js and Bun.js natively via a dual runtime architecture. All runtime-specific logic is encapsulated in adapters, and the rest of the framework and plugins use a unified `runtimeService` API.

## Key Concepts
- **Runtime Detection**: `runtime-detector.ts` detects Node.js or Bun.js at runtime.
- **Adapters**: All Node.js/Bun.js APIs are isolated in `adapters/node-adapter.ts` and `adapters/bun-adapter.ts`.
- **Unified API**: The rest of the codebase uses `runtimeService` for all file, process, and network operations.
- **Pure ESM**: All files use ESM syntax, explicit `.js` extensions, and follow the barrel pattern.

## Example: Using the Runtime Service
```js
import { runtimeService } from '@swissjs/core/runtime/runtime-service.js';

// Read a file (works in both Node.js and Bun.js)
const content = await runtimeService.readFile('./data.json');

// Start a server
const server = runtimeService.createServer({ port: 3000 });
```

## Migration Checklist
1. **Remove all direct imports of `fs`, `path`, `child_process`, `express`, `chokidar`, or `Bun` outside of adapters.**
2. **Replace all such usages with the corresponding `runtimeService` method.**
3. **Ensure all barrels use explicit `.js` extensions and only named exports.**
4. **Test your code in both Node.js and Bun.js.**

## Plugin Example (Runtime-Aware)
```js
export const myPlugin = {
  name: 'my-plugin',
  async init(context) {
    // Use runtimeService for all file/network/process operations
    const data = await context.runtime.service.readFile('./foo.txt');
    if (context.runtime.capabilities.type === 'bun') {
      // Bun-specific logic
    }
  }
};
```

## Why This Matters
- **Performance**: Bun.js is 3-4x faster for many operations.
- **Portability**: SwissJS runs anywhere, no code changes.
- **Maintainability**: All runtime logic is centralized and swappable.

> All new code and plugins must use the runtimeService API. Direct Node.js/Bun.js APIs are forbidden outside adapters. 