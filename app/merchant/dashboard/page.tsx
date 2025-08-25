'use client';

import React, { useState, useEffect, useCallback } from 'react';

export const dynamic = 'force-dynamic';
import { useRouter } from 'next/navigation';
import {
  DollarSign,
  CreditCard,
  LinkIcon,
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';

import { CryptoIcon } from '@/app/components/ui/crypto-icon';
import { supabase } from '@/lib/supabase-browser';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { Breadcrumbs } from '@/app/components/ui/breadcrumbs';

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

  const fetchNewPayments = useCallback(async (merchantId: string) => {
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
  }, []);

  const fetchStats = useCallback(async (merchantId: string) => {
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
  }, [fetchNewPayments]);

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#7f5efd]"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const businessName = user.user_metadata?.business_name || user.email?.split('@')[0] || 'Your Business';
  return (
    <div className="space-y-8">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { name: 'Dashboard', href: '/merchant/dashboard' }
          ]} 
        />
        
        {/* Enhanced Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-2">
            <h1 className="heading-xl text-gray-900">
              Welcome back, {businessName}!
            </h1>
            <p className="text-body-lg text-gray-600 font-medium">
              Here&apos;s what&apos;s happening with your cryptocurrency payments today.
            </p>
          </div>
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/merchant/dashboard/payments')}
              className="flex items-center gap-3"
              size="lg"
            >
              <LinkIcon className="h-5 w-5" />
              Manage Payments
            </Button>
          </div>
        </div>

        {/* Enhanced New Payments Alert */}
        {newPayments.length > 0 && (
          <Alert className="border-green-200 bg-green-50 shadow-lg">
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <span className="text-body-lg font-semibold text-green-900">
                    You have {newPayments.length} new payment{newPayments.length > 1 ? 's' : ''}!
                  </span>
                </div>
                <Button size="sm" variant="default" onClick={markPaymentsSeen}>
                  Mark as seen
                </Button>
              </div>
              <ul className="mt-4 space-y-2">
                {newPayments.map(p => (
                  <li key={p.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-900">
                        {formatCurrency(p.amount, p.currency)}
                      </span>
                    </div>
                    <span className="text-sm text-green-700">
                      {new Date(p.created_at).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Enhanced Trial Banner */}
        {trialEnd && (
          <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 shadow-lg">
            <CardContent className="pt-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-full">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-orange-900 mb-1">Free Trial Active</h3>
                  <p className="text-body text-orange-700">
                    Your trial ends on {new Date(trialEnd).toLocaleDateString()}. $99 One-time setup fee + $19/mo subscription will be charged to continue accepting crypto payments.
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-900">Ends in</div>
                    <div className="text-lg font-semibold text-orange-700">{trialCountdown}</div>
                  </div>
                  <Link href="/merchant/settings" className="text-sm text-orange-700 underline font-medium">
                    Cancel Subscription
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="card-hover border-2 border-[#7f5efd] shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg font-bold text-gray-900">Total Revenue</CardTitle>
              <div className="p-3 bg-[#7f5efd] rounded-full">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2 text-[#7f5efd]">${stats.totalRevenue.toFixed(2)}</div>
              <div className="flex items-center gap-2 text-gray-600">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">Growing steadily</span>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border-2 border-[#7f5efd] shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg font-bold text-gray-900">Payment Links</CardTitle>
              <div className="p-3 bg-[#7f5efd] rounded-full">
                <LinkIcon className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2 text-[#7f5efd]">{stats.paymentLinks}</div>
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="h-4 w-4" />
                <span className="text-sm">Active links</span>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border-2 border-[#7f5efd] shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg font-bold text-gray-900">Successful Payments</CardTitle>
              <div className="p-3 bg-[#7f5efd] rounded-full">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2 text-[#7f5efd]">{stats.successfulPayments}</div>
              <div className="flex items-center gap-2 text-gray-600">
                <Zap className="h-4 w-4" />
                <span className="text-sm">Completed transactions</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Enhanced Quick Actions */}
          <Card className="card-hover shadow-lg">
            <CardHeader id="quick-actions">
              <CardTitle className="text-xl font-bold">Quick Actions</CardTitle>
              <CardDescription className="text-body">
                Get started with accepting cryptocurrency payments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => router.push('/merchant/dashboard/payments/create')}
                className="w-full justify-start h-auto p-6"
                variant="outline"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Plus className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-lg">Create Payment Link</div>
                    <div className="text-sm text-gray-500">Generate a link to accept crypto payments</div>
                  </div>
                </div>
              </Button>

              <Button
                onClick={() => router.push('/smart-terminal')}
                className="w-full justify-start h-auto p-6"
                variant="outline"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <CreditCard className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-lg">Smart Terminal</div>
                    <div className="text-sm text-gray-500">Accept in-person crypto payments</div>
                  </div>
                </div>
              </Button>

              <Button
                onClick={() => router.push('/merchant/subscriptions/create')}
                className="w-full justify-start h-auto p-6"
                variant="outline"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-lg">Create Subscription</div>
                    <div className="text-sm text-gray-500">Set up a recurring payment plan</div>
                  </div>
                </div>
              </Button>
            </CardContent>
          </Card>

          {/* Enhanced Recent Activity */}
          <Card className="card-hover shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Recent Activity</CardTitle>
              <CardDescription className="text-body">
                Your latest payment link activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-4 bg-gray-100 rounded-full mb-6">
                    <Calendar className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">No activity yet</h3>
                  <p className="text-body text-gray-500 mb-6 max-w-sm">
                    Create your first payment link to start seeing activity here.
                  </p>
                  <Button
                    onClick={() => router.push('/merchant/dashboard/payments/create')}
                    size="lg"
                  >
                    Get Started
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentTransactions.map(tx => (
                    <div key={tx.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <DollarSign className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-bold text-lg">{formatCurrency(tx.amount, tx.currency)}</p>
                          <p className="text-sm text-gray-500">{new Date(tx.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">{tx.currency}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Supported Cryptocurrencies */}
        <Card className="card-hover shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Cryptocurrencies you currently accept</CardTitle>
            <CardDescription className="text-body">
              Accept payments in these popular cryptocurrencies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {supportedCurrencies.map((crypto) => (
                <div key={crypto.symbol} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-[#7f5efd] hover:shadow-md transition-all duration-200">
                  <CryptoIcon currency={crypto.symbol} className="h-10 w-10" />
                  <div>
                    <div className="font-bold text-sm">{crypto.symbol}</div>
                    <div className="text-xs text-gray-500">{crypto.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Getting Started Guide */}
        <Card className="card-hover shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Getting Started</CardTitle>
            <CardDescription className="text-body">
              Follow these steps to start accepting cryptocurrency payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {steps.map(step => (
                <div key={step.id} className="flex items-start gap-6">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                    step.completed 
                      ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg' 
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {step.completed ? <CheckCircle className="h-6 w-6" /> : step.id}
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-lg font-bold mb-2 ${step.completed ? 'text-gray-900' : 'text-gray-400'}`}>
                      {step.title}
                    </h4>
                    <p className={`text-body ${step.completed ? 'text-gray-600' : 'text-gray-400'}`}>
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          </Card>
    </div>
  );
}

