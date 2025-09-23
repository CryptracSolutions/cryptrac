"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { makeAuthenticatedRequest, supabase } from '@/lib/supabase-browser';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  CreditCard,
  DollarSign,
  Settings,
  Users,
  Receipt,
  Coins,
  Zap,
  Info,
  Check
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Breadcrumbs } from '@/app/components/ui/breadcrumbs';
import { useIsMobile } from '@/lib/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Progress } from '@/app/components/ui/progress';

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

interface MerchantRecord {
  wallets: Record<string, string> | null;
  auto_convert_enabled: boolean | null;
  charge_customer_fee: boolean | null;
  preferred_payout_currency: string | null;
  tax_enabled: boolean | null;
  tax_rates: TaxRate[] | null;
  tax_strategy: string | null;
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

export default function CreateSubscriptionPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [, setUser] = useState<Record<string, unknown> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [merchantSettings, setMerchantSettings] = useState<MerchantSettings | null>(null);
  const [availableCryptos, setAvailableCryptos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Mobile wizard steps configuration
  const wizardSteps = [
    { id: 1, title: 'Basic Info', icon: CreditCard },
    { id: 2, title: 'Pricing', icon: DollarSign },
    { id: 3, title: 'Customer', icon: Users },
    { id: 4, title: 'Payment', icon: Coins },
    { id: 5, title: 'Advanced', icon: Settings },
    { id: 6, title: 'Review', icon: Check },
  ];

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

  const loadMerchantSettings = useCallback(async () => {
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
        .select('wallets, auto_convert_enabled, charge_customer_fee, preferred_payout_currency, tax_enabled, tax_rates, tax_strategy, onboarding_data')
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
        preferred_payout_currency: merchant.preferred_payout_currency || 'USD',
        tax_enabled: resolvedTaxEnabled,
        tax_rates: resolvedTaxRates,
        tax_strategy: resolvedTaxStrategy
      } as MerchantSettings;
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
        tax_enabled: updatedMerchant.tax_enabled || false,
        tax_rates: updatedMerchant.tax_rates || []
      }));

    } catch (error) {
      console.error('Error loading merchant settings:', error);
      toast.error('Failed to load merchant settings');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadMerchantSettings();
  }, [loadMerchantSettings]);







  // Validation for each step
  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    switch (step) {
      case 1: // Basic Info
        if (!form.title) errors.title = 'Title is required';
        break;
      case 2: // Pricing
        if (!form.amount || parseFloat(form.amount) <= 0) {
          errors.amount = 'Amount must be greater than zero';
        }
        break;
      case 3: // Customer
        if (!form.customer_email) errors.customer_email = 'Email is required';
        break;
      case 4: // Payment
        if (form.accepted_cryptos.length === 0) {
          errors.accepted_cryptos = 'Select at least one cryptocurrency';
        }
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCompletedSteps(prev => (prev.includes(currentStep) ? prev : [...prev, currentStep]));
      if (currentStep < 6) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (step: number) => {
    // Only allow navigation to completed steps or the next step
    if (completedSteps.includes(step - 1) || step === 1 || step <= currentStep) {
      setCurrentStep(step);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#7f5efd]"></div>
      </div>
    );
  }



  // Mobile Step Content Components
  const MobileStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Subscription Title *</label>
              <Input
                placeholder="e.g., Premium Plan"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={cn(
                  "h-12",
                  validationErrors.title && "border-red-500"
                )}
                required
              />
              {validationErrors.title && (
                <p className="text-xs text-red-500">{validationErrors.title}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                placeholder="Brief description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="h-12"
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount *</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className={cn(
                  "h-12",
                  validationErrors.amount && "border-red-500"
                )}
                required
              />
              {validationErrors.amount && (
                <p className="text-xs text-red-500">{validationErrors.amount}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Currency *</label>
              <Select
                value={form.currency}
                onValueChange={(value) => setForm({ ...form, currency: value })}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {FIAT_CURRENCIES.map(currency => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Billing Interval *</label>
              <div className="flex gap-2">
                <Select
                  value={form.interval}
                  onValueChange={(value) => setForm({ ...form, interval: value })}
                >
                  <SelectTrigger className="flex-1 h-12">
                    <SelectValue placeholder="Interval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="year">Year</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min="1"
                  value={form.interval_count}
                  onChange={(e) => setForm({ ...form, interval_count: parseInt(e.target.value) || 1 })}
                  className="w-20 h-12 text-center"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Cycles</label>
              <Input
                type="number"
                min="1"
                placeholder="Unlimited"
                value={form.max_cycles}
                onChange={(e) => setForm({ ...form, max_cycles: e.target.value })}
                className="h-12"
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Customer Name</label>
              <Input
                placeholder="Full name"
                value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address *</label>
              <Input
                type="email"
                placeholder="customer@example.com"
                value={form.customer_email}
                onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
                className={cn(
                  "h-12",
                  validationErrors.customer_email && "border-red-500"
                )}
                required
              />
              {validationErrors.customer_email && (
                <p className="text-xs text-red-500">{validationErrors.customer_email}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone Number</label>
              <Input
                placeholder="+1 (555) 123-4567"
                value={form.customer_phone}
                onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                className="h-12"
              />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Accepted Cryptocurrencies *</label>
              {validationErrors.accepted_cryptos && (
                <p className="text-xs text-red-500">{validationErrors.accepted_cryptos}</p>
              )}
              <div className="grid grid-cols-2 gap-2">
                {availableCryptos.map(crypto => (
                  <label key={crypto} className="flex items-center space-x-2 p-3 border rounded-lg">
                    <Checkbox
                      checked={form.accepted_cryptos.includes(crypto)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setForm({ ...form, accepted_cryptos: [...form.accepted_cryptos, crypto] });
                        } else {
                          setForm({ ...form, accepted_cryptos: form.accepted_cryptos.filter(c => c !== crypto) });
                        }
                      }}
                    />
                    <span className="text-sm">{crypto}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Gateway Fee</label>
              <Select
                value={form.charge_customer_fee === null ? 'inherit' : form.charge_customer_fee ? 'customer' : 'merchant'}
                onValueChange={(value) => {
                  setForm({
                    ...form,
                    charge_customer_fee: value === 'inherit' ? null : value === 'customer'
                  });
                }}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select fee option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inherit">Use global setting</SelectItem>
                  <SelectItem value="customer">Customer pays</SelectItem>
                  <SelectItem value="merchant">Merchant pays</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tax Collection</label>
              <div className="flex items-center space-x-2 h-12">
                <Checkbox
                  checked={form.tax_enabled}
                  onCheckedChange={(checked) => setForm({ ...form, tax_enabled: checked as boolean })}
                />
                <span className="text-sm">Enable tax collection</span>
              </div>
            </div>
            {form.tax_enabled && (
              <div className="space-y-2">
                <Input
                  placeholder="Tax label (e.g., VAT)"
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
                  className="h-12"
                />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Tax percentage"
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
                  className="h-12"
                />
              </div>
            )}
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <h3 className="font-semibold text-sm">Review Subscription</h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Title:</span>
                  <span className="font-medium">{form.title || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">
                    ${form.amount || '0'} {form.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Interval:</span>
                  <span className="font-medium">
                    Every {form.interval_count} {form.interval}{form.interval_count > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer:</span>
                  <span className="font-medium">{form.customer_email || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cryptos:</span>
                  <span className="font-medium">{form.accepted_cryptos.length} selected</span>
                </div>
              </div>
            </div>

            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-xs">
                Please review all details before creating the subscription.
                You can go back to edit any section.
              </AlertDescription>
            </Alert>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={cn(
      "px-6 py-8 space-y-8 max-w-7xl mx-auto",
      "max-md:px-4 max-md:py-6 max-md:space-y-6"
    )}>
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { name: 'Dashboard', href: '/merchant/dashboard' },
            { name: 'Subscriptions', href: '/merchant/subscriptions' },
            { name: 'Create Subscription', href: '/merchant/subscriptions/create' }
          ]} 
        />
        
        {/* Enhanced Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-2">
            <h1 className="font-phonic text-3xl font-normal tracking-tight text-gray-900 mb-4">
              Create Subscription
            </h1>
            <p className="font-phonic text-base font-normal text-gray-600">
              Set up recurring payments for your customers
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => router.push('/merchant/subscriptions')}
              className="bg-[#7f5efd] hover:bg-[#7c3aed] text-white flex items-center justify-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Manage Subscriptions
            </Button>
          </div>
        </div>

        {/* Mobile Wizard Interface */}
        {isMobile ? (
          <>
            {/* Progress Bar and Steps */}
            <div className="md:hidden">
              <Progress value={(currentStep / 6) * 100} className="h-2 mb-4" />
              <div className="flex justify-between mb-6">
                {wizardSteps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <button
                      key={step.id}
                      onClick={() => handleStepClick(step.id)}
                      disabled={!completedSteps.includes(step.id - 1) && step.id !== 1 && step.id > currentStep}
                      className={cn(
                        "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
                        currentStep === step.id && "bg-[#7f5efd]/10",
                        completedSteps.includes(step.id) && "text-[#7f5efd]",
                        (!completedSteps.includes(step.id - 1) && step.id !== 1 && step.id > currentStep) && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        currentStep === step.id ? "bg-[#7f5efd] text-white" :
                        completedSteps.includes(step.id) ? "bg-[#7f5efd]/20 text-[#7f5efd]" :
                        "bg-gray-200 text-gray-500"
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-[10px] font-medium">
                        {step.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step Content */}
            <Card className="md:hidden border border-gray-200 shadow-sm max-md:rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  {wizardSteps[currentStep - 1].title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MobileStepContent />
              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="md:hidden flex gap-3 fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg" style={{
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)',
            }}>
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                disabled={currentStep === 1}
                className="flex-1 h-12"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              {currentStep < 6 ? (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="flex-1 h-12 bg-[#7f5efd] hover:bg-[#6b4fd8]"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={() => handleSubmit()}
                  disabled={isSubmitting}
                  className="flex-1 h-12 bg-[#7f5efd] hover:bg-[#6b4fd8]"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Create
                    </>
                  )}
                </Button>
              )}
            </div>
          </>
        ) : loading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#7f5efd]"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8 hidden md:block">
            {/* Basic Information */}
            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="p-6">
                <CardTitle className="font-phonic text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-[#7f5efd]" />
                  Basic Information
                </CardTitle>
                <CardDescription className="font-capsule text-sm text-gray-600">
                  Set up the core details of your subscription
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="font-phonic text-sm font-semibold text-gray-900">Subscription Title *</label>
                    <Input
                      placeholder="e.g., Premium Plan, Monthly Service"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-phonic text-sm font-semibold text-gray-900">Description</label>
                    <Input
                      placeholder="Brief description of the subscription"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing Configuration */}
            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="p-6">
                <CardTitle className="font-phonic text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-[#7f5efd]" />
                  Pricing Configuration
                </CardTitle>
                <CardDescription className="font-capsule text-sm text-gray-600">
                  Set the amount, currency, and billing frequency
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="font-phonic text-sm font-semibold text-gray-900">Amount *</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      className="h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-phonic text-sm font-semibold text-gray-900">Currency *</label>
                    <Select
                      value={form.currency}
                      onValueChange={(value) => setForm({ ...form, currency: value })}
                    >
                      <SelectTrigger className="w-full h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {FIAT_CURRENCIES.map(currency => (
                          <SelectItem key={currency.code} value={currency.code} className="font-capsule text-base font-normal">
                            {currency.symbol} {currency.code} - {currency.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="font-phonic text-sm font-semibold text-gray-900">Billing Interval *</label>
                    <div className="flex gap-2">
                      <Select
                        value={form.interval}
                        onValueChange={(value) => setForm({ ...form, interval: value })}
                      >
                        <SelectTrigger className="flex-1 h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                          <SelectValue placeholder="Select interval" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="day" className="font-capsule text-base font-normal">Day</SelectItem>
                          <SelectItem value="week" className="font-capsule text-base font-normal">Week</SelectItem>
                          <SelectItem value="month" className="font-capsule text-base font-normal">Month</SelectItem>
                          <SelectItem value="year" className="font-capsule text-base font-normal">Year</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        min="1"
                        value={form.interval_count}
                        onChange={(e) => setForm({ ...form, interval_count: parseInt(e.target.value) || 1 })}
                        className="w-20 h-11 text-center bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="font-phonic text-sm font-semibold text-gray-900">Maximum Cycles</label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Leave empty for unlimited"
                      value={form.max_cycles}
                      onChange={(e) => setForm({ ...form, max_cycles: e.target.value })}
                      className="h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                    />
                    <p className="font-capsule text-xs text-gray-600">Leave empty for unlimited billing cycles</p>
                  </div>
                  <div className="space-y-2">
                    <label className="font-phonic text-sm font-semibold text-gray-900">Anchor Date</label>
                    <Input
                      type="date"
                      value={form.anchor}
                      onChange={(e) => setForm({ ...form, anchor: e.target.value })}
                      className="h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                    />
                    <p className="font-capsule text-xs text-gray-600">Optional: Specific date to start billing</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="p-6">
                <CardTitle className="font-phonic text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#7f5efd]" />
                  Customer Information
                </CardTitle>
                <CardDescription className="font-capsule text-sm text-gray-600">
                  Customer details for the subscription
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="font-phonic text-sm font-semibold text-gray-900">Customer Name</label>
                    <Input
                      placeholder="Customer's full name"
                      value={form.customer_name}
                      onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                      className="h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-phonic text-sm font-semibold text-gray-900">Email Address *</label>
                    <Input
                      type="email"
                      placeholder="customer@example.com"
                      value={form.customer_email}
                      onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
                      className="h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-phonic text-sm font-semibold text-gray-900">Phone Number</label>
                    <Input
                      placeholder="+1 (555) 123-4567"
                      value={form.customer_phone}
                      onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                      className="h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Settings */}
            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="p-6">
                <CardTitle className="font-phonic text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Coins className="h-5 w-5 text-[#7f5efd]" />
                  Payment Settings
                </CardTitle>
                <CardDescription className="font-capsule text-sm text-gray-600">
                  Configure cryptocurrency payment options
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-6">
                <div className="space-y-4">
                  <label className="font-phonic text-sm font-semibold text-gray-900">Accepted Cryptocurrencies</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {availableCryptos.map(crypto => (
                      <label key={crypto} className="flex items-center space-x-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-200">
                        <Checkbox
                          checked={form.accepted_cryptos.includes(crypto)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setForm({ ...form, accepted_cryptos: [...form.accepted_cryptos, crypto] });
                            } else {
                              setForm({ ...form, accepted_cryptos: form.accepted_cryptos.filter(c => c !== crypto) });
                            }
                          }}
                          className=""
                        />
                        <span className="text-sm font-medium">{crypto}</span>
                      </label>
                    ))}
                  </div>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="font-phonic text-sm font-semibold text-gray-900">Gateway Fee</label>
                    <Select
                      value={form.charge_customer_fee === null ? 'inherit' : form.charge_customer_fee ? 'customer' : 'merchant'}
                      onValueChange={(value) => {
                        setForm({
                          ...form,
                          charge_customer_fee: value === 'inherit' ? null : value === 'customer'
                        });
                      }}
                    >
                      <SelectTrigger className="w-full h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                        <SelectValue placeholder="Select fee option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inherit" className="font-capsule text-base font-normal">
                          Use global setting ({merchantSettings?.charge_customer_fee ? 'Customer pays' : 'Merchant pays'})
                        </SelectItem>
                        <SelectItem value="customer" className="font-capsule text-base font-normal">Customer pays fee</SelectItem>
                        <SelectItem value="merchant" className="font-capsule text-base font-normal">Merchant pays fee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="font-phonic text-sm font-semibold text-gray-900">Auto-Convert</label>
                    <Select
                      value={form.auto_convert_enabled === null ? 'inherit' : form.auto_convert_enabled ? 'enabled' : 'disabled'}
                      onValueChange={(value) => {
                        setForm({
                          ...form,
                          auto_convert_enabled: value === 'inherit' ? null : value === 'enabled'
                        });
                      }}
                    >
                      <SelectTrigger className="w-full h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                        <SelectValue placeholder="Select auto-convert option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inherit" className="font-capsule text-base font-normal">
                          Use global setting ({merchantSettings?.auto_convert_enabled ? 'Enabled' : 'Disabled'})
                        </SelectItem>
                        <SelectItem value="enabled" className="font-capsule text-base font-normal">Enable auto-convert</SelectItem>
                        <SelectItem value="disabled" className="font-capsule text-base font-normal">Disable auto-convert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Advanced Settings */}
            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-phonic text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <Settings className="h-5 w-5 text-[#7f5efd]" />
                      Advanced Settings
                    </CardTitle>
                    <CardDescription className="font-capsule text-sm text-gray-600">
                      Configure advanced subscription behavior
                    </CardDescription>
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
                <CardContent className="p-6 pt-0 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="font-phonic text-sm font-semibold text-gray-900">Pause After Missed Payments</label>
                      <Input
                        type="number"
                        min="1"
                        value={form.pause_after_missed_payments}
                        onChange={(e) => setForm({ ...form, pause_after_missed_payments: parseInt(e.target.value) || 3 })}
                        className="h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="font-phonic text-sm font-semibold text-gray-900">Auto Resume on Payment</label>
                      <div className="flex items-center space-x-2 h-11">
                        <Checkbox
                          checked={form.auto_resume_on_payment}
                          onCheckedChange={(checked) => setForm({ ...form, auto_resume_on_payment: checked as boolean })}
                          className=""
                        />
                        <span className="text-sm text-gray-600">Automatically resume when payment is received</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="font-phonic text-sm font-semibold text-gray-900">Invoice Due Days</label>
                      <Input
                        type="number"
                        min="0"
                        value={form.invoice_due_days}
                        onChange={(e) => setForm({ ...form, invoice_due_days: parseInt(e.target.value) || 0 })}
                        className="h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="font-phonic text-sm font-semibold text-gray-900">Generate Days in Advance</label>
                      <Input
                        type="number"
                        min="0"
                        value={form.generate_days_in_advance}
                        onChange={(e) => setForm({ ...form, generate_days_in_advance: parseInt(e.target.value) || 0 })}
                        className="h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="font-phonic text-sm font-semibold text-gray-900">Past Due After Days</label>
                      <Input
                        type="number"
                        min="1"
                        value={form.past_due_after_days}
                        onChange={(e) => setForm({ ...form, past_due_after_days: parseInt(e.target.value) || 2 })}
                        className="h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                      />
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Tax Configuration */}
            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="p-6">
                <CardTitle className="font-phonic text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-[#7f5efd]" />
                  Tax Configuration
                </CardTitle>
                <CardDescription className="font-capsule text-sm text-gray-600">
                  Configure tax settings for this subscription
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={form.tax_enabled}
                    onCheckedChange={(checked) => setForm({ ...form, tax_enabled: checked as boolean })}
                    className=""
                  />
                  <span className="font-phonic text-sm font-semibold text-gray-900">Enable tax collection</span>
                </div>

                {form.tax_enabled && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="font-phonic text-sm font-semibold text-gray-900">Tax Rate Label</label>
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
                          className="h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="font-phonic text-sm font-semibold text-gray-900">Tax Rate Percentage</label>
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
                          className="h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Desktop Submit Button */}
            <div className="hidden md:flex justify-end pt-6">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="px-6 h-11 bg-[#7f5efd] hover:bg-[#7c3aed] text-white flex items-center gap-2"
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
  );
}
