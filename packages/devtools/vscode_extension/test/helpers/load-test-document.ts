/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import * as path from 'path';
import * as fs from 'fs';
import { TextDocument } from 'vscode-languageserver-textdocument';

export function loadTestDocument(relativePath: string): TextDocument {
  const absolutePath = path.resolve(__dirname, '..', 'fixtures', relativePath);
  const content = fs.readFileSync(absolutePath, 'utf8');
  
  return TextDocument.create(
    `file://${absolutePath}`,
    'swissjs',
    0,
    content
  );
}

export function getTestFixturePath(relativePath: string): string {
  return path.resolve(__dirname, '..', 'fixtures', relativePath);
}
