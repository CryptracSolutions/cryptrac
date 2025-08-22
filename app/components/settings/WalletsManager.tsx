"use client"

import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Info,
  HelpCircle,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import TrustWalletGuide from '@/app/components/onboarding/trust-wallet-guide';

// Stable coin associations for automatic inclusion
const stableCoinAssociations: Record<string, string[]> = {
  SOL: ['USDCSOL', 'USDTSOL'],
  ETH: ['USDT', 'USDC', 'DAI', 'PYUSD'],
  BNB: ['USDTBSC', 'USDCBSC'],
  MATIC: ['USDTMATIC', 'USDCMATIC'],
  TRX: ['USDTTRC20'],
  TON: ['USDTTON'],
  ARB: ['USDTARB', 'USDCARB'],
  OP: ['USDTOP', 'USDCOP'],
  ETHBASE: ['USDCBASE'],
  ALGO: ['USDCALGO'],
};

const CURRENCY_NAMES: Record<string, string> = {
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  BNB: 'BNB',
  SOL: 'Solana',
  TRX: 'TRON',
  TON: 'Toncoin',
  AVAX: 'Avalanche',
  DOGE: 'Dogecoin',
  XRP: 'XRP',
  SUI: 'Sui',
  MATIC: 'Polygon',
  ADA: 'Cardano',
  DOT: 'Polkadot',
  LTC: 'Litecoin',
  XLM: 'Stellar',
  ARB: 'Arbitrum',
  OP: 'Optimism',
  ETHBASE: 'ETH (Base)',
  ALGO: 'Algorand',
  USDT: 'Tether (Ethereum)',
  USDC: 'USD Coin (Ethereum)',
  DAI: 'Dai (Ethereum)',
  PYUSD: 'PayPal USD (Ethereum)',
  USDCSOL: 'USD Coin (Solana)',
  USDTSOL: 'Tether (Solana)',
  USDTBSC: 'Tether (BSC)',
  USDCBSC: 'USD Coin (BSC)',
  USDTMATIC: 'Tether (Polygon)',
  USDCMATIC: 'USD Coin (Polygon)',
  USDTTRC20: 'Tether (Tron)',
  USDTTON: 'Tether (TON)',
  USDTARB: 'Tether (Arbitrum)',
  USDCARB: 'USD Coin (Arbitrum)',
  USDTOP: 'Tether (Optimism)',
  USDCOP: 'USD Coin (Optimism)',
  USDCBASE: 'USD Coin (Base)',
  USDCALGO: 'USD Coin (Algorand)',
};

