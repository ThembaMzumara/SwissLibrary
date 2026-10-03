<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

---
title: Devtools API
---

# Devtools API

## Devtools Bridge

### DevtoolsBridge Interface

```typescript
interface DevtoolsBridge {
  // Component lifecycle
  componentMounted(payload: ComponentNodePayload): void
  componentUpdated(payload: ComponentUpdatePayload): void
  componentUnmounted(id: ComponentId): void
  
  // Capability tracking
  capabilityRequested(payload: { componentId: ComponentId; capability: string }): void
  capabilityGranted(payload: { componentId: ComponentId; capability: string }): void
  capabilityDenied(payload: { componentId: ComponentId; capability: string; reason: string }): void
  
  // Performance monitoring
  performanceMark(payload: { name: string; timestamp: number; data?: unknown }): void
  performanceMeasure(payload: { name: string; start: number; end: number; data?: unknown }): void
  
  // Error tracking
  errorCaptured(payload: { componentId: ComponentId; error: Error; stack?: string }): void
  
  // Graph operations
  getGraphSnapshot(): GraphSnapshot
  subscribeToGraph(callback: (snapshot: GraphSnapshot) => void): () => void
  
  // Telemetry
  telemetry(event: DevtoolsEvent): void
}
```

## Bridge Management

### getDevtoolsBridge()

Gets the current devtools bridge instance.

```typescript
function getDevtoolsBridge(): DevtoolsBridge
```

### setDevtoolsBridge()

Sets a custom devtools bridge implementation.

```typescript
function setDevtoolsBridge(impl: DevtoolsBridge): void
```

### isDevtoolsEnabled()

Checks if devtools are enabled.

```typescript
function isDevtoolsEnabled(): boolean
```

### isTelemetryEnabled()

Checks if telemetry is enabled.

```typescript
function isTelemetryEnabled(): boolean
```

## In-Memory Bridge

### InMemoryBridge Class

Default in-memory implementation of DevtoolsBridge for testing and development.

```typescript
class InMemoryBridge implements DevtoolsBridge {
  private components = new Map<ComponentId, ComponentNodePayload>()
  private events: DevtoolsEvent[] = []
  private subscribers: ((snapshot: GraphSnapshot) => void)[] = []
  
  // Implementation of all DevtoolsBridge methods
  componentMounted(payload: ComponentNodePayload): void
  componentUpdated(payload: ComponentUpdatePayload): void
  componentUnmounted(id: ComponentId): void
  // ... other methods
}
```

## Payload Types

### ComponentNodePayload

```typescript
interface ComponentNodePayload {
  id: ComponentId
  name: string
  parentId: ComponentId | null
  provides: CapabilityName[]
  consumes: CapabilityName[]
}
```

### ComponentUpdatePayload

```typescript
interface ComponentUpdatePayload {
  id: ComponentId
  changes: {
    props?: Record<string, unknown>
    state?: Record<string, unknown>
    capabilities?: string[]
  }
  timestamp: number
}
```

### GraphSnapshot

```typescript
interface GraphSnapshot {
  components: ComponentNodePayload[]
  edges: Array<{
    from: ComponentId
    to: ComponentId
    type: 'parent' | 'capability' | 'event'
  }>
  timestamp: number
}
```

## Types

### ComponentId

```typescript
type ComponentId = string
```

### CapabilityName

```typescript
type CapabilityName = string
```

### DevtoolsEvent

```typescript
interface DevtoolsEvent {
  category: DevtoolsEventCategory
  name: string
  timestamp: number
  data?: unknown
  componentId?: ComponentId
}
```

### DevtoolsEventCategory

```typescript
type DevtoolsEventCategory = 'perf' | 'error' | 'capability' | 'runtime'
```

## Usage Examples

### Custom Bridge Implementation

```typescript
const customBridge: DevtoolsBridge = {
  componentMounted(payload: ComponentNodePayload) {
    console.log('Component mounted:', payload)
    // Send to external devtools
    sendToDevtools('component:mounted', payload)
  },
  
  componentUpdated(payload: ComponentUpdatePayload) {
    console.log('Component updated:', payload)
    sendToDevtools('component:updated', payload)
  },
  
  // ... implement other methods
}

setDevtoolsBridge(customBridge)
```

### Telemetry Collection

```typescript
// Enable telemetry
globalThis.SWISS_TELEMETRY = true

// Custom telemetry events
const bridge = getDevtoolsBridge()
bridge.telemetry({
  category: 'perf',
  name: 'component-render',
  timestamp: Date.now(),
  data: { duration: 5.2 },
  componentId: 'comp-123'
})
```

### Graph Subscription

```typescript
const bridge = getDevtoolsBridge()

// Subscribe to graph changes
const unsubscribe = bridge.subscribeToGraph((snapshot) => {
  console.log('Graph updated:', snapshot.components.length, 'components')
})

// Later unsubscribe
unsubscribe()
```

## Environment Configuration

### Enable Devtools

```typescript
// Via environment variable
process.env.SWISS_DEVTOOLS = '1'

// Via global flag
globalThis.SWISS_DEVTOOLS = true

// Via configuration
const app = new SwissFramework({
  devtools: true
})
```

### Enable Telemetry

```typescript
// Via environment variable
process.env.SWISS_TELEMETRY = '1'

// Via global flag
globalThis.SWISS_TELEMETRY = true
```

## Integration with IDE Extensions

### VS Code Extension

```typescript
// VS Code extension can connect to devtools bridge
const vscode = require('vscode')

function activate(context) {
  const bridge = getDevtoolsBridge()
  
  // Subscribe to component updates
  bridge.subscribeToGraph((snapshot) => {
    // Update VS Code tree view
    updateComponentTree(snapshot)
  })
}
```

### Chrome DevTools

```typescript
// Chrome DevTools panel integration
const panel = chrome.devtools.panels.create('SwissJS', '', 'panel.html')

panel.onShown.addListener(() => {
  const bridge = getDevtoolsBridge()
  const snapshot = bridge.getGraphSnapshot()
  renderComponentTree(snapshot)
})
```
