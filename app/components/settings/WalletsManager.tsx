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
  ChevronRight,
  Star,
  Shield,
  Coins,
  Eye,
  EyeOff,
  Copy,
  ExternalLink
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
  const [hiddenAddresses, setHiddenAddresses] = useState<Record<string, boolean>>({});
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

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

  const toggleAddressVisibility = (currency: string) => {
    setHiddenAddresses(prev => ({
      ...prev,
      [currency]: !prev[currency]
    }));
  };

  const copyToClipboard = async (text: string, currency: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(currency);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const maskAddress = (address: string) => {
    if (address.length <= 8) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
    <div className="space-y-8">
      {/* Enhanced Smart Setup Info */}
      <Alert className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-blue-200 shadow-soft">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Info className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <AlertDescription className="text-blue-800">
              <div className="font-semibold mb-1">Smart Wallet Setup</div>
              <p className="text-sm leading-relaxed">
                Add a base cryptocurrency wallet and automatically support its stable coins. 
                Click on wallets with stable coins to see what's included!
              </p>
            </AlertDescription>
          </div>
        </div>
      </Alert>

      {/* Enhanced Configured Wallets Section */}
      {hasExistingWallets && (
        <Card className="border-green-200 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 shadow-medium hover:shadow-large transition-all duration-300">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl shadow-soft">
                  <Wallet className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-green-900 flex items-center gap-2">
                    Your Wallets
                    <div className="px-3 py-1 bg-green-200 text-green-800 text-sm font-semibold rounded-full">
                      {existingWallets.length}
                    </div>
                  </CardTitle>
                  <CardDescription className="text-green-700 font-medium">
                    Active cryptocurrency wallets ready for payments
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-700">Secured</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {existingWallets.map((currency) => (
                <Card key={currency} className="bg-white border-green-200 shadow-soft hover:shadow-medium transition-all duration-300 card-hover">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <CryptoIcon currency={currency} className="h-12 w-12" />
                          <div className="absolute -bottom-1 -right-1 p-1 bg-green-500 rounded-full">
                            <CheckCircle className="h-3 w-3 text-white" />
                          </div>
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-lg">{getCurrencyDisplayName(currency)}</div>
                          <div className="text-sm text-gray-500 font-medium">{currency}</div>
                          {hasStableCoins(currency) && (
                            <div className="flex items-center gap-1 mt-1">
                              <Coins className="h-3 w-3 text-blue-500" />
                              <span className="text-xs text-blue-600 font-medium">
                                +{stableCoinAssociations[currency].length} stablecoins
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasStableCoins(currency) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleStableCoins(currency)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                          >
                            {expandedStableCoins[currency] ? 
                              <ChevronDown className="h-4 w-4" /> : 
                              <ChevronRight className="h-4 w-4" />
                            }
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeWallet(currency)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="relative">
                        <Input
                          placeholder={`${getCurrencyDisplayName(currency)} wallet address`}
                          value={hiddenAddresses[currency] ? maskAddress(settings.wallets[currency] || '') : settings.wallets[currency] || ''}
                          onChange={(e) => handleWalletInputChange(currency, e.target.value)}
                          className="border-green-300 bg-white pr-20 font-mono text-sm"
                          type={hiddenAddresses[currency] ? "password" : "text"}
                        />
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleAddressVisibility(currency)}
                            className="h-8 w-8 p-0 hover:bg-gray-100"
                          >
                            {hiddenAddresses[currency] ? 
                              <Eye className="h-4 w-4 text-gray-500" /> : 
                              <EyeOff className="h-4 w-4 text-gray-500" />
                            }
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(settings.wallets[currency] || '', currency)}
                            className="h-8 w-8 p-0 hover:bg-gray-100"
                          >
                            {copiedAddress === currency ? 
                              <CheckCircle className="h-4 w-4 text-green-500" /> : 
                              <Copy className="h-4 w-4 text-gray-500" />
                            }
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getValidationIcon(currency)}
                          <span className="text-sm font-medium text-gray-600">
                            {getValidationMessage(currency)}
                          </span>
                        </div>
                        {validationStatus[currency] === 'valid' && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full">
                            <Star className="h-3 w-3 text-green-600" />
                            <span className="text-xs font-medium text-green-700">Active</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Enhanced stable coins display */}
                    {expandedStableCoins[currency] && hasStableCoins(currency) && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                        <div className="flex items-center gap-2 mb-3">
                          <Coins className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-bold text-blue-800">
                            Supported Stablecoins
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {stableCoinAssociations[currency].map((code) => (
                            <div key={code} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200 shadow-soft">
                              <CryptoIcon currency={code} className="h-8 w-8" />
                              <div>
                                <div className="text-sm font-semibold text-blue-900">{getCurrencyDisplayName(code)}</div>
                                <div className="text-xs text-blue-600">{code}</div>
                              </div>
                              <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Add New Wallet Section */}
      <Card className="border-gray-200 shadow-medium hover:shadow-large transition-all duration-300">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl shadow-soft">
                <Plus className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  Add New Wallet
                </CardTitle>
                <CardDescription className="text-gray-600 font-medium">
                  Search and configure cryptocurrency wallets
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTrustWalletGuide(true)}
              className="flex items-center gap-2"
            >
              <HelpCircle className="h-4 w-4" />
              Setup Guide
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Search cryptocurrencies (e.g., Bitcoin, Ethereum, Solana...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-14 text-base border-2 border-gray-200 focus:border-blue-500 rounded-xl"
            />
          </div>
          
          {loadingCurrencies ? (
            <div className="text-center py-12">
              <div className="p-4 bg-gray-50 rounded-xl inline-block">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-gray-400" />
                <p className="text-sm text-gray-600 font-medium">Loading currencies...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
              {filteredCurrencies.length === 0 ? (
                <div className="text-center py-8">
                  <div className="p-4 bg-gray-50 rounded-xl inline-block">
                    <Search className="h-8 w-8 mx-auto mb-3 text-gray-400" />
                    <p className="text-sm text-gray-600 font-medium">
                      {searchTerm ? 'No cryptocurrencies found' : 'Start typing to search currencies'}
                    </p>
                  </div>
                </div>
              ) : (
                filteredCurrencies.map((currency) => (
                  <Card key={currency.code} className="border border-gray-200 hover:border-blue-300 hover:shadow-medium transition-all duration-300 card-hover">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <CryptoIcon currency={currency.code} className="h-10 w-10" />
                          <div>
                            <div className="font-semibold text-gray-900">{currency.display_name || currency.name}</div>
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
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Input
                          placeholder={`Enter ${currency.display_name || currency.name} wallet address`}
                          value={settings.wallets[currency.code] || ''}
                          onChange={(e) => handleWalletInputChange(currency.code, e.target.value)}
                          className="font-mono text-sm"
                        />
                        
                        {validationStatus[currency.code] && validationStatus[currency.code] !== 'idle' && (
                          <div className="flex items-center gap-2 text-sm">
                            {getValidationIcon(currency.code)}
                            <span className={`font-medium ${
                              validationStatus[currency.code] === 'valid' ? 'text-green-600' :
                              validationStatus[currency.code] === 'invalid' ? 'text-red-600' :
                              'text-blue-600'
                            }`}>
                              {getValidationMessage(currency.code)}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Trust Wallet Guide Section */}
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 shadow-medium">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl shadow-soft">
                <HelpCircle className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-purple-900 text-lg">Need Help Setting Up?</h3>
                <p className="text-purple-700 font-medium">
                  Learn how to find and configure your wallet addresses
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowTrustWalletGuide(true)}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Setup Guide
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

