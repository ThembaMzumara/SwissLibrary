/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

// Vitest JSDOM setup for @swissjs/components
// - Mocks HTMLCanvasElement.prototype.getContext to prevent jsdom errors
// - Softens window.getComputedStyle for pseudo elements to avoid axe-core crashes
// - Extends default test timeout for slower a11y checks

// Mock canvas getContext to a minimal stub
if (typeof HTMLCanvasElement !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error - augmenting prototype in test env
  HTMLCanvasElement.prototype.getContext = function getContext() {
    return {} as any;
  };
}

// Patch getComputedStyle to ignore pseudoElt argument (jsdom limitation)
if (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function') {
  const _orig = window.getComputedStyle.bind(window);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  window.getComputedStyle = ((elt: Element, _pseudo?: string | null) => _orig(elt)) as any;
}

// Increase default test timeout for a11y runs
// Vitest reads from environment variable if provided
if (typeof process !== 'undefined') {
  process.env.VITEST_TIMEOUT = process.env.VITEST_TIMEOUT || '30000';
  // In CI, be even more generous with timeouts
  if (process.env.CI === '1') {
    process.env.VITEST_TIMEOUT = '45000';
  }
}
