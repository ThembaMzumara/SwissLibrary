/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { strict as assert } from 'assert';
import { 
  levenshteinDistance, 
  findClosestMatch, 
  suggestCorrections, 
  isPartialMatch, 
  filterByPrefix 
} from '../../src/server/shared/stringUtils';

describe('String Utilities', () => {
  describe('levenshteinDistance', () => {
    it('should calculate correct distance for identical strings', () => {
      assert.strictEqual(levenshteinDistance('hello', 'hello'), 0);
    });

    it('should calculate correct distance for completely different strings', () => {
      assert.strictEqual(levenshteinDistance('abc', 'xyz'), 3);
    });

    it('should calculate correct distance for single character changes', () => {
      assert.strictEqual(levenshteinDistance('hello', 'hallo'), 1);
      assert.strictEqual(levenshteinDistance('div', 'dib'), 1);
    });

    it('should handle empty strings', () => {
      assert.strictEqual(levenshteinDistance('', 'hello'), 5);
      assert.strictEqual(levenshteinDistance('hello', ''), 5);
      assert.strictEqual(levenshteinDistance('', ''), 0);
    });
  });

  describe('findClosestMatch', () => {
    const candidates = ['div', 'span', 'button', 'input', 'form'];

    it('should find exact matches', () => {
      assert.strictEqual(findClosestMatch('div', candidates), 'div');
    });

    it('should find close matches', () => {
      assert.strictEqual(findClosestMatch('dib', candidates), 'div');
      assert.strictEqual(findClosestMatch('spn', candidates), 'span');
    });

    it('should return null for distant matches', () => {
      assert.strictEqual(findClosestMatch('xyz123', candidates), null);
    });

    it('should respect maxDistance parameter', () => {
      assert.strictEqual(findClosestMatch('dib', candidates, 1), 'div');
      assert.strictEqual(findClosestMatch('dib', candidates, 0), null);
    });
  });

  describe('suggestCorrections', () => {
    const knownTags = ['div', 'span', 'button', 'input', 'form', 'header', 'footer'];

    it('should suggest corrections for typos', () => {
      const suggestions = suggestCorrections('dib', knownTags);
      assert.ok(suggestions.includes('div'));
    });

    it('should limit number of suggestions', () => {
      const suggestions = suggestCorrections('d', knownTags, 2);
      assert.ok(suggestions.length <= 2);
    });

    it('should return empty array for very different strings', () => {
      const suggestions = suggestCorrections('xyz123', knownTags);
      assert.strictEqual(suggestions.length, 0);
    });

    it('should sort suggestions by similarity', () => {
      const suggestions = suggestCorrections('buton', knownTags);
      if (suggestions.length > 0) {
        assert.strictEqual(suggestions[0], 'button');
      }
    });
  });

  describe('isPartialMatch', () => {
    const candidates = ['onclick', 'onchange', 'oninput', 'class', 'id'];

    it('should detect partial matches', () => {
      assert.ok(isPartialMatch('on', candidates));
      assert.ok(isPartialMatch('cl', candidates));
    });

    it('should return false for no matches', () => {
      assert.ok(!isPartialMatch('xyz', candidates));
    });

    it('should be case insensitive', () => {
      assert.ok(isPartialMatch('ON', candidates));
      assert.ok(isPartialMatch('Class', candidates));
    });
  });

  describe('filterByPrefix', () => {
    const candidates = ['onclick', 'onchange', 'oninput', 'class', 'id', 'style'];

    it('should filter by prefix', () => {
      const filtered = filterByPrefix('on', candidates);
      assert.strictEqual(filtered.length, 3);
      assert.ok(filtered.every(item => item.startsWith('on')));
    });

    it('should be case insensitive by default', () => {
      const filtered = filterByPrefix('ON', candidates);
      assert.strictEqual(filtered.length, 3);
    });

    it('should respect case sensitivity when specified', () => {
      const filtered = filterByPrefix('ON', candidates, true);
      assert.strictEqual(filtered.length, 0);
    });

    it('should return empty array for no matches', () => {
      const filtered = filterByPrefix('xyz', candidates);
      assert.strictEqual(filtered.length, 0);
    });
  });
});
