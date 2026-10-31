/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { type VNode } from '../vdom/vdom.js';
import { reactive } from '../reactivity/reactive.js';
import { type ContextMap, type BaseComponentProps, type BaseComponentState } from './types/index.js';
import { LifecycleManager } from './lifecycle.js';

export class BaseComponent<P extends BaseComponentProps = BaseComponentProps, S extends BaseComponentState = BaseComponentState> {
  public static requires: string[] = [];
  public static contextType?: symbol;
  public static isErrorBoundary: boolean = false;
  
  public props: P;
  public state: S;
  public context: ContextMap;
  
  protected _lifecycle: LifecycleManager;
  protected _isMounted: boolean = false;
  protected _isServer: boolean = typeof window === 'undefined';
  protected _container: HTMLElement | null = null;
  protected _vnode: VNode | null = null;
  protected _errorHandlingPhase: boolean = false;
  
  constructor(props: P) {
    this.props = props;
    this.state = reactive({} as S) as S;
    this.context = new Map();
    this._lifecycle = new LifecycleManager();
  }
  
  // Basic lifecycle methods that can be overridden
  public handleMount(): void {}
  public handleUpdate(): void {}
  public handleDestroy(): void {}
  
  // Error handling methods
  public captureError(error: unknown, phase: string): void {
    console.error(`[Swiss] Error in ${phase}:`, error);
  }
  
  public resetErrorBoundary(): void {
    // Default implementation
  }
  
  // State management
  setState(updater: (state: S) => Partial<S>): void {
    const newState = updater(this.state);
    Object.assign(this.state, newState);
  }
  
  // Context methods
  public setContext(key: symbol, value: unknown): void {
    this.context.set(key, value);
  }
  
  public getContext<T>(key: symbol): T | undefined {
    return this.context.get(key) as T;
  }
}
