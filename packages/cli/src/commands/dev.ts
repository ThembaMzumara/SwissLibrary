/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import type { InlineConfig } from 'vite';

import { swissPlugin } from '@swissjs/vite-plugin-swiss';
import chokidar from 'chokidar';
import readline from 'readline';
import { execSync } from 'child_process';
import { compileUiFilesToTypeScript } from '../utils/compileUiFiles.js';
import { spawn } from 'child_process';
import { fixDtsExtensions } from '../utils/compileUiFiles.js';

export const devCommand = new Command('dev')
  .description('Start the development server')
  .option('-p, --port <port>', 'Port to run the server on', '3000')
  .option('-h, --host <host>', 'Host to bind to', 'localhost')
  .option('--open', 'Open browser automatically', false)
  .option('--https', 'Enable HTTPS', false)
  .option('--watch <path>', 'Watch additional files', '')
  .action(async (options: Record<string, unknown>, command: Command) => {
    const o = options as Record<string, unknown>;
    const debug = Boolean(o.debug ?? command.parent?.opts().debug);
    try {
      console.log(chalk.blue('🧀 SwissJS Development Server'));
      console.log(chalk.gray('Starting development server...\n'));

      const projectRoot = process.cwd();

      // Dynamically resolve Vite from the project root

      try {
        void (await import('vite'));
      } catch (err) {
        void err;
        console.log(chalk.yellow('Vite is not installed in this project.'));
        // Try to detect package manager
        let pkgManager = 'npm';
        if (fs.existsSync(path.join(projectRoot, 'pnpm-lock.yaml'))) pkgManager = 'pnpm';
        if (fs.existsSync(path.join(projectRoot, 'yarn.lock'))) pkgManager = 'yarn';

        const installCmd = pkgManager === 'pnpm'
          ? 'pnpm add -D vite'
          : pkgManager === 'yarn'
            ? 'yarn add -D vite'
            : 'npm install -D vite';

        // Prompt the user
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        await new Promise<void>((resolve) => {
          rl.question(
            chalk.blue(`Would you like to install Vite using ${pkgManager}? (Y/n): `),
            async (answer) => {
              rl.close();
              if (answer.trim().toLowerCase() === 'n') {
                console.log(chalk.red('❌ Vite is required. Exiting.'));
                process.exit(1);
              } else {
                try {
                  execSync(installCmd, { stdio: 'inherit', cwd: projectRoot });
                  // Try again to import Vite
                  void (await import('vite'));
                  console.log(chalk.green('✅ Vite installed successfully!'));
                  resolve();
                } catch (installErr) {
                  void installErr;
                  console.error(chalk.red('❌ Failed to install Vite automatically. Please install it manually.'));
                  process.exit(1);
                }
              }
            }
          );
        });
      }

      // Check if we're in a SwissJS project
      const packageJsonPath = path.join(projectRoot, 'package.json');
      if (!await fs.pathExists(packageJsonPath)) {
        console.error(chalk.red('❌ No package.json found. Are you in a SwissJS project?'));
        process.exit(1);
      }

      const packageJson = await fs.readJson(packageJsonPath);
      if (!packageJson.dependencies?.['@swissjs/core'] && 
          !packageJson.peerDependencies?.['@swissjs/core'] && 
          !packageJson.devDependencies?.['@swissjs/core']) {
        console.error(chalk.red('❌ Not a SwissJS project. Missing @swissjs/core dependency.'));
        process.exit(1);
      }

      // Compile all .ui files at startup
      const srcDir = path.join(projectRoot, 'src');
      const tempDir = path.join(projectRoot, '.swiss-temp');
      await compileUiFilesToTypeScript(srcDir, tempDir, debug);
      await fixDtsExtensions(tempDir, debug);

      // Start tsc --watch to keep dist/ up to date
      console.log(chalk.blue('📦 Starting TypeScript compiler in watch mode (tsc --watch)...'));
      const distDir = path.join(projectRoot, 'dist');
      const tscWatch = spawn('npx', [
        'tsc',
        '--project', path.join(projectRoot, 'tsconfig.json'),
        '--rootDir', tempDir,
        '--outDir', distDir,
        '--watch',
        '--pretty',
        '--skipLibCheck',
        '--esModuleInterop',
        '--jsx', 'react-jsx',
        '--module', 'ESNext',
        '--target', 'ESNext',
        '--allowJs', 'false',
        '--strict',
        '--noEmitOnError',
        '--declaration',
        '--emitDeclarationOnly', 'false',
      ], { stdio: 'inherit', cwd: projectRoot, shell: true });

      // Watch dist for .d.ts changes and fix extensions
      const dtsWatcher = chokidar.watch(path.join(distDir, '**/*.d.ts'), { ignoreInitial: true });
      dtsWatcher.on('add', async (filePath: string) => {
        void filePath;
        await fixDtsExtensions(distDir, debug);
      });
      dtsWatcher.on('change', async (filePath: string) => {
        void filePath;
        await fixDtsExtensions(distDir, debug);
      });

      // Find all .ui files for the watcher
      const oneUiFiles = await findOneUiFiles(srcDir);
      if (oneUiFiles.length > 0) {
        console.log(chalk.blue('\n👀 Watching .ui files for changes...'));
        const watcher = chokidar.watch(oneUiFiles, { persistent: true, ignoreInitial: true });
        watcher.on('change', async (filePath: string) => {
          console.log(chalk.blue(`🔄 Recompiling .ui files due to change in: ${filePath}`));
          await compileUiFilesToTypeScript(srcDir, tempDir, debug);
        });
        watcher.on('add', async (filePath: string) => {
          console.log(chalk.blue(`🆕 New .ui file detected: ${filePath}`));
          await compileUiFilesToTypeScript(srcDir, tempDir, debug);
        });
      }

      // Handle process cleanup
      process.on('SIGINT', async () => {
        console.log(chalk.yellow('\n🛑 Shutting down development server and tsc...'));
        tscWatch.kill();
        process.exit(0);
      });
      process.on('SIGTERM', async () => {
        console.log(chalk.yellow('\n🛑 Shutting down development server and tsc...'));
        tscWatch.kill();
        process.exit(0);
      });

      // Detect package manager
      let pkgManager = 'npm';
      if (fs.existsSync(path.join(projectRoot, 'pnpm-lock.yaml'))) pkgManager = 'pnpm';
      if (fs.existsSync(path.join(projectRoot, 'yarn.lock'))) pkgManager = 'yarn';

      // Check for dev script
      if (!packageJson.scripts || !packageJson.scripts.dev) {
        console.error(chalk.red('❌ No "dev" script found in package.json. Please add "dev": "vite" to your scripts.'));
        process.exit(1);
      }

      const devScript = (pkgManager === 'yarn')
        ? 'yarn dev'
        : (pkgManager === 'pnpm')
          ? 'pnpm dev'
          : 'npm run dev';

      try {
        console.log(chalk.blue(`\n🔄 Delegating to project dev script: ${devScript}\n`));
        execSync(devScript, { stdio: 'inherit', cwd: projectRoot });
      } catch (err) {
        void err;
        console.error(chalk.red('❌ Failed to run the project dev script. Make sure you have a "dev" script in your package.json that runs Vite.'));
        tscWatch.kill();
        process.exit(1);
      }

      // Create Vite dev server config
      const port = parseInt(String(o.port ?? '3000'), 10);
      const host = String(o.host ?? 'localhost');
      const open = Boolean(o.open ?? false);
      const https = Boolean(o.https ?? false);

      const devConfig: InlineConfig = {
        root: projectRoot,
        server: {
          port,
          host,
          open,
          https: https ? {} : undefined
        },
        plugins: [
          swissPlugin()
        ],
        optimizeDeps: {
          include: ['@swissjs/core']
        },
        build: {
          rollupOptions: {
            input: {
              main: path.join(projectRoot, 'src/main.tsx')
            }
          }
        }
      };

      // Start Vite dev server
      console.log(chalk.blue('⚡ Starting Vite development server...'));
      const { createServer } = await import('vite');
      const server = await createServer(devConfig as InlineConfig);
      await server.listen();

      const serverUrl = `http${https ? 's' : ''}://${host}:${port}`;
      console.log(chalk.green(`✅ Development server running at ${serverUrl}`));
      console.log(chalk.cyan('\n📝 Available commands:'));
      console.log(chalk.white('  Press r to reload the page'));
      console.log(chalk.white('  Press o to open the browser'));
      console.log(chalk.white('  Press q to quit'));

      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        console.log(chalk.yellow('\n🛑 Shutting down development server...'));
        await server.close();
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        console.log(chalk.yellow('\n🛑 Shutting down development server...'));
        await server.close();
        process.exit(0);
      });

    } catch (error) {
      console.error(chalk.red('❌ Development server failed:'), error);
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