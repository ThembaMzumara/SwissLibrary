# Feature: Swiss CSS & Assets

**Branch**: `feature/css-assets`  
**Status**: 🚧 Scaffolding  
**Priority**: High (Tier 1)  
**Domains**: swiss

## Overview

Define a comprehensive CSS and asset handling strategy for the Swiss framework, providing an opinionated path for styling and asset management that integrates seamlessly with SWITE and the build pipeline.

## Motivation

SWISS currently relies on generic tooling for CSS and assets without a consolidated, blessed approach. For production apps (SwissEnterprise, SwissPay), we need:

- Clear CSS strategy (plain CSS, CSS Modules, CSS-in-TS, or utility-first)
- Asset handling for images, fonts, and other static files
- Integration with SWITE dev server
- Build-time optimizations

## Proposed Implementation

### Phase 1: CSS Strategy
- [ ] Define primary CSS approach (CSS Modules + optional Tailwind)
- [ ] Implement CSS import handling in compiler
- [ ] Add CSS module transformation
- [ ] Create scoped styling system
- [ ] Document CSS best practices

### Phase 2: Asset Pipeline
- [ ] Design asset import system for `.ui` / `.uix` files
- [ ] Implement image import and optimization
- [ ] Add font loading and optimization
- [ ] Create asset bundling strategy
- [ ] Integrate with SWITE dev server

### Phase 3: Build Optimizations
- [ ] Add CSS minification
- [ ] Implement critical CSS extraction
- [ ] Add image optimization (resize, compress, format conversion)
- [ ] Create asset fingerprinting for caching
- [ ] Optimize font loading (preload, font-display)

### Phase 4: Developer Experience
- [ ] Add TypeScript types for CSS modules
- [ ] Create asset import helpers
- [ ] Add hot module replacement for CSS
- [ ] Provide styling utilities and helpers

## Directory Structure

```
packages/css/
├── src/
│   ├── modules/        # CSS Modules implementation
│   ├── compiler/       # CSS compilation
│   ├── assets/         # Asset handling
│   └── index.ts
├── tests/
└── package.json

packages/swite/
└── src/
    └── css-plugin/     # SWITE CSS integration
```

## Dependencies

- `@swissjs/compiler` - Compilation pipeline
- `@swissjs/swite` - Dev server
- `postcss` - CSS processing
- `lightningcss` - Fast CSS bundler

## Testing Strategy

- Unit tests for CSS module transformation
- Integration tests for asset imports
- Visual regression tests for styling
- Performance benchmarks for build times

## Documentation

- [ ] CSS strategy guide
- [ ] Asset handling guide
- [ ] Styling best practices
- [ ] Migration guide

## Timeline

- **Phase 1**: 1 week
- **Phase 2**: 1 week
- **Phase 3**: 1 week
- **Phase 4**: 3 days

**Total**: ~3.5 weeks

## Related

- Idea: `IDEA-20251203-swiss-css-and-assets.md`
- Future RFC: `000X-swiss-css-and-assets`
