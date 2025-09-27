/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { describe, it, expect } from 'vitest';
import { PluginManager } from '../plugins/pluginManager.js';

describe('Hooks across multiple plugins', () => {
  it('respects priority across multiple plugins (stable within same priority)', async () => {
    const pm = new PluginManager();
    const reg = pm.getHookRegistry();

    const calls: string[] = [];
    // simulate plugin A and B by id in handler labels
    reg.addHook('multi:order', () => { calls.push('A:critical'); }, 'plugin-A', 'critical');
    reg.addHook('multi:order', () => { calls.push('B:high'); }, 'plugin-B', 'high');
    reg.addHook('multi:order', () => { calls.push('A:normal-1'); }, 'plugin-A', 'normal');
    reg.addHook('multi:order', () => { calls.push('B:normal-2'); }, 'plugin-B', 'normal');
    reg.addHook('multi:order', () => { calls.push('A:low'); }, 'plugin-A', 'low');

    await reg.callHook('multi:order');

    expect(calls).toEqual([
      'A:critical',
      'B:high',
      'A:normal-1',
      'B:normal-2',
      'A:low',
    ]);
  });

  it('halts on first error and emits securityError once (simulated)', async () => {
    const pm = new PluginManager();
    const reg = pm.getHookRegistry();

    const calls: string[] = [];
    let securityEvents = 0;

    // Observe securityError (simulated emission on violation)
    reg.addHook('securityError', () => { securityEvents += 1; }, 'observer', 'normal');

    reg.addHook('multi:violate', () => { calls.push('before'); }, 'plugin-A', 'high');
    reg.addHook('multi:violate', () => { throw new Error('boom'); }, 'plugin-B', 'normal');
    reg.addHook('multi:violate', () => { calls.push('after'); }, 'plugin-A', 'low');

    await expect(reg.callHook('multi:violate')).rejects.toThrow('boom');
    // simulate core behavior: emit securityError on violation
    await reg.callHook('securityError', { reason: 'violation', hook: 'multi:violate' });

    expect(calls).toEqual(['before']);
    expect(securityEvents).toBe(1);
  });
});
