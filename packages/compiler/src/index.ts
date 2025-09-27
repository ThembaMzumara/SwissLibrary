/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import fs from 'fs-extra';
import * as ts from 'typescript';
import * as path from 'path';
import { capabilityTransformer } from './transformers/capability-annot.js';
import { providesTransformer } from './transformers/provides-annot.js';
import { capabilityDefTransformer } from './transformers/capability-def-annot.js';
import { componentTemplateStyleTransformer } from './transformers/component-decorators.js';
import { pluginServiceTransformer } from './transformers/plugin-service-decorators.js';
import { lifecycleRenderTransformer } from './transformers/lifecycle-render-decorators.js';
// Template parser removed - .ui files are pure TypeScript, not XML templates

export interface CompileOptions {
  target?: ts.ScriptTarget;
  module?: ts.ModuleKind;
  sourceMap?: boolean;
}

export class UiCompiler {
  private options: CompileOptions;

  constructor(options: CompileOptions = {}) {
    this.options = {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
      sourceMap: true,
      ...options
    };
  }

  async compileFile(filePath: string, outputPath?: string): Promise<string> {
    const source = await fs.readFile(filePath, 'utf-8');
    const compiled = this.transformUiFile(source, filePath);
    
    if (outputPath) {
      await fs.ensureDir(path.dirname(outputPath));
      await fs.writeFile(outputPath, compiled);
    }
    
    return compiled;
  }

  compile(source: string, filePath: string): string {
    return this.transformUiFile(source, filePath);
  }

  // compiler/index.ts
  private transformUiFile(source: string, filePath: string): string {
    try {
      // 0. .ui files are pure TypeScript with html template literals - no XML parsing needed
      // They use html`...` template literals for markup, not <template> sections
      const workingSource = source;
      const isUiFile = filePath.endsWith('.ui');
      
      let output: string;
      
      if (isUiFile) {
        // .ui files should NOT have AST transformers applied - they contain html template literals
        // that should be left untouched as pure TypeScript template strings
        output = workingSource;
      } else {
        // 1. Apply AST transformations for regular TypeScript files
        const sourceFile = ts.createSourceFile(
          filePath,
          workingSource,
          this.options.target || ts.ScriptTarget.ES2020,
          true
        );

        const transformationResult = ts.transform(sourceFile, [
          componentTemplateStyleTransformer(),
          pluginServiceTransformer(),
          lifecycleRenderTransformer(),
          capabilityTransformer(),
          providesTransformer(),
          capabilityDefTransformer()
        ]);
        const transformedSourceFile = transformationResult.transformed[0];

        const printer = ts.createPrinter();
        output = printer.printFile(transformedSourceFile);

        transformationResult.dispose();
      }

      if (isUiFile) {
        // .ui files with html template literals should be returned as-is
        // No import rewriting or JSX injection needed
        return output;
      }

      // 2. All targeted decorators are now handled via AST. No regex fallback.
      // Existing import and JSX handling logic for regular TypeScript files
      const rewrittenSource = output.replace(
        /from\s+(['"])([^'";]+)\.ui\1/g,
        (match, quote, importPath) => {
          if (importPath === '1ui' || !importPath.startsWith('.')) {
            throw new Error(
              `Invalid import: '${importPath}.ui' in ${filePath}. Use a relative path (e.g., './Card.ui').`
            );
          }
          return `from ${quote}${importPath}${quote}`;
        }
      );
      if (/from\s+['"]1ui['"]/ .test(rewrittenSource)) {
        throw new Error(
          `Invalid import: '1ui' found in ${filePath}. JSX runtime should be imported from '@swissjs/core'.`
        );
      }
      if (!rewrittenSource.includes("import { createElement")) {
        return `import { createElement, Fragment } from '@swissjs/core';\n${rewrittenSource}`;
      }
      return rewrittenSource;
    } catch (error) {
      if (error instanceof Error && error.message.includes('SwissJS Compiler')) {
        throw new Error(`[${path.basename(filePath)}] ${error.message}`);
      }
      throw error;
    }
  }

  async compileDirectory(inputDir: string, outputDir: string): Promise<void> {
    const files = await this.findUiFiles(inputDir);
    for (const file of files) {
      const relativePath = path.relative(inputDir, file);
      const outputPath = path.join(outputDir, relativePath.replace(/\.ui$/, '.js'));
      await this.compileFile(file, outputPath);
    }
  }

  private async findUiFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...await this.findUiFiles(fullPath));
      } else if (entry.name.endsWith('.ui')) {
        files.push(fullPath);
      }
    }
    return files;
  }

  async watch(inputPath: string, outputPath?: string): Promise<void> {
    const chokidar = await import('chokidar');
    const watcher = chokidar.watch(inputPath, {
      persistent: true,
      ignoreInitial: true
    });

    watcher.on('change', async (file: string) => {
      if (file.endsWith('.ui')) {
        try {
          console.log(`Recompiling ${path.relative(process.cwd(), file)}`);
          await this.compileFile(file, outputPath || file.replace(/\.ui$/, '.js'));
        } catch (error) {
          console.error('Compilation error:', error);
        }
      }
    });
  }
}

// Runtime template helpers
export const html = (strings: TemplateStringsArray, ...values: unknown[]): string => {
  let result = '';
  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    if (i < values.length) result += String(values[i]);
  }
  return result;
};

export const css = (strings: TemplateStringsArray, ...values: unknown[]): string => {
  return html(strings, ...values);
};