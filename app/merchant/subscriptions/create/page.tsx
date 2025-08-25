"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { makeAuthenticatedRequest, supabase } from '@/lib/supabase-browser';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { ChevronDown, ArrowLeft, CreditCard, DollarSign, Settings, Users, Receipt, Coins, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { BackToDashboard } from '@/app/components/ui/back-to-dashboard';
import { DashboardLayout } from '@/app/components/layout/dashboard-layout';

interface TaxRate {
  id: string;
  label: string;
  percentage: string;
}

interface MerchantSettings {
  wallets: Record<string, string>;
  auto_convert_enabled: boolean;
  charge_customer_fee: boolean;
  preferred_payout_currency: string;
  tax_enabled: boolean;
  tax_rates: TaxRate[];
  tax_strategy: string;
}

const FIAT_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
];

export default function CreateSubscriptionPage() {
  const router = useRouter();
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setMerchantSettings] = useState<MerchantSettings | null>(null);
  const [availableCryptos, setAvailableCryptos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    amount: '',
    currency: 'USD',
    accepted_cryptos: [] as string[],
    interval: 'month',
    interval_count: 1,
    max_cycles: '',
    anchor: '',
    customer_email: '',
    customer_phone: '',
    customer_name: '',
    tax_enabled: false,
    tax_rates: [] as TaxRate[],
    pause_after_missed_payments: 3,
    charge_customer_fee: null as boolean | null, // null = inherit from merchant settings
    auto_convert_enabled: null as boolean | null, // null = inherit from merchant settings
    preferred_payout_currency: 'USD',
    // Timing configuration fields
    invoice_due_days: 0,
    generate_days_in_advance: 0,
    past_due_after_days: 2,
    auto_resume_on_payment: true,
    showAdvanced: false,
  });

  useEffect(() => {
    loadMerchantSettings();
  }, []);

  const loadMerchantSettings = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        router.push('/login');
        return;
      }

      setUser(session.user as unknown as Record<string, unknown>);

      // Load merchant settings
      const { data: merchant, error: merchantError } = await supabase
        .from('merchants')
        .select('wallets, auto_convert_enabled, charge_customer_fee, preferred_payout_currency, tax_enabled, tax_rates, tax_strategy')
        .eq('user_id', session.user.id)
        .single();

      if (merchantError) {
        console.error('Error loading merchant settings:', merchantError);
        toast.error('Failed to load merchant settings');
        return;
      }

      const wallets = { ...(merchant.wallets || {}) };
      if (wallets.ETH && !wallets.ETHBASE) {
        wallets.ETHBASE = wallets.ETH;

        // Persist the ETHBASE wallet for future requests
        await supabase
          .from('merchants')
          .update({ wallets, updated_at: new Date().toISOString() })
          .eq('user_id', session.user.id);
      }

      const updatedMerchant = { ...merchant, wallets };
      setMerchantSettings(updatedMerchant);
      const cryptos = Object.keys(wallets);
      setAvailableCryptos(cryptos);

      // Set default form values based on merchant settings
      setForm(prev => ({
        ...prev,
        accepted_cryptos: cryptos, // Select all available cryptos by default
        charge_customer_fee: null, // null = inherit from merchant settings
        auto_convert_enabled: null, // null = inherit from merchant settings
        preferred_payout_currency: merchant.preferred_payout_currency || 'USD',
        tax_enabled: merchant.tax_enabled || false,
        tax_rates: merchant.tax_rates || []
      }));

    } catch (error) {
      console.error('Error loading merchant settings:', error);
      toast.error('Failed to load merchant settings');
    } finally {
      setLoading(false);
    }
  };







  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate accepted cryptos
    if (form.accepted_cryptos.length === 0) {
      toast.error('Please select at least one accepted cryptocurrency');
      return;
    }
    
    // Validate amount
    if (parseFloat(form.amount) <= 0) {
      toast.error('Amount must be greater than zero');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const body: Record<string, unknown> = {
        title: form.title,
        description: form.description,
        amount: parseFloat(form.amount),
        currency: form.currency,
        accepted_cryptos: form.accepted_cryptos,
        interval: form.interval,
        interval_count: Number(form.interval_count),
        max_cycles: form.max_cycles ? Number(form.max_cycles) : null,
        anchor: form.anchor,
        customer: { 
          email: form.customer_email, 
          phone: form.customer_phone, 
          name: form.customer_name 
        },
        pause_after_missed_payments: Number(form.pause_after_missed_payments),
        charge_customer_fee: form.charge_customer_fee,
        auto_convert_enabled: form.auto_convert_enabled,
        preferred_payout_currency: form.preferred_payout_currency,
        tax_enabled: form.tax_enabled,
        tax_rates: form.tax_rates,
        // Timing configuration
        invoice_due_days: Number(form.invoice_due_days),
        generate_days_in_advance: Number(form.generate_days_in_advance),
        past_due_after_days: Number(form.past_due_after_days),
        auto_resume_on_payment: form.auto_resume_on_payment
      };
      
      const res = await makeAuthenticatedRequest('/api/subscriptions', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      
      if (res.ok) {
        const result = await res.json();
        
        // Show warnings if any
        if (result.warnings && result.warnings.length > 0) {
          result.warnings.forEach((warning: string) => {
            toast.error(warning);
          });
        }
        
        // Still redirect on success even with warnings
        router.push(`/merchant/subscriptions/${result.data.id}`);
      } else {
        const error = await res.text();
        console.error('Failed to create subscription:', error);
        toast.error('Failed to create subscription. Please check the form and try again.');
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading merchant settings...</p>
          </div>
        </div>
      </div>
    );
  }



  return (
    <DashboardLayout user={user}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <BackToDashboard />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Create Subscription</h1>
            <p className="text-lg text-gray-600 mt-2">Set up recurring payments for your customers</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.push('/merchant/subscriptions')}
              className="flex items-center gap-2 font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Subscriptions
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7f5efd]"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-[#7f5efd] to-[#a78bfa] rounded-lg">
                    <CreditCard className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">Basic Information</CardTitle>
                    <CardDescription className="text-base text-gray-600 mt-1">
                      Set up the core details of your subscription
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Subscription Title *</label>
                    <Input
                      placeholder="e.g., Premium Plan, Monthly Service"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="h-12 text-base focus:border-[#7f5efd] focus:ring-[#7f5efd]/20"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Description</label>
                    <Input
                      placeholder="Brief description of the subscription"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="h-12 text-base focus:border-[#7f5efd] focus:ring-[#7f5efd]/20"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing Configuration */}
            <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">Pricing Configuration</CardTitle>
                    <CardDescription className="text-base text-gray-600 mt-1">
                      Set the amount, currency, and billing frequency
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Amount *</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      className="h-12 text-base focus:border-[#7f5efd] focus:ring-[#7f5efd]/20"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Currency *</label>
                    <select
                      value={form.currency}
                      onChange={(e) => setForm({ ...form, currency: e.target.value })}
                      className="w-full h-12 px-3 border border-gray-300 rounded-md focus:border-[#7f5efd] focus:ring-[#7f5efd]/20 text-base"
                    >
                      {FIAT_CURRENCIES.map(currency => (
                        <option key={currency.code} value={currency.code}>
                          {currency.symbol} {currency.code} - {currency.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Billing Interval *</label>
                    <div className="flex gap-2">
                      <select
                        value={form.interval}
                        onChange={(e) => setForm({ ...form, interval: e.target.value })}
                        className="flex-1 h-12 px-3 border border-gray-300 rounded-md focus:border-[#7f5efd] focus:ring-[#7f5efd]/20 text-base"
                      >
                        <option value="day">Day</option>
                        <option value="week">Week</option>
                        <option value="month">Month</option>
                        <option value="year">Year</option>
                      </select>
                      <Input
                        type="number"
                        min="1"
                        value={form.interval_count}
                        onChange={(e) => setForm({ ...form, interval_count: parseInt(e.target.value) || 1 })}
                        className="w-20 h-12 text-center text-base focus:border-[#7f5efd] focus:ring-[#7f5efd]/20"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Maximum Cycles</label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Leave empty for unlimited"
                      value={form.max_cycles}
                      onChange={(e) => setForm({ ...form, max_cycles: e.target.value })}
                      className="h-12 text-base focus:border-[#7f5efd] focus:ring-[#7f5efd]/20"
                    />
                    <p className="text-xs text-gray-500">Leave empty for unlimited billing cycles</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Anchor Date</label>
                    <Input
                      type="date"
                      value={form.anchor}
                      onChange={(e) => setForm({ ...form, anchor: e.target.value })}
                      className="h-12 text-base focus:border-[#7f5efd] focus:ring-[#7f5efd]/20"
                    />
                    <p className="text-xs text-gray-500">Optional: Specific date to start billing</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">Customer Information</CardTitle>
                    <CardDescription className="text-base text-gray-600 mt-1">
                      Customer details for the subscription
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Customer Name</label>
                    <Input
                      placeholder="Customer's full name"
                      value={form.customer_name}
                      onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                      className="h-12 text-base focus:border-[#7f5efd] focus:ring-[#7f5efd]/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Email Address *</label>
                    <Input
                      type="email"
                      placeholder="customer@example.com"
                      value={form.customer_email}
                      onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
                      className="h-12 text-base focus:border-[#7f5efd] focus:ring-[#7f5efd]/20"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Phone Number</label>
                    <Input
                      placeholder="+1 (555) 123-4567"
                      value={form.customer_phone}
                      onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                      className="h-12 text-base focus:border-[#7f5efd] focus:ring-[#7f5efd]/20"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Settings */}
            <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                    <Coins className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">Payment Settings</CardTitle>
                    <CardDescription className="text-base text-gray-600 mt-1">
                      Configure cryptocurrency payment options
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <label className="text-sm font-semibold text-gray-700">Accepted Cryptocurrencies</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {availableCryptos.map(crypto => (
                      <label key={crypto} className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <Checkbox
                          checked={form.accepted_cryptos.includes(crypto)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setForm({ ...form, accepted_cryptos: [...form.accepted_cryptos, crypto] });
                            } else {
                              setForm({ ...form, accepted_cryptos: form.accepted_cryptos.filter(c => c !== crypto) });
                            }
                          }}
                          className="text-[#7f5efd]"
                        />
                        <span className="text-sm font-medium">{crypto}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Charge Customer Fee</label>
                    <select
                      value={form.charge_customer_fee === null ? 'inherit' : form.charge_customer_fee ? 'yes' : 'no'}
                      onChange={(e) => {
                        const value = e.target.value;
                        setForm({
                          ...form,
                          charge_customer_fee: value === 'inherit' ? null : value === 'yes'
                        });
                      }}
                      className="w-full h-12 px-3 border border-gray-300 rounded-md focus:border-[#7f5efd] focus:ring-[#7f5efd]/20 text-base"
                    >
                      <option value="inherit">Inherit from merchant settings</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Auto-Convert to Fiat</label>
                    <select
                      value={form.auto_convert_enabled === null ? 'inherit' : form.auto_convert_enabled ? 'yes' : 'no'}
                      onChange={(e) => {
                        const value = e.target.value;
                        setForm({
                          ...form,
                          auto_convert_enabled: value === 'inherit' ? null : value === 'yes'
                        });
                      }}
                      className="w-full h-12 px-3 border border-gray-300 rounded-md focus:border-[#7f5efd] focus:ring-[#7f5efd]/20 text-base"
                    >
                      <option value="inherit">Inherit from merchant settings</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Advanced Settings */}
            <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                      <Settings className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-900">Advanced Settings</CardTitle>
                      <CardDescription className="text-base text-gray-600 mt-1">
                        Configure advanced subscription behavior
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setForm({ ...form, showAdvanced: !form.showAdvanced })}
                    className="flex items-center gap-2 font-medium"
                  >
                    {form.showAdvanced ? <ChevronDown className="h-4 w-4" /> : <ChevronDown className="h-4 w-4 rotate-180" />}
                    {form.showAdvanced ? 'Hide' : 'Show'} Advanced
                  </Button>
                </div>
              </CardHeader>
              {form.showAdvanced && (
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Pause After Missed Payments</label>
                      <Input
                        type="number"
                        min="1"
                        value={form.pause_after_missed_payments}
                        onChange={(e) => setForm({ ...form, pause_after_missed_payments: parseInt(e.target.value) || 3 })}
                        className="h-12 text-base focus:border-[#7f5efd] focus:ring-[#7f5efd]/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Auto Resume on Payment</label>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={form.auto_resume_on_payment}
                          onCheckedChange={(checked) => setForm({ ...form, auto_resume_on_payment: checked as boolean })}
                          className="text-[#7f5efd]"
                        />
                        <span className="text-sm text-gray-600">Automatically resume when payment is received</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Invoice Due Days</label>
                      <Input
                        type="number"
                        min="0"
                        value={form.invoice_due_days}
                        onChange={(e) => setForm({ ...form, invoice_due_days: parseInt(e.target.value) || 0 })}
                        className="h-12 text-base focus:border-[#7f5efd] focus:ring-[#7f5efd]/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Generate Days in Advance</label>
                      <Input
                        type="number"
                        min="0"
                        value={form.generate_days_in_advance}
                        onChange={(e) => setForm({ ...form, generate_days_in_advance: parseInt(e.target.value) || 0 })}
                        className="h-12 text-base focus:border-[#7f5efd] focus:ring-[#7f5efd]/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Past Due After Days</label>
                      <Input
                        type="number"
                        min="1"
                        value={form.past_due_after_days}
                        onChange={(e) => setForm({ ...form, past_due_after_days: parseInt(e.target.value) || 2 })}
                        className="h-12 text-base focus:border-[#7f5efd] focus:ring-[#7f5efd]/20"
                      />
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Tax Configuration */}
            <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
                    <Receipt className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">Tax Configuration</CardTitle>
                    <CardDescription className="text-base text-gray-600 mt-1">
                      Configure tax settings for this subscription
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={form.tax_enabled}
                    onCheckedChange={(checked) => setForm({ ...form, tax_enabled: checked as boolean })}
                    className="text-[#7f5efd]"
                  />
                  <span className="text-sm font-semibold text-gray-700">Enable tax collection</span>
                </div>

                {form.tax_enabled && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Tax Rate Label</label>
                        <Input
                          placeholder="e.g., Sales Tax, VAT"
                          value={form.tax_rates[0]?.label || ''}
                          onChange={(e) => {
                            const newRates = [...form.tax_rates];
                            if (newRates[0]) {
                              newRates[0].label = e.target.value;
                            } else {
                              newRates.push({ id: '1', label: e.target.value, percentage: '0' });
                            }
                            setForm({ ...form, tax_rates: newRates });
                          }}
                          className="h-12 text-base focus:border-[#7f5efd] focus:ring-[#7f5efd]/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Tax Rate Percentage</label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={form.tax_rates[0]?.percentage || ''}
                          onChange={(e) => {
                            const newRates = [...form.tax_rates];
                            if (newRates[0]) {
                              newRates[0].percentage = e.target.value;
                            } else {
                              newRates.push({ id: '1', label: 'Tax', percentage: e.target.value });
                            }
                            setForm({ ...form, tax_rates: newRates });
                          }}
                          className="h-12 text-base focus:border-[#7f5efd] focus:ring-[#7f5efd]/20"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end pt-6">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="px-8 h-12 text-base font-medium bg-[#7f5efd] hover:bg-[#6b4fd8] text-white flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Creating Subscription...
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5" />
                    Create Subscription
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}

