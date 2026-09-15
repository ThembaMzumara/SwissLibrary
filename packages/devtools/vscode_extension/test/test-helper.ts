/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';

export const EXTENSION_ID = 'swissjs.vscode-swiss';

export async function activateExtension() {
  const extension = vscode.extensions.getExtension(EXTENSION_ID);
  if (!extension) {
    throw new Error('Extension not found');
  }
  return extension.activate();
}

export function getDocPath(p: string) {
  return path.resolve(__dirname, '../../test-fixtures', p);
}

export function getDocUri(p: string) {
  return vscode.Uri.file(getDocPath(p));
}

export async function setTestContent(content: string): Promise<vscode.TextDocument> {
  const doc = await vscode.workspace.openTextDocument({
    language: 'swissjs',
    content
  });
  await vscode.window.showTextDocument(doc);
  return doc;
}

export function assertDefined<T>(value: T | undefined | null, message?: string): asserts value is T {
  assert.ok(value !== undefined && value !== null, message);
}

export function assertRange(actual: vscode.Range, expected: vscode.Range) {
  assert.strictEqual(actual.start.line, expected.start.line, 'Start line');
  assert.strictEqual(actual.start.character, expected.start.character, 'Start character');
  assert.strictEqual(actual.end.line, expected.end.line, 'End line');
  assert.strictEqual(actual.end.character, expected.end.character, 'End character');
}

// Add to global scope for test files
global.beforeEach(() => {
  // Reset test state here if needed
});

global.afterEach(() => {
  // Clean up test state here if needed
});
