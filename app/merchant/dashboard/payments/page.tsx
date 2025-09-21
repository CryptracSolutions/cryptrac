'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTimezone } from '@/lib/contexts/TimezoneContext';
import { formatDateTime } from '@/lib/utils/date-utils';

export const dynamic = 'force-dynamic';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { 
  Plus,
  ExternalLink,
  Copy,
  Eye,
  DollarSign,
  CreditCard,
  TrendingUp,
  Link as LinkIcon,
  Play,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  BarChart3,
  Calendar,
  Users,
  Zap,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase, makeAuthenticatedRequest } from '@/lib/supabase-browser';
import { Breadcrumbs } from '@/app/components/ui/breadcrumbs';
import { LazyMount } from '@/app/components/ui/lazy-mount';
import { cn } from '@/lib/utils';
import { usePullToRefresh } from '@/lib/hooks/use-pull-to-refresh';
import { useSwipeActions } from '@/lib/hooks/use-swipe-actions';
import { useIsMobile } from '@/lib/hooks/use-mobile';
import {
  MobileDataCard,
  MobileDataCardActions,
  MobileDataCardHeader,
  MobileDataCardMeta,
  MobileDataCardMetaItem,
  MobileDataCardSubtitle,
  MobileDataCardTitle,
} from '@/app/components/ui/mobile-data-card';

interface PaymentLink {
  id: string;
  link_id: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  status: 'active' | 'expired' | 'completed' | 'paused';
  created_at: string;
  expires_at?: string;
  max_uses?: number;
  usage_count: number;
  confirmed_payment_count: number;
  qr_code_data?: string;
  _status_info?: {
    stored_status: string;
    calculated_status: string;
    is_single_use: boolean;
    usage_vs_max: string;
    is_expired: boolean;
  };
  source?: string | null;
  subscription_id?: string | null;
  subscription_invoices?: Array<{
    invoice_number: string;
    status: string;
    due_date: string;
    cycle_start_at: string;
  }> | null;
}

interface Statistics {
  total_links: number;
  active_links: number;
  completed_links: number;
  expired_links: number;
  paused_links: number;
  single_use_links: number;
  total_payments: number;
  total_revenue: number;
}

