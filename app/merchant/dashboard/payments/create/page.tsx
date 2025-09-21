"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTimezone } from '@/lib/contexts/TimezoneContext';
import { formatDateShort } from '@/lib/utils/date-utils';
import {
  DollarSign,
  Settings,
  CreditCard,
  Users,
  AlertCircle,
  Clock,
  Plus,
  Trash2,
  Info,
  Coins,
  ShoppingBag,
  Receipt,
  Zap
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Badge } from '@/app/components/ui/badge';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { Breadcrumbs } from '@/app/components/ui/breadcrumbs';
import { supabase } from '@/lib/supabase-browser';
import { toast } from 'sonner';


interface TaxRate {
  id: string;
  label: string;
  percentage: string;
}

interface CreatePaymentLinkForm {
  title: string;
  description: string;
  amount: string;
  currency: string;
  accepted_cryptos: string[];
  expires_at: string;
  max_uses: string;
  auto_convert_enabled: boolean | null; // null = inherit from merchant settings
  charge_customer_fee: boolean | null; // null = inherit from merchant settings
  tax_enabled: boolean;
  tax_rates: TaxRate[];
}

interface MerchantSettings {
  wallets: Record<string, string>;
  auto_convert_enabled: boolean;
  charge_customer_fee: boolean;
  tax_enabled: boolean;
  tax_rates: TaxRate[];
  tax_strategy: string;
  payment_config: {
    fee_percentage?: number;
    auto_convert_fee?: number;
    no_convert_fee?: number;
  };
}

interface MerchantRecord {
  wallets: Record<string, string> | null;
  auto_convert_enabled: boolean | null;
  charge_customer_fee: boolean | null;
  tax_enabled: boolean | null;
  tax_rates: TaxRate[] | null;
  tax_strategy: string | null;
  payment_config: MerchantSettings['payment_config'] | null;
  onboarding_data?: {
    tax_enabled?: boolean;
    tax_rates?: TaxRate[];
    tax_strategy?: string;
  } | null;
}

const FIAT_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
];

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

