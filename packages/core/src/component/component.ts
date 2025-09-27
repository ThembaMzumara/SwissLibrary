/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { renderToDOM } from '../renderer/renderer.js';
import { type VNode, createElement, Fragment } from '../vdom/vdom.js';
import { reactive, effect, type EffectDisposer } from '../reactivity/reactive.js';
import { type SwissComponentOptions, type SwissErrorInfo, type ComponentHook } from './types/index.js';
import { LifecycleManager } from './lifecycle.js';
import { SwissContext, cleanupContextSubscriptions } from './context.js';
import { createPortal, useSlot } from './portals.js';
import { serverInit, hydrate as hydrateSSR } from './ssr.js';
import { renderToString } from '../vdom/vdom.js';
import { framework } from '../framework.js';
import { onMount, onUpdate, onDestroy, applyDecoratorMetadata } from './decorators.js';
import { BaseComponent } from './base-component.js';
import { type BaseComponentProps, type BaseComponentState } from './types/index.js';
import type { Plugin, PluginContext } from '../plugins/pluginInterface.js';
import { FenestrationRegistry, type FenestrationContext } from '../fenestration/registry.js';
import { getDevtoolsBridge, isDevtoolsEnabled, isTelemetryEnabled } from '../devtools/bridge.js';
import { getRemediationMessage } from '../error/remediation.js';
import { CapabilityManager } from '../security/capability-manager.js';

export class SwissComponent<P extends BaseComponentProps = BaseComponentProps, S extends BaseComponentState = BaseComponentState> extends BaseComponent<P, S> {
  public static requires: string[] = [];
  public static contextType?: symbol;
  public static isErrorBoundary: boolean = false;
  
  public props: P = {} as P;
  public error: SwissErrorInfo | null = null;
  public plugins: Plugin[] | null = null;
  public element: HTMLElement;
  protected _devtoolsId: string;

  // --- Context Properties ---
  protected _userContext: { id: string; roles: string[] } | undefined = undefined;
  protected _sessionContext: { id: string; permissions: string[] } | undefined = undefined;
  protected _tenantContext: string | undefined = undefined;
  
  // Context provided to plugins
  protected _pluginContext: PluginContext | null = null;
  
  protected _lifecycle: LifecycleManager = new LifecycleManager();
  protected _hooks: ComponentHook[] = [];
  protected _isMounted: boolean = false;
  protected _isServer: boolean = typeof window === 'undefined';
  protected _container: HTMLElement | null = null;
  protected _vnode: VNode | null = null;
  protected _effectDisposers: EffectDisposer[] = [];
  protected _portals: Map<HTMLElement, VNode> = new Map();
  protected _errorHandlingPhase: boolean = false;
  protected _childErrors: Map<SwissComponent, SwissErrorInfo> = new Map();
  protected _slotContent: Map<string, VNode[]> = new Map();
  protected _effects: Set<EffectDisposer> = new Set();
  protected _capabilityCache: Map<string, unknown> = new Map();
  protected updateScheduled: boolean = false;
  
  constructor(props: P, options: SwissComponentOptions = {}) {
    super(props);
    this.element = document.createElement('div');
    // Create a stable devtools ID for this instance (dev-only usage)
    this._devtoolsId = `cmp-${Math.random().toString(36).slice(2)}-${Date.now()}`;
    
    // Apply options
    if (options.plugins) this.plugins = options.plugins;
    
    // Mark as error boundary if specified
    if (options.errorBoundary) {
      (this.constructor as typeof SwissComponent).isErrorBoundary = true;
    }
    
    // Initialize component
    if (!this._isServer) {
          this.initialize();
    }
    
    // Apply decorator metadata (lifecycle, render, etc.)
    applyDecoratorMetadata(this);
        this._pluginContext = this.createPluginContext();

    // Emit mount event will occur in mount(); ID prepared here.
  }

  @onMount()
  public handleMount(): void {
    // Custom mount logic
  }

  @onUpdate()
  public handleUpdate(): void {
    // Custom update logic
  }

  @onDestroy()
  public handleDestroy(): void {
    // Custom destroy logic
  }

