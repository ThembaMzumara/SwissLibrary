/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

export type PreviewResult = {
  html: string;
  diagnostics: string[];
};

declare global {
  // Optional global hooks if the compiler/SSR is present in the page
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Window { SwissCompiler?: any; SwissSSR?: any }
}

export class PreviewService {
  async compileAndRender(source: string): Promise<PreviewResult> {
    const diagnostics: string[] = [];
    let html = '';

    try {
      if (typeof window !== 'undefined' && (window as any).SwissCompiler && (window as any).SwissSSR) {
        // Attempt to compile the template snippet
        const compiler = (window as any).SwissCompiler;
        const ssr = (window as any).SwissSSR;
        try {
          const compiled = await compiler.compileTemplateString(source);
          html = await ssr.render(compiled, {});
        } catch (e) {
          diagnostics.push(`Compiler/SSR error: ${String((e as Error)?.message || e)}`);
          html = this.fallbackHTML(source);
        }
      } else {
        // Fallback path when runtime hooks are not available
        diagnostics.push('Compiler/SSR hooks not available. Showing fallback preview.');
        html = this.fallbackHTML(source);
      }
    } catch (e) {
      diagnostics.push(`Unexpected error: ${String((e as Error)?.message || e)}`);
      html = this.fallbackHTML(source);
    }

    return { html, diagnostics };
  }

  private fallbackHTML(source: string): string {
    const escaped = source
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<pre style="margin:0;padding:12px;background:#0b1020;color:#e6f3ff;border-radius:6px">${escaped}</pre>`;
  }
}
