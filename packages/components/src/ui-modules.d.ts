/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

// Module declarations for .ui files
declare module '../src/index.ui' {
  export class UiButton {
    constructor(props: { label?: string; onClick?: (e: MouseEvent) => void });
    mount(host: HTMLElement): void;
  }
  
  export class UiInput {
    constructor(props: { placeholder?: string; value?: string; onInput?: (e: Event, value: string) => void });
    mount(host: HTMLElement): void;
  }
  
  export class UiModal {
    constructor(props: { open?: boolean; title?: string; onClose?: () => void });
    mount(host: HTMLElement): void;
  }
}

// Global .ui file support
declare module '*.ui' {
  const content: unknown;
  export = content;
}
