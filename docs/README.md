<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# SwissJS Internal Architecture Documentation

## Overview

SwissJS is a capability-based web framework that provides a secure, extensible runtime with compile-time transformations. The architecture consists of four primary subsystems: the CLI toolchain, the Swite integration layer, the Swiss compiler pipeline, and the core runtime framework.


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
SWISS/
├── packages/                      # Monorepo packages
│   ├── cli/                       # CLI toolchain
│   │   ├── src/
│   │   │   ├── commands/          # CLI commands (build, dev, serve, etc.)
│   │   │   └── index.ui           # CLI entry point
│   │   └── package.json
│   ├── compiler/                  # Swiss compiler pipeline
│   │   ├── src/
│   │   │   ├── transformers/      # AST transformers
│   │   │   └── index.ui           # Main compiler interface
│   │   └── package.json
│   ├── core/                      # Core framework runtime
│   │   ├── src/
│   │   │   ├── component/         # Component system
│   │   │   ├── reactive/          # State management
│   │   │   ├── renderer/          # DOM rendering
│   │   │   └── index.ui           # Core exports
│   │   └── package.json
│   ├── router/                    # File-based routing
│   │   ├── src/
│   │   └── package.json
│   ├── swite/                     # Swite build tool (custom Vite)
│   │   ├── src/
│   │   └── package.json
│   ├── components/                # UI component library
│   │   ├── src/
│   │   │   └── ui/
│   │   │       ├── Button.uix     # JSX components
│   │   │       ├── Input.uix
│   │   │       └── Modal.uix
│   │   └── package.json
│   ├── security/                  # Capability-based security
│   │   └── package.json
│   ├── plugins/                   # Plugin system
│   │   └── package.json
│   ├── devtools/                  # Development tools
│   │   ├── capability-explorer/
│   │   ├── runtime_inspector/
│   │   └── vscode_extension/
│   └── utils/                     # Shared utilities
│       └── package.json
├── docs/                          # Documentation
│   ├── README.md                  # Architecture docs
│   ├── development/               # Development guides
│   └── api/                       # API documentation
├── .github/                       # GitHub workflows
├── pnpm-workspace.yaml            # Monorepo configuration
└── package.json                   # Root package.json
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

### 2. Swite Integration Layer

#### swite-plugin-swiss

The Swite plugin intercepts `.ui` and `.uix` files and routes them through the Swiss compiler pipeline:

```javascript
// Transformation pipeline
transform(code, id) {
  if (id.endsWith('.ui') || id.endsWith('.uix')) {
    let transformed = transformCapabilityAnnotations(code);
    transformed = transformPluginImports(transformed);
    return { code: transformed, map: null };
  }
}
```

**Key Responsibilities:**

- File extension detection and routing
- Source map preservation
- Integration with Swite's module graph
- Hot module replacement coordination

### 3. Swiss Compiler Pipeline (`dist/compiler/`)

The compiler consists of multiple transformer passes for Swiss libraries. `.ui` and `.uix` files contain specialized Swiss syntax (custom keywords, directives) which are compiled into standard TypeScript, and then to JavaScript. `.uix` files additionally support JSX syntax.

**Swiss Syntax Examples:**
- `component Name {}` → `class Name extends SwissComponent {}`
- `state { ... }` → Reactive state properties
- `mount { ... }` → Lifecycle methods

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

#### File Extension Handling

**`.ui` files** - Pure TypeScript (logic, types, utilities)
- No HTML or JSX
- Passed through as TypeScript

**`.uix` files** - TypeScript + JSX (components)
- Contains JSX syntax
- JSX is transformed to `createElement` calls
- Component render methods return JSX

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
Developer writes .ui/.uix file (Swiss Syntax)
    ↓
CLI triggers Swite dev server
    ↓
Swite detects extension
    ↓
swite-plugin-swiss intercepts
    ↓
Swiss Compiler transforms:
  - Custom Keywords (`component`, `state`) → TypeScript classes/properties
  - Capability annotations → Runtime metadata
  - Plugin imports → Service resolution
  - JSX syntax (.uix) → createElement calls
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
