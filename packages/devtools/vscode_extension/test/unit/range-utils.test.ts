/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { strict as assert } from 'assert';
import { Position } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { 
  createRange, 
  createRangeFromOffsets, 
  isPositionInRange, 
  rangesOverlap, 
  getRangeText, 
  expandRangeToFullLines,
  createWordRangeAtPosition,
  createLineRange,
  comparePositions,
  isValidRange,
  normalizeRange,
  createInsertionRange
} from '../../src/server/shared/rangeUtils';

describe('Range Utilities', () => {
  const sampleText = 'line 1\nline 2 with words\nline 3';
  const document = TextDocument.create('test://test.ui', 'swissjs', 1, sampleText);

  describe('createRange', () => {
    it('should create a range from coordinates', () => {
      const range = createRange(0, 0, 1, 5);
      assert.strictEqual(range.start.line, 0);
      assert.strictEqual(range.start.character, 0);
      assert.strictEqual(range.end.line, 1);
      assert.strictEqual(range.end.character, 5);
    });
  });

  describe('createRangeFromOffsets', () => {
    it('should create a range from offsets', () => {
      const range = createRangeFromOffsets(document, 0, 6);
      assert.strictEqual(range.start.line, 0);
      assert.strictEqual(range.start.character, 0);
      assert.strictEqual(range.end.line, 0);
      assert.strictEqual(range.end.character, 6);
    });
  });

  describe('isPositionInRange', () => {
    const range = createRange(1, 5, 1, 10);

    it('should detect position inside range', () => {
      const position = Position.create(1, 7);
      assert.ok(isPositionInRange(position, range));
    });

    it('should detect position at range boundaries', () => {
      const startPos = Position.create(1, 5);
      const endPos = Position.create(1, 10);
      assert.ok(isPositionInRange(startPos, range));
      assert.ok(isPositionInRange(endPos, range));
    });

    it('should detect position outside range', () => {
      const beforePos = Position.create(1, 3);
      const afterPos = Position.create(1, 12);
      assert.ok(!isPositionInRange(beforePos, range));
      assert.ok(!isPositionInRange(afterPos, range));
    });
  });

  describe('rangesOverlap', () => {
    it('should detect overlapping ranges', () => {
      const range1 = createRange(0, 0, 1, 5);
      const range2 = createRange(0, 3, 1, 8);
      assert.ok(rangesOverlap(range1, range2));
    });

    it('should detect non-overlapping ranges', () => {
      const range1 = createRange(0, 0, 0, 5);
      const range2 = createRange(1, 0, 1, 5);
      assert.ok(!rangesOverlap(range1, range2));
    });

    it('should handle adjacent ranges', () => {
      const range1 = createRange(0, 0, 0, 5);
      const range2 = createRange(0, 5, 0, 10);
      assert.ok(!rangesOverlap(range1, range2));
    });
  });

  describe('getRangeText', () => {
    it('should extract text from range', () => {
      const range = createRange(0, 0, 0, 4);
      const text = getRangeText(document, range);
      assert.strictEqual(text, 'line');
    });

    it('should handle multi-line ranges', () => {
      const range = createRange(0, 0, 1, 4);
      const text = getRangeText(document, range);
      assert.strictEqual(text, 'line 1\nline');
    });
  });

  describe('expandRangeToFullLines', () => {
    it('should expand range to full lines', () => {
      const range = createRange(1, 3, 1, 8);
      const expanded = expandRangeToFullLines(document, range);
      assert.strictEqual(expanded.start.line, 1);
      assert.strictEqual(expanded.start.character, 0);
      assert.strictEqual(expanded.end.line, 2);
      assert.strictEqual(expanded.end.character, 0);
    });
  });

  describe('createWordRangeAtPosition', () => {
    it('should create range for word at position', () => {
      const position = Position.create(1, 8); // Inside "with"
      const range = createWordRangeAtPosition(document, position);
      const text = getRangeText(document, range);
      assert.strictEqual(text, 'with');
    });

    it('should handle position at word boundary', () => {
      const position = Position.create(1, 7); // Start of "with"
      const range = createWordRangeAtPosition(document, position);
      const text = getRangeText(document, range);
      assert.strictEqual(text, 'with');
    });
  });

  describe('createLineRange', () => {
    it('should create range for entire line', () => {
      const range = createLineRange(document, 1);
      const text = getRangeText(document, range);
      assert.strictEqual(text, 'line 2 with words');
    });
  });

  describe('comparePositions', () => {
    it('should compare positions correctly', () => {
      const pos1 = Position.create(0, 5);
      const pos2 = Position.create(1, 3);
      const pos3 = Position.create(0, 5);

      assert.strictEqual(comparePositions(pos1, pos2), -1);
      assert.strictEqual(comparePositions(pos2, pos1), 1);
      assert.strictEqual(comparePositions(pos1, pos3), 0);
    });
  });

  describe('isValidRange', () => {
    it('should validate correct ranges', () => {
      const validRange = createRange(0, 0, 1, 5);
      assert.ok(isValidRange(validRange));
    });

    it('should detect invalid ranges', () => {
      const invalidRange = createRange(1, 5, 0, 0);
      assert.ok(!isValidRange(invalidRange));
    });
  });

  describe('normalizeRange', () => {
    it('should normalize inverted ranges', () => {
      const invertedRange = createRange(1, 5, 0, 0);
      const normalized = normalizeRange(invertedRange);
      assert.strictEqual(normalized.start.line, 0);
      assert.strictEqual(normalized.start.character, 0);
      assert.strictEqual(normalized.end.line, 1);
      assert.strictEqual(normalized.end.character, 5);
    });

    it('should leave valid ranges unchanged', () => {
      const validRange = createRange(0, 0, 1, 5);
      const normalized = normalizeRange(validRange);
      assert.deepStrictEqual(normalized, validRange);
    });
  });

  describe('createInsertionRange', () => {
    it('should create zero-width range', () => {
      const position = Position.create(1, 5);
      const range = createInsertionRange(position);
      assert.deepStrictEqual(range.start, position);
      assert.deepStrictEqual(range.end, position);
    });
  });
});
