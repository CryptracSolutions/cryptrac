const isClient = typeof window !== 'undefined';

export const MOBILE_MAX_WIDTH = 767;
export const TABLET_MAX_WIDTH = 1023;

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

/**
 * SSR-safe guard for window checks.
 */
export function isBrowser(): boolean {
  return isClient;
}

/**
 * Returns true when the current device exposes touch capabilities.
 */
export function isTouchDevice(): boolean {
  if (!isClient) return false;

  const nav = navigator as Navigator & { msMaxTouchPoints?: number };

  return (
    'ontouchstart' in window ||
    (nav.maxTouchPoints ?? 0) > 0 ||
    (nav.msMaxTouchPoints ?? 0) > 0
  );
}

/**
 * Determines if the viewport width should be treated as mobile.
 */
export function isMobileViewport(widthOverride?: number): boolean {
  if (typeof widthOverride === 'number') {
    return widthOverride <= MOBILE_MAX_WIDTH;
  }

  if (!isClient) return false;

  return window.innerWidth <= MOBILE_MAX_WIDTH;
}

/**
 * Returns a coarse device type using viewport heuristics only.
 */
export function getDeviceType(widthOverride?: number): DeviceType {
  const width =
    typeof widthOverride === 'number'
      ? widthOverride
      : isClient
        ? window.innerWidth
        : undefined;

  if (width === undefined) return 'desktop';

  if (width <= MOBILE_MAX_WIDTH) return 'mobile';
  if (width <= TABLET_MAX_WIDTH) return 'tablet';
  return 'desktop';
}

/**
 * Returns the safest available viewport height in pixels.
 */
export function getViewportHeight(): number | null {
  if (!isClient) return null;

  if (typeof window.visualViewport?.height === 'number') {
    return Math.round(window.visualViewport.height);
  }

  return Math.round(window.innerHeight);
}
