/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import type { SwissComponent } from '../component/component.js';
import type { VNode, VElement, ComponentVNode, ComponentType } from "../vdom/vdom.js";

// Enhanced error handling with metadata
class DiffingError extends Error {
  constructor(message: string, public vnode?: VNode) {
    super(message);
    this.name = 'DiffingError';
    // Fixed: Added type-safe captureStackTrace check
    if (typeof (Error as { captureStackTrace?: (a: unknown, b: unknown) => void }).captureStackTrace === 'function') {
      (Error as { captureStackTrace: (a: unknown, b: unknown) => void }).captureStackTrace(this, DiffingError);
    }
  }
}

// Memory-efficient metadata storage
const vnodeMetadata = new WeakMap<Node, VNode>();
const eventListeners = new WeakMap<Element, Map<string, EventListener>>();

// Type guards for robust type handling
function isTextVNode(vnode: VNode): vnode is Extract<VNode, string> {
  return typeof vnode === 'string';
}

function isElementVNode(vnode: VNode): vnode is VElement {
  return typeof vnode === 'object' && vnode !== null && 'type' in vnode && typeof vnode.type === 'string';
}

function isComponentVNode(vnode: VNode): vnode is ComponentVNode {
  return typeof vnode === 'object' && vnode !== null && 'type' in vnode && typeof vnode.type === 'function';
}

function isEventProp(name: string): boolean {
  return name.startsWith('on');
}

function isClassComponent(component: ComponentType): component is new (props: Record<string, unknown>) => SwissComponent {
  return typeof component === 'function' && component.prototype && typeof component.prototype.render === 'function';
}

// Helper functions
function getKey(vnode: VNode, index: number): string | number {
  if (isTextVNode(vnode)) return `text_${index}`;
  if (isElementVNode(vnode) && vnode.key) return vnode.key;
  return index;
}

function canUpdateInPlace(dom: Node, newVNode: VNode, oldVNode?: VNode): boolean {
  if (isTextVNode(newVNode)) {
    return dom.nodeType === Node.TEXT_NODE;
  }
  
  if (isElementVNode(newVNode)) {
    if (dom.nodeType !== Node.ELEMENT_NODE) return false;
    
    const element = dom as HTMLElement;
    if (element.tagName.toLowerCase() !== newVNode.type.toLowerCase()) return false;
    
    const oldKey = oldVNode && isElementVNode(oldVNode) ? oldVNode.key : undefined;
    const newKey = newVNode.key;
    
    if (oldKey !== undefined && newKey !== undefined) {
      return oldKey === newKey;
    }
    
    return true;
  }
  
  return false;
}

function cleanupNode(node: Node) {
  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as HTMLElement;
    const listeners = eventListeners.get(element);
    
    if (listeners) {
      listeners.forEach((listener, event) => {
        element.removeEventListener(event, listener);
      });
      eventListeners.delete(element);
    }
  }
  
  vnodeMetadata.delete(node);
  
  // Clean up children recursively
  Array.from(node.childNodes).forEach(cleanupNode);
}

