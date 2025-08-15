'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  DollarSign,
  CreditCard,
  LinkIcon,
  Plus,
  Calendar,
  Clock,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { DashboardLayout } from '@/app/components/layout/dashboard-layout';
import { CryptoIcon } from '@/app/components/ui/crypto-icon';
import { supabase } from '@/lib/supabase-browser';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/app/components/ui/alert';

// Stable coin associations for automatic inclusion
const stableCoinAssociations: Record<string, string[]> = {
  SOL: ['USDCSOL', 'USDTSOL'],
  ETH: ['USDT', 'USDC', 'DAI', 'PYUSD', 'ETHBASE', 'USDCBASE'],
  BNB: ['USDTBSC', 'USDCBSC'],
  MATIC: ['USDTMATIC', 'USDCMATIC'],
  TRX: ['USDTTRC20'],
  TON: ['USDTTON'],
  ARB: ['USDTARB', 'USDCARB'],
  OP: ['USDTOP', 'USDCOP'],
  ETHBASE: ['USDCBASE'],
  ALGO: ['USDCALGO'],
};

const CURRENCY_NAMES: Record<string, string> = {
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  BNB: 'BNB',
  SOL: 'Solana',
  TRX: 'TRON',
  TON: 'Toncoin',
  AVAX: 'Avalanche',
  DOGE: 'Dogecoin',
  XRP: 'XRP',
  SUI: 'Sui',
  MATIC: 'Polygon',
  ADA: 'Cardano',
  DOT: 'Polkadot',
  LTC: 'Litecoin',
  XLM: 'Stellar',
  ARB: 'Arbitrum',
  OP: 'Optimism',
  ETHBASE: 'ETH (Base)',
  ALGO: 'Algorand',
  USDT: 'Tether (Ethereum)',
  USDC: 'USD Coin (Ethereum)',
  DAI: 'Dai (Ethereum)',
  PYUSD: 'PayPal USD (Ethereum)',
  USDCSOL: 'USD Coin (Solana)',
  USDTSOL: 'Tether (Solana)',
  USDTBSC: 'Tether (BSC)',
  USDCBSC: 'USD Coin (BSC)',
  USDTMATIC: 'Tether (Polygon)',
  USDCMATIC: 'USD Coin (Polygon)',
  USDTTRC20: 'Tether (Tron)',
  USDTTON: 'Tether (TON)',
  USDTARB: 'Tether (Arbitrum)',
  USDCARB: 'USD Coin (Arbitrum)',
  USDTOP: 'Tether (Optimism)',
  USDCOP: 'USD Coin (Optimism)',
  USDCBASE: 'USD Coin (Base)',
  USDCALGO: 'USD Coin (Algorand)',
};

interface RecentTransaction {
  id: string;
  amount: number;
  currency: string;
  created_at: string;
}

