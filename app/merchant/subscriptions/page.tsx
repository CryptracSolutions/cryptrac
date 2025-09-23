'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useTimezone } from '@/lib/contexts/TimezoneContext';
import { formatDateShort } from '@/lib/utils/date-utils';
import Link from 'next/link';
import { supabase, makeAuthenticatedRequest } from '@/lib/supabase-browser';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Breadcrumbs } from '@/app/components/ui/breadcrumbs';
import { useIsMobile } from '@/lib/hooks/use-mobile';
import { usePullToRefresh } from '@/lib/hooks/use-pull-to-refresh';
import { useSwipeActions } from '@/lib/hooks/use-swipe-actions';
import {
  MobileDataCard,
  MobileDataCardActions,
  MobileDataCardHeader,
  MobileDataCardMeta,
  MobileDataCardMetaItem,
  MobileDataCardSubtitle,
  MobileDataCardTitle,
} from '@/app/components/ui/mobile-data-card';
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
} from '@/app/components/ui/bottom-sheet';
import { cn } from '@/lib/utils';

import {
  Search,
  Plus,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  Eye,
  Edit,
  MoreHorizontal,
  Download,
  BarChart3,
  CreditCard,
  Receipt,
  Filter,
  Pause,
  Play
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
  const [, setUser] = useState<Record<string, unknown> | null>(null);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [filteredSubs, setFilteredSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isFilterSheetOpen, setFilterSheetOpen] = useState(false);
  const [swipedCardId, setSwipedCardId] = useState<string | null>(null);
  const { timezone } = useTimezone();
  const isMobile = useIsMobile();
  const listRef = useRef<HTMLDivElement>(null);

  const loadSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
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
  }, []);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  // Pull-to-refresh for mobile
  const { pullDistance, isRefreshing } = usePullToRefresh({
    onRefresh: loadSubscriptions,
    enabled: isMobile && !loading,
  });

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

  // Mobile subscription card component
  const MobileSubscriptionCard = ({ subscription }: { subscription: Subscription }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const isSwiped = swipedCardId === subscription.id;

    useSwipeActions(cardRef, {
      enabled: isMobile && !loading,
      threshold: 80,
      restraint: 120,
      onSwipeLeft: () => setSwipedCardId(isSwiped ? null : subscription.id),
      onSwipeRight: () => setSwipedCardId(null),
    });

    return (
      <MobileDataCard
        ref={cardRef}
        className={cn(
          'transition-shadow duration-200',
          'max-md:space-y-3 max-md:p-5 max-md:rounded-3xl',
          isSwiped && 'ring-1 ring-[#7f5efd]/40 shadow-md'
        )}
        onClick={() => {
          if (!isSwiped && isMobile) {
            setSwipedCardId(subscription.id);
          }
        }}
      >
        <MobileDataCardHeader className="gap-3 max-md:gap-4">
          <div className="space-y-1">
            <MobileDataCardTitle className="text-base max-md:text-sm">
              {subscription.title}
            </MobileDataCardTitle>
            <MobileDataCardSubtitle className="text-sm font-semibold text-[#7f5efd] max-md:text-base">
              ${subscription.amount} {subscription.currency}
            </MobileDataCardSubtitle>
            <MobileDataCardSubtitle className="max-md:text-xs">
              Every {subscription.interval_count} {subscription.interval}
              {subscription.interval_count > 1 ? 's' : ''}
            </MobileDataCardSubtitle>
          </div>
          <Badge
            variant={getStatusVariant(subscription.status)}
            className="font-capsule text-xs"
          >
            {subscription.status}
          </Badge>
        </MobileDataCardHeader>

        <MobileDataCardMeta className="max-md:grid-cols-2 max-md:gap-3">
          <MobileDataCardMetaItem
            label="Customer"
            value={subscription.name || subscription.email || 'No info'}
            className="max-md:space-y-1"
          />
          <MobileDataCardMetaItem
            label="Next Billing"
            value={subscription.next_billing_at
              ? formatDateShort(subscription.next_billing_at, timezone)
              : 'Not scheduled'
            }
            className="max-md:space-y-1"
          />
          {subscription.missed_payments_count && subscription.missed_payments_count > 0 && (
            <MobileDataCardMetaItem
              label="Missed Payments"
              value={subscription.missed_payments_count}
              accent={true}
              className="max-md:space-y-1"
            />
          )}
          {subscription.subscription_invoices && subscription.subscription_invoices.length > 0 && (
            <MobileDataCardMetaItem
              label="Recent Invoices"
              value={`${subscription.subscription_invoices.length} invoices`}
              className="max-md:space-y-1"
            />
          )}
        </MobileDataCardMeta>

        {isSwiped && (
          <MobileDataCardActions className="pt-1">
            <Link href={`/merchant/subscriptions/${subscription.id}`} className="w-full">
              <Button
                variant="default"
                size="sm"
                className="w-full flex items-center gap-2 max-md:h-12"
              >
                <Eye className="h-4 w-4" />
                View Details
              </Button>
            </Link>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 max-md:h-12"
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Implement pause/resume
                }}
              >
                {subscription.status === 'active' ? (
                  <><Pause className="h-4 w-4" /> Pause</>
                ) : (
                  <><Play className="h-4 w-4" /> Resume</>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 max-md:h-12"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </div>
          </MobileDataCardActions>
        )}
      </MobileDataCard>
    );
  };



    if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#7f5efd]"></div>
      </div>
    );
  }

  return (
    <>
      {/* Pull-to-refresh indicator for mobile */}
      {isMobile && (
        <div
          className="md:hidden text-center text-xs text-gray-500 transition-all duration-150"
          style={{
            transform: `translateY(${Math.min(pullDistance, 60)}px)`,
            opacity: isRefreshing ? 1 : pullDistance / 60,
            height: isRefreshing ? '40px' : '0px',
            overflow: 'hidden',
          }}
        >
          {isRefreshing ? (
            <div className="flex items-center justify-center gap-2 py-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#7f5efd]" />
              <span>Refreshing subscriptions...</span>
            </div>
          ) : (
            pullDistance > 30 && <div className="py-2">Pull to refresh</div>
          )}
        </div>
      )}

      <div className={cn(
        "px-6 py-8 space-y-8 max-w-7xl mx-auto",
        "max-md:px-4 max-md:py-6 max-md:space-y-6 max-md:pb-24"
      )}>
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { name: 'Dashboard', href: '/merchant/dashboard' },
            { name: 'Subscriptions', href: '/merchant/subscriptions' }
          ]} 
        />
        
        {/* Enhanced Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 max-md:gap-4">
          <div className="space-y-2 max-md:space-y-1">
            <h1 className="font-phonic text-3xl font-normal tracking-tight text-gray-900 mb-4 max-md:mb-2 max-md:text-2xl">
              Subscriptions
            </h1>
            <p className="font-phonic text-base font-normal text-gray-600 max-md:text-sm">
              Manage recurring payments and customer subscriptions
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/merchant/subscriptions/create">
              <Button className="flex items-center gap-2 font-medium bg-[#7f5efd] hover:bg-[#6b4fd8] text-white">
                <Plus className="h-4 w-4" />
                Create Subscription
              </Button>
            </Link>
          </div>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-md:gap-3">
          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 max-md:border-[#7f5efd]/20 max-md:shadow-none max-md:rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 max-md:pb-1">
              <CardTitle className="font-phonic text-sm font-semibold text-gray-900 max-md:text-xs">Active</CardTitle>
              <div className="p-2 bg-[#7f5efd] rounded-lg max-md:p-1.5">
                <CreditCard className="h-4 w-4 text-white max-md:h-3.5 max-md:w-3.5" />
              </div>
            </CardHeader>
            <CardContent className="pt-0 max-md:pt-1">
              <div className="text-2xl font-semibold mb-2 text-[#7f5efd] max-md:text-xl max-md:mb-1">
                {subs.filter(s => s.status === 'active').length}
              </div>
              <div className="flex items-center gap-1 text-gray-600">
                <TrendingUp className="h-3 w-3" />
                <span className="font-capsule text-xs max-md:text-[11px]">Currently active</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 max-md:border-[#7f5efd]/20 max-md:shadow-none max-md:rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 max-md:pb-1">
              <CardTitle className="font-phonic text-sm font-semibold text-gray-900 max-md:text-xs">Revenue</CardTitle>
              <div className="p-2 bg-[#7f5efd] rounded-lg max-md:p-1.5">
                <DollarSign className="h-4 w-4 text-white max-md:h-3.5 max-md:w-3.5" />
              </div>
            </CardHeader>
            <CardContent className="pt-0 max-md:pt-1">
              <div className="text-2xl font-semibold mb-2 text-[#7f5efd] max-md:text-xl max-md:mb-1">
                ${subs.filter(s => s.status === 'active').reduce((sum, s) => sum + s.amount, 0).toFixed(0)}
              </div>
              <div className="flex items-center gap-1 text-gray-600">
                <TrendingUp className="h-3 w-3" />
                <span className="font-capsule text-xs max-md:text-[11px]">Monthly</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 max-md:border-[#7f5efd]/20 max-md:shadow-none max-md:rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 max-md:pb-1">
              <CardTitle className="font-phonic text-sm font-semibold text-gray-900 max-md:text-xs">Customers</CardTitle>
              <div className="p-2 bg-[#7f5efd] rounded-lg max-md:p-1.5">
                <Users className="h-4 w-4 text-white max-md:h-3.5 max-md:w-3.5" />
              </div>
            </CardHeader>
            <CardContent className="pt-0 max-md:pt-1">
              <div className="text-2xl font-semibold mb-2 text-[#7f5efd] max-md:text-xl max-md:mb-1">
                {new Set(subs.map(s => s.customer_id)).size}
              </div>
              <div className="flex items-center gap-1 text-gray-600">
                <Users className="h-3 w-3" />
                <span className="font-capsule text-xs max-md:text-[11px]">Unique</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 max-md:border-[#7f5efd]/20 max-md:shadow-none max-md:rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 max-md:pb-1">
              <CardTitle className="font-phonic text-sm font-semibold text-gray-900 max-md:text-xs">Success</CardTitle>
              <div className="p-2 bg-[#7f5efd] rounded-lg max-md:p-1.5">
                <TrendingUp className="h-4 w-4 text-white max-md:h-3.5 max-md:w-3.5" />
              </div>
            </CardHeader>
            <CardContent className="pt-0 max-md:pt-1">
              <div className="text-2xl font-semibold mb-2 text-[#7f5efd] max-md:text-xl max-md:mb-1">
                {subs.length > 0 ? Math.round((subs.filter(s => s.status === 'active').length / subs.length) * 100) : 0}%
              </div>
              <div className="flex items-center gap-1 text-gray-600">
                <BarChart3 className="h-3 w-3" />
                <span className="font-capsule text-xs max-md:text-[11px]">Active rate</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Desktop Filters and Search */}
        <Card className="hidden md:block border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="p-6">
            <CardTitle className="font-phonic text-xl font-semibold text-gray-900">Filters & Search</CardTitle>
            <CardDescription className="font-capsule text-sm text-gray-600">
              Find and filter your subscriptions
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search subscriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                />
              </div>
              <div>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value)}
                >
                  <SelectTrigger className="w-full h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="font-capsule text-base font-normal">All Statuses</SelectItem>
                    <SelectItem value="active" className="font-capsule text-base font-normal">Active</SelectItem>
                    <SelectItem value="paused" className="font-capsule text-base font-normal">Paused</SelectItem>
                    <SelectItem value="cancelled" className="font-capsule text-base font-normal">Cancelled</SelectItem>
                    <SelectItem value="completed" className="font-capsule text-base font-normal">Completed</SelectItem>
                  </SelectContent>
                </Select>
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

        {/* Mobile Search and Filter Bar */}
        <div className="md:hidden space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Search subscriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 max-md:rounded-2xl"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setFilterSheetOpen(true)}
            className={cn(
              'w-full border border-gray-200 flex items-center justify-between rounded-2xl px-4 font-phonic text-sm',
              'max-md:h-12 max-md:text-sm'
            )}
          >
            <span className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters{statusFilter !== 'all' && ' • Active'}
            </span>
            <Badge variant="secondary" className="text-xs">
              {filteredSubs.length}
            </Badge>
          </Button>
        </div>

        {/* Subscriptions List */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7f5efd] max-md:h-10 max-md:w-10"></div>
          </div>
        ) : (
          <div className="space-y-6 max-md:space-y-3" ref={listRef}>
            {filteredSubs.length === 0 ? (
              <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-12">
                  <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <CreditCard className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="font-phonic text-lg font-semibold text-gray-900 mb-2">No Subscriptions Found</h3>
                    <p className="font-capsule text-sm text-gray-600 mb-6">
                      {searchTerm || statusFilter !== 'all' 
                        ? 'Try adjusting your search or filters to see more results.'
                        : 'Get started by creating your first subscription.'
                      }
                    </p>
                    {!searchTerm && statusFilter === 'all' && (
                      <Link href="/merchant/subscriptions/create">
                        <Button className="bg-[#7f5efd] hover:bg-[#7c3aed] text-white">
                          <Plus className="h-4 w-4 mr-2" />
                          Create First Subscription
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Desktop subscription cards */}
                <div className="hidden md:grid gap-6">
                  {filteredSubs.map((subscription) => (
                    <Card key={subscription.id} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="font-phonic text-lg font-semibold text-gray-900">{subscription.title}</h3>
                              <Badge
                                variant={getStatusVariant(subscription.status)}
                                className="font-capsule text-xs"
                              >
                                {subscription.status}
                              </Badge>
                              {subscription.missed_payments_count && subscription.missed_payments_count > 0 && (
                                <Badge variant="destructive" className="font-capsule text-xs">
                                  {subscription.missed_payments_count} missed
                                </Badge>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-gray-500" />
                                <span className="font-capsule text-xs text-gray-600">
                                  ${subscription.amount} {subscription.currency}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <span className="font-capsule text-xs text-gray-600">
                                  Every {subscription.interval_count} {subscription.interval}
                                  {subscription.interval_count > 1 ? 's' : ''}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-gray-500" />
                                <span className="font-capsule text-xs text-gray-600">
                                  {subscription.name || subscription.email || 'No customer info'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <span className="font-capsule text-xs text-gray-600">
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
                                  <span className="font-phonic text-sm font-semibold text-gray-900">Recent Invoices</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {subscription.subscription_invoices.slice(0, 3).map((invoice, index) => (
                                    <Badge key={index} variant="outline" className="font-capsule text-xs">
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

                {/* Mobile subscription cards */}
                <div className="md:hidden space-y-3">
                  {filteredSubs.map((subscription) => (
                    <MobileSubscriptionCard key={subscription.id} subscription={subscription} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Filter Bottom Sheet for Mobile */}
      <BottomSheet open={isFilterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <BottomSheetContent className="md:hidden" onDismiss={() => setFilterSheetOpen(false)}>
          <BottomSheetHeader className="text-left">
            <BottomSheetTitle>Filter Subscriptions</BottomSheetTitle>
          </BottomSheetHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full h-12">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="pt-4 space-y-2">
              <Button
                onClick={() => setFilterSheetOpen(false)}
                className="w-full h-12 bg-[#7f5efd] hover:bg-[#6b4fd8] text-white"
              >
                Apply Filters
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setStatusFilter('all');
                  setFilterSheetOpen(false);
                }}
                className="w-full h-12"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </BottomSheetContent>
      </BottomSheet>

      {/* Floating Action Button for Mobile */}
      {isMobile && (
        <Link href="/merchant/subscriptions/create">
          <Button
            className={cn(
              'md:hidden fixed right-4 h-14 w-14 rounded-full shadow-lg shadow-[#7f5efd]/30 bg-[#7f5efd]',
              'hover:bg-[#7c3aed] focus-visible:ring-[#7f5efd]',
              'flex items-center justify-center z-40',
              'transition-all duration-200'
            )}
            style={{
              bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)',
            }}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </Link>
      )}
    </>
  );
}

