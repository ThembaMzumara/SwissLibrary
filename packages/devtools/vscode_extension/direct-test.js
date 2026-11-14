/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

// Direct test of completions function using ts-node (no full build)
require('ts-node/register/transpile-only');

const { TextDocument } = require('vscode-languageserver-textdocument');
const { Position } = require('vscode-languageserver');
const { getCompletions } = require('./src/server/language/completions');

console.log('=== Direct Function Testing (ts-node) ===');

function runCase(name, content, line, character) {
  const doc = TextDocument.create('test://test.ui', 'swissjs', 1, content);
  const pos = Position.create(line, character);
  const result = getCompletions(doc, pos);
  console.log(`\n[${name}]`);
  console.log(`Input: ${JSON.stringify(content)} at (${line}, ${character})`);
  console.log(`Completions: ${result.length}`);
  console.log('Sample:', result.slice(0, 5).map(c => ({ label: c.label, kind: c.kind, detail: c.detail })));
}

// 1) Tag name completions
runCase('Tag names', '<d', 0, 2);

// 2) Attribute names after a space
runCase('Attribute names', '<button ', 0, 8);

// 3) Attribute values for class
runCase('Attribute values (class)', '<button class="', 0, 15);

// 4) Custom component name completions
runCase('Custom components', '<custom-', 0, 8);

// 5) Attribute values for type
runCase('Attribute values (type)', '<input type="', 0, 13);

// 6) Attribute names mid-typing
runCase('Attribute names mid-typing', '<input pl', 0, 9);