  // --- Error Boundary System ---
  
  /**
   * Captures errors from child components
   */
  captureChildError(child: SwissComponent, errorInfo: SwissErrorInfo): boolean {
    if ((this.constructor as typeof SwissComponent).isErrorBoundary && !this.error) {
      this._childErrors.set(child, errorInfo);
      this.error = {
        error: new Error(`Error in child component ${child.constructor.name}`),
        phase: 'render',
        component: this,
        timestamp: Date.now(),
      };
      this.scheduleUpdate();
      return true; // Error handled
    }
    
    if (this._parent) {
      return this._parent.captureChildError(this, errorInfo);
    }
    
    return false; // Error not handled
  }

  /**
   * Resets error state for this component and its children
   */
  resetErrorBoundary(): void {
    if (this.error) {
      this.error = null;
      this._childErrors.clear();
      this.scheduleUpdate();
    }

    // Propagate reset to children
    this._children.forEach(child => {
      if ((child.constructor as typeof SwissComponent).isErrorBoundary) {
        child.resetErrorBoundary();
      }
    });
  }

  /**
   * Handles errors during lifecycle phases
   */
  public captureError(error: unknown, phase: string): void {
    if (this._errorHandlingPhase) return;
    this._errorHandlingPhase = true;

    const errorInfo: SwissErrorInfo = {
      error,
      phase,
      component: this,
      timestamp: Date.now()
    };

    // Log the error
    console.error(`Error in component ${this.constructor.name} during ${phase}:`, error);

    // Devtools: record error with remediation guidance (dev-only)
    if (isDevtoolsEnabled()) {
      try {
        const required = (this.constructor as typeof SwissComponent).requires ?? [];
        const advice = getRemediationMessage(error, phase, this, required);
        // Include component id so inspector can filter per component (legacy)
        getDevtoolsBridge().recordEvent({ t: Date.now(), type: 'error', msg: `${this._devtoolsId}:${advice.message}` });
        // Typed telemetry (opt-in)
        if (isTelemetryEnabled() && getDevtoolsBridge().recordEventTyped) {
          try {
            getDevtoolsBridge().recordEventTyped!({
              t: Date.now(),
              category: 'error',
              name: 'boundary-error',
              componentId: this._devtoolsId,
              data: { message: advice.message, phase }
            });
          } catch { /* ignore */ }
        }
      } catch { /* ignore */ }
    }

    // Find nearest error boundary
    let boundary = this._parent;
    while (boundary && !boundary.captureChildError(this, errorInfo)) {
      boundary = boundary._parent;
    }

    // If no boundary is found, dispatch a global error
    if (!boundary) {
      this.dispatchGlobalError(error, phase);
    }
    
    this._errorHandlingPhase = false;
  }

