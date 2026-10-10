/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

export const CAPABILITIES = {
  NETWORK: 'network',
  ANALYTICS: 'analytics',
  PAYMENT: 'payment',
  // Add other capabilities as needed
} as const;

export type Capability = typeof CAPABILITIES[keyof typeof CAPABILITIES];

// Allow dynamic extension if needed
const directiveCapabilityMap: Record<string, string> = {
  'fetch': CAPABILITIES.NETWORK,
  'track': CAPABILITIES.ANALYTICS,
  'payment': CAPABILITIES.PAYMENT
};

export function registerDirectiveCapability(directive: string, capability: string) {
  directiveCapabilityMap[directive] = capability;
}

export function getDirectiveCapability(directive: string): string | undefined {
  return directiveCapabilityMap[directive];
}