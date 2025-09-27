#!/usr/bin/env node
/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { createCommand } from './commands/create.js';
import { forgeCommand } from './commands/forge.js';
import { buildCommand } from './commands/build.js';
import { devCommand } from './commands/dev.js';
import { serveCommand } from './commands/serve.js';
import { compileCommand } from './commands/compile.js';
import { initCommand } from './commands/init.js';
import { createPluginCommand } from './commands/create-plugin.js';

const program = new Command();

// CLI metadata
program
  .name('swiss')
  .description('SwissJS CLI - Development and build tools')
  .version('0.1.0')
  .option('--debug', 'Enable debug logging for all commands', false);

// Add commands
program.addCommand(createCommand);
program.addCommand(forgeCommand);
program.addCommand(buildCommand);
program.addCommand(devCommand);
program.addCommand(serveCommand);
program.addCommand(compileCommand);
program.addCommand(initCommand);
program.addCommand(createPluginCommand);

// Global error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('Unhandled Rejection at:'), promise, chalk.red('reason:'), reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught Exception:'), error);
  process.exit(1);
});

// Parse arguments and execute
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}