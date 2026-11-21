/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import fs from 'fs-extra';
import path from 'path';

export async function fixDtsExtensions(distDir: string, debug = false) {
  function hasExtension(p: string) {
    // Match .js, .ts, .d.ts, .mjs, .cjs, .jsx, .tsx, etc.
    return /\.[a-z0-9]+(\.d)?$/i.test(p);
  }
  async function fixFile(filePath: string) {
    let content = await fs.readFile(filePath, 'utf8');
    const original = content;
    // Fix static imports/exports
    content = content.replace(
      /from\s+['"](\.\/?[\w.\-/]+)['"]/g,
      (match: string, p1: string) => {
        if (hasExtension(p1)) return match;
        return match.replace(p1, `${p1}.js`);
      }
    );
    // Fix dynamic/type-only imports (import("./foo"))
    content = content.replace(
      /import\((['"])(\.\/?[\w.\-/]+)\1\)/g,
      (match: string, quote: string, p1: string) => {
        if (hasExtension(p1)) return match;
        return `import(${quote}${p1}.js${quote})`;
      }
    );
    if (debug && content !== original) {
      console.log(`[fixDtsExtensions] Fixed: ${filePath}`);
      console.log('--- Before ---\n' + original + '\n--- After ---\n' + content + '\n');
    } else if (debug) {
      console.log(`[fixDtsExtensions] No change: ${filePath}`);
    }
    await fs.writeFile(filePath, content, 'utf8');
  }
  async function walk(dir: string) {
    const items = await fs.readdir(dir);
    for (const item of items) {
      const full = path.join(dir, item);
      const stat = await fs.stat(full);
      if (stat.isDirectory()) await walk(full);
      else if (item.endsWith('.d.ts') || item.endsWith('.ts') || item.endsWith('.tsx')) await fixFile(full);
    }
  }
  await walk(distDir);
} 