'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  Users, 
  Link as LinkIcon, 
  QrCode,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  ExternalLink,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { DashboardLayout } from '@/app/components/layout/dashboard-layout';
import { CryptoIcon } from '@/app/components/ui/crypto-icon';
import { supabase } from '@/lib/supabase-browser';

export default function MerchantDashboard() {
  const [user, setUser] = useState<{ email?: string; user_metadata?: { business_name?: string; trial_end?: string } } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          console.error('Authentication error:', error);
          router.push('/login');
          return;
        }

        setUser(user);
      } catch (error) {
        console.error('Failed to get user:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, [router]);

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
  const trialEnd = user.user_metadata?.trial_end;

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
              Here's what's happening with your cryptocurrency payments today.
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

        {/* Trial Banner */}
        {trialEnd && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-medium text-orange-900">Free Trial Active</p>
                  <p className="text-sm text-orange-700">
                    Your trial ends on {new Date(trialEnd).toLocaleDateString()}. 
                    Upgrade to continue accepting payments.
                  </p>
                </div>
                <Button variant="outline" size="sm" className="ml-auto">
                  Upgrade Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0.00</div>
              <p className="text-xs text-muted-foreground">
                <span className="inline-flex items-center text-green-600">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +0%
                </span>
                from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Payment Links</CardTitle>
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                <span className="inline-flex items-center text-blue-600">
                  <Plus className="h-3 w-3 mr-1" />
                  Create your first link
                </span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Successful Payments</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                <span className="inline-flex items-center text-green-600">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +0%
                </span>
                from last week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0%</div>
              <p className="text-xs text-muted-foreground">
                <span className="inline-flex items-center text-gray-500">
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                  No data yet
                </span>
              </p>
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
                className="w-full justify-start h-auto p-4"
                variant="outline"
                disabled
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <CreditCard className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">View Analytics</div>
                    <div className="text-sm text-gray-500">Coming in Phase 6</div>
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
              {[
                { symbol: 'BTC', name: 'Bitcoin' },
                { symbol: 'ETH', name: 'Ethereum' },
                { symbol: 'LTC', name: 'Litecoin' },
                { symbol: 'USDT', name: 'Tether' },
                { symbol: 'USDC', name: 'USD Coin' }
              ].map((crypto) => (
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
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <h4 className="font-medium">Create your first payment link</h4>
                  <p className="text-sm text-gray-600">Set up a payment link with your desired amount and accepted cryptocurrencies.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <h4 className="font-medium text-gray-400">Share with customers</h4>
                  <p className="text-sm text-gray-400">Send the link or QR code to your customers via email, social media, or your website.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <h4 className="font-medium text-gray-400">Receive payments</h4>
                  <p className="text-sm text-gray-400">Get notified when payments are received and track them in your dashboard.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

