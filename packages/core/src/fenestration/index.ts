/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

/**
 * Fenestration System - Core architectural piercing for SwissJS
 * 
 * Enables secure, direct communication across layered boundaries
 * without propagating through intermediate layers.
 * 
 * Philosophy: "Pierce layers, don't propagate through them."
 */

export {
  FenestrationRegistry,
  type FenestrationCapability,
  type FenestrationContext,
  type FenestrationResult
} from './registry.js';

// Re-export for convenience
export { FenestrationRegistry as Registry } from './registry.js';
