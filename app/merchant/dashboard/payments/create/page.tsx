"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  DollarSign,
  Calendar,
  Link as LinkIcon,
  Settings,
  CreditCard,
  Clock,
  Users,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Loader2
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

interface CreatePaymentLinkForm {
  title: string;
  description: string;
  amount: string;
  currency: string;
  accepted_cryptos: string[];
  expires_at: string;
  max_uses: string;
  redirect_url: string;
  auto_convert_enabled: boolean;
  charge_customer_fee: boolean;
  tax_enabled: boolean;
  tax_percentage: string;
  tax_label: string;
}

interface MerchantSettings {
  wallets: Record<string, string>;
  auto_convert_enabled: boolean;
  charge_customer_fee: boolean;
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
    accepted_cryptos: [],
    expires_at: '',
    max_uses: '',
    redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/success/{{PAYMENT_ID}}`,
    auto_convert_enabled: false,
    charge_customer_fee: false,
    tax_enabled: false,
    tax_percentage: '8.5',
    tax_label: 'Sales Tax'
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
        .select('wallets, auto_convert_enabled, charge_customer_fee, payment_config')
        .eq('user_id', session.user.id)
        .single();

      if (merchantError) {
        console.error('Error loading merchant settings:', merchantError);
        toast.error('Failed to load merchant settings');
        return;
      }

      setMerchantSettings(merchant);
      setAvailableCryptos(Object.keys(merchant.wallets || {}));
      
      // Set default form values from merchant settings
      setForm(prev => ({
        ...prev,
        auto_convert_enabled: merchant.auto_convert_enabled || false,
        charge_customer_fee: merchant.charge_customer_fee || false,
        accepted_cryptos: Object.keys(merchant.wallets || {}).slice(0, 3) // Default to first 3 cryptos
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

  const calculateFees = () => {
    const baseAmount = parseFloat(form.amount) || 0;
    const taxPercentage = form.tax_enabled ? (parseFloat(form.tax_percentage) || 0) : 0;
    const taxAmount = (baseAmount * taxPercentage) / 100;
    const subtotalWithTax = baseAmount + taxAmount;
    
    const feePercentage = form.auto_convert_enabled ? 1.0 : 0.5;
    const feeAmount = (subtotalWithTax * feePercentage) / 100;
    const totalAmount = form.charge_customer_fee ? subtotalWithTax + feeAmount : subtotalWithTax;
    const merchantReceives = form.charge_customer_fee ? subtotalWithTax : subtotalWithTax - feeAmount;
    
    return {
      baseAmount,
      taxPercentage,
      taxAmount,
      subtotalWithTax,
      feePercentage,
      feeAmount,
      totalAmount,
      merchantReceives
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
        redirect_url: form.redirect_url.trim() || null,
        auto_convert_enabled: form.auto_convert_enabled,
        charge_customer_fee: form.charge_customer_fee,
        tax_enabled: form.tax_enabled,
        tax_percentage: form.tax_enabled ? parseFloat(form.tax_percentage) : 0,
        tax_label: form.tax_enabled ? form.tax_label.trim() : null,
        metadata: {
          base_amount: fees.baseAmount,
          tax_percentage: fees.taxPercentage,
          tax_amount: fees.taxAmount,
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
        router.push(`/merchant/dashboard/payments/${result.data.id}`);
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
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="tax_enabled"
                        checked={form.tax_enabled}
                        onCheckedChange={(checked) => setForm(prev => ({ ...prev, tax_enabled: checked === true }))}
                      />
                      <Label htmlFor="tax_enabled" className="text-sm font-medium">
                        Add tax to payment
                      </Label>
                    </div>
                    
                    {form.tax_enabled && (
                      <div className="grid grid-cols-2 gap-4 ml-6">
                        <div className="space-y-2">
                          <Label htmlFor="tax_percentage">Tax Rate (%)</Label>
                          <Input
                            id="tax_percentage"
                            type="number"
                            step="0.1"
                            min="0"
                            max="50"
                            placeholder="8.5"
                            value={form.tax_percentage}
                            onChange={(e) => setForm(prev => ({ ...prev, tax_percentage: e.target.value }))}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="tax_label">Tax Label</Label>
                          <Input
                            id="tax_label"
                            placeholder="Sales Tax"
                            value={form.tax_label}
                            onChange={(e) => setForm(prev => ({ ...prev, tax_label: e.target.value }))}
                          />
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

                  <div className="space-y-2">
                    <Label htmlFor="redirect_url">Redirect URL</Label>
                    <Input
                      id="redirect_url"
                      type="url"
                      placeholder="https://yoursite.com/thank-you"
                      value={form.redirect_url}
                      onChange={(e) => setForm(prev => ({ ...prev, redirect_url: e.target.value }))}
                    />
                  </div>

                  {/* Payment Options */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="auto_convert_enabled"
                        checked={form.auto_convert_enabled}
                        onCheckedChange={(checked) => setForm(prev => ({ ...prev, auto_convert_enabled: checked === true }))}
                      />
                      <Label htmlFor="auto_convert_enabled" className="text-sm font-medium">
                        Enable auto-convert to fiat
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="charge_customer_fee"
                        checked={form.charge_customer_fee}
                        onCheckedChange={(checked) => setForm(prev => ({ ...prev, charge_customer_fee: checked === true }))}
                      />
                      <Label htmlFor="charge_customer_fee" className="text-sm font-medium">
                        Charge gateway fee to customer
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preview & Summary */}
            <div className="space-y-6">
              {/* Fee Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Fee Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Base Amount:</span>
                    <span>{form.currency} {fees.baseAmount.toFixed(2)}</span>
                  </div>
                  
                  {form.tax_enabled && fees.taxAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>{form.tax_label} ({fees.taxPercentage}%):</span>
                      <span>{form.currency} {fees.taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {form.tax_enabled && (
                    <div className="flex justify-between text-sm font-medium border-t pt-2">
                      <span>Subtotal with Tax:</span>
                      <span>{form.currency} {fees.subtotalWithTax.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm">
                    <span>Gateway Fee ({fees.feePercentage}%):</span>
                    <span>{form.currency} {fees.feeAmount.toFixed(2)}</span>
                  </div>
                  
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-medium">
                      <span>Customer Pays:</span>
                      <span>{form.currency} {fees.totalAmount.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>You Receive:</span>
                      <span>{form.currency} {fees.merchantReceives.toFixed(2)}</span>
                    </div>
                  </div>

                  {form.auto_convert_enabled && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Auto-convert enabled: 1% gateway fee applies
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Quick Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-medium">{form.title || 'Payment Link Title'}</p>
                    <p className="text-sm text-gray-600">{form.description || 'Payment description'}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {form.currency} {fees.totalAmount.toFixed(2)}
                    </Badge>
                    {form.accepted_cryptos.length > 0 && (
                      <Badge variant="secondary">
                        {form.accepted_cryptos.length} crypto{form.accepted_cryptos.length !== 1 ? 's' : ''}
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

