<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# ESM Import Standard for SwissJS

## Overview

SwissJS requires all local imports in TypeScript files to use explicit `.js` extensions to ensure proper ESM compliance. This standard applies to all packages within the SwissJS monorepo.

## Why Explicit Extensions?

1. **ESM Compliance**: Node.js in ESM mode requires explicit file extensions for local imports
2. **Build Consistency**: Ensures consistent behavior between development and production builds
3. **TypeScript Compatibility**: Works with TypeScript's `moduleResolution: "node16"` setting
4. **Future-Proofing**: Aligns with modern ESM standards

## Standard Format

All local imports must include the `.js` extension:

```typescript
// Correct
import { someFunction } from '../utils/helper.js';
import type { SomeType } from '../types/index.js';

// Incorrect
import { someFunction } from '../utils/helper';
import type { SomeType } from '../types/index';
```

## Implementation Guidelines

1. **TypeScript Files**: Always add `.js` extension to local imports in `.ts` files
2. **Type-Only Imports**: Apply the same rule to `import type` statements
3. **Relative Paths**: This applies to all relative imports (`./`, `../`)
4. **Barrel Files**: Include extensions in barrel files (index.ts) when re-exporting

## Migration Process

When adding this standard to existing codebases:

1. Systematically update all local imports to include `.js` extensions
2. Update `tsconfig.json` files to include `"module": "Node16"` when using `"moduleResolution": "node16"`
3. Verify builds still pass after changes

## Example Corrections

Before:
```typescript
import { createComponent } from '../core/component';
import type { ComponentOptions } from '../types/component';
```

After:
```typescript
import { createComponent } from '../core/component.js';
import type { ComponentOptions } from '../types/component.js';
```

## Verification

To verify compliance, you can search for missing extensions using:

```bash
# Search for imports that might be missing .js extensions
grep -r "import.*\..*/" --include="*.ts" packages/ | grep -v "\.js'"
```

## References

- [TypeScript Module Resolution](https://www.typescriptlang.org/docs/handbook/module-resolution.html)
- [Node.js ESM Documentation](https://nodejs.org/api/esm.html)
