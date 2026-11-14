/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import type { Plugin } from '@swissjs/core';

export interface HarnessResult {
  loaded: boolean;
  activated: boolean;
  errors: string[];
}

/**
 * Minimal PDK harness to exercise a plugin's lifecycle shape in isolation.
 * This does not boot the full framework; it validates the object shape and
 * invokes optional lifecycle methods if present.
 */
export async function runPluginHarness(plugin: Partial<Plugin>): Promise<HarnessResult> {
  const errors: string[] = [];
  let loaded = false;
  let activated = false;

  try {
    // Validate minimal shape
    if (!plugin) throw new Error('Plugin is undefined');

    // init
    if (typeof plugin.init === 'function') {
      try { await plugin.init({} as any); } catch (e) { errors.push(`init failed: ${String((e as Error)?.message || e)}`); }
    }

    // load
    if (typeof (plugin as any).load === 'function') {
      try { await (plugin as any).load({} as any); loaded = true; } catch (e) { errors.push(`load failed: ${String((e as Error)?.message || e)}`); }
    } else {
      loaded = true; // consider loaded if no load hook
    }

    // activate
    if (typeof (plugin as any).activate === 'function') {
      try { await (plugin as any).activate({} as any); activated = true; } catch (e) { errors.push(`activate failed: ${String((e as Error)?.message || e)}`); }
    } else {
      activated = true; // consider activated if no activate hook
    }
  } catch (e) {
    errors.push(`harness error: ${String((e as Error)?.message || e)}`);
  }

  return { loaded, activated, errors };
}
