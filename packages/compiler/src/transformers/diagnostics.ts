/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import * as ts from 'typescript';

export function compilerError(code: string, message: string, file?: ts.SourceFile, node?: ts.Node): Error {
  let where = '';
  if (file && node) {
    const { line, character } = file.getLineAndCharacterOfPosition(node.getStart());
    where = ` [${file.fileName}:${line + 1}:${character + 1}]`;
  } else if (file) {
    where = ` [${file.fileName}]`;
  }
  return new Error(`[SwissJS Compiler ${code}]${where} ${message}`);
}