// Key-based child diffing algorithm
function reconcileChildren(parent: HTMLElement, oldChildren: VNode[], newChildren: VNode[]) {
  const oldChildNodes = Array.from(parent.childNodes);
  
  // Build key maps for efficient lookups
  const oldKeyMap = new Map<string | number, { vnode: VNode; index: number; dom: Node }>();
  const newKeyMap = new Map<string | number, { vnode: VNode; index: number }>();
  
  oldChildren.forEach((vnode, index) => {
    const key = getKey(vnode, index);
    const dom = oldChildNodes[index];
    if (dom) oldKeyMap.set(key, { vnode, index, dom });
  });
  
  newChildren.forEach((vnode, index) => {
    const key = getKey(vnode, index);
    newKeyMap.set(key, { vnode, index });
  });
  
  const processedNodes = new Set<Node>();
  const newDoms: Node[] = [];  // Removed unused nodesToRemove
  
  // First pass: update existing nodes
  newChildren.forEach((newVNode, newIndex) => {
    const key = getKey(newVNode, newIndex);
    const oldEntry = oldKeyMap.get(key);
    
    if (oldEntry) {
      const { dom, vnode: oldVNode } = oldEntry;
      
      if (canUpdateInPlace(dom, newVNode, oldVNode)) {
        updateDOMNode(dom, newVNode);
        processedNodes.add(dom);
        newDoms.push(dom);
      } else {
        const newDom = createDOMNode(newVNode);
        parent.replaceChild(newDom, dom);
        processedNodes.add(newDom);
        newDoms.push(newDom);
      }
    } else {
      const newDom = createDOMNode(newVNode);
      newDoms.push(newDom);
    }
  });
  
  // Second pass: reorder nodes
  newDoms.forEach((dom, newIndex) => {
    const currentDom = parent.childNodes[newIndex];
    if (currentDom !== dom) {
      if (parent.childNodes[newIndex]) {
        parent.insertBefore(dom, parent.childNodes[newIndex]);
      } else {
        parent.appendChild(dom);
      }
    }
  });
  
  // Remove leftover nodes
  oldChildNodes.forEach(node => {
    if (!processedNodes.has(node)) {
      cleanupNode(node);
      parent.removeChild(node);
    }
  });
}

// Hydration implementation with SSR support
export function hydrate(root: VNode, container: HTMLElement) {
  try {
    const stateScript = document.getElementById('ssr-state');
    if (stateScript) {
      const state = JSON.parse(stateScript.textContent || '{}');
      // Assuming deserializeSignalState is defined elsewhere and handles its own errors
      // if (typeof deserializeSignalState === 'function' && state.signals) {
      //   deserializeSignalState(root, state.signals);
      // }
      
      if (typeof root === 'object' && root !== null && 'props' in root) {
        root.props = { ...root.props, ...state.props };
      }
    }

    const islands = container.querySelectorAll('[data-swiss-island]');
    if (islands.length > 0) {
      islands.forEach(island => {
        const key = island.getAttribute('data-swiss-island');
        if (key && typeof root === 'object' && root !== null && 'children' in root && Array.isArray(root.children)) {
          const component = root.children.find(child => 
            typeof child === 'object' && child !== null && 'key' in child && child.key === key
          );
          if (component) {
            hydrateIsland(component, island.parentElement as HTMLElement);
          }
        }
      });
    } else {
      hydrateDOM(root, container.firstChild as Node);
    }
  } catch (e) {
      console.error('Hydration mismatch:', e);
      // Fallback to client render
      container.innerHTML = '';
      renderToDOM(root, container);
    }
}

// Helper function for DOM hydration
export function hydrateDOM(vnode: VNode, domNode: Node): void {
  if (!domNode) {
    console.warn('Hydration failed: DOM node not found for VNode', vnode);
    return;
  }
  vnodeMetadata.set(domNode, vnode);

  if (isTextVNode(vnode)) {
    hydrateTextNode(vnode, domNode);
  } else if (isElementVNode(vnode)) {
    hydrateElementNode(vnode, domNode as HTMLElement);
  } else if (isComponentVNode(vnode)) {
    hydrateComponentNode(vnode, domNode as HTMLElement);
  }
}

// 5. Partial hydration implementation (additive)
function hydrateIsland(component: VNode, container: HTMLElement): void {
  // Island-specific hydration logic
  // Islands are interactive components that hydrate independently
  
  try {
    // Find the island boundary markers
    const islandStart = container.querySelector('[data-island-start]');
    const islandEnd = container.querySelector('[data-island-end]');
    
    if (islandStart && islandEnd) {
      // Hydrate only the content between markers
      const islandContent = islandStart.nextSibling;
      if (islandContent) {
        hydrateDOM(component, islandContent);
      }
    } else {
      // No island markers found, hydrate the entire container
      if (container.firstChild) {
        hydrateDOM(component, container.firstChild);
      } else {
        // No existing DOM, render the component
        renderToDOM(component, container);
      }
    }
    
    // Mark island as hydrated
    container.setAttribute('data-island-hydrated', 'true');
    
  } catch (error) {
    console.error('Island hydration failed:', error);
    // Fallback to client-side rendering
    container.innerHTML = '';
    renderToDOM(component, container);
  }
}

