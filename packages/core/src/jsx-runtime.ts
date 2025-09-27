/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

// SwissJS JSX Runtime Entry Point
//
// This file is required for SwissJS to support the modern JSX transform (TypeScript 4.1+ and Vite/ESBuild). When users set "jsxImportSource": "@swissjs/core" in their tsconfig, TypeScript and Vite will look for this file as '@swissjs/core/jsx-runtime'.
//
// It must export 'jsx', 'jsxs', and 'Fragment' to be compatible with the JSX runtime expectations. This enables SwissJS to provide a React-like developer experience, but with its own VDOM and component model.
//
// This file is a core part of SwissJS's design language: it allows .ui and .tsx files to use JSX natively, without React, and ensures all JSX is compiled to SwissJS VNodes and fragments.
//
// For more, see: https://www.typescriptlang.org/tsconfig#jsxImportSource and https://vitejs.dev/guide/features.html#jsx

import { jsx, jsxs, Fragment } from './vdom/vdom.js';  // Import directly from source
export { jsx, jsxs, Fragment };