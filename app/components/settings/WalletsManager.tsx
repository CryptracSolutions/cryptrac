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
import { CryptoIcon } from '@/app/components/ui/crypto-icon';
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
  const [expandedStableCoins, setExpandedStableCoins] = useState<Record<string, boolean>>({});

  // Initialize validation status for all currencies
  useEffect(() => {
    const initialValidation: Record<string, ValidationStatus> = {};
    
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
            setAdditionalCurrencies(data.currencies);
          
            // Initialize validation status for additional currencies
            setValidationStatus(prev => {
              const newStatus = { ...prev };
              data.currencies.forEach((currency: CurrencyInfo) => {
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
      setValidationStatus(prev => ({ ...prev, [currency]: 'invalid' }));
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
          [currency]: 'valid'
        }));
      } else {
        setValidationStatus(prev => ({ ...prev, [currency]: 'invalid' }));
      }
    } catch (error) {
      console.error('Validation error:', error);
      setValidationStatus(prev => ({ ...prev, [currency]: 'invalid' }));
    }
  };

  const handleWalletInputChange = async (currency: string, address: string) => {
    setSettings(prev => ({ ...prev, wallets: { ...prev.wallets, [currency]: address } }));
    
    if (!address.trim()) {
      setValidationStatus(prev => ({ ...prev, [currency]: 'idle' }));
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

  const filteredCurrencies = additionalCurrencies.filter(currency => {
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

  // Get existing wallets
  const existingWallets = Object.keys(settings.wallets || {}).filter(currency => 
    settings.wallets[currency] && settings.wallets[currency].trim()
  );

  const hasExistingWallets = existingWallets.length > 0;

  const toggleStableCoins = (currency: string) => {
    setExpandedStableCoins(prev => ({
      ...prev,
      [currency]: !prev[currency]
    }));
  };

  const hasStableCoins = (currency: string) => {
    return stableCoinAssociations[currency] && stableCoinAssociations[currency].length > 0;
  };

  return (
    <div className="space-y-6">
      {/* Smart Setup Info */}
      <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <Info className="h-5 w-5 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Smart Setup:</strong> Add a base cryptocurrency wallet and automatically support its stable coins. 
          <span className="block mt-1 text-sm">Click on wallets with stable coins to see what's included!</span>
        </AlertDescription>
      </Alert>

      {/* Configured Wallets Section */}
      {hasExistingWallets && (
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-green-900">
                  Your Wallets ({existingWallets.length})
                </CardTitle>
                <CardDescription className="text-green-700">
                  Active cryptocurrency wallets
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {existingWallets.map((currency) => (
                <div key={currency} className="p-4 bg-white rounded-lg border border-green-200 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <CryptoIcon currency={currency} className="h-10 w-10" />
                      <div>
                        <div className="font-semibold text-gray-900">{getCurrencyDisplayName(currency)}</div>
                        <div className="text-sm text-gray-500">{currency}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      {hasStableCoins(currency) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleStableCoins(currency)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          {expandedStableCoins[currency] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                      )}
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
                  
                  {/* Show stable coins if expanded */}
                  {expandedStableCoins[currency] && hasStableCoins(currency) && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-xs font-medium text-blue-800 mb-2">
                        ✅ Also supports these stable coins:
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {stableCoinAssociations[currency].map((code) => (
                          <div key={code} className="flex items-center gap-2 p-2 bg-white rounded border border-blue-200">
                            <CryptoIcon currency={code} className="h-6 w-6" />
                            <span className="text-xs font-medium text-blue-700">{getCurrencyDisplayName(code)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add New Wallet Section */}
      <Card className="border-gray-200">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Plus className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Add New Wallet
              </CardTitle>
              <CardDescription className="text-gray-600">
                Search and add cryptocurrency wallets
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search cryptocurrencies..."
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
              {filteredCurrencies.map((currency) => (
                <div key={currency.code} className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <CryptoIcon currency={currency.code} className="h-8 w-8" />
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