export default function MerchantDashboard() {
  const [user, setUser] = useState<{ email?: string; user_metadata?: { business_name?: string; trial_end?: string } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [merchant, setMerchant] = useState<{ id: string; wallets: Record<string, string>; trial_end?: string } | null>(null);
  const [stats, setStats] = useState({ totalRevenue: 0, paymentLinks: 0, successfulPayments: 0 });
  const [supportedCurrencies, setSupportedCurrencies] = useState<{ symbol: string; name: string }[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [trialCountdown, setTrialCountdown] = useState('');
  const [newPayments, setNewPayments] = useState<RecentTransaction[]>([]);
  const router = useRouter();

  const formatCurrency = (amount: number, currency: string) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
      }).format(amount);
    } catch {
      return amount.toFixed(2);
    }
  };

  const fetchStats = async (merchantId: string) => {
    try {
      const { count: linksCount } = await supabase
        .from('payment_links')
        .select('id', { count: 'exact', head: true })
        .eq('merchant_id', merchantId);

      const { data: transactions, count: paymentsCount } = await supabase
        .from('transactions')
        .select('id, amount, currency, created_at', { count: 'exact' })
        .eq('merchant_id', merchantId)
        .in('status', ['confirmed', 'finished'])
        .order('created_at', { ascending: false });

      const totalRevenue = transactions?.reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0;

      setStats({
        totalRevenue,
        paymentLinks: linksCount || 0,
        successfulPayments: paymentsCount || 0,
      });

      setRecentTransactions(
        (transactions || []).slice(0, 5).map(t => ({
          id: t.id,
          amount: Number(t.amount || 0),
          currency: t.currency || 'USD',
          created_at: t.created_at,
        }))
      );

      // Fetch new payments since last seen
      await fetchNewPayments(merchantId);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchNewPayments = async (merchantId: string) => {
    try {
      const { data: settings } = await supabase
        .from('merchant_settings')
        .select('last_seen_payments_at')
        .eq('merchant_id', merchantId)
        .single();

      const lastSeen = settings?.last_seen_payments_at || '1970-01-01';

      const { data: txs } = await supabase
        .from('transactions')
        .select('id, amount, currency, created_at')
        .eq('merchant_id', merchantId)
        .eq('status', 'confirmed')
        .gt('created_at', lastSeen)
        .order('created_at', { ascending: false });

      setNewPayments(txs || []);
    } catch (err) {
      console.error('Failed to fetch new payments:', err);
    }
  };

  const markPaymentsSeen = async () => {
    try {
      await fetch('/api/merchant/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ last_seen_payments_at: new Date().toISOString() })
      });
      setNewPayments([]);
    } catch (err) {
      console.error('Failed to mark payments as seen:', err);
    }
  };

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          console.error('Authentication error:', error);
          router.push('/login');
          return;
        }

        // Ensure merchant record exists
        try {
          const response = await fetch('/api/merchants/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            console.error('Failed to create/verify merchant record');
          }
        } catch (merchantError) {
          console.error('Merchant creation error:', merchantError);
        }

        setUser(user);

        const { data: merchantData, error: merchantErrorFetch } = await supabase
          .from('merchants')
          .select('id, wallets, trial_end')
          .eq('user_id', user.id)
          .single();

        if (merchantErrorFetch) {
          console.error('Failed to fetch merchant:', merchantErrorFetch);
        } else if (merchantData) {
          setMerchant(merchantData);
          await fetchStats(merchantData.id);
        }
      } catch (error) {
        console.error('Failed to get user:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, [router, fetchStats]);

  useEffect(() => {
    if (!merchant) return;
    const baseCurrencies = Object.keys(merchant.wallets || {});
    const currencySet = new Set<string>();
    baseCurrencies.forEach((currency) => {
      currencySet.add(currency);
      (stableCoinAssociations[currency] || []).forEach((sc) => currencySet.add(sc));
    });
    const list = Array.from(currencySet).map((code) => ({
      symbol: code,
      name: CURRENCY_NAMES[code] || code,
    }));
    setSupportedCurrencies(list);
  }, [merchant]);

  const trialEnd = merchant?.trial_end || user?.user_metadata?.trial_end;

  const steps = [
    {
      id: 1,
      title: 'Create your first payment link',
      description: 'Set up a payment link with your desired amount and accepted cryptocurrencies.',
      completed: stats.paymentLinks > 0,
    },
    {
      id: 2,
      title: 'Share with customers',
      description: 'Send the link or QR code to your customers via email, social media, or your website.',
      completed: stats.paymentLinks > 0,
    },
    {
      id: 3,
      title: 'Receive payments',
      description: 'Get notified when payments are received and track them in your dashboard.',
      completed: stats.successfulPayments > 0,
    },
  ];

  useEffect(() => {
    if (!trialEnd) return;
    const end = new Date(trialEnd).getTime();
    const updateCountdown = () => {
      const diff = end - Date.now();
      if (diff <= 0) {
        setTrialCountdown('0d 0h 0m');
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTrialCountdown(`${days}d ${hours}h ${minutes}m`);
      }
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [trialEnd]);

  if (loading) {
    return (
      <DashboardLayout user={user}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return null;
  }

  const businessName = user.user_metadata?.business_name || user.email?.split('@')[0] || 'Your Business';
  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {businessName}!
            </h1>
            <p className="text-gray-600">
              Here&apos;s what&apos;s happening with your cryptocurrency payments today.
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => router.push('/merchant/dashboard/payments')}
              className="flex items-center gap-2"
            >
              <LinkIcon className="h-4 w-4" />
              View All Links
            </Button>
            <Button 
              onClick={() => router.push('/merchant/dashboard/payments/create')}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Payment Link
            </Button>
          </div>
        </div>

        {newPayments.length > 0 && (
          <Alert>
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>
                  You have {newPayments.length} new payment{newPayments.length > 1 ? 's' : ''}.
                </span>
                <Button size="sm" variant="outline" onClick={markPaymentsSeen}>
                  Mark as seen
                </Button>
              </div>
              <ul className="mt-2 list-disc pl-4">
                {newPayments.map(p => (
                  <li key={p.id}>
                    {formatCurrency(p.amount, p.currency)} — {new Date(p.created_at).toLocaleString()}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Trial Banner */}
        {trialEnd && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-medium text-orange-900">Free Trial Active</p>
                  <p className="text-sm text-orange-700">
                    Your trial ends on {new Date(trialEnd).toLocaleDateString()}. $99 One-time setup fee + $19/mo subscription will be charged to continue accepting crypto payments.
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-4">
                  <span className="text-sm text-orange-700">Ends in {trialCountdown}</span>
                  <Link href="/merchant/settings" className="text-sm text-orange-700 underline">
                    Cancel Subscription
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Payment Links</CardTitle>
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.paymentLinks}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Successful Payments</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.successfulPayments}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Get started with accepting cryptocurrency payments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => router.push('/merchant/dashboard/payments/create')}
                className="w-full justify-start h-auto p-4"
                variant="outline"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Plus className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Create Payment Link</div>
                    <div className="text-sm text-gray-500">Generate a link to accept crypto payments</div>
                  </div>
                </div>
              </Button>

              <Button 
                onClick={() => router.push('/merchant/dashboard/payments')}
                className="w-full justify-start h-auto p-4"
                variant="outline"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <LinkIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Manage Payment Links</div>
                    <div className="text-sm text-gray-500">View and manage your existing links</div>
                  </div>
                </div>
              </Button>

              <Button
                onClick={() => router.push('/smart-terminal')}
                className="w-full justify-start h-auto p-4"
                variant="outline"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <CreditCard className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Smart Terminal</div>
                    <div className="text-sm text-gray-500">Accept in-person crypto payments</div>
                  </div>
                </div>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your latest payment link activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="p-3 bg-gray-100 rounded-full mb-4">
                    <Calendar className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">No activity yet</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Create your first payment link to start seeing activity here.
                  </p>
                  <Button
                    onClick={() => router.push('/merchant/dashboard/payments/create')}
                    size="sm"
                  >
                    Create Payment Link
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentTransactions.map(tx => (
                    <div key={tx.id} className="flex items-center justify-between border-b last:border-0 pb-2">
                      <div>
                        <p className="text-sm font-medium">{formatCurrency(tx.amount, tx.currency)}</p>
                        <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className="text-xs text-gray-500">{tx.currency}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Supported Cryptocurrencies */}
        <Card>
          <CardHeader>
            <CardTitle>Supported Cryptocurrencies</CardTitle>
            <CardDescription>
              Accept payments in these popular cryptocurrencies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {supportedCurrencies.map((crypto) => (
                <div key={crypto.symbol} className="flex items-center gap-3 p-3 border rounded-lg">
                  <CryptoIcon currency={crypto.symbol} className="h-8 w-8" />
                  <div>
                    <div className="font-medium text-sm">{crypto.symbol}</div>
                    <div className="text-xs text-gray-500">{crypto.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Getting Started Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Follow these steps to start accepting cryptocurrency payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {steps.map(step => (
                <div key={step.id} className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                    {step.id}
                  </div>
                  <div>
                    <h4 className={`font-medium ${step.completed ? 'text-gray-900' : 'text-gray-400'}`}>{step.title}</h4>
                    <p className={`text-sm ${step.completed ? 'text-gray-600' : 'text-gray-400'}`}>{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