interface ApiResponse {
  success: boolean;
  data: {
    payment_links: PaymentLink[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    statistics: Statistics;
  };
}

export default function PaymentsPage() {
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    total_links: 0,
    active_links: 0,
    completed_links: 0,
    expired_links: 0,
    paused_links: 0,
    single_use_links: 0,
    total_payments: 0,
    total_revenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState<string | null>(null);
  const [swipedLinkId, setSwipedLinkId] = useState<string | null>(null);
  const notifiedLinksRef = useRef<Set<string>>(new Set());
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    links: false,
    pos: false,
    subscriptions: false,
  });

  const toggleSection = (key: string) =>
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  const router = useRouter();
  const { timezone } = useTimezone();
  const isMobile = useIsMobile();

  const fetchPaymentLinks = useCallback(async (options?: { silent?: boolean }) => {
    try {
      console.log('Fetching payment links...');
      if (!options?.silent) {
        setLoading(true);
      }
      setError(null);

      // Check authentication using singleton client
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('Authentication failed:', userError);
        setError('Authentication required. Please log in.');
        router.push('/login');
        return;
      }

      console.log('User authenticated:', user.id);

      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(dateRange !== 'all' && { date_range: dateRange })
      });

      console.log('Making authenticated API request...');

      // Make authenticated API call using helper function
      const response = await makeAuthenticatedRequest(`/api/payments?${params}`);

      console.log('Response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          setError('Session expired. Please log in again.');
          router.push('/login');
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ApiResponse = await response.json();
      console.log('API response received:', data.success);

      if (data.success) {
        setPaymentLinks(data.data.payment_links || []);
        (data.data.payment_links || []).forEach(link => {
          if (link.usage_count > 0 && !notifiedLinksRef.current.has(link.id)) {
            console.log(`📧 [Simulation] Payment received for "${link.title}"`);
            notifiedLinksRef.current.add(link.id);
          }
        });
        setStatistics(data.data.statistics || {
          total_links: 0,
          active_links: 0,
          completed_links: 0,
          expired_links: 0,
          paused_links: 0,
          single_use_links: 0,
          total_payments: 0,
          total_revenue: 0
        });
        setTotalPages(data.data.pagination?.pages || 1);
        console.log('Successfully loaded', data.data.payment_links?.length || 0, 'payment links');
      } else {
        throw new Error('Failed to fetch payment links');
      }

    } catch (error) {
      console.error('Error fetching payment links:', error);
      setError('Failed to load payment links');
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
      setSwipedLinkId(null);
    }
  }, [currentPage, statusFilter, dateRange, router]);

  const { pullDistance, isRefreshing: isPullRefreshing } = usePullToRefresh({
    enabled: isMobile,
    threshold: 60,
    onRefresh: () => fetchPaymentLinks({ silent: true }),
  });

  useEffect(() => {
    fetchPaymentLinks();
  }, [fetchPaymentLinks]);

  const updatePaymentLinkStatus = async (linkId: string, newStatus: string, reason?: string) => {
    try {
      setStatusUpdateLoading(linkId);

      const response = await makeAuthenticatedRequest(`/api/payments/${linkId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus, reason: reason ?? null })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to update payment link status');
      }

      const result = await response.json();
      console.log('Status updated:', result);

      // Refresh the payment links
      await fetchPaymentLinks({ silent: true });

    } catch (error) {
      console.error('Error updating status:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to update payment link status');
      }
    } finally {
      setStatusUpdateLoading(null);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getPaymentUrl = (linkId: string) => {
    return `${window.location.origin}/pay/${linkId}`;
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return formatDateTime(dateString, timezone);
  };

  const getStatusBadges = (status: string, link?: PaymentLink) => {
    const variants = {
      active: { variant: 'default' as const, color: 'bg-green-100 text-green-800' },
      expired: { variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800' },
      completed: { variant: 'outline' as const, color: 'bg-blue-100 text-blue-800' },
      paused: { variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' }
    };

    const config = variants[status as keyof typeof variants] || variants.active;

    const badges: React.ReactNode[] = [
      <Badge key="status" variant={config.variant} className={config.color}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    ];

    if (link?.max_uses === 1) {
      badges.push(
        <Badge key="single-use" variant="outline" className="text-xs">
          Single Use
        </Badge>
      );
    }

    return badges;
  };

  const getStatusActions = (link: PaymentLink) => {
    const actions = [];

    if (link.status === 'active') {
      actions.push(
        <Button
          key="complete"
          variant="outline"
          size="sm"
          onClick={() => updatePaymentLinkStatus(link.id, 'completed', 'Manually completed by merchant')}
          disabled={statusUpdateLoading === link.id}
          className="flex items-center gap-1 max-md:w-full max-md:justify-center"
        >
          <CheckCircle className="h-3 w-3" />
          Complete
        </Button>
      );
    }

    // UPDATED: Only show reactivate for expired Payment Links (not POS sales)
    if (link.status === 'expired' && link.source !== 'pos') {
      actions.push(
        <Button
          key="reactivate"
          variant="outline"
          size="sm"
          onClick={() => updatePaymentLinkStatus(link.id, 'active', 'Reactivated by merchant')}
          disabled={statusUpdateLoading === link.id}
          className="flex items-center gap-1 max-md:w-full max-md:justify-center"
        >
          <Play className="h-3 w-3" />
          Reactivate
        </Button>
      );
    }

    return actions;
  };

  // UPDATED: Function to determine which action buttons to show based on status and source
  const getActionButtons = (link: PaymentLink) => {
    const buttons = [];

    // Determine if we should show the Copy button
    const shouldShowCopy = () => {
      // For POS sales: Don't show copy if completed or expired
      if (link.source === 'pos') {
        return link.status !== 'completed' && link.status !== 'expired';
      }
      
      // For Payment Links: Don't show copy if completed or expired
      return link.status !== 'completed' && link.status !== 'expired';
    };

    // Copy button (conditionally shown)
    if (shouldShowCopy()) {
      buttons.push(
        <Button
          key="copy"
          variant="outline"
          size="sm"
          onClick={() => copyToClipboard(getPaymentUrl(link.link_id), link.id)}
          className="flex items-center gap-1 max-md:w-full max-md:justify-center"
        >
          <Copy className="h-3 w-3" />
          {copiedId === link.id ? 'Copied!' : 'Copy'}
        </Button>
      );
    }

    // Open button (only for active links)
    if (link.status === 'active') {
      buttons.push(
        <Button
          key="open"
          variant="outline"
          size="sm"
          onClick={() => window.open(getPaymentUrl(link.link_id), '_blank')}
          className="flex items-center gap-1 max-md:w-full max-md:justify-center"
        >
          <ExternalLink className="h-3 w-3" />
          Open
        </Button>
      );
    }

    // View button (always shown)
    buttons.push(
      <Link key="view" href={`/merchant/dashboard/payments/${link.id}`}>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1 max-md:w-full max-md:justify-center"
        >
          <Eye className="h-3 w-3" />
          View
        </Button>
      </Link>
    );

    return buttons;
  };

  const enhanceMobileActions = (
    actions: React.ReactNode[],
    onActionComplete?: () => void
  ) =>
    actions.map((action, index) => {
      if (!React.isValidElement(action)) return action;

      const element = action as React.ReactElement<Record<string, unknown>>;

      if (element.type === Link) {
        const onlyChild = React.Children.only(element.props.children) as React.ReactElement<Record<string, unknown>>;
        if (React.isValidElement(onlyChild)) {
          const childOnClick = onlyChild.props?.onClick as
            | ((...args: unknown[]) => void)
            | undefined;
          const childClassName = typeof onlyChild.props?.className === 'string'
            ? (onlyChild.props.className as string)
            : undefined;

          const enhancedChild = React.cloneElement(onlyChild, {
            className: cn(
              'h-11 w-full justify-center gap-2 text-sm',
              childClassName
            ),
            onClick: (...args: unknown[]) => {
              childOnClick?.(...args);
              onActionComplete?.();
            },
          });

          return React.cloneElement(
            element,
            {
              key: element.key ?? `mobile-action-${index}`,
              className: cn('w-full', element.props?.className as string | undefined),
            },
            enhancedChild
          );
        }
      }

      const onClick = element.props?.onClick as
        | ((...args: unknown[]) => void)
        | undefined;
      const elementClassName = typeof element.props?.className === 'string'
        ? (element.props.className as string)
        : undefined;

      return React.cloneElement(element, {
        key: element.key ?? `mobile-action-${index}`,
        className: cn(
          'h-11 w-full justify-center gap-2 text-sm',
          elementClassName
        ),
        onClick: (...args: unknown[]) => {
          onClick?.(...args);
          onActionComplete?.();
        },
      });
    });

  type MobileMetaItem = {
    label: string;
    value: string;
    helper?: string;
    accent?: boolean;
  };

  const renderLink = (link: PaymentLink) => {
    const amountLabel = formatCurrency(link.amount, link.currency);
    const createdLabel = formatDate(link.created_at);

    const mobileMetaItems: MobileMetaItem[] = [
      {
        label: 'Amount',
        value: amountLabel,
        accent: true,
      },
      {
        label: 'Created',
        value: createdLabel,
      },
    ];

    if (link.expires_at) {
      mobileMetaItems.push({
        label: 'Expires',
        value: formatDate(link.expires_at),
      });
    }

    if (link.max_uses) {
      mobileMetaItems.push({
        label: 'Usage',
        value: `${link.usage_count}/${link.max_uses}`,
      });
    }

    mobileMetaItems.push({
      label: 'Payments',
      value: link.confirmed_payment_count.toString(),
      helper: 'Confirmed',
    });

    const mobileStatusActions = enhanceMobileActions(
      getStatusActions(link),
      () => setSwipedLinkId(null)
    );
    const mobileActionButtons = enhanceMobileActions(
      getActionButtons(link),
      () => setSwipedLinkId(null)
    );
    const isSwiped = swipedLinkId === link.id;

    return (
      <div key={link.id} className="space-y-3">
        <div className="hidden md:block">
          <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex-1 pr-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-[#7f5efd] rounded-lg">
                    <LinkIcon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-phonic text-lg font-semibold text-gray-900 mb-1">{link.title}</h3>
                    <div className="flex items-center gap-2">
                      {getStatusBadges(link.status, link)}
                      {(link.source === 'subscription' || link.subscription_id) && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          Subscription
                        </Badge>
                      )}
                      {link.confirmed_payment_count > 0 && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Payment received
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {link.description && (
                  <p className="font-capsule text-sm text-gray-600 mb-4">{link.description}</p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-green-100 rounded">
                      <DollarSign className="h-3 w-3 text-green-600" />
                    </div>
                    <span className="font-semibold text-base text-gray-900">
                      {amountLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-gray-100 rounded">
                      <Calendar className="h-3 w-3 text-gray-500" />
                    </div>
                    <span className="font-capsule text-xs text-gray-600">Created {createdLabel}</span>
                  </div>
                  {link.expires_at && (
                    <div className="flex items-center gap-2">
                      <div className="p-1 bg-gray-100 rounded">
                        <Clock className="h-3 w-3 text-gray-500" />
                      </div>
                      <span className="font-capsule text-xs text-gray-600">Expires {formatDate(link.expires_at)}</span>
                    </div>
                  )}
                  {link.max_uses && (
                    <div className="flex items-center gap-2">
                      <div className="p-1 bg-gray-100 rounded">
                        <Users className="h-3 w-3 text-gray-500" />
                      </div>
                      <span className="font-capsule text-xs text-gray-600">{link.usage_count}/{link.max_uses} uses</span>
                    </div>
                  )}
                </div>

                {link.subscription_invoices && link.subscription_invoices.length > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                    <BarChart3 className="h-3 w-3 text-blue-600" />
                    <span className="font-capsule text-xs font-medium text-blue-700">
                      Invoice: {link.subscription_invoices[0].invoice_number}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end gap-2 ml-4">
                <div className="flex items-center gap-2">
                  {getStatusActions(link)}
                </div>
                <div className="flex items-center gap-2">
                  {getActionButtons(link)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <MobilePaymentLinkCard
          link={link}
          amountLabel={amountLabel}
          description={link.description ?? undefined}
          createdLabel={createdLabel}
          metaItems={mobileMetaItems}
          statusActions={mobileStatusActions}
          actionButtons={mobileActionButtons}
          isSwiped={isSwiped}
          enableSwipe={isMobile}
          onSwipeLeft={() =>
            setSwipedLinkId((current) => (current === link.id ? null : link.id))
          }
          onSwipeRight={() =>
            setSwipedLinkId((current) => (current === link.id ? null : current))
          }
          showSubscriptionBadge={Boolean(link.source === 'subscription' || link.subscription_id)}
          showPaymentBadge={link.confirmed_payment_count > 0}
        />
      </div>
    );
  };

  interface MobilePaymentLinkCardProps {
    link: PaymentLink;
    amountLabel: string;
    description?: string;
    createdLabel: string;
    metaItems: MobileMetaItem[];
    statusActions: React.ReactNode[];
    actionButtons: React.ReactNode[];
    isSwiped: boolean;
    enableSwipe: boolean;
    onSwipeLeft: () => void;
    onSwipeRight: () => void;
    showSubscriptionBadge: boolean;
    showPaymentBadge: boolean;
  }

  const MobilePaymentLinkCard = ({
    link,
    amountLabel,
    description,
    createdLabel,
    metaItems,
    statusActions,
    actionButtons,
    isSwiped,
    enableSwipe,
    onSwipeLeft,
    onSwipeRight,
    showSubscriptionBadge,
    showPaymentBadge,
  }: MobilePaymentLinkCardProps) => {
    const cardRef = React.useRef<HTMLDivElement | null>(null);

    useSwipeActions(cardRef, {
      threshold: 80,
      enabled: enableSwipe,
      onSwipeLeft,
      onSwipeRight,
    });

    return (
      <MobileDataCard
        ref={cardRef}
        className={cn(
          'md:hidden space-y-4 transition-shadow duration-200',
          isSwiped && 'ring-1 ring-[#7f5efd]/40 shadow-md'
        )}
        data-swiped={isSwiped ? 'true' : 'false'}
      >
        <MobileDataCardHeader className="gap-3">
          <div className="space-y-1">
            <MobileDataCardTitle className="text-base">
              {link.title}
            </MobileDataCardTitle>
            <MobileDataCardSubtitle className="text-sm font-semibold text-[#7f5efd]">
              {amountLabel}
            </MobileDataCardSubtitle>
            {description ? (
              <MobileDataCardSubtitle>{description}</MobileDataCardSubtitle>
            ) : null}
            <MobileDataCardSubtitle className="text-[11px] text-gray-500">
              Created {createdLabel}
            </MobileDataCardSubtitle>
          </div>
          <div className="flex flex-col items-end gap-1 text-right">
            <div className="flex flex-wrap justify-end gap-2">
              {getStatusBadges(link.status, link)}
            </div>
            {showSubscriptionBadge && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Subscription
              </Badge>
            )}
            {showPaymentBadge && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Payment received
              </Badge>
            )}
          </div>
        </MobileDataCardHeader>

        <MobileDataCardMeta>
          {metaItems.map((item, index) => (
            <MobileDataCardMetaItem
              key={`${link.id}-mobile-meta-${index}`}
              label={item.label}
              value={item.value}
              helper={item.helper}
              accent={item.accent}
            />
          ))}
        </MobileDataCardMeta>

        {link.subscription_invoices && link.subscription_invoices.length > 0 && (
          <div className="flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2">
            <BarChart3 className="h-4 w-4 text-blue-600" />
            <p className="text-xs font-medium text-blue-700">
              Invoice: {link.subscription_invoices[0].invoice_number}
            </p>
          </div>
        )}

        {!isSwiped && (
          <p className="text-[11px] text-gray-500 text-center">
            Swipe left to manage
          </p>
        )}

        {isSwiped && statusActions.length > 0 && (
          <MobileDataCardActions>
            {statusActions}
          </MobileDataCardActions>
        )}

        {isSwiped && actionButtons.length > 0 && (
          <MobileDataCardActions className="pt-1">
            {actionButtons}
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

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <p className="font-capsule text-base font-normal text-red-600 mb-6">Error: {error}</p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => fetchPaymentLinks()} variant="outline" size="lg">
                Try Again
              </Button>
              <Button onClick={() => router.push('/login')} size="lg">
                Go to Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const groups = [
    {
      key: 'links',
      title: 'Payment Links',
      items: paymentLinks.filter(
        l => l.source !== 'pos' && l.source !== 'subscription'
      ),
    },
    {
      key: 'pos',
      title: 'Smart Terminal POS',
      items: paymentLinks.filter(l => l.source === 'pos'),
    },
    {
      key: 'subscriptions',
      title: 'Subscriptions',
      items: paymentLinks.filter(
        l => l.source === 'subscription' || l.subscription_id
      ),
    },
  ];

  return (
    <div className="px-6 py-8 space-y-8 max-w-7xl mx-auto">
      {/* Breadcrumbs */}
      <Breadcrumbs 
        items={[
          { name: 'Dashboard', href: '/merchant/dashboard' },
          { name: 'Payments', href: '/merchant/dashboard/payments' }
        ]} 
      />
      
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
        <div className="space-y-2">
          <h1 className="font-phonic text-3xl font-normal tracking-tight text-gray-900 mb-4">
            Payment Management
          </h1>
          <p className="font-phonic text-base font-normal text-gray-600">Generate, view and manage all payments</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/merchant/dashboard/payments/create">
            <Button size="default" className="w-full bg-[#7f5efd] hover:bg-[#7c3aed] text-white flex items-center justify-center gap-2">
              <Plus className="h-4 w-4" />
              Create Payment Link
            </Button>
          </Link>
          <Link href="/smart-terminal">
            <Button size="default" className="w-full bg-[#7f5efd] hover:bg-[#7c3aed] text-white flex items-center justify-center gap-2">
              <CreditCard className="h-4 w-4" />
              Open Smart Terminal
            </Button>
          </Link>
          <Link href="/merchant/subscriptions/create">
            <Button size="default" className="w-full bg-[#7f5efd] hover:bg-[#7c3aed] text-white flex items-center justify-center gap-2">
              <Plus className="h-4 w-4" />
              Create Subscription
            </Button>
          </Link>
          <Link href="/merchant/subscriptions">
            <Button size="default" className="w-full bg-[#7f5efd] hover:bg-[#7c3aed] text-white flex items-center justify-center gap-2">
              <Calendar className="h-4 w-4" />
              Manage Subscriptions
            </Button>
          </Link>
        </div>
      </div>

      {/* Enhanced Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-phonic text-sm font-semibold text-gray-900">Total Links</CardTitle>
            <div className="p-2 bg-[#7f5efd] rounded-lg">
              <LinkIcon className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-semibold mb-2 text-[#7f5efd]">{statistics.total_links}</div>
            <div className="flex items-center gap-1 text-gray-600">
              <BarChart3 className="h-3 w-3" />
              <span className="font-capsule text-xs">All payment links</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-phonic text-sm font-semibold text-gray-900">Active</CardTitle>
            <div className="p-2 bg-[#7f5efd] rounded-lg">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-semibold mb-2 text-[#7f5efd]">{statistics.active_links}</div>
            <div className="flex items-center gap-1 text-gray-600">
              <Zap className="h-3 w-3" />
              <span className="font-capsule text-xs">Accepting payments</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-phonic text-sm font-semibold text-gray-900">Completed</CardTitle>
            <div className="p-2 bg-[#7f5efd] rounded-lg">
              <CheckCircle className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-semibold mb-2 text-[#7f5efd]">{statistics.completed_links}</div>
            <div className="flex items-center gap-1 text-gray-600">
              <CheckCircle className="h-3 w-3" />
              <span className="font-capsule text-xs">Finished or max uses</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-phonic text-sm font-semibold text-gray-900">Expired</CardTitle>
            <div className="p-2 bg-[#7f5efd] rounded-lg">
              <AlertCircle className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-semibold mb-2 text-[#7f5efd]">{statistics.expired_links}</div>
            <div className="flex items-center gap-1 text-gray-600">
              <Clock className="h-3 w-3" />
              <span className="font-capsule text-xs">Past expiry date</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-phonic text-sm font-semibold text-gray-900">Single Use</CardTitle>
            <div className="p-2 bg-[#7f5efd] rounded-lg">
              <CreditCard className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-semibold mb-2 text-[#7f5efd]">{statistics.single_use_links}</div>
            <div className="flex items-center gap-1 text-gray-600">
              <Users className="h-3 w-3" />
              <span className="font-capsule text-xs">One-time payments</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-phonic text-sm font-semibold text-gray-900">Total Revenue</CardTitle>
            <div className="p-2 bg-[#7f5efd] rounded-lg">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-semibold mb-2 text-[#7f5efd]">
              {formatCurrency(statistics.total_revenue)}
            </div>
            <div className="flex items-center gap-1 text-gray-600">
              <TrendingUp className="h-3 w-3" />
              <span className="font-capsule text-xs">{statistics.total_payments} payments</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex justify-center gap-3 max-md:flex-col max-md:items-stretch max-md:px-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-64 h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 max-md:w-full max-md:h-12" aria-label="Filter by status">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-64 h-11 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 max-md:w-full max-md:h-12" aria-label="Filter by date">
            <SelectValue placeholder="Filter by date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Dates</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="this_month">This month</SelectItem>
            <SelectItem value="last_month">Last month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isMobile && (
        <div
          className="md:hidden text-center text-xs text-gray-500 transition-all duration-150"
          style={{
            opacity: pullDistance > 0 || isPullRefreshing ? 1 : 0,
            transform:
              pullDistance > 0
                ? `translateY(${Math.min(pullDistance / 2, 40)}px)`
                : undefined,
          }}
        >
          {isPullRefreshing
            ? 'Refreshing…'
            : pullDistance >= 60
              ? 'Release to refresh'
              : 'Pull to refresh'}
        </div>
      )}

      {/* Enhanced Payment Links by Category */}
      {groups.map(group => (
        <LazyMount
          key={group.key}
          className="block"
          placeholder={(
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="p-6">
                <div className="h-6 w-32 rounded-md bg-gray-200 animate-pulse" />
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-3">
                <div className="h-4 w-full rounded bg-gray-100 animate-pulse" />
                <div className="h-4 w-3/4 rounded bg-gray-100 animate-pulse" />
                <div className="h-4 w-2/3 rounded bg-gray-100 animate-pulse" />
              </CardContent>
            </Card>
          )}
        >
          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <CardTitle className="font-phonic text-xl font-semibold text-gray-900 flex items-center gap-3">
                    {group.title}
                    <Badge variant="outline" className="bg-[#7f5efd]/10 text-[#7f5efd] border-[#7f5efd]/20">
                      {group.items.length}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="font-capsule text-sm text-gray-600">
                    {group.key === 'links' && 'Standard payment links for invoices and sales'}
                    {group.key === 'pos' && 'Point-of-sale transactions from Smart Terminal'}
                    {group.key === 'subscriptions' && 'Recurring subscription payments'}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSection(group.key)}
                  className="flex items-center gap-2 hover:bg-gray-100 transition-colors duration-200"
                >
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${
                      openSections[group.key] ? 'rotate-180' : ''
                    }`}
                  />
                  {openSections[group.key] ? 'Collapse' : 'Expand'}
                </Button>
              </div>
            </CardHeader>
            {openSections[group.key] && (
              <CardContent className="p-6 pt-0">
                {group.items.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="p-4 bg-gray-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <LinkIcon className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="font-phonic text-lg font-semibold text-gray-900 mb-2">No {group.title.toLowerCase()} found</h3>
                    <p className="font-capsule text-sm text-gray-500 mb-6">Get started by creating your first payment link</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {group.items.map(renderLink)}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        </LazyMount>
      ))}

      {/* Enhanced Pagination */}
      {totalPages > 1 && (
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="border-gray-200 hover:border-[#7f5efd] hover:text-[#7f5efd] transition-colors duration-200"
              >
                Previous
              </Button>
              <div className="flex items-center px-4 py-2 font-capsule text-sm text-gray-600 bg-gray-50 rounded-lg">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="border-gray-200 hover:border-[#7f5efd] hover:text-[#7f5efd] transition-colors duration-200"
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
