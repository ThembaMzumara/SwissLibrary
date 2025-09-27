/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

// Unique ID generator for SSR hydration markers
let lastId = 0;
const PREFIX = 'swiss-';

/**
 * Generates a unique SSR ID for hydration markers
 * @param componentName - Optional component name for debugging
 * @returns Unique hydration ID string
 */
export function generateSSRId(componentName?: string): string {
  const id = `${PREFIX}${lastId++}`;
  return componentName ? `${id}-${componentName}` : id;
}

// Local interface to avoid circular dependency with SwissComponent
interface ComponentLike {
  parent?: ComponentLike;
  constructor: {
    name: string;
  };
}

// Local interface to avoid circular dependency with VNode
interface VNodeLike {
  parent?: VNodeLike;
  children: VNodeLike[];
}

/**
 * Generates a stable SSR ID based on component hierarchy
 * @param component - Component instance
 * @returns Stable hierarchical ID string
 */
export function generateStableSSRId(component: ComponentLike): string {
  const parts: string[] = [];
  let current: ComponentLike | undefined = component;
  while (current) {
    const name = current.constructor.name || 'Anonymous';
    parts.unshift(name);
    current = current.parent;
  }
  return `${PREFIX}${parts.join('-')}-${lastId++}`;
}

/**
 * Generates SSR IDs for VDOM nodes
 * @param node - Virtual DOM node
 * @returns ID string with position markers
 */
export function generateVNodeSSRId(node: VNodeLike): string {
  const path: number[] = [];
  let current: VNodeLike | undefined = node;
  while (current && current.parent) {
    const index = current.parent.children.indexOf(current as VNodeLike);
    path.unshift(index);
    current = current.parent;
  }
  return `${PREFIX}${path.join('-')}-${lastId++}`;
}