/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

/* @vitest-environment jsdom */
import { describe, it, expect } from 'vitest';
import axe from 'axe-core';
import { UiModal, UiButton } from '../dist/index.js';

function mountToDOM(el: HTMLElement) { document.body.appendChild(el); }

describe('UiModal accessibility', () => {
  it('has no obvious axe violations when open', async () => {
    const host = document.createElement('div');
    const modal = new UiModal({ open: true, title: 'Dialog' });
    modal.mount(host);
    mountToDOM(host);

    const results = await axe.run(host);
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toHaveLength(0);
  });

  it('focus can move to close button', async () => {
    const host = document.createElement('div');
    const modal = new UiModal({ open: true, title: 'Dialog' });
    modal.mount(host);
    mountToDOM(host);

    const closeBtn = host.querySelector('.ui-modal-close') as HTMLButtonElement;
    expect(closeBtn).toBeTruthy();
    closeBtn.focus();
    expect(document.activeElement).toBe(closeBtn);
  });

  it('backdrop click triggers onClose', async () => {
    let closed = false;
    const host = document.createElement('div');
    const modal = new UiModal({ open: true, title: 'Dialog', onClose: () => { closed = true; } });
    modal.mount(host);
    mountToDOM(host);

    const backdrop = host.querySelector('.ui-modal-backdrop') as HTMLDivElement;
    backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(closed).toBe(true);
  });
});
