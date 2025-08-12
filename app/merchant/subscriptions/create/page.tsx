'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { makeAuthenticatedRequest } from '@/lib/supabase-browser';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Checkbox } from '@/app/components/ui/checkbox';

export default function CreateSubscriptionPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    description: '',
    amount: '',
    currency: 'USD',
    accepted_cryptos: '',
    interval: 'month',
    interval_count: 1,
    anchor: '',
    customer_email: '',
    customer_phone: '',
    customer_name: '',
    tax_enabled: false,
    tax_label: '',
    tax_percentage: '',
    pause_after_missed_payments: 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body: Record<string, unknown> = {
      title: form.title,
      description: form.description,
      amount: parseFloat(form.amount),
      currency: form.currency,
      accepted_cryptos: form.accepted_cryptos.split(',').map(s => s.trim()).filter(Boolean),
      interval: form.interval,
      interval_count: Number(form.interval_count),
      anchor: form.anchor,
      customer: { email: form.customer_email, phone: form.customer_phone, name: form.customer_name },
      pause_after_missed_payments: Number(form.pause_after_missed_payments),
      tax_enabled: form.tax_enabled,
      tax_rates: form.tax_enabled && form.tax_label ? [{ label: form.tax_label, percentage: parseFloat(form.tax_percentage) }] : []
    };
    const res = await makeAuthenticatedRequest('/api/subscriptions', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (res.ok) {
      router.push('/merchant/subscriptions');
    } else {
      console.error('failed to create');
    }
  };

  return (
    <div className="max-w-xl p-4">
      <h1 className="text-2xl font-bold mb-4">Create Subscription</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input name="title" placeholder="Title" value={form.title} onChange={handleChange} required />
        <Input name="description" placeholder="Description" value={form.description} onChange={handleChange} />
        <Input name="amount" type="number" step="0.01" placeholder="Amount" value={form.amount} onChange={handleChange} required />
        <Input name="currency" placeholder="Currency" value={form.currency} onChange={handleChange} />
        <Input name="accepted_cryptos" placeholder="Accepted cryptos (comma separated)" value={form.accepted_cryptos} onChange={handleChange} />
        <div className="flex gap-2">
          <Input name="interval_count" type="number" value={form.interval_count} onChange={handleChange} className="w-20" />
          <select name="interval" value={form.interval} onChange={handleChange} className="border p-2 rounded">
            <option value="day">day</option>
            <option value="week">week</option>
            <option value="month">month</option>
            <option value="year">year</option>
          </select>
        </div>
        <Input name="anchor" type="datetime-local" value={form.anchor} onChange={handleChange} required />
        <Input name="customer_email" placeholder="Customer email" value={form.customer_email} onChange={handleChange} />
        <Input name="customer_phone" placeholder="Customer phone" value={form.customer_phone} onChange={handleChange} />
        <Input name="customer_name" placeholder="Customer name" value={form.customer_name} onChange={handleChange} />
        <div className="flex items-center space-x-2">
          <Checkbox id="tax_enabled" name="tax_enabled" checked={form.tax_enabled} onCheckedChange={v => setForm(prev => ({ ...prev, tax_enabled: !!v }))} />
          <label htmlFor="tax_enabled">Enable tax</label>
        </div>
        {form.tax_enabled && (
          <div className="flex gap-2">
            <Input name="tax_label" placeholder="Tax label" value={form.tax_label} onChange={handleChange} />
            <Input name="tax_percentage" type="number" step="0.01" placeholder="%" value={form.tax_percentage} onChange={handleChange} />
          </div>
        )}
        <Input name="pause_after_missed_payments" type="number" placeholder="Pause after missed payments" value={form.pause_after_missed_payments} onChange={handleChange} />
        <Button type="submit">Create</Button>
      </form>
    </div>
  );
}
