<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# SwissJS Virtual DOM: SSR & Hydration System

## Overview
This document describes the implementation of server-side rendering (SSR), client-side hydration, and efficient DOM update logic in the SwissJS framework. The system is designed for security, performance, modularity, and robust memory management.

---

## 1. Virtual Node (VNode) Serialization for SSR

### VNode Structure
```ts
export type VNode =
  | string
  | {
      type: string | Function,
      props: Record<string, any>,
      children: VNode[],
      key?: string | number,
      dom?: HTMLElement | Text,
      ssrId?: string,
      parent?: VNode,
    };
```

### HTML Escaping
All text content and attribute values are escaped to prevent XSS:
```ts
function escapeHtml(str: string): string { /* ... */ }
```

### Void Element Handling
Special handling for void elements (e.g., `<img>`, `<br>`) ensures correct HTML output.

### SSR ID System
Each VNode receives a unique `ssrId` during SSR for hydration matching:
```ts
function addSsrIds(vnode: VNode, baseId: string, index: number = 0) { /* ... */ }
```

### Serialization Function
```ts
export function renderToString(vnode: VNode): string { /* ... */ }
```
- Recursively serializes VNodes to HTML
- Handles components, elements, and text nodes
- Applies SSR IDs as `data-ssr-id` attributes

---

## 2. Hydration System

### Hydration Entry Point
```ts
export function hydrate(this: SwissComponent, container: HTMLElement, existingDOM: HTMLElement) { /* ... */ }
```
- Renders the VNode tree
- Calls `hydrateDOM` to attach to the existing DOM
- Sets up reactivity and effect tracking

### Hydration Algorithm
```ts
export function hydrateDOM(vnode: VNode, domNode: HTMLElement | Text) { /* ... */ }
```
- Matches VNodes to DOM nodes using SSR IDs
- Reconciles attributes, classes, and styles
- Attaches event listeners
- Recursively hydrates children
- Removes extra DOM nodes

#### SSR ID Matching
Warns if SSR IDs do not match, ensuring correct node pairing.

#### DOM Property Reconciliation
- Updates only changed attributes, classes, and styles
- Handles boolean attributes and event listeners

#### Child Node Reconciliation
- Updates, adds, or removes child nodes as needed

---

## 3. DOM Rendering & Update Logic

### Initial Render
```ts
export function renderToDOM(vnode: VNode, container: HTMLElement) { /* ... */ }
```
- Preserves existing DOM nodes when possible
- Calls `updateDOMNode` for efficient updates

### DOM Node Updating
```ts
function updateDOMNode(dom: HTMLElement | Text, vnode: VNode) { /* ... */ }
```
- Updates text content, attributes, styles, and event listeners
- Uses key-based matching for child nodes
- Cleans up removed event listeners

### Attribute & Event Listener Management
```ts
function updateAttributes(element, oldProps, newProps) { /* ... */ }
function updateEventListeners(element, oldProps, newProps) { /* ... */ }
```
- Minimal DOM operations
- Proper boolean and style handling
- Event delegation and normalization

### Child Node Reconciliation
```ts
function updateChildren(parent, oldVChildren, newVChildren) { /* ... */ }
```
- Three-phase: update, add, remove
- Key-based matching for stability
- Type checking for in-place updates

---

## 4. Component Lifecycle Integration

- `serverInit` generates SSR IDs and serializes VNodes
- `hydrate` attaches to DOM and sets up reactivity
- Effects and state are preserved across hydration

---

## 5. Security & Performance

- **Security:** All HTML is escaped
- **Performance:** Minimal DOM operations, node reuse, and efficient diffing
- **Memory:** Proper cleanup of event listeners and DOM nodes

---

## 6. Diagrams

### Initial Render
```
VNode Tree      renderToString      HTML Output
   [App]   ────────────────▶   <div data-ssr-id=...>...</div>
```

### Hydration Cycle
```
Server HTML + VNode Tree
        │
        ▼
  hydrateDOM()
        │
        ▼
DOM nodes matched, listeners attached, state preserved
```

### Child Reconciliation
```
Old Children: [A, B, C]
New Children: [A, X, C, D]
Result:      [A, X, C, D]
 - B replaced by X
 - D appended
```

---

## 7. Key Features
- Server-side rendering (SSR)
- Client-side hydration
- Component state preservation
- Efficient DOM updates
- Event handler attachment
- Style and class reconciliation
- Text node handling
- Void element special handling
- SSR/client consistency checks
- Minimal DOM operations
- Key-based stability
- Proper cleanup
- Type safety
- Performance and correctness

---

## 8. Example Usage

### SSR
```ts
const html = await serverInit.call(MyComponent, props);
// html is sent to the client
```

### Hydration
```ts
myComponentInstance.hydrate(container, container.firstChild as HTMLElement);
```

---

## 9. References
- `packages/core/src/vdom/vdom.ts`
- `packages/core/src/renderer/renderer.ts`
- `packages/core/src/component/ssr.ts`

---

## Server-Side Rendering Guide (2025 Enhancements)

### Data Fetching
```typescript
class ProductPage extends Component {
  static async getServerSideProps(capabilities) {
    // Capability-checked data fetch
    if (!capabilities.has('DATA_READ')) return {};
    const data = await fetch('/api/products');
    return { products: data };
  }
}
```

### State Serialization
Server state is automatically serialized:
```html
<script id="ssr-state" type="application/json">
  {"props":{...},"signals":{...}}
</script>
```

### Partial Hydration
Mark components as islands:
```typescript
class CommentsSection extends Component {
  constructor() {
    super();
    markIsland(this); // Hydrates separately
  }
}
```

### Security Model
```typescript
class AdminPanel extends Component {
  checkCapabilities(caps) {
    return caps.has('ADMIN_ACCESS');
  }
}
```

### Routing
```typescript
// server.js
import { handleSSRRequest } from '@swiss/core';

server.get('*', async (req, res) => {
  res.send(await handleSSRRequest(req.url));
});
```

---

SwissJS © 2024 