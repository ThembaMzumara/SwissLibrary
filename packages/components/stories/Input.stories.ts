/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import type { Meta, StoryObj } from '@storybook/html';

const meta: Meta = {
  title: 'Components/Input',
};
export default meta;

type Story = StoryObj;

export const Text: Story = {
  render: () => `
    <label>
      <span style="display:block; margin-bottom:4px">Label</span>
      <input class="ui-input" type="text" placeholder="Type here" aria-label="Sample input" />
    </label>
    <style>
      .ui-input { width:100%; padding:8px 10px; border:1px solid #ccc; border-radius:6px; font-size:14px }
      .ui-input:focus { outline: 2px solid #4da3ff; outline-offset: 1px }
    </style>
  `,
};

export const Disabled: Story = {
  render: () => `
    <input class="ui-input" type="text" placeholder="Disabled" disabled aria-disabled="true" />
  `,
};
