/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

export interface ComponentHook {
  phase: string;
  callback: (...args: unknown[]) => void;
  once: boolean;
  capability: string | undefined;
  priority: number;
}
