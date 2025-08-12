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
}

export default function SubscriptionDetailPage() {
  const params = useParams();
  const id = String(params?.id);
  const [sub, setSub] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [override, setOverride] = useState({ effective_from: '', amount: '', note: '' });
  const [invoiceLink, setInvoiceLink] = useState<{ url: string; id: string } | null>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const fetchInvoices = useCallback(async () => {
    const { data: invs } = await supabase
      .from('subscription_invoices')
      .select('*')
      .eq('subscription_id', id)
      .order('created_at', { ascending: false });
    setInvoices(invs || []);
  }, [id]);

  useEffect(() => {
    (async () => {
      const res = await makeAuthenticatedRequest(`/api/subscriptions/${id}`);
      const json = await res.json();
      setSub(json.data);
      await fetchInvoices();
    })();
  }, [id, fetchInvoices]);

  const scheduleOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    await makeAuthenticatedRequest(`/api/subscriptions/${id}/amount-overrides`, {
      method: 'POST',
      body: JSON.stringify({ effective_from: override.effective_from, amount: parseFloat(override.amount), note: override.note })
    });
    toast.success('Override scheduled');
    await fetchInvoices();
    setOverride({ effective_from: '', amount: '', note: '' });
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

  const sendSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceLink) return;
    await makeAuthenticatedRequest('/api/receipts/sms', {
      method: 'POST',
      body: JSON.stringify({ phone, payment_link_id: invoiceLink.id })
    });
    toast.success('SMS sent');
    setPhone('');
  };

  return (
    <div className="p-4">
      {sub && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">{sub.title}</h1>
          <p className="text-gray-600 mb-1">{sub.amount} {sub.currency} every {sub.interval_count} {sub.interval}</p>
          {sub.next_billing_at && (
            <p className="text-gray-600 mb-1">Next billing: {new Date(sub.next_billing_at).toLocaleString()}</p>
          )}
          <Badge>{sub.status}</Badge>
        </div>
      )}
      <Button className="mb-4" onClick={generateInvoice}>Generate invoice now</Button>
      {invoiceLink && (
        <div className="border p-4 rounded mb-6 space-y-2 max-w-md">
          <div className="flex gap-2">
            <Input value={invoiceLink.url} readOnly className="flex-1" />
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(invoiceLink.url);
                toast.success('Link copied');
              }}
            >
              Copy Link
            </Button>
          </div>
          <form onSubmit={sendEmail} className="flex gap-2">
            <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <Button type="submit">Send Email</Button>
          </form>
          <form onSubmit={sendSms} className="flex gap-2">
            <Input placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} />
            <Button type="submit">Send SMS</Button>
          </form>
        </div>
      )}
      <h2 className="font-semibold mb-2">Invoices</h2>
      <ul className="space-y-2 mb-6">
        {invoices.map(i => (
          <li key={i.id} className="border p-2 rounded">
            <div className="flex justify-between">
              <span>{i.amount} {i.currency}</span>
              <Badge>{i.status}</Badge>
            </div>
            <div className="text-xs text-gray-500">{new Date(i.created_at).toLocaleString()}</div>
          </li>
        ))}
        {invoices.length === 0 && <p className="text-gray-500">No invoices yet.</p>}
      </ul>
      <h2 className="font-semibold mb-2">Schedule Amount Override</h2>
      <form onSubmit={scheduleOverride} className="space-y-2 max-w-sm">
        <Input type="date" value={override.effective_from} onChange={e => setOverride({ ...override, effective_from: e.target.value })} required />
        <Input type="number" step="0.01" placeholder="Amount" value={override.amount} onChange={e => setOverride({ ...override, amount: e.target.value })} required />
        <Input placeholder="Note" value={override.note} onChange={e => setOverride({ ...override, note: e.target.value })} />
        <Button type="submit">Schedule</Button>
      </form>
    </div>
  );
}
