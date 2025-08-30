'use client';

import React, { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Download
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { QRCode } from '@/app/components/ui/qr-code';
import { supabase } from '@/lib/supabase-browser';
import { Breadcrumbs } from '@/app/components/ui/breadcrumbs'

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

export default function PaymentDetailsPage({ params }: PaymentDetailsPageProps) {
  const { id } = use(params);
  const [paymentLink, setPaymentLink] = useState<PaymentLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

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
  }, [id, router]);

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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => router.push('/merchant/dashboard/payments')}
            className="border-[#7f5efd] text-[#7f5efd] hover:bg-[#f5f3ff]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="font-phonic text-5xl font-normal text-gray-900">Payment Link Details</h1>
            <p className="font-capsule text-base font-normal text-gray-600 mt-1">Unable to load payment link information</p>
          </div>
        </div>
        
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="font-phonic text-2xl font-normal text-gray-900 mb-2">
              {error || 'Payment Link Not Found'}
            </h3>
            <p className="font-capsule text-base font-normal text-gray-600 mb-4">
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button 
          variant="outline" 
          onClick={() => router.push('/merchant/dashboard/payments')}
          className="border-[#7f5efd] text-[#7f5efd] hover:bg-[#f5f3ff]"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="font-phonic text-3xl font-normal tracking-tight text-gray-900 mb-4">
            {paymentLink.title}
          </h1>
          <p className="font-capsule text-base font-normal text-gray-600 mt-1">Payment link details and management</p>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon(paymentLink.status)}
          <Badge className={getStatusColor(paymentLink.status)}>
            {paymentLink.status.charAt(0).toUpperCase() + paymentLink.status.slice(1)}
          </Badge>
        </div>
      </div>

      <Breadcrumbs items={[
        {name: 'Dashboard', href: '/merchant/dashboard'},
        {name: 'Payments', href: '/merchant/dashboard/payments'},
        {name: paymentLink.title, href: '#'}
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Link Information */}
        <div className="space-y-6">
          <Card className="shadow-medium border-0 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-[#7f5efd]" />
                <span>Payment Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="font-phonic text-sm font-normal text-gray-500">Amount</label>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(paymentLink.amount, paymentLink.currency)}
                </div>
              </div>

              {/* Subscription Invoice Number */}
              {paymentLink.subscription_invoice && (
                <div>
                  <label className="font-phonic text-sm font-normal text-gray-500">Invoice Number</label>
                  <div className="text-lg font-semibold text-blue-600">
                    {paymentLink.subscription_invoice.invoice_number}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Due: {formatDate(paymentLink.subscription_invoice.due_date)}
                  </div>
                </div>
              )}

              {paymentLink.description && (
                <div>
                  <label className="font-phonic text-sm font-normal text-gray-500">Description</label>
                  <p className="text-gray-900">{paymentLink.description}</p>
                </div>
              )}

              {/* Fee Breakdown */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-phonic text-sm font-normal text-gray-700 mb-2">Fee Breakdown</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base Amount:</span>
                    <span>{formatCurrency(baseAmount, paymentLink.currency)}</span>
                  </div>
                  {paymentLink.tax_enabled && (paymentLink.tax_amount || 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax:</span>
                      <span>{formatCurrency(paymentLink.tax_amount || 0, paymentLink.currency)}</span>
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
                    <span>{chargeCustomerFee ? '+' : ''}{formatCurrency(feeAmount, paymentLink.currency)}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-1">
                    <span>Customer Pays:</span>
                    <span>{formatCurrency(customerPaysTotal, paymentLink.currency)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>You Receive:</span>
                    <span>{formatCurrency(merchantReceives, paymentLink.currency)}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="font-phonic text-sm font-normal text-gray-500">Accepted Cryptocurrencies</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {paymentLink.accepted_cryptos.map((crypto) => (
                    <Badge key={crypto} variant="secondary">
                      {crypto}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-medium border-0 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-[#7f5efd]" />
                <span>Settings & Limits</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-phonic text-sm font-normal text-gray-500">Created</label>
                  <p className="text-gray-900">{formatDate(paymentLink.created_at)}</p>
                </div>
                <div>
                  <label className="font-phonic text-sm font-normal text-gray-500">Link ID</label>
                  <p className="text-gray-900 font-mono text-sm">{paymentLink.link_id}</p>
                </div>
              </div>

              {paymentLink.expires_at && (
                <div>
                  <label className="font-phonic text-sm font-normal text-gray-500">Expires</label>
                  <p className="text-gray-900">{formatDate(paymentLink.expires_at)}</p>
                </div>
              )}

              {paymentLink.max_uses && (
                <div>
                  <label className="font-phonic text-sm font-normal text-gray-500">Maximum Uses</label>
                  <p className="text-gray-900">{paymentLink.max_uses}</p>
                </div>
              )}

              {paymentLink.redirect_url && (
                <div>
                  <label className="font-phonic text-sm font-normal text-gray-500">Redirect URL</label>
                  <p className="text-gray-900 break-all">{paymentLink.redirect_url}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* QR Code and Actions */}
        <div className="space-y-6">
          <Card className="shadow-medium border-0 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <LinkIcon className="h-5 w-5 text-[#7f5efd]" />
                <span>Payment URL</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="font-phonic text-sm font-normal text-gray-500 mb-2 block">
                  Share this URL with customers
                </label>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 p-3 bg-gray-100 rounded-lg text-sm font-mono break-all">
                    {paymentLink.payment_url}
                  </code>
                                  <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(paymentLink.payment_url)}
                  className="border-[#7f5efd] text-[#7f5efd] hover:bg-[#f5f3ff]"
                >
                  {copied ? 'Copied!' : <Copy className="h-4 w-4" />}
                </Button>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => window.open(paymentLink.payment_url, '_blank')}
                  className="flex-1 border-[#7f5efd] text-[#7f5efd] hover:bg-[#f5f3ff]"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Link
                </Button>
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(paymentLink.payment_url)}
                  className="flex-1 border-[#7f5efd] text-[#7f5efd] hover:bg-[#f5f3ff]"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy URL
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-medium border-0 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <QrCode className="h-5 w-5 text-[#7f5efd]" />
                <span>QR Code</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <QRCode 
                    value={paymentLink.payment_url} 
                    size={200}
                    className="border border-gray-200"
                  />
                </div>
                <p className="font-phonic text-sm font-normal text-gray-500">
                  Customers can scan this QR code to access the payment link
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    // This would trigger a download of the QR code
                    // Implementation would depend on the QR code component
                    console.log('Download QR code');
                  }}
                  className="w-full border-[#7f5efd] text-[#7f5efd] hover:bg-[#f5f3ff]"
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
  );
}

