/**
 * Hot Module Replacement for CSS
 */

export interface HMRUpdate {
    type: 'css-update';
    css: string;
    modules?: Record<string, string>;
    timestamp: number;
}

/**
 * CSS HMR Handler
 */
export class CSSHMRHandler {
    private styleElements: Map<string, HTMLStyleElement> = new Map();

    /**
     * Apply CSS update
     */
    applyUpdate(id: string, update: HMRUpdate): void {
        let styleEl = this.styleElements.get(id);

        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.setAttribute('data-css-module', id);
            document.head.appendChild(styleEl);
            this.styleElements.set(id, styleEl);
        }

        styleEl.textContent = update.css;

        // Trigger re-render if modules changed
        if (update.modules) {
            this.notifyModuleUpdate(id, update.modules);
        }
    }

    /**
     * Remove CSS module
     */
    removeModule(id: string): void {
        const styleEl = this.styleElements.get(id);
        if (styleEl) {
            styleEl.remove();
            this.styleElements.delete(id);
        }
    }

    /**
     * Notify components of module update
     */
    private notifyModuleUpdate(id: string, modules: Record<string, string>): void {
        // Dispatch custom event for component to listen
        const event = new CustomEvent('css-module-update', {
            detail: { id, modules }
        });
        window.dispatchEvent(event);
    }
}

/**
 * Create HMR handler instance
 */
export function createCSSHMR(): CSSHMRHandler {
    return new CSSHMRHandler();
}
