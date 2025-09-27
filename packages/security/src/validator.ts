/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import type { SecurityContext, SecurityPolicy, ValidationResult } from './types.js';

/**
 * Simple policy validator helpers.
 */
export const SecurityValidator = {
  validatePolicy(policy: SecurityPolicy): ValidationResult {
    const reasons: string[] = [];
    if (!policy.id) reasons.push('missing_id');
    if (!policy.target) reasons.push('missing_target');
    if (policy.rateLimitPerMinute !== undefined && policy.rateLimitPerMinute < 0) {
      reasons.push('invalid_rate_limit');
    }
    if (policy.roles && !Array.isArray(policy.roles)) reasons.push('invalid_roles');
    if (policy.permissions && !Array.isArray(policy.permissions)) reasons.push('invalid_permissions');
    return { ok: reasons.length === 0, reasons: reasons.length ? reasons : undefined };
  },

  canAccess(policy: SecurityPolicy, ctx: SecurityContext): boolean {
    // roles check
    if (policy.roles && policy.roles.length) {
      const roles = ctx.roles ?? [];
      if (!roles.some(r => policy.roles!.includes(r))) return false;
    }
    // permissions check
    if (policy.permissions && policy.permissions.length) {
      const perms = ctx.permissions ?? [];
      if (!perms.some(p => policy.permissions!.includes(p))) return false;
    }
    // custom predicate
    if (policy.predicate && !policy.predicate(ctx)) return false;
    return true;
  }
};
