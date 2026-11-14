/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';
import { UiCompiler } from '../src/index';

// Tests diagnostics for invalid `from '1ui'` imports

describe('Compiler import diagnostics', () => {
  it("throws on from '1ui' pseudo-import", async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'swiss-compiler-'));
    const file = path.join(tmp, 'bad.ts');
    await fs.writeFile(
      file,
      "import { something } from '1ui';\nexport const x = 1;\n"
    );

    const compiler = new UiCompiler();
    await expect(compiler.compileFile(file)).rejects.toThrow(
      /Invalid import: '1ui'/
    );
  });
});
