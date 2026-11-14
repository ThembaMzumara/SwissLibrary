/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { describe, it, expect } from 'vitest';
import { InMemorySecurityEngine } from '../engine.js';
import type { SecurityPolicy } from '../types.js';

describe('@swissjs/security engine', () => {
  it('allows when no policy denies', () => {
    const eng = new InMemorySecurityEngine();
    const ok = eng.evaluate('storage:read', { layer: 'runtime' });
    expect(ok).toBe(true);
  });

  it('enforces role requirement', () => {
    const eng = new InMemorySecurityEngine();
    const policy: SecurityPolicy = { id: 'storage:*', target: 'storage:*', roles: ['admin'] };
    eng.registerPolicy(policy);

    const denied = eng.evaluate('storage:write', { layer: 'runtime', roles: ['user'] });
    const allowed = eng.evaluate('storage:write', { layer: 'runtime', roles: ['admin'] });

    expect(denied).toBe(false);
    expect(allowed).toBe(true);

    const log = eng.getAuditLog();
    expect(log.length).toBeGreaterThan(0);
  });
});
