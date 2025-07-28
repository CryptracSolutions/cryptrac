'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Settings, 
  Wallet, 
  Save, 
  AlertCircle,
  CheckCircle,
  Loader2,
  Info,
  Plus,
  Trash2,
  DollarSign,
  HelpCircle,
  Star,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { DashboardLayout } from '@/app/components/layout/dashboard-layout';
import { Input } from '@/app/components/ui/input';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { Badge } from '@/app/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Checkbox } from '@/app/components/ui/checkbox';
import { supabase } from '@/lib/supabase-browser';
import toast from 'react-hot-toast';
import TrustWalletGuide from '@/app/components/onboarding/trust-wallet-guide';

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

interface MerchantSettings {
  charge_customer_fee: boolean;
  auto_convert_enabled: boolean;
  preferred_payout_currency: string | null;
  wallets: Record<string, string>;
  payment_config: {
    auto_forward: boolean;
    fee_percentage: number;
    auto_convert_fee: number;
  };
}

interface UserType {
  id: string;
  email?: string;
  user_metadata?: {
    business_name?: string;
  };
}

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
    display_name: 'BNB (Binance Smart Chain)',
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
    network: 'Tron',
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
    code: 'DOGE',
    name: 'Dogecoin',
    symbol: 'DOGE',
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
    network: 'XRP Ledger',
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
  // Major Stablecoins
  {
    code: 'USDT_ERC20',
    name: 'Tether (Ethereum)',
    symbol: '₮',
    network: 'Ethereum',
    trust_wallet_compatible: true,
    decimals: 6,
    min_amount: 0.000001,
    is_token: true,
    parent_currency: 'ETH',
    display_name: 'USDT via Ethereum',
    enabled: true,
    is_required: true
  },
  {
    code: 'USDC_ERC20',
    name: 'USD Coin (Ethereum)',
    symbol: 'USDC',
    network: 'Ethereum',
    trust_wallet_compatible: true,
    decimals: 6,
    min_amount: 0.000001,
    is_token: true,
    parent_currency: 'ETH',
    display_name: 'USDC via Ethereum',
    enabled: true,
    is_required: true
  },
  {
    code: 'USDT_TRC20',
    name: 'Tether (TRON)',
    symbol: '₮',
    network: 'Tron',
    trust_wallet_compatible: true,
    decimals: 6,
    min_amount: 0.000001,
    is_token: true,
    parent_currency: 'TRX',
    display_name: 'USDT via TRON',
    enabled: true,
    is_required: true
  },
  {
    code: 'USDC_SOL',
    name: 'USD Coin (Solana)',
    symbol: 'USDC',
    network: 'Solana',
    trust_wallet_compatible: true,
    decimals: 6,
    min_amount: 0.000001,
    is_token: true,
    parent_currency: 'SOL',
    display_name: 'USDC via Solana',
    enabled: true,
    is_required: true
  }
]

