/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

const fs = require('fs');
const { TextDocument } = require('vscode-languageserver-textdocument');
const { Position } = require('vscode-languageserver');

// Mock the completions module
const completionsPath = './src/server/language/completions.ts';

// Load test document
const content = fs.readFileSync('./test/fixtures/completions.ui', 'utf8');
const doc = TextDocument.create('file:///test.ui', 'swissjs', 1, content);

console.log('=== DEBUGGING COMPLETIONS PROVIDER ===');
console.log('Document URI:', doc.uri);
console.log('Document content length:', content.length);
console.log('First 200 chars:', JSON.stringify(content.substring(0, 200)));

// Test positions
const pos1 = Position.create(10, 7); // Tag name position
const pos2 = Position.create(11, 16); // Attribute position

console.log('\nTest Position 1 (tag name):');
console.log('  Line:', pos1.line, 'Character:', pos1.character);

console.log('\nTest Position 2 (attribute):');  
console.log('  Line:', pos2.line, 'Character:', pos2.character);

// Calculate offsets manually
const lines = content.split('\n');
let offset1 = 0;
for (let i = 0; i < pos1.line; i++) {
  offset1 += lines[i].length + 1; // +1 for newline
}
offset1 += pos1.character;

let offset2 = 0;
for (let i = 0; i < pos2.line; i++) {
  offset2 += lines[i].length + 1; // +1 for newline
}
offset2 += pos2.character;

console.log('\nCalculated offsets:');
console.log('  Position 1 offset:', offset1);
console.log('  Position 2 offset:', offset2);
console.log('  Char at pos 1:', JSON.stringify(content[offset1]));
console.log('  Char at pos 2:', JSON.stringify(content[offset2]));

// Test html template literal detection
const htmlRegex = /html`([^`]*)`/gs;
let match;
let foundPos1 = false, foundPos2 = false;

while ((match = htmlRegex.exec(content)) !== null) {
  const htmlStart = match.index + 5; // Skip 'html`'
  const htmlEnd = htmlStart + match[1].length;
  
  console.log('\nHTML template literal found:');
  console.log('  Start:', htmlStart, 'End:', htmlEnd);
  console.log('  Pos 1 in range?', offset1 >= htmlStart && offset1 <= htmlEnd);
  console.log('  Pos 2 in range?', offset2 >= htmlStart && offset2 <= htmlEnd);
  
  if (offset1 >= htmlStart && offset1 <= htmlEnd) {
    foundPos1 = true;
    const rel1 = offset1 - htmlStart;
    console.log('  Pos 1 relative offset:', rel1);
    console.log('  HTML text before pos 1:', JSON.stringify(match[1].substring(0, rel1)));
  }
  
  if (offset2 >= htmlStart && offset2 <= htmlEnd) {
    foundPos2 = true;
    const rel2 = offset2 - htmlStart;
    console.log('  Pos 2 relative offset:', rel2);
    console.log('  HTML text before pos 2:', JSON.stringify(match[1].substring(0, rel2)));
  }
}

console.log('\nHTML detection results:');
console.log('  Position 1 found in HTML:', foundPos1);
console.log('  Position 2 found in HTML:', foundPos2);
