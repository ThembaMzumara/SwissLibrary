/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { UiCompiler } from '../src/index';

async function withTempFile(ext: string, contents: string, fn: (file: string) => Promise<void>) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'swiss-compiler-'));
  const file = path.join(dir, `Temp${ext}`);
  await fs.writeFile(file, contents, 'utf-8');
  try {
    await fn(file);
  } finally {
    await fs.remove(dir);
  }
}

describe('Template integration (.ui)', () => {
  it('treats .ui files as pure TypeScript (no transformations)', async () => {
    const compiler = new UiCompiler();
    const tpl = 'import { SwissComponent, html } from "@swissjs/core";\n\nexport class TestComponent extends SwissComponent {\n  render() {\n    return html`<div class="card">Hello</div>`;\n  }\n}';
    await withTempFile('.ui', tpl, async (file) => {
      const out = await compiler.compileFile(file);
      // .ui files should be passed through unchanged (pure TypeScript)
      expect(out).toContain('html`<div class="card">Hello</div>`');
      expect(out).toContain('SwissComponent');
      expect(out).not.toContain('createElement'); // No JSX transformation
    });
  });

  it('preserves html template literals in .ui files', async () => {
    const compiler = new UiCompiler();
    const tpl = 'import { SwissComponent, html } from "@swissjs/core";\n\nexport class AppCard extends SwissComponent {\n  render() {\n    return html`<div title="${this.props.title}">Content</div>`;\n  }\n}';
    await withTempFile('.ui', tpl, async (file) => {
      const out = await compiler.compileFile(file);
      expect(out).toContain('html`<div title="${this.props.title}">Content</div>`');
      expect(out).toContain('AppCard');
      expect(out).not.toContain('createElement'); // No transformation
    });
  });

  it('handles invalid TypeScript syntax in .ui files', async () => {
    const compiler = new UiCompiler();
    const tpl = 'invalid typescript syntax here!!!';
    await withTempFile('.ui', tpl, async (file) => {
      // .ui files with invalid TypeScript should still be passed through
      // (TypeScript compiler will catch syntax errors later in the pipeline)
      const out = await compiler.compileFile(file);
      expect(out).toContain('invalid typescript syntax here!!!');
    });
  });
});
