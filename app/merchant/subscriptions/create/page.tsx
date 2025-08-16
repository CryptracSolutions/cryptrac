'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { makeAuthenticatedRequest } from '@/lib/supabase-browser';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';

export default function CreateSubscriptionPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    amount: '',
    currency: 'USD',
    accepted_cryptos: '',
    interval: 'month',
    interval_count: 1,
    max_cycles: '',
    anchor: '',
    customer_email: '',
    customer_phone: '',
    customer_name: '',
    tax_enabled: false,
    tax_label: '',
    tax_percentage: '',
    pause_after_missed_payments: 3,
    charge_customer_fee: false,
    auto_convert_enabled: false,
    preferred_payout_currency: 'USD',
    // Timing configuration fields
    invoice_due_days: 0,
    generate_days_in_advance: 0,
    past_due_after_days: 2,
    auto_resume_on_payment: true,
    showAdvanced: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
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
        accepted_cryptos: form.accepted_cryptos.split(',').map(s => s.trim()).filter(Boolean),
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
        tax_rates: form.tax_enabled && form.tax_label ? [{ 
          label: form.tax_label, 
          percentage: parseFloat(form.tax_percentage) 
        }] : [],
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
        router.push('/merchant/subscriptions');
      } else {
        const error = await res.text();
        console.error('Failed to create subscription:', error);
        alert('Failed to create subscription. Please check the form and try again.');
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatInterval = () => {
    const count = form.interval_count;
    const interval = form.interval;
    if (count === 1) {
      return interval;
    }
    return `${count} ${interval}s`;
  };

  const calculateTotal = () => {
    const amount = parseFloat(form.amount) || 0;
    const taxAmount = form.tax_enabled && form.tax_percentage ? 
      amount * (parseFloat(form.tax_percentage) / 100) : 0;
    return amount + taxAmount;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Create New Subscription</h1>
        <p className="text-gray-600">Set up a recurring payment subscription for your customer</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Define the subscription details and billing cycle
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Subscription Title *</label>
                  <Input 
                    name="title" 
                    placeholder="e.g., Premium Monthly Plan" 
                    value={form.title} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Input 
                    name="description" 
                    placeholder="Brief description of the subscription" 
                    value={form.description} 
                    onChange={handleChange} 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Amount *</label>
                    <Input 
                      name="amount" 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      value={form.amount} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Currency</label>
                    <select 
                      name="currency" 
                      value={form.currency} 
                      onChange={handleChange} 
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="CAD">CAD</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Billing Frequency</label>
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
                  <label className="block text-sm font-medium mb-1">Accepted Cryptocurrencies</label>
                  <Input 
                    name="accepted_cryptos" 
                    placeholder="BTC, ETH, USDT (comma separated)" 
                    value={form.accepted_cryptos} 
                    onChange={handleChange} 
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to accept all supported cryptocurrencies
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="charge_customer_fee" 
                      checked={form.charge_customer_fee} 
                      onCheckedChange={v => setForm(prev => ({ ...prev, charge_customer_fee: !!v }))} 
                    />
                    <label htmlFor="charge_customer_fee" className="text-sm">Charge customer processing fee</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="auto_convert_enabled" 
                      checked={form.auto_convert_enabled} 
                      onCheckedChange={v => setForm(prev => ({ ...prev, auto_convert_enabled: !!v }))} 
                    />
                    <label htmlFor="auto_convert_enabled" className="text-sm">Enable auto-convert</label>
                  </div>
                </div>

                {form.auto_convert_enabled && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Preferred Payout Currency</label>
                    <select 
                      name="preferred_payout_currency" 
                      value={form.preferred_payout_currency} 
                      onChange={handleChange} 
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="CAD">CAD</option>
                    </select>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tax Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Tax Configuration</CardTitle>
                <CardDescription>
                  Set up tax rates for this subscription
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="tax_enabled" 
                    checked={form.tax_enabled} 
                    onCheckedChange={v => setForm(prev => ({ ...prev, tax_enabled: !!v }))} 
                  />
                  <label htmlFor="tax_enabled" className="text-sm font-medium">Enable tax calculation</label>
                </div>
                
                {form.tax_enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Tax Label</label>
                      <Input 
                        name="tax_label" 
                        placeholder="e.g., Sales Tax, VAT" 
                        value={form.tax_label} 
                        onChange={handleChange} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Tax Percentage</label>
                      <Input 
                        name="tax_percentage" 
                        type="number" 
                        step="0.01" 
                        placeholder="8.25" 
                        value={form.tax_percentage} 
                        onChange={handleChange} 
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Advanced Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>
                  Configure dunning, timing, and automation settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Pause after missed payments</label>
                  <Input 
                    name="pause_after_missed_payments" 
                    type="number" 
                    min="0"
                    placeholder="3" 
                    value={form.pause_after_missed_payments} 
                    onChange={handleChange} 
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Subscription will be paused after this many consecutive missed payments (0 = never pause)
                  </p>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Checkbox 
                      id="showAdvanced" 
                      checked={form.showAdvanced} 
                      onCheckedChange={v => setForm(prev => ({ ...prev, showAdvanced: !!v }))} 
                    />
                    <label htmlFor="showAdvanced" className="text-sm font-medium">Show Timing Configuration</label>
                  </div>
                  
                  {form.showAdvanced && (
                    <div className="space-y-4 pl-4 border-l-2 border-blue-200 bg-blue-50 p-4 rounded">
                      <div>
                        <label className="block text-sm font-medium mb-1">Generate invoice days in advance</label>
                        <Input 
                          name="generate_days_in_advance" 
                          type="number" 
                          min="0" 
                          placeholder="0" 
                          value={form.generate_days_in_advance} 
                          onChange={handleChange} 
                        />
                        <p className="text-xs text-gray-500 mt-1">Generate invoices X days before the billing date</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Invoice due days after generation</label>
                        <Input 
                          name="invoice_due_days" 
                          type="number" 
                          min="0" 
                          placeholder="0" 
                          value={form.invoice_due_days} 
                          onChange={handleChange} 
                        />
                        <p className="text-xs text-gray-500 mt-1">Invoice is due X days after generation (0 = due immediately)</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Grace period before past-due</label>
                        <Input 
                          name="past_due_after_days" 
                          type="number" 
                          min="0" 
                          placeholder="2" 
                          value={form.past_due_after_days} 
                          onChange={handleChange} 
                        />
                        <p className="text-xs text-gray-500 mt-1">Mark invoice as past-due X days after due date</p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="auto_resume_on_payment" 
                          checked={form.auto_resume_on_payment} 
                          onCheckedChange={v => setForm(prev => ({ ...prev, auto_resume_on_payment: !!v }))} 
                        />
                        <label htmlFor="auto_resume_on_payment" className="text-sm">Auto-resume paused subscriptions on payment</label>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1"
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
                Review your subscription settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium">{form.title || 'Untitled Subscription'}</h3>
                {form.description && (
                  <p className="text-sm text-gray-600 mt-1">{form.description}</p>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Amount:</span>
                  <span className="font-medium">
                    {form.amount ? `${form.amount} ${form.currency}` : '—'}
                  </span>
                </div>
                
                {form.tax_enabled && form.tax_percentage && (
                  <div className="flex justify-between text-sm">
                    <span>{form.tax_label || 'Tax'}:</span>
                    <span>
                      {form.amount ? 
                        `${(parseFloat(form.amount) * parseFloat(form.tax_percentage) / 100).toFixed(2)} ${form.currency}` : 
                        '—'
                      }
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between font-medium border-t pt-2">
                  <span>Total:</span>
                  <span>
                    {form.amount ? `${calculateTotal().toFixed(2)} ${form.currency}` : '—'}
                  </span>
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
                    <span>Max Cycles:</span>
                    <Badge variant="outline">{form.max_cycles}</Badge>
                  </div>
                )}
                
                {form.charge_customer_fee && (
                  <div className="flex justify-between">
                    <span>Processing Fee:</span>
                    <Badge variant="secondary">Customer pays</Badge>
                  </div>
                )}
                
                {form.auto_convert_enabled && (
                  <div className="flex justify-between">
                    <span>Auto-convert:</span>
                    <Badge variant="secondary">{form.preferred_payout_currency}</Badge>
                  </div>
                )}
              </div>

              {form.customer_email && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium text-sm mb-2">Customer</h4>
                    <div className="text-sm space-y-1">
                      {form.customer_name && <div>{form.customer_name}</div>}
                      <div className="text-gray-600">{form.customer_email}</div>
                      {form.customer_phone && <div className="text-gray-600">{form.customer_phone}</div>}
                    </div>
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

