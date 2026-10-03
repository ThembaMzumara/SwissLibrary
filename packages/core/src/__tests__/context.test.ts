/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { describe, it, expect } from 'vitest';
import { SwissContext } from '../component/context.js';

class FakeComponent {
  public context = new Map<symbol, unknown>();
  public _parent: FakeComponent | null = null;
  provideContext<T>(key: symbol, value: T): void {
    this.context.set(key, value);
  }
  useContext<T>(key: symbol): T | undefined {
    if (this.context.has(key)) return this.context.get(key) as T;
    let current: FakeComponent | null = this._parent;
    while (current) {
      if (current.context.has(key)) return current.context.get(key) as T;
      current = current._parent;
    }
    return undefined;
  }
}

describe('SwissContext Provider/Consumer', () => {
  it('returns provided value from nearest ancestor', () => {
    const Ctx = SwissContext.create<number>();

    const grandparent = new FakeComponent();
    const parent = new FakeComponent();
    const child = new FakeComponent();

    // wire hierarchy: grandparent -> parent -> child
    parent._parent = grandparent;
    child._parent = parent;

    // provide at two levels
    Ctx.Provider(1)(grandparent);
    Ctx.Provider(2)(parent);

    const consume = Ctx.Consumer();
    const value = consume(child);
    expect(value).toBe(2);
  });

  it('returns provided value from ancestor when parent does not provide', () => {
    const Ctx = SwissContext.create<string>();

    const parent = new FakeComponent();
    const child = new FakeComponent();
    child._parent = parent;

    Ctx.Provider('hello')(parent);

    const consume = Ctx.Consumer();
    const value = consume(child);
    expect(value).toBe('hello');
  });

  it('returns undefined when no provider exists in the chain', () => {
    const Ctx = SwissContext.create<boolean>();

    const parent = new FakeComponent();
    const child = new FakeComponent();
    child._parent = parent;

    const consume = Ctx.Consumer();
    const value = consume(child);
    expect(value).toBeUndefined();
  });
});
