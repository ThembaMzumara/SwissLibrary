<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# SwissJS SSR System

## Overview

SwissJS SSR (Server-Side Rendering) provides a secure, extensible, and production-ready system for rendering SwissJS applications on the server, supporting hybrid rendering, layouts, capability-based security, and advanced hydration. The SSR system is designed to be modular, developer-friendly, and aligned with SwissJS's security-first philosophy.

---

## Architecture

- **Singleton SSRSystem**: Central orchestrator for routing, data fetching, rendering, layouts, and error handling.
- **Capability-based Security**: All routes and data fetching are protected by capability sets.
- **Hybrid Rendering**: Supports both API and component routes, layouts, and middleware.
- **Client Hydration**: Automatic state restoration and hydration on the client.
- **Extensible**: Middleware, layouts, and advanced hooks for custom workflows.

---

## Usage

### 1. Server Setup
```typescript
import { createSwissServer } from '@swissjs/core/ssr/ssrSystem';
import { HomePage, ProductPage } from './pages';
import { MainLayout } from './layouts';

createSwissServer({
  port: 3000,
  routes: [
    { path: '/', component: HomePage, layout: 'MainLayout' },
    {
      path: '/products/:id',
      component: ProductPage,
      layout: 'MainLayout',
      getServerData: async ({ params }) => ({ product: await fetchProduct(params.id) })
    }
  ],
  layouts: { MainLayout }
}).start();
```

### 2. Component Definition
```typescript
import { Component } from '@swissjs/core';

export class ProductPage extends Component {
  static async getServerData({ params }) {
    return { product: await db.products.find(params.id) };
  }
  render() {
    const { product } = this.props;
    return `<div><h1>${product.name}</h1><p>${product.description}</p></div>`;
  }
  hydrate(element) {
    // Client-side interactivity
  }
  clientDidMount() {
    // Client lifecycle
  }
}
```

### 3. Hybrid/API Route Example
```typescript
ssr.registerRoute({
  path: '/api/data',
  handler: async ({ request }) => new Response(JSON.stringify({ data: 'API response' }), { headers: { 'Content-Type': 'application/json' } })
});
```

---

## API Reference

### SSRSystem (Singleton)
- `registerRoute(config: RouteConfig): SSRSystem` — Register a new route (component or API)
- `registerLayout(name: string, component: ComponentConstructor): SSRSystem` — Register a layout
- `resolve(url: URL): Promise<ResolvedRoute>` — Resolve a URL to a route and context
- `renderToString(url: URL): Promise<string>` — Render a route/component to HTML string
- `renderError(error: Error): string` — Render error page

### createSwissServer(options: ServerOptions)
- `start()` — Start the HTTP server (Deno)
- `handleConnection(conn)` — Handle incoming connections

### hydrateClient()
- Auto-hydrates the root component on the client using SSR state

### RouteConfig
- `path: string` — Route path (supports params)
- `component?: ComponentConstructor` — Component to render
- `handler?: (ctx: RouteContext) => any` — API handler
- `layout?: string` — Layout name
- `capabilities?: Set<string>` — Required capabilities
- `middleware?: Array<(ctx: RouteContext) => Promise<void>>` — Middleware chain
- `getServerData?: (ctx: RouteContext) => Promise<Record<string, any>>` — Data fetching hook

### Component Enhancements
- `static getServerData(context)` — Async data fetching for SSR
- `serializeSignals()` — Serialize signal state for hydration
- `preRender()` / `postRender(html)` — Hooks for pre/post render logic
- `hydrate(element)` — Client-side hydration logic
- `clientDidMount()` — Client lifecycle hook

---

## Security & Capabilities
- All routes and data fetching are protected by capability sets.
- Use `mergeCapabilities` and `deepMerge` for secure, type-safe merging of capabilities and route configs.
- Prototype pollution and privilege escalation are prevented by design.

---

## Advanced Features
- **Layouts**: Register and use layouts for route grouping and shared UI.
- **Hybrid/API Routes**: Register API endpoints alongside component routes.
- **Incremental Static Regeneration**: Use `revalidate` in `getServerData` for periodic regeneration.
- **Edge/Static Rendering**: Adapt server logic for edge runtimes or static site generation.
- **Custom Middleware**: Add authentication, logging, or other middleware to routes.

---

## Extensibility
- Add new layouts, middleware, or route types as needed.
- Extend components with custom SSR hooks for advanced scenarios.
- Integrate with monitoring, analytics, or security plugins via middleware.

---

## Example: Static Site Generation
```typescript
export async function generateStaticPages() {
  const ssr = SSRSystem.getInstance();
  const pages = [
    { path: '/', output: 'index.html' },
    { path: '/about', output: 'about.html' }
  ];
  for (const page of pages) {
    const url = new URL(`http://localhost${page.path}`);
    const html = await ssr.renderToString(url);
    await Deno.writeTextFile(`dist/${page.output}`, html);
  }
}
```

---

## See Also
- [SwissJS Core README](./README.md)
- [Observable Signals](./observable-signals.md)
- [SSR Hydration Documentation](./SSR_Hydration_Documentation.md) 