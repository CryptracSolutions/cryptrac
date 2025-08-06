"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  DollarSign,
  Calendar,
  Link,
  LinkIcon,
  Settings, 
  Wallet, 
  CreditCard, 
  Users, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Plus,
  Trash2,
  Loader2,
  Info
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Badge } from '@/app/components/ui/badge';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { supabase } from '@/lib/supabase-browser';
import { toast } from 'sonner';
import { DashboardLayout } from '@/app/components/layout/dashboard-layout';

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

const FIAT_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
];

export default function CreatePaymentLinkPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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
  }, []);

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
        .select('wallets, auto_convert_enabled, charge_customer_fee, payment_config, tax_enabled, tax_rates, tax_strategy')
        .eq('user_id', session.user.id)
        .single();

      if (merchantError) {
        console.error('Error loading merchant settings:', merchantError);
        toast.error('Failed to load merchant settings');
        return;
      }

      setMerchantSettings(merchant);
      const cryptos = Object.keys(merchant.wallets || {});
      setAvailableCryptos(cryptos);
      
      // Set default form values - all cryptocurrencies selected by default
      setForm(prev => ({
        ...prev,
        accepted_cryptos: cryptos, // Select all available cryptos by default
        auto_convert_enabled: null, // null = inherit from merchant settings
        charge_customer_fee: null // null = inherit from merchant settings
      }));

    } catch (error) {
      console.error('Error loading merchant settings:', error);
      toast.error('Failed to load merchant settings');
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Payment Link</h1>
            <p className="text-gray-600">Create a new cryptocurrency payment link for your customers</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LinkIcon className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Product Purchase, Service Payment"
                      value={form.title}
                      onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Optional description for your customers"
                      value={form.description}
                      onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Payment Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Payment Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount *</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={form.amount}
                        onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select value={form.currency} onValueChange={(value) => setForm(prev => ({ ...prev, currency: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIAT_CURRENCIES.map(currency => (
                            <SelectItem key={currency.code} value={currency.code}>
                              {currency.symbol} {currency.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Accepted Cryptocurrencies */}
                  <div className="space-y-3">
                    <Label>Accepted Cryptocurrencies *</Label>
                    <p className="text-sm text-gray-600">All cryptocurrencies are selected by default. Uncheck the ones you don't want to accept.</p>
                    
                    {/* Stable Coin Information */}
                    <Alert className="bg-blue-50 border-blue-200">
                      <Info className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800">
                        <strong>Bonus:</strong> Selecting base cryptocurrencies automatically includes their stable coins for customers:
                        <div className="mt-2 text-sm">
                          • <strong>SOL</strong> → includes USDC & USDT on Solana
                          • <strong>ETH</strong> → includes USDT, USDC, DAI & PYUSD on Ethereum
                          • <strong>BNB</strong> → includes USDT & USDC on BSC
                          • <strong>MATIC</strong> → includes USDT & USDC on Polygon
                          • <strong>TRX</strong> → includes USDT on Tron
                          • <strong>TON</strong> → includes USDT on TON
                        </div>
                      </AlertDescription>
                    </Alert>

                    {availableCryptos.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {availableCryptos.map(crypto => (
                          <div key={crypto} className="flex items-center space-x-2">
                            <Checkbox
                              id={crypto}
                              checked={form.accepted_cryptos.includes(crypto)}
                              onCheckedChange={(checked) => handleCryptoToggle(crypto, checked === true)}
                            />
                            <Label htmlFor={crypto} className="text-sm font-medium">
                              {crypto}
                            </Label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          No cryptocurrency wallets configured. Please add wallet addresses in your settings first.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {/* Tax Configuration */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="tax_enabled"
                        checked={form.tax_enabled}
                        onCheckedChange={(checked) => handleTaxEnabledToggle(checked === true)}
                      />
                      <Label htmlFor="tax_enabled" className="text-sm font-medium">
                        Add tax to payment
                      </Label>
                    </div>
                    
                    {/* Show global tax settings info */}
                    {merchantSettings && (
                      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
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
                      <div className="ml-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Tax Rates</Label>
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
                        
                        <div className="space-y-3">
                          {form.tax_rates.map((taxRate, index) => (
                            <div key={taxRate.id} className="flex items-center gap-3 p-3 border rounded-lg">
                              <div className="flex-1">
                                <Input
                                  placeholder="Tax Label (e.g., State Tax, Local Tax)"
                                  value={taxRate.label}
                                  onChange={(e) => updateTaxRate(taxRate.id, 'label', e.target.value)}
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
                                />
                              </div>
                              
                              <span className="text-sm text-gray-500">%</span>
                              
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
                        
                        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
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

              {/* Advanced Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Advanced Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expires_at">Expiration Date</Label>
                      <Input
                        id="expires_at"
                        type="datetime-local"
                        value={form.expires_at}
                        onChange={(e) => setForm(prev => ({ ...prev, expires_at: e.target.value }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="max_uses">Maximum Uses</Label>
                      <Input
                        id="max_uses"
                        type="number"
                        min="1"
                        placeholder="Unlimited"
                        value={form.max_uses}
                        onChange={(e) => setForm(prev => ({ ...prev, max_uses: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Payment Options with Global Settings Display */}
                  <div className="space-y-4">
                    <div className="text-sm font-medium text-gray-700">Payment Options</div>
                    
                    {/* Auto-convert setting */}
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-gray-900">Auto-Convert Setting</div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="auto_convert_global"
                            name="auto_convert_setting"
                            checked={form.auto_convert_enabled === null}
                            onChange={() => setForm(prev => ({ ...prev, auto_convert_enabled: null }))}
                            className="h-4 w-4 text-blue-600"
                          />
                          <Label htmlFor="auto_convert_global" className="text-sm">
                            Use global setting ({merchantSettings?.auto_convert_enabled ? 'Enabled' : 'Disabled'})
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="auto_convert_enable"
                            name="auto_convert_setting"
                            checked={form.auto_convert_enabled === true}
                            onChange={() => setForm(prev => ({ ...prev, auto_convert_enabled: true }))}
                            className="h-4 w-4 text-blue-600"
                          />
                          <Label htmlFor="auto_convert_enable" className="text-sm">
                            Enable auto-convert for this payment link
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="auto_convert_disable"
                            name="auto_convert_setting"
                            checked={form.auto_convert_enabled === false}
                            onChange={() => setForm(prev => ({ ...prev, auto_convert_enabled: false }))}
                            className="h-4 w-4 text-blue-600"
                          />
                          <Label htmlFor="auto_convert_disable" className="text-sm">
                            Disable auto-convert for this payment link
                          </Label>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                        <Info className="h-3 w-3 inline mr-1" />
                        Current selection: {
                          form.auto_convert_enabled === null 
                            ? `Global setting (${merchantSettings?.auto_convert_enabled ? 'Enabled' : 'Disabled'})`
                            : form.auto_convert_enabled ? 'Enabled' : 'Disabled'
                        }
                      </div>
                    </div>
                    
                    {/* Gateway fee setting */}
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-gray-900">Gateway Fee Setting</div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="fee_global"
                            name="fee_setting"
                            checked={form.charge_customer_fee === null}
                            onChange={() => setForm(prev => ({ ...prev, charge_customer_fee: null }))}
                            className="h-4 w-4 text-blue-600"
                          />
                          <Label htmlFor="fee_global" className="text-sm">
                            Use global setting ({merchantSettings?.charge_customer_fee ? 'Customer pays fee' : 'Merchant pays fee'})
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="customer_pays_fee"
                            name="fee_setting"
                            checked={form.charge_customer_fee === true}
                            onChange={() => setForm(prev => ({ ...prev, charge_customer_fee: true }))}
                            className="h-4 w-4 text-blue-600"
                          />
                          <Label htmlFor="customer_pays_fee" className="text-sm">
                            Customer pays gateway fee for this payment link
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="merchant_pays_fee"
                            name="fee_setting"
                            checked={form.charge_customer_fee === false}
                            onChange={() => setForm(prev => ({ ...prev, charge_customer_fee: false }))}
                            className="h-4 w-4 text-blue-600"
                          />
                          <Label htmlFor="merchant_pays_fee" className="text-sm">
                            Merchant pays gateway fee for this payment link
                          </Label>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                        <Info className="h-3 w-3 inline mr-1" />
                        Current selection: {
                          form.charge_customer_fee === null 
                            ? `Global setting (${merchantSettings?.charge_customer_fee ? 'Customer pays fee' : 'Merchant pays fee'})`
                            : form.charge_customer_fee ? 'Customer pays fee' : 'Merchant pays fee'
                        }
                      </div>
                    </div>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      After successful payment, customers will be automatically redirected to Cryptrac's branded thank you page with options to receive their receipt.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>

            {/* Combined Preview & Fee Summary */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Link Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Preview Section */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border-2 border-dashed border-blue-200">
                    <div className="space-y-3">
                      <div>
                        <p className="font-semibold text-lg text-gray-900">{form.title || 'Payment Link Title'}</p>
                        <p className="text-sm text-gray-600">{form.description || 'Payment description will appear here'}</p>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="default" className="text-lg px-3 py-1">
                          {form.currency} {fees.totalAmount.toFixed(2)}
                        </Badge>
                        {form.accepted_cryptos.length > 0 && (
                          <Badge variant="secondary">
                            {form.accepted_cryptos.length} crypto{form.accepted_cryptos.length !== 1 ? 's' : ''} accepted
                          </Badge>
                        )}
                        {form.tax_enabled && fees.totalTaxAmount > 0 && (
                          <Badge variant="outline" className="text-green-700 border-green-300">
                            Tax included
                          </Badge>
                        )}
                      </div>

                      {(form.expires_at || form.max_uses) && (
                        <div className="text-xs text-gray-500 space-y-1">
                          {form.expires_at && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Expires: {new Date(form.expires_at).toLocaleDateString()}
                            </div>
                          )}
                          {form.max_uses && (
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              Max uses: {form.max_uses}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Fee Breakdown */}
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-gray-700 border-b pb-2">Payment Breakdown</div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Base Amount:</span>
                        <span className="font-medium">{form.currency} {fees.baseAmount.toFixed(2)}</span>
                      </div>
                      
                      {form.tax_enabled && fees.totalTaxAmount > 0 && (
                        <>
                          {form.tax_rates.map((taxRate) => {
                            const percentage = parseFloat(taxRate.percentage) || 0;
                            const amount = (fees.baseAmount * percentage) / 100;
                            return amount > 0 && taxRate.label ? (
                              <div key={taxRate.id} className="flex justify-between text-green-700">
                                <span>{taxRate.label} ({percentage}%):</span>
                                <span>+{form.currency} {amount.toFixed(2)}</span>
                              </div>
                            ) : null;
                          })}
                          
                          <div className="flex justify-between font-medium text-green-700 border-t pt-2">
                            <span>Total Tax ({fees.totalTaxPercentage.toFixed(3)}%):</span>
                            <span>+{form.currency} {fees.totalTaxAmount.toFixed(2)}</span>
                          </div>
                        </>
                      )}
                      
                      {form.tax_enabled && (
                        <div className="flex justify-between font-medium border-t pt-2">
                          <span>Subtotal with Tax:</span>
                          <span>{form.currency} {fees.subtotalWithTax.toFixed(2)}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between text-blue-700">
                        <span>Gateway Fee ({fees.feePercentage}%):</span>
                        <span>{fees.effectiveSettings.charge_customer_fee ? '+' : ''}{form.currency} {fees.feeAmount.toFixed(2)}</span>
                      </div>
                      
                      <div className="border-t pt-2 space-y-1">
                        <div className="flex justify-between font-bold text-lg">
                          <span>Customer Pays:</span>
                          <span className="text-blue-600">{form.currency} {fees.totalAmount.toFixed(2)}</span>
                        </div>
                        
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>You Receive:</span>
                          <span className="font-medium text-green-600">{form.currency} {fees.merchantReceives.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {fees.effectiveSettings.auto_convert_enabled && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          Auto-convert enabled: 1% gateway fee applies (crypto will be converted to your preferred currency)
                        </AlertDescription>
                      </Alert>
                    )}

                    {!fees.effectiveSettings.charge_customer_fee && (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          Gateway fee will be deducted from your payout
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || availableCryptos.length === 0}
              className="min-w-[150px]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Create Payment Link
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

