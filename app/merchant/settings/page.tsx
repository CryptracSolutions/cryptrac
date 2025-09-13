"use client"

import React, { useState, useEffect } from 'react';

export const dynamic = 'force-dynamic';
import { useRouter } from 'next/navigation';
import {
  Save,
  AlertCircle,
  CheckCircle,
  Loader2,
  Info,
  DollarSign,
  Calculator,
  Bell,
  CreditCard,
  Zap,
  Plus
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';

import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Checkbox } from '@/app/components/ui/checkbox';
import { supabase } from '@/lib/supabase-browser';
import toast from 'react-hot-toast';
import { Breadcrumbs } from '@/app/components/ui/breadcrumbs';

interface TaxRate {
  id: string;
  label: string;
  percentage: string;
}

interface MerchantSettings {
  // Payment settings
  charge_customer_fee: boolean;
  auto_convert_enabled: boolean;
  preferred_payout_currency: string | null;
  wallets: Record<string, string>;
  payment_config: {
    auto_forward?: boolean;
    fee_percentage: number;
    auto_convert_fee?: number;
    no_convert_fee?: number;
  };
  // Tax configuration
  tax_enabled: boolean;
  tax_rates: TaxRate[];
  business_address: {
    street?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
  };
  tax_strategy: 'origin' | 'destination' | 'custom';
  sales_type: 'local' | 'online' | 'both';
}

interface UserType {
  id: string;
  email?: string;
  user_metadata?: {
    business_name?: string;
  };
}



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

const getCurrencyDisplayName = (code: string) => {
  return CURRENCY_NAMES[code] || code;
};

