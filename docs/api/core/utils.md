<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

---
title: Utils API
---

# Utils API

## HTML Utilities

### html()

Creates HTML template literals with automatic escaping.

```typescript
function html(strings: TemplateStringsArray, ...values: unknown[]): string
```

**Example:**
```typescript
import { html } from '@swissjs/core'

const name = 'World'
const count = 42

const template = html`<div>Hello ${name}! Count: ${count}</div>`
console.log(template) // '<div>Hello World! Count: 42</div>'
```

### escapeHTML()

Escapes HTML special characters.

```typescript
function escapeHTML(str: string): string
```

**Example:**
```typescript
import { escapeHTML } from '@swissjs/core'

const unsafe = '<script>alert("xss")</script>'
const safe = escapeHTML(unsafe)
console.log(safe) // '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
```

### unsafe()

Marks HTML content as safe (bypasses escaping).

```typescript
function unsafe(html: string): string
```

**Example:**
```typescript
import { html, unsafe } from '@swissjs/core'

const trustedHTML = '<div>Trusted content</div>'
const template = html`<div>${unsafe(trustedHTML)}</div>`
```

## CSS Utilities

### css()

Creates CSS template literals with automatic vendor prefixing.

```typescript
function css(strings: TemplateStringsArray, ...values: unknown[]): string
```

**Example:**
```typescript
import { css } from '@swissjs/core'

const primaryColor = '#007bff'
const padding = '1rem'

const styles = css`
  .button {
    background-color: ${primaryColor};
    padding: ${padding};
    border-radius: 4px;
    transition: all 0.3s ease;
  }
`
```

### classNames()

Combines CSS class names conditionally.

```typescript
function classNames(...classes: (string | undefined | null | false)[]): string
```

**Example:**
```typescript
import { classNames } from '@swissjs/core'

const isActive = true
const isDisabled = false

const className = classNames(
  'btn',
  isActive && 'btn-active',
  isDisabled && 'btn-disabled'
)
console.log(className) // 'btn btn-active'
```

## Object Utilities

### merge()

Deep merges objects.

```typescript
function merge<T extends Record<string, unknown>>(...objects: Partial<T>[]): T
```

**Example:**
```typescript
import { merge } from '@swissjs/core'

const defaults = { theme: 'light', language: 'en' }
const userPrefs = { language: 'fr', fontSize: 16 }

const merged = merge(defaults, userPrefs)
console.log(merged) // { theme: 'light', language: 'fr', fontSize: 16 }
```

### clone()

Deep clones an object.

```typescript
function clone<T>(obj: T): T
```

**Example:**
```typescript
import { clone } from '@swissjs/core'

const original = { data: { value: 42 } }
const copy = clone(original)
copy.data.value = 100

console.log(original.data.value) // 42 (unchanged)
```

### isEqual()

Deep equality check.

```typescript
function isEqual(a: unknown, b: unknown): boolean
```

**Example:**
```typescript
import { isEqual } from '@swissjs/core'

const obj1 = { a: 1, b: { c: 2 } }
const obj2 = { a: 1, b: { c: 2 } }
const obj3 = { a: 1, b: { c: 3 } }

console.log(isEqual(obj1, obj2)) // true
console.log(isEqual(obj1, obj3)) // false
```

## Function Utilities

### debounce()

Debounces a function call.

```typescript
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
): T
```

**Example:**
```typescript
import { debounce } from '@swissjs/core'

const debouncedSearch = debounce((query: string) => {
  console.log('Searching for:', query)
}, 300)

debouncedSearch('hello')
debouncedSearch('hello world') // Only this one will execute
```

### throttle()

Throttles a function call.

```typescript
function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T
```

**Example:**
```typescript
import { throttle } from '@swissjs/core'

const throttledScroll = throttle(() => {
  console.log('Scroll event')
}, 100)

window.addEventListener('scroll', throttledScroll)
```

### once()

Ensures a function is called only once.

```typescript
function once<T extends (...args: any[]) => any>(func: T): T
```

**Example:**
```typescript
import { once } from '@swissjs/core'

const initializeOnce = once(() => {
  console.log('Initialized!')
})

initializeOnce() // Logs "Initialized!"
initializeOnce() // Does nothing
```

## Array Utilities

### unique()

Removes duplicates from an array.

```typescript
function unique<T>(array: T[]): T[]
```

**Example:**
```typescript
import { unique } from '@swissjs/core'

const items = [1, 2, 2, 3, 1, 4]
const uniqueItems = unique(items)
console.log(uniqueItems) // [1, 2, 3, 4]
```

### groupBy()

Groups array items by a key.

```typescript
function groupBy<T, K extends string | number>(
  array: T[],
  keyFn: (item: T) => K
): Record<K, T[]>
```

**Example:**
```typescript
import { groupBy } from '@swissjs/core'

const users = [
  { name: 'Alice', role: 'admin' },
  { name: 'Bob', role: 'user' },
  { name: 'Charlie', role: 'admin' }
]

const grouped = groupBy(users, user => user.role)
console.log(grouped)
// { admin: [{ name: 'Alice', role: 'admin' }, { name: 'Charlie', role: 'admin' }],
//   user: [{ name: 'Bob', role: 'user' }] }
```

## String Utilities

### camelCase()

Converts string to camelCase.

```typescript
function camelCase(str: string): string
```

**Example:**
```typescript
import { camelCase } from '@swissjs/core'

console.log(camelCase('hello-world')) // 'helloWorld'
console.log(camelCase('Hello World')) // 'helloWorld'
```

### kebabCase()

Converts string to kebab-case.

```typescript
function kebabCase(str: string): string
```

**Example:**
```typescript
import { kebabCase } from '@swissjs/core'

console.log(kebabCase('helloWorld')) // 'hello-world'
console.log(kebabCase('Hello World')) // 'hello-world'
```

## Type Utilities

### isObject()

Checks if value is an object.

```typescript
function isObject(value: unknown): value is Record<string, unknown>
```

### isArray()

Checks if value is an array.

```typescript
function isArray(value: unknown): value is unknown[]
```

### isFunction()

Checks if value is a function.

```typescript
function isFunction(value: unknown): value is Function
```

### isString()

Checks if value is a string.

```typescript
function isString(value: unknown): value is string
```

## Performance Utilities

### performance()

Performance measurement utilities.

```typescript
interface PerformanceUtils {
  mark(name: string): void
  measure(name: string, startMark: string, endMark: string): void
  getEntriesByName(name: string): PerformanceEntry[]
  clearMarks(name?: string): void
  clearMeasures(name?: string): void
}

const performance: PerformanceUtils
```

**Example:**
```typescript
import { performance } from '@swissjs/core'

performance.mark('operation-start')
// ... do some work
performance.mark('operation-end')
performance.measure('operation', 'operation-start', 'operation-end')

const measures = performance.getEntriesByName('operation')
console.log('Duration:', measures[0].duration)
```