  /**
   * Global error reporting
   */
  public dispatchGlobalError(error: unknown, phase: string): void {
    const event = new CustomEvent('swiss-error', {
      detail: {
        error,
        phase,
        component: this,
        timestamp: Date.now(),
      },
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(event);
  }

  // --- Lifecycle System ---
  _setupDeclarativeListeners(): void {
    // Implementation placeholder
  }

  public on(phase: string, callback: (...args: unknown[]) => void, options: { 
    once?: boolean; 
    priority?: number; 
    capability?: string 
  } = {}): this {
    this._lifecycle.on(phase, callback, options);
    return this;
  }

  public initialize(): void {
    this.state = reactive(this.state as S) as S;
    this.setupReactivity();
    this.loadPlugins();
    this.validateCapabilities();
  }

  public validateCapabilities(): Promise<void> {
    return Promise.resolve();
  }

  /**
   * Fenestrate - Core capability resolution method for SwissComponent
   * Provides secure, scoped access to capabilities across architectural layers
   * 
   * @param capabilityId - Capability ID to resolve (e.g., 'ui:render', 'data:fetch')
   * @param params - Parameters to pass to the capability
   * @returns Resolved capability result or null if not available
   */
  public fenestrate<T>(capabilityId: string, ...params: unknown[]): T | null {
    try {
      if (this._capabilityCache.has(capabilityId)) {
        return this._capabilityCache.get(capabilityId) as T;
      }

      const context: FenestrationContext = {
        component: this,
        user: this._userContext,
        session: this._sessionContext,
        tenant: this._tenantContext,
        layer: 'component',
        requiredCapabilities: (this.constructor as typeof SwissComponent).requires,
      };

      const result = FenestrationRegistry.pierce<T>(capabilityId, context, ...params);
      if (result.success) {
        this._capabilityCache.set(capabilityId, result.data);
        return result.data ?? null;
      }
      this.captureError(new Error(result.error), `fenestrate:${capabilityId}`);
      return null;
    } catch (error) {
      this.captureError(error as Error, `fenestrate:${capabilityId}`);
      return null;
    }
  }

  /**
   * Async version of fenestrate for capabilities that require async resolution
   * 
   * @param capabilityId - Capability ID to resolve
   * @param params - Parameters to pass to the capability
   * @returns Promise resolving to capability result or null
   */
  public async fenestrateAsync<T>(
    capabilityId: string,
    ...params: unknown[]
  ): Promise<T | null> {
    try {
      if (this._capabilityCache.has(capabilityId)) {
        return this._capabilityCache.get(capabilityId) as T;
      }

      const context: FenestrationContext = {
        component: this,
        user: this._userContext,
        session: this._sessionContext,
        tenant: this._tenantContext,
        layer: 'component',
        requiredCapabilities: (this.constructor as typeof SwissComponent).requires,
      };

      const result = await FenestrationRegistry.pierceAsync<T>(
        capabilityId,
        context,
        ...params
      );
      if (result.success) {
        this._capabilityCache.set(capabilityId, result.data);
        return result.data ?? null;
      }
      this.captureError(new Error(result.error), `fenestrateAsync:${capabilityId}`);
      return null;
    } catch (error) {
      this.captureError(error as Error, `fenestrateAsync:${capabilityId}`);
      return null;
    }
  }

  public async loadPlugins(): Promise<void> {
    if (!this.plugins) return;
    for (const plugin of this.plugins) {
      if (plugin.init) {
        await plugin.init(this._pluginContext as PluginContext);
      }
    }
  }

  public setupReactivity(): void {
    // Setup effect for rendering
    const renderEffect = effect(() => this.performUpdate());
    this.trackEffect(renderEffect);
  }

  public trackEffect(disposer: EffectDisposer): void {
    this._effects.add(disposer);
  }

  public clearEffects(): void {
    this._effects.forEach(disposer => disposer());
    this._effects.clear();
  }

  public async executeHookPhase(phase: string, error?: Error | unknown): Promise<void> {
    await this._lifecycle.executeHookPhase(phase, this, error);
  }

  public performUpdate(): void {
    if (!this._isMounted || !this._container) return;

    try {
      const t0 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      const newVNode = this.safeRender();
      renderToDOM(newVNode, this._container);
      const t1 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      this._vnode = newVNode;
      this.executeHookPhase('updated');
      // Devtools: component updated
      if (isDevtoolsEnabled()) {
        try {
          // TECH-DEBT: Shallow serialization of component state. Replace with a
          // structured serializer that redacts sensitive fields, limits depth,
          // and handles non-serializable values (functions, symbols) deterministically.
          let stateSummary: Record<string, unknown> | undefined;
          try {
            stateSummary = { ...(this.state as unknown as Record<string, unknown>) };
          } catch {
            stateSummary = undefined;
          }
          getDevtoolsBridge().onComponentUpdate({ id: this._devtoolsId, stateSummary });
          // Record render duration for inspector overlay (legacy)
          try {
            const ms = Math.max(0, (t1 as number) - (t0 as number));
            getDevtoolsBridge().recordEvent({ t: Date.now(), type: 'render', msg: `${this._devtoolsId}:${ms}` });
          } catch { /* ignore */ }
          // Typed telemetry (opt-in)
          if (isTelemetryEnabled() && getDevtoolsBridge().recordEventTyped) {
            try {
              const ms = Math.max(0, (t1 as number) - (t0 as number));
              getDevtoolsBridge().recordEventTyped!({
                t: Date.now(),
                category: 'perf',
                name: 'render',
                componentId: this._devtoolsId,
                data: { durationMs: ms }
              });
            } catch { /* ignore */ }
          }
        } catch {
          // ignore devtools errors
        }
      }
    } catch (error) {
      this.captureError(error, 'render');
    }
  }

  /**
   * Wraps render method in error boundary
   */
  public render(): VNode {
    // Base render method, should be overridden by subclasses
    return createElement('div', {}, 'Please implement the render method');
  }

  /**
   * Wraps render method in error boundary
   */
  public safeRender(): VNode {
    if (this.error) {
      return this.renderErrorFallback();
    }

    try {
      // Execute before-render hook
      this.executeHookPhase('beforeRender');
      
      const vnode = this.render();
      
      // Execute after-render hook
      this.executeHookPhase('afterRender');
      
      return vnode;
    } catch (error) {
      this.captureError(error, 'render');
      return this.renderErrorFallback();
    }
  }

  /**
   * Default error fallback UI
   */
  public renderErrorFallback(): VNode {
    return createElement(
      'div',
      { style: 'border: 1px solid red; padding: 10px; color: red;' },
      createElement('h3', {}, 'Component Error'),
      createElement('p', {}, `Phase: ${this.error?.phase || 'N/A'}`),
      createElement('pre', { style: 'white-space: pre-wrap;' }, (this.error?.error instanceof Error ? this.error.error.stack : String(this.error?.error)) || 'No error details available')
    );
  }

  /**
   * Renders children with error boundary support
   */
  public renderWithBoundary(children: VNode[]): VNode {
    return createElement(Fragment, {}, ...children);
  }

  /**
   * Mounts the component to a DOM element
   */
  public mount(container: HTMLElement): void {
    if (this._isMounted) return;

    this._container = container;
    this.executeHookPhase('beforeMount');
    
    this.performUpdate(); // Initial render
    
    this._isMounted = true;
    this.executeHookPhase('mounted');
    // Devtools: component mounted
    if (isDevtoolsEnabled()) {
      try {
        const parentId = (this as unknown as { _parent?: SwissComponent | null })._parent?.['_devtoolsId'] ?? null;
        const consumes = (this.constructor as typeof SwissComponent).requires ?? [];
        const provides = CapabilityManager.getProvidedCapabilities(this.constructor as typeof SwissComponent);
        getDevtoolsBridge().onComponentMount({
          id: this._devtoolsId,
          name: this.constructor.name,
          parentId,
          provides,
          consumes,
        });
        // TECH-DEBT: Ad-hoc event model. Replace with typed DevtoolsEvent categories
        // (component, capability, performance, error) and structured payloads.
        try { getDevtoolsBridge().recordEvent({ t: Date.now(), type: 'mount', msg: this._devtoolsId }); } catch { /* ignore */ }
      } catch {
        // ignore devtools errors
      }
    }
  }

  /**
   * Unmounts the component
   */
  public unmountComponent(): void {
    if (!this._isMounted) return;

    try {
      this.executeHookPhase('beforeUnmount');
      // Devtools: component unmounted
      if (isDevtoolsEnabled()) {
        try { getDevtoolsBridge().onComponentUnmount(this._devtoolsId); } catch { /* ignore */ }
      }
      // Unsubscribe from any context subscriptions registered for this component
      cleanupContextSubscriptions(this);
      
      // Clean up effects, watchers, etc.
      this.clearEffects();
      this._capabilityCache.clear();
      this._children = [];
      this._parent = null;
      
      // DOM removal
      if (this._container?.parentNode) {
        this._container.parentNode.removeChild(this._container);
      }
      
      // Clean portals
      this._portals.forEach((_, container) => {
        container.innerHTML = '';
      });
      
      // Reset state
      this._hooks = [];
      this.state = reactive({} as S) as S;
      this._isMounted = false;
    } catch (error) {
      this.captureError(error, 'destroy');
    }
  }

  public internalHydrate(): Promise<void> {
    return Promise.resolve();
  }

  public internalUnmount(): Promise<void> {
    return Promise.resolve();
  }

  async renderToString() {
    // Before render hook
    await framework.hooks.callHook('beforeComponentRender', {
      component: this
    });
    const html = await this.renderInternal();
    // After render hook
    await framework.hooks.callHook('afterComponentRender', {
      component: this,
      html
    });
    return html;
  }

  async hydrate(element: HTMLElement) {
    // Before mount hook
    await framework.hooks.callHook('beforeComponentMount', {
      component: this,
      element
    });
    await this.internalHydrate();
    // After mount hook
    await framework.hooks.callHook('afterComponentMount', {
      component: this,
      element
    });
  }

  async unmount() {
    // Before unmount hook
    await framework.hooks.callHook('beforeComponentUnmount', {
      component: this
    });
    await this.internalUnmount();
  }

  public scheduleUpdate(): void {
    if (!this.updateScheduled) {
      this.updateScheduled = true;
      requestAnimationFrame(() => {
        this.performUpdate();
        this.updateScheduled = false;
      });
    }
  }

  public getChildComponents(): SwissComponent[] {
    return this._children;
  }

  public provideContext<T>(key: symbol, value: T): void {
    this.context.set(key, value);
  }

  /**
   * Retrieve a context value by symbol, searching up the component tree.
   * Returns the nearest provided value or undefined if not found.
   */
  public useContext<T>(key: symbol): T | undefined {
    // Check self first
    if (this.context.has(key)) {
      return this.context.get(key) as T;
    }

    // Walk up parents to find the nearest provider
    let current: SwissComponent | null = this._parent;
    while (current) {
      if (current.context.has(key)) {
        return current.context.get(key) as T;
      }
      current = current._parent;
    }
    return undefined;
  }

  public renderInternal(): Promise<string> {
    return Promise.resolve('');
  }

  protected createPluginContext(): PluginContext {
    const hooksAdapter = {
      addHook: (
        hookName: string,
        handler: (...args: unknown[]) => void,
        _pluginId: string, // pluginId is not used in component-local hooks
        priority?: 'low' | 'normal' | 'high' | 'critical' | undefined
      ) => {
        const priorityMap: Record<string, number> = { low: -1, normal: 0, high: 1 };
        this._lifecycle.on(hookName, handler as (...args: unknown[]) => void, { priority: priorityMap[priority || 'normal'] ?? 0 });
      },
      removeHooks: () => {
        // Not supported for component-local hooks
      },
      callHook: async (hookName: string, context?: unknown) => {
        await this.executeHookPhase(hookName, context as Error);
      },
      hasHook: (hookName: string): boolean => {
        const hooks = this._lifecycle.getHooks();
        return !!hooks[hookName]?.length;
      },
      setGlobalContext: () => {
        // Not supported for component-local hooks
      },

      getHookSnapshot: () => {
        return Object.values(this._lifecycle.getHooks()).flat();
      },
    };

    return {
      hooks: hooksAdapter as unknown as import('../plugins/types/hooks-contract.js').HookRegistrySurface,
      registerHook: (hook: import('../plugins/types/hooks-contract.js').HookRegistration) => {
        const h = hook;
        hooksAdapter.addHook(
          h.name,
          (h.handler as unknown as (payload: unknown) => unknown),
          'component-local',
          h.priority as 'low' | 'normal' | 'high' | 'critical' | undefined
        );
      },
      capabilities: new Set<string>(),
      logger: {
        info: () => {},
        warn: () => {},
        error: () => {},
      },
    };
  }
}

// Utility function for functional components
export function useSwissComponent<P extends BaseComponentProps, S extends BaseComponentState>(
  setup: (props: P) => S & { render: () => VNode }
): new (props: P) => SwissComponent<P, S> {
  return class FunctionalComponent extends SwissComponent<P, S> {
    constructor(props: P) {
      super(props);
      const setupResult = setup(props);
      Object.assign(this, setupResult);
    }
    
    private _render(): VNode | null {
      if (!this.render) return null;
      return (this as this & { render: () => VNode }).render();
    }
  };
}

// Export helpers for use in other files
export {
  LifecycleManager,
  SwissContext,
  createPortal,
  useSlot,
  serverInit,
  hydrateSSR as hydrate,
  renderToString
};