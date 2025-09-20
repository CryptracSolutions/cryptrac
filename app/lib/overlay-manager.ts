/**
 * Overlay Manager
 * Manages z-index stacking, focus management, and scroll locking for overlays
 * Matches Stripe's overlay patterns exactly
 */

type OverlayType = 'modal' | 'drawer' | 'popover' | 'tooltip' | 'dropdown';

interface OverlayConfig {
  type: OverlayType;
  id: string;
  zIndex?: number;
  lockScroll?: boolean;
  trapFocus?: boolean;
  closeOnEscape?: boolean;
  closeOnClickOutside?: boolean;
}

class OverlayManager {
  private static instance: OverlayManager;
  private overlayStack: OverlayConfig[] = [];
  private scrollLocked = false;
  private previousBodyStyle: {
    overflow?: string;
    paddingRight?: string;
  } = {};

  private constructor() {}

  static getInstance(): OverlayManager {
    if (!OverlayManager.instance) {
      OverlayManager.instance = new OverlayManager();
    }
    return OverlayManager.instance;
  }

  /**
   * Register an overlay when it opens
   */
  register(config: OverlayConfig): void {
    this.overlayStack.push(config);

    if (config.lockScroll && !this.scrollLocked) {
      this.lockScroll();
    }

    if (config.closeOnEscape) {
      this.addEscapeListener(config.id);
    }
  }

  /**
   * Unregister an overlay when it closes
   */
  unregister(id: string): void {
    const index = this.overlayStack.findIndex(o => o.id === id);
    if (index > -1) {
      const overlay = this.overlayStack[index];
      this.overlayStack.splice(index, 1);

      // Check if we should unlock scroll
      const hasScrollLockingOverlay = this.overlayStack.some(o => o.lockScroll);
      if (!hasScrollLockingOverlay && this.scrollLocked) {
        this.unlockScroll();
      }

      if (overlay.closeOnEscape) {
        this.removeEscapeListener(overlay.id);
      }
    }
  }

  /**
   * Get the current top overlay
   */
  getTopOverlay(): OverlayConfig | null {
    return this.overlayStack[this.overlayStack.length - 1] || null;
  }

  /**
   * Get z-index for an overlay type
   */
  getZIndex(type: OverlayType): number {
    const baseZIndices: Record<OverlayType, number> = {
      dropdown: 10,
      popover: 50,
      modal: 50,
      drawer: 50,
      tooltip: 60,
    };

    // Add stack position to base z-index
    const stackPosition = this.overlayStack.length;
    return baseZIndices[type] + stackPosition;
  }

  /**
   * Lock body scroll (matching Stripe's implementation)
   */
  private lockScroll(): void {
    if (typeof document === 'undefined') return;

    const scrollbarWidth = this.getScrollbarWidth();

    // Store previous body styles
    this.previousBodyStyle = {
      overflow: document.body.style.overflow,
      paddingRight: document.body.style.paddingRight,
    };

    // Apply scroll lock styles
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      const currentPadding = parseInt(document.body.style.paddingRight || '0', 10);
      document.body.style.paddingRight = `${currentPadding + scrollbarWidth}px`;
    }

    this.scrollLocked = true;
  }

  /**
   * Unlock body scroll
   */
  private unlockScroll(): void {
    if (typeof document === 'undefined') return;

    // Restore previous body styles
    document.body.style.overflow = this.previousBodyStyle.overflow || '';
    document.body.style.paddingRight = this.previousBodyStyle.paddingRight || '';

    this.scrollLocked = false;
  }

  /**
   * Calculate scrollbar width
   */
  private getScrollbarWidth(): number {
    if (typeof document === 'undefined') return 0;

    const outer = document.createElement('div');
    outer.style.visibility = 'hidden';
    outer.style.overflow = 'scroll';
    document.body.appendChild(outer);

    const inner = document.createElement('div');
    outer.appendChild(inner);

    const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;
    outer.parentNode?.removeChild(outer);

    return scrollbarWidth;
  }

  /**
   * Add escape key listener for overlay
   */
  private addEscapeListener(id: string): void {
    if (typeof document === 'undefined') return;

    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        const topOverlay = this.getTopOverlay();
        if (topOverlay?.id === id) {
          // Dispatch custom event for the overlay to handle
          const customEvent = new CustomEvent(`overlay-escape-${id}`);
          document.dispatchEvent(customEvent);
        }
      }
    };

    document.addEventListener('keydown', handler);
    // Store handler reference for removal
    const handlers = this as unknown as Record<string, (event: KeyboardEvent) => void>;
    handlers[`escapeHandler_${id}`] = handler;
  }

  /**
   * Remove escape key listener for overlay
   */
  private removeEscapeListener(id: string): void {
    if (typeof document === 'undefined') return;

    const handlers = this as unknown as Record<string, (event: KeyboardEvent) => void>;
    const handler = handlers[`escapeHandler_${id}`];
    if (handler) {
      document.removeEventListener('keydown', handler);
      delete handlers[`escapeHandler_${id}`];
    }
  }

  /**
   * Check if click is outside element
   */
  isClickOutside(element: HTMLElement, event: MouseEvent): boolean {
    return !element.contains(event.target as Node);
  }

  /**
   * Get focus trap boundaries
   */
  getFocusTrapBoundaries(container: HTMLElement): {
    first: HTMLElement | null;
    last: HTMLElement | null;
  } {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const focusableElements = container.querySelectorAll<HTMLElement>(focusableSelectors);
    const visibleElements = Array.from(focusableElements).filter(el => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });

    return {
      first: visibleElements[0] || null,
      last: visibleElements[visibleElements.length - 1] || null,
    };
  }

  /**
   * Set ARIA attributes for overlay
   */
  setAccessibilityAttributes(
    element: HTMLElement,
    {
      role,
      label,
      describedBy,
      modal = false
    }: {
      role?: string;
      label?: string;
      describedBy?: string;
      modal?: boolean;
    }
  ): void {
    if (role) element.setAttribute('role', role);
    if (label) element.setAttribute('aria-label', label);
    if (describedBy) element.setAttribute('aria-describedby', describedBy);
    if (modal) element.setAttribute('aria-modal', 'true');
  }

  /**
   * Clean up all overlays (useful for testing and unmounting)
   */
  cleanup(): void {
    // Unregister all overlays
    const overlayIds = [...this.overlayStack].map(o => o.id);
    overlayIds.forEach(id => this.unregister(id));

    // Ensure scroll is unlocked
    if (this.scrollLocked) {
      this.unlockScroll();
    }
  }
}

// Export singleton instance
export const overlayManager = OverlayManager.getInstance();

// Export utility functions
export const registerOverlay = (config: OverlayConfig) => overlayManager.register(config);
export const unregisterOverlay = (id: string) => overlayManager.unregister(id);
export const getOverlayZIndex = (type: OverlayType) => overlayManager.getZIndex(type);
export const isClickOutside = (element: HTMLElement, event: MouseEvent) =>
  overlayManager.isClickOutside(element, event);
export const getFocusTrapBoundaries = (container: HTMLElement) =>
  overlayManager.getFocusTrapBoundaries(container);
export const setOverlayAccessibility = (
  element: HTMLElement,
  attrs: Parameters<typeof overlayManager.setAccessibilityAttributes>[1]
) => overlayManager.setAccessibilityAttributes(element, attrs);