<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

---
title: Reactivity API
---

# Reactivity API

## Signals

### Signal Class

```typescript
class Signal<T> {
  constructor(value: T)
  
  get value(): T
  set value(newValue: T)
  
  peek(): T
  subscribe(callback: (value: T) => void): () => void
}
```

### signal()

Creates a reactive signal.

```typescript
function signal<T>(value: T): Signal<T>
```

**Example:**
```typescript
const count = signal(0)
console.log(count.value) // 0
count.value = 1
```

### ComputedSignal Class

```typescript
class ComputedSignal<T> extends Signal<T> {
  constructor(computation: () => T, dependencies?: Signal<unknown>[])
  
  get value(): T
  peek(): T
}
```

### computed()

Creates a computed signal that derives its value from other signals.

```typescript
function computed<T>(fn: () => T): ComputedSignal<T>
```

**Example:**
```typescript
const count = signal(0)
const doubled = computed(() => count.value * 2)
console.log(doubled.value) // 0
count.value = 5
console.log(doubled.value) // 10
```

## Effects

### Effect Class

```typescript
class Effect {
  constructor(fn: () => void | (() => void))
  
  run(): void
  stop(): void
}
```

### effect()

Creates an effect that runs when its dependencies change.

```typescript
function effect(fn: () => void | (() => void)): Effect
```

**Example:**
```typescript
const count = signal(0)

effect(() => {
  console.log(`Count is: ${count.value}`)
})

count.value = 1 // Logs: "Count is: 1"
```

### onCleanup()

Registers a cleanup function for the current effect.

```typescript
function onCleanup(fn: () => void): void
```

**Example:**
```typescript
effect(() => {
  const timer = setInterval(() => console.log('tick'), 1000)
  
  onCleanup(() => {
    clearInterval(timer)
  })
})
```

### trackEffect()

Manually tracks dependencies in an effect.

```typescript
function trackEffect<T>(fn: () => T): T
```

## Batch Updates

### batchUpdates()

Groups multiple signal updates into a single batch.

```typescript
function batchUpdates(fn: () => void): void
```

**Example:**
```typescript
const count1 = signal(0)
const count2 = signal(0)

batchUpdates(() => {
  count1.value = 10
  count2.value = 20
}) // Only one re-render occurs
```

### batchedSignal()

Creates a signal that only updates in batches.

```typescript
function batchedSignal<T>(value: T): Signal<T>
```

## Stores

### createStore()

Creates a reactive store with signals and computed values.

```typescript
function createStore<T extends Record<string, unknown>>(initial: T): T & {
  [K in keyof T]: T[K] extends Signal ? T[K] : Signal<T[K]>
}
```

**Example:**
```typescript
const store = createStore({
  count: 0,
  name: 'Swiss'
})

store.count.value = 1
console.log(store.name.value) // 'Swiss'
```

## Reactive Objects

### reactive()

Creates a reactive object that notifies listeners when properties change.

```typescript
function reactive<T extends object>(target: T): T
```

### watch()

Watches a reactive object for changes.

```typescript
function watch<T extends object>(
  obj: T,
  callback: (changes: { key: keyof T; newValue: unknown; oldValue: unknown }[]) => void
): () => void
```

### watchAll()

Watches all properties of a reactive object.

```typescript
function watchAll<T extends object>(
  obj: T,
  callback: (obj: T) => void
): () => void
```

### computedLegacy()

Legacy computed function for reactive objects.

```typescript
function computedLegacy<T>(fn: () => T): { value: T }
```

## Context API

### createContext()

Creates a reactive context for dependency injection.

```typescript
function createContext<T>(defaultValue: T): SwissContext<T>
```

## Integration

### Integration utilities for connecting reactivity with other systems.

```typescript
// Export integration functions
export * from './integration.js'
```

## Types

```typescript
interface Listener<T = unknown> {
  (value: T): void
}

interface PropertyKey extends string | number | symbol {}

interface ReactiveObject {
  __listeners: Map<PropertyKey, Set<Listener>>
}

type EffectDisposer = () => void

interface StoreObject extends Record<string, unknown> {
  [key: string]: Signal<unknown>
}

interface StoreUpdate<T> {
  [K in keyof T]?: T[K]
}
```
