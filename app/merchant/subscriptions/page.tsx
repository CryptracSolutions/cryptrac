'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, makeAuthenticatedRequest } from '@/lib/supabase-browser';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';

interface Subscription {
  id: string;
  title: string;
  amount: number;
  currency: string;
  interval: string;
  interval_count: number;
  status: string;
  next_billing_at: string | null;
  customer_id: string | null;
  email?: string;
  phone?: string;
}

export default function MerchantSubscriptionsPage() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await makeAuthenticatedRequest('/api/subscriptions');
        const json = await res.json();
        const list: Subscription[] = json.data || [];
        const ids = list.map(s => s.customer_id).filter(Boolean);
        if (ids.length > 0) {
          const { data: customers } = await supabase
            .from('customers')
            .select('id,email,phone')
            .in('id', ids as string[]);
          list.forEach(s => {
            const c = customers?.find(x => x.id === s.customer_id);
            s.email = c?.email || '';
            s.phone = c?.phone || '';
          });
        }
        setSubs(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Subscriptions</h1>
        <Link href="/merchant/subscriptions/create">
          <Button>Create</Button>
        </Link>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="py-2">Title</th>
              <th className="py-2">Customer</th>
              <th className="py-2">Amount</th>
              <th className="py-2">Interval</th>
              <th className="py-2">Status</th>
              <th className="py-2">Next Billing</th>
            </tr>
          </thead>
          <tbody>
            {subs.map(s => (
              <tr key={s.id} className="border-b hover:bg-gray-50">
                <td className="py-2">
                  <Link href={`/merchant/subscriptions/${s.id}`} className="text-blue-600 hover:underline">
                    {s.title}
                  </Link>
                </td>
                <td className="py-2 text-sm">{s.email || s.phone || '—'}</td>
                <td className="py-2">{s.amount} {s.currency}</td>
                <td className="py-2">{s.interval_count} {s.interval}</td>
                <td className="py-2"><Badge>{s.status}</Badge></td>
                <td className="py-2 text-sm">{s.next_billing_at ? new Date(s.next_billing_at).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
