'use client';

import React, { use, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTimezone } from '@/lib/contexts/TimezoneContext';
import { formatFullDateTime } from '@/lib/utils/date-utils';
import { 
  ArrowLeft, 
  Copy, 
  ExternalLink,
  DollarSign,
  Calendar,
  Link as LinkIcon,
  QrCode,
  CheckCircle,
  AlertCircle,
  Clock,
  Download,
  CreditCard,
  ChevronDown,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { QRCode } from '@/app/components/ui/qr-code';
import { supabase } from '@/lib/supabase-browser';
import { Breadcrumbs } from '@/app/components/ui/breadcrumbs';
import { cn } from '@/lib/utils';
import { useSwipeActions } from '@/lib/hooks/use-swipe-actions';
import { useIsMobile } from '@/lib/hooks/use-mobile';
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetHeader,
  BottomSheetTitle,
} from '@/app/components/ui/bottom-sheet';

interface PaymentLink {
  id: string;
  link_id: string;
  title: string;
  description: string;
  amount: number;
  base_amount?: number;
  currency: string;
  status: string;
  accepted_cryptos: string[];
  expires_at: string | null;
  max_uses: number | null;
  redirect_url: string | null;
  created_at: string;
  updated_at: string;
  payment_url: string;
  auto_convert_enabled?: boolean;
  charge_customer_fee?: boolean;
  fee_percentage?: number;
  tax_enabled?: boolean;
  tax_amount?: number;
  tax_rates?: Array<{
    label: string;
    percentage: number;
  }>;
  subtotal_with_tax?: number;
  source?: string;
  subscription_id?: string;
  subscription_invoice?: {
    invoice_number: string;
    status: string;
    due_date: string;
    cycle_start_at: string;
  } | null;
  metadata?: {
    fee_percentage?: number;
    fee_amount?: number;
    total_amount?: number;
    fee_breakdown?: {
      fee_amount?: number;
      merchant_receives?: number;
      effective_charge_customer_fee?: boolean;
      effective_auto_convert_enabled?: boolean;
    };
  };
}

interface PaymentDetailsPageProps {
  params: Promise<{ id: string }>;
}

interface MobileAccordionSectionProps {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function MobileAccordionSection({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
}: MobileAccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-3xl border border-gray-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#7f5efd]/10 text-[#7f5efd]">
            <Icon className="h-5 w-5" />
          </span>
          <span className="font-phonic text-base font-semibold text-gray-900">{title}</span>
        </span>
        <ChevronDown
          className={cn(
            'h-5 w-5 text-gray-400 transition-transform duration-200',
            open ? 'rotate-180 text-[#7f5efd]' : ''
          )}
          aria-hidden="true"
        />
      </button>
      <div
        className={cn(
          'overflow-hidden border-t border-gray-100 transition-[max-height,padding] duration-300 ease-in-out',
          open ? 'max-h-[1200px] px-4 pb-4 pt-2' : 'max-h-0 px-4 py-0'
        )}
      >
        {open ? <div className="space-y-4 text-sm text-gray-800">{children}</div> : null}
      </div>

    </div>
  );
}

