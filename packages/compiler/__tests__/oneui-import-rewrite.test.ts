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

describe('Compiler .ui import rewrite', () => {
  it('rewrites from "./Card.ui" to "./Card"', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'swiss-compiler-'));
    const file = path.join(tmp, 'entry.ts');
    await fs.writeFile(
      file,
      "import Card from './Card.ui';\nexport const use = Card;\n"
    );

    const compiler = new UiCompiler();
    const out = await compiler.compileFile(file);

    expect(out).toMatch(/from ['"]\.\/Card['"]/);
    expect(out).not.toMatch(/\.ui['"]/);
  });
});
