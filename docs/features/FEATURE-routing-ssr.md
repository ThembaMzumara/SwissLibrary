# Feature: Swiss Routing & SSR

**Branch**: `feature/routing-ssr`  
**Status**: 🚧 Scaffolding  
**Priority**: High (Tier 1)  
**Domains**: swiss, swiss-enterprise, swisspay

## Overview

Implement a comprehensive routing and server-side rendering (SSR) system for the Swiss framework, providing file-based routing, SSR/SSG/ISR capabilities, and API routes similar to Next.js but tailored for Swiss components.

## Motivation

Currently, SWISS provides the UI/runtime/compiler stack but lacks:

- File-based routing system
- Server-side rendering (SSR) / Static site generation (SSG) / Incremental static regeneration (ISR)
- API routes for backend functionality
- Integrated navigation and data loading

Enterprise apps (SwissEnterprise, SwissPay) need a coherent navigation + rendering model that integrates seamlessly with the SWISS compiler/runtime.

## Proposed Implementation

### Phase 1: Router Core

- [x] Design router architecture compatible with `.ui` / `.uix` components
- [x] Implement file-based routing convention (via `@swissjs/plugin-file-router`)
- [x] Create route matching and navigation system
- [x] Add support for dynamic routes and route parameters
- [ ] Integrate with SWITE dev server for HMR

### Phase 2: Nested Layouts & Data Loading

- [x] Implement nested layout system
- [x] Add per-route data loading hooks (`loader`, `action`)
- [ ] Create route transitions and loading states
- [x] Add route guards and middleware

### Phase 3: SSR/SSG Pipeline

- [x] Design server renderer for Swiss component trees
- [x] Implement HTML generation from Swiss components
- [ ] Create CLI integration for static output generation
- [x] Add hydration strategy for client-side interactivity
- [ ] Optimize for real SWS apps (POS, SwissPay) rather than generic sites

### Phase 4: API Routes

- [x] Design API route convention
- [x] Implement request/response handling
- [x] Add middleware support
- [x] Create file-based API route scanner

## Directory Structure

```
packages/router/
├── src/
│   ├── core/           # Core routing logic
│   ├── file-router/    # File-based routing
│   ├── ssr/            # Server-side rendering
│   ├── api/            # API routes
│   └── index.ts
├── tests/
└── package.json

packages/swite/
└── src/
    └── router-plugin/  # SWITE integration
```

## Dependencies

- `@swissjs/core` - Component system
- `@swissjs/compiler` - Compilation pipeline
- `@swissjs/swite` - Dev server integration

## Testing Strategy

- Unit tests for route matching
- Integration tests for navigation
- E2E tests for SSR/SSG output
- Performance benchmarks

## Documentation

- [ ] Router API reference
- [ ] File-based routing guide
- [ ] SSR/SSG guide
- [ ] Migration guide from client-side routing

## Timeline

- **Phase 1**: 2 weeks
- **Phase 2**: 1 week
- **Phase 3**: 2 weeks
- **Phase 4**: 1 week

**Total**: ~6 weeks

## Related

- Idea: `IDEA-20251203-swiss-routing-and-ssr.md`
- Future RFC: `000X-swiss-router`, `000Y-swiss-ssr-ssg`
