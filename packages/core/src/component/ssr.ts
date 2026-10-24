/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import type { VNode } from '../vdom/vdom.js';
import { hydrateDOM, renderToDOM } from '../renderer/renderer.js';
import { SwissComponent } from './component.js';
import type { BaseComponentProps } from './types/index.js';
import { effect } from '../reactivity/reactive.js';
import { renderToString } from '../renderer/unified-renderer.js';

export async function serverInit(this: typeof SwissComponent, props: BaseComponentProps): Promise<string> {
  const instance = new this(props, { isServer: true });
  await instance.executeHookPhase('init');
  await instance.validateCapabilities();
  await instance.loadPlugins();
  
  // Generate SSR ID for hydration matching
  const ssrId = `swiss-${Math.random().toString(36).substr(2, 9)}`;
  const vnode = instance.render();
  addSsrIds(vnode, ssrId);
  
  return renderToString(vnode);
}

// Recursively add SSR IDs to VNode tree
function addSsrIds(vnode: VNode, baseId: string, index: number = 0) {
  if (typeof vnode !== 'string') {
    vnode.ssrId = `${baseId}-${index}`;
    vnode.children.forEach((child, i) => {
      addSsrIds(child, `${baseId}-${index}`, i);
    });
  }
}

export function hydrate(this: SwissComponent, container: HTMLElement, existingDOM: HTMLElement) {
  this._container = container;
  this.executeHookPhase('mount');
  
  const vnode = this.render();
  hydrateDOM(vnode, existingDOM);
  this._vnode = vnode;
  
  // Set up effect-based reactivity after hydration
  const disposer = effect(() => {
    const newVNode = this.render();
    renderToDOM(newVNode, this._container as HTMLElement);
    this._vnode = newVNode;
  });
  
  this.trackEffect(disposer);
}

// 4. Partial hydration markers (additive)
export function markIsland(component: unknown) {
  if (component && typeof component === 'object') {
    (component as Record<string, unknown>).__hydrate = 'island';
  }
}