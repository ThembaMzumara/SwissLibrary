/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

// Core gateway adapter kept decoupled from @swissjs/security at type level
// to avoid project reference rootDir/include issues.

// Minimal local replicas of the security types
export type SecurityContext = Record<string, unknown> & {
  layer?: 'runtime' | 'component' | 'plugin' | string;
  componentName?: string;
  pluginName?: string;
  userId?: string;
};

export interface ValidationResult {
  ok: boolean;
  reasons?: string[];
}

export interface SecurityGateway {
  evaluate: (target: string, ctx: SecurityContext) => boolean;
  audit: (entry: { action: string; target?: string; success?: boolean; details?: unknown }) => void;
  auditPlugin: (plugin: { name: string; version?: string; requiredCapabilities?: string[] }) => ValidationResult;
}

// Internal holder; core does not implement security, it delegates to package @swissjs/security
let _gateway: SecurityGateway | null = null;

export function setSecurityGateway(gw: SecurityGateway) {
  _gateway = gw;
}

export function getSecurityGateway(): SecurityGateway | null {
  return _gateway;
}

export function evaluateCapability(target: string, ctx: SecurityContext): boolean {
  return _gateway ? _gateway.evaluate(target, ctx) : true;
}

export function audit(entry: Parameters<SecurityGateway['audit']>[0]): void {
  if (_gateway) _gateway.audit(entry);
}

export function auditPlugin(plugin: { name: string; version?: string; requiredCapabilities?: string[] }): ValidationResult {
  if (_gateway) return _gateway.auditPlugin(plugin);
  return { ok: true };
}
