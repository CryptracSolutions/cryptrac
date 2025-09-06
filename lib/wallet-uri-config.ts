export interface WalletOverrideConfig {
  enabled: boolean;
  priority: number;
  testMode: boolean;
  customSchemes?: Record<string, string>; // currency -> template with placeholders
}

export interface DynamicConfig {
  walletOverrides: Record<string, WalletOverrideConfig>; // key by wallet name, e.g., "MetaMask"
  fallbackBehavior: 'aggressive' | 'conservative' | 'standard-only';
  debugMode: boolean;
  experimentalFeatures: string[];
}

export function getDefaultConfig(): DynamicConfig {
  return {
    walletOverrides: {
      'MetaMask': { enabled: true, priority: 2, testMode: false },
      'Trust Wallet': { enabled: true, priority: 3, testMode: false },
      'Phantom': { enabled: true, priority: 1, testMode: false },
      'Coinbase Wallet': { enabled: true, priority: 4, testMode: false },
    },
    fallbackBehavior: 'aggressive',
    debugMode: false,
    experimentalFeatures: ['platform-optimized'],
  };
}

export async function loadDynamicConfig(): Promise<DynamicConfig> {
  try {
    const res = await fetch('/api/config/wallet-uris', { cache: 'no-store' });
    if (!res.ok) throw new Error('failed');
    return await res.json();
  } catch {
    return getDefaultConfig();
  }
}

import { buildCryptoPaymentURI } from './crypto-uri-builder';

export function buildConfigurableURI(params: {
  currency: string;
  address: string;
  amount: number;
  extraId?: string;
  config?: DynamicConfig;
}): string {
  const config = params.config || getDefaultConfig();
  if (config.debugMode) {
    try { console.log('Building URI with dynamic config:', config); } catch {}
  }

  if (config.fallbackBehavior === 'standard-only') {
    return buildCryptoPaymentURI(params).uri;
  }

  // Simplified: always return address-only URI
  return buildCryptoPaymentURI(params).uri
}
