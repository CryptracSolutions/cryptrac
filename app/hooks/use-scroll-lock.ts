/**
 * Scroll Lock Hook
 * Manages body scroll locking for overlays
 * Matches Stripe's scroll management patterns
 */

import { useEffect, useRef } from 'react';

interface ScrollLockOptions {
  enabled?: boolean;
  reserveScrollBarGap?: boolean;
  allowTouchMove?: (element: Element) => boolean;
}

export function useScrollLock(options: ScrollLockOptions = {}) {
  const {
    enabled = true,
    reserveScrollBarGap = true,
    allowTouchMove
  } = options;

  const scrollPositionRef = useRef<number>(0);
  const previousStylesRef = useRef<{
    overflow?: string;
    paddingRight?: string;
    position?: string;
    top?: string;
    width?: string;
  }>({});

  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return;

    // Store current scroll position
    scrollPositionRef.current = window.pageYOffset || document.documentElement.scrollTop;

    // Calculate scrollbar width
    const scrollbarWidth = getScrollbarWidth();
    const hasScrollbar = document.body.scrollHeight > window.innerHeight;

    // Store previous styles
    previousStylesRef.current = {
      overflow: document.body.style.overflow,
      paddingRight: document.body.style.paddingRight,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    };

    // Apply scroll lock styles
    document.body.style.overflow = 'hidden';

    // Reserve space for scrollbar to prevent layout shift
    if (reserveScrollBarGap && hasScrollbar && scrollbarWidth > 0) {
      const currentPadding = parseInt(
        window.getComputedStyle(document.body).paddingRight || '0',
        10
      );
      document.body.style.paddingRight = `${currentPadding + scrollbarWidth}px`;
    }

    // iOS Safari specific handling
    if (isIOS()) {
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollPositionRef.current}px`;
      document.body.style.width = '100%';
    }

    // Prevent touch move on iOS
    const handleTouchMove = (event: TouchEvent) => {
      if (!allowTouchMove) {
        event.preventDefault();
        return;
      }

      const target = event.target as Element;
      if (!allowTouchMove(target)) {
        event.preventDefault();
      }
    };

    if (isIOS()) {
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
    }

    // Cleanup function
    return () => {
      // Restore previous styles
      document.body.style.overflow = previousStylesRef.current.overflow || '';
      document.body.style.paddingRight = previousStylesRef.current.paddingRight || '';

      // iOS Safari specific cleanup
      if (isIOS()) {
        document.body.style.position = previousStylesRef.current.position || '';
        document.body.style.top = previousStylesRef.current.top || '';
        document.body.style.width = previousStylesRef.current.width || '';

        // Restore scroll position
        window.scrollTo(0, scrollPositionRef.current);

        // Remove touch move listener
        document.removeEventListener('touchmove', handleTouchMove);
      }
    };
  }, [enabled, reserveScrollBarGap, allowTouchMove]);
}

/**
 * Hook for managing scroll lock with ref
 * Useful when you need to lock scroll for a specific container
 */
export function useContainerScrollLock<T extends HTMLElement = HTMLDivElement>(
  enabled: boolean = true
) {
  const containerRef = useRef<T>(null);
  const previousOverflowRef = useRef<string>('');

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    previousOverflowRef.current = container.style.overflow;

    // Lock scroll on container
    container.style.overflow = 'hidden';

    return () => {
      // Restore scroll on container
      container.style.overflow = previousOverflowRef.current;
    };
  }, [enabled]);

  return containerRef;
}

/**
 * Hook for temporarily disabling scroll without removing scrollbar
 * Useful for preventing scroll during animations
 */
export function useScrollFreeze(freeze: boolean = false) {
  useEffect(() => {
    if (!freeze || typeof document === 'undefined') return;

    const handleScroll = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      return false;
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      return false;
    };

    // Add listeners to prevent scroll
    window.addEventListener('scroll', handleScroll, { passive: false });
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchmove', handleScroll, { passive: false });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchmove', handleScroll);
    };
  }, [freeze]);
}

/**
 * Utility: Calculate scrollbar width
 */
function getScrollbarWidth(): number {
  if (typeof document === 'undefined') return 0;

  // Create a temporary element to measure scrollbar
  const outer = document.createElement('div');
  outer.style.visibility = 'hidden';
  outer.style.overflow = 'scroll';
  // MS specific overflow style for WinJS apps
  (outer.style as CSSStyleDeclaration & { msOverflowStyle?: string }).msOverflowStyle = 'scrollbar';
  document.body.appendChild(outer);

  // Create inner element
  const inner = document.createElement('div');
  outer.appendChild(inner);

  // Calculate scrollbar width
  const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;

  // Clean up
  outer.parentNode?.removeChild(outer);

  return scrollbarWidth;
}

/**
 * Utility: Check if device is iOS
 */
function isIOS(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;

  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/**
 * Utility: Check if element is scrollable
 */
export function isScrollable(element: Element): boolean {
  const style = window.getComputedStyle(element);
  const overflowY = style.overflowY;
  const overflowX = style.overflowX;

  const canScrollY = overflowY === 'auto' || overflowY === 'scroll';
  const canScrollX = overflowX === 'auto' || overflowX === 'scroll';

  const hasScrollableContent =
    element.scrollHeight > element.clientHeight ||
    element.scrollWidth > element.clientWidth;

  return (canScrollY || canScrollX) && hasScrollableContent;
}

/**
 * Utility: Get all scrollable parents
 */
export function getScrollableParents(element: Element): Element[] {
  const parents: Element[] = [];
  let parent = element.parentElement;

  while (parent && parent !== document.body) {
    if (isScrollable(parent)) {
      parents.push(parent);
    }
    parent = parent.parentElement;
  }

  return parents;
}