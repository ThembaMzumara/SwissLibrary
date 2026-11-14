/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

// Core types for @swissjs/security

// High-level policy representation
export interface SecurityPolicy {
  id: string;
  description?: string;
  // Capability or resource targeted by the policy (e.g., "storage:write")
  target: string;
  // Allowed roles/permissions; empty means allow by default unless validator rejects
  roles?: string[];
  permissions?: string[];
  // Optional rate limit: requests per minute
  rateLimitPerMinute?: number;
  // Arbitrary predicate for custom checks
  predicate?: (ctx: SecurityContext) => boolean;
}

// Execution/security context
export interface SecurityContext {
  // Logical layer invoking the action: component, service, plugin, runtime
  layer: 'component' | 'service' | 'plugin' | 'runtime';
  // Optional Swiss component or plugin names for richer auditing
  componentName?: string;
  pluginName?: string;
  userId?: string;
  tenantId?: string;
  roles?: string[];
  permissions?: string[];
  // Arbitrary bag for extensions
  meta?: Record<string, unknown>;
}

// Standard audit entry
export interface AuditEntry {
  timestamp: number;
  target: string;
  policyId?: string;
  context: SecurityContext;
  success: boolean;
  reason?: string;
  details?: Record<string, unknown>;
}

// Validator result shape
export interface ValidationResult {
  ok: boolean;
  reasons?: string[];
}

// Gateway surface used by core (type-only in core)
export interface SecurityGateway {
  audit(entry: AuditEntry): void;
  evaluate(target: string, ctx: SecurityContext): boolean;
  evaluateWithPolicy(target: string, ctx: SecurityContext, policyId: string): boolean;
  getAuditLog(): AuditEntry[];
  setContextDefaults(defaults: Partial<SecurityContext>): void;
  auditPlugin(plugin: { name: string; version?: string; requiredCapabilities?: string[] }): ValidationResult;
}
