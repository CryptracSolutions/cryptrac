'use client'

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
  AlertTriangle,
  Shield
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
    // auto_forward removed - always enabled for non-custodial compliance
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
    display_name: 'Tether (ERC-20)',
    enabled: true,
    is_required: true
  },
  {
    code: 'USDC_ERC20',
    name: 'USD Coin (Ethereum)',
    symbol: '$',
    network: 'Ethereum',
    trust_wallet_compatible: true,
    decimals: 6,
    min_amount: 0.000001,
    display_name: 'USD Coin (ERC-20)',
    enabled: true,
    is_required: true
  },
  {
    code: 'USDT_BEP20',
    name: 'Tether (BSC)',
    symbol: '₮',
    network: 'BSC',
    trust_wallet_compatible: true,
    decimals: 18,
    min_amount: 0.000000001,
    display_name: 'Tether (BEP-20)',
    enabled: true,
    is_required: true
  },
  {
    code: 'USDC_BEP20',
    name: 'USD Coin (BSC)',
    symbol: '$',
    network: 'BSC',
    trust_wallet_compatible: true,
    decimals: 18,
    min_amount: 0.000000001,
    display_name: 'USD Coin (BEP-20)',
    enabled: true,
    is_required: true
  },
  {
    code: 'USDT_SOL',
    name: 'Tether (Solana)',
    symbol: '₮',
    network: 'Solana',
    trust_wallet_compatible: true,
    decimals: 6,
    min_amount: 0.000001,
    display_name: 'Tether (Solana)',
    enabled: true,
    is_required: true
  },
  {
    code: 'USDC_SOL',
    name: 'USD Coin (Solana)',
    symbol: '$',
    network: 'Solana',
    trust_wallet_compatible: true,
    decimals: 6,
    min_amount: 0.000001,
    display_name: 'USD Coin (Solana)',
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
    display_name: 'Tether (TRC-20)',
    enabled: true,
    is_required: true
  },
  {
    code: 'USDC_TRC20',
    name: 'USD Coin (TRON)',
    symbol: '$',
    network: 'Tron',
    trust_wallet_compatible: true,
    decimals: 6,
    min_amount: 0.000001,
    display_name: 'USD Coin (TRC-20)',
    enabled: true,
    is_required: true
  },
  {
    code: 'USDT_TON',
    name: 'Tether (TON)',
    symbol: '₮',
    network: 'TON',
    trust_wallet_compatible: true,
    decimals: 6,
    min_amount: 0.000001,
    display_name: 'Tether (TON)',
    enabled: true,
    is_required: true
  },
  {
    code: 'USDT_AVAX',
    name: 'Tether (Avalanche)',
    symbol: '₮',
    network: 'Avalanche',
    trust_wallet_compatible: true,
    decimals: 6,
    min_amount: 0.000001,
    display_name: 'Tether (Avalanche)',
    enabled: true,
    is_required: true
  },
  {
    code: 'USDC_AVAX',
    name: 'USD Coin (Avalanche)',
    symbol: '$',
    network: 'Avalanche',
    trust_wallet_compatible: true,
    decimals: 6,
    min_amount: 0.000001,
    display_name: 'USD Coin (Avalanche)',
    enabled: true,
    is_required: true
  }
];

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showTrustWalletGuide, setShowTrustWalletGuide] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [additionalCurrencies, setAdditionalCurrencies] = useState<CurrencyInfo[]>([]);
  const [validationStatus, setValidationStatus] = useState<Record<string, 'valid' | 'invalid' | 'validating'>>({});
  
  const [settings, setSettings] = useState<MerchantSettings>({
    charge_customer_fee: false,
    auto_convert_enabled: false,
    preferred_payout_currency: null,
    wallets: {},
    payment_config: {
      // auto_forward removed - always enabled for non-custodial compliance
      fee_percentage: 0.5,
      auto_convert_fee: 1.0
    }
  });

  // Load user and settings on component mount
  useEffect(() => {
    loadUserAndSettings();
    loadAdditionalCurrencies();
  }, []);

  const loadUserAndSettings = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        router.push('/auth/login');
        return;
      }

      setUser(user);

      // Get merchant settings
      const response = await fetch('/api/merchants/settings');
      const data = await response.json();

      if (data.success) {
        setSettings({
          charge_customer_fee: data.settings.charge_customer_fee || false,
          auto_convert_enabled: data.settings.auto_convert_enabled || false,
          preferred_payout_currency: data.settings.preferred_payout_currency || null,
          wallets: data.settings.wallets || {},
          payment_config: {
            // auto_forward always enabled for non-custodial compliance
            fee_percentage: data.settings.payment_config?.fee_percentage || 0.5,
            auto_convert_fee: data.settings.payment_config?.auto_convert_fee || 1.0
          }
        });

        // Initialize validation status for existing wallets
        const initialValidation: Record<string, 'valid' | 'invalid' | 'validating'> = {};
        Object.keys(data.settings.wallets || {}).forEach(currency => {
          if (data.settings.wallets[currency]) {
            initialValidation[currency] = 'valid';
          }
        });
        setValidationStatus(initialValidation);
      }

    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const loadAdditionalCurrencies = async () => {
    try {
      const response = await fetch('/api/currencies');
      const data = await response.json();

      if (data.success) {
        // Filter out currencies that are already in TOP_10_CURRENCIES
        const topCurrencyCodes = TOP_10_CURRENCIES.map(c => c.code);
        const additional = data.currencies.filter((currency: CurrencyInfo) => 
          !topCurrencyCodes.includes(currency.code)
        );
        setAdditionalCurrencies(additional);
      }
    } catch (error) {
      console.error('Error loading additional currencies:', error);
    }
  };

  const validateAddress = async (currency: string, address: string) => {
    if (!address.trim()) {
      setValidationStatus(prev => ({ ...prev, [currency]: 'invalid' }));
      return false;
    }

    try {
      setValidationStatus(prev => ({ ...prev, [currency]: 'validating' }));

      const response = await fetch('/api/wallets/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currency: currency.toUpperCase(),
          address: address.trim()
        })
      });

      const result = await response.json();
      const isValid = result.success && (result.validation?.valid || result.valid) || false;
      
      setValidationStatus(prev => ({ ...prev, [currency]: isValid ? 'valid' : 'invalid' }));
      return isValid;

    } catch (error) {
      console.error('Validation error:', error);
      setValidationStatus(prev => ({ ...prev, [currency]: 'invalid' }));
      return false;
    }
  };

  const handleWalletChange = (currency: string, address: string) => {
    setSettings(prev => ({
      ...prev,
      wallets: {
        ...prev.wallets,
        [currency]: address
      }
    }));

    // Debounce validation
    const timeoutId = setTimeout(() => {
      validateAddress(currency, address);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);

      const response = await fetch('/api/merchants/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          charge_customer_fee: settings.charge_customer_fee,
          auto_convert_enabled: settings.auto_convert_enabled,
          preferred_payout_currency: settings.preferred_payout_currency,
          wallets: settings.wallets
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Settings saved successfully!');
      } else {
        throw new Error(data.error || 'Failed to save settings');
      }

    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const getValidationIcon = (currency: string) => {
    const status = validationStatus[currency];
    const hasAddress = settings.wallets[currency]?.trim();

    if (!hasAddress) return null;

    switch (status) {
      case 'valid':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'invalid':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'validating':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return null;
    }
  };

  const filteredAdditionalCurrencies = additionalCurrencies.filter(currency =>
    currency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    currency.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const configuredWalletCount = Object.values(settings.wallets).filter(address => address?.trim()).length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-[#7f5efd]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1">
              Manage your wallet addresses, payment preferences, and fee settings
            </p>
          </div>
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

        {/* Non-Custodial Security Notice */}
        <Alert className="border-green-200 bg-green-50">
          <Shield className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Non-Custodial Security:</strong> Cryptrac automatically forwards all payments directly to your wallet addresses 
            immediately upon confirmation. We never hold your funds, ensuring maximum security and regulatory compliance.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="wallets" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="wallets" className="flex items-center space-x-2">
              <Wallet className="w-4 h-4" />
              <span>Wallet Addresses</span>
            </TabsTrigger>
            <TabsTrigger value="fees" className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4" />
              <span>Fee Settings</span>
            </TabsTrigger>
            <TabsTrigger value="conversion" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Auto-Conversion</span>
            </TabsTrigger>
          </TabsList>

          {/* Wallet Addresses Tab */}
          <TabsContent value="wallets" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Wallet className="w-5 h-5 text-[#7f5efd]" />
                      <span>Wallet Addresses</span>
                      <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                        {configuredWalletCount} Configured
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Configure your wallet addresses for receiving cryptocurrency payments. 
                      All payments are automatically forwarded to these addresses.
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowTrustWalletGuide(true)}
                    className="flex items-center space-x-2"
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>Setup Guide</span>
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Top 10 + Major Stablecoins */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <span>Top Cryptocurrencies + Major Stablecoins</span>
                  </h3>
                  
                  <div className="grid gap-4">
                    {TOP_10_CURRENCIES.map((currency) => (
                      <div key={currency.code} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-[#7f5efd] to-[#9f7aea] rounded-full flex items-center justify-center text-white text-sm font-bold">
                              {currency.symbol}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {currency.code}
                              </div>
                              <div className="text-sm text-gray-600">
                                {currency.display_name}
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {currency.network}
                          </Badge>
                        </div>
                        
                        <div className="relative">
                          <Input
                            placeholder={`Enter your ${currency.code} wallet address`}
                            value={settings.wallets[currency.code] || ''}
                            onChange={(e) => handleWalletChange(currency.code, e.target.value)}
                            className="pr-10"
                          />
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            {getValidationIcon(currency.code)}
                          </div>
                        </div>
                        
                        {validationStatus[currency.code] === 'invalid' && settings.wallets[currency.code]?.trim() && (
                          <p className="text-sm text-red-600 mt-1">
                            Please enter a valid {currency.code} address
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional Cryptocurrencies */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Additional Cryptocurrencies</h3>
                  
                  <div className="relative">
                    <Input
                      placeholder="Search for additional cryptocurrencies..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <Settings className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  {searchTerm && (
                    <div className="grid gap-3 max-h-96 overflow-y-auto">
                      {filteredAdditionalCurrencies.map((currency) => (
                        <div key={currency.code} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 text-xs font-bold">
                                {currency.symbol || currency.code.charAt(0)}
                              </div>
                              <div>
                                <div className="font-medium text-sm text-gray-900">
                                  {currency.code}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {currency.name}
                                </div>
                              </div>
                            </div>
                            {currency.network && (
                              <Badge variant="outline" className="text-xs">
                                {currency.network}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="relative">
                            <Input
                              placeholder={`Enter your ${currency.code} wallet address`}
                              value={settings.wallets[currency.code] || ''}
                              onChange={(e) => handleWalletChange(currency.code, e.target.value)}
                              className="pr-10 text-sm"
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              {getValidationIcon(currency.code)}
                            </div>
                          </div>
                          
                          {validationStatus[currency.code] === 'invalid' && settings.wallets[currency.code]?.trim() && (
                            <p className="text-xs text-red-600 mt-1">
                              Please enter a valid {currency.code} address
                            </p>
                          )}
                        </div>
                      ))}
                      
                      {filteredAdditionalCurrencies.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Settings className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          <p>No cryptocurrencies found matching "{searchTerm}"</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fee Settings Tab */}
          <TabsContent value="fees" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-[#7f5efd]" />
                  <span>Gateway Fee Settings</span>
                </CardTitle>
                <CardDescription>
                  Configure who pays the gateway processing fees. This setting applies to all payment links by default, 
                  but can be overridden for individual payment links.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-4">
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
                      <h4 className="font-medium text-yellow-900">How Gateway Fees Work</h4>
                      <ul className="text-sm text-yellow-800 mt-1 space-y-1">
                        <li>• <strong>Merchant pays (Auto-convert OFF):</strong> $100 payment = customer pays $100, you receive $99.50 (0.5% fee)</li>
                        <li>• <strong>Customer pays (Auto-convert OFF):</strong> $100 payment = customer pays $100.50, you receive $100</li>
                        <li>• <strong>Merchant pays (Auto-convert ON):</strong> $100 payment = customer pays $100, you receive $99.00 (1% fee)</li>
                        <li>• <strong>Customer pays (Auto-convert ON):</strong> $100 payment = customer pays $101.00, you receive $100</li>
                      </ul>
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
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-[#7f5efd]" />
                  <span>Auto-Conversion Settings</span>
                </CardTitle>
                <CardDescription>
                  Automatically convert all received payments to your preferred cryptocurrency. 
                  Higher gateway fee (1%) applies when enabled.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={settings.auto_convert_enabled}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ 
                          ...prev, 
                          auto_convert_enabled: !!checked,
                          // Clear preferred currency if auto-convert is disabled
                          preferred_payout_currency: checked ? prev.preferred_payout_currency : null
                        }))
                      }
                    />
                    <div>
                      <div className="font-medium text-gray-900">Enable Auto-Conversion</div>
                      <div className="text-sm text-gray-600">
                        Automatically convert all received payments to your preferred currency
                      </div>
                      <div className="text-xs text-orange-600 mt-1">
                        ⚠️ Higher gateway fee (1% instead of 0.5%) applies when enabled
                      </div>
                    </div>
                  </div>

                  {settings.auto_convert_enabled && (
                    <div className="space-y-3 ml-6">
                      <label className="text-sm font-medium text-gray-700">
                        Preferred Payout Currency
                      </label>
                      <Select
                        value={settings.preferred_payout_currency || ''}
                        onValueChange={(value) => 
                          setSettings(prev => ({ 
                            ...prev, 
                            preferred_payout_currency: value 
                          }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select preferred payout currency" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(settings.wallets)
                            .filter(currency => settings.wallets[currency]?.trim())
                            .map((currency) => {
                              const currencyInfo = TOP_10_CURRENCIES.find(c => c.code === currency);
                              return (
                                <SelectItem key={currency} value={currency}>
                                  {currency} - {currencyInfo?.display_name || currency}
                                </SelectItem>
                              );
                            })}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">
                        All payments will be automatically converted to this currency before payout
                      </p>
                      
                      {settings.preferred_payout_currency && !settings.wallets[settings.preferred_payout_currency]?.trim() && (
                        <Alert className="border-red-200 bg-red-50">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-800">
                            Please configure a wallet address for {settings.preferred_payout_currency} in the Wallet Addresses tab.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </div>

                <Alert className="border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Auto-Conversion:</strong> When enabled, all payments are automatically converted to your preferred 
                    currency before being forwarded to your wallet. This feature uses NOWPayments' conversion service and 
                    incurs a higher gateway fee of 1% instead of the standard 0.5%.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Trust Wallet Guide Modal */}
        {showTrustWalletGuide && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <TrustWalletGuide
                onComplete={() => {
                  setShowTrustWalletGuide(false);
                  toast.success('Great! Now you can enter your wallet addresses above.');
                }}
                onSkip={() => {
                  setShowTrustWalletGuide(false);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