function hydrateTextNode(vnode: string, domNode: Node) {
  if (domNode.nodeType !== Node.TEXT_NODE || domNode.textContent !== vnode) {
    domNode.textContent = vnode;
  }
  vnodeMetadata.set(domNode, vnode as unknown as VNode);
}

function hydrateElementNode(vnode: VElement, domNode: HTMLElement) {
  if (domNode.tagName.toLowerCase() !== vnode.type.toLowerCase()) {
    throw new DiffingError(`Element type mismatch: expected ${vnode.type}, got ${domNode.tagName}`);
  }
  
  // SSR ID validation
  if (vnode.ssrId && domNode.dataset.ssrId !== vnode.ssrId) {
    console.warn(`SSR ID mismatch: expected ${vnode.ssrId}, found ${domNode.dataset.ssrId}`);
  }
  
  vnodeMetadata.set(domNode, vnode);
  
  // Hydrate properties
  const oldProps = {};
  reconcileProps(domNode, oldProps, vnode.props || {});
  
  // Hydrate children
  const domChildren = Array.from(domNode.childNodes);
  const newVChildren = vnode.children || [];
  
  newVChildren.forEach((child, index) => {
    const domChild = domChildren[index];
    if (domChild) {
      hydrateDOM(child, domChild);
    } else {
      const newDom = createDOMNode(child);
      domNode.appendChild(newDom);
    }
  });
  
  // Remove extra nodes
  for (let i = newVChildren.length; i < domChildren.length; i++) {
    domNode.removeChild(domChildren[i]);
  }
}

function hydrateComponentNode(vnode: ComponentVNode, domNode: HTMLElement) {
const rendered = renderComponent(vnode);
hydrateDOM(rendered, domNode);
}

// DOM node creation with error boundaries
function createDOMNode(vnode: VNode): Node {
  try {
    if (isTextVNode(vnode)) {
      return createTextNode(vnode);
    } else if (isElementVNode(vnode)) {
      return createElementNode(vnode);
    } else if (isComponentVNode(vnode)) {
      const rendered = renderComponent(vnode);
      return createDOMNode(rendered);
    }
    throw new DiffingError('Unsupported VNode type');
  } catch (error) {
    console.error('DOM creation error:', error);
    const createErrorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new DiffingError(`DOM creation failed: ${createErrorMessage}`, vnode);
  }
}

function createTextNode(vnode: string): Text {
  const node = document.createTextNode(vnode);
  vnodeMetadata.set(node, vnode as unknown as VNode);
  return node;
}

function createElementNode(vnode: VElement): HTMLElement {
  const element = document.createElement(vnode.type);
  vnodeMetadata.set(element, vnode);
  
  // Set initial properties
  reconcileProps(element, {}, vnode.props || {});
  
  // Create children
  (vnode.children || []).forEach(child => {
    element.appendChild(createDOMNode(child));
  });
  
  return element;
}

