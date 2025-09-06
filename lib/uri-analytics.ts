export interface URIAnalytics {
  currency: string;
  walletDetected: string;
  uriType: 'wallet-specific' | 'standard' | 'fallback';
  userAgent: string;
  timestamp: number;
  success?: boolean;
}

export function trackURIGeneration(params: {
  currency: string;
  walletDetected: string;
  uriType: string;
  uri: string;
}) {
  try {
    const analytics: URIAnalytics = {
      currency: params.currency,
      walletDetected: params.walletDetected,
      uriType: (params.uriType as URIAnalytics['uriType']) || 'standard',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      timestamp: Date.now(),
    };

    if (typeof fetch !== 'undefined') {
      fetch('/api/analytics/uri-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...analytics, sample: params.uri?.slice(0, 64) }),
      }).catch(() => {});
    }
  } catch {
    // noop
  }
}

export function trackPaymentSuccess(paymentId: string, meta?: { clientId?: string; strategy?: string; variant?: string }) {
  try {
    if (typeof fetch !== 'undefined') {
      fetch('/api/analytics/payment-success', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, timestamp: Date.now(), ...meta }),
      }).catch(() => {});
    }
  } catch {
    // noop
  }
}
