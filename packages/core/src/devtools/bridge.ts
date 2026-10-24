/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

/*
 * SwissJS Devtools Bridge (dev-only)
 *
 * Provides a lightweight interface for the runtime to emit component lifecycle
 * and capability events to devtools. The bridge is disabled by default and can
 * be enabled via the SWISS_DEVTOOLS=1 env flag or globalThis.SWISS_DEVTOOLS = true.
 */

export type ComponentId = string;
export type CapabilityName = string;

export interface ComponentNodePayload {
  id: ComponentId;
  name: string;
  parentId: ComponentId | null;
  provides: CapabilityName[];
  consumes: CapabilityName[];
}

/** Opt-in telemetry flag separate from devtools enablement */
export function isTelemetryEnabled(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g: any = (typeof globalThis !== 'undefined') ? (globalThis as any) : {};
    if (typeof process !== 'undefined' && process?.env?.SWISS_TELEMETRY) {
      return process.env.SWISS_TELEMETRY === '1' || process.env.SWISS_TELEMETRY === 'true';
    }
    if (typeof g.SWISS_TELEMETRY !== 'undefined') return !!g.SWISS_TELEMETRY;
  } catch {
    // ignore
  }
  return false;
}

export interface ComponentUpdatePayload {
  id: ComponentId;
  stateSummary?: Record<string, unknown>;
  capabilityUsageDeltas?: Record<CapabilityName, number>;
}

export interface GraphSnapshot {
  nodes: ComponentNodePayload[];
  edges: Array<{ from: ComponentId; to: ComponentId; type: 'provides' | 'consumes' | 'parent' }>; 
  createdAt: number; // epoch ms
}

export interface DevtoolsBridge {
  onComponentMount(payload: ComponentNodePayload): void;
  onComponentUpdate(payload: ComponentUpdatePayload): void;
  onComponentUnmount(id: ComponentId): void;
  getGraphSnapshot(): GraphSnapshot;
  /** Optional: get a shallow state snapshot for the given component id */
  getStateSnapshot(id: ComponentId): Record<string, unknown> | undefined;
  /** Record an arbitrary runtime event for devtools */
  recordEvent(event: { t: number; type: string; msg: string }): void;
  /** Drain and return buffered events (FIFO) */
  drainEvents(): Array<{ t: number; type: string; msg: string }>;
  /** Optional typed event channel for structured telemetry (non-breaking) */
  recordEventTyped?(event: DevtoolsEvent): void;
  /** Optional drain for typed events */
  drainEventsTyped?(): DevtoolsEvent[];
  /** Attempt to restore a shallow component state (dev-only). Returns true if accepted. */
  restoreState(id: ComponentId, state: Record<string, unknown>): boolean;
  reset(): void;
}

class NoopBridge implements DevtoolsBridge {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onComponentMount(_payload: ComponentNodePayload): void {
    // Noop implementation
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onComponentUpdate(_payload: ComponentUpdatePayload): void {
    // Noop implementation
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onComponentUnmount(_id: ComponentId): void {
    // Noop implementation
  }
  getGraphSnapshot(): GraphSnapshot {
    return { nodes: [], edges: [], createdAt: Date.now() };
  }
  getStateSnapshot(id: ComponentId): Record<string, unknown> | undefined { void id; return undefined }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  recordEvent(_event: { t: number; type: string; msg: string }): void { /* noop */ }
  drainEvents(): Array<{ t: number; type: string; msg: string }> { return [] }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  restoreState(_id: ComponentId, _state: Record<string, unknown>): boolean { return false }
  reset(): void {}
}

let bridgeSingleton: DevtoolsBridge | null = null;

export function isDevtoolsEnabled(): boolean {
  try {
    // Prefer explicit env var in Node; also allow a global flag for non-Node runtimes.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g: any = (typeof globalThis !== 'undefined') ? (globalThis as any) : {};
    if (typeof process !== 'undefined' && process?.env?.SWISS_DEVTOOLS) {
      return process.env.SWISS_DEVTOOLS === '1' || process.env.SWISS_DEVTOOLS === 'true';
    }
    if (typeof g.SWISS_DEVTOOLS !== 'undefined') {
      return !!g.SWISS_DEVTOOLS;
    }
  } catch {
    // ignore
  }
  return false;
}

export function getDevtoolsBridge(): DevtoolsBridge {
  if (!isDevtoolsEnabled()) {
    return noopBridge;
  }
  return bridgeSingleton ?? noopBridge;
}

export function setDevtoolsBridge(impl: DevtoolsBridge): void {
  if (!isDevtoolsEnabled()) return; // do not set if disabled
  bridgeSingleton = impl;
}

const noopBridge = new NoopBridge();

// In-memory bridge implementation (simple, dev-only) – optional convenience
export class InMemoryBridge implements DevtoolsBridge {
  // TECH-DEBT: This in-memory implementation is a stopgap for MVP.
  // - No persistence, no cross-context transport, no category-specific backpressure.
  // - Replace with a typed event bus + pluggable transports (in-page, WS, extension).
  private nodes = new Map<ComponentId, ComponentNodePayload>();
  private edges: Array<{ from: ComponentId; to: ComponentId; type: 'provides' | 'consumes' | 'parent' }> = [];
  // TECH-DEBT: Shallow snapshots only; add a serializer with redaction and depth limits.
  private state = new Map<ComponentId, Record<string, unknown>>();
  // TECH-DEBT: Single FIFO buffer; convert to ring buffer per category with bounded caps.
  private events: Array<{ t: number; type: string; msg: string }> = [];
  private typedEvents: DevtoolsEvent[] = [];

