/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { fixDtsExtensions as sharedFixDtsExtensions } from '@swissjs/utils';
export { sharedFixDtsExtensions as fixDtsExtensions };

export async function compileUiFilesToTypeScript(srcDir: string, outDir: string, debug = false): Promise<void> {
  if (debug) console.log(chalk.yellow(`[compileUiFilesToTypeScript] Scanning for .ui files in ${srcDir}`));
  const oneUiFiles = await findFiles(srcDir, '.ui');
  
  if (oneUiFiles.length === 0) {
    if (debug) console.log(chalk.yellow('⚠️  No .ui files found - pure TypeScript project'));
    return;
  }

  if (debug) console.log(chalk.yellow(`[compileUiFilesToTypeScript] Emitting ${oneUiFiles.length} .ui file(s) as TypeScript (.ts)...`));
  console.log(chalk.blue(`🔨 Processing ${oneUiFiles.length} .ui file(s) as pure TypeScript (.ts)...`));
  console.log(chalk.gray('  This enables .ui ↔ .ts imports in your mixed codebase'));
  
  try {
    const { UiCompiler } = await import('@swissjs/compiler');
    const compiler = new UiCompiler();

    for (const file of oneUiFiles) {
      const relPath = path.relative(srcDir, file);
      const outputExtension = '.ts';
      const outputPath = path.join(outDir, relPath.replace(/\.ui$/, outputExtension));
      await fs.ensureDir(path.dirname(outputPath));
      if (debug) console.log(chalk.yellow(`[compileUiFilesToTypeScript] Writing ${relPath} → ${path.relative(outDir, outputPath)}`));
      let tsCode = await compiler.compileFile(file);
      // Remove any import of createElement or Fragment from @swissjs/core (legacy guard)
      tsCode = tsCode.replace(/import\s*\{[^}]*createElement[^}]*\}[^;]*;?\n?/g, '');
      tsCode = tsCode.replace(/import\s*\{[^}]*Fragment[^}]*\}[^;]*;?\n?/g, '');
      // Update all imports from .ui to .ts
      tsCode = tsCode.replace(/from ['"](\.\/?[\w/-]+)\.ui['"]/g, (match, importPath) => {
        return `from '${importPath}${outputExtension}'`;
      });
      if (debug) {
        console.log(chalk.yellow(`[compileUiFilesToTypeScript] Output for ${relPath}:\n---\n${tsCode}\n---`));
      }
      await fs.writeFile(outputPath, tsCode, 'utf8');
      console.log(chalk.green(`  ✅ ${relPath} → ${path.relative(outDir, outputPath)}`));
    }
    console.log(chalk.green(`🎉 All .ui files processed! Your mixed codebase is now unified as TypeScript (.ts).`));

    // Write .swiss-temp/tsconfig.json for dev server and tsc
    const tempTsConfigPath = path.join(outDir, 'tsconfig.json');
    const tempTsConfig = {
      extends: path.relative(outDir, path.join(process.cwd(), 'tsconfig.json')),
      compilerOptions: {
        types: ['@swissjs/core']
      },
      include: ['**/*']
    };
    await fs.writeJson(tempTsConfigPath, tempTsConfig, { spaces: 2 });
  } catch (error) {
    console.error(chalk.red('❌ Failed to compile .ui files:'), error);
    process.exit(1);
  }
}

async function findFiles(dir: string, extension: string): Promise<string[]> {
  const files: string[] = [];
  async function scan(currentDir: string) {
    const items = await fs.readdir(currentDir);
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = await fs.stat(fullPath);
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        await scan(fullPath);
      } else if (item.endsWith(extension)) {
        files.push(fullPath);
      }
    }
  }
  await scan(dir);
  return files;
} 