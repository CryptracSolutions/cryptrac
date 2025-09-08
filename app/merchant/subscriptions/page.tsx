'use client';

import React, { useEffect, useState } from 'react';
import { useTimezone } from '@/lib/contexts/TimezoneContext';
import { formatDateShort } from '@/lib/utils/date-utils';
import Link from 'next/link';
import { supabase, makeAuthenticatedRequest } from '@/lib/supabase-browser';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { BackToDashboard } from '@/app/components/ui/back-to-dashboard';
import { Breadcrumbs } from '@/app/components/ui/breadcrumbs';

import { 
  Search, 
  Plus, 
  Filter, 
  Calendar, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Clock, 
  Eye,
  Edit,
  MoreHorizontal,
  RefreshCw,
  Download,
  BarChart3,
  CreditCard,
  Receipt
} from 'lucide-react';

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
  max_cycles: number | null;
  created_at: string;
  email?: string;
  phone?: string;
  name?: string;
  missed_payments_count?: number;
  tax_enabled?: boolean;
  tax_rates?: Array<{ name: string; rate: number }>;
  charge_customer_fee?: boolean;
  auto_convert_enabled?: boolean;
  subscription_invoices?: Array<{
    invoice_number: string;
    status: string;
    due_date: string;
    cycle_start_at: string;
    created_at: string;
  }>;
}

export default function MerchantSubscriptionsPage() {
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [filteredSubs, setFilteredSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { timezone } = useTimezone();

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user as unknown as Record<string, unknown>);
        }

        const res = await makeAuthenticatedRequest('/api/subscriptions');
        const json = await res.json();
        const list: Subscription[] = json.data || [];
        const ids = list.map(s => s.customer_id).filter(Boolean);
        if (ids.length > 0) {
          const { data: customers } = await supabase
            .from('customers')
            .select('id,email,phone,name')
            .in('id', ids as string[]);
          list.forEach(s => {
            const c = customers?.find(x => x.id === s.customer_id);
            s.email = c?.email || '';
            s.phone = c?.phone || '';
            s.name = c?.name || '';
          });
        }
        setSubs(list);
        setFilteredSubs(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    let filtered = subs;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    setFilteredSubs(filtered);
  }, [subs, searchTerm, statusFilter]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'paused': return 'secondary';
      case 'completed': return 'outline';
      case 'canceled': return 'destructive';
      default: return 'secondary';
    }
  };



    if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#7f5efd]"></div>
      </div>
    );
  }

  return (
      <div className="space-y-8">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { name: 'Dashboard', href: '/merchant/dashboard' },
            { name: 'Subscriptions', href: '/merchant/subscriptions' }
          ]} 
        />
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <BackToDashboard />
            </div>
            <h1 className="font-phonic text-3xl font-normal tracking-tight text-gray-900 mb-4">Subscriptions</h1>
            <p className="font-phonic text-base font-normal text-gray-600 mt-2">Manage recurring payments and customer subscriptions</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 font-medium"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Link href="/merchant/subscriptions/create">
              <Button className="flex items-center gap-2 font-medium bg-[#7f5efd] hover:bg-[#6b4fd8] text-white">
                <Plus className="h-4 w-4" />
                Create Subscription
              </Button>
            </Link>
          </div>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 bg-white group">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#7f5efd] to-[#7c3aed] rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-phonic text-sm font-normal text-gray-600">Active Subscriptions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {subs.filter(s => s.status === 'active').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 bg-white group">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#7f5efd] to-[#7c3aed] rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-phonic text-sm font-normal text-gray-600">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${subs.filter(s => s.status === 'active').reduce((sum, s) => sum + s.amount, 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 bg-white group">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#7f5efd] to-[#7c3aed] rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-phonic text-sm font-normal text-gray-600">Total Customers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {new Set(subs.map(s => s.customer_id)).size}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 bg-white group">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#7f5efd] to-[#7c3aed] rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-phonic text-sm font-normal text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {subs.length > 0 ? Math.round((subs.filter(s => s.status === 'active').length / subs.length) * 100) : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 bg-white group">
          <CardHeader className="pb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#7f5efd] to-[#7c3aed] rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
                <Filter className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">Filters & Search</CardTitle>
                <CardDescription className="text-base text-gray-600 mt-1">
                  Find and filter your subscriptions
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search subscriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input-enhanced pl-10 h-12 text-base focus:border-[#7f5efd] focus:ring-[#7f5efd]/20"
                />
              </div>
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="form-input-enhanced w-full h-12 px-3 border border-gray-300 rounded-md focus:border-[#7f5efd] focus:ring-[#7f5efd]/20 text-base"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="flex items-center gap-2 font-medium"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 font-medium"
                >
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscriptions List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7f5efd]"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredSubs.length === 0 ? (
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 bg-white group">
                <CardContent className="pt-12 pb-12">
                  <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <CreditCard className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="font-phonic text-2xl font-normal text-gray-900 mb-2">No Subscriptions Found</h3>
                    <p className="font-phonic text-base font-normal text-gray-600 mb-6">
                      {searchTerm || statusFilter !== 'all' 
                        ? 'Try adjusting your search or filters to see more results.'
                        : 'Get started by creating your first subscription.'
                      }
                    </p>
                    {!searchTerm && statusFilter === 'all' && (
                      <Link href="/merchant/subscriptions/create">
                        <Button className="bg-[#7f5efd] hover:bg-[#6b4fd8] text-white font-medium">
                          <Plus className="h-4 w-4 mr-2" />
                          Create First Subscription
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {filteredSubs.map((subscription) => (
                  <Card key={subscription.id} className="border-2 shadow-lg hover:shadow-xl transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="font-phonic text-2xl font-normal text-gray-900">{subscription.title}</h3>
                            <Badge
                              variant={getStatusVariant(subscription.status)}
                              className="text-xs font-medium"
                            >
                              {subscription.status}
                            </Badge>
                            {subscription.missed_payments_count && subscription.missed_payments_count > 0 && (
                              <Badge variant="destructive" className="text-xs font-medium">
                                {subscription.missed_payments_count} missed
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                ${subscription.amount} {subscription.currency}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                Every {subscription.interval_count} {subscription.interval}
                                {subscription.interval_count > 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                {subscription.name || subscription.email || 'No customer info'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                {subscription.next_billing_at 
                                  ? formatDateShort(subscription.next_billing_at, timezone)
                                  : 'No next billing'
                                }
                              </span>
                            </div>
                          </div>

                          {subscription.subscription_invoices && subscription.subscription_invoices.length > 0 && (
                            <div className="bg-gray-50 rounded-lg p-3 mb-4">
                              <div className="flex items-center gap-2 mb-2">
                                <Receipt className="h-4 w-4 text-gray-500" />
                                <span className="font-phonic text-sm font-normal text-gray-700">Recent Invoices</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {subscription.subscription_invoices.slice(0, 3).map((invoice, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {invoice.invoice_number} - {invoice.status}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <Link href={`/merchant/subscriptions/${subscription.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
  );
}