export default function CreatePaymentLinkPage() {
  const router = useRouter();
  const { timezone } = useTimezone();
  const [loading, setLoading] = useState(true);
  const [merchantSettings, setMerchantSettings] = useState<MerchantSettings | null>(null);
  const [availableCryptos, setAvailableCryptos] = useState<string[]>([]);
  const [form, setForm] = useState<CreatePaymentLinkForm>({
    title: '',
    description: '',
    amount: '',
    currency: 'USD',
    accepted_cryptos: [], // Will be populated with all available cryptos
    expires_at: '',
    max_uses: '',
    auto_convert_enabled: null, // null = inherit from merchant settings
    charge_customer_fee: null, // null = inherit from merchant settings
    tax_enabled: false,
    tax_rates: []
  });

    useEffect(() => {
      loadMerchantSettings();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMerchantSettings = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        router.push('/login');
        return;
      }

      // Load merchant settings
      const { data: merchant, error: merchantError } = await supabase
        .from('merchants')
        .select('wallets, auto_convert_enabled, charge_customer_fee, payment_config, tax_enabled, tax_rates, tax_strategy, onboarding_data')
        .eq('user_id', session.user.id)
        .single<MerchantRecord>();

      if (merchantError) {
        console.error('Error loading merchant settings:', merchantError);
        toast.error('Failed to load merchant settings');
        return;
      }

      if (!merchant) {
        toast.error('Merchant settings are unavailable');
        return;
      }

      const wallets = { ...(merchant.wallets || {}) };

      const onboardingData = merchant.onboarding_data ?? null;
      const merchantTaxRates = merchant.tax_rates ?? [];
      const onboardingTaxRates = onboardingData?.tax_rates ?? [];

      // Resolve tax configuration using top-level fields, falling back to onboarding_data
      const resolvedTaxEnabled = Boolean(merchant.tax_enabled ?? onboardingData?.tax_enabled ?? false);
      const resolvedTaxRates = resolvedTaxEnabled
        ? (merchantTaxRates.length > 0 ? merchantTaxRates : onboardingTaxRates)
        : [];
      const resolvedTaxStrategy = merchant.tax_strategy || onboardingData?.tax_strategy || 'origin';

      const updatedMerchant = { 
        wallets,
        auto_convert_enabled: merchant.auto_convert_enabled ?? false,
        charge_customer_fee: merchant.charge_customer_fee ?? false,
        tax_enabled: resolvedTaxEnabled,
        tax_rates: resolvedTaxRates,
        tax_strategy: resolvedTaxStrategy,
        payment_config: merchant.payment_config ?? {}
      } as MerchantSettings;
      setMerchantSettings(updatedMerchant);
      const cryptos = Object.keys(wallets);
      setAvailableCryptos(cryptos);

      // Set default form values - all cryptocurrencies selected by default
      setForm(prev => ({
        ...prev,
        accepted_cryptos: cryptos, // Select all available cryptos by default
        auto_convert_enabled: null, // null = inherit from merchant settings
        charge_customer_fee: null, // null = inherit from merchant settings
        tax_enabled: updatedMerchant.tax_enabled || false, // Pre-check tax if enabled in merchant settings
        tax_rates: updatedMerchant.tax_enabled && updatedMerchant.tax_rates ? updatedMerchant.tax_rates : [] // Pre-populate tax rates if tax is enabled
      }));

    } catch (error) {
      console.error('Error loading merchant settings:', error);
      toast.error('Failed to load merchant settings');
    } finally {
      setLoading(false);
    }
  };

  const handleCryptoToggle = (crypto: string, checked: boolean) => {
    setForm(prev => ({
      ...prev,
      accepted_cryptos: checked 
        ? [...prev.accepted_cryptos, crypto]
        : prev.accepted_cryptos.filter(c => c !== crypto)
    }));
  };

  // Tax rate management functions
  const addTaxRate = () => {
    const newId = (form.tax_rates.length + 1).toString();
    setForm(prev => ({
      ...prev,
      tax_rates: [...prev.tax_rates, { id: newId, label: '', percentage: '0' }]
    }));
  };

  const removeTaxRate = (id: string) => {
    setForm(prev => ({
      ...prev,
      tax_rates: prev.tax_rates.filter(rate => rate.id !== id)
    }));
  };

  const updateTaxRate = (id: string, field: 'label' | 'percentage', value: string) => {
    setForm(prev => ({
      ...prev,
      tax_rates: prev.tax_rates.map(rate => 
        rate.id === id ? { ...rate, [field]: value } : rate
      )
    }));
  };

  // Handle tax enabled toggle - auto-populate with merchant's global tax settings
  const handleTaxEnabledToggle = (enabled: boolean) => {
    setForm(prev => ({
      ...prev,
      tax_enabled: enabled,
      tax_rates: enabled && prev.tax_rates.length === 0 ? (
        // Use merchant's global tax settings if available, otherwise provide default
        merchantSettings?.tax_rates && merchantSettings.tax_rates.length > 0 
          ? merchantSettings.tax_rates 
          : [{ id: '1', label: 'Sales Tax', percentage: '8.5' }]
      ) : prev.tax_rates
    }));
  };

  const getEffectiveSettings = () => {
    if (!merchantSettings) return { auto_convert_enabled: false, charge_customer_fee: false };
    
    return {
      auto_convert_enabled: form.auto_convert_enabled !== null 
        ? form.auto_convert_enabled 
        : merchantSettings.auto_convert_enabled,
      charge_customer_fee: form.charge_customer_fee !== null 
        ? form.charge_customer_fee 
        : merchantSettings.charge_customer_fee
    };
  };

  const calculateFees = () => {
    const baseAmount = parseFloat(form.amount) || 0;
    const effectiveSettings = getEffectiveSettings();
    
    // Calculate total tax from all tax rates
    let totalTaxAmount = 0;
    let totalTaxPercentage = 0;
    const taxBreakdown: Record<string, number> = {};
    
    if (form.tax_enabled && form.tax_rates.length > 0) {
      form.tax_rates.forEach(taxRate => {
        const percentage = parseFloat(taxRate.percentage) || 0;
        const taxAmount = (baseAmount * percentage) / 100;
        totalTaxAmount += taxAmount;
        totalTaxPercentage += percentage;
        
        // Create breakdown key from label (lowercase, replace spaces with underscores)
        const breakdownKey = taxRate.label.toLowerCase().replace(/\s+/g, '_');
        taxBreakdown[breakdownKey] = taxAmount;
      });
    }
    
    const subtotalWithTax = baseAmount + totalTaxAmount;
    
    const feePercentage = effectiveSettings.auto_convert_enabled ? 1.0 : 0.5;
    const feeAmount = (subtotalWithTax * feePercentage) / 100;
    const totalAmount = effectiveSettings.charge_customer_fee ? subtotalWithTax + feeAmount : subtotalWithTax;
    const merchantReceives = effectiveSettings.charge_customer_fee ? subtotalWithTax : subtotalWithTax - feeAmount;
    
    return {
      baseAmount,
      totalTaxPercentage,
      totalTaxAmount,
      taxBreakdown,
      subtotalWithTax,
      feePercentage,
      feeAmount,
      totalAmount,
      merchantReceives,
      effectiveSettings
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.title.trim()) {
      toast.error('Please enter a title for your payment link');
      return;
    }
    
    if (!form.amount || parseFloat(form.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (form.accepted_cryptos.length === 0) {
      toast.error('Please select at least one cryptocurrency');
      return;
    }

    // Validate tax rates if tax is enabled
    if (form.tax_enabled) {
      if (form.tax_rates.length === 0) {
        toast.error('Please add at least one tax rate or disable tax');
        return;
      }
      
      // Check if all tax rates have valid labels and percentages
      const invalidTaxRates = form.tax_rates.filter(rate => 
        !rate.label.trim() || isNaN(parseFloat(rate.percentage)) || parseFloat(rate.percentage) < 0
      );
      
      if (invalidTaxRates.length > 0) {
        toast.error('Please provide valid labels and percentages for all tax rates');
        return;
      }
    }

    try {
      setLoading(true);
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        router.push('/login');
        return;
      }

      const fees = calculateFees();
      
      const paymentLinkData = {
        title: form.title.trim(),
        description: form.description.trim(),
        amount: parseFloat(form.amount),
        currency: form.currency,
        accepted_cryptos: form.accepted_cryptos,
        expires_at: form.expires_at || null,
        max_uses: form.max_uses ? parseInt(form.max_uses) : null,
        source: 'dashboard',
        auto_convert_enabled: form.auto_convert_enabled,
        charge_customer_fee: form.charge_customer_fee,
        tax_enabled: form.tax_enabled,
        tax_rates: form.tax_enabled ? form.tax_rates.map(rate => ({
          label: rate.label.trim(),
          percentage: parseFloat(rate.percentage) || 0
        })) : [],
        metadata: {
          base_amount: fees.baseAmount,
          total_tax_percentage: fees.totalTaxPercentage,
          total_tax_amount: fees.totalTaxAmount,
          tax_breakdown: fees.taxBreakdown,
          subtotal_with_tax: fees.subtotalWithTax,
          fee_percentage: fees.feePercentage,
          fee_amount: fees.feeAmount,
          total_amount: fees.totalAmount,
          merchant_receives: fees.merchantReceives
        }
      };

      console.log('Creating payment link with data:', paymentLinkData);

      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentLinkData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create payment link');
      }

      if (result.success) {
        toast.success('Payment link created successfully!');
        // Use the database ID for the merchant dashboard, not the link_id
        router.push(`/merchant/dashboard/payments/${result.payment_link.id}`);
      } else {
        throw new Error(result.error || 'Failed to create payment link');
      }

    } catch (error) {
      console.error('Error creating payment link:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create payment link');
    } finally {
      setLoading(false);
    }
  };

  const fees = calculateFees();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#7f5efd]"></div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 space-y-8 max-w-7xl mx-auto max-md:px-4 max-md:space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { name: 'Dashboard', href: '/merchant/dashboard' },
            { name: 'Payments', href: '/merchant/dashboard/payments' },
            { name: 'Create Payment Link', href: '/merchant/dashboard/payments/create' }
          ]}
        />

        {/* Enhanced Header */}
        <div className="space-y-2">
          <h1 className="font-phonic text-3xl font-normal tracking-tight text-gray-900 mb-4">
            Create Payment Link
          </h1>
          <p className="font-phonic text-base font-normal text-gray-600">
            Create a new cryptocurrency payment link for your customers
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 max-md:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-md:gap-5">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-8 max-md:space-y-6">
              {/* Basic Information */}
              <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 max-md:rounded-2xl">
                <CardHeader className="p-6 max-md:p-4">
                  <CardTitle className="font-phonic text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-[#7f5efd]" />
                    Basic Information
                  </CardTitle>
                  <CardDescription className="font-capsule text-sm text-gray-600">
                    Enter the basic details for your payment link
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-6 max-md:p-4 max-md:space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-md:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="font-phonic text-sm font-semibold text-gray-900">Payment Link Title *</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Product Purchase, Service Payment"
                        value={form.title}
                        onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                        className="h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description" className="font-phonic text-sm font-normal text-gray-700">Description</Label>
                      <Input
                        id="description"
                        placeholder="Brief description for your customers"
                        value={form.description}
                        onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                        className="h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pricing Configuration */}
              <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 max-md:rounded-2xl">
                <CardHeader className="p-6 max-md:p-4">
                  <CardTitle className="font-phonic text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-[#7f5efd]" />
                    Pricing Configuration
                  </CardTitle>
                  <CardDescription className="font-capsule text-sm text-gray-600">
                    Set the amount, currency, and billing details
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-6 max-md:p-4 max-md:space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-md:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount" className="font-phonic text-sm font-normal text-gray-700">Amount *</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={form.amount}
                        onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))}
                        className="h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currency" className="font-phonic text-sm font-normal text-gray-700">Currency *</Label>
                      <Select value={form.currency} onValueChange={(value) => setForm(prev => ({ ...prev, currency: value }))}>
                        <SelectTrigger className="h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          {FIAT_CURRENCIES.map(currency => (
                            <SelectItem
                              key={currency.code}
                              value={currency.code}
                            >
                              {currency.symbol} {currency.code} - {currency.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Tax Configuration */}
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="tax_enabled"
                        checked={form.tax_enabled}
                        onCheckedChange={(checked) => handleTaxEnabledToggle(checked === true)}
                      />
                      <Label htmlFor="tax_enabled" className="font-phonic text-sm font-semibold text-gray-900">
                        Enable tax collection
                      </Label>
                    </div>

                    {/* Show global tax settings info */}
                    {merchantSettings && (
                      <div className="font-capsule text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
                        <Info className="h-3 w-3 inline mr-1" />
                        Global tax setting: {merchantSettings.tax_enabled ? 'Enabled' : 'Disabled'}
                        {merchantSettings.tax_enabled && merchantSettings.tax_rates && merchantSettings.tax_rates.length > 0 &&
                          ` (${merchantSettings.tax_rates.length} tax rate${merchantSettings.tax_rates.length !== 1 ? 's' : ''} configured)`
                        }
                        {form.tax_enabled && merchantSettings.tax_rates && merchantSettings.tax_rates.length > 0 &&
                          ' - Global rates auto-filled below'
                        }
                      </div>
                    )}

                    {form.tax_enabled && (
                      <div className="ml-6 space-y-6">
                        <div className="flex items-center justify-between">
                          <Label className="font-phonic text-sm font-semibold text-gray-900">Tax Rates</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addTaxRate}
                            className="flex items-center gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Add Tax Rate
                          </Button>
                        </div>

                        <div className="space-y-4">
                          {form.tax_rates.map((taxRate) => (
                            <div key={taxRate.id} className="flex items-center gap-4 p-4 border rounded-lg">
                              <div className="flex-1">
                                <Input
                                  placeholder="Tax Label (e.g., State Tax, Local Tax)"
                                  value={taxRate.label}
                                  onChange={(e) => updateTaxRate(taxRate.id, 'label', e.target.value)}
                                  className="h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                                />
                              </div>

                              <div className="w-24">
                                <Input
                                  type="number"
                                  step="0.001"
                                  min="0"
                                  max="50"
                                  placeholder="6.625"
                                  value={taxRate.percentage}
                                  onChange={(e) => updateTaxRate(taxRate.id, 'percentage', e.target.value)}
                                  className="h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                                />
                              </div>

                              <span className="text-body text-gray-500">%</span>

                              {form.tax_rates.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeTaxRate(taxRate.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="text-body-sm text-gray-600 bg-blue-50 p-4 rounded-lg">
                          <strong>Total Tax Rate:</strong> {fees.totalTaxPercentage.toFixed(3)}%
                          {fees.totalTaxAmount > 0 && (
                            <span className="ml-2">
                              ({form.currency} {fees.totalTaxAmount.toFixed(2)})
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Payment Settings */}
              <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 max-md:rounded-2xl">
                <CardHeader className="p-6 max-md:p-4">
                  <CardTitle className="font-phonic text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Coins className="h-5 w-5 text-[#7f5efd]" />
                    Payment Settings
                  </CardTitle>
                  <CardDescription className="font-capsule text-sm text-gray-600">
                    Configure cryptocurrency payment options
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-6 max-md:p-4 max-md:space-y-5">
                  <div className="space-y-4">
                    <div>
                      <Label className="font-phonic text-sm font-semibold text-gray-900">Accepted Cryptocurrencies</Label>
                      <p className="font-phonic text-xs font-normal text-gray-500 mt-1">Select which cryptocurrencies customers can use for payment</p>
                    </div>
                    {availableCryptos.length > 0 ? (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 max-md:grid-cols-1 max-md:gap-3">
                          {availableCryptos.map(crypto => (
                            <label key={crypto} className="flex items-center space-x-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-200">
                              <Checkbox
                                checked={form.accepted_cryptos.includes(crypto)}
                                onCheckedChange={(checked) => handleCryptoToggle(crypto, checked === true)}
                              />
                              <span className="text-sm font-medium">{crypto}</span>
                            </label>
                          ))}
                        </div>

                        {/* Display associated stablecoins */}
                        {form.accepted_cryptos.some(crypto => stableCoinAssociations[crypto]) && (
                          <Alert className="bg-[#7f5efd]/10 border-[#7f5efd]/20">
                            <Info className="h-4 w-4 text-[#7f5efd]" />
                            <AlertDescription className="text-[#7f5efd]">
                              <strong>Included stablecoins:</strong>
                              <div className="mt-2 text-sm space-y-1">
                                {form.accepted_cryptos.filter(crypto => stableCoinAssociations[crypto]).map(crypto => (
                                  <div key={crypto}>
                                    • <strong>{crypto}</strong> → {stableCoinAssociations[crypto].join(', ')}
                                  </div>
                                ))}
                              </div>
                            </AlertDescription>
                          </Alert>
                        )}
                      </>
                    ) : (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          No cryptocurrency wallets configured. Please add wallet addresses in your settings first.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {/* Payment Options */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-md:gap-4">
                      {/* Gateway Fee Setting */}
                      <div className="space-y-2">
                        <Label className="font-phonic text-sm font-semibold text-gray-900">Gateway Fee</Label>
                        <Select
                          value={form.charge_customer_fee === null ? 'inherit' : form.charge_customer_fee ? 'customer' : 'merchant'}
                          onValueChange={(value) => {
                            setForm({
                              ...form,
                              charge_customer_fee: value === 'inherit' ? null : value === 'customer'
                            });
                          }}
                        >
                          <SelectTrigger className="h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="inherit">
                              Use global setting ({merchantSettings?.charge_customer_fee ? 'Customer pays' : 'Merchant pays'})
                            </SelectItem>
                            <SelectItem value="customer">Customer pays fee</SelectItem>
                            <SelectItem value="merchant">Merchant pays fee</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Auto-Convert Setting */}
                      <div className="space-y-2">
                        <Label className="font-phonic text-sm font-semibold text-gray-900">Auto-Convert</Label>
                        <Select
                          value={form.auto_convert_enabled === null ? 'inherit' : form.auto_convert_enabled ? 'enabled' : 'disabled'}
                          onValueChange={(value) => {
                            setForm({
                              ...form,
                              auto_convert_enabled: value === 'inherit' ? null : value === 'enabled'
                            });
                          }}
                        >
                          <SelectTrigger className="h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="inherit">
                              Use global setting ({merchantSettings?.auto_convert_enabled ? 'Enabled' : 'Disabled'})
                            </SelectItem>
                            <SelectItem value="enabled">Enable auto-convert</SelectItem>
                            <SelectItem value="disabled">Disable auto-convert</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                </CardContent>
              </Card>

              {/* Advanced Settings */}
              <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 max-md:rounded-2xl">
                <CardHeader className="p-6 max-md:p-4">
                  <CardTitle className="font-phonic text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Settings className="h-5 w-5 text-[#7f5efd]" />
                    Advanced Settings
                  </CardTitle>
                  <CardDescription className="font-capsule text-sm text-gray-600">
                    Configure expiration and usage limits
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-6 max-md:p-4 max-md:space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-md:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expires_at" className="font-phonic text-sm font-normal text-gray-700">Expiration Date</Label>
                      <Input
                        id="expires_at"
                        type="datetime-local"
                        value={form.expires_at}
                        onChange={(e) => setForm(prev => ({ ...prev, expires_at: e.target.value }))}
                        className="h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                      />
                      <p className="font-capsule text-xs text-gray-600">Leave empty for no expiration</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="max_uses" className="font-phonic text-sm font-normal text-gray-700">Maximum Uses</Label>
                      <Input
                        id="max_uses"
                        type="number"
                        min="1"
                        placeholder="Leave empty for unlimited"
                        value={form.max_uses}
                        onChange={(e) => setForm(prev => ({ ...prev, max_uses: e.target.value }))}
                        className="h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                      />
                      <p className="font-capsule text-xs text-gray-600">Leave empty for unlimited uses</p>
                    </div>
                  </div>

                  <Alert className="bg-[#7f5efd]/10 border-[#7f5efd]/20">
                    <Info className="h-4 w-4 text-[#7f5efd]" />
                    <AlertDescription className="font-phonic text-sm font-normal text-[#7f5efd]">
                      After successful payment, customers will be automatically redirected to Cryptrac&apos;s branded thank you page with options to receive their receipt.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>

            {/* Payment Link Preview */}
            <div className="space-y-8 max-md:space-y-6">
              <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 max-md:rounded-2xl">
                <CardHeader className="p-6 max-md:p-4">
                  <CardTitle className="font-phonic text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-[#7f5efd]" />
                    Payment Preview
                  </CardTitle>
                  <CardDescription className="font-capsule text-sm text-gray-600">
                    How your payment link will appear
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-6 max-md:p-4 max-md:space-y-5">
                  {/* Preview Section - Smart Terminal Style */}
                  <div className="space-y-4">
                    {/* Title and Description */}
                    <div className="text-center">
                      <h3 className="font-phonic text-lg font-semibold text-gray-900">{form.title || 'Payment Link Title'}</h3>
                      {form.description && (
                        <p className="font-phonic text-sm text-gray-600 mt-1">{form.description}</p>
                      )}
                    </div>

                    {/* Amount Display - Smart Terminal Style */}
                    <div className="bg-gradient-to-br from-purple-50 to-white p-4 rounded-xl border border-purple-100">
                      <div className="flex items-center justify-center mb-2">
                        <DollarSign className="h-5 w-5 text-[#7f5efd] mr-1" />
                        <span className="text-sm text-gray-500 uppercase tracking-wider">Amount</span>
                      </div>
                      <div className="text-center font-phonic font-bold text-[#7f5efd]" style={{fontSize: 'clamp(1.75rem, 5vw, 2.5rem)'}}>
                        ${fees.totalAmount.toFixed(2)}
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      {form.accepted_cryptos.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {form.accepted_cryptos.length} crypto{form.accepted_cryptos.length !== 1 ? 's' : ''} accepted
                        </Badge>
                      )}
                      {form.expires_at && (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          Expires: {formatDateShort(form.expires_at, timezone)}
                        </Badge>
                      )}
                      {form.max_uses && (
                        <Badge variant="outline" className="text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          Max uses: {form.max_uses}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Order Summary - Smart Terminal Style */}
                  <div className="bg-gradient-to-br from-gray-50 to-white p-3 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <ShoppingBag className="h-3 w-3 text-[#7f5efd]" />
                      <span className="text-[10px] font-semibold text-gray-700 uppercase tracking-wider">Order Summary</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-semibold text-gray-900">${fees.baseAmount.toFixed(2)}</span>
                      </div>

                      {form.tax_enabled && fees.totalTaxAmount > 0 && (
                        <>
                          {form.tax_rates.map((taxRate) => {
                            const percentage = parseFloat(taxRate.percentage) || 0;
                            const amount = (fees.baseAmount * percentage) / 100;
                            return amount > 0 && taxRate.label ? (
                              <div key={taxRate.id} className="flex justify-between items-center text-[#7f5efd]">
                                <span>{taxRate.label}</span>
                                <span className="font-medium">+${amount.toFixed(2)}</span>
                              </div>
                            ) : null;
                          })}
                        </>
                      )}

                      {fees.effectiveSettings.charge_customer_fee && (
                        <div className="flex justify-between items-center text-[#7f5efd]">
                          <span>Gateway fee</span>
                          <span className="font-medium">+${fees.feeAmount.toFixed(2)}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center font-bold border-t border-gray-200 pt-1">
                        <span className="text-gray-700">Total</span>
                        <span className="text-[#7f5efd]">${fees.totalAmount.toFixed(2)}</span>
                      </div>

                      {!fees.effectiveSettings.charge_customer_fee && (
                        <div className="pt-1 text-[10px] text-gray-500">
                          Gateway fee will be deducted from your payout
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            {/* Submit Button - full width below cards */}
            <div className="lg:col-span-3">
              <Button
                type="submit"
                disabled={loading || availableCryptos.length === 0}
                className="w-full h-11 bg-[#7f5efd] hover:bg-[#7c3aed] text-white flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Creating Payment Link...
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5" />
                    Create Payment Link
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    );
  }
