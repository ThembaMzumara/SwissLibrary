/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

// VDOM types barrel
import type { SwissComponent } from '../../component/component.js';

export type VNode = string | VElement | ComponentVNode;

export type ComponentType = (new (props: Record<string, unknown>) => SwissComponent) | ((props: Record<string, unknown>) => VNode);

export interface VNodeBase {
  type: string | ComponentType | symbol;
  props: Record<string, unknown>;
  children: VNode[];
  key?: string | number;
  dom?: HTMLElement | Text;
  ssrId?: string;
  parent?: VNode;
  ssrState?: Record<string, unknown>;
  hydrationId?: string;
}

export interface VElement extends VNodeBase {
  type: string;
}

export interface ComponentVNode extends VNodeBase {
  type: ComponentType;
}
