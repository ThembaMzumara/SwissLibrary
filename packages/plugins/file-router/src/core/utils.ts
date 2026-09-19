/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import type { RouteDefinition, ComponentConstructor } from '@swissjs/core';

/**
 * Create a route definition from file path and component
 */
export function createRouteDefinition(
  path: string,
  component: () => Promise<{ default: ComponentConstructor }>,
  options: {
    layout?: () => Promise<{ default: ComponentConstructor }>;
    meta?: Record<string, unknown>;
  } = {}
): RouteDefinition {
  return {
    path,
    component,
    layout: options.layout,
    meta: options.meta
  };
}

/**
 * Validate route definition
 */
export function validateRouteDefinition(route: RouteDefinition): boolean {
  if (!route.path || typeof route.path !== 'string') {
    return false;
  }
  
  if (!route.component || typeof route.component !== 'function') {
    return false;
  }
  
  return true;
}

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