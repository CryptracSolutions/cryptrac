'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Settings, 
  Wallet, 
  ToggleLeft, 
  ToggleRight, 
  Save, 
  AlertCircle,
  CheckCircle,
  Loader2,
  Info
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { DashboardLayout } from '@/app/components/layout/dashboard-layout';
import { Input } from '@/app/components/ui/input';
import { Alert } from '@/app/components/ui/alert';
import { CryptoIcon } from '@/app/components/ui/crypto-icon';
import { supabase } from '@/lib/supabase-browser';

interface PayoutCurrency {
  code: string;
  name: string;
  symbol: string;
  min_amount: number;
  max_amount: number | null;
  logo_url: string | null;
}

interface MerchantSettings {
  auto_convert_enabled: boolean;
  preferred_payout_currency: string | null;
  wallets: Record<string, string>;
  payment_config: {
    auto_forward: boolean;
    fee_percentage: number;
    auto_convert_fee: number;
  };
}

export default function MerchantSettingsPage() {
  const [user, setUser] = useState<{ email?: string; user_metadata?: { business_name?: string } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<MerchantSettings>({
    auto_convert_enabled: false,
    preferred_payout_currency: null,
    wallets: {},
    payment_config: {
      auto_forward: true,
      fee_percentage: 0.5,
      auto_convert_fee: 1.0
    }
  });
  const [payoutCurrencies, setPayoutCurrencies] = useState<PayoutCurrency[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [walletErrors, setWalletErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  useEffect(() => {
    const initializeData = async () => {
      try {
        // Get current user
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          console.error('Authentication error:', error);
          router.push('/login');
          return;
        }

        setUser(user);

        // Fetch merchant settings and payout currencies in parallel
        const [settingsResponse, currenciesResponse] = await Promise.all([
          fetch('/api/merchants/settings', {
            headers: {
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
            }
          }),
          fetch('/api/nowpayments/payout-currencies')
        ]);

        // Handle settings response
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();
          if (settingsData.success) {
            setSettings(settingsData.settings);
          }
        }

        // Handle currencies response
        if (currenciesResponse.ok) {
          const currenciesData = await currenciesResponse.json();
          if (currenciesData.success) {
            setPayoutCurrencies(currenciesData.currencies);
          }
        }

      } catch (error) {
        console.error('Failed to initialize settings:', error);
        setMessage({ type: 'error', text: 'Failed to load settings. Please refresh the page.' });
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [router]);

  const validateWalletAddress = (currency: string, address: string): string | null => {
    if (!address.trim()) {
      return 'Wallet address is required';
    }

    // Basic validation patterns for common cryptocurrencies
    const validationPatterns: Record<string, RegExp> = {
      btc: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/,
      eth: /^0x[a-fA-F0-9]{40}$/,
      ltc: /^[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}$/,
      usdt: /^0x[a-fA-F0-9]{40}$|^T[A-Za-z1-9]{33}$/,
      usdc: /^0x[a-fA-F0-9]{40}$/,
      usdttrc20: /^T[A-Za-z1-9]{33}$/,
      usdcerc20: /^0x[a-fA-F0-9]{40}$/
    };

    const pattern = validationPatterns[currency.toLowerCase()];
    if (pattern && !pattern.test(address.trim())) {
      return `Invalid ${currency.toUpperCase()} wallet address format`;
    }

    return null;
  };

  const handleWalletChange = (currency: string, address: string) => {
    setSettings(prev => ({
      ...prev,
      wallets: {
        ...prev.wallets,
        [currency]: address
      }
    }));

    // Clear previous error for this currency
    if (walletErrors[currency]) {
      setWalletErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[currency];
        return newErrors;
      });
    }
  };

  const handleAutoConvertToggle = () => {
    setSettings(prev => ({
      ...prev,
      auto_convert_enabled: !prev.auto_convert_enabled
    }));
  };

  const handlePayoutCurrencyChange = (currency: string) => {
    setSettings(prev => ({
      ...prev,
      preferred_payout_currency: currency
    }));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      // Validate required fields
      const errors: Record<string, string> = {};

      if (settings.auto_convert_enabled) {
        if (!settings.preferred_payout_currency) {
          setMessage({ type: 'error', text: 'Please select a preferred payout currency when auto-conversion is enabled.' });
          setSaving(false);
          return;
        }

        // Validate that the payout wallet address exists and is valid
        const payoutAddress = settings.wallets[settings.preferred_payout_currency];
        const validationError = validateWalletAddress(settings.preferred_payout_currency, payoutAddress || '');
        
        if (validationError) {
          errors[settings.preferred_payout_currency] = validationError;
          setWalletErrors(errors);
          setMessage({ type: 'error', text: `Please provide a valid wallet address for ${settings.preferred_payout_currency.toUpperCase()}.` });
          setSaving(false);
          return;
        }
      }

      // Validate all provided wallet addresses
      for (const [currency, address] of Object.entries(settings.wallets)) {
        if (address.trim()) {
          const validationError = validateWalletAddress(currency, address);
          if (validationError) {
            errors[currency] = validationError;
          }
        }
      }

      if (Object.keys(errors).length > 0) {
        setWalletErrors(errors);
        setMessage({ type: 'error', text: 'Please fix the wallet address errors before saving.' });
        setSaving(false);
        return;
      }

      // Save settings
      const response = await fetch('/api/merchants/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          auto_convert_enabled: settings.auto_convert_enabled,
          preferred_payout_currency: settings.preferred_payout_currency,
          wallets: settings.wallets
        })
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
        setSettings(result.settings);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save settings.' });
      }

    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout user={user}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return null;
  }

  const businessName = user.user_metadata?.business_name || user.email?.split('@')[0] || 'Your Business';
  const currentFeePercentage = settings.auto_convert_enabled ? '1%' : '0.5%';

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Settings className="h-8 w-8 text-blue-600" />
              Payment Settings
            </h1>
            <p className="text-gray-600">
              Configure your cryptocurrency payment preferences for {businessName}
            </p>
          </div>
          <Button 
            onClick={handleSaveSettings}
            disabled={saving}
            className="flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>

        {/* Status Message */}
        {message && (
          <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <span className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                {message.text}
              </span>
            </div>
          </Alert>
        )}

        {/* Auto-Conversion Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ToggleLeft className="h-5 w-5 text-blue-600" />
              Auto-Conversion Settings
            </CardTitle>
            <CardDescription>
              Configure automatic conversion of incoming payments to your preferred currency
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Auto-Convert Toggle */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Enable Auto-Conversion</h3>
                <p className="text-sm text-gray-600">
                  Automatically convert incoming payments to your preferred payout currency
                </p>
                <div className="mt-2 flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Info className="h-3 w-3 text-blue-500" />
                    Gateway Fee: <strong>{currentFeePercentage}</strong>
                  </span>
                </div>
              </div>
              <button
                onClick={handleAutoConvertToggle}
                className="flex-shrink-0"
              >
                {settings.auto_convert_enabled ? (
                  <ToggleRight className="h-8 w-8 text-blue-600" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-gray-400" />
                )}
              </button>
            </div>

            {/* Preferred Payout Currency */}
            {settings.auto_convert_enabled && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Preferred Payout Currency *
                </label>
                <select
                  value={settings.preferred_payout_currency || ''}
                  onChange={(e) => handlePayoutCurrencyChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select your preferred payout currency</option>
                  {payoutCurrencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.symbol} - {currency.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500">
                  All incoming payments will be automatically converted to this currency before being sent to your wallet.
                </p>
              </div>
            )}

            {/* Fee Information */}
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <div className="text-blue-800">
                <p className="font-medium">Gateway Fee Structure:</p>
                <ul className="mt-1 text-sm space-y-1">
                  <li>• <strong>0.5%</strong> - Direct crypto payments (no conversion)</li>
                  <li>• <strong>1.0%</strong> - Auto-converted payments</li>
                  <li>• Fees are deducted from the payout amount, not charged to customers</li>
                </ul>
              </div>
            </Alert>
          </CardContent>
        </Card>

        {/* Wallet Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-blue-600" />
              Payout Wallet Addresses
            </CardTitle>
            <CardDescription>
              Configure your wallet addresses for receiving cryptocurrency payments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {payoutCurrencies.slice(0, 8).map((currency) => (
              <div key={currency.code} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                  <CryptoIcon currency={currency.symbol} className="h-4 w-4" />
                  {currency.symbol} - {currency.name}
                  {settings.auto_convert_enabled && settings.preferred_payout_currency === currency.code && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Required</span>
                  )}
                </label>
                <Input
                  type="text"
                  placeholder={`Enter your ${currency.symbol} wallet address`}
                  value={settings.wallets[currency.code] || ''}
                  onChange={(e) => handleWalletChange(currency.code, e.target.value)}
                  className={walletErrors[currency.code] ? 'border-red-300' : ''}
                />
                {walletErrors[currency.code] && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {walletErrors[currency.code]}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Payments will be sent directly to this address. Ensure it&apos;s correct and you control this wallet.
                </p>
              </div>
            ))}

            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <div className="text-yellow-800">
                <p className="font-medium">Important Security Notice:</p>
                <ul className="mt-1 text-sm space-y-1">
                  <li>• Double-check all wallet addresses before saving</li>
                  <li>• Cryptrac never stores your private keys</li>
                  <li>• Payments are sent directly to your wallets</li>
                  <li>• Lost or incorrect addresses cannot be recovered</li>
                </ul>
              </div>
            </Alert>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSaveSettings}
            disabled={saving}
            size="lg"
            className="flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? 'Saving Settings...' : 'Save All Settings'}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

