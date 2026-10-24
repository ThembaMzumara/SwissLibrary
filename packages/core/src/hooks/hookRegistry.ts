/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

type Priority = 'low' | 'normal' | 'high' | 'critical';

interface RegisteredHook {
  name: string;
  handler: (...args: unknown[]) => unknown;
  owner: string;
  priority: Priority;
  order: number; // insertion order for stable sort among equal priority
}

const PRIORITY_WEIGHT: Record<Priority, number> = {
  critical: 3,
  high: 2,
  normal: 1,
  low: 0,
};

export class HookRegistry {
  private hooks: Map<string, RegisteredHook[]> = new Map();
  private globalContext: Record<string, unknown> = {};
  private counter = 0;

  addHook(
    hookName: string,
    handler: (...args: unknown[]) => unknown,
    pluginId: string,
    priority: Priority = 'normal'
  ) {
    const list = this.hooks.get(hookName) ?? [];
    list.push({ name: hookName, handler, owner: pluginId, priority, order: this.counter++ });
    this.hooks.set(hookName, list);
  }

  removeHooks(pluginId: string) {
    for (const [name, list] of this.hooks) {
      const next = list.filter(h => h.owner !== pluginId);
      if (next.length === 0) this.hooks.delete(name);
      else this.hooks.set(name, next);
    }
  }

  async callHook(hookName: string, context?: unknown): Promise<void> {
    const list = this.hooks.get(hookName);
    if (!list || list.length === 0) return;
    const payload = { ...(this.globalContext ?? {}), ...(context as object ?? {}) } as unknown;
    const sorted = [...list].sort((a, b) => {
      const pw = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
      if (pw !== 0) return pw;
      return a.order - b.order;
    });
    // Propagate first error to caller (fail fast)
    for (const h of sorted) {
      // Allow both sync and async handlers
      await h.handler(payload);
    }
  }

  hasHook(hookName: string): boolean {
    return (this.hooks.get(hookName)?.length ?? 0) > 0;
  }

  setGlobalContext(context: Record<string, unknown>) {
    this.globalContext = context ?? {};
  }

  getHookSnapshot(): Array<Pick<RegisteredHook, 'name' | 'owner' | 'priority' | 'order'>> {
    const out: Array<Pick<RegisteredHook, 'name' | 'owner' | 'priority' | 'order'>> = [];
    for (const [, list] of this.hooks) {
      for (const h of list) out.push({ name: h.name, owner: h.owner, priority: h.priority, order: h.order });
    }
    return out;
  }
}