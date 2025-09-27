/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import type { VNode, VNodeBase, ComponentType, VElement, ComponentVNode } from './types/index.js';
export type { VNode, VNodeBase, ComponentType, VElement, ComponentVNode } from './types/index.js';
import { renderToString } from '../renderer/unified-renderer.js';
export { renderToString } from '../renderer/unified-renderer.js';

export const VOID_ELEMENTS = [
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 
  'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'
];

function generateSSRId() {
  return Math.random().toString(36).slice(2);
}


// Types moved to vdom/types barrel

// Create VNode with SSR metadata (additive)
export function createVNode(type: string, props: Record<string, unknown>, ...children: VNode[]): VElement;
export function createVNode(type: ComponentType, props: Record<string, unknown>, ...children: VNode[]): ComponentVNode;
export function createVNode(type: symbol, props: Record<string, unknown>, ...children: VNode[]): VNode;
export function createVNode(
  type: string | ComponentType | symbol,
  props: Record<string, unknown> | null | undefined,
  ...children: VNode[]
): VNode {
  const finalProps: Record<string, unknown> = props || ({} as Record<string, unknown>);
  const vnode: VNodeBase = {
    type,
    props: finalProps,
    children,
    ssrState: (finalProps && finalProps.__ssrState ? finalProps.__ssrState : {}) as Record<string, unknown>,
    hydrationId: finalProps && finalProps.__island ? generateSSRId() : undefined,
  };

  // Non-enumerable toString to avoid circular JSON issues
  Object.defineProperty(vnode, 'toString', {
    value: function() { return renderToString(this as VNode); },
    enumerable: false,
  });

  return vnode as VNode;
}

export { createVNode as createElement };

export const Fragment = Symbol('Fragment');

export function jsx(type: ComponentType | string, props: Record<string, unknown>, key?: string | number): VNode {
  const { children, ...restProps } = props;
  const childNodes = children === undefined ? [] : (Array.isArray(children) ? children : [children]);

  if (typeof type === 'string') {
    return createVNode(type, { ...restProps, key }, ...childNodes as VNode[]);
  }
  return createVNode(type, { ...restProps, key }, ...childNodes as VNode[]);
}

export function jsxs(type: ComponentType | string, props: Record<string, unknown>, key?: string | number): VNode {
  const { children, ...restProps } = props;
  const childNodes = Array.isArray(children) ? children : [];

  if (typeof type === 'string') {
    return createVNode(type, { ...restProps, key }, ...childNodes as VNode[]);
  }
  return createVNode(type, { ...restProps, key }, ...childNodes as VNode[]);
}