export default function PaymentDetailsPage({ params }: PaymentDetailsPageProps) {
  const { id } = use(params);
  const [paymentLink, setPaymentLink] = useState<PaymentLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isQrSheetOpen, setQrSheetOpen] = useState(false);
  const [adjacentIds, setAdjacentIds] = useState<{ prev: string | null; next: string | null }>({
    prev: null,
    next: null,
  });
  const router = useRouter();
  const { timezone } = useTimezone();
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const fetchAdjacentLinks = useCallback(
    async (accessToken: string, currentId: string) => {
      try {
        const response = await fetch(`/api/payments?limit=50`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          return;
        }

        const result: {
          success: boolean;
          data?: {
            payment_links?: Array<{ id: string }>;
          };
        } = await response.json();

        if (!result.success || !result.data?.payment_links?.length) {
          return;
        }

        const links = result.data.payment_links;
        const currentIndex = links.findIndex(link => link.id === currentId);

        if (currentIndex === -1) {
          return;
        }

        const prevId = currentIndex > 0 ? links[currentIndex - 1]?.id ?? null : null;
        const nextId = currentIndex < links.length - 1 ? links[currentIndex + 1]?.id ?? null : null;

        setAdjacentIds({ prev: prevId, next: nextId });

        if (prevId) {
          void router.prefetch(`/merchant/dashboard/payments/${prevId}`);
        }
        if (nextId) {
          void router.prefetch(`/merchant/dashboard/payments/${nextId}`);
        }
      } catch (err) {
        console.error('Failed to fetch adjacent payment links', err);
      }
    },
    [router]
  );

  useEffect(() => {
    const fetchPaymentLink = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          router.push('/login');
          return;
        }

        // Fetch payment link details
        const response = await fetch(`/api/payments/${id}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            setError('Payment link not found');
          } else {
            setError('Failed to load payment link details');
          }
          return;
        }

        const result = await response.json();
        
        if (result.success) {
          // Construct the proper payment URL
          const paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pay/${result.data.link_id}`;
          
          setPaymentLink({
            ...result.data,
            payment_url: paymentUrl
          });

          await fetchAdjacentLinks(session.access_token, result.data.id);
        } else {
          setError(result.error || 'Failed to load payment link details');
        }
      } catch (error) {
        console.error('Failed to fetch payment link:', error);
        setError('Failed to load payment link details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPaymentLink();
    }
  }, [fetchAdjacentLinks, id, router]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return formatFullDateTime(dateString, timezone);
  };

  useSwipeActions(containerRef, {
    enabled: isMobile,
    threshold: 80,
    onSwipeLeft: () => {
      if (adjacentIds.next) {
        router.push(`/merchant/dashboard/payments/${adjacentIds.next}`);
      }
    },
    onSwipeRight: () => {
      if (adjacentIds.prev) {
        router.push(`/merchant/dashboard/payments/${adjacentIds.prev}`);
      } else {
        router.push('/merchant/dashboard/payments');
      }
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'expired':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'disabled':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-orange-100 text-orange-800';
      case 'disabled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#7f5efd]"></div>
      </div>
    );
  }

  if (error || !paymentLink) {
    return (
      <div className="px-6 py-8 space-y-8 max-w-4xl mx-auto">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => router.push('/merchant/dashboard/payments')}
            className="border-gray-200 hover:border-[#7f5efd] hover:text-[#7f5efd] transition-colors duration-200"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="font-phonic text-2xl font-semibold text-gray-900">Payment Link Details</h1>
            <p className="font-capsule text-sm text-gray-600 mt-1">Unable to load payment link information</p>
          </div>
        </div>
        
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="font-phonic text-lg font-semibold text-gray-900 mb-2">
              {error || 'Payment Link Not Found'}
            </h3>
            <p className="font-capsule text-sm text-gray-600 mb-4">
              The payment link you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
            </p>
            <Button 
              onClick={() => router.push('/merchant/dashboard/payments')}
              className="bg-[#7f5efd] hover:bg-[#7c3aed] text-white"
            >
              Return to Payment Links
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const feePercentage = paymentLink.fee_percentage ? paymentLink.fee_percentage * 100 : 0;
  const baseAmount = paymentLink.base_amount || paymentLink.amount;
  const subtotalWithTax = paymentLink.subtotal_with_tax || baseAmount;
  const feeAmount = paymentLink.metadata?.fee_breakdown?.fee_amount || (subtotalWithTax * (paymentLink.fee_percentage || 0));
  const chargeCustomerFee =
    paymentLink.charge_customer_fee ??
    paymentLink.metadata?.fee_breakdown?.effective_charge_customer_fee ??
    false;
  const autoConvertEnabled = paymentLink.auto_convert_enabled || false;
  
  // Calculate correct amounts based on who pays the fee
  const customerPaysTotal = chargeCustomerFee ? subtotalWithTax + feeAmount : subtotalWithTax;
  const merchantReceives = chargeCustomerFee ? subtotalWithTax : subtotalWithTax - feeAmount;
  
  const feeLabel = autoConvertEnabled ? `${feePercentage.toFixed(1)}% (Auto-convert)` : `${feePercentage.toFixed(1)}% (Direct crypto)`;

  const feeBreakdownCards = [
    {
      label: 'Base Amount',
      value: formatCurrency(baseAmount, paymentLink.currency),
      tone: 'neutral' as const,
    },
    ...(paymentLink.tax_enabled && (paymentLink.tax_amount || 0) > 0
      ? [
          {
            label: 'Tax',
            value: formatCurrency(paymentLink.tax_amount || 0, paymentLink.currency),
            tone: 'neutral' as const,
          },
          {
            label: 'Subtotal with Tax',
            value: formatCurrency(subtotalWithTax, paymentLink.currency),
            tone: 'neutral' as const,
          },
        ]
      : []),
    {
      label: `Gateway Fee ${chargeCustomerFee ? '(customer pays)' : '(merchant absorbs)'}`,
      value: `${chargeCustomerFee ? '+' : ''}${formatCurrency(feeAmount, paymentLink.currency)}`,
      helper: feeLabel,
      tone: 'neutral' as const,
    },
    {
      label: 'Customer Pays',
      value: formatCurrency(customerPaysTotal, paymentLink.currency),
      tone: 'accent' as const,
    },
    {
      label: 'You Receive',
      value: formatCurrency(merchantReceives, paymentLink.currency),
      tone: 'success' as const,
    },
  ];

  const settingsRows = [
    {
      label: 'Created',
      value: formatDate(paymentLink.created_at),
    },
    paymentLink.expires_at
      ? {
          label: 'Expires',
          value: formatDate(paymentLink.expires_at),
        }
      : null,
    {
      label: 'Link ID',
      value: (
        <span className="font-mono text-xs break-all rounded-lg bg-gray-100 px-2 py-1">
          {paymentLink.link_id}
        </span>
      ),
    },
    paymentLink.max_uses
      ? {
          label: 'Maximum Uses',
          value: paymentLink.max_uses,
        }
      : null,
    paymentLink.redirect_url
      ? {
          label: 'Redirect URL',
          value: (
            <span className="break-all text-sm text-gray-700">{paymentLink.redirect_url}</span>
          ),
        }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: React.ReactNode }>;

  const pageContent = (
    <div
      ref={containerRef}
      className={cn(
        'px-6 py-8 space-y-8 max-w-6xl mx-auto',
        'max-md:px-0 max-md:py-0 max-md:space-y-0'
      )}
      style={
        isMobile
          ? {
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)',
            }
          : undefined
      }
    >
      <div className="md:hidden space-y-5">
        <div className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 px-4 py-3 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/merchant/dashboard/payments')}
              className="h-11 w-11 rounded-xl border border-gray-200 bg-white text-gray-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0 text-center">
              <p className="truncate font-phonic text-base font-semibold text-gray-900">
                {paymentLink.title}
              </p>
              <p className="text-xs text-gray-500">Swipe to navigate</p>
            </div>
            <Badge className={cn('rounded-full px-3 py-1 text-xs', getStatusColor(paymentLink.status))}>
              {paymentLink.status.charAt(0).toUpperCase() + paymentLink.status.slice(1)}
            </Badge>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Amount</p>
                <p className="mt-1 font-phonic text-2xl font-semibold text-gray-900">
                  {formatCurrency(paymentLink.amount, paymentLink.currency)}
                </p>
                <p className="text-xs text-gray-500">Created {formatDate(paymentLink.created_at)}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge className={cn('rounded-full px-3 py-1 text-xs', getStatusColor(paymentLink.status))}>
                  {paymentLink.status.charAt(0).toUpperCase() + paymentLink.status.slice(1)}
                </Badge>
                {paymentLink.subscription_invoice ? (
                  <Badge variant="outline" className="border-blue-200 bg-blue-50 text-xs text-blue-600">
                    Subscription
                  </Badge>
                ) : null}
              </div>
            </div>
            {paymentLink.description ? (
              <p className="mt-4 text-sm text-gray-700">{paymentLink.description}</p>
            ) : null}
          </div>

          <MobileAccordionSection title="Payment Overview" icon={DollarSign} defaultOpen>
            <div className="space-y-3">
              {paymentLink.subscription_invoice ? (
                <div className="rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                  Invoice {paymentLink.subscription_invoice.invoice_number}
                  <span className="ml-2 text-xs text-blue-600">
                    Due {formatDate(paymentLink.subscription_invoice.due_date)}
                  </span>
                </div>
              ) : null}

              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Accepted Cryptocurrencies</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {paymentLink.accepted_cryptos.map(crypto => (
                    <Badge key={crypto} variant="secondary" className="rounded-xl px-3 py-1 text-xs">
                      {crypto}
                    </Badge>
                  ))}
                </div>
              </div>

              {paymentLink.tax_enabled && paymentLink.tax_rates?.length ? (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Tax Rates</p>
                  <div className="grid grid-cols-1 gap-2">
                    {paymentLink.tax_rates.map(rate => (
                      <div key={rate.label} className="flex items-center justify-between rounded-2xl border border-gray-200 px-3 py-2">
                        <span className="text-sm text-gray-700">{rate.label}</span>
                        <span className="font-semibold text-gray-900">{rate.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </MobileAccordionSection>

          <MobileAccordionSection title="Amount & Fees" icon={CreditCard}>
            <div className="grid grid-cols-1 gap-3">
              {feeBreakdownCards.map(card => (
                <div
                  key={card.label}
                  className={cn(
                    'rounded-2xl border px-4 py-3',
                    card.tone === 'accent' && 'border-[#7f5efd]/30 bg-[#7f5efd]/5 text-[#7f5efd]',
                    card.tone === 'success' && 'border-green-200 bg-green-50 text-green-700',
                    card.tone === 'neutral' && 'border-gray-200 bg-white text-gray-900'
                  )}
                >
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    {card.label}
                  </p>
                  <p className="mt-1 font-phonic text-lg font-semibold">
                    {card.value}
                  </p>
                  {card.helper ? (
                    <p className="text-xs text-gray-500">{card.helper}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </MobileAccordionSection>

          <MobileAccordionSection title="Settings & Limits" icon={Calendar}>
            <div className="space-y-3">
              {settingsRows.map(row => (
                <div key={row.label} className="flex items-start justify-between gap-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">{row.label}</p>
                  <div className="text-right text-sm text-gray-800">{row.value}</div>
                </div>
              ))}
            </div>
          </MobileAccordionSection>

          <MobileAccordionSection title="Payment URL & Actions" icon={LinkIcon}>
            <div className="space-y-3">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3 text-xs text-gray-700">
                {paymentLink.payment_url}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => window.open(paymentLink.payment_url, '_blank')}
                  className="h-12 rounded-xl border-gray-200"
                >
                  Open
                </Button>
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(paymentLink.payment_url)}
                  className="h-12 rounded-xl border-gray-200"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>
          </MobileAccordionSection>

          <MobileAccordionSection title="QR Code" icon={QrCode}>
            <div className="space-y-3 text-center">
              <div className="mx-auto inline-flex rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <QRCode
                  value={paymentLink.payment_url}
                  size={160}
                  className="rounded-lg border border-gray-200"
                  hideDetails
                />
              </div>
              <p className="text-xs text-gray-500">
                Tap the QR to zoom or download for offline sharing.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => setQrSheetOpen(true)}
                  className="h-12 rounded-xl border-gray-200"
                >
                  Zoom
                </Button>
                <Button
                  variant="outline"
                  onClick={() => console.log('Download QR code')}
                  className="h-12 rounded-xl border-gray-200"
                >
                  Download
                </Button>
              </div>
            </div>
          </MobileAccordionSection>

          <div className="flex items-center justify-between rounded-3xl border border-gray-200 bg-white px-4 py-3 text-xs text-gray-600">
            <span>Swipe left/right to move between payments.</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="h-10 rounded-lg px-3 text-xs"
                disabled={!adjacentIds.prev}
                onClick={() => {
                  if (adjacentIds.prev) {
                    router.push(`/merchant/dashboard/payments/${adjacentIds.prev}`);
                  }
                }}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                className="h-10 rounded-lg px-3 text-xs"
                disabled={!adjacentIds.next}
                onClick={() => {
                  if (adjacentIds.next) {
                    router.push(`/merchant/dashboard/payments/${adjacentIds.next}`);
                  }
                }}
              >
                Next
              </Button>
            </div>
          </div>
        </div>

      </div>

      <div className="space-y-8 max-md:space-y-6 max-md:px-4 max-md:py-6">
        {/* Breadcrumbs */}
        <div className="hidden md:block">
          <Breadcrumbs
            items={[
              { name: 'Dashboard', href: '/merchant/dashboard' },
              { name: 'Payments', href: '/merchant/dashboard/payments' },
              { name: paymentLink.title, href: `/merchant/dashboard/payments/${paymentLink.id}` }
            ]}
          />
        </div>

        {/* Enhanced Header */}
        <div className="hidden md:flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
          <div className="space-y-2">
            <h1 className="font-phonic text-3xl font-normal tracking-tight text-gray-900 mb-4">
              {paymentLink.title}
            </h1>
            <p className="font-phonic text-base font-normal text-gray-600">
              Payment link details and management
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.push('/merchant/dashboard/payments')}
              className="border-gray-200 hover:border-[#7f5efd] hover:text-[#7f5efd] transition-colors duration-200"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center space-x-2">
              {getStatusIcon(paymentLink.status)}
              <Badge className={getStatusColor(paymentLink.status)}>
                {paymentLink.status.charAt(0).toUpperCase() + paymentLink.status.slice(1)}
              </Badge>
            </div>
          </div>
        </div>

        <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment Link Information */}
          <div className="space-y-8">
            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="p-6">
              <CardTitle className="font-phonic text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-[#7f5efd]" />
                <span>Payment Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-6">
              <div>
                <label className="font-phonic text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</label>
                <div className="text-2xl font-semibold text-gray-900 mt-1">
                  {formatCurrency(paymentLink.amount, paymentLink.currency)}
                </div>
              </div>

              {/* Subscription Invoice Number */}
              {paymentLink.subscription_invoice && (
                <div>
                  <label className="font-phonic text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice Number</label>
                  <div className="text-base font-semibold text-blue-600 mt-1">
                    {paymentLink.subscription_invoice.invoice_number}
                  </div>
                  <div className="font-capsule text-xs text-gray-500 mt-1">
                    Due: {formatDate(paymentLink.subscription_invoice.due_date)}
                  </div>
                </div>
              )}

              {paymentLink.description && (
                <div>
                  <label className="font-phonic text-xs font-medium text-gray-500 uppercase tracking-wider">Description</label>
                  <p className="font-capsule text-sm text-gray-900 mt-1">{paymentLink.description}</p>
                </div>
              )}

              {/* Fee Breakdown */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-phonic text-sm font-semibold text-gray-700 mb-3">Fee Breakdown</h4>
                <div className="space-y-2 font-capsule text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base Amount:</span>
                    <span className="font-medium">{formatCurrency(baseAmount, paymentLink.currency)}</span>
                  </div>
                  {paymentLink.tax_enabled && (paymentLink.tax_amount || 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax:</span>
                      <span className="font-medium">{formatCurrency(paymentLink.tax_amount || 0, paymentLink.currency)}</span>
                    </div>
                  )}
                  {paymentLink.tax_enabled && (
                    <div className="flex justify-between font-medium">
                      <span className="text-gray-600">Subtotal with Tax:</span>
                      <span>{formatCurrency(subtotalWithTax, paymentLink.currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gateway Fee ({feeLabel}):</span>
                    <span className="font-medium">{chargeCustomerFee ? '+' : ''}{formatCurrency(feeAmount, paymentLink.currency)}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t border-gray-200 pt-2 mt-2">
                    <span>Customer Pays:</span>
                    <span className="text-[#7f5efd]">{formatCurrency(customerPaysTotal, paymentLink.currency)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>You Receive:</span>
                    <span className="text-green-600">{formatCurrency(merchantReceives, paymentLink.currency)}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="font-phonic text-xs font-medium text-gray-500 uppercase tracking-wider">Accepted Cryptocurrencies</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {paymentLink.accepted_cryptos.map((crypto) => (
                    <Badge key={crypto} variant="secondary" className="text-xs">
                      {crypto}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="p-6">
              <CardTitle className="font-phonic text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-[#7f5efd]" />
                <span>Settings & Limits</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="font-phonic text-xs font-medium text-gray-500 uppercase tracking-wider">Created</label>
                  <p className="font-capsule text-sm text-gray-900 mt-1">{formatDate(paymentLink.created_at)}</p>
                </div>
                <div>
                  <label className="font-phonic text-xs font-medium text-gray-500 uppercase tracking-wider">Link ID</label>
                  <p className="font-mono text-xs text-gray-900 mt-1 bg-gray-50 p-2 rounded border">{paymentLink.link_id}</p>
                </div>
              </div>

              {paymentLink.expires_at && (
                <div>
                  <label className="font-phonic text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</label>
                  <p className="font-capsule text-sm text-gray-900 mt-1">{formatDate(paymentLink.expires_at)}</p>
                </div>
              )}

              {paymentLink.max_uses && (
                <div>
                  <label className="font-phonic text-xs font-medium text-gray-500 uppercase tracking-wider">Maximum Uses</label>
                  <p className="font-capsule text-sm text-gray-900 mt-1">{paymentLink.max_uses}</p>
                </div>
              )}

              {paymentLink.redirect_url && (
                <div>
                  <label className="font-phonic text-xs font-medium text-gray-500 uppercase tracking-wider">Redirect URL</label>
                  <p className="font-capsule text-sm text-gray-900 mt-1 break-all">{paymentLink.redirect_url}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* QR Code and Actions */}
        <div className="space-y-8">
          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="p-6">
              <CardTitle className="font-phonic text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <LinkIcon className="h-5 w-5 text-[#7f5efd]" />
                <span>Payment URL</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-6">
              <div>
                <label className="font-phonic text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">
                  Share this URL with customers
                </label>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-lg font-capsule text-xs break-all">
                    {paymentLink.payment_url}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(paymentLink.payment_url)}
                    className="border-gray-200 hover:border-[#7f5efd] hover:text-[#7f5efd] transition-colors duration-200"
                  >
                    {copied ? 'Copied!' : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => window.open(paymentLink.payment_url, '_blank')}
                  className="flex-1 border-gray-200 hover:border-[#7f5efd] hover:text-[#7f5efd] transition-colors duration-200"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Link
                </Button>
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(paymentLink.payment_url)}
                  className="flex-1 border-gray-200 hover:border-[#7f5efd] hover:text-[#7f5efd] transition-colors duration-200"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy URL
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="p-6">
              <CardTitle className="font-phonic text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <QrCode className="h-5 w-5 text-[#7f5efd]" />
                <span>QR Code</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="text-center space-y-4">
                <div className="flex justify-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <QRCode
                    value={paymentLink.payment_url}
                    size={200}
                    className="border border-gray-200 rounded"
                    hideDetails={true}
                  />
                </div>
                <p className="font-capsule text-xs text-gray-500">
                  Customers can scan this QR code to access the payment link
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    // This would trigger a download of the QR code
                    // Implementation would depend on the QR code component
                    console.log('Download QR code');
                  }}
                  className="w-full border-gray-200 hover:border-[#7f5efd] hover:text-[#7f5efd] transition-colors duration-200"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download QR Code
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
  );

  return (
    <React.Fragment>
      {pageContent}
      <BottomSheet open={isQrSheetOpen} onOpenChange={setQrSheetOpen}>
        <BottomSheetContent className="md:hidden" onDismiss={() => setQrSheetOpen(false)}>
          <BottomSheetHeader className="text-left">
            <BottomSheetTitle>Payment QR Code</BottomSheetTitle>
            <BottomSheetDescription>
              Share this code or save it to reuse at your checkout counter.
            </BottomSheetDescription>
          </BottomSheetHeader>
          <div className="mt-4 space-y-4">
            <div className="flex justify-center">
              <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
                <QRCode
                  value={paymentLink.payment_url}
                  size={240}
                  className="rounded-xl border border-gray-200"
                  hideDetails
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Button
                variant="outline"
                className="h-12 rounded-xl border-gray-200"
                onClick={() => copyToClipboard(paymentLink.payment_url)}
              >
                {copied ? 'Copied!' : 'Copy Payment URL'}
              </Button>
              <Button
                className="h-12 rounded-xl bg-[#7f5efd] hover:bg-[#7c3aed]"
                onClick={() => console.log('Download QR code')}
              >
                Download QR Code
              </Button>
            </div>
          </div>
        </BottomSheetContent>
      </BottomSheet>
    </React.Fragment>
  );
}
