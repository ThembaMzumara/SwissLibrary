<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# SwissJS (.ui) Internal Architecture Documentation

## Overview

SwissJS (internally known as `.ui`) is a capability-based web framework that provides a secure, extensible runtime with compile-time transformations. The architecture consists of four primary subsystems: the CLI toolchain, the Vite integration layer, the Swiss compiler pipeline, and the core runtime framework.

> New to the repo? Start here: [Developer Quickstart](./DEVELOPER_QUICKSTART.md)

## Plan & Roadmap

For authoritative direction (no improvisation), follow the development plan:

- See `docs/development/plan.md` — SwissJS Development Plan (authoritative)

## Recent Deep-Dives (Aug 11)

- SwissContext Deep Dive: `docs/aug-11/swiss-context-deep-dive.md`
- Fenestration Overview: `docs/aug-11/fenestration-overview.md`
- Phase Gap Analysis: `docs/aug-11/phase-gap-analysis.md`

## Project Structure

```
1UI/
├── dist/                          # Compiled output
│   ├── cli/                       # CLI toolchain
│   │   ├── commands/              # Individual CLI commands
│   │   │   ├── build.js           # Production build command
│   │   │   ├── compile.js         # Compile .ui files
│   │   │   ├── create.js          # Project scaffolding
│   │   │   ├── dev.js             # Development server
│   │   │   ├── init.js            # Initialize existing project
│   │   │   └── serve.js           # Static file server
│   │   ├── index.js               # CLI entry point
│   │   └── server.js              # Development server implementation
│   ├── compiler/                  # Swiss compiler pipeline
│   │   ├── transformers/          # AST transformers
│   │   │   └── capability-annot.js # Capability annotation processor
│   │   ├── import-transformer.js  # Plugin import resolver
│   │   └── index.js               # Main compiler interface
│   ├── core/                      # Core framework runtime
│   │   ├── component/             # Component system
│   │   │   ├── component.js       # Base Component class
│   │   │   └── decorators.js      # @requires, @connect decorators
│   │   ├── plugin/                # Plugin architecture
│   │   │   ├── context.js         # Plugin execution context
│   │   │   ├── registry.js        # Plugin lifecycle manager
│   │   │   └── resolver.js        # Service resolution
│   │   ├── reactive/              # State management
│   │   │   ├── context.js         # React-style context API
│   │   │   └── reactive.js        # SwissStore implementation
│   │   ├── renderer/              # DOM rendering
│   │   │   └── renderer.js        # Virtual DOM to real DOM
│   │   ├── utils/                 # Utility functions
│   │   │   └── html.js            # HTML manipulation helpers
│   │   ├── vdom/                  # Virtual DOM implementation
│   │   │   ├── diffing.js         # VDOM diffing algorithm
│   │   │   └── vdom.js            # VNode creation and types
│   │   └── index.js               # Core exports
│   ├── plugins/                   # Built-in capability plugins
│   │   ├── audio/                 # Web Audio API wrapper
│   │   ├── filesystem/            # File system access
│   │   ├── webgpu/                # WebGPU integration
│   │   └── workers/               # Web Workers management
│   ├── runtime/                   # Runtime security and resources
│   │   ├── capability/            # Capability enforcement
│   │   │   └── manager.js         # Security policy enforcement
│   │   ├── devtools/              # Development tools integration
│   │   │   └── index.js           # DevTools connector
│   │   └── resources/             # Resource pool management
│   │       └── index.js           # Memory and resource limits
│   └── plugins/                   # Plugin system
│       ├── vite-plugin-swiss/     # Vite integration plugin
│       │   └── index.js           # vite-plugin-swiss
│       └── file-routing/          # File-based routing plugin
│           └── index.js           # file-routing plugin
├── packages/                      # Monorepo workspace packages
└── docs/                          # Documentation
    └── ucf-mapping.md             # UCF (Universal Component Format) spec
```

## Architecture Components

### 1. CLI Toolchain (`dist/cli/`)

The CLI serves as the primary developer interface and orchestrates the entire build pipeline:

**Command Structure:**

- `build.js`: Production build with tree-shaking and optimization
- `compile.js`: Standalone .ui file compilation
- `create.js`: Project scaffolding with capability templates
- `dev.js`: Development server with HMR and live reloading
- `init.js`: Convert existing projects to SwissJS
- `serve.js`: Static file serving for production builds

**Key Responsibilities:**