// Component rendering with error boundaries
function renderComponent(vnode: ComponentVNode): VNode {
  try {
    const Component = vnode.type;
    const props = { ...vnode.props, children: vnode.children };
    
    if (typeof Component === 'function') {
      if (isClassComponent(Component)) {
        // Class component
        const instance = new Component(props);
        return instance.render();
      } else {
        // Functional component
        return Component(props);
      }
    }
    
    throw new DiffingError('Unsupported component type');
  } catch (error) {
    console.error('Component rendering error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return createErrorBoundary(`Component error: ${errorMessage}`);
  }
}

// Primary render function
export function renderToDOM(vnode: VNode, container: HTMLElement) {
  try {
    if (typeof vnode === 'object' && vnode !== null && 'dom' in vnode && vnode.dom && vnode.dom.parentNode === container) {
      updateDOMNode(vnode.dom, vnode);
    } else {
      container.innerHTML = '';
      const domNode = createDOMNode(vnode);
      container.appendChild(domNode);
      if (typeof vnode === 'object' && vnode !== null && 'dom' in vnode) {
        (vnode as { dom: Node }).dom = domNode;
      }
    }
  } catch (error) {
    console.error('Render error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new DiffingError(`Rendering failed: ${errorMessage}`, vnode);
  }
}

function updateDOMNode(dom: Node, vnode: VNode) {
  try {
    const oldVNode = vnodeMetadata.get(dom);

    if (isTextVNode(vnode)) {
      updateTextNode(dom as Text, vnode);
    } else if (isElementVNode(vnode)) {
      updateElementNode(dom as HTMLElement, vnode, oldVNode);
    } else if (isComponentVNode(vnode)) {
      updateComponentNode(dom as HTMLElement, vnode, oldVNode);
    }

    vnodeMetadata.set(dom, vnode);
    if (typeof vnode === 'object' && vnode !== null && 'dom' in vnode) {
      (vnode as { dom: Node }).dom = dom;
    }
  } catch (error) {
    console.error('DOM update error:', error);
    const updateErrorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new DiffingError(`DOM update failed: ${updateErrorMessage}`, vnode);
  }
}

function updateTextNode(dom: Text, vnode: string) {
  if (dom.textContent !== vnode) {
    dom.textContent = vnode;
  }
}

function updateElementNode(dom: HTMLElement, vnode: VElement, oldVNode?: VNode) {
  // Handle oldProps safely
  let oldProps: Record<string, unknown> = {};
  let oldChildren: VNode[] = [];

  if (oldVNode !== undefined) {
      if (isElementVNode(oldVNode)) {
          oldProps = oldVNode.props || {};
          oldChildren = oldVNode.children || [];
      }
      // Else: oldVNode exists but isn't an element VNode -> use defaults
  }
  // Else: oldVNode is undefined -> use defaults

  const newProps = vnode.props || {};
  const newChildren = vnode.children || [];

  reconcileProps(dom, oldProps, newProps);
  reconcileChildren(dom, oldChildren, newChildren);
}

function updateComponentNode(dom: HTMLElement, vnode: ComponentVNode, oldVNode?: VNode) {
  // Check if oldVNode exists and is the same component type
  if (oldVNode && isComponentVNode(oldVNode) && oldVNode.type === vnode.type) {
    // Component update logic
    const oldRendered = vnodeMetadata.get(dom);
    const newRendered = renderComponent(vnode);
    
    if (canUpdateInPlace(dom, newRendered, oldRendered)) {
      updateDOMNode(dom, newRendered);
    } else {
      const newDom = createDOMNode(newRendered);
      dom.parentNode?.replaceChild(newDom, dom);
      cleanupNode(dom);
    }
  } else {
    // Component replacement logic
    const newRendered = renderComponent(vnode);
    const newDom = createDOMNode(newRendered);
    dom.parentNode?.replaceChild(newDom, dom);
    cleanupNode(dom);
  }
}

// Property reconciliation with optimized updates
function reconcileProps(element: HTMLElement, oldProps: Record<string, unknown>, newProps: Record<string, unknown>) {
  const allKeys = new Set([...Object.keys(oldProps), ...Object.keys(newProps)]);
  
  allKeys.forEach(key => {
    if (key === 'children' || key === 'key') return;
    
    const oldValue = oldProps[key];
    const newValue = newProps[key];
    
    if (oldValue === newValue) return;
    
    try {
      if (key.startsWith('on')) {
        updateEventListener(element, key, oldValue, newValue);
      } else if (key === 'className') {
        updateClassName(element, newValue);
      } else if (key === 'style') {
        updateStyle(element, key, oldValue, newValue);
      } else if (key in element && !isEventProp(key)) {
        updateProperty(element, key, oldValue, newValue);
      } else {
        updateAttribute(element, key, newValue);
      }
    } catch (error) {
      console.warn(`Property update error for "${key}":`, error);
    }
  });
}

function updateEventListener(element: HTMLElement, key: string, oldHandler: unknown, newHandler: unknown) {
  const eventName = key.substring(2).toLowerCase();
  let listenerMap = eventListeners.get(element);
  
  if (!listenerMap) {
    listenerMap = new Map();
    eventListeners.set(element, listenerMap);
  }
  
  const existingHandler = listenerMap.get(eventName);
  if (existingHandler) {
    element.removeEventListener(eventName, existingHandler);
  }
  
  if (typeof newHandler === 'function') {
    const listener = newHandler as EventListener;
    element.addEventListener(eventName, listener);
    listenerMap.set(eventName, listener);
  } else {
    listenerMap.delete(eventName);
  }
}

function updateClassName(element: HTMLElement, value: unknown) {
  if (Array.isArray(value)) {
    element.className = value.filter(Boolean).join(' ');
  } else if (typeof value === 'object' && value !== null) {
    element.className = Object.keys(value)
      .filter(key => (value as Record<string, unknown>)[key])
      .join(' ');
  } else {
    element.className = (value as string) || '';
  }
}

function updateStyle(element: HTMLElement, name: string, oldValue: unknown, newValue: unknown) {
  // Clear old styles
  if (oldValue && typeof oldValue === 'object') {
    Object.keys(oldValue).forEach(prop => {
      if (!newValue || (newValue as Record<string, unknown>)[prop] === undefined) {
        (element.style as unknown as Record<string, string>)[prop] = '';
      }
    });
  }
  
  // Apply new styles
  if (newValue && typeof newValue === 'object') {
    Object.assign(element.style, newValue);
  } else if (typeof newValue === 'string') {
    element.style.cssText = newValue;
  }
}



function updateProperty(element: HTMLElement, name: string, oldValue: unknown, newValue: unknown) {
  if (oldValue !== newValue) {
    (element as unknown as Record<string, unknown>)[name] = newValue === null ? '' : newValue;
  }
}

function updateAttribute(element: HTMLElement, key: string, value: unknown) {
  if (value == null || value === false) {
    element.removeAttribute(key);
  } else {
    element.setAttribute(key, value === true ? '' : String(value));
  }
}

// Helper functions
// Error boundary implementation
function createErrorBoundary(message: string): VElement {
  return {
    type: 'div',
    props: { className: 'error-boundary' },
    children: [
      {
        type: 'span',
        props: {},
        children: [`Error: ${message}`]
      },
      {
        type: 'button',
        props: { 
          onClick: () => window.location.reload(),
          className: 'retry-button'
        },
        children: ['Retry']
      }
    ]
  };
}

// Development utilities
export const devTools = {
  logVNode(vnode: VNode) {
    if ((globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV === 'development') {
      console.log('[VDOM]', vnode);
    }
  },
  warn(message: string, vnode?: VNode) {
    if ((globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV === 'development') {
      console.warn(`[SwissJS] ${message}`, vnode);
    }
  }
};

// Performance monitoring
export const performanceMonitor = {
  onRenderStart: () => performance.mark('render-start'),
  onRenderEnd: () => {
    performance.mark('render-end');
    performance.measure('render', 'render-start', 'render-end');
  },
  onHydrationStart: () => performance.mark('hydrate-start'),
  onHydrationEnd: () => {
    performance.mark('hydrate-end');
    performance.measure('hydrate', 'hydrate-start', 'hydrate-end');
  }
};