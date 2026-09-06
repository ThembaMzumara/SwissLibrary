/*
 * Copyright (c) 2024 SwissJS Framework
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import * as ts from 'typescript';
import { jsxTransformer } from './jsx/jsx-transformer.js';

/**
 * Transforms source code with JSX support using pure TypeScript transformers
 */
export function transformWithJsx(source: string, filePath: string): string {
  try {
    // Check if the source already has createElement import
    const hasCreateElementImport = /import\s+\{[^}]*\bcreateElement\b[^}]*\}\s+from\s+['"]@swissjs\/core['"]/i.test(source);

    let modifiedSource = source;

    // Add createElement and Fragment import if not present
    if (!hasCreateElementImport) {
      // Remove any existing createElement/Fragment imports to avoid duplicates
      modifiedSource = source
        .replace(/import\s+\{[^}]*\b(createElement|Fragment)\b[^}]*\}\s+from\s+['"].*?['"];?\n?/g, '')
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Normalize multiple empty lines
        .trim();

      // Add the import at the top of the file
      const importStatement = "import { createElement, Fragment } from '@swissjs/core';\n\n";
      modifiedSource = importStatement + modifiedSource;
    }

    // Parse the source code
    const sourceFile = ts.createSourceFile(
      filePath,
      modifiedSource,
      ts.ScriptTarget.ESNext,
      true,
      ts.ScriptKind.TSX
    );

    // Apply JSX transformer
    const result = ts.transform(sourceFile, [jsxTransformer()]);
    const transformedSourceFile = result.transformed[0] as ts.SourceFile;

    // Print the transformed AST back to source code
    const printer = ts.createPrinter({
      newLine: ts.NewLineKind.LineFeed,
      removeComments: false
    });

    const output = printer.printFile(transformedSourceFile);

    // Cleanup
    result.dispose();

    return output;
  } catch (error) {
    console.error(`Error transforming JSX in ${filePath}:`, error);
    // Return original source on error to allow compilation to continue
    return source;
  }
}