- Development server orchestration
- Build pipeline coordination
- Project template generation
- Dependency resolution and validation

### 2. Vite Integration Layer

#### vite-plugin-swiss

The Vite plugin intercepts `.ui` files and routes them through the Swiss compiler pipeline. For `.ui` files, the compiler performs minimal processing and returns the source unchanged (aside from import path adjustments performed by other tooling when needed):

```javascript
// Transformation pipeline
transform(code, id) {
  if (id.endsWith('.ui')) {
    let transformed = transformCapabilityAnnotations(code);
    transformed = transformPluginImports(transformed);
    return { code: transformed, map: null };
  }
}
```

**Key Responsibilities:**

- File extension detection and routing
- Source map preservation
- Integration with Vite's module graph
- Hot module replacement coordination

### 3. Swiss Compiler Pipeline (`dist/compiler/`)

The compiler consists of multiple transformer passes for Swiss libraries. However, `.ui` files are pure TypeScript using `html` template literals and are passed through unchanged.

**Compiler Architecture:**

- `index.js`: Main compiler interface and transformation orchestrator
- `import-transformer.js`: Plugin import resolution and service injection
- `transformers/capability-annot.js`: Capability annotation processor

#### Capability Annotation Transformer (`capability-annot.js`)

Processes `@requires` decorators and injects runtime capability metadata:

```javascript
// Input: @requires('filesystem', 'network')
// Output: Component.__requiredCapabilities = ['filesystem', 'network']
```

#### Plugin Import Transformer (`import-transformer.js`)

Resolves plugin imports and injects service resolution logic:

```javascript
// Input: import { FileService } from '@swiss/filesystem'
// Output: const FileService = __resolveService('filesystem', 'FileService')
```

#### `.ui` Handling (integrated in `index.ts`)

`.ui` files are treated as first-class TypeScript modules that render using `html` template literals. There is no JSX parsing, no `<template>` sections, and no conversion to `createElement` calls. The compiler returns `.ui` files as-is.

### 4. Core Runtime Framework (`dist/core/`)

#### Component System (`core/component/`)

**Component Class (`component.js`)**
Base class for all Swiss components with lifecycle management:

```typescript
class Component {
  constructor(props: ComponentProps) {
    this.__validateCapabilities();
    this.__initializeServices();
    this.state = this.getInitialState();
  }

  __validateCapabilities() {
    const required = this.constructor.__requiredCapabilities || [];
    CapabilityManager.enforcePolicy(required, this);
  }
}
```

**Decorator System (`decorators.js`)**

- `@requires(capability: string)`: Declares required capabilities
- `@connect(store: SwissStore)`: Connects component to state management
- `@plugin(name: string)`: Injects plugin services

#### VDOM System (`core/vdom/`)

**VNode Creation (`vdom.js`)**
Factory function for creating VDOM nodes:

```typescript
function createElement(
  type: string | ComponentClass,
  props: Props,
  ...children: VNode[]
): VNode {
  return {
    type,
    props: { ...props, children: children.flat() },
    key: props.key || null,
    ref: props.ref || null,
  };
}
```

**Diffing Algorithm (`diffing.js`)**
Optimized reconciliation with:

- Key-based list diffing
- Component instance reuse
- Minimal DOM mutations
- Batched updates

#### State Management (`core/reactive/`)

**SwissStore (`reactive.js`)**
Reactive state container with subscription model:

```typescript
class SwissStore<T> {
  private state: T;
  private subscribers: Set<(state: T) => void> = new Set();

  setState(updater: (prev: T) => T) {
    this.state = updater(this.state);
    this.notifySubscribers();
  }
}
```

**Context API (`context.js`)**
Provider/Consumer pattern for dependency injection:

```typescript
const ThemeContext = createContext<Theme>();

// Provider
<ThemeContext.Provider value={darkTheme}>
  <App />
</ThemeContext.Provider>

// Consumer
const theme = useContext(ThemeContext);
```

#### Plugin System (`core/plugin/`)

**Plugin Registry (`registry.js`)**
Centralized plugin lifecycle management:

```typescript
class PluginRegistry {
  private plugins: Map<string, Plugin> = new Map();
  private services: Map<string, any> = new Map();

  register(name: string, plugin: Plugin) {
    this.plugins.set(name, plugin);
    plugin.initialize(new PluginContext(this));
  }

  getService(pluginName: string, serviceName: string) {
    return this.services.get(`${pluginName}:${serviceName}`);
  }
}
```

