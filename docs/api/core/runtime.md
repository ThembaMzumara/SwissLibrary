<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

---
title: Runtime API
---

# Runtime API

## Runtime Service

### runtimeService

Main runtime service for managing application lifecycle.

```typescript
interface RuntimeService {
  // Application lifecycle
  start(): Promise<void>
  stop(): Promise<void>
  restart(): Promise<void>
  
  // Component management
  registerComponent(name: string, component: ComponentConstructor): void
  getComponent(name: string): ComponentConstructor | undefined
  
  // Plugin management
  loadPlugin(plugin: Plugin): Promise<void>
  unloadPlugin(name: string): Promise<void>
  
  // State management
  getState(): RuntimeState
  setState(state: Partial<RuntimeState>): void
}
```

### Runtime State

```typescript
interface RuntimeState {
  started: boolean
  components: Map<string, ComponentConstructor>
  plugins: Map<string, Plugin>
  config: RuntimeConfig
}
```

### Runtime Config

```typescript
interface RuntimeConfig {
  devtools?: boolean
  telemetry?: boolean
  logging?: LogLevel
  plugins?: Plugin[]
}
```

## Development Server

### DevServerService Class

Development server for hot reloading and live updates.

```typescript
class DevServerService {
  constructor(options?: DevServerOptions)
  
  // Server lifecycle
  start(): Promise<void>
  stop(): Promise<void>
  restart(): Promise<void>
  
  // File watching
  watch(patterns: string[]): void
  unwatch(patterns: string[]): void
  
  // Hot module replacement
  hotReload(filePath: string): void
  fullReload(): void
  
  // WebSocket communication
  broadcast(type: string, data: unknown): void
}
```

### DevServerOptions

```typescript
interface DevServerOptions {
  port?: number
  host?: string
  open?: boolean
  hmr?: boolean
  watch?: string[]
  ignore?: string[]
  proxy?: Record<string, string>
}
```

## Usage Examples

### Basic Runtime Usage

```typescript
import { runtimeService } from '@swissjs/core'

// Start the runtime
await runtimeService.start()

// Register a component
runtimeService.registerComponent('app-counter', CounterComponent)

// Load a plugin
await runtimeService.loadPlugin(analyticsPlugin)

// Get runtime state
const state = runtimeService.getState()
console.log('Components:', state.components.size)
```

### Development Server

```typescript
import { DevServerService } from '@swissjs/core'

const devServer = new DevServerService({
  port: 3000,
  open: true,
  hmr: true,
  watch: ['src/**/*.ts', 'src/**/*.ui'],
  ignore: ['node_modules/**']
})

// Start development server
await devServer.start()

// Watch for file changes
devServer.watch(['src/**/*'])

// Handle hot reload
devServer.on('file-change', (filePath) => {
  if (filePath.endsWith('.ui')) {
    devServer.hotReload(filePath)
  } else {
    devServer.fullReload()
  }
})
```

### Custom Runtime Service

```typescript
class CustomRuntimeService implements RuntimeService {
  private state: RuntimeState = {
    started: false,
    components: new Map(),
    plugins: new Map(),
    config: { devtools: false, telemetry: false }
  }
  
  async start(): Promise<void> {
    console.log('Starting custom runtime...')
    this.state.started = true
    // Custom initialization logic
  }
  
  async stop(): Promise<void> {
    console.log('Stopping custom runtime...')
    this.state.started = false
    // Custom cleanup logic
  }
  
  // ... implement other methods
}

// Use custom runtime
const customRuntime = new CustomRuntimeService()
await customRuntime.start()
```

## Environment Integration

### Browser Runtime

```typescript
// Browser-specific runtime configuration
const browserConfig: RuntimeConfig = {
  devtools: process.env.NODE_ENV === 'development',
  telemetry: false,
  logging: 'info'
}

runtimeService.setState({ config: browserConfig })
await runtimeService.start()
```

### Server Runtime

```typescript
// Server-specific runtime configuration
const serverConfig: RuntimeConfig = {
  devtools: false,
  telemetry: true,
  logging: 'warn'
}

runtimeService.setState({ config: serverConfig })
await runtimeService.start()
```

## Plugin Runtime Integration

```typescript
// Plugin that extends runtime
const runtimePlugin: Plugin = {
  name: 'runtime-extensions',
  version: '1.0.0',
  
  install(context: PluginContext) {
    // Extend runtime service
    const originalStart = runtimeService.start.bind(runtimeService)
    
    runtimeService.start = async () => {
      console.log('Extended runtime starting...')
      await originalStart()
      console.log('Extended runtime started!')
    }
  }
}

await runtimeService.loadPlugin(runtimePlugin)
```

## Performance Monitoring

```typescript
// Runtime performance hooks
runtimeService.on('start', () => {
  console.time('runtime-start')
})

runtimeService.on('started', () => {
  console.timeEnd('runtime-start')
})

// Component performance
runtimeService.on('component-register', (name) => {
  console.log(`Component registered: ${name}`)
})
```
