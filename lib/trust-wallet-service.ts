// Trust Wallet Currency Service
// Provides the fixed list of Trust Wallet compatible currencies for wallet generation
// Separate from the dynamic currency service to maintain clear separation of concerns

import { getTrustWalletCurrencies } from './wallet-generation';

export interface TrustWalletCurrency {
  code: string;
  name: string;
  symbol: string;
  network: string;
  address_type: string;
  derivation_path: string;
  trust_wallet_compatible: boolean;
  decimals: number;
  min_amount: number;
  is_token?: boolean;
  parent_currency?: string;
  display_name?: string;
}

/**
 * Get all Trust Wallet compatible currencies
 */
export function getAllTrustWalletCurrencies(): TrustWalletCurrency[] {
  return getTrustWalletCurrencies();
}

/**
 * Get Trust Wallet currencies grouped by network
 */
export function getTrustWalletCurrenciesByNetwork(): Record<string, TrustWalletCurrency[]> {
  const currencies = getTrustWalletCurrencies();
  
  return currencies.reduce((acc, currency) => {
    const network = currency.network;
    if (!acc[network]) {
      acc[network] = [];
    }
    acc[network].push(currency);
    return acc;
  }, {} as Record<string, TrustWalletCurrency[]>);
}

/**
 * Get a specific Trust Wallet currency by code
 */
export function getTrustWalletCurrency(code: string): TrustWalletCurrency | null {
  const currencies = getTrustWalletCurrencies();
  return currencies.find(c => c.code.toLowerCase() === code.toLowerCase()) || null;
}

/**
 * Check if a currency is Trust Wallet compatible
 */
export function isTrustWalletCompatible(code: string): boolean {
  return getTrustWalletCurrency(code) !== null;
}

/**
 * Get currencies that share the same address (same network/derivation path)
 */
export function getCurrenciesWithSharedAddress(code: string): TrustWalletCurrency[] {
  const currency = getTrustWalletCurrency(code);
  if (!currency) return [];
  
  const currencies = getTrustWalletCurrencies();
  return currencies.filter(c => 
    c.derivation_path === currency.derivation_path && 
    c.address_type === currency.address_type
  );
}

/**
 * Get network information for display purposes
 */
export function getNetworkDisplayInfo(network: string): {
  name: string;
  color: string;
  description: string;
} {
  const networkInfo: Record<string, { name: string; color: string; description: string }> = {
    'Bitcoin': {
      name: 'Bitcoin',
      color: 'bg-orange-100 text-orange-800',
      description: 'Bitcoin network'
    },
    'Ethereum': {
      name: 'Ethereum',
      color: 'bg-blue-100 text-blue-800',
      description: 'Ethereum network (ERC-20 tokens)'
    },
    'Polygon': {
      name: 'Polygon',
      color: 'bg-purple-100 text-purple-800',
      description: 'Polygon network (Layer 2)'
    },
    'BSC': {
      name: 'BSC',
      color: 'bg-yellow-100 text-yellow-800',
      description: 'BNB Smart Chain (BEP-20 tokens)'
    },
    'Tron': {
      name: 'Tron',
      color: 'bg-red-100 text-red-800',
      description: 'Tron network (TRC-20 tokens)'
    },
    'Litecoin': {
      name: 'Litecoin',
      color: 'bg-gray-100 text-gray-800',
      description: 'Litecoin network'
    },
    'Solana': {
      name: 'Solana',
      color: 'bg-green-100 text-green-800',
      description: 'Solana network'
    },
    'XRP Ledger': {
      name: 'XRP',
      color: 'bg-indigo-100 text-indigo-800',
      description: 'XRP Ledger'
    },
    'Dogecoin': {
      name: 'Dogecoin',
      color: 'bg-amber-100 text-amber-800',
      description: 'Dogecoin network'
    }
  };

  return networkInfo[network] || {
    name: network,
    color: 'bg-gray-100 text-gray-800',
    description: network
  };
}

/**
 * Get payment instructions for customers
 */
export function getPaymentInstructions(code: string): {
  currency: TrustWalletCurrency;
  instructions: string;
  warning?: string;
} | null {
  const currency = getTrustWalletCurrency(code);
  if (!currency) return null;

  let instructions = `Send ${currency.code}`;
  let warning: string | undefined;

  // Add network-specific instructions
  if (currency.display_name) {
    instructions = `Send ${currency.display_name}`;
  } else if (currency.is_token && currency.parent_currency) {
    instructions = `Send ${currency.code} via ${currency.network} network`;
  } else {
    instructions = `Send ${currency.code} to this address`;
  }

  // Add warnings for specific currencies
  if (currency.code === 'USDT_ERC20') {
    warning = 'Make sure to send USDT via Ethereum network (ERC-20), not Tron or other networks';
  } else if (currency.code === 'USDT_TRC20') {
    warning = 'Make sure to send USDT via Tron network (TRC-20), not Ethereum or other networks';
  } else if (currency.code === 'USDC_ERC20') {
    warning = 'Make sure to send USDC via Ethereum network (ERC-20), not Polygon or other networks';
  } else if (currency.code === 'USDC_POLYGON') {
    warning = 'Make sure to send USDC via Polygon network, not Ethereum or other networks';
  }

  return {
    currency,
    instructions,
    warning
  };
}

/**
 * Get all supported networks
 */
export function getSupportedNetworks(): string[] {
  const currencies = getTrustWalletCurrencies();
  const networks = new Set(currencies.map(c => c.network));
  return Array.from(networks);
}

/**
 * Get currency codes for a specific network
 */
export function getCurrenciesForNetwork(network: string): string[] {
  const currencies = getTrustWalletCurrencies();
  return currencies
    .filter(c => c.network === network)
    .map(c => c.code);
}

/**
 * Format currency amount with proper decimals
 */
export function formatCurrencyAmount(amount: number, currencyCode: string): string {
  const currency = getTrustWalletCurrency(currencyCode);
  if (!currency) return amount.toString();

  return amount.toFixed(currency.decimals);
}

/**
 * Validate minimum amount for a currency
 */
export function validateMinimumAmount(amount: number, currencyCode: string): boolean {
  const currency = getTrustWalletCurrency(currencyCode);
  if (!currency) return false;

  return amount >= currency.min_amount;
}

/**
 * Get Trust Wallet import instructions
 */
export function getTrustWalletImportInstructions(): {
  title: string;
  steps: string[];
  videoUrl?: string;
} {
  return {
    title: 'How to Import Your Wallets into Trust Wallet',
    steps: [
      'Download Trust Wallet from the App Store or Google Play',
      'Open Trust Wallet and tap "I already have a wallet"',
      'Select "Multi-Coin wallet"',
      'Enter your 12-word recovery phrase',
      'Create a secure password',
      'Your wallets will automatically appear for all supported cryptocurrencies'
    ],
    videoUrl: 'https://www.youtube.com/watch?v=example' // Replace with actual video
  };
}

