<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

---
title: Components API
---

# Components API

## SwissComponent

The base class for all SwissJS components.

```typescript
class SwissComponent<P extends BaseComponentProps = BaseComponentProps, S extends BaseComponentState = BaseComponentState> {
  constructor(props: P)
  
  // Component lifecycle
  mount(): void
  render(): VNode
  update(props: Partial<P>): void
  destroy(): void
  
  // State management
  setState(state: Partial<S>): void
  getState(): S
}
```

## Decorators

### Component Registration

```typescript
@component(options?: ComponentOptions)
```

Registers a class as a SwissJS component.

**Options:**
- `selector?: string` - CSS selector for the component
- `template?: string` - Component template
- `styles?: string | object` - Component styles

### Lifecycle Hooks

```typescript
@onMount(options?: LifecycleOptions)
@onUpdate(options?: LifecycleOptions)  
@onDestroy(options?: LifecycleOptions)
@onError(options?: LifecycleOptions & { recover?: boolean })
```

**LifecycleOptions:**
- `async?: boolean` - Run hook asynchronously
- `timeout?: number` - Hook timeout in ms
- `dependencies?: string[]` - Hook dependencies
- `cleanup?: string[]` - Cleanup functions to run

### Event Handlers

```typescript
@onClick(selector?: string)
@onChange(selector?: string)
@onInput(selector?: string)
@onSubmit(selector?: string)
@onFocus(selector?: string)
@onBlur(selector?: string)
@onKeyDown(selector?: string)
@onKeyUp(selector?: string)
@onMouseOver(selector?: string)
@onMouseOut(selector?: string)
@onMouseEnter(selector?: string)
@onMouseLeave(selector?: string)
```

### Template and Style Decorators

```typescript
@template(template: string)
@style(styles: string | object)
```

### Capability Decorators

```typescript
@requires(capabilities: string | string[], options?: CapabilityOptions)
@provides(capabilities: string | string[], options?: CapabilityOptions)
@capability(capability: string, options?: CapabilityOptions)
```

**CapabilityOptions:**
- `strict?: boolean` - Strict capability checking
- `fallback?: string` - Fallback capability
- `scope?: 'children' | 'siblings' | 'global'` - Capability scope
- `conditional?: (context) => boolean` - Conditional capability
- `audit?: boolean` - Audit capability usage

### Render and Binding

```typescript
@render(options?: RenderOptions)
@bind(propertyName: string, options?: RenderOptions)
@computedProperty(options?: RenderOptions & { dependencies?: string[] })
```

**RenderOptions:**
- `strategy?: 'virtual' | 'incremental' | 'full'` - Render strategy
- `cache?: boolean` - Enable caching
- `ssr?: boolean` - Server-side rendering
- `deep?: boolean` - Deep rendering
- `immediate?: boolean` - Immediate rendering

### Plugin Integration

```typescript
@plugin(pluginName: string, options?: PluginOptions)
@service(serviceName: string, options?: PluginOptions)
```

**PluginOptions:**
- `version?: string` - Plugin version requirement
- `lazy?: boolean` - Lazy plugin loading

## Context API

```typescript
const SwissContext = {
  create<T>(defaultValue: T): SwissContext<T>
  provide<T>(context: SwissContext<T>, value: T): void
  inject<T>(context: SwissContext<T>): T
}
```

## Error Boundaries

```typescript
class ErrorBoundary extends SwissComponent<ErrorBoundaryProps, ErrorBoundaryState> {
  // Error boundary implementation
}

function withErrorBoundary<P, S>(component: SwissComponent<P, S>): SwissComponent<P, S>
function useErrorBoundary<P, S>(): void
```

## Component Registry

```typescript
class ComponentRegistry {
  static register(name: string, component: ComponentConstructor): void
  static get(name: string): ComponentConstructor | undefined
  static list(): string[]
}
```

## Event System

```typescript
class SwissEvent<T = unknown> {
  type: string
  target: EventTarget
  data?: T
  timestamp: number
}

const SwissEvents = {
  emit(event: SwissEvent): void
  on(eventType: string, callback: EventCallback): () => void
  off(eventType: string, callback: EventCallback): void
}
```

## Types

```typescript
interface SwissComponentOptions {
  selector?: string
  template?: string
  styles?: string | object
  capabilities?: string[]
}

interface BaseComponentProps {
  [key: string]: unknown
}

interface BaseComponentState {
  [key: string]: unknown
}

interface ComponentHook {
  phase: LifecyclePhase
  callback: (context: unknown) => void | Promise<void>
}

type ComponentConstructor = new (...args: unknown[]) => unknown
type LifecyclePhase = 'mount' | 'update' | 'destroy' | 'error'
```