export default function MerchantSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [settings, setSettings] = useState<MerchantSettings>({
    // Payment settings defaults
    charge_customer_fee: false,
    auto_convert_enabled: false,
    preferred_payout_currency: null,
    wallets: {},
    payment_config: {
      auto_forward: true,
      fee_percentage: 0.5,
      no_convert_fee: 0.5
    },
    // Tax configuration defaults
    tax_enabled: false,
    tax_rates: [
      { id: '1', label: 'Sales Tax', percentage: '8.5' }
    ],
    business_address: {
      street: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'US'
    },
    tax_strategy: 'origin',
    sales_type: 'local'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSavedSettings, setLastSavedSettings] = useState<MerchantSettings | null>(null);
  const [notificationSettings, setNotificationSettings] = useState({
    email_payment_notifications_enabled: true,
    public_receipts_enabled: true,
  });

  useEffect(() => {
    const fetchNotificationSettings = async () => {
      try {
        const res = await fetch('/api/merchant/settings');
        if (res.ok) {
          const data = await res.json();
          setNotificationSettings({
            email_payment_notifications_enabled: data.email_payment_notifications_enabled !== false,
            public_receipts_enabled: data.public_receipts_enabled !== false,
          });
        }
      } catch (err) {
        console.error('Failed to load notification settings:', err);
      }
    };
    fetchNotificationSettings();
  }, []);

  const updateNotificationSetting = async (
    field: 'email_payment_notifications_enabled' | 'public_receipts_enabled',
    value: boolean
  ) => {
    setNotificationSettings(prev => ({ ...prev, [field]: value }));
    try {
      await fetch('/api/merchant/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      });
    } catch (err) {
      console.error('Failed to update notification setting:', err);
      toast.error('Failed to update settings');
    }
  };

  useEffect(() => {
    loadMerchantData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMerchantData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading merchant data...');

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('Auth error:', authError);
        router.push('/auth/login');
        return;
      }

      setUser(user);
      console.log('✅ User loaded:', user.email);

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

      console.log('✅ Merchant loaded:', merchant);

      const wallets = { ...(merchant.wallets || {}) };

      // Check if tax data exists in onboarding_data and hasn't been moved to main fields yet
      const hasOnboardingTaxData = merchant.onboarding_data?.tax_enabled !== undefined;
      const taxEnabled = merchant.tax_enabled ?? merchant.onboarding_data?.tax_enabled ?? false;
      const taxStrategy = merchant.tax_strategy || merchant.onboarding_data?.tax_strategy || 'origin';
      const salesType = merchant.sales_type || merchant.onboarding_data?.sales_type || 'local';
      
      // Use tax rates from database, or from onboarding_data, or default
      let taxRates = merchant.tax_rates;
      if (!taxRates || taxRates.length === 0) {
        if (merchant.onboarding_data?.tax_rates && merchant.onboarding_data.tax_rates.length > 0) {
          taxRates = merchant.onboarding_data.tax_rates;
        } else {
          taxRates = [{ id: '1', label: 'Sales Tax', percentage: 8.5 }];
        }
      }

      setSettings({
        // Payment settings from database
        charge_customer_fee: merchant.charge_customer_fee || false,
        auto_convert_enabled: merchant.auto_convert_enabled || false,
        preferred_payout_currency: merchant.preferred_payout_currency,
        wallets,
        payment_config: {
          auto_forward: merchant.payment_config?.auto_forward ?? true,
          fee_percentage: merchant.auto_convert_enabled ? 1.0 : 0.5,
          ...(merchant.auto_convert_enabled ? { auto_convert_fee: 1.0 } : { no_convert_fee: 0.5 })
        },
        // Tax configuration from database, onboarding_data, or defaults
        tax_enabled: taxEnabled,
        tax_rates: taxRates.map(
          (rate: { id: string; label: string; percentage: number | string | null | undefined }) => ({
            ...rate,
            percentage:
              rate.percentage === null ||
              rate.percentage === undefined ||
              String(rate.percentage).toLowerCase() === 'null'
                ? '0.0'
                : String(rate.percentage)
          })
        ),
        business_address: merchant.business_address || {
          street: '',
          city: '',
          state: '',
          zip_code: '',
          country: 'US'
        },
        tax_strategy: taxStrategy,
        sales_type: salesType
      });

      // Set the last saved settings for auto-save comparison
      setLastSavedSettings({
        charge_customer_fee: merchant.charge_customer_fee || false,
        auto_convert_enabled: merchant.auto_convert_enabled || false,
        preferred_payout_currency: merchant.preferred_payout_currency,
        wallets,
        payment_config: {
          auto_forward: merchant.payment_config?.auto_forward ?? true,
          fee_percentage: merchant.auto_convert_enabled ? 1.0 : 0.5,
          ...(merchant.auto_convert_enabled ? { auto_convert_fee: 1.0 } : { no_convert_fee: 0.5 })
        },
        tax_enabled: taxEnabled,
        tax_rates: taxRates.map(
          (rate: { id: string; label: string; percentage: number | string | null | undefined }) => ({
            ...rate,
            percentage:
              rate.percentage === null ||
              rate.percentage === undefined ||
              String(rate.percentage).toLowerCase() === 'null'
                ? '0.0'
                : String(rate.percentage)
          })
        ),
        business_address: merchant.business_address || {
          street: '',
          city: '',
          state: '',
          zip_code: '',
          country: 'US'
        },
        tax_strategy: taxStrategy,
        sales_type: salesType
      });

    } catch (error) {
      console.error('Error loading merchant data:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      console.log('💾 Saving settings...');

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('Auth error:', authError);
        toast.error('Authentication error');
        return;
      }

      // Update payment config based on auto_convert_enabled
      const updatedPaymentConfig = {
        auto_forward: settings.payment_config.auto_forward,
        fee_percentage: settings.auto_convert_enabled ? 1.0 : 0.5,
        ...(settings.auto_convert_enabled ? { auto_convert_fee: 1.0 } : { no_convert_fee: 0.5 })
      };

      const { error: updateError } = await supabase
        .from('merchants')
        .update({
          charge_customer_fee: settings.charge_customer_fee,
          auto_convert_enabled: settings.auto_convert_enabled,
          preferred_payout_currency: settings.preferred_payout_currency,
          payment_config: updatedPaymentConfig,
          tax_enabled: settings.tax_enabled,
          tax_rates: settings.tax_rates.map(rate => ({
            ...rate,
            percentage: parseFloat(rate.percentage)
          })),
          business_address: settings.business_address,
          tax_strategy: settings.tax_strategy,
          sales_type: settings.sales_type
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating merchant:', updateError);
        toast.error('Failed to save settings');
        return;
      }

      console.log('✅ Settings saved successfully');
      setLastSavedSettings(settings);

    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Auto-save functionality
  const autoSave = async (newSettings: MerchantSettings) => {
    if (JSON.stringify(newSettings) === JSON.stringify(lastSavedSettings)) {
      return; // No changes to save
    }
    
    try {
      setSaving(true);
      console.log('💾 Auto-saving settings...');

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('Auth error:', authError);
        return;
      }

      // Update payment config based on auto_convert_enabled
      const updatedPaymentConfig = {
        auto_forward: newSettings.payment_config.auto_forward,
        fee_percentage: newSettings.auto_convert_enabled ? 1.0 : 0.5,
        ...(newSettings.auto_convert_enabled ? { auto_convert_fee: 1.0 } : { no_convert_fee: 0.5 })
      };

      const { error: updateError } = await supabase
        .from('merchants')
        .update({
          charge_customer_fee: newSettings.charge_customer_fee,
          auto_convert_enabled: newSettings.auto_convert_enabled,
          preferred_payout_currency: newSettings.preferred_payout_currency,
          payment_config: updatedPaymentConfig,
          tax_enabled: newSettings.tax_enabled,
          tax_rates: newSettings.tax_rates.map(rate => ({
            ...rate,
            percentage: parseFloat(rate.percentage)
          })),
          business_address: newSettings.business_address,
          tax_strategy: newSettings.tax_strategy,
          sales_type: newSettings.sales_type
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating merchant:', updateError);
        return;
      }

      console.log('✅ Settings auto-saved successfully');
      setLastSavedSettings(newSettings);

    } catch (error) {
      console.error('Error auto-saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  // Debounced auto-save effect
  useEffect(() => {
    if (!lastSavedSettings) return; // Don't auto-save on initial load
    
    const timeoutId = setTimeout(() => {
      autoSave(settings);
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [settings, lastSavedSettings]);

  const addTaxRate = () => {
    const newId = Date.now().toString();
    setSettings(prev => ({
      ...prev,
      tax_rates: [...prev.tax_rates, { id: newId, label: '', percentage: '' }]
    }));
  };

  const updateTaxRate = (id: string, field: 'label' | 'percentage', value: string) => {
    setSettings(prev => ({
      ...prev,
      tax_rates: prev.tax_rates.map(rate =>
        rate.id === id ? { ...rate, [field]: value } : rate
      )
    }));
  };

  const removeTaxRate = (id: string) => {
    setSettings(prev => ({
      ...prev,
      tax_rates: prev.tax_rates.filter(rate => rate.id !== id)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#7f5efd]"></div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 space-y-8 max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { name: 'Dashboard', href: '/merchant/dashboard' },
            { name: 'Settings', href: '/merchant/settings' }
          ]} 
        />
        
        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
          <div className="space-y-2">
            <h1 className="font-phonic text-3xl font-normal tracking-tight text-gray-900 mb-4">
              Account Settings
            </h1>
            <p className="font-phonic text-base font-normal text-gray-600">Manage your payment preferences, tax settings, and notifications</p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <Button
              onClick={saveSettings}
              disabled={saving}
              size="default"
              className="w-full bg-[#7f5efd] hover:bg-[#7c3aed] text-white flex items-center justify-center gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>



        {/* Enhanced Tabs */}
        <Tabs defaultValue="payments" className="space-y-8">
          <div className="w-full">
            <div className="border-b border-gray-200">
              <TabsList className="flex w-full space-x-8 px-4 bg-transparent h-auto p-0" aria-label="Tabs">
                <TabsTrigger 
                  value="payments" 
                  className="flex flex-1 items-center gap-2 py-4 px-1 border-b-2 border-transparent font-phonic text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 data-[state=active]:border-[#7f5efd] data-[state=active]:text-[#7f5efd] transition-all duration-200"
                >
                  <CreditCard className="h-5 w-5" />
                  Payments
                </TabsTrigger>
                <TabsTrigger 
                  value="tax" 
                  className="flex flex-1 items-center gap-2 py-4 px-1 border-b-2 border-transparent font-phonic text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 data-[state=active]:border-[#7f5efd] data-[state=active]:text-[#7f5efd] transition-all duration-200"
                >
                  <Calculator className="h-5 w-5" />
                  Tax
                </TabsTrigger>
                <TabsTrigger 
                  value="notifications" 
                  className="flex flex-1 items-center gap-2 py-4 px-1 border-b-2 border-transparent font-phonic text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 data-[state=active]:border-[#7f5efd] data-[state=active]:text-[#7f5efd] transition-all duration-200"
                >
                  <Bell className="h-5 w-5" />
                  Notifications
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-8">
            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <CardTitle className="font-phonic text-xl font-semibold text-gray-900 flex items-center gap-3">
                      Payment Configuration
                    </CardTitle>
                    <CardDescription className="font-capsule text-sm text-gray-600">
                      Configure your payment processing preferences and fees
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-8">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#7f5efd] rounded-lg">
                          <DollarSign className="h-4 w-4 text-white" />
                        </div>
                        <h3 className="font-phonic text-lg font-semibold text-gray-900">Gateway Fee Structure</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-phonic text-base font-normal text-gray-900">Gateway Fee</p>
                            <p className="font-phonic text-sm font-normal text-gray-600">
                              {settings.auto_convert_enabled ? 'With auto-convert enabled' : 'With auto-convert disabled'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-phonic text-2xl font-normal text-[#7f5efd]">
                              {settings.auto_convert_enabled ? '1.0%' : '0.5%'}
                            </p>
                            <p className="font-phonic text-xs font-normal text-gray-500">
                              {settings.auto_convert_enabled ? 'Higher rate for conversion' : 'Standard rate'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              id="merchant-pays-fee"
                              checked={!settings.charge_customer_fee}
                              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, charge_customer_fee: !(checked as boolean) }))}
                              />
                             <label htmlFor="merchant-pays-fee" className="font-phonic text-base font-normal">
                               Merchant pays gateway fee
                             </label>
                           </div>
                           
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              id="customer-pays-fee"
                              checked={settings.charge_customer_fee}
                              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, charge_customer_fee: checked as boolean }))}
                              />
                            <label htmlFor="customer-pays-fee" className="font-phonic text-base font-normal">
                              Customer pays gateway fee
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#7f5efd] rounded-lg">
                          <Zap className="h-4 w-4 text-white" />
                        </div>
                        <h3 className="font-phonic text-lg font-semibold text-gray-900">Auto-Convert Settings</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id="auto-convert"
                            checked={settings.auto_convert_enabled}
                            onCheckedChange={(checked) => setSettings(prev => ({ 
                              ...prev, 
                              auto_convert_enabled: checked as boolean,
                              payment_config: {
                                ...prev.payment_config,
                                fee_percentage: checked ? 1.0 : 0.5,
                                ...(checked ? { auto_convert_fee: 1.0 } : { no_convert_fee: 0.5 })
                              }
                            }))}
                          />
                          <label htmlFor="auto-convert" className="font-phonic text-base font-normal">
                            Enable automatic conversion to preferred payout currency
                          </label>
                        </div>
                        
                        {settings.auto_convert_enabled && (
                          <div className="space-y-2">
                            <label className="font-phonic text-sm font-normal text-gray-700">Preferred Payout Currency</label>
                            <Select
                              value={settings.preferred_payout_currency || ''}
                              onValueChange={(value) => setSettings(prev => ({ ...prev, preferred_payout_currency: value }))}
                            >
                              <SelectTrigger className="w-full h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                                <SelectValue placeholder="Select payout currency" />
                              </SelectTrigger>
                              <SelectContent>
                                {(() => {
                                  const baseCurrencies = Object.keys(settings.wallets);
                                  const stableCoinAssociations: Record<string, string[]> = {
                                    'SOL': ['USDCSOL', 'USDTSOL'],
                                    'ETH': ['USDT', 'USDC', 'DAI', 'PYUSD'],
                                    'BNB': ['USDTBSC', 'USDCBSC'],
                                    'MATIC': ['USDTMATIC', 'USDCMATIC'],
                                    'TRX': ['USDTTRC20'],
                                    'TON': ['USDTTON'],
                                    'ARB': ['USDTARB', 'USDCARB'],
                                    'OP': ['USDTOP', 'USDCOP'],
                                    'ETHBASE': ['USDCBASE'],
                                    'ALGO': ['USDCALGO']
                                  };
                                  
                                  const expandedCurrencies = new Set(baseCurrencies);
                                  baseCurrencies.forEach(currency => {
                                    const associatedStableCoins = stableCoinAssociations[currency] || [];
                                    associatedStableCoins.forEach(coin => expandedCurrencies.add(coin));
                                  });
                                  
                                  return Array.from(expandedCurrencies).map((currency) => (
                                    <SelectItem
                                      key={currency}
                                      value={currency}
                                      textValue={`${currency} - ${getCurrencyDisplayName(currency)}`}
                                    >
                                      {`${currency} - ${getCurrencyDisplayName(currency)}`}
                                    </SelectItem>
                                  ));
                                })()}
                              </SelectContent>
                            </Select>
                            <p className="font-phonic text-sm font-normal text-gray-500">
                              Convert all payments to this currency before forwarding to your wallet
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tax Management Tab */}
          <TabsContent value="tax" className="space-y-8">
            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <CardTitle className="font-phonic text-xl font-semibold text-gray-900 flex items-center gap-3">
                      Tax Collection Settings
                    </CardTitle>
                    <CardDescription className="font-capsule text-sm text-gray-600">
                      Configure tax collection for your payments
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-8">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="tax-enabled"
                    checked={settings.tax_enabled}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, tax_enabled: checked as boolean }))}
                    className="w-5 h-5 border-2 border-gray-300 rounded-md data-[state=checked]:bg-[#7f5efd] data-[state=checked]:border-[#7f5efd] data-[state=checked]:text-white transition-all duration-200 hover:border-[#7f5efd] focus:ring-2 focus:ring-[#7f5efd]/20"
                  />
                  <label htmlFor="tax-enabled" className="font-phonic text-base font-normal">
                    Enable tax collection
                  </label>
                </div>

                {settings.tax_enabled && (
                  <div className="space-y-8">
                    {/* Tax Strategy */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#7f5efd] rounded-lg">
                          <Calculator className="h-4 w-4 text-white" />
                        </div>
                        <h3 className="font-phonic text-lg font-semibold text-gray-900">Tax Strategy</h3>
                      </div>
                      <Select
                        value={settings.tax_strategy}
                        onValueChange={(value: 'origin' | 'destination' | 'custom') => setSettings(prev => ({ ...prev, tax_strategy: value }))}
                      >
                        <SelectTrigger className="w-full h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="origin">Origin-based (charge tax based on business location)</SelectItem>
                          <SelectItem value="destination">Destination-based (charge tax based on customer location)</SelectItem>
                          <SelectItem value="custom">Custom rates per transaction</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Sales Type */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#7f5efd] rounded-lg">
                          <Zap className="h-4 w-4 text-white" />
                        </div>
                        <h3 className="font-phonic text-lg font-semibold text-gray-900">Sales Type</h3>
                      </div>
                      <Select
                        value={settings.sales_type}
                        onValueChange={(value: 'local' | 'online' | 'both') => setSettings(prev => ({ ...prev, sales_type: value }))}
                      >
                        <SelectTrigger className="w-full h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="local">Local Sales Only</SelectItem>
                          <SelectItem value="online">Online Sales Only</SelectItem>
                          <SelectItem value="both">Both Local and Online</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Default Tax Rates */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#7f5efd] rounded-lg">
                            <DollarSign className="h-4 w-4 text-white" />
                          </div>
                          <h3 className="font-phonic text-lg font-semibold text-gray-900">Default Tax Rates</h3>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addTaxRate}
                          className="border-gray-200 hover:border-[#7f5efd] hover:text-[#7f5efd] transition-colors duration-200 flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add Rate
                        </Button>
                      </div>
                      
                      <div className="space-y-4">
                        {settings.tax_rates.map((rate) => (
                          <div key={rate.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-[#7f5efd] transition-colors">
                            <input
                              placeholder="Tax label (e.g., Sales Tax)"
                              value={rate.label}
                              onChange={(e) => updateTaxRate(rate.id, 'label', e.target.value)}
                              className="flex-1 w-full h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 focus:border-[#7f5efd] focus:ring-[#7f5efd]/20 rounded-md px-3"
                            />
                            <div className="flex items-center gap-3">
                              <input
                                type="text"
                                inputMode="decimal"
                                step="any"
                                placeholder="0.0"
                                value={rate.percentage}
                                onChange={(e) => updateTaxRate(rate.id, 'percentage', e.target.value)}
                                className="w-24 h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 focus:border-[#7f5efd] focus:ring-[#7f5efd]/20 rounded-md px-3"
                                min="0"
                                max="100"
                              />
                              <span className="font-capsule text-xs text-gray-600">%</span>
                            </div>
                            {settings.tax_rates.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTaxRate(rate.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {null}
                    </div>

                    {/* Tax Information */}
                    <Alert className="border-orange-200 bg-orange-50">
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                      <AlertDescription className="font-phonic text-base font-normal">
                        <strong>Important:</strong> Cryptrac helps you charge and report taxes accurately but does not file or remit taxes. 
                        Consult with a tax professional for compliance requirements in your jurisdiction.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-8">
            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <CardTitle className="font-phonic text-xl font-semibold text-gray-900 flex items-center gap-3">
                      Notification Preferences
                    </CardTitle>
                    <CardDescription className="font-capsule text-sm text-gray-600">
                      Manage email alerts and public receipts
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-6 border border-gray-200 rounded-lg hover:border-[#7f5efd] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-[#7f5efd] rounded-lg">
                        <Bell className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-phonic text-lg font-semibold text-gray-900">Payment Notifications</h3>
                        <p className="font-capsule text-sm text-gray-600">Receive email alerts when payments are received</p>
                      </div>
                    </div>
                    <Checkbox
                      checked={notificationSettings.email_payment_notifications_enabled}
                      onCheckedChange={(checked) =>
                        updateNotificationSetting('email_payment_notifications_enabled', !!checked)
                      }
                      className="w-5 h-5 border-2 border-gray-300 rounded-md data-[state=checked]:bg-[#7f5efd] data-[state=checked]:border-[#7f5efd] data-[state=checked]:text-white transition-all duration-200 hover:border-[#7f5efd] focus:ring-2 focus:ring-[#7f5efd]/20"
                    />
                  </div>

                  <div className="flex items-center justify-between p-6 border border-gray-200 rounded-lg hover:border-[#7f5efd] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-[#7f5efd] rounded-lg">
                        <CreditCard className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-phonic text-lg font-semibold text-gray-900">Public Receipts</h3>
                        <p className="font-capsule text-sm text-gray-600">Make payment receipts publicly accessible</p>
                      </div>
                    </div>
                    <Checkbox
                      checked={notificationSettings.public_receipts_enabled}
                      onCheckedChange={(checked) =>
                        updateNotificationSetting('public_receipts_enabled', !!checked)
                      }
                      className="w-5 h-5 border-2 border-gray-300 rounded-md data-[state=checked]:bg-[#7f5efd] data-[state=checked]:border-[#7f5efd] data-[state=checked]:text-white transition-all duration-200 hover:border-[#7f5efd] focus:ring-2 focus:ring-[#7f5efd]/20"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}
