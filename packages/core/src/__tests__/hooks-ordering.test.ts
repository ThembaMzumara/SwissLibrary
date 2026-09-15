/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { describe, it, expect } from 'vitest';
import { PluginManager } from '../plugins/pluginManager.js';

describe('HookRegistry ordering and error propagation', () => {
  it('calls hooks by priority then insertion order', async () => {
    const pm = new PluginManager();
    const reg = pm.getHookRegistry();

    const calls: string[] = [];
    reg.addHook('test:order', () => { calls.push('low-1'); }, 'p-low-1', 'low');
    reg.addHook('test:order', () => { calls.push('normal-1'); }, 'p-normal-1', 'normal');
    reg.addHook('test:order', () => { calls.push('high-1'); }, 'p-high-1', 'high');
    reg.addHook('test:order', () => { calls.push('critical-1'); }, 'p-critical-1', 'critical');
    // Same priority, ensure insertion order is stable
    reg.addHook('test:order', () => { calls.push('normal-2'); }, 'p-normal-2', 'normal');

    await reg.callHook('test:order', { foo: 'bar' });

    expect(calls).toEqual([
      'critical-1', // highest priority first
      'high-1',     // then high
      'normal-1',   // then normals in insertion order
      'normal-2',
      'low-1',
    ]);
  });

  it('propagates first error and stops subsequent handlers', async () => {
    const pm = new PluginManager();
    const reg = pm.getHookRegistry();

    const calls: string[] = [];
    reg.addHook('test:error', () => { calls.push('before'); }, 'p-a', 'high');
    reg.addHook('test:error', () => { throw new Error('boom'); }, 'p-b', 'normal');
    reg.addHook('test:error', () => { calls.push('after'); }, 'p-c', 'low');

    await expect(reg.callHook('test:error')).rejects.toThrow('boom');
    expect(calls).toEqual(['before']); // ensure 'after' did not run
  });
});
