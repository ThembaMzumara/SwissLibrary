/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

/* @vitest-environment jsdom */
import { describe, it, expect } from 'vitest';
import axe from 'axe-core';
import { UiButton } from '../dist/index.js';

function mountToDOM(el: HTMLElement) {
  document.body.appendChild(el);
}

describe('UiButton accessibility', () => {
  it('has no obvious axe violations', async () => {
    const host = document.createElement('div');
    const btn = new UiButton({ label: 'Click me' });
    btn.mount(host);
    mountToDOM(host);

    const results = await axe.run(host);
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toHaveLength(0);
  });

  it('is reachable and operable via keyboard', async () => {
    const host = document.createElement('div');
    const btn = new UiButton({ label: 'Tab target' });
    btn.mount(host);
    mountToDOM(host);

    const button = host.querySelector('button') as HTMLButtonElement;
    expect(button).toBeTruthy();

    button.focus();
    expect(document.activeElement).toBe(button);

    // Click handler fires
    let clicked = false;
    const host2 = document.createElement('div');
    const btn2 = new UiButton({ label: 'Click', onClick: () => { clicked = true; } });
    btn2.mount(host2);
    mountToDOM(host2);

    const button2 = host2.querySelector('button') as HTMLButtonElement;
    button2.click();
    expect(clicked).toBe(true);
  });
});
