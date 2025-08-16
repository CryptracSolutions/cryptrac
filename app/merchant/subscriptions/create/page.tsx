import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { makeAuthenticatedRequest, supabase } from '@/lib/supabase-browser';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { ChevronDown, Info, ArrowLeft, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [merchantSettings, setMerchantSettings] = useState<MerchantSettings | null>(null);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleCryptoChange = (crypto: string, checked: boolean) => {
    setForm(prev => ({
      ...prev,
      accepted_cryptos: checked 
        ? [...prev.accepted_cryptos, crypto]
        : prev.accepted_cryptos.filter(c => c !== crypto)
    }));
  };

  const formatInterval = () => {
    const count = form.interval_count;
    const interval = form.interval;
    if (count === 1) {
      return interval === 'day' ? 'day' : interval === 'week' ? 'week' : interval === 'month' ? 'month' : 'year';
    }
    return `${count} ${interval}s`;
  };

  const calculateFeePercentage = () => {
    const chargeCustomerFee = form.charge_customer_fee ?? merchantSettings?.charge_customer_fee ?? false;
    const autoConvertEnabled = form.auto_convert_enabled ?? merchantSettings?.auto_convert_enabled ?? false;
    
    if (!chargeCustomerFee) return 0;
    
    // Base fee: 0.5%
    let fee = 0.5;
    
    // Auto-convert adds additional 0.5% (only for crypto-to-crypto)
    if (autoConvertEnabled) {
      fee += 0.5;
    }
    
    return fee;
  };

  const calculatePreviewTotal = () => {
    const amount = parseFloat(form.amount) || 0;
    const feePercentage = calculateFeePercentage();
    const feeAmount = amount * (feePercentage / 100);
    
    // Calculate tax
    let taxAmount = 0;
    if (form.tax_enabled && form.tax_rates.length > 0) {
      const totalTaxPercentage = form.tax_rates.reduce((sum, rate) => sum + parseFloat(rate.percentage || '0'), 0);
      taxAmount = amount * (totalTaxPercentage / 100);
    }
    
    return {
      subtotal: amount,
      fee: feeAmount,
      tax: taxAmount,
      total: amount + feeAmount + taxAmount
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        // Fix: Redirect to subscription detail page instead of list
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

  const preview = calculatePreviewTotal();

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.push('/merchant/subscriptions')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Subscriptions
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Subscription</h1>
          <p className="text-gray-600 mt-1">Set up a recurring payment subscription</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Core details about your subscription
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Subscription Title *</label>
                  <Input 
                    name="title" 
                    placeholder="Monthly Premium Plan" 
                    value={form.title} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Input 
                    name="description" 
                    placeholder="Access to premium features and support" 
                    value={form.description} 
                    onChange={handleChange} 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Amount *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <Input 
                        name="amount" 
                        type="number" 
                        step="0.01" 
                        placeholder="29.99" 
                        value={form.amount} 
                        onChange={handleChange} 
                        className="pl-8"
                        required 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Currency</label>
                    <select 
                      name="currency" 
                      value={form.currency} 
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      {FIAT_CURRENCIES.map(curr => (
                        <option key={curr.code} value={curr.code}>
                          {curr.code} - {curr.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Billing Frequency *</label>
                  <div className="flex gap-2">
                    <Input 
                      name="interval_count" 
                      type="number" 
                      min="1" 
                      value={form.interval_count} 
                      onChange={handleChange} 
                      className="w-20"
                    />
                    <select 
                      name="interval" 
                      value={form.interval} 
                      onChange={handleChange} 
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="day">Day(s)</option>
                      <option value="week">Week(s)</option>
                      <option value="month">Month(s)</option>
                      <option value="year">Year(s)</option>
                    </select>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Bills every {formatInterval()}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Max Cycles (Optional)</label>
                  <Input 
                    name="max_cycles" 
                    type="number" 
                    min="1"
                    placeholder="Leave empty for unlimited" 
                    value={form.max_cycles} 
                    onChange={handleChange} 
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Subscription will automatically complete after this many billing cycles
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">First Billing Date *</label>
                  <Input 
                    name="anchor" 
                    type="datetime-local" 
                    value={form.anchor} 
                    onChange={handleChange} 
                    required 
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    When the first payment should be charged
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
                <CardDescription>
                  Details about the customer for this subscription
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Customer Email</label>
                  <Input 
                    name="customer_email" 
                    type="email"
                    placeholder="customer@example.com" 
                    value={form.customer_email} 
                    onChange={handleChange} 
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Required for email notifications (invoices, receipts, etc.)
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Customer Name</label>
                    <Input 
                      name="customer_name" 
                      placeholder="John Doe" 
                      value={form.customer_name} 
                      onChange={handleChange} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone Number</label>
                    <Input 
                      name="customer_phone" 
                      placeholder="+1 (555) 123-4567" 
                      value={form.customer_phone} 
                      onChange={handleChange} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Settings</CardTitle>
                <CardDescription>
                  Configure payment processing and cryptocurrency options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Accepted Cryptocurrencies</label>
                  {availableCryptos.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {availableCryptos.map(crypto => (
                        <label key={crypto} className="flex items-center space-x-2">
                          <Checkbox
                            checked={form.accepted_cryptos.includes(crypto)}
                            onCheckedChange={(checked) => handleCryptoChange(crypto, checked as boolean)}
                          />
                          <span className="text-sm">{crypto}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        No cryptocurrency wallets configured. Please set up wallet addresses in your merchant settings.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="charge_customer_fee"
                      checked={form.charge_customer_fee ?? merchantSettings?.charge_customer_fee ?? false}
                      onCheckedChange={(checked) => setForm(prev => ({ ...prev, charge_customer_fee: checked as boolean }))}
                    />
                    <label htmlFor="charge_customer_fee" className="text-sm font-medium">
                      Charge customer gateway fee ({calculateFeePercentage()}%)
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 ml-6">
                    When enabled, the gateway fee is added to the customer's total. When disabled, you absorb the fee.
                  </p>
                </div>

                {merchantSettings?.preferred_payout_currency && merchantSettings.preferred_payout_currency !== 'USD' && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="auto_convert_enabled"
                        checked={form.auto_convert_enabled ?? merchantSettings?.auto_convert_enabled ?? false}
                        onCheckedChange={(checked) => setForm(prev => ({ ...prev, auto_convert_enabled: checked as boolean }))}
                      />
                      <label htmlFor="auto_convert_enabled" className="text-sm font-medium">
                        Auto-convert to {merchantSettings.preferred_payout_currency}
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 ml-6">
                      Automatically convert received cryptocurrency to {merchantSettings.preferred_payout_currency}. Adds 0.5% fee.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tax Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Tax Configuration</CardTitle>
                <CardDescription>
                  Configure tax collection for this subscription
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tax_enabled"
                    checked={form.tax_enabled}
                    onCheckedChange={(checked) => setForm(prev => ({ ...prev, tax_enabled: checked as boolean }))}
                  />
                  <label htmlFor="tax_enabled" className="text-sm font-medium">
                    Enable tax collection
                  </label>
                </div>

                {form.tax_enabled && (
                  <div className="space-y-3 ml-6">
                    {form.tax_rates.map((rate, index) => (
                      <div key={rate.id} className="flex gap-2 items-center">
                        <Input
                          placeholder="Tax label (e.g., Sales Tax)"
                          value={rate.label}
                          onChange={(e) => {
                            const newRates = [...form.tax_rates];
                            newRates[index].label = e.target.value;
                            setForm(prev => ({ ...prev, tax_rates: newRates }));
                          }}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="8.25"
                          value={rate.percentage}
                          onChange={(e) => {
                            const newRates = [...form.tax_rates];
                            newRates[index].percentage = e.target.value;
                            setForm(prev => ({ ...prev, tax_rates: newRates }));
                          }}
                          className="w-24"
                        />
                        <span className="text-sm text-gray-500">%</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newRates = form.tax_rates.filter((_, i) => i !== index);
                            setForm(prev => ({ ...prev, tax_rates: newRates }));
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newRate = { id: Date.now().toString(), label: '', percentage: '' };
                        setForm(prev => ({ ...prev, tax_rates: [...prev.tax_rates, newRate] }));
                      }}
                    >
                      Add Tax Rate
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Advanced Timing Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between w-full">
                  <div>
                    <CardTitle>Advanced Timing Settings</CardTitle>
                    <CardDescription>
                      Configure invoice generation and dunning behavior
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setForm(prev => ({ ...prev, showAdvanced: !prev.showAdvanced }))}
                    className="flex items-center gap-2"
                  >
                    <ChevronDown className={`h-4 w-4 transition-transform ${form.showAdvanced ? 'rotate-180' : ''}`} />
                    {form.showAdvanced ? 'Hide' : 'Show'}
                  </Button>
                </div>
              </CardHeader>
              {form.showAdvanced && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Invoice Due Days</label>
                      <Input 
                        name="invoice_due_days" 
                        type="number" 
                        min="0"
                        value={form.invoice_due_days} 
                        onChange={handleChange} 
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Days after cycle start when invoice is due (0 = due immediately)
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Generate Days in Advance</label>
                      <Input 
                        name="generate_days_in_advance" 
                        type="number" 
                        min="0"
                        value={form.generate_days_in_advance} 
                        onChange={handleChange} 
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Generate invoices this many days before due date
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Past Due After Days</label>
                      <Input 
                        name="past_due_after_days" 
                        type="number" 
                        min="1"
                        value={form.past_due_after_days} 
                        onChange={handleChange} 
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Mark invoices past due after this many days
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Pause After Missed Payments</label>
                      <Input 
                        name="pause_after_missed_payments" 
                        type="number" 
                        min="0"
                        value={form.pause_after_missed_payments} 
                        onChange={handleChange} 
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Pause subscription after this many missed payments (0 = never pause)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="auto_resume_on_payment"
                      checked={form.auto_resume_on_payment}
                      onCheckedChange={(checked: boolean) => setForm(prev => ({ ...prev, auto_resume_on_payment: checked }))}
                    />
                    <label htmlFor="auto_resume_on_payment" className="text-sm font-medium">
                      Auto-resume subscription on payment
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 ml-6">
                    Automatically reactivate paused subscriptions when payment is received
                  </p>
                </CardContent>
              )}
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={isSubmitting || !form.title || !form.amount || !form.anchor || form.accepted_cryptos.length === 0}
                className="px-8"
              >
                {isSubmitting ? 'Creating...' : 'Create Subscription'}
              </Button>
            </div>
          </form>
        </div>

        {/* Preview Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Subscription Preview</CardTitle>
              <CardDescription>
                How this subscription will appear
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{form.title || 'Subscription Title'}</h3>
                {form.description && (
                  <p className="text-gray-600 text-sm mt-1">{form.description}</p>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="font-medium">${preview.subtotal.toFixed(2)}</span>
                </div>
                
                {preview.fee > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Gateway Fee ({calculateFeePercentage()}%):</span>
                    <span>+${preview.fee.toFixed(2)}</span>
                  </div>
                )}
                
                {preview.tax > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tax:</span>
                    <span>+${preview.tax.toFixed(2)}</span>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between font-semibold">
                  <span>Total per {formatInterval()}:</span>
                  <span>${preview.total.toFixed(2)}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Frequency:</span>
                  <span>Every {formatInterval()}</span>
                </div>
                
                {form.max_cycles && (
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span>{form.max_cycles} cycles</span>
                  </div>
                )}
                
                {form.accepted_cryptos.length > 0 && (
                  <div>
                    <span className="block mb-1">Accepted Cryptos:</span>
                    <div className="flex flex-wrap gap-1">
                      {form.accepted_cryptos.map(crypto => (
                        <Badge key={crypto} variant="outline" className="text-xs">
                          {crypto}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {form.anchor && (
                <>
                  <Separator />
                  <div className="text-sm">
                    <span className="block mb-1">First billing:</span>
                    <span className="text-gray-600">
                      {new Date(form.anchor).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