  onComponentMount(payload: ComponentNodePayload): void {
    this.nodes.set(payload.id, payload);
    if (payload.parentId) {
      this.edges.push({ from: payload.parentId, to: payload.id, type: 'parent' });
    }
    for (const cap of payload.provides) {
      this.edges.push({ from: payload.id, to: payload.id + ':' + cap, type: 'provides' });
    }
    for (const cap of payload.consumes) {
      this.edges.push({ from: payload.id, to: payload.id + ':' + cap, type: 'consumes' });
    }
  }

  onComponentUpdate(payload: ComponentUpdatePayload): void {
    // TECH-DEBT: Accepts arbitrary shallow objects without schema validation.
    // Introduce a DevtoolsStateSnapshot type and sanitize inputs here.
    // Store shallow state if provided
    if (payload.stateSummary) {
      this.state.set(payload.id, payload.stateSummary);
    }
    // Record a lightweight update event
    this.events.push({ t: Date.now(), type: 'update', msg: payload.id });
    if (this.events.length > 1000) this.events.splice(0, this.events.length - 1000);
  }

  onComponentUnmount(id: ComponentId): void {
    this.nodes.delete(id);
    this.edges = this.edges.filter(e => e.from !== id && e.to !== id);
    this.state.delete(id);
    this.events.push({ t: Date.now(), type: 'unmount', msg: id });
  }

  getGraphSnapshot(): GraphSnapshot {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: [...this.edges],
      createdAt: Date.now(),
    };
  }

  getStateSnapshot(id: ComponentId): Record<string, unknown> | undefined {
    return this.state.get(id);
  }

  recordEvent(event: { t: number; type: string; msg: string }): void {
    this.events.push(event);
    if (this.events.length > 1000) this.events.splice(0, this.events.length - 1000);
  }

  drainEvents(): Array<{ t: number; type: string; msg: string }> {
    const out = this.events;
    this.events = [];
    return out;
  }

  recordEventTyped(event: DevtoolsEvent): void {
    this.typedEvents.push(event);
    if (this.typedEvents.length > 1000) this.typedEvents.splice(0, this.typedEvents.length - 1000);
  }

  drainEventsTyped(): DevtoolsEvent[] {
    const out = this.typedEvents;
    this.typedEvents = [];
    return out;
  }

  restoreState(id: ComponentId, state: Record<string, unknown>): boolean {
    // TECH-DEBT: This does not actually update live component instances.
    // Provide a controlled runtime API to apply validated snapshots safely.
    this.state.set(id, state);
    this.events.push({ t: Date.now(), type: 'restore', msg: id });
    if (this.events.length > 1000) this.events.splice(0, this.events.length - 1000);
    return true;
  }

  reset(): void {
    this.nodes.clear();
    this.edges = [];
    this.state.clear();
    this.events = [];
    this.typedEvents = [];
  }
}

// Structured devtools event model (optional)
export type DevtoolsEventCategory = 'perf' | 'error' | 'capability' | 'runtime';
export interface DevtoolsEvent {
  t: number; // epoch ms
  category: DevtoolsEventCategory;
  name: string; // e.g., 'render', 'commit', 'boundary-error'
  componentId?: string;
  data?: Record<string, unknown>;
}
