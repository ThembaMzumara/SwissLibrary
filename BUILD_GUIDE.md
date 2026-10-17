# SwissJS Build Guide

## Overview

SwissJS is a monorepo containing the core framework (SWISS) and enterprise applications (SwissEnterpriseRepo). This guide explains the build process and development workflow.

## Repository Structure

```
SWS/
├── SWISS/                          # Core framework monorepo
│   ├── packages/
│   │   ├── core/                   # @swissjs/core - Component system, reactivity, renderer
│   │   ├── compiler/               # @swissjs/compiler - TypeScript/JSX compilation
│   │   ├── swite/                  # @swissjs/swite - Development server
│   │   └── cli/                    # @swissjs/cli - CLI tools
│   └── pnpm-workspace.yaml
│
└── SwissEnterpriseRepo/            # Applications monorepo
    ├── apps/
    │   └── pos/                    # POS application
    ├── packages/
    │   ├── cart/                   # Cart package
    │   ├── connectivity/           # Connectivity package
    │   └── ...
    └── pnpm-workspace.yaml
```

## Build Process

### 1. Core Framework Build

The SWISS core packages must be built before applications can use them:

```bash
# Build individual packages
cd c:/Users/themb/Documents/dev/SWS/SWISS/packages/core
pnpm build

cd c:/Users/themb/Documents/dev/SWS/SWISS/packages/compiler
pnpm build

cd c:/Users/themb/Documents/dev/SWS/SWISS/packages/swite
pnpm build

cd c:/Users/themb/Documents/dev/SWS/SWISS/packages/cli
pnpm build
```

**What happens during build:**
- TypeScript source files (`.ts`) are compiled to JavaScript (`.js`)
- Type definitions (`.d.ts`) are generated
- Output goes to `dist/` directory
- Source maps are created for debugging

### 2. Application Development

Applications use the SWITE development server which provides:
- Hot Module Replacement (HMR)
- On-the-fly TypeScript compilation
- JSX transformation
- Module resolution for workspace packages

```bash
# Start POS app development server
cd c:/Users/themb/Documents/dev/SWS/SwissEnterpriseRepo/apps/pos
node c:/Users/themb/Documents/dev/SWS/SWISS/packages/cli/dist/main.js dev
```

**SWITE Server Features:**
- Compiles `.uix` files (TypeScript + JSX) on-demand
- Strips TypeScript-only syntax using AST transformer
- Resolves workspace package imports (`@swiss-enterprise/*`)
- Serves files at `http://localhost:3000`

## File Types

### `.ui` Files (TypeScript Only)
- Pure TypeScript, no JSX
- Used for business logic, services, utilities
- Example: `eventBus.ts`, `config.ts`

### `.uix` Files (TypeScript + JSX)
- TypeScript with JSX syntax
- Used for components that render UI
- Example: `App.uix`, `CartItem.uix`

**Compilation:**
```typescript
// Source (.uix)
export class MyComponent extends SwissComponent {
    render() {
        return <div>Hello</div>;
    }
}

// Compiled (served by SWITE)
export class MyComponent extends SwissComponent {
    render() {
        return createElement('div', {}, 'Hello');
    }
}
```

## Development Workflow

### Making Changes to Core Framework

1. **Edit source files** in `SWISS/packages/*/src/`
2. **Rebuild the package:**
   ```bash
   cd SWISS/packages/core
   pnpm build
   ```
3. **Restart dev server** to use new build:
   ```bash
   # Kill existing server
   taskkill //F //IM node.exe
   
   # Start fresh
   cd SwissEnterpriseRepo/apps/pos
   node ../../SWISS/packages/cli/dist/main.js dev
   ```

### Making Changes to Applications

1. **Edit source files** in `SwissEnterpriseRepo/apps/*/src/`
2. **HMR automatically reloads** - no rebuild needed
3. **Hard refresh browser** (Ctrl+Shift+R) to see changes

## Common Build Issues

### Issue: "Cannot find module '@swissjs/core'"

**Cause:** Core package not built or not linked properly

**Solution:**
```bash
cd SWISS/packages/core
pnpm build
```

### Issue: "Unexpected token" or "Unexpected identifier"

**Cause:** TypeScript syntax not stripped from compiled output

**Solution:** Check that AST transformer is working:
- File: `SWISS/packages/compiler/src/transformers/type-syntax-stripper.ts`
- Ensure it's removing: type annotations, interfaces, enums, access modifiers

### Issue: White screen / No rendering

**Cause:** Component mount lifecycle issue (now fixed)

**Solution:** Apply the fix from `CRITICAL_BUG_FIX.md`

## Build Artifacts

### Core Packages (`dist/` directories)
- **DO NOT COMMIT** - Generated files
- Listed in `.gitignore`
- Must be rebuilt after source changes

### Application Bundles
- Currently using dev server (no production build)
- Future: Will use build command to create optimized bundles

## Key Dependencies

- **TypeScript:** Compilation and type checking
- **esbuild:** Fast JavaScript/JSX transformation
- **pnpm:** Package manager with workspace support
- **chokidar:** File watching for HMR

## Next Steps

1. **Implement production build** for applications
2. **Add build scripts** to root `package.json`
3. **Create CI/CD pipeline** for automated builds
4. **Optimize bundle size** with tree-shaking and minification