export default function MerchantSettingsPage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<MerchantSettings>({
    charge_customer_fee: false,
    auto_convert_enabled: false,
    preferred_payout_currency: null,
    wallets: {},
    payment_config: {
      auto_forward: false,
      fee_percentage: 2.5,
      auto_convert_fee: 1.0
    }
  });
  
  // Dynamic currency support
  const [availableCurrencies, setAvailableCurrencies] = useState<CurrencyInfo[]>([]);
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);
  const [validationStates, setValidationStates] = useState<Record<string, 'validating' | 'valid' | 'invalid' | null>>({});
  const [showTrustWalletGuide, setShowTrustWalletGuide] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const router = useRouter();

  const loadUserAndSettings = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        router.push('/auth/login');
        return;
      }

      setUser(user as UserType);

      // Load merchant settings
      const { data: merchant, error: merchantError } = await supabase
        .from('merchants')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (merchantError) {
        console.error('Error loading merchant:', merchantError);
        toast.error('Failed to load merchant settings');
        return;
      }

      if (merchant) {
        // Convert wallet data to our format
        const wallets = merchant.wallets || {};

        setSettings({
          charge_customer_fee: merchant.charge_customer_fee || false,
          auto_convert_enabled: merchant.auto_convert_enabled || false,
          preferred_payout_currency: merchant.preferred_payout_currency,
          wallets,
          payment_config: {
            auto_forward: merchant.auto_forward_enabled || false,
            fee_percentage: merchant.fee_percentage || 2.5,
            auto_convert_fee: merchant.auto_convert_fee || 1.0
          }
        });
      }

    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableCurrencies = async () => {
    try {
      setLoadingCurrencies(true);
      
      const response = await fetch('/api/currencies');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Filter out currencies that are already in TOP_10_CURRENCIES
          const additionalCurrencies = data.currencies.filter((currency: CurrencyInfo) => 
            !TOP_10_CURRENCIES.find(top10 => top10.code === currency.code)
          );
          setAvailableCurrencies(additionalCurrencies);
        }
      }
      
    } catch (error) {
      console.error('Failed to load currencies:', error);
      toast.error('Failed to load available currencies');
      setAvailableCurrencies([]);
    } finally {
      setLoadingCurrencies(false);
    }
  };

  useEffect(() => {
    loadUserAndSettings();
    loadAvailableCurrencies();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const validateWalletAddress = async (crypto: string, address: string): Promise<boolean> => {
    if (!address.trim()) return false;
    
    try {
      setValidationStates(prev => ({ ...prev, [crypto]: 'validating' }));
      
      const response = await fetch('/api/wallets/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: address.trim(), currency: crypto })
      });
      
      if (response.ok) {
        const data = await response.json();
        const isValid = data.validation?.valid || false;
        setValidationStates(prev => ({ ...prev, [crypto]: isValid ? 'valid' : 'invalid' }));
        return isValid;
      }
      
      setValidationStates(prev => ({ ...prev, [crypto]: 'invalid' }));
      return false;
    } catch (error) {
      console.error('Address validation failed:', error);
      setValidationStates(prev => ({ ...prev, [crypto]: 'invalid' }));
      return false;
    }
  };

  const handleAddWallet = (currencyCode: string) => {
    if (!settings.wallets[currencyCode]) {
      setSettings(prev => ({
        ...prev,
        wallets: { ...prev.wallets, [currencyCode]: '' }
      }));
    }
  };

  const handleRemoveWallet = (crypto: string) => {
    const newWallets = { ...settings.wallets };
    delete newWallets[crypto];
    setSettings(prev => ({ ...prev, wallets: newWallets }));
    
    // Clear validation state
    const newValidationStates = { ...validationStates };
    delete newValidationStates[crypto];
    setValidationStates(newValidationStates);
  };

  const handleWalletChange = (crypto: string, address: string) => {
    setSettings(prev => ({
      ...prev,
      wallets: { ...prev.wallets, [crypto]: address }
    }));
    
    // Reset validation state
    setValidationStates(prev => ({ ...prev, [crypto]: null }));
    
    // Validate address after a short delay
    if (address.trim()) {
      setTimeout(() => validateWalletAddress(crypto, address), 500);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);

      if (!user) {
        toast.error('User not authenticated');
        return;
      }

      // Validate all wallet addresses
      const validationPromises = Object.entries(settings.wallets).map(async ([crypto, address]) => {
        if (address.trim()) {
          const isValid = await validateWalletAddress(crypto, address);
          if (!isValid) {
            throw new Error(`Invalid ${crypto} address format`);
          }
        }
      });

      await Promise.all(validationPromises);

      // Update merchant settings
      const { error: merchantError } = await supabase
        .from('merchants')
        .update({
          charge_customer_fee: settings.charge_customer_fee,
          auto_convert_enabled: settings.auto_convert_enabled,
          preferred_payout_currency: settings.preferred_payout_currency,
          wallets: settings.wallets,
          auto_forward_enabled: settings.payment_config.auto_forward,
          fee_percentage: settings.payment_config.fee_percentage,
          auto_convert_fee: settings.payment_config.auto_convert_fee,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (merchantError) {
        throw merchantError;
      }

      toast.success('Settings saved successfully!');

    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const getCurrencyInfo = (code: string) => {
    // First check TOP_10_CURRENCIES
    const top10Currency = TOP_10_CURRENCIES.find(c => c.code === code);
    if (top10Currency) {
      return top10Currency;
    }
    
    // Then check available currencies
    return availableCurrencies.find(c => c.code === code) || {
      code,
      name: code,
      symbol: code,
      enabled: true,
      min_amount: 0.00000001,
      decimals: 8,
      trust_wallet_compatible: false
    };
  };

  const getValidationIcon = (crypto: string) => {
    const state = validationStates[crypto];
    switch (state) {
      case 'validating':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'valid':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'invalid':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getNetworkBadgeColor = (network: string) => {
    const colorMap: Record<string, string> = {
      'Bitcoin': 'bg-orange-100 text-orange-800',
      'Ethereum': 'bg-blue-100 text-blue-800',
      'BSC': 'bg-yellow-100 text-yellow-800',
      'Solana': 'bg-green-100 text-green-800',
      'Tron': 'bg-red-100 text-red-800',
      'TON': 'bg-indigo-100 text-indigo-800',
      'Dogecoin': 'bg-amber-100 text-amber-800',
      'XRP Ledger': 'bg-purple-100 text-purple-800',
      'Sui': 'bg-cyan-100 text-cyan-800',
      'Avalanche': 'bg-rose-100 text-rose-800'
    }
    return colorMap[network] || 'bg-gray-100 text-gray-800'
  };

  const filteredAdditionalCurrencies = availableCurrencies.filter(currency =>
    currency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    currency.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    currency.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (showTrustWalletGuide) {
    return (
      <DashboardLayout>
        <TrustWalletGuide
          onComplete={() => setShowTrustWalletGuide(false)}
          onSkip={() => setShowTrustWalletGuide(false)}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center space-x-3">
          <Settings className="w-8 h-8 text-[#7f5efd]" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Manage your payment settings and wallet addresses</p>
          </div>
        </div>

        <Tabs defaultValue="wallets" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="wallets">Wallet Management</TabsTrigger>
            <TabsTrigger value="fees">Fee Settings</TabsTrigger>
            <TabsTrigger value="conversion">Auto-Conversion</TabsTrigger>
          </TabsList>

          {/* Wallet Management Tab */}
          <TabsContent value="wallets" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wallet className="w-5 h-5" />
                  <span>Crypto Wallets</span>
                </CardTitle>
                <CardDescription>
                  Configure where you want to receive cryptocurrency payments. 
                  Add wallet addresses for cryptocurrencies you want to accept.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Trust Wallet Setup Button */}
                <div className="text-center">
                  <Button
                    type="button"
                    onClick={() => setShowTrustWalletGuide(true)}
                    variant="outline"
                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Need help setting up Trust Wallet?
                  </Button>
                </div>

                {/* Required Cryptocurrencies */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold text-gray-900">Top 10 + Major Stablecoins</h3>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Recommended
                    </Badge>
                  </div>
                  
                  <Alert className="border-blue-200 bg-blue-50">
                    <Star className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      <strong>Most Popular Cryptocurrencies:</strong> Add wallet addresses for the most 
                      commonly used cryptocurrencies to maximize payment options for your customers.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {TOP_10_CURRENCIES.map((currency) => (
                      <div key={currency.code} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{currency.symbol} {currency.code}</span>
                              <Badge variant="outline" className={`text-xs ${getNetworkBadgeColor(currency.network)}`}>
                                {currency.network}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-500">{currency.display_name}</div>
                          </div>
                          {settings.wallets[currency.code] && (
                            <Button
                              type="button"
                              onClick={() => handleRemoveWallet(currency.code)}
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>

                        <div className="space-y-2">
                          {settings.wallets[currency.code] !== undefined ? (
                            <div className="flex items-center space-x-2">
                              <Input
                                type="text"
                                placeholder={`Enter your ${currency.code} wallet address`}
                                value={settings.wallets[currency.code] || ''}
                                onChange={(e) => handleWalletChange(currency.code, e.target.value)}
                                className="font-mono text-sm"
                              />
                              {getValidationIcon(currency.code)}
                            </div>
                          ) : (
                            <Button
                              type="button"
                              onClick={() => handleAddWallet(currency.code)}
                              variant="outline"
                              size="sm"
                              className="w-full"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add {currency.code} Address
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional Cryptocurrencies */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold text-gray-900">Additional Cryptocurrencies</h3>
                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                      Optional
                    </Badge>
                  </div>

                  {loadingCurrencies ? (
                    <div className="text-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      <p className="text-gray-600">Loading additional currencies...</p>
                    </div>
                  ) : (
                    <>
                      {/* Search */}
                      <div className="max-w-md">
                        <Input
                          type="text"
                          placeholder="Search cryptocurrencies..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full"
                        />
                      </div>

                      {/* Additional currencies grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                        {filteredAdditionalCurrencies.map((currency) => (
                          <div key={currency.code} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">{currency.symbol} {currency.code}</span>
                                  {currency.network && (
                                    <Badge variant="outline" className={`text-xs ${getNetworkBadgeColor(currency.network)}`}>
                                      {currency.network}
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-gray-500">{currency.display_name || currency.name}</div>
                              </div>
                              {settings.wallets[currency.code] && (
                                <Button
                                  type="button"
                                  onClick={() => handleRemoveWallet(currency.code)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>

                            <div className="space-y-2">
                              {settings.wallets[currency.code] !== undefined ? (
                                <div className="flex items-center space-x-2">
                                  <Input
                                    type="text"
                                    placeholder={`Enter your ${currency.code} wallet address`}
                                    value={settings.wallets[currency.code] || ''}
                                    onChange={(e) => handleWalletChange(currency.code, e.target.value)}
                                    className="font-mono text-sm"
                                  />
                                  {getValidationIcon(currency.code)}
                                </div>
                              ) : (
                                <Button
                                  type="button"
                                  onClick={() => handleAddWallet(currency.code)}
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  Add {currency.code} Address
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {filteredAdditionalCurrencies.length === 0 && searchTerm && (
                        <div className="text-center py-8 text-gray-500">
                          <p>No cryptocurrencies found matching "{searchTerm}"</p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Wallet Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Wallet Summary</h4>
                  <p className="text-sm text-gray-600">
                    You have configured {Object.keys(settings.wallets).filter(k => settings.wallets[k].trim()).length} wallet addresses.
                    Only cryptocurrencies with wallet addresses can be used for payment links.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fee Settings Tab */}
          <TabsContent value="fees" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5" />
                  <span>Fee Settings</span>
                </CardTitle>
                <CardDescription>
                  Configure who pays the gateway fees for your payments.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Gateway Fee Responsibility</h3>
                  
                  <Alert className="border-blue-200 bg-blue-50">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      <strong>Global Setting:</strong> This setting applies to all new payment links by default. 
                      You can override this setting for individual payment links when creating them.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        checked={!settings.charge_customer_fee}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ 
                            ...prev, 
                            charge_customer_fee: !checked 
                          }))
                        }
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">Merchant pays gateway fee</div>
                        <div className="text-sm text-gray-600">
                          You absorb the gateway fee. Customers pay the exact amount shown.
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                          ✓ Better customer experience - no surprise fees
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        checked={settings.charge_customer_fee}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ 
                            ...prev, 
                            charge_customer_fee: !!checked 
                          }))
                        }
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">Customer pays gateway fee</div>
                        <div className="text-sm text-gray-600">
                          Gateway fee is added to the payment amount. You receive the full amount.
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          ✓ You receive the full payment amount
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <HelpCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-900">How it works</h4>
                        <ul className="text-sm text-yellow-800 mt-1 space-y-1">
                          <li>• <strong>Merchant pays:</strong> $100 payment = customer pays $100, you receive ~$98.50</li>
                          <li>• <strong>Customer pays:</strong> $100 payment = customer pays ~$101.50, you receive $100</li>
                          <li>• You can override this setting for individual payment links</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Auto-Conversion Tab */}
          <TabsContent value="conversion" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Auto-Conversion Settings</CardTitle>
                <CardDescription>
                  Automatically convert received payments to your preferred cryptocurrency.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <strong>Coming Soon:</strong> Auto-conversion features are currently in development. 
                    This will allow you to automatically convert received payments to your preferred cryptocurrency.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4 opacity-50">
                  <div className="flex items-center space-x-3">
                    <Checkbox disabled />
                    <div>
                      <div className="font-medium">Enable Auto-Conversion</div>
                      <div className="text-sm text-gray-600">
                        Automatically convert all received payments to your preferred currency
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Preferred Payout Currency
                    </label>
                    <Select disabled>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select preferred currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                        <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                        <SelectItem value="USDT">Tether (USDT)</SelectItem>
                        <SelectItem value="USDC">USD Coin (USDC)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSaveSettings}
            disabled={saving}
            className="bg-[#7f5efd] hover:bg-[#7f5efd]/90"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

