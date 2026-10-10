/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { CAPABILITIES } from '../security/capabilities.js';
import { type VNode, VOID_ELEMENTS } from '../vdom/vdom.js';
import { serializeSignalState } from '../reactivity/signals.js';

export async function renderToString(input: unknown): Promise<string> {
    if (isComponent(input)) {
        return renderComponentToString(input);
    }
    return renderVNodeToString(input as VNode);
}

function renderVNodeToString(vnode: VNode): string {
  // Your existing vdom.ts implementation
  if (typeof vnode === 'string') return escapeHtml(vnode);
  
  if (typeof vnode.type === 'function') {
    return vnode.children.map(renderVNodeToString).join('');
  }

  const { type, props, children } = vnode;
  const tag = type as string;
  const attrs = buildAttributes(props);
  
  if (VOID_ELEMENTS.includes(tag)) {
    return `<${tag}${attrs}>`;
  }

  return `<${tag}${attrs}>${children.map(renderVNodeToString).join('')}</${tag}>`;
}

async function renderComponentToString(component: unknown): Promise<string> {
    if (!isComponent(component)) {
      throw new Error('renderComponentToString called with non-component');
    }
    // 1. Server-side data fetching
    const ctor = (component as { constructor: unknown }).constructor as unknown;
    const gssp = (ctor as { getServerSideProps?: (caps: unknown) => Promise<Record<string, unknown>> }).getServerSideProps;
    if (typeof gssp === 'function') {
      const serverProps = await gssp(CAPABILITIES);
      (component as Record<string, unknown>).props = { ...(component as Record<string, unknown>).props as object, ...serverProps };
    }
  
    // 2. Capability check
    const maybeCheck = (component as Record<string, unknown>).checkCapabilities;
    if (typeof maybeCheck === 'function' && !maybeCheck(CAPABILITIES)) {
      throw new Error('SSR capability check failed');
    }
  
    // 3. Render component
    const serverInit = (component as Record<string, unknown>).serverInit as (props: unknown) => Promise<string>;
    const html = await serverInit((component as Record<string, unknown>).props);
    
    // 4. Serialize state using existing signals implementation
    const state = {
      props: (component as Record<string, unknown>).props,
      signals: serializeSignalState(component as unknown as object)
    };
  
    return `${html}<script id="ssr-state">${JSON.stringify(state)}</script>`;
  }

// Helpers
function isComponent(input: unknown): input is { render: () => unknown } & Record<string, unknown> {
    return Boolean(input) && typeof (input as Record<string, unknown>).render === 'function';
  }

function buildAttributes(props: Record<string, unknown>): string {
  return Object.entries(props || {})
    .filter(([k]) => !['children','key'].includes(k))
    .map(([k, v]) => 
      k === 'className' ? `class="${escapeHtml(String(v))}"` :
      v === true ? k : `${k}="${escapeHtml(String(v))}"`
    ).join(' ');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}