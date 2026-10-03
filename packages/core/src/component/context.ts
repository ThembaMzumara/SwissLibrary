/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import type { SwissComponent } from './component.js';
// Registry of subscription cleanup functions per component
const __ctxRegistrations: WeakMap<SwissComponent, Set<() => void>> = new WeakMap();

export function cleanupContextSubscriptions(component: SwissComponent): void {
  const fns = __ctxRegistrations.get(component);
  if (!fns) return;
  fns.forEach(fn => {
    try { fn(); } catch { /* noop */ }
  });
  fns.clear();
  __ctxRegistrations.delete(component);
}
export const SwissContext = {
  create: <T>(defaultValue?: T) => {
    const key = Symbol();

    // Optional subscription channel (prototype): enabled when SWISS_CONTEXT_SUBSCRIBE=1
    // Tracks version and subscribers; subscribers are components (any) with last selected values
    const subscribeEnabled = typeof process !== 'undefined' && process.env.SWISS_CONTEXT_SUBSCRIBE === '1';
    let version = 0;
    const subscribers = subscribeEnabled ? new Set<SwissComponent>() : null;
    const selections = subscribeEnabled ? new Map<SwissComponent, { sel: unknown; ver: number }>() : null;
    const selectors = subscribeEnabled ? new WeakMap<SwissComponent, Map<symbol, { selector?: (v: T | undefined) => unknown; equals?: (a: unknown, b: unknown) => boolean }>>() : null;
    let warnedMissingProvider = false;

    const Provider = (value: T) => (component: SwissComponent) => {
      component.provideContext(key, value);
      if (subscribeEnabled && subscribers) {
        version++;
        // Notify subscribers; use selector re-evaluation to avoid unnecessary updates
        subscribers.forEach((sub: SwissComponent) => {
          try {
            const selInfo = selections!.get(sub);
            if (!selInfo) {
              // No cached selection; schedule a conservative update
              if (typeof sub.scheduleUpdate === 'function') sub.scheduleUpdate();
              return;
            }
            // Recompute selected value by invoking Consumer with stored selector if present
            const entry = selectors?.get(sub)?.get(key) || {};
            const selector = entry.selector as ((v: T | undefined) => unknown) | undefined;
            const equals = entry.equals as ((a: unknown, b: unknown) => boolean) | undefined;
            const consumer = Consumer(selector, equals);
            const next = consumer(sub) as unknown;
            const prev = selInfo.sel;
            const isEqual = typeof equals === 'function' ? !!equals(prev, next) : prev === next;
            if (!isEqual) {
              selections!.set(sub, { sel: next, ver: version });
              if (typeof sub.scheduleUpdate === 'function') sub.scheduleUpdate();
            } else {
              selections!.set(sub, { sel: prev, ver: version });
            }
          } catch {
            // Best-effort; ignore subscriber errors
          }
        });
      }
      return component;
    };

    const Consumer = <S = T>(
      select?: (v: T | undefined) => S,
      equals?: (a: S, b: S) => boolean
    ) => (component: SwissComponent): S | T | undefined => {
      // Resolve current value
      const provided = component.useContext(key) as T | undefined;
      let value: S | T | undefined = provided as unknown as S | T | undefined;
      if (typeof select === 'function') {
        value = select(provided) as unknown as S | T | undefined;
      }

      // Default value behavior
      const isMissing = typeof provided === 'undefined';
      if (isMissing && typeof defaultValue !== 'undefined') {
        // Dev warning once per context factory when missing provider
        const inDev = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production');
        if (inDev && !warnedMissingProvider) {
          console.warn('[SwissContext] Consumer resolved to default because no Provider was found for this key.');
          warnedMissingProvider = true;
        }
        value = typeof select === 'function' ? (select(defaultValue) as unknown as S | T | undefined) : (defaultValue as unknown as S | T | undefined);
      }

      // Subscription bookkeeping (prototype)
      if (subscribeEnabled && subscribers && selections && selectors) {
        subscribers.add(component);
        // Persist selector/equality per component+key for recomputation on Provider updates
        if (!selectors.get(component)) {
          selectors.set(component, new Map());
        }
        selectors.get(component)!.set(key, { selector: select as ((v: T | undefined) => unknown) | undefined, equals: equals as ((a: unknown, b: unknown) => boolean) | undefined });
        const prev = selections.get(component);
        if (!prev || prev.ver !== version) {
          selections.set(component, { sel: value as unknown, ver: version });
        }

        // Register cleanup for this component/key
        let set = __ctxRegistrations.get(component);
        if (!set) {
          set = new Set();
          __ctxRegistrations.set(component, set);
        }
        // idempotent unsubscribe for this key
        const unsubscribe = () => {
          subscribers.delete(component);
          selectors.delete(component);
          selections.delete(component);
        };
        set.add(unsubscribe);
      }

      return value;
    };

    return { Provider, Consumer };
  }
};