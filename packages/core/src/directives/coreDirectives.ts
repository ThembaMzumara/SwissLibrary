/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import type { SwissDirectiveHandler } from './types/index.js';

// Core directive implementations
export const coreDirectiveHandlers: Record<string, SwissDirectiveHandler> = {
  // Conditional rendering
  if: (el, binding, context) => {
    if (!binding.value) {
      el.remove();
    } else if (!el.parentNode) {
      const comp = (context as { component?: Record<string, unknown> }).component as unknown;
      const host = comp && (comp as { $el?: HTMLElement }).$el;
      if (host instanceof HTMLElement) {
        host.insertAdjacentElement('beforeend', el);
      }
    }
  },
  // List rendering
  for: (el, binding, context) => {
    const items = Array.isArray(binding.value) ? binding.value : [] as unknown[];
    const template = el.cloneNode(true);
    el.innerHTML = '';
    items.forEach((item: unknown) => {
      const clone = template.cloneNode(true) as HTMLElement;
      // Apply item context (simplified)
      clone.textContent = (clone.textContent ?? '').replace(/\{\{.*?\}\}/g, match => {
        return match.replace(/\w+/, m => {
          const recItem = (item as Record<string, unknown>) || {};
          const comp = (context as { component?: Record<string, unknown> }).component || {};
          const v = recItem[m];
          return String(v ?? comp[m] ?? '');
        });
      });
      el.appendChild(clone);
    });
  },
  // Data binding
  bind: (el, binding, context) => {
    const comp = (context as { component?: Record<string, unknown> }).component as Record<string, unknown> | undefined;
    const prop = comp ? Object.getOwnPropertyDescriptor(comp, binding.expression) : undefined;
    if (prop && prop.set) {
      // Two-way binding implementation
      if (el.tagName === 'INPUT') {
        (el as HTMLInputElement).value = String(binding.value ?? '');
        el.addEventListener('input', (e) => {
          if (comp) {
            prop!.set!.call(comp, (e.target as HTMLInputElement).value);
          }
        });
      } else {
        el.textContent = String(binding.value ?? '');
      }
    }
  }
};

// Fast-path check for core directives
export const isCoreDirective = (name: string): boolean => 
  Object.prototype.hasOwnProperty.call(coreDirectiveHandlers, name); 