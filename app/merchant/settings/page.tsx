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
  Zap
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { DashboardLayout } from '@/app/components/layout/dashboard-layout';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Checkbox } from '@/app/components/ui/checkbox';
import { supabase } from '@/lib/supabase-browser';
import toast from 'react-hot-toast';
import { BackToDashboard } from '@/app/components/ui/back-to-dashboard';

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
      toast.success('Settings updated');
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
      if (wallets.ETH && !wallets.ETHBASE) {
        wallets.ETHBASE = wallets.ETH;
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
        // Tax configuration from database or defaults
        tax_enabled: merchant.tax_enabled || false,
        tax_rates: (merchant.tax_rates || [
          { id: '1', label: 'Sales Tax', percentage: 8.5 }
        ]).map(
          (rate: { id: string; label: string; percentage: number | string }) => ({
            ...rate,
            percentage: String(rate.percentage)
          })
        ),
        business_address: merchant.business_address || {
          street: '',
          city: '',
          state: '',
          zip_code: '',
          country: 'US'
        },
        tax_strategy: merchant.tax_strategy || 'origin',
        sales_type: merchant.sales_type || 'local'
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
      toast.success('Settings saved successfully');

    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

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
      <DashboardLayout user={user}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#7f5efd]"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-8">
        {/* Enhanced Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-4 mb-2">
            <BackToDashboard />
          </div>
          <h1 className="heading-xl text-gray-900">
            Account Settings
          </h1>
          <p className="text-body-lg text-gray-600 font-medium">
            Manage your payment preferences, tax settings, and notifications
          </p>
        </div>

        {/* Unified Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={saveSettings} 
            disabled={saving}
            size="lg"
            className="flex items-center gap-3"
          >
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Save All Settings
              </>
            )}
          </Button>
        </div>

        {/* Enhanced Tabs */}
        <Tabs defaultValue="payments" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-2 rounded-xl">
            <TabsTrigger value="payments" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-[#7f5efd]">
              <CreditCard className="h-4 w-4" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="tax" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-[#7f5efd]">
              <Calculator className="h-4 w-4" />
              Tax
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-[#7f5efd]">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-8">
            <Card className="card-hover shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                    <CreditCard className="h-6 w-6 text-white" />
                  </div>
                  Payment Configuration
                </CardTitle>
                <CardDescription className="text-body">
                  Configure your payment processing preferences and fees
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <AlertDescription className="text-body">
                    <strong>Auto-Forward Enabled:</strong> All payments are automatically forwarded to your configured wallet addresses. 
                    No funds are held by Cryptrac.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <DollarSign className="h-5 w-5 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Gateway Fee Structure</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-bold text-gray-900">Gateway Fee</p>
                            <p className="text-sm text-gray-600">
                              {settings.auto_convert_enabled ? 'With auto-convert enabled' : 'With auto-convert disabled'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-[#7f5efd]">
                              {settings.auto_convert_enabled ? '1.0%' : '0.5%'}
                            </p>
                            <p className="text-xs text-gray-500">
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
                             <label htmlFor="merchant-pays-fee" className="text-body font-medium">
                               Merchant pays gateway fee
                             </label>
                           </div>
                           
                           <div className="flex items-center space-x-3">
                             <Checkbox
                               id="customer-pays-fee"
                               checked={settings.charge_customer_fee}
                               onCheckedChange={(checked) => setSettings(prev => ({ ...prev, charge_customer_fee: checked as boolean }))}
                             />
                            <label htmlFor="customer-pays-fee" className="text-body font-medium">
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
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Zap className="h-5 w-5 text-green-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Auto-Convert Settings</h3>
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
                          <label htmlFor="auto-convert" className="text-body font-medium">
                            Enable automatic conversion to preferred payout currency
                          </label>
                        </div>
                        
                        {settings.auto_convert_enabled && (
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Preferred Payout Currency</label>
                            <Select 
                              value={settings.preferred_payout_currency || ''} 
                              onValueChange={(value) => setSettings(prev => ({ ...prev, preferred_payout_currency: value }))}
                            >
                              <SelectTrigger className="form-input-enhanced">
                                <SelectValue placeholder="Select payout currency" />
                              </SelectTrigger>
                              <SelectContent>
                                {(() => {
                                  const baseCurrencies = Object.keys(settings.wallets);
                                  const stableCoinAssociations: Record<string, string[]> = {
                                    'SOL': ['USDCSOL', 'USDTSOL'],
                                    'ETH': ['USDT', 'USDC', 'DAI', 'PYUSD', 'ETHBASE', 'USDCBASE'],
                                    'BNB': ['USDTBSC', 'USDCBSC'],
                                    'MATIC': ['USDTMATIC', 'USDCMATIC'],
                                    'TRX': ['USDTTRC20'],
                                    'TON': ['USDTTON'],
                                    'ARB': ['USDTARB', 'USDCARB'],
                                    'OP': ['USDTOP', 'USDCOP'],
                                    'ETHBASE': ['USDCBASE'],
                                    'ALGO': ['USDCALGO']
                                  };
                                  
                                  const expandedCurrencies = [...baseCurrencies];
                                  baseCurrencies.forEach(currency => {
                                    const associatedStableCoins = stableCoinAssociations[currency] || [];
                                    expandedCurrencies.push(...associatedStableCoins);
                                  });
                                  
                                  return expandedCurrencies.map((currency) => (
                                    <SelectItem key={currency} value={currency}>
                                      {currency} - {getCurrencyDisplayName(currency)}
                                    </SelectItem>
                                  ));
                                })()}
                              </SelectContent>
                            </Select>
                            <p className="text-sm text-gray-500">
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
            <Card className="card-hover shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl">
                    <Calculator className="h-6 w-6 text-white" />
                  </div>
                  Tax Collection Settings
                </CardTitle>
                <CardDescription className="text-body">
                  Configure tax collection for your payments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="tax-enabled"
                    checked={settings.tax_enabled}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, tax_enabled: checked as boolean }))}
                  />
                  <label htmlFor="tax-enabled" className="text-body font-bold">
                    Enable tax collection
                  </label>
                </div>

                {settings.tax_enabled && (
                  <div className="space-y-8">
                    {/* Tax Strategy */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Calculator className="h-5 w-5 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Tax Strategy</h3>
                      </div>
                      <Select 
                        value={settings.tax_strategy} 
                        onValueChange={(value: 'origin' | 'destination' | 'custom') => setSettings(prev => ({ ...prev, tax_strategy: value }))}
                      >
                        <SelectTrigger className="form-input-enhanced">
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
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Zap className="h-5 w-5 text-green-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Sales Type</h3>
                      </div>
                      <Select 
                        value={settings.sales_type} 
                        onValueChange={(value: 'local' | 'online' | 'both') => setSettings(prev => ({ ...prev, sales_type: value }))}
                      >
                        <SelectTrigger className="form-input-enhanced">
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
                          <div className="p-2 bg-red-100 rounded-lg">
                            <DollarSign className="h-5 w-5 text-red-600" />
                          </div>
                          <h3 className="text-lg font-bold text-gray-900">Default Tax Rates</h3>
                        </div>
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={addTaxRate}
                          className="flex items-center gap-3"
                        >
                          <Info className="h-5 w-5" />
                          Add Rate
                        </Button>
                      </div>
                      
                      <div className="space-y-4">
                        {settings.tax_rates.map((rate) => (
                          <div key={rate.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-[#7f5efd] transition-colors">
                            <input
                              placeholder="Tax label (e.g., Sales Tax)"
                              value={rate.label}
                              onChange={(e) => updateTaxRate(rate.id, 'label', e.target.value)}
                              className="flex-1 form-input-enhanced"
                            />
                            <div className="flex items-center gap-3">
                              <input
                                type="text"
                                inputMode="decimal"
                                step="any"
                                placeholder="0.0"
                                value={rate.percentage}
                                onChange={(e) => updateTaxRate(rate.id, 'percentage', e.target.value)}
                                className="w-24 form-input-enhanced"
                                min="0"
                                max="100"
                              />
                              <span className="text-sm font-bold text-gray-600">%</span>
                            </div>
                            {settings.tax_rates.length > 1 && (
                              <Button
                                variant="ghost"
                                size="lg"
                                onClick={() => removeTaxRate(rate.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <div className="text-body font-bold text-blue-900">
                          Total Default Tax Rate: {settings.tax_rates.reduce((sum, rate) => sum + (parseFloat(rate.percentage) || 0), 0).toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    {/* Tax Information */}
                    <Alert className="border-orange-200 bg-orange-50">
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                      <AlertDescription className="text-body">
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
            <Card className="card-hover shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl">
                    <Bell className="h-6 w-6 text-white" />
                  </div>
                  Notification Preferences
                </CardTitle>
                <CardDescription className="text-body">
                  Manage email alerts and public receipts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-6 border border-gray-200 rounded-xl hover:border-[#7f5efd] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <Bell className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Payment Notifications</h3>
                        <p className="text-body text-gray-600">Receive email alerts when payments are received</p>
                      </div>
                    </div>
                    <Checkbox
                      checked={notificationSettings.email_payment_notifications_enabled}
                      onCheckedChange={(checked) =>
                        updateNotificationSetting('email_payment_notifications_enabled', !!checked)
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-6 border border-gray-200 rounded-xl hover:border-[#7f5efd] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Public Receipts</h3>
                        <p className="text-body text-gray-600">Make payment receipts publicly accessible</p>
                      </div>
                    </div>
                    <Checkbox
                      checked={notificationSettings.public_receipts_enabled}
                      onCheckedChange={(checked) =>
                        updateNotificationSetting('public_receipts_enabled', !!checked)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

