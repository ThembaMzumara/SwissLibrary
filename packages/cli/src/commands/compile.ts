/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import chokidar from 'chokidar';

export const compileCommand = new Command('compile')
  .description('Compile a .ui file')
  .argument('[file]', 'File to compile (or directory for batch compilation)')
  .option('-o, --output <file>', 'Output file')
  .option('-w, --watch', 'Watch for changes')
  .option('-d, --dir <directory>', 'Compile all .ui files in directory')
  .option('--sourcemap', 'Generate source maps', true)
  .option('--optimize', 'Optimize output', false)
  .option('--format <format>', 'Output format (esm, cjs)', 'esm')
  .action(async (file: string, options: Record<string, unknown>) => {
    try {
      console.log(chalk.blue('🧀 SwissJS Compiler'));
      console.log(chalk.gray('Compiling .ui files...\n'));

      // Import the SwissJS compiler
      const { UiCompiler } = await import('@swissjs/compiler');

      const watch = options.watch === true;
      if (watch) {
        console.log(chalk.blue('👀 Watch mode enabled'));
      }

      // Determine what to compile
      let filesToCompile: string[] = [];

      const dir = options.dir ? String(options.dir) : '';
      if (dir) {
        // Compile all .ui files in directory
        filesToCompile = await findOneUiFiles(path.resolve(dir));
        if (filesToCompile.length === 0) {
          console.warn(chalk.yellow(`⚠️  No .ui files found in directory: ${dir}`));
          return;
        }
      } else if (file) {
        // Compile specific file
        const filePath = path.resolve(file);
        if (!await fs.pathExists(filePath)) {
          console.error(chalk.red(`❌ File not found: ${file}`));
          process.exit(1);
        }
        if (!filePath.endsWith('.ui')) {
          console.error(chalk.red(`❌ File must have .ui extension: ${file}`));
          process.exit(1);
        }
        filesToCompile = [filePath];
      } else {
        // Compile all .ui files in current directory
        filesToCompile = await findOneUiFiles(process.cwd());
        if (filesToCompile.length === 0) {
          console.warn(chalk.yellow('⚠️  No .ui files found in current directory'));
          return;
        }
      }

      console.log(chalk.blue(`📁 Found ${filesToCompile.length} .ui file(s) to compile`));

      // Compile function
      const compileFile = async (filePath: string) => {
        try {
          const relativePath = path.relative(process.cwd(), filePath);
          console.log(chalk.blue(`🔨 Compiling ${relativePath}...`));

          const outputOpt = options.output ? String(options.output) : '';
          const outputPath = outputOpt || path.dirname(filePath);
          const outputFile = outputOpt || path.join(outputPath, path.basename(filePath, '.ui') + '.js');

          const sourcemap = options.sourcemap !== false;
          const compiler = new UiCompiler({
            sourceMap: sourcemap
          });

          await compiler.compileFile(filePath, outputFile);

          console.log(chalk.green(`✅ ${relativePath} compiled successfully`));

          // Show output info
          if (await fs.pathExists(outputFile)) {
            const stats = await fs.stat(outputFile);
            console.log(chalk.gray(`  📄 Output: ${path.relative(process.cwd(), outputFile)} (${formatBytes(stats.size)})`));
          }

          if (sourcemap) {
            const sourceMapFile = outputFile + '.map';
            if (await fs.pathExists(sourceMapFile)) {
              const sourceMapStats = await fs.stat(sourceMapFile);
              console.log(chalk.gray(`  📄 Source map: ${path.relative(process.cwd(), sourceMapFile)} (${formatBytes(sourceMapStats.size)})`));
            }
          }
        } catch (error) {
          console.error(chalk.red(`❌ Failed to compile ${filePath}:`), error);
          if (!watch) {
            process.exit(1);
          }
        }
      };

      // Initial compilation
      for (const filePath of filesToCompile) {
        await compileFile(filePath);
      }

      if (!watch) {
        console.log(chalk.green('\n✅ Compilation completed!'));
        return;
      }

      // Watch mode
      console.log(chalk.blue('\n👀 Watching for changes...'));
      console.log(chalk.cyan('Press Ctrl+C to stop watching'));

      const watcher = chokidar.watch(filesToCompile, {
        persistent: true,
        ignoreInitial: true
      });

      watcher.on('change', async (filePath: string) => {
        console.log(chalk.blue(`\n🔄 File changed: ${path.relative(process.cwd(), filePath)}`));
        await compileFile(filePath);
      });

      watcher.on('add', async (filePath: string) => {
        if (filePath.endsWith('.ui')) {
          console.log(chalk.blue(`\n🆕 New file detected: ${path.relative(process.cwd(), filePath)}`));
          await compileFile(filePath);
        }
      });

      watcher.on('unlink', (filePath: string) => {
        console.log(chalk.yellow(`\n🗑️  File removed: ${path.relative(process.cwd(), filePath)}`));
      });

      // Handle graceful shutdown
      process.on('SIGINT', () => {
        console.log(chalk.yellow('\n🛑 Stopping watch mode...'));
        watcher.close();
        process.exit(0);
      });

      process.on('SIGTERM', () => {
        console.log(chalk.yellow('\n🛑 Stopping watch mode...'));
        watcher.close();
        process.exit(0);
      });

    } catch (error: unknown) {
      console.error(chalk.red('❌ Compilation failed:'), error);
      process.exit(1);
    }
  });

async function findOneUiFiles(root: string): Promise<string[]> {
  const files: string[] = [];

  async function scan(dir: string) {
    const items = await fs.readdir(dir);

    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = await fs.stat(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules' && item !== 'dist') {
        await scan(fullPath);
      } else if (item.endsWith('.ui')) {
        files.push(fullPath);
      }
    }
  }
  
  await scan(root);
  return files;
}

function formatBytes(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
} 