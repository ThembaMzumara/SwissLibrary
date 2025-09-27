/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { CapabilityManager } from './capability-manager.js';
import type { SwissComponent } from '../component/component.js';

export { CAPABILITIES, type Capability } from './capabilities.js';

export function checkCapabilities(component: SwissComponent, required: string[]): boolean {
  return CapabilityManager.hasAll(required, component);
}

export function validateDirectiveCapability(
  component: SwissComponent,
  directive: string
): boolean {
  const requiredCap = `directive:${directive}`;
  return CapabilityManager.has(requiredCap, component);
}

// Re-export gateway helpers for consumers
export * from './gateway.js';