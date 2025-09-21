"use client";

import { useEffect, useState } from 'react';

import {
  MOBILE_MAX_WIDTH,
  getDeviceType,
  getViewportHeight,
  isBrowser,
  isMobileViewport,
} from '../utils/device';

export type { DeviceType } from '../utils/device';

/**
 * Tracks whether the current viewport should be considered mobile (<= 767px).
 */
export function useIsMobile(initialWidth?: number): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof initialWidth === 'number') {
      return initialWidth <= MOBILE_MAX_WIDTH;
    }

    if (!isBrowser()) return false;

    return isMobileViewport();
  });

  useEffect(() => {
    if (!isBrowser()) return;

    const handleViewportChange = () => {
      setIsMobile(isMobileViewport());
    };

    handleViewportChange();

    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('orientationchange', handleViewportChange);

    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('orientationchange', handleViewportChange);
    };
  }, []);

  return isMobile;
}

/**
 * Keeps the `--vh` custom property in sync with the real viewport height and returns it.
 */
export function useViewportHeight(): number | null {
  const [viewportHeight, setViewportHeight] = useState<number | null>(() => {
    if (!isBrowser()) return null;

    return getViewportHeight();
  });

  useEffect(() => {
    if (!isBrowser()) return;

    const updateViewportHeight = () => {
      const nextHeight = getViewportHeight();
      if (!nextHeight) return;

      const vhUnit = nextHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vhUnit}px`);
      setViewportHeight(nextHeight);
    };

    updateViewportHeight();

    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', updateViewportHeight);

    const visualViewport = window.visualViewport;
    visualViewport?.addEventListener('resize', updateViewportHeight);
    visualViewport?.addEventListener('scroll', updateViewportHeight);

    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
      visualViewport?.removeEventListener('resize', updateViewportHeight);
      visualViewport?.removeEventListener('scroll', updateViewportHeight);
    };
  }, []);

  return viewportHeight;
}

/**
 * Exposes a coarse device type label for convenience.
 */
export function useDeviceType(): ReturnType<typeof getDeviceType> {
  const [deviceType, setDeviceType] = useState<ReturnType<typeof getDeviceType>>(() => {
    if (!isBrowser()) return 'desktop';

    return getDeviceType();
  });

  useEffect(() => {
    if (!isBrowser()) return;

    const handleViewportChange = () => {
      setDeviceType(getDeviceType());
    };

    handleViewportChange();

    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('orientationchange', handleViewportChange);

    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('orientationchange', handleViewportChange);
    };
  }, []);

  return deviceType;
}

