/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

interface WindowWithHandlers extends Window {
  [key: string]: unknown;
}

export interface HTMLTemplateOptions {
    escapeHTML?: boolean;
    allowUnsafe?: boolean;
  }
  
  /**
   * Tagged template literal for HTML
   * Provides syntax highlighting and basic security
   */
  export function html(strings: TemplateStringsArray, ...values: unknown[]): string {
    let result = '';
    
    for (let i = 0; i < strings.length; i++) {
      result += strings[i];
      
      if (i < values.length) {
        const value = values[i];
        
        // Handle different value types
        if (typeof value === 'function') {
          // For event handlers, we'll store them globally and reference by name
          const handlerName = `handler_${Math.random().toString(36).substr(2, 9)}`;
          (window as unknown as WindowWithHandlers)[handlerName] = value;
          result += handlerName + '()';
        } else if (Array.isArray(value)) {
          // Handle arrays by joining them
          result += value.join('');
        } else if (value === null || value === undefined) {
          // Skip null/undefined values
          result += '';
        } else {
          // Convert to string and optionally escape
          result += escapeHTML(String(value));
        }
      }
    }
    
    return result;
  }
  
  /**
   * Escape HTML to prevent XSS attacks
   */
  export function escapeHTML(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
  
  /**
   * Create unsafe HTML (use with caution)
   */
  export function unsafe(htmlString: string): { __html: string } {
    return { __html: htmlString };
  }
  
  /**
   * Template function for CSS styles
   */
  export function css(strings: TemplateStringsArray, ...values: unknown[]): string {
    let result = '';
    
    for (let i = 0; i < strings.length; i++) {
      result += strings[i];
      if (i < values.length) {
        result += String(values[i]);
      }
    }
    
    return result;
  }
  
  /**
   * Conditional class helper
   */
  export function classNames(...args: (string | { [key: string]: boolean } | undefined | null)[]): string {
    const classes: string[] = [];
    
    for (const arg of args) {
      if (!arg) continue;
      
      if (typeof arg === 'string') {
        classes.push(arg);
      } else if (typeof arg === 'object') {
        for (const [key, value] of Object.entries(arg)) {
          if (value) {
            classes.push(key);
          }
        }
      }
    }
    
    return classes.join(' ');
  }