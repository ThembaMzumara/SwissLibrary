<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

---
title: Virtual DOM API
---

# Virtual DOM API

## VNode Types

### VNode Union Type

```typescript
type VNode = string | VElement | ComponentVNode
```

### VElement Interface

```typescript
interface VElement extends VNodeBase {
  type: string
  props: Record<string, unknown>
  children: VNode[]
}
```

### ComponentVNode Interface

```typescript
interface ComponentVNode extends VNodeBase {
  type: ComponentType
  props: Record<string, unknown>
  children?: VNode[]
}
```

### VNodeBase Interface

```typescript
interface VNodeBase {
  key?: string | number
  ref?: { current: Element | null }
}
```

## Component Types

```typescript
type ComponentType = (
  new (props: Record<string, unknown>) => SwissComponent
) | ((props: Record<string, unknown>) => VNode)
```

## VDOM Creation

### createVNode()

Creates a virtual DOM node.

```typescript
function createVNode(
  type: string | ComponentType,
  props?: Record<string, unknown>,
  ...children: VNode[]
): VNode
```

**Overloads:**
```typescript
// Element creation
function createVNode(type: string, props?: Record<string, unknown>, ...children: VNode[]): VElement

// Component creation  
function createVNode(type: ComponentType, props?: Record<string, unknown>, ...children: VNode[]): ComponentVNode

// Text node
function createVNode(text: string): string
```

**Example:**
```typescript
// Element
const div = createVNode('div', { class: 'container' }, 'Hello World')

// Component
const component = createVNode(MyComponent, { prop: 'value' })

// Nested
const app = createVNode('div', { id: 'app' },
  createVNode('h1', {}, 'Title'),
  createVNode('p', {}, 'Content')
)
```

### createElement

Alias for createVNode for JSX compatibility.

```typescript
const createElement = createVNode
```

### Fragment

Symbol for fragment components.

```typescript
const Fragment = Symbol('Fragment')
```

**Example:**
```typescript
const fragment = createVNode(Fragment, {},
  createVNode('div', {}, 'First'),
  createVNode('span', {}, 'Second')
)
```

## JSX Runtime

### jsx()

JSX transform function.

```typescript
function jsx(
  type: string | ComponentType,
  props: Record<string, unknown>,
  key?: string | number
): VNode
```

### jsxs()

JSX transform function for static children.

```typescript
function jsxs(
  type: string | ComponentType,
  props: Record<string, unknown>,
  key?: string | number
): VNode
```

## Diffing and Patching

### patch()

Updates DOM to match new VNode tree.

```typescript
function patch(
  parent: HTMLElement,
  newNode: VNode,
  oldNode?: VNode,
  index?: number
): void
```

**Example:**
```typescript
const container = document.getElementById('app')
const newVNode = createVNode('div', {}, 'New content')
patch(container, newVNode, oldVNode)
```

### createDOMElement()

Creates a DOM element from VNode.

```typescript
function createDOMElement(vnode: VNode): HTMLElement | Text
```

**Example:**
```typescript
const vnode = createVNode('div', { class: 'hello' }, 'Hello')
const element = createDOMElement(vnode)
document.body.appendChild(element)
```

## Void Elements

### VOID_ELEMENTS

List of HTML void elements that don't need closing tags.

```typescript
const VOID_ELEMENTS = [
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img',
  'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'
]
```

## Server-Side Rendering

### renderToString()

Renders VNode to HTML string.

```typescript
function renderToString(vnode: VNode): string
```

**Example:**
```typescript
const vnode = createVNode('div', { class: 'app' }, 'Hello World')
const html = renderToString(vnode)
console.log(html) // '<div class="app">Hello World</div>'
```

## Types

### Component Constructor

```typescript
type ComponentConstructor = new (...args: unknown[]) => unknown
```

### Component Import

```typescript
type ComponentImport = Promise<ComponentConstructor>
```

## Best Practices

### Efficient VNode Creation

```typescript
// Good: Reusable components
const Button = ({ children, onClick }) => 
  createVNode('button', { onClick }, children)

// Good: Fragment for multiple children
const Card = ({ title, content }) => 
  createVNode(Fragment, {},
    createVNode('h2', {}, title),
    createVNode('p', {}, content)
  )

// Avoid: Deep nesting without fragments
const BadCard = ({ title, content }) =>
  createVNode('div', {},
    createVNode('div', {},
      createVNode('h2', {}, title),
      createVNode('p', {}, content)
    )
  )
```

### Keys for Lists

```typescript
const List = ({ items }) => 
  createVNode('ul', {},
    ...items.map(item =>
      createVNode('li', { key: item.id }, item.text)
    )
  )
```

### Refs for DOM Access

```typescript
const InputWithRef = () => {
  const ref = { current: null }
  
  const focus = () => {
    ref.current?.focus()
  }
  
  return createVNode(Fragment, {},
    createVNode('input', { ref }),
    createVNode('button', { onClick: focus }, 'Focus Input')
  )
}
```