// Top 10 + Major Stablecoins (Required for onboarding)
const TOP_10_CURRENCIES = [
  {
    code: 'BTC',
    name: 'Bitcoin',
    symbol: '₿',
    network: 'Bitcoin',
    trust_wallet_compatible: true,
    decimals: 8,
    min_amount: 0.00000001,
    display_name: 'Bitcoin',
    enabled: true,
    is_required: true
  },
  {
    code: 'ETH',
    name: 'Ethereum',
    symbol: 'Ξ',
    network: 'Ethereum',
    trust_wallet_compatible: true,
    decimals: 18,
    min_amount: 0.000000001,
    display_name: 'Ethereum',
    enabled: true,
    is_required: true
  },
  {
    code: 'BNB',
    name: 'BNB',
    symbol: 'BNB',
    network: 'BSC',
    trust_wallet_compatible: true,
    decimals: 18,
    min_amount: 0.000000001,
    display_name: 'BNB',
    enabled: true,
    is_required: true
  },
  {
    code: 'SOL',
    name: 'Solana',
    symbol: 'SOL',
    network: 'Solana',
    trust_wallet_compatible: true,
    decimals: 9,
    min_amount: 0.000000001,
    display_name: 'Solana',
    enabled: true,
    is_required: true
  },
  {
    code: 'TRX',
    name: 'TRON',
    symbol: 'TRX',
    network: 'TRON',
    trust_wallet_compatible: true,
    decimals: 6,
    min_amount: 0.000001,
    display_name: 'TRON',
    enabled: true,
    is_required: true
  },
  {
    code: 'TON',
    name: 'Toncoin',
    symbol: 'TON',
    network: 'TON',
    trust_wallet_compatible: true,
    decimals: 9,
    min_amount: 0.000000001,
    display_name: 'Toncoin',
    enabled: true,
    is_required: true
  },
  {
    code: 'AVAX',
    name: 'Avalanche',
    symbol: 'AVAX',
    network: 'Avalanche',
    trust_wallet_compatible: true,
    decimals: 18,
    min_amount: 0.000000001,
    display_name: 'Avalanche',
    enabled: true,
    is_required: true
  },
  {
    code: 'DOGE',
    name: 'Dogecoin',
    symbol: 'Ð',
    network: 'Dogecoin',
    trust_wallet_compatible: true,
    decimals: 8,
    min_amount: 0.00000001,
    display_name: 'Dogecoin',
    enabled: true,
    is_required: true
  },
  {
    code: 'XRP',
    name: 'XRP',
    symbol: 'XRP',
    network: 'XRP',
    trust_wallet_compatible: true,
    decimals: 6,
    min_amount: 0.000001,
    display_name: 'XRP',
    enabled: true,
    is_required: true
  },
  {
    code: 'SUI',
    name: 'Sui',
    symbol: 'SUI',
    network: 'Sui',
    trust_wallet_compatible: true,
    decimals: 9,
    min_amount: 0.000000001,
    display_name: 'Sui',
    enabled: true,
    is_required: true
  },
  {
    code: 'MATIC',
    name: 'Polygon',
    symbol: 'MATIC',
    network: 'Polygon',
    trust_wallet_compatible: true,
    decimals: 18,
    min_amount: 0.000000001,
    display_name: 'Polygon',
    enabled: true,
    is_required: true
  },
  {
    code: 'ADA',
    name: 'Cardano',
    symbol: 'ADA',
    network: 'Cardano',
    trust_wallet_compatible: true,
    decimals: 6,
    min_amount: 0.000001,
    display_name: 'Cardano',
    enabled: true,
    is_required: true
  },
  {
    code: 'DOT',
    name: 'Polkadot',
    symbol: 'DOT',
    network: 'Polkadot',
    trust_wallet_compatible: true,
    decimals: 10,
    min_amount: 0.0000000001,
    display_name: 'Polkadot',
    enabled: true,
    is_required: true
  },
  {
    code: 'LTC',
    name: 'Litecoin',
    symbol: 'Ł',
    network: 'Litecoin',
    trust_wallet_compatible: true,
    decimals: 8,
    min_amount: 0.00000001,
    display_name: 'Litecoin',
    enabled: true,
    is_required: true
  },
  {
    code: 'XLM',
    name: 'Stellar',
    symbol: 'XLM',
    network: 'Stellar',
    trust_wallet_compatible: true,
    decimals: 7,
    min_amount: 0.0000001,
    display_name: 'Stellar',
    enabled: true,
    is_required: true
  },
  {
    code: 'ARB',
    name: 'Arbitrum',
    symbol: 'ARB',
    network: 'Arbitrum',
    trust_wallet_compatible: true,
    decimals: 18,
    min_amount: 0.000000001,
    display_name: 'Arbitrum',
    enabled: true,
    is_required: true
  },
  {
    code: 'OP',
    name: 'Optimism',
    symbol: 'OP',
    network: 'Optimism',
    trust_wallet_compatible: true,
    decimals: 18,
    min_amount: 0.000000001,
    display_name: 'Optimism',
    enabled: true,
    is_required: true
  },
  {
    code: 'ETHBASE',
    name: 'ETH (Base)',
    symbol: 'ETH',
    network: 'Base',
    trust_wallet_compatible: true,
    decimals: 18,
    min_amount: 0.000000001,
    display_name: 'ETH (Base)',
    enabled: true,
    is_required: true
  },
  {
    code: 'ALGO',
    name: 'Algorand',
    symbol: 'ALGO',
    network: 'Algorand',
    trust_wallet_compatible: true,
    decimals: 6,
    min_amount: 0.000001,
    display_name: 'Algorand',
    enabled: true,
    is_required: true
  }
];

interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  network?: string;
  is_token?: boolean;
  parent_currency?: string;
  trust_wallet_compatible?: boolean;
  address_format?: string;
  enabled: boolean;
  min_amount: number;
  max_amount?: number;
  decimals: number;
  icon_url?: string;
  rate_usd?: number;
  display_name?: string;
}

type ValidationStatus = 'idle' | 'checking' | 'valid' | 'invalid';

interface WalletsManagerProps<T = any> {
  settings: T & {
    wallets: Record<string, string>;
  };
  setSettings: React.Dispatch<React.SetStateAction<T & {
    wallets: Record<string, string>;
  }>>;
  setShowTrustWalletGuide: (show: boolean) => void;
}

