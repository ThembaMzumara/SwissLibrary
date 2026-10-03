/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import type { VNode } from './vdom.js';

export function patch(parent: HTMLElement, newNode: VNode, oldNode?: VNode, index = 0) {
  if (oldNode === undefined) {
    // Create and append the new node
    parent.appendChild(createDOMElement(newNode));
  } else if (newNode === undefined) {
    // Remove the old node
    if (parent.childNodes[index]) {
      parent.removeChild(parent.childNodes[index]);
    }
  } else if (typeof newNode === 'string' || typeof oldNode === 'string') {
    if (newNode !== oldNode) {
      // Replace text node
      if (parent.childNodes[index]) {
        parent.replaceChild(createDOMElement(newNode), parent.childNodes[index]);
      } else {
        parent.appendChild(createDOMElement(newNode));
      }
    }
  } else if (newNode.type !== oldNode.type) {
    // Replace different types of nodes
    parent.replaceChild(createDOMElement(newNode), parent.childNodes[index]);
  } else {
    // For now, we are just replacing, but this is where diffing would go.
    parent.replaceChild(createDOMElement(newNode), parent.childNodes[index]);
  }
}

export function createDOMElement(vnode: VNode): HTMLElement | Text {
  if (typeof vnode === 'string') {
    return document.createTextNode(vnode);
  }

  const el = document.createElement(vnode.type as string);
  
  // Set props (attributes)
  for (const key in vnode.props) {
    if (key !== 'children') {
      (el as unknown as Record<string, unknown>)[key] = vnode.props[key] as unknown;
    }
  }

  // Create and append children
  vnode.children.forEach(child => {
    el.appendChild(createDOMElement(child));
  });

  return el;
}
