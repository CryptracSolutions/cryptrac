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

import { buildCryptoPaymentURI, getRoundedAmount } from './crypto-uri-builder';
import { detectWalletHint, buildWalletSpecificURI } from './wallet-uri-helper';

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

  const wallet = detectWalletHint();
  const walletCfg = wallet ? config.walletOverrides[wallet] : undefined;
  // 1) If customSchemes provided for this wallet and currency, use it
  if (wallet && walletCfg?.enabled && walletCfg.customSchemes) {
    const tmpl = walletCfg.customSchemes[params.currency] || walletCfg.customSchemes['*'];
    if (tmpl) {
      const rounded = getRoundedAmount(params.amount);
      const wei = (() => { try { return BigInt(Math.floor(params.amount * 1e18)).toString(); } catch { return ''; } })();
      let uri = tmpl
        .replace(/\{address\}/g, params.address)
        .replace(/\{amount\}/g, String(rounded))
        .replace(/\{wei\}/g, wei)
        .replace(/\{microalgos\}/g, (params.amount * 1e6).toFixed(0))
        .replace(/\{nanoton\}/g, (params.amount * 1e9).toFixed(0));
      if (params.extraId) uri = uri.replace(/\{extraId\}/g, params.extraId);
      return uri;
    }
  }
  if (wallet && walletCfg?.enabled) {
    const uri = buildWalletSpecificURI({
      currency: params.currency,
      address: params.address,
      amount: params.amount,
      extraId: params.extraId,
      walletHint: wallet,
    });
    if (uri) return uri;
  }

  return buildCryptoPaymentURI(params).uri;
}