export default function WalletsManager<T = any>({ settings, setSettings, setShowTrustWalletGuide }: WalletsManagerProps<T>) {
  const [validationStatus, setValidationStatus] = useState<Record<string, ValidationStatus>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [additionalCurrencies, setAdditionalCurrencies] = useState<CurrencyInfo[]>([]);
  const [loadingCurrencies, setLoadingCurrencies] = useState(false);

  // Initialize validation status for all currencies
  useEffect(() => {
    const initialValidation: Record<string, ValidationStatus> = {};
    
    // Initialize for top 10 currencies
    TOP_10_CURRENCIES.forEach(currency => {
      initialValidation[currency.code] = 'idle';
    });
    
    // Initialize for existing wallets (assume they are valid)
    if (settings.wallets) {
      Object.keys(settings.wallets).forEach(currency => {
        if (settings.wallets[currency] && settings.wallets[currency].trim()) {
          initialValidation[currency] = 'valid';
        } else {
          initialValidation[currency] = 'idle';
        }
      });
    }
    
    setValidationStatus(initialValidation);
  }, [settings.wallets]);

  // Load additional currencies
  useEffect(() => {
    const loadAdditionalCurrencies = async () => {
      try {
        setLoadingCurrencies(true);
        const response = await fetch('/api/currencies');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.currencies) {
            // Filter out currencies that are already in TOP_10_CURRENCIES
            const topCurrencyCodes = TOP_10_CURRENCIES.map(c => c.code);
            const filtered = data.currencies.filter((currency: CurrencyInfo) => !topCurrencyCodes.includes(currency.code));
            setAdditionalCurrencies(filtered);
          
            // Initialize validation status for additional currencies
            setValidationStatus(prev => {
              const newStatus = { ...prev };
              filtered.forEach((currency: CurrencyInfo) => {
                if (!newStatus[currency.code]) {
                  // Check if this currency has an existing wallet
                  if (settings.wallets && settings.wallets[currency.code] && settings.wallets[currency.code].trim()) {
                    newStatus[currency.code] = 'valid';
                  } else {
                    newStatus[currency.code] = 'idle';
                  }
                }
              });
              return newStatus;
            });
          }
        }
      } catch (error) {
        console.error('Failed to load additional currencies:', error);
      } finally {
        setLoadingCurrencies(false);
      }
    };

    loadAdditionalCurrencies();
  }, [settings.wallets]);

  const getCurrencyDisplayName = (code: string) => {
    return CURRENCY_NAMES[code] || code;
  };

  const validateWalletAddress = async (currency: string, address: string) => {
    if (!address.trim()) {
      setValidationStatus(prev => ({ ...prev, [currency]: 'invalid', ...(currency === 'ETH' ? { ETHBASE: 'invalid' } : {}) }));
      return;
    }

    setValidationStatus(prev => ({ ...prev, [currency]: 'checking' }));

    try {
      const response = await fetch('/api/wallets/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currency,
          address: address.trim()
        }),
      });

      const result = await response.json();

      if (result.validation && result.validation.valid) {
        setValidationStatus(prev => ({
          ...prev,
          [currency]: 'valid',
          ...(currency === 'ETH' ? { ETHBASE: 'valid' } : {}),
          ...(stableCoinAssociations[currency] || []).reduce((acc, stableCoin) => ({
            ...acc,
            [stableCoin]: 'valid'
          }), {})
        }));
      } else {
        setValidationStatus(prev => ({ ...prev, [currency]: 'invalid', ...(currency === 'ETH' ? { ETHBASE: 'invalid' } : {}) }));
      }
    } catch (error) {
      console.error('Validation error:', error);
      setValidationStatus(prev => ({ ...prev, [currency]: 'invalid', ...(currency === 'ETH' ? { ETHBASE: 'invalid' } : {}) }));
    }
  };

  const handleWalletInputChange = async (currency: string, address: string) => {
    setSettings(prev => ({ ...prev, wallets: { ...prev.wallets, [currency]: address } }));
    
    if (!address.trim()) {
      setValidationStatus(prev => ({ ...prev, [currency]: 'idle', ...(currency === 'ETH' ? { ETHBASE: 'idle' } : {}) }));
      return;
    }

    // Debounce validation
    const timeoutId = setTimeout(() => {
      validateWalletAddress(currency, address);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const removeWallet = (currency: string) => {
    setSettings(prev => {
      const newWallets = { ...prev.wallets };
      delete newWallets[currency];
      return { ...prev, wallets: newWallets };
    });

    setValidationStatus(prev => {
      const newStatus = { ...prev };
      delete newStatus[currency];
      if (currency === 'ETH') {
        delete newStatus.ETHBASE;
      }
      return newStatus;
    });
  };

  const getValidationIcon = (currency: string) => {
    const status = validationStatus[currency] || 'idle';
    
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'invalid':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'checking':
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getValidationMessage = (currency: string) => {
    const status = validationStatus[currency] || 'idle';
    
    switch (status) {
      case 'valid':
        return '✓ Valid wallet address';
      case 'invalid':
        return '✗ Invalid wallet address';
      case 'checking':
        return 'Checking wallet address...';
      default:
        return '';
    }
  };

  const filteredAdditionalCurrencies = additionalCurrencies.filter(currency => {
    // Check if this currency is a stable coin of any base currency
    const isStableCoin = Object.values(stableCoinAssociations).some(stableCoins => 
      stableCoins.includes(currency.code)
    );
    
    // Include if not a stable coin and matches search term
    return !isStableCoin && (
      currency.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      currency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      currency.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Configured Wallet Addresses
          </CardTitle>
          <CardDescription>
            Manage your cryptocurrency wallet addresses for receiving payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stable Coin Information */}
          <Alert className="bg-green-50 border-green-200">
            <Info className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Smart Wallet Setup:</strong> Configure base cryptocurrency wallets below and automatically support their stable coins.
              <div className="mt-2 text-sm font-medium">
                No need to add separate wallet addresses for stable coins - they use the same address as their base currency!
              </div>
            </AlertDescription>
          </Alert>

          {/* Trust Wallet Guide Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTrustWalletGuide(true)}
              className="flex items-center gap-2"
            >
              <HelpCircle className="h-4 w-4" />
              Trust Wallet Guide
            </Button>
          </div>

          {/* Top 10 + Major Stablecoins */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Accepted Currencies</h3>
            <div className="grid gap-4">
              {TOP_10_CURRENCIES.map((currency) => (
                <div key={currency.code} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-600">
                          {currency.symbol}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{currency.display_name}</div>
                        <div className="text-sm text-gray-500">{currency.network}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getValidationIcon(currency.code)}
                      {settings.wallets[currency.code] && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeWallet(currency.code)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Input
                      placeholder={`Enter your ${currency.display_name} wallet address`}
                      value={settings.wallets[currency.code] || ''}
                      onChange={(e) => handleWalletInputChange(currency.code, e.target.value)}
                      className={`${
                        validationStatus[currency.code] === 'valid' ? 'border-green-500' :
                        validationStatus[currency.code] === 'invalid' ? 'border-red-500' :
                        validationStatus[currency.code] === 'checking' ? 'border-blue-500' : ''
                      }`}
                    />
                    {validationStatus[currency.code] && validationStatus[currency.code] !== 'idle' && (
                      <p className={`text-xs ${
                        validationStatus[currency.code] === 'valid' ? 'text-green-600' :
                        validationStatus[currency.code] === 'invalid' ? 'text-red-600' :
                        'text-blue-600'
                      }`}>
                        {getValidationMessage(currency.code)}
                      </p>
                    )}
                    
                    {/* Show included stable coins for validated base currencies */}
                    {validationStatus[currency.code] === 'valid' && settings.wallets[currency.code] && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="text-xs font-medium text-green-800 mb-2">
                          ✅ Automatically includes these stable coins:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {(() => {
                            const stableCoinCodes = stableCoinAssociations[currency.code] || [];
                            return stableCoinCodes.map((code, index) => (
                              <span
                                key={index}
                                className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded"
                              >
                                {getCurrencyDisplayName(code)}
                              </span>
                            ));
                          })()}
                        </div>
                        {(() => {
                          const stableCoinCodes = stableCoinAssociations[currency.code] || [];
                          return stableCoinCodes.length === 0 ? null : (
                            <div className="mt-2 text-xs text-green-700">
                              Customers can pay with {currency.code} or any of these {stableCoinCodes.length} stable coins using the same address.
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Currencies */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Additional Currencies</h3>
            
            <div className="space-y-4">
              <Input
                placeholder="Search currencies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
              
              {loadingCurrencies ? (
                <div className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Loading currencies...</p>
                </div>
              ) : (
                <div className="grid gap-3 max-h-96 overflow-y-auto">
                  {filteredAdditionalCurrencies.map((currency) => (
                    <div key={currency.code} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-gray-600">
                              {currency.symbol || currency.code.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-sm">{currency.display_name || currency.name}</div>
                            <div className="text-xs text-gray-500">{currency.network}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getValidationIcon(currency.code)}
                          {settings.wallets[currency.code] && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeWallet(currency.code)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Input
                          placeholder={`Enter your ${currency.display_name || currency.name} wallet address`}
                          value={settings.wallets[currency.code] || ''}
                          onChange={(e) => handleWalletInputChange(currency.code, e.target.value)}
                          className={`text-sm ${
                            validationStatus[currency.code] === 'valid' ? 'border-green-500' :
                            validationStatus[currency.code] === 'invalid' ? 'border-red-500' :
                            validationStatus[currency.code] === 'checking' ? 'border-blue-500' : ''
                          }`}
                        />
                        {validationStatus[currency.code] && validationStatus[currency.code] !== 'idle' && (
                          <p className={`text-xs ${
                            validationStatus[currency.code] === 'valid' ? 'text-green-600' :
                            validationStatus[currency.code] === 'invalid' ? 'text-red-600' :
                            'text-blue-600'
                          }`}>
                            {getValidationMessage(currency.code)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
