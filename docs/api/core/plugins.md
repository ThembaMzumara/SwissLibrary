<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

---
title: Plugins API
---

# Plugins API

## Plugin Manager

### PluginManager Class

```typescript
class PluginManager {
  static register(plugin: Plugin): void
  static unregister(pluginName: string): void
  static get(pluginName: string): Plugin | undefined
  static list(): Plugin[]
  static has(pluginName: string): boolean
}
```

## Plugin Interface

### Plugin

```typescript
interface Plugin {
  name: string
  version?: string
  description?: string
  capabilities?: string[]
  requiredCapabilities?: string[]
  
  install(context: PluginContext): void | Promise<void>
  uninstall?(context: PluginContext): void | Promise<void>
}
```

**Example:**
```typescript
const analyticsPlugin: Plugin = {
  name: 'analytics',
  version: '1.0.0',
  capabilities: [CAPABILITIES.NETWORK_REQUESTS],
  
  install(context: PluginContext) {
    context.registerDirective('track', this.trackDirective.bind(this))
  },
  
  trackDirective(element: Element, binding: DirectiveBinding) {
    console.log(`Tracking: ${binding.value}`)
  }
}
```

### PluginContext

```typescript
interface PluginContext extends BasePluginContext {
  hooks: HookRegistrySurface
  registerHook: (hook: HookRegistration) => void
  
  // Plugin registration
  registerDirective(name: string, directive: DirectiveHandler): void
  registerService(name: string, service: unknown): void
  
  // Capability management
  checkCapabilities(capabilities: string[]): boolean
  requestCapability(capability: string): boolean
  
  // Component integration
  getComponent(selector: string): ComponentConstructor | undefined
  registerComponent(selector: string, component: ComponentConstructor): void
}
```

### DirectiveContext

```typescript
interface DirectiveContext extends BaseDirectiveContext {
  component: SwissComponent
}
```

### DirectiveBinding

```typescript
interface DirectiveBinding {
  value: unknown
  oldValue?: unknown
  expression: string
  arg?: string
  modifiers?: string[]
}
```

## Directive System

### Directive Handler

```typescript
type DirectiveHandler = (
  element: Element,
  binding: DirectiveBinding,
  context: DirectiveContext
) => void | (() => void)
```

### Directive Lifecycle

```typescript
interface DirectiveLifecycle {
  mounted?: DirectiveHandler
  updated?: DirectiveHandler
  unmounted?: DirectiveHandler
}
```

**Example:**
```typescript
const tooltipDirective: DirectiveLifecycle = {
  mounted(element: Element, binding: DirectiveBinding) {
    const tooltip = document.createElement('div')
    tooltip.className = 'tooltip'
    tooltip.textContent = String(binding.value)
    document.body.appendChild(tooltip)
    
    return () => {
      tooltip.remove()
    }
  }
}
```

## Capabilities

### Built-in Capabilities

```typescript
const CAPABILITIES = {
  ACCESS_USER_DATA: 'access:user-data',
  MODIFY_DOM: 'modify:dom',
  NETWORK_REQUESTS: 'make:network-requests',
  LOCAL_STORAGE: 'access:local-storage',
  SESSION_STORAGE: 'access:session-storage',
  DIRECTIVE: 'directive:*'
} as const
```

### Capability Type

```typescript
type Capability = typeof CAPABILITIES[keyof typeof CAPABILITIES]
```

### Capability Management

```typescript
function registerDirectiveCapability(directive: string, capability: string): void
function getDirectiveCapability(directive: string): string | undefined
```

## Plugin Registration

### Registering Plugins

```typescript
// Direct registration
PluginManager.register(analyticsPlugin)

// During framework initialization
const app = new SwissFramework({
  plugins: [analyticsPlugin, routerPlugin]
})
```

### Plugin Lifecycle

```typescript
// Plugin installation
await plugin.install(context)

// Plugin cleanup
await plugin.uninstall?.(context)
```

## Hook Integration

### Plugin Hooks

```typescript
interface HookRegistration {
  name: string
  phase: string
  callback: (context: unknown) => void | Promise<void>
  priority?: number
}
```

**Example:**
```typescript
const lifecyclePlugin: Plugin = {
  name: 'lifecycle-hooks',
  version: '1.0.0',
  
  install(context: PluginContext) {
    context.registerHook({
      name: 'component:mount',
      phase: 'mount',
      callback: (component) => {
        console.log('Component mounted:', component.constructor.name)
      }
    })
  }
}
```

## Plugin Types

### Base Types

```typescript
interface BasePlugin {
  name: string
  version?: string
  description?: string
  capabilities?: string[]
  requiredCapabilities?: string[]
  install(context: BasePluginContext): void | Promise<void>
  uninstall?(context: BasePluginContext): void | Promise<void>
}

interface BasePluginContext {
  framework: SwissFramework
  capabilities: Set<string>
  services: Map<string, unknown>
}

interface BaseDirectiveContext {
  element: Element
  binding: DirectiveBinding
  expression: string
}
```

### Advanced Types

```typescript
interface PluginOptions {
  version?: string
  lazy?: boolean
  singleton?: boolean
  dependencies?: string[]
}

interface PluginMetadata {
  name: string
  version: string
  description?: string
  author?: string
  license?: string
  repository?: string
}
```

## Best Practices

### Plugin Structure

```typescript
const goodPlugin: Plugin = {
  name: 'my-plugin',
  version: '1.0.0',
  capabilities: [CAPABILITIES.MODIFY_DOM],
  
  install(context: PluginContext) {
    // Check required capabilities
    if (!context.checkCapabilities(this.requiredCapabilities || [])) {
      throw new Error('Required capabilities not available')
    }
    
    // Register directives
    context.registerDirective('my-directive', this.handleDirective.bind(this))
    
    // Register services
    context.registerService('my-service', new MyService())
  },
  
  handleDirective(element: Element, binding: DirectiveBinding) {
    // Directive implementation
  }
}
```

### Error Handling

```typescript
const robustPlugin: Plugin = {
  name: 'robust-plugin',
  version: '1.0.0',
  
  async install(context: PluginContext) {
    try {
      await this.setupServices(context)
      await this.registerDirectives(context)
    } catch (error) {
      console.error(`Plugin ${this.name} installation failed:`, error)
      throw error
    }
  },
  
  async uninstall(context: PluginContext) {
    try {
      await this.cleanupServices(context)
      await this.unregisterDirectives(context)
    } catch (error) {
      console.error(`Plugin ${this.name} uninstallation failed:`, error)
    }
  }
}
```
