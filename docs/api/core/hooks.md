<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

---
title: Hooks API
---

# Hooks API

## Hook Registry

### HookRegistry Class

```typescript
class HookRegistry {
  register(name: string, phase: string, callback: HookCallback, priority?: number): void
  unregister(name: string, phase: string, callback: HookCallback): void
  emit(name: string, phase: string, context: unknown): Promise<unknown[]>
  has(name: string, phase: string): boolean
  list(): string[]
}
```

## Hook Events

### HookEvent Type

```typescript
type HookEvent = 
  | 'component:mount'
  | 'component:update' 
  | 'component:destroy'
  | 'component:error'
  | 'route:resolve'
  | 'route:change'
  | 'ssr:render'
  | 'data:fetch'
  | 'capability:check'
  | 'security:error'
  | 'plugin:lifecycle'
  | 'framework:lifecycle'
```

## Default Hooks

### DEFAULT_HOOKS

Pre-registered framework hooks.

```typescript
const DEFAULT_HOOKS: HookEvent[] = [
  'component:mount',
  'component:update',
  'component:destroy',
  'component:error',
  'route:resolve',
  'route:change',
  'ssr:render',
  'data:fetch',
  'capability:check',
  'security:error'
]
```

### initializeDefaultHooks()

Initializes default hooks in the registry.

```typescript
function initializeDefaultHooks(registry: HookRegistry): void
```

## Hook Context Types

### ComponentRenderContext

```typescript
interface ComponentRenderContext {
  component: SwissComponent
  vnode: VNode
  props: Record<string, unknown>
}
```

### ComponentMountContext

```typescript
interface ComponentMountContext {
  component: SwissComponent
  element: HTMLElement
  props: Record<string, unknown>
}
```

### RouteResolveContext

```typescript
interface RouteResolveContext {
  path: string
  params: Record<string, string>
  query: Record<string, string>
}
```

### RouteChangeContext

```typescript
interface RouteChangeContext {
  from: string
  to: string
  params: Record<string, string>
}
```

### SSRContext

```typescript
interface SSRContext {
  component: SwissComponent
  props: Record<string, unknown>
  url: string
}
```

### DataFetchContext

```typescript
interface DataFetchContext {
  url: string
  method: string
  headers: Record<string, string>
  body?: unknown
}
```

### CapabilityCheckContext

```typescript
interface CapabilityCheckContext {
  capability: string
  component: SwissComponent
  granted: boolean
  reason?: string
}
```

### SecurityErrorContext

```typescript
interface SecurityErrorContext {
  error: Error
  component: SwissComponent
  capability: string
  context: SecurityContext
}
```

### PluginLifecycleContext

```typescript
interface PluginLifecycleContext {
  plugin: Plugin
  phase: 'install' | 'uninstall' | 'activate' | 'deactivate'
  context: PluginContext
}
```

### FrameworkLifecycleContext

```typescript
interface FrameworkLifecycleContext {
  phase: 'init' | 'ready' | 'destroy'
  framework: SwissFramework
}
```

## Hook Registration

### HookRegistration Interface

```typescript
interface HookRegistration {
  name: string
  phase: string
  callback: (context: unknown) => void | Promise<void>
  priority?: number
}
```

## Hook Callback

```typescript
type HookCallback = (context: unknown) => void | Promise<void>
```

## Usage Examples

### Component Lifecycle Hooks

```typescript
const registry = new HookRegistry()

// Register component mount hook
registry.register('component', 'mount', async (context: ComponentMountContext) => {
  console.log('Component mounted:', context.component.constructor.name)
  // Perform initialization
})

// Register component error hook
registry.register('component', 'error', (context: ComponentErrorContext) => {
  console.error('Component error:', context.error)
  // Handle errors
})
```

### Route Hooks

```typescript
// Route resolution hook
registry.register('route', 'resolve', async (context: RouteResolveContext) => {
  console.log('Resolving route:', context.path)
  // Pre-load data, check permissions, etc.
})

// Route change hook
registry.register('route', 'change', (context: RouteChangeContext) => {
  console.log('Route changed from', context.from, 'to', context.to)
  // Update analytics, scroll position, etc.
})
```

### Security Hooks

```typescript
// Capability check hook
registry.register('capability', 'check', (context: CapabilityCheckContext) => {
  console.log('Capability checked:', context.capability, 'granted:', context.granted)
  // Audit security decisions
})

// Security error hook
registry.register('security', 'error', (context: SecurityErrorContext) => {
  console.error('Security error:', context.error)
  // Report security violations
})
```

### Plugin Hooks

```typescript
// Plugin lifecycle hook
registry.register('plugin', 'lifecycle', async (context: PluginLifecycleContext) => {
  console.log('Plugin', context.plugin.name, context.phase)
  // Track plugin lifecycle
})
```

## Hook Priorities

Hooks can have priorities to control execution order:

```typescript
// High priority hooks run first
registry.register('component', 'mount', highPriorityHook, 100)

// Default priority (0)
registry.register('component', 'mount', defaultHook)

// Low priority hooks run last
registry.register('component', 'mount', lowPriorityHook, -100)
```

## Async Hook Support

Hooks can be async and the registry will wait for completion:

```typescript
registry.register('data', 'fetch', async (context: DataFetchContext) => {
  // Async data fetching
  const data = await fetchData(context.url)
  context.data = data
})
```

## Hook Chaining

Multiple hooks can be registered for the same event:

```typescript
// Multiple hooks for the same event
registry.register('component', 'mount', analyticsHook)
registry.register('component', 'mount', loggingHook)
registry.register('component', 'mount', initializationHook)

// All will execute in priority order
```
