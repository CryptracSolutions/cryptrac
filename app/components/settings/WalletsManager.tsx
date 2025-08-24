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
  Clock,
  Plus,
  Search,
  ChevronDown,
  ChevronRight
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
  const [expandedSections, setExpandedSections] = useState({
    configured: true,
    popular: false,
    additional: false
  });

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
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'invalid':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'checking':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getValidationMessage = (currency: string) => {
    const status = validationStatus[currency] || 'idle';
    
    switch (status) {
      case 'valid':
        return 'Valid address';
      case 'invalid':
        return 'Invalid address';
      case 'checking':
        return 'Checking...';
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

  // Filter existing wallets for search
  const existingWallets = Object.keys(settings.wallets || {}).filter(currency => 
    settings.wallets[currency] && settings.wallets[currency].trim()
  );

  const filteredExistingWallets = existingWallets.filter(currency => {
    const currencyName = getCurrencyDisplayName(currency);
    return (
      currency.toLowerCase().includes(searchTerm.toLowerCase()) ||
      currencyName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const hasExistingWallets = existingWallets.length > 0;

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Smart Setup Info */}
      <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <Info className="h-5 w-5 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Smart Setup:</strong> Add a base cryptocurrency wallet and automatically support its stable coins. 
          <span className="block mt-1 text-sm">No need for separate addresses - one wallet supports multiple tokens!</span>
        </AlertDescription>
      </Alert>

      {/* Configured Wallets Section */}
      {hasExistingWallets && (
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-green-900">
                    Configured Wallets ({filteredExistingWallets.length})
                  </CardTitle>
                  <CardDescription className="text-green-700">
                    Your active cryptocurrency wallets
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSection('configured')}
                className="text-green-700 hover:text-green-800 hover:bg-green-100"
              >
                {expandedSections.configured ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          {expandedSections.configured && (
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                {filteredExistingWallets.map((currency) => (
                  <div key={currency} className="p-4 bg-white rounded-lg border border-green-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-green-600">
                            {currency}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{getCurrencyDisplayName(currency)}</div>
                          <div className="text-sm text-gray-500">Active wallet</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeWallet(currency)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <Input
                      placeholder={`${getCurrencyDisplayName(currency)} wallet address`}
                      value={settings.wallets[currency] || ''}
                      onChange={(e) => handleWalletInputChange(currency, e.target.value)}
                      className="border-green-300 bg-white"
                    />
                    
                    {/* Show included stable coins */}
                    {validationStatus[currency] === 'valid' && settings.wallets[currency] && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="text-xs font-medium text-green-800 mb-2">
                          ✅ Includes stable coins:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {(() => {
                            const stableCoinCodes = stableCoinAssociations[currency] || [];
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
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Popular Currencies Section */}
      <Card className="border-gray-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Wallet className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Popular Currencies
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Add wallets for the most popular cryptocurrencies
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('popular')}
              className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
            >
              {expandedSections.popular ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        {expandedSections.popular && (
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              {TOP_10_CURRENCIES.map((currency) => (
                <div key={currency.code} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">
                          {currency.symbol}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{currency.display_name}</div>
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
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Additional Currencies Section */}
      <Card className="border-gray-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Plus className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Additional Currencies
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Browse and add more cryptocurrency wallets
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('additional')}
              className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
            >
              {expandedSections.additional ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        {expandedSections.additional && (
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search currencies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {loadingCurrencies ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">Loading currencies...</p>
              </div>
            ) : (
              <div className="grid gap-3 max-h-64 overflow-y-auto">
                {filteredAdditionalCurrencies.map((currency) => (
                  <div key={currency.code} className="p-3 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-purple-600">
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
                    <Input
                      placeholder={`Enter ${currency.display_name || currency.name} wallet address`}
                      value={settings.wallets[currency.code] || ''}
                      onChange={(e) => handleWalletInputChange(currency.code, e.target.value)}
                      className={`text-sm ${
                        validationStatus[currency.code] === 'valid' ? 'border-green-500' :
                        validationStatus[currency.code] === 'invalid' ? 'border-red-500' :
                        validationStatus[currency.code] === 'checking' ? 'border-blue-500' : ''
                      }`}
                    />
                    {validationStatus[currency.code] && validationStatus[currency.code] !== 'idle' && (
                      <p className={`text-xs mt-1 ${
                        validationStatus[currency.code] === 'valid' ? 'text-green-600' :
                        validationStatus[currency.code] === 'invalid' ? 'text-red-600' :
                        'text-blue-600'
                      }`}>
                        {getValidationMessage(currency.code)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Help Section */}
      <div className="text-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowTrustWalletGuide(true)}
          className="flex items-center gap-2 mx-auto"
        >
          <HelpCircle className="h-4 w-4" />
          Need help setting up Trust Wallet?
        </Button>
      </div>
    </div>
  );
}
