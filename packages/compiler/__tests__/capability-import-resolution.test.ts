/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { describe, it, expect } from 'vitest';
import ts from 'typescript';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { capabilityTransformer } from '../src/transformers/capability-annot';

async function withTempProject(files: Record<string, string>, fn: (dir: string) => Promise<void>) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'swiss-compiler-'));
  try {
    for (const [rel, content] of Object.entries(files)) {
      const full = path.join(dir, rel);
      await fs.ensureDir(path.dirname(full));
      await fs.writeFile(full, content, 'utf-8');
    }
    await fn(dir);
  } finally {
    await fs.remove(dir);
  }
}

function transformFile(filePath: string, code: string): string {
  const sf = ts.createSourceFile(filePath, code, ts.ScriptTarget.ES2020, true, ts.ScriptKind.TS);
  const result = ts.transform(sf, [capabilityTransformer()]);
  const out = ts.createPrinter().printFile(result.transformed[0] as ts.SourceFile);
  result.dispose();
  return out;
}

describe('capability imported constant resolution (flagged)', () => {
  it('resolves @requires from imported const when SWISS_RESOLVE_IMPORTED=1', async () => {
    process.env.SWISS_RESOLVE_IMPORTED = '1';
    await withTempProject(
      {
        'caps.ts': "export const NEED = 'ui:toast';\n",
        'comp.ts': "import { NEED } from './caps';\n@requires(NEED)\nclass C {}\n",
      },
      async (dir) => {
        const file = path.join(dir, 'comp.ts');
        const code = await fs.readFile(file, 'utf-8');
        const out = transformFile(file, code);
        expect(out).toContain('static requires = ["ui:toast"]');
      }
    );
  });
});
