/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import type { Meta, StoryObj } from '@storybook/html';

const meta: Meta = {
  title: 'Guides/A11y Checklist',
  parameters: { options: { showPanel: false } }
};
export default meta;

type Story = StoryObj;

export const Checklist: Story = {
  render: () => `
    <article style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif; line-height:1.5; max-width: 800px">
      <h2>Accessibility (A11y) Checklist</h2>
      <ul>
        <li><strong>Semantics</strong>: Prefer native elements; use ARIA only when needed.</li>
        <li><strong>Keyboard</strong>: All interactive controls reachable and operable (Tab/Shift+Tab, Arrow keys). Visible focus.</li>
        <li><strong>Labels</strong>: Every control has a name (label, <code>aria-label</code>, or <code>aria-labelledby</code>).</li>
        <li><strong>Contrast</strong>: Meets WCAG 2.1 AA contrast (4.5:1 for normal text).</li>
        <li><strong>Focus management</strong>: Logical order; trap focus in modals; return focus to invoker on close.</li>
        <li><strong>Status</strong>: Announce important updates (<code>aria-live</code> regions).</li>
        <li><strong>Motion</strong>: Respect <code>prefers-reduced-motion</code>.</li>
      </ul>
      <p>Run automated checks with the A11y addon; validate with manual keyboard and screen reader testing.</p>
    </article>
  `,
};
