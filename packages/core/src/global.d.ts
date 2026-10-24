/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: unknown;
  }
} 

declare global {
  interface Reflect {
    hasMetadata(key: unknown, target: object): boolean;
    defineMetadata(key: unknown, value: unknown, target: object): void;
    getMetadata(key: unknown, target: object): unknown;
    getOwnMetadata(key: unknown, target: object): unknown;
  }
}

// Export nothing since this is purely for type augmentation
export {};
// Make JSX "used" for eslint by exporting a type alias
export type __JSX_IntrinsicElements = JSX.IntrinsicElements;