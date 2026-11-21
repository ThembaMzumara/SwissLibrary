/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

// Directives types barrel

export interface DirectiveBinding {
  value: unknown;
  expression: string;
  modifiers: Record<string, boolean>;
}

export interface SwissDirectiveHandler {
  (el: HTMLElement, binding: DirectiveBinding, context: unknown): void;
}
