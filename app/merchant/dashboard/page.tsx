'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  CreditCard, 
  Plus, 
  QrCode, 
  Link as LinkIcon,
  BarChart3,
  Calendar,
  ArrowUpRight,
  Bitcoin,
  Wallet
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { DashboardLayout } from '@/app/components/layout/dashboard-layout';
import { CryptoIcon } from '@/app/components/ui/crypto-icon';
import { createBrowserClient } from '@/lib/supabase-browser';

export default function MerchantDashboard() {
  const [user, setUser] = useState<{ email?: string; user_metadata?: { business_name?: string; trial_end?: string } } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      } else {
        router.push('/login');
      }
      setLoading(false);
    };
    getUser();
  }, [router, supabase.auth]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Mock data for demonstration
  const stats = [
    {
      title: "Total Revenue",
      value: "$12,345.67",
      change: "+12.5%",
      changeType: "positive" as const,
      icon: DollarSign,
    },
    {
      title: "Transactions",
      value: "156",
      change: "+8.2%",
      changeType: "positive" as const,
      icon: CreditCard,
    },
    {
      title: "Customers",
      value: "89",
      change: "+23.1%",
      changeType: "positive" as const,
      icon: Users,
    },
    {
      title: "Conversion Rate",
      value: "3.2%",
      change: "-0.5%",
      changeType: "negative" as const,
      icon: TrendingUp,
    },
  ];

  const recentTransactions = [
    {
      id: "1",
      amount: "$125.50",
      currency: "BTC",
      customer: "john@example.com",
      status: "completed",
      date: "2 hours ago"
    },
    {
      id: "2", 
      amount: "$89.99",
      currency: "ETH",
      customer: "sarah@example.com",
      status: "pending",
      date: "4 hours ago"
    },
    {
      id: "3",
      amount: "$250.00",
      currency: "LTC",
      customer: "mike@example.com", 
      status: "completed",
      date: "1 day ago"
    },
  ];

  const quickActions = [
    {
      title: "Create Payment Link",
      description: "Generate a shareable payment link",
      icon: LinkIcon,
      href: "/merchant/dashboard/payments/create",
      color: "bg-blue-500"
    },
    {
      title: "Generate QR Code",
      description: "Create QR code for in-person payments",
      icon: QrCode,
      href: "/merchant/dashboard/payments/create",
      color: "bg-green-500"
    },
    {
      title: "View Analytics",
      description: "Detailed payment analytics",
      icon: BarChart3,
      href: "/merchant/dashboard/analytics",
      color: "bg-purple-500"
    },
    {
      title: "Manage Wallets",
      description: "Configure cryptocurrency wallets",
      icon: Wallet,
      href: "/merchant/dashboard/wallets",
      color: "bg-orange-500"
    },
  ];

  const trialDaysLeft = user.user_metadata?.trial_end ? 
    Math.max(0, Math.ceil((new Date(user.user_metadata.trial_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0;

  return (
    <DashboardLayout user={user}>
      <div className="p-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user.user_metadata?.business_name || 'there'}!
              </h1>
              <p className="text-muted-foreground mt-1">
                Here&apos;s what&apos;s happening with your crypto payments today.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {trialDaysLeft > 0 && (
                <Badge variant="warning" className="text-sm">
                  {trialDaysLeft} days left in trial
                </Badge>
              )}
              <Button asChild>
                <Link href="/merchant/dashboard/payments/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Payment
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <span className={`inline-flex items-center ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.changeType === 'positive' ? '↗' : '↘'} {stat.change}
                  </span>
                  <span className="ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common tasks to manage your payments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {quickActions.map((action, index) => (
                  <Link
                    key={index}
                    href={action.href}
                    className="flex items-center p-3 rounded-lg border hover:bg-accent transition-colors group"
                  >
                    <div className={`p-2 rounded-md ${action.color} text-white mr-3`}>
                      <action.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm group-hover:text-primary">
                        {action.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {action.description}
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>
                    Your latest cryptocurrency payments
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/merchant/dashboard/transactions">
                    View All
                    <ArrowUpRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CryptoIcon currency={transaction.currency} size="sm" />
                        <div>
                          <div className="font-medium">{transaction.amount}</div>
                          <div className="text-sm text-muted-foreground">
                            {transaction.customer}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={transaction.status === 'completed' ? 'confirmed' : 'pending'}
                          className="mb-1"
                        >
                          {transaction.status}
                        </Badge>
                        <div className="text-sm text-muted-foreground">
                          {transaction.date}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {recentTransactions.length === 0 && (
                    <div className="text-center py-8">
                      <Bitcoin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-medium text-lg mb-2">No transactions yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Create your first payment link to start accepting crypto payments.
                      </p>
                      <Button asChild>
                        <Link href="/merchant/dashboard/payments/create">
                          Create Payment Link
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Trial Notice */}
        {trialDaysLeft > 0 && (
          <Card className="mt-8 border-warning bg-warning/5">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-warning/10 rounded-full">
                  <Calendar className="h-5 w-5 text-warning-600" />
                </div>
                <div>
                  <h3 className="font-medium">Trial Period Active</h3>
                  <p className="text-sm text-muted-foreground">
                    You have {trialDaysLeft} days left in your free trial. Upgrade to continue using Cryptrac after your trial ends.
                  </p>
                </div>
              </div>
              <Button variant="outline" asChild>
                <Link href="/merchant/dashboard/billing">
                  Upgrade Now
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

export const dynamic = 'force-dynamic';

