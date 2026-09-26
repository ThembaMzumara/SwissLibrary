/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

/* @vitest-environment jsdom */
import { describe, it, expect } from 'vitest';
import axe from 'axe-core';
import { UiInput } from '../dist/index.js';

function mountToDOM(el: HTMLElement) {
  document.body.appendChild(el);
}

describe('UiInput accessibility', () => {
  it('has no obvious axe violations', async () => {
    const host = document.createElement('div');
    const input = new UiInput({ placeholder: 'Your name' });
    input.mount(host);
    mountToDOM(host);

    const results = await axe.run(host);
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toHaveLength(0);
  });

  it('is reachable and operable via keyboard', async () => {
    const host = document.createElement('div');
    const input = new UiInput({ placeholder: 'Focusable' });
    input.mount(host);
    mountToDOM(host);

    const el = host.querySelector('input') as HTMLInputElement;
    expect(el).toBeTruthy();

    el.focus();
    expect(document.activeElement).toBe(el);

    // Input event updates value
    let latest = '';
    const host2 = document.createElement('div');
    const input2 = new UiInput({ placeholder: 'Type', onInput: (_e: Event, v: string) => { latest = v; } });
    input2.mount(host2);
    mountToDOM(host2);

    const el2 = host2.querySelector('input') as HTMLInputElement;
    el2.value = 'abc';
    el2.dispatchEvent(new Event('input', { bubbles: true }));
    expect(latest).toBe('abc');
  });
});