**Plugin Context (`context.js`)**
Execution environment for plugins with controlled access to framework internals.

**Service Resolver (`resolver.js`)**
Runtime service injection mechanism:

```typescript
function __resolveService(capability: string, serviceName: string) {
  const plugin = PluginRegistry.getPluginByCapability(capability);
  if (!plugin) throw new Error(`No plugin provides capability: ${capability}`);
  return plugin.getService(serviceName);
}
```

#### HTML Utilities (`core/utils/`)

**HTML Manipulation (`html.js`)**
Low-level DOM manipulation helpers for the renderer system.

#### Renderer System (`core/renderer/`)

**DOM Renderer (`renderer.js`)**
Efficient DOM manipulation with batching:

```typescript
function renderToDOM(vnode: VNode, container: HTMLElement) {
  const patches = diff(container.__vnode, vnode);
  applyPatches(container, patches);
  container.__vnode = vnode;
}
```

## Development Workflow

### DevTools Quickstart (Phase 5)

- Prereq Node: `.nvmrc` (v18.19.0). Make sure your Node matches.
- Generate deterministic API docs: `pnpm docs:api && pnpm docs:api:index`
- Barrel compliance: `pnpm -w check:barrels`
- Public API reports:
  - Build/update baselines: `pnpm api:build`
  - Check drift vs baselines: `pnpm api:check`

These steps run in CI via `.github/workflows/ci-devtools.yml`.

### 1. File Processing Pipeline

```
Developer writes .ui file
    ↓
CLI triggers Vite dev server
    ↓
Vite detects .ui extension
    ↓
vite-plugin-swiss intercepts
    ↓
Swiss Compiler transforms:
  - Capability annotations → Runtime metadata
  - Plugin imports → Service resolution
  - Template syntax → createElement calls
    ↓
Standard JavaScript output
    ↓
Browser receives and executes
```

### 2. Runtime Initialization

```
Application starts
    ↓
Plugin Registry initializes
    ↓
Plugins register services
    ↓
Components instantiate
    ↓
Capability validation occurs
    ↓
Service injection happens
    ↓
VDOM rendering begins
```

### 3. Component Lifecycle

```
Component constructor called
    ↓
Capability validation
    ↓
Service injection
    ↓
State initialization
    ↓
First render
    ↓
Mount to DOM
    ↓
Update cycles (props/state changes)
    ↓
Unmount and cleanup
```

## Security Model

### Capability-Based Access Control

Components must explicitly declare required capabilities:

```javascript
@requires("filesystem", "network")
class FileUploader extends Component {
  async uploadFile(file) {
    // FileService available due to 'filesystem' capability
    const content = await FileService.read(file.path);
    // NetworkService available due to 'network' capability
    await NetworkService.upload(content);
  }
}
```

### Plugin Isolation

Plugins operate in isolated contexts with limited access to:

- System resources through ResourcePools
- Other plugins through explicit service contracts
- Framework internals through PluginContext API

### Runtime Policy Enforcement

Capability Manager validates permissions at:

- Component instantiation
- Service method invocation
- Resource pool access
- Cross-plugin communication

## Performance Characteristics

### Compile-Time Optimizations

- Dead code elimination for unused capabilities
- Plugin bundling with tree-shaking
- Template pre-compilation
- Static analysis for capability inference

### Runtime Optimizations

- VDOM diffing with minimal DOM mutations
- Batched state updates
- Component instance pooling
- Lazy plugin loading
- Resource pool management

### Memory Management

- Automatic cleanup of unused components
- Plugin lifecycle management
- Resource pool limits
- Garbage collection optimization

## Extension Points

### Custom Capabilities

Developers can define custom capabilities:

```typescript
interface CustomCapability {
  name: string;
  validator: (context: ComponentContext) => boolean;
  resources: ResourcePool<any>[];
}
```

### Plugin Development

Plugins extend framework functionality:

```typescript
class DatabasePlugin implements Plugin {
  name = "database";
  capabilities = ["database"];

  initialize(context: PluginContext) {
    context.registerService("DatabaseService", new DatabaseService());
  }
}
```

### Compiler Extensions

Custom transformers can be added to the compiler pipeline:

```typescript
function customTransformer(code: string, id: string): TransformResult {
  // Custom transformation logic
  return { code: transformedCode, map: sourceMap };
}
```

This architecture provides a secure, performant, and extensible foundation for building modern web applications with fine-grained capability control and plugin-based extensibility.
