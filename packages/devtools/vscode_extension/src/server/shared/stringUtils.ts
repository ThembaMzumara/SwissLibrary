/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

/**
 * String utilities for SwissJS LSP server
 */

/**
 * Calculate Levenshtein distance between two strings
 * Used for suggesting nearest known attributes/tags when unknown ones are found
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  // Initialize first row and column
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Find the closest match from a list of candidates using Levenshtein distance
 * @param target The string to find matches for
 * @param candidates Array of candidate strings
 * @param maxDistance Maximum distance to consider (default: 3)
 * @returns The closest match or null if no match within maxDistance
 */
export function findClosestMatch(
  target: string, 
  candidates: string[], 
  maxDistance = 3
): string | null {
  let closestMatch: string | null = null;
  let minDistance = maxDistance + 1;

  for (const candidate of candidates) {
    const distance = levenshteinDistance(target.toLowerCase(), candidate.toLowerCase());
    if (distance < minDistance) {
      minDistance = distance;
      closestMatch = candidate;
    }
  }

  return minDistance <= maxDistance ? closestMatch : null;
}

/**
 * Suggest corrections for unknown attributes/tags
 * @param unknown The unknown string
 * @param knownItems Array of known valid items
 * @param maxSuggestions Maximum number of suggestions to return
 * @returns Array of suggested corrections sorted by similarity
 */
export function suggestCorrections(
  unknown: string,
  knownItems: string[],
  maxSuggestions = 3
): string[] {
  const suggestions: Array<{ item: string; distance: number }> = [];

  for (const item of knownItems) {
    const distance = levenshteinDistance(unknown.toLowerCase(), item.toLowerCase());
    if (distance <= 3) { // Only suggest if reasonably close
      suggestions.push({ item, distance });
    }
  }

  // Sort by distance (closest first) and return top suggestions
  return suggestions
    .sort((a, b) => a.distance - b.distance)
    .slice(0, maxSuggestions)
    .map(s => s.item);
}

/**
 * Check if a string is a partial match (prefix) of any candidate
 * Useful for completion filtering
 */
export function isPartialMatch(partial: string, candidates: string[]): boolean {
  const lowerPartial = partial.toLowerCase();
  return candidates.some(candidate => 
    candidate.toLowerCase().startsWith(lowerPartial)
  );
}

/**
 * Filter candidates by prefix match
 * @param prefix The prefix to match
 * @param candidates Array of candidate strings
 * @param caseSensitive Whether matching should be case sensitive
 * @returns Filtered array of candidates that start with prefix
 */
export function filterByPrefix(
  prefix: string,
  candidates: string[],
  caseSensitive = false
): string[] {
  const searchPrefix = caseSensitive ? prefix : prefix.toLowerCase();
  return candidates.filter(candidate => {
    const searchCandidate = caseSensitive ? candidate : candidate.toLowerCase();
    return searchCandidate.startsWith(searchPrefix);
  });
}
