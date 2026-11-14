/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

// Minimal globals to satisfy TS in extension context
// We intentionally keep this very loose to avoid coupling to @types/chrome across the monorepo
// ESLint does not lint files outside src/ for this package
/* eslint-disable @typescript-eslint/no-explicit-any */
declare const chrome: any;
