<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# Changelog

All notable changes to the SwissJS VSCode Extension will be documented in this file.

## [0.1.0] - 2025-01-03

### Added
- **Complete LSP Server Implementation**
  - Full SwissJS parser with AST support and nodeAtPosition utility
  - Real-time diagnostics with smart error suggestions using Levenshtein distance
  - Enhanced completions with `on:*`, `@event`, boolean/enumerated attribute values
  - Hierarchical document symbols provider
  - Hover information with markdown documentation
  - Go-to-definition support for components and attributes
  - Code formatting with indentation and attribute spacing
  - Code actions for quick fixes (suggest nearest attribute, add closing tags)

- **Enhanced Language Assets**
  - Advanced TextMate grammar with SwissJS-specific highlighting (`on:*`, `:prop`, `@event`, `v-*`)
  - Comprehensive snippets for SwissJS patterns (event handlers, directives, templates)
  - Language configuration with proper brackets, auto-closing pairs, indentation rules

- **Client Features**
  - Robust client activation with TransportKind.ipc
  - Provider adapters with proper LSP-to-VSCode type conversion
  - Configuration bridge with settings support (`swissjs.format.enable`, `swissjs.trace.server`)
  - Command palette integration (Create Component, Preview Component)

- **Shared Utilities**
  - String utilities with Levenshtein distance and fuzzy matching
  - Range utilities for LSP operations
  - Logging utilities with configurable levels
  - Comprehensive registry for HTML tags, attributes, events, and SwissJS components

- **Testing & Quality**
  - 39/39 unit tests passing for all providers and utilities
  - Complete TypeScript type safety
  - ESLint configuration with zero lint errors
  - Optimized test runner with `--exit` flag

- **Build & Packaging**
  - Production-ready esbuild bundling (795KB client, 41KB server)
  - Minimal VSIX packaging (213KB, 65 files)
  - Strict files whitelist, no workspace dependencies
  - GitHub Actions CI/CD workflow for automated build, test, and publish

### Technical Architecture
- **Parser**: Custom SwissJS parser for `.ui` files with TypeScript integration
- **LSP Server**: Full Language Server Protocol implementation with error handling
- **Client**: VSCode extension client with robust provider adapters
- **Grammar**: TextMate grammar for syntax highlighting with SwissJS-specific patterns
- **Testing**: Comprehensive unit test suite with fixture-based testing

### Performance
- Fast completions with registry-based filtering
- Debounced validation for optimal performance
- Efficient bundling with tree-shaking and minification
