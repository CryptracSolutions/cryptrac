export interface PlatformInfo {
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isDesktop: boolean;
  browser: string;
}

function getBrowserName(ua: string): string {
  if (/chrome|crios/.test(ua) && !/edge|edg|opr|opera|brave/.test(ua)) return 'chrome';
  if (/safari/.test(ua) && !/chrome|crios/.test(ua)) return 'safari';
  if (/firefox|fxios/.test(ua)) return 'firefox';
  if (/edg(e|ios|a)?/.test(ua)) return 'edge';
  if (/opr|opera/.test(ua)) return 'opera';
  return 'unknown';
}

export function detectPlatform(): PlatformInfo {
  if (typeof navigator === 'undefined') {
    return { isMobile: false, isIOS: false, isAndroid: false, isDesktop: true, browser: 'server' };
  }
  const ua = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isAndroid = /android/.test(ua);
  const isMobile = /mobile|android|iphone|ipad/.test(ua);
  return {
    isMobile,
    isIOS,
    isAndroid,
    isDesktop: !isMobile,
    browser: getBrowserName(ua),
  };
}

