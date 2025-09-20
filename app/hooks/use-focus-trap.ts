/**
 * Focus Trap Hook
 * Manages focus trapping within overlay components
 * Matches Stripe's focus management patterns
 */

import { useEffect, useRef, useCallback } from 'react';
import { getFocusTrapBoundaries } from '@/app/lib/overlay-manager';

interface UseFocusTrapOptions {
  enabled?: boolean;
  autoFocus?: boolean;
  restoreFocus?: boolean;
  initialFocus?: React.RefObject<HTMLElement>;
}

export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(
  options: UseFocusTrapOptions = {}
) {
  const {
    enabled = true,
    autoFocus = true,
    restoreFocus = true,
    initialFocus,
  } = options;

  const containerRef = useRef<T>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  /**
   * Handle Tab key navigation
   */
  const handleTabKey = useCallback((event: KeyboardEvent) => {
    if (!containerRef.current || !enabled) return;

    const { first, last } = getFocusTrapBoundaries(containerRef.current);
    if (!first || !last) return;

    const activeElement = document.activeElement as HTMLElement;

    if (event.shiftKey) {
      // Shift+Tab: Move focus backward
      if (activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    } else {
      // Tab: Move focus forward
      if (activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }, [enabled]);

  /**
   * Set initial focus
   */
  const setInitialFocus = useCallback(() => {
    if (!enabled) return;

    // Store the previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Set focus to specified element or first focusable element
    if (initialFocus?.current) {
      initialFocus.current.focus();
    } else if (containerRef.current && autoFocus) {
      const { first } = getFocusTrapBoundaries(containerRef.current);
      if (first) {
        // Small delay to ensure DOM is ready
        setTimeout(() => first.focus(), 0);
      }
    }
  }, [enabled, autoFocus, initialFocus]);

  /**
   * Restore focus to previous element
   */
  const restorePreviousFocus = useCallback(() => {
    if (restoreFocus && previousActiveElement.current) {
      // Check if element still exists in DOM
      if (document.body.contains(previousActiveElement.current)) {
        previousActiveElement.current.focus();
      }
      previousActiveElement.current = null;
    }
  }, [restoreFocus]);

  /**
   * Click handler to keep focus within trap
   */
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (!containerRef.current || !enabled) return;

    const target = event.target as HTMLElement;

    // If click is outside container, refocus the container
    if (!containerRef.current.contains(target)) {
      event.preventDefault();
      event.stopPropagation();

      // Focus the first focusable element
      const { first } = getFocusTrapBoundaries(containerRef.current);
      if (first) {
        first.focus();
      }
    }
  }, [enabled]);

  /**
   * Setup and cleanup
   */
  useEffect(() => {
    if (!enabled) return;

    // Set initial focus when trap is enabled
    setInitialFocus();

    // Add event listeners
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        handleTabKey(event);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClickOutside, true);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClickOutside, true);
      restorePreviousFocus();
    };
  }, [enabled, handleTabKey, handleClickOutside, setInitialFocus, restorePreviousFocus]);

  /**
   * Programmatic focus management
   */
  const focusFirst = useCallback(() => {
    if (!containerRef.current) return;
    const { first } = getFocusTrapBoundaries(containerRef.current);
    if (first) first.focus();
  }, []);

  const focusLast = useCallback(() => {
    if (!containerRef.current) return;
    const { last } = getFocusTrapBoundaries(containerRef.current);
    if (last) last.focus();
  }, []);

  return {
    containerRef,
    focusFirst,
    focusLast,
    restoreFocus: restorePreviousFocus,
  };
}

/**
 * Hook for managing focus within a specific scope
 * Useful for dropdown menus and popovers
 */
export function useFocusScope<T extends HTMLElement = HTMLDivElement>(
  options: {
    loop?: boolean;
    trapped?: boolean;
    onEscape?: () => void;
  } = {}
) {
  const { loop = true, trapped = false, onEscape } = options;
  const containerRef = useRef<T>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onEscape) {
        event.preventDefault();
        onEscape();
        return;
      }

      if (event.key === 'Tab') {
        const focusableElements = container.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        const elements = Array.from(focusableElements).filter(el => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        });

        if (elements.length === 0) return;

        const firstElement = elements[0];
        const lastElement = elements[elements.length - 1];
        const activeElement = document.activeElement;

        if (trapped || loop) {
          if (event.shiftKey && activeElement === firstElement) {
            event.preventDefault();
            if (loop) {
              lastElement.focus();
            }
          } else if (!event.shiftKey && activeElement === lastElement) {
            event.preventDefault();
            if (loop) {
              firstElement.focus();
            }
          }
        }
      }

      // Arrow key navigation for menus
      if (['ArrowUp', 'ArrowDown'].includes(event.key)) {
        const focusableElements = container.querySelectorAll<HTMLElement>(
          '[role="menuitem"], [role="option"]'
        );

        const elements = Array.from(focusableElements);
        const currentIndex = elements.indexOf(document.activeElement as HTMLElement);

        if (currentIndex === -1) return;

        let nextIndex: number;
        if (event.key === 'ArrowDown') {
          nextIndex = currentIndex + 1;
          if (nextIndex >= elements.length) {
            nextIndex = loop ? 0 : elements.length - 1;
          }
        } else {
          nextIndex = currentIndex - 1;
          if (nextIndex < 0) {
            nextIndex = loop ? elements.length - 1 : 0;
          }
        }

        event.preventDefault();
        elements[nextIndex].focus();
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [loop, trapped, onEscape]);

  return containerRef;
}