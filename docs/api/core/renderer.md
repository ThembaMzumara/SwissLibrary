<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

---
title: Renderer API
---

# Renderer API

## Hydration

### hydrate()

Hydrates server-rendered HTML with client-side interactivity.

```typescript
function hydrate(
  component: ComponentConstructor,
  container: HTMLElement,
  props?: Record<string, unknown>
): Promise<void>
```

**Example:**
```typescript
import { hydrate } from '@swissjs/core'
import { AppComponent } from './app'

const container = document.getElementById('app')
await hydrate(AppComponent, container, { initialData: 'value' })
```

## Server-Side Rendering

### renderToString()

Renders a component to an HTML string.

```typescript
function renderToString(
  component: ComponentConstructor,
  props?: Record<string, unknown>
): Promise<string>
```

**Example:**
```typescript
import { renderToString } from '@swissjs/core'
import { AppComponent } from './app'

const html = await renderToString(AppComponent, { title: 'My App' })
console.log(html) // '<div class="app"><h1>My App</h1></div>'
```

### renderToStaticMarkup()

Renders a component to static HTML (no event listeners).

```typescript
function renderToStaticMarkup(
  component: ComponentConstructor,
  props?: Record<string, unknown>
): Promise<string>
```

## Client-Side Rendering

### render()

Renders a component into a container element.

```typescript
function render(
  component: ComponentConstructor,
  container: HTMLElement,
  props?: Record<string, unknown>
): void
```

**Example:**
```typescript
import { render } from '@swissjs/core'
import { AppComponent } from './app'

const container = document.getElementById('app')
render(AppComponent, container, { message: 'Hello World' })
```

### unmount()

Unmounts a component from a container.

```typescript
function unmount(container: HTMLElement): void
```

**Example:**
```typescript
const container = document.getElementById('app')
unmount(container)
```

## Islands Architecture

### markIsland()

Marks a component as an island for partial hydration.

```typescript
function markIsland(component: ComponentConstructor): void
```

**Example:**
```typescript
import { markIsland } from '@swissjs/core'

@markIsland
class InteractiveWidget extends SwissComponent {
  // This component will be hydrated as an island
}
```

### hydrateIslands()

Hydrates only marked islands in the DOM.

```typescript
function hydrateIslands(container?: HTMLElement): Promise<void>
```

**Example:**
```typescript
// Hydrate all islands in the document
await hydrateIslands()

// Hydrate islands in specific container
const container = document.getElementById('app')
await hydrateIslands(container)
```

## Rendering Options

### RenderOptions

```typescript
interface RenderOptions {
  ssr?: boolean
  hydrate?: boolean
  islands?: boolean
  streaming?: boolean
}
```

### renderWithOptions()

Renders with custom options.

```typescript
function renderWithOptions(
  component: ComponentConstructor,
  container: HTMLElement,
  props: Record<string, unknown>,
  options: RenderOptions
): Promise<void>
```

## Streaming Rendering

### renderToStream()

Renders a component to a Node.js stream.

```typescript
function renderToStream(
  component: ComponentConstructor,
  props?: Record<string, unknown>
): Readable
```

**Example:**
```typescript
import { renderToStream } from '@swissjs/core'
import { AppComponent } from './app'

const stream = renderToStream(AppComponent, { data: 'value' })
stream.pipe(process.stdout)
```

### renderToWebStream()

Renders a component to a Web Stream.

```typescript
function renderToWebStream(
  component: ComponentConstructor,
  props?: Record<string, unknown>
): ReadableStream
```

## Performance Optimization

### batchRender()

Batches multiple render operations.

```typescript
function batchRender(callback: () => void): void
```

**Example:**
```typescript
import { batchRender } from '@swissjs/core'

batchRender(() => {
  render(ComponentA, containerA)
  render(ComponentB, containerB)
  render(ComponentC, containerC)
}) // Only one DOM update occurs
```

### deferRender()

Defers rendering to next frame.

```typescript
function deferRender(callback: () => void): void
```

**Example:**
```typescript
deferRender(() => {
  render(HeavyComponent, container)
})
```

## Error Handling

### RenderError

```.
```typescriptNodetypescript
interface RenderError extends Error {
  component: ComponentConstructor
  phase: 'render' | 'hydrate' | 'mount'
  originalError: Error
}
```

### Error Boundaries in Rendering

```typescript
function renderWithErrorBoundary(
  component: ComponentConstructor,
  container: HTMLElement,
  props?: Record<string, unknown>,
  fallback?: ComponentConstructor
): Promise<void>
```

## Development Tools

### debugRender()

Enables debug rendering with additional information.

```typescript
function debugRender(enabled: boolean): void
```

**Example:**
```typescript
debugRender(true) // Enable debug mode
render(AppComponent, container)
debugRender(false) // Disable debug mode
```

### getRenderStats()

Gets rendering performance statistics.

```typescript
function getRenderStats(): RenderStats
```

**Example:**
```typescript
const stats = getRenderStats()
console.log('Render time:', stats.renderTime)
console.log('Components rendered:', stats.componentCount)
```

## Types

### RenderStats

```typescript
interface RenderStats {
  renderTime: number
  componentCount: number
  nodeCount: number
  memoryUsage: number
  timestamp: number
}
```

### HydrationResult

```typescript
interface HydrationResult {
  success: boolean
  hydratedNodes: number
  skippedNodes: number
  errors: RenderError[]
}
```
