/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { Command } from 'commander';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { Registry } from '../forge/registry.js';
import { TemplateEngine } from '../forge/template-engine.js';
import { FileGenerator } from '../forge/file-generator.js';
import { DependencyManager } from '../forge/dependency-manager.js';
import type { GenerationOptions } from '../types/index.js';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const createPluginCommand = new Command('create-swiss-plugin')
  .description('Scaffold a SwissJS plugin from the built-in plugin template')
  .argument('[plugin-name]', 'Name of the plugin to create')
  .option('-o, --output <path>', 'Output directory')
  .option('--skip-install', 'Skip dependency installation')
  .option('--skip-git', 'Skip git initialization')
  .option('--overwrite', 'Overwrite existing files')
  .action(async (pluginName: string | undefined, options: Record<string, unknown>) => {
    try {
      console.log(chalk.blue('🧀 SwissJS Plugin Creator'));
      console.log(chalk.gray('Creating your new SwissJS plugin...\n'));

      const registry = new Registry({
        registryPath: path.join(__dirname, '../../templates-registry'),
        templatesPath: path.join(__dirname, '../../templates')
      });
      await registry.initialize();

      const template = await registry.getTemplate('plugin');
      if (!template) {
        console.error(chalk.red('Plugin template not found in registry'));
        process.exit(1);
      }

      if (!pluginName) {
        const answers = await inquirer.prompt([{
          type: 'input',
          name: 'pluginName',
          message: 'Plugin package name (e.g., @org/swiss-plugin-foo):',
          validate: (input: string) => input.trim().length > 0 || 'Plugin name is required'
        }]);
        pluginName = answers.pluginName;
      }

      const pluginNameStr = pluginName as string;
      const outputPath = String(options.output ?? path.join(process.cwd(), pluginNameStr.replace(/[@/]/g, '-')));

      // Gather minimal variables for template
      const variables = { pluginName: pluginNameStr } as Record<string, unknown>;

      const templateEngine = new TemplateEngine();
      const fileGenerator = new FileGenerator(templateEngine);
      const dependencyManager = new DependencyManager();

      const generationOptions: GenerationOptions = {
        outputPath,
        templatePath: template.path,
        variables: {
          ...variables,
          timestamp: new Date().toISOString()
        },
        overwrite: options.overwrite === true,
        skipInstall: options.skipInstall === true,
        skipGit: options.skipGit === true,
      };

      const result = await fileGenerator.generateFiles(generationOptions);
      if (!result.success) {
        console.error(chalk.red('File generation failed:'));
        result.errors.forEach((e: string) => console.error(chalk.red(`  - ${e}`)));
        process.exit(1);
      }

      console.log(chalk.green(`Created ${result.filesCreated.length} files in ${outputPath}`));

      if (!generationOptions.skipInstall) {
        console.log(chalk.blue('\nInstalling dependencies...'));
        const dependencies = Object.keys(template.dependencies || {});
        const devDependencies = Object.keys(template.devDependencies || {});
        if (dependencies.length) await dependencyManager.installDependencies(outputPath, dependencies, { packageManager: 'npm', dev: false });
        if (devDependencies.length) await dependencyManager.installDependencies(outputPath, devDependencies, { packageManager: 'npm', dev: true });
      }

      if (!generationOptions.skipGit) {
        console.log(chalk.blue('\nInitializing git repository...'));
        await dependencyManager.initGit(outputPath);
      }

      console.log(chalk.green(`\n✅ Plugin "${pluginNameStr}" scaffolded successfully!`));
    } catch (error) {
      console.error(chalk.red('Error creating plugin:'), error);
      process.exit(1);
    }
  });
