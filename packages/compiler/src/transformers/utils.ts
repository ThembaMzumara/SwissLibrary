/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

export function resolveIdentifierValue(identifier: ts.Identifier, sourceFile?: ts.SourceFile): string | undefined {
  // Fallback if sourceFile not provided
  const sf: ts.SourceFile | undefined = sourceFile ?? (identifier.getSourceFile && identifier.getSourceFile());
  if (!sf) return undefined;

  let resolvedValue: string | undefined;

  ts.forEachChild(sf, node => {
    if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        if (ts.isIdentifier(decl.name) && decl.name.text === identifier.text && decl.initializer && ts.isStringLiteral(decl.initializer)) {
          resolvedValue = decl.initializer.text;
          break;
        }
      }
    }
    if (resolvedValue) return;
  });

  if (resolvedValue !== undefined) return resolvedValue;

  // Fallback: simple regex scan of the source text for const NAME = 'literal'
  // This helps when previous transforms changed node identities but the text remains intact.
  const src = sf.getFullText ? sf.getFullText() : (sf as unknown as { text: string }).text;
  const name = identifier.text.replace(/[$]/g, '\\$&');
  const re = new RegExp(`(?:const|let|var)\\s+${name}\\s*=\\s*(['"])((?:\\\\.|[^\\\n])*?)\\1`);
  const m = src.match(re);
  if (m) {
    return m[2];
  }

  // Optional: resolve from imported modules when enabled
  if (process.env.SWISS_RESOLVE_IMPORTED === '1' && sf && typeof sf.fileName === 'string') {
    try {
      const srcText = sf.getFullText ? sf.getFullText() : (sf as unknown as { text: string }).text;
      // Match: import { NAME } from './module'
      const importRe = new RegExp(`import\\s*\\{[^}]*\\b${identifier.text}\\b[^}]*\\}\\s*from\\s*(['"])((?:\\.|[^\n])*?)\\1`, 'm');
      const mi = srcText.match(importRe);
      if (mi) {
        const importPath = mi[2];
        if (importPath.startsWith('.')) {
          const baseDir = path.dirname(sf.fileName);
          const candidates = [
            path.resolve(baseDir, importPath + '.ts'),
            path.resolve(baseDir, importPath + '.js'),
            path.resolve(baseDir, importPath, 'index.ts'),
            path.resolve(baseDir, importPath, 'index.js'),
          ];
          for (const cand of candidates) {
            if (fs.existsSync(cand)) {
              const text = fs.readFileSync(cand, 'utf-8');
              const name = identifier.text.replace(/[$]/g, '\\$&');
              const re2 = new RegExp(`(?:const|let|var)\\s+${name}\\s*=\\s*(['"])((?:\\\\.|[^\\\n])*?)\\1`);
              const m2 = text.match(re2);
              if (m2) return m2[2];
            }
          }
        }
      }
    } catch {
      // ignore and fall through
    }
  }

  return undefined;
}
