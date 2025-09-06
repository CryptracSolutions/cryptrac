import { buildCryptoPaymentURI } from './crypto-uri-builder'
import { buildWalletSpecificURI, buildBestURI, buildPlatformOptimizedURI } from './wallet-uri-helper'
import type { DynamicConfig } from './wallet-uri-config'

export interface ABVariant { name: string; weight: number; strategy: 'standard' | 'wallet-specific' | 'multi-fallback' | 'platform-optimized' }
export interface ABTestConfig { testName: string; variants: ABVariant[]; metrics: string[] }

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = (h ^ str.charCodeAt(i)) * 16777619;
  return Math.abs(h >>> 0);
}

export function getOrCreateClientId(): string {
  if (typeof window === 'undefined') return 'server';
  const key = 'cryptrac_client_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

export function getActiveABTests(): ABTestConfig[] {
  return [{
    testName: 'uri-strategy',
    variants: [
      { name: 'control-standard', weight: 34, strategy: 'standard' },
      { name: 't1-wallet-specific', weight: 33, strategy: 'wallet-specific' },
      { name: 't2-multi-fallback', weight: 33, strategy: 'multi-fallback' },
    ],
    metrics: ['init', 'open', 'success'],
  }];
}

export function isUserInTest(): boolean { return true }

export function getUserVariant(userId: string, test: ABTestConfig): ABVariant {
  const bucket = hashString(`${test.testName}:${userId}`) % 100;
  let acc = 0;
  for (const v of test.variants) {
    acc += v.weight;
    if (bucket < acc) return v;
  }
  return test.variants[test.variants.length - 1];
}

export function trackABTestExposure(userId: string, testName: string, variant: string) {
  try {
    if (typeof fetch !== 'undefined') {
      fetch('/api/analytics/ab-exposure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, testName, variant, ts: Date.now() })
      }).catch(() => {});
    }
  } catch {}
}

export function getURIStrategy(userId: string): ABVariant['strategy'] {
  const tests = getActiveABTests();
  for (const test of tests) {
    if (isUserInTest()) {
      const variant = getUserVariant(userId, test);
      trackABTestExposure(userId, test.testName, variant.name);
      return variant.strategy;
    }
  }
  return 'wallet-specific';
}

export function buildTestableURI(params: {
  currency: string;
  address: string;
  amount: number;
  extraId?: string;
  userId: string;
  config?: DynamicConfig;
  strategyOverride?: string;
}): { uri: string; strategy: ABVariant['strategy'] } {
  const strategy = (params.strategyOverride as ABVariant['strategy']) || getURIStrategy(params.userId);
  const config = params.config;
  if (config?.fallbackBehavior === 'standard-only') {
    return { uri: buildCryptoPaymentURI(params).uri, strategy: 'standard' };
  }

  switch (strategy) {
    case 'standard': {
      return { uri: buildCryptoPaymentURI(params).uri, strategy };
    }
    case 'wallet-specific': {
      const w = buildWalletSpecificURI(params);
      return { uri: w || buildCryptoPaymentURI(params).uri, strategy };
    }
    case 'multi-fallback': {
      const c = buildBestURI(params);
      return { uri: c.uri, strategy };
    }
    case 'platform-optimized': {
      return { uri: buildPlatformOptimizedURI(params), strategy };
    }
    default: {
      const c = buildBestURI(params);
      return { uri: c.uri, strategy: 'multi-fallback' };
    }
  }
}
