/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import type { Meta, StoryObj } from '@storybook/html';

const meta: Meta = {
  title: 'Components/Button',
};
export default meta;

type Story = StoryObj;

export const Basic: Story = {
  render: () => `
    <button class="ui-btn" type="button">Button</button>
    <style>
      .ui-btn { padding: 8px 12px; border: 1px solid #ccc; background: #fff; border-radius: 6px; cursor: pointer }
      .ui-btn:hover { background: #f7f7f7 }
      .ui-btn[disabled] { opacity: .6; cursor: not-allowed }
    </style>
  `,
};

export const Disabled: Story = {
  render: () => `
    <button class="ui-btn" type="button" disabled aria-disabled="true">Disabled</button>
  `,
};
