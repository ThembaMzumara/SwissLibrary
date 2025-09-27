/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

// SwissJS JSX Dev Runtime Entry Point
//
// This file is required for SwissJS to support the modern JSX transform in development mode (TypeScript 4.1+ and Vite/ESBuild). When users set "jsxImportSource": "@swissjs/core", dev tools and error overlays may look for this file as '@swissjs/core/jsx-dev-runtime'.
//
// It must export 'jsx', 'jsxs', and 'Fragment' to be compatible with the JSX dev runtime expectations. This enables SwissJS to provide a React-like developer experience, but with its own VDOM and component model, including better error messages and dev overlays.
//
// This file is a core part of SwissJS's design language: it allows .ui and .tsx files to use JSX natively, without React, and ensures all JSX is compiled to SwissJS VNodes and fragments, even in dev mode.
//
// For more, see: https://www.typescriptlang.org/tsconfig#jsxImportSource and https://vitejs.dev/guide/features.html#jsx

import { jsx, jsxs, Fragment } from './vdom/vdom.js';  // Import directly from source
export { jsx, jsxs, Fragment };