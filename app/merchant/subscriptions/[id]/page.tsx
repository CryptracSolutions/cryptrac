'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { makeAuthenticatedRequest, supabase } from '@/lib/supabase-browser';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { toast } from 'react-hot-toast';

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  cycle_start_at: string;
  due_date: string;
  invoice_number?: string; // Task 7: Add invoice number
}

interface AmountOverride {
  id: string;
  effective_from: string;
  amount: number;
  note?: string;
  created_at: string;
}

interface Subscription {
  id: string;
  title: string;
  amount: number;
  currency: string;
  interval: string;
  interval_count: number;
  status: string;
  next_billing_at?: string;
  max_cycles?: number;
  missed_payments_count?: number;
  tax_enabled?: boolean;
  tax_rates?: Array<{ name: string; rate: number }>;
  charge_customer_fee?: boolean;
  auto_convert_enabled?: boolean;
  pause_after_missed_payments?: number;
  invoice_due_days?: number;
  generate_days_in_advance?: number;
  past_due_after_days?: number;
  auto_resume_on_payment?: boolean;
  created_at?: string;
  paused_at?: string;
  resumed_at?: string;
  completed_at?: string;
  canceled_at?: string;
}

export default function SubscriptionDetailPage() {
  const params = useParams();
  const id = String(params?.id);
  const [sub, setSub] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [amountOverrides, setAmountOverrides] = useState<AmountOverride[]>([]);
  const [override, setOverride] = useState({ effective_from: '', amount: '', note: '' });
  const [invoiceLink, setInvoiceLink] = useState<{ url: string; id: string } | null>(null);
  const [email, setEmail] = useState('');

  const fetchInvoices = useCallback(async () => {
    const { data: invs } = await supabase
      .from('subscription_invoices')
      .select('id, amount, currency, status, created_at, cycle_start_at, due_date, invoice_number')
      .eq('subscription_id', id)
      .order('cycle_start_at', { ascending: false });
    setInvoices(invs || []);
  }, [id]);

  // Task 6: Fetch amount overrides
  const fetchAmountOverrides = useCallback(async () => {
    const { data: overrides } = await supabase
      .from('subscription_amount_overrides')
      .select('id, effective_from, amount, note, created_at')
      .eq('subscription_id', id)
      .order('effective_from', { ascending: false });
    setAmountOverrides(overrides || []);
  }, [id]);

  useEffect(() => {
    (async () => {
      const res = await makeAuthenticatedRequest(`/api/subscriptions/${id}`);
      const json = await res.json();
      setSub(json.data);
      await fetchInvoices();
      await fetchAmountOverrides(); // Task 6: Fetch amount overrides
    })();
  }, [id, fetchInvoices, fetchAmountOverrides]);

  const scheduleOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await makeAuthenticatedRequest(`/api/subscriptions/${id}/amount-overrides`, {
      method: 'POST',
      body: JSON.stringify({ effective_from: override.effective_from, amount: parseFloat(override.amount), note: override.note })
    });
    if (res.ok) {
      toast.success('Override scheduled');
      await fetchAmountOverrides(); // Task 6: Refresh overrides list
      setOverride({ effective_from: '', amount: '', note: '' });
    } else {
      const json = await res.json();
      toast.error(json.error || 'Failed to schedule override');
    }
  };

  const generateInvoice = async () => {
    const res = await makeAuthenticatedRequest(`/api/subscriptions/${id}/generate-invoice`, { method: 'POST' });
    const json = await res.json();
    if (res.ok) {
      setInvoiceLink({ url: json.payment_url, id: json.payment_link_id });
      toast.success('Invoice generated');
      await fetchInvoices();
    } else {
      toast.error(json.error || 'Failed to generate invoice');
    }
  };

  const sendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceLink) return;
    await makeAuthenticatedRequest('/api/receipts/email', {
      method: 'POST',
      body: JSON.stringify({ email, payment_link_id: invoiceLink.id })
    });
    toast.success('Email sent');
    setEmail('');
  };

  return (
    <div className="p-4">
      {sub && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">{sub.title}</h1>
          <p className="text-gray-600 mb-1">
            {sub.amount} {sub.currency} every {sub.interval_count} {sub.interval}
            {sub.interval_count > 1 ? 's' : ''}
            {sub.max_cycles && (
              <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {sub.max_cycles} cycles max
              </span>
            )}
          </p>
          {sub.next_billing_at && (
            <p className="text-gray-600 mb-1">
              Next billing: {sub.next_billing_at ? new Date(sub.next_billing_at).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : 'Not scheduled'}
            </p>
          )}
          <div className="flex items-center gap-2 mb-4">
            <Badge variant={
              sub.status === 'active' ? 'default' : 
              sub.status === 'paused' ? 'secondary' : 
              sub.status === 'completed' ? 'outline' :
              'destructive'
            }>
              {sub.status === 'active' ? '✓ Active' : 
               sub.status === 'paused' ? '⏸ Paused' : 
               sub.status === 'completed' ? '🏁 Completed' :
               '✕ Canceled'}
            </Badge>
            {sub.status === 'paused' && (
              <span className="text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded">
                Payment required to reactivate
              </span>
            )}
            {sub.status === 'completed' && (
              <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
                All cycles completed
              </span>
            )}
            {(sub.missed_payments_count ?? 0) > 0 && (
              <span className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded">
                {sub.missed_payments_count} missed payment{(sub.missed_payments_count ?? 0) > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Comprehensive Configuration Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Billing Configuration */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3 text-gray-800">Billing Configuration</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Amount:</span>
                  <span className="font-medium">{sub.amount} {sub.currency}</span>
                </div>
                {sub.tax_enabled && sub.tax_rates && sub.tax_rates.length > 0 && (
                  <>
                    {sub.tax_rates.map((rate: any, index: number) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-gray-600">{rate.name || 'Tax'}:</span>
                        <span className="font-medium">{(sub.amount * rate.rate / 100).toFixed(2)} {sub.currency} ({rate.rate}%)</span>
                      </div>
                    ))}
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-600">Subtotal with Tax:</span>
                      <span className="font-medium">
                        {(sub.amount + sub.tax_rates.reduce((sum: number, rate: any) => sum + (sub.amount * rate.rate / 100), 0)).toFixed(2)} {sub.currency}
                      </span>
                    </div>
                  </>
                )}
                {sub.charge_customer_fee && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gateway Fee:</span>
                      <span className="font-medium">
                        {sub.auto_convert_enabled ? '1.0%' : '0.5%'}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-semibold">
                      <span className="text-gray-800">Customer Pays:</span>
                      <span>
                        {(() => {
                          const baseWithTax = sub.amount + (sub.tax_rates?.reduce((sum: number, rate: any) => sum + (sub.amount * rate.rate / 100), 0) || 0);
                          const feeRate = sub.auto_convert_enabled ? 0.01 : 0.005;
                          const fee = baseWithTax * feeRate;
                          return (baseWithTax + fee).toFixed(2);
                        })()} {sub.currency}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Cycle Information */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3 text-gray-800">Cycle Information</h3>
              <div className="space-y-2 text-sm">
                {sub.max_cycles && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Max Cycles:</span>
                      <span className="font-medium">{sub.max_cycles}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Completed Cycles:</span>
                      <span className="font-medium">{invoices.filter(i => i.status === 'paid').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Remaining Cycles:</span>
                      <span className="font-medium">{sub.max_cycles - invoices.filter(i => i.status === 'paid').length}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Missed Payments:</span>
                  <span className={`font-medium ${(sub.missed_payments_count ?? 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {sub.missed_payments_count ?? 0}
                  </span>
                </div>
                {(sub.pause_after_missed_payments ?? 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pause After:</span>
                    <span className="font-medium">{sub.pause_after_missed_payments ?? 0} missed payments</span>
                  </div>
                )}
              </div>
            </div>

            {/* Timing Configuration */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3 text-gray-800">Timing Configuration</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Invoice Due Days:</span>
                  <span className="font-medium">{sub.invoice_due_days || 0} days after cycle start</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Generate in Advance:</span>
                  <span className="font-medium">{sub.generate_days_in_advance || 0} days early</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Past Due After:</span>
                  <span className="font-medium">{sub.past_due_after_days || 2} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Auto Resume:</span>
                  <span className={`font-medium ${sub.auto_resume_on_payment ? 'text-green-600' : 'text-gray-500'}`}>
                    {sub.auto_resume_on_payment ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>

            {/* Status History */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3 text-gray-800">Status History</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium">
                    {sub.created_at ? new Date(sub.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    }) : 'N/A'}
                  </span>
                </div>
                {sub.paused_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paused:</span>
                    <span className="font-medium">
                      {sub.paused_at ? new Date(sub.paused_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      }) : 'N/A'}
                    </span>
                  </div>
                )}
                {sub.resumed_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Resumed:</span>
                    <span className="font-medium">
                      {sub.resumed_at ? new Date(sub.resumed_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      }) : 'N/A'}
                    </span>
                  </div>
                )}
                {sub.completed_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completed:</span>
                    <span className="font-medium">
                      {sub.completed_at ? new Date(sub.completed_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      }) : 'N/A'}
                    </span>
                  </div>
                )}
                {sub.canceled_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Canceled:</span>
                    <span className="font-medium">
                      {sub.canceled_at ? new Date(sub.canceled_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      }) : 'N/A'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Only show generate invoice button for active subscriptions */}
      {sub?.status === 'active' && (
        <div className="mb-6">
          <Button className="mb-2" onClick={generateInvoice}>
            Generate Invoice Now
          </Button>
          <p className="text-sm text-gray-500">
            Create an invoice for the next billing cycle
          </p>
        </div>
      )}
      
      {sub?.status === 'completed' && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-800">
            <span className="text-lg">🏁</span>
            <span className="font-medium">Subscription Completed</span>
          </div>
          <p className="text-sm text-green-700 mt-1">
            This subscription has reached its maximum number of cycles and is now complete.
          </p>
        </div>
      )}
      
      {invoiceLink && (
        <div className="border border-green-200 bg-green-50 p-4 rounded mb-6 space-y-3 max-w-md">
          <div className="flex items-center gap-2 text-green-800">
            <span className="text-lg">✓</span>
            <span className="font-medium">Invoice Generated Successfully</span>
          </div>
          <div className="flex gap-2">
            <Input value={invoiceLink.url} readOnly className="flex-1 bg-white" />
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(invoiceLink.url);
                toast.success('Payment link copied to clipboard');
              }}
            >
              Copy Link
            </Button>
          </div>
          <form onSubmit={sendEmail} className="flex gap-2">
            <Input 
              type="email" 
              placeholder="Customer email address" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              className="bg-white"
            />
            <Button type="submit">Send Invoice</Button>
          </form>
          <p className="text-sm text-gray-600">
            Send the payment link directly to your customer's email
          </p>
        </div>
      )}
      
      <h2 className="font-semibold mb-3 text-lg">Invoice History</h2>
      <ul className="space-y-3 mb-6">
        {invoices.map(i => (
          <li key={i.id} className="border p-3 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{i.amount} {i.currency}</span>
                  {i.invoice_number && (
                    <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded font-mono">
                      {i.invoice_number}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>
                    <span className="font-medium">Billing Period:</span> {new Date(i.cycle_start_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                  <div>
                    <span className="font-medium">Due Date:</span> {new Date(i.due_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                    {new Date(i.due_date) < new Date() && i.status !== 'paid' && (
                      <span className="ml-2 text-red-600 font-medium">• Overdue</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    Created: {new Date(i.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
              <Badge variant={
                i.status === 'paid' ? 'default' : 
                i.status === 'past_due' ? 'destructive' : 
                'secondary'
              }>
                {i.status === 'paid' ? '✓ Paid' : 
                 i.status === 'past_due' ? '⚠ Past Due' : 
                 i.status === 'sent' ? '📧 Sent' : 
                 '⏳ Pending'}
              </Badge>
            </div>
          </li>
        ))}
        {invoices.length === 0 && (
          <li className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📄</div>
            <p>No invoices generated yet</p>
            <p className="text-sm">Use the button above to create your first invoice</p>
          </li>
        )}
      </ul>

      {/* Task 10: Enhanced Amount Overrides Section */}
      <h2 className="font-semibold mb-3 text-lg">Amount Overrides</h2>
      {amountOverrides.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-3">
            Scheduled amount changes for future billing cycles
          </p>
          <ul className="space-y-2 mb-4">
            {amountOverrides.map(override => (
              <li key={override.id} className="border border-blue-200 p-3 rounded-lg bg-blue-50">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-blue-900">
                      {override.amount} {sub?.currency}
                    </div>
                    <div className="text-sm text-blue-700">
                      Effective from: {new Date(override.effective_from).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    {override.note && (
                      <div className="text-sm text-blue-600 mt-1 italic">"{override.note}"</div>
                    )}
                  </div>
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    Scheduled
                  </span>
                </div>
                <div className="text-xs text-blue-500 mt-2">
                  Created: {new Date(override.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium mb-3">Schedule New Amount Override</h3>
        <form onSubmit={scheduleOverride} className="space-y-3 max-w-sm">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Effective Date
            </label>
            <Input 
              type="date" 
              value={override.effective_from} 
              onChange={e => setOverride({ ...override, effective_from: e.target.value })} 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Amount ({sub?.currency})
            </label>
            <Input 
              type="number" 
              step="0.01" 
              placeholder="0.00" 
              value={override.amount} 
              onChange={e => setOverride({ ...override, amount: e.target.value })} 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note (optional)
            </label>
            <Input 
              placeholder="Reason for amount change" 
              value={override.note} 
              onChange={e => setOverride({ ...override, note: e.target.value })} 
            />
          </div>
          <Button type="submit" className="w-full">
            Schedule Amount Override
          </Button>
          <p className="text-xs text-gray-500">
            The new amount will apply to all invoices generated on or after the effective date.
          </p>
        </form>
      </div>
    </div>
  );
}

