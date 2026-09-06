/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

/** @jsxImportSource @swissjs/core */
/// <reference types="@swissjs/core" />
import { SwissComponent, html } from '@swissjs/core';
import App from './components/App.tsx';
import './styles/main.css';

export default class CapabilityExplorerRoot extends SwissComponent {
  constructor(props: {}) {
    super(props);
  }

  render() {
    return html`
      <div id="capability-explorer-root">
        ${new App({})}
      </div>
    `;
  }
}

// Initialize the Capability Explorer
export function initCapabilityExplorer(container: HTMLElement): void {
  const root = new CapabilityExplorerRoot({});
  root.mount(container);
}

// Export the main App component for direct use
export { default as CapabilityExplorer } from './components/App.tsx';

// Auto-initialize if container element is found
if (typeof window !== 'undefined') {
  const container = document.getElementById('capability-explorer');
  if (container) {
    initCapabilityExplorer(container);
  }
}
