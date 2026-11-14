/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

// Security types barrel

export type CapabilityService = (...args: unknown[]) => unknown;
export type AsyncCapabilityService<T> = (...args: unknown[]) => Promise<T>;

export type CapabilityScope = 'global' | 'component' | 'plugin';

export interface CapabilityContext {
  component?: unknown; // Avoid circular import on SwissComponent
  plugin?: string;
  userId?: string;
  timestamp: number;
  [key: string]: unknown;
}

export interface CapabilityAuditLog {
  capability: string;
  timestamp: number;
  userId?: string;
  component?: string;
  plugin?: string;
  success: boolean;
  error?: string;
}

// Internal rate limit entry
export interface RateLimitEntry {
  count: number;
  timestamp: number;
}

// Re-export derived types from other modules
export type { Capability } from '../capabilities.js';
