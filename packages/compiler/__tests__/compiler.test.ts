/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { describe, it, expect } from 'vitest';
import { UiCompiler } from '../src/index';

describe('Compiler Package', () => {
  it('runs a basic test', () => {
    expect(true).toBe(true);
  });

  it('treats .ui files as pure TypeScript (no template parsing)', async () => {
    const compiler = new UiCompiler();
    // .ui files should be pure TypeScript with html template literals
    const typescriptSource = 'import { SwissComponent, html } from "@swissjs/core";\n\nexport class TestComponent extends SwissComponent {\n  render() {\n    return html`<div>Hello</div>`;\n  }\n}';
    
    // Use the compile method with source code
    const result = await compiler.compile(typescriptSource, 'test.ui');
    
    // Should pass through unchanged (pure TypeScript)
    expect(result).toContain('html`<div>Hello</div>`');
    expect(result).toContain('SwissComponent');
    expect(result).not.toContain('createElement'); // No JSX transformation
  });
});