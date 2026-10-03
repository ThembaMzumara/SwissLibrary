/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

/**
 * Normalize route path
 */
export function normalizeRoutePath(path: string): string {
  // Ensure path starts with /
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  
  // Remove trailing slash except for root
  if (path !== '/' && path.endsWith('/')) {
    path = path.slice(0, -1);
  }
  
  return path;
}

/**
 * Validate route path
 */
export function validateRoutePath(path: string): boolean {
  if (typeof path !== 'string') {
    return false;
  }
  
  // Must start with /
  if (!path.startsWith('/')) {
    return false;
  }
  
  // Check for invalid characters
  if (/[<>:"|?*]/.test(path)) {
    return false;
  }
  
  return true;
}

/**
 * Extract parameters from route pattern
 */
export function extractRouteParams(pattern: string, path: string): Record<string, string> {
  const params: Record<string, string> = {};
  const patternSegments = pattern.split('/');
  const pathSegments = path.split('/');

  for (let i = 0; i < patternSegments.length; i++) {
    const patternSegment = patternSegments[i];
    const pathSegment = pathSegments[i];

    if (patternSegment?.startsWith(':')) {
      const paramName = patternSegment.slice(1);
      params[paramName] = pathSegment || '';
    }
  }

  return params;
} 