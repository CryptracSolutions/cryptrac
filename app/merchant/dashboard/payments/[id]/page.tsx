'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Plus, 
  Copy, 
  ExternalLink,
  DollarSign,
  Calendar,
  Link as LinkIcon,
  QrCode,
  CheckCircle,
  AlertCircle,
  Clock,
  Globe
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { DashboardLayout } from '@/app/components/layout/dashboard-layout';
import { QRCode } from '@/app/components/ui/qr-code';
import { supabase } from '@/lib/supabase-browser';

interface FormData {
  title: string;
  description: string;
  amount: string;
  currency: string;
  acceptedCryptos: string[];
  expiresAt: string;
  maxUses: string;
  redirectUrl: string;
}

interface FormErrors {
  [key: string]: string;
}

interface CreatedLink {
  id: string;
  link_id: string;
  title: string;
  amount: number;
  currency: string;
  payment_url: string;
  created_at: string;
  metadata?: {
    fee_percentage: number;
    fee_amount: number;
    net_amount: number;
  };
}

export default function CreatePaymentLinkPage() {
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    amount: '',
    currency: 'USD',
    acceptedCryptos: ['BTC', 'ETH', 'USDT'],
    expiresAt: '',
    maxUses: '',
    redirectUrl: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [createdLink, setCreatedLink] = useState<CreatedLink | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const router = useRouter();

  const availableCryptos = [
    { code: 'BTC', name: 'Bitcoin' },
    { code: 'ETH', name: 'Ethereum' },
    { code: 'LTC', name: 'Litecoin' },
    { code: 'USDT', name: 'Tether' },
    { code: 'USDC', name: 'USD Coin' },
    { code: 'BCH', name: 'Bitcoin Cash' },
    { code: 'XRP', name: 'Ripple' },
    { code: 'ADA', name: 'Cardano' }
  ];

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
      }
    };

    getUser();
  }, [router]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = 'Amount must be a positive number';
      } else if (amount > 1000000) {
        newErrors.amount = 'Amount cannot exceed $1,000,000';
      }
    }

    if (formData.acceptedCryptos.length === 0) {
      newErrors.acceptedCryptos = 'At least one cryptocurrency must be selected';
    }

    if (formData.maxUses && parseInt(formData.maxUses) <= 0) {
      newErrors.maxUses = 'Max uses must be a positive number';
    }

    if (formData.redirectUrl && !isValidUrl(formData.redirectUrl)) {
      newErrors.redirectUrl = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      console.log('Creating payment link...');

      // Get the session for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('Session error:', sessionError);
        setErrors({ general: 'Session expired. Please log in again.' });
        router.push('/login');
        return;
      }

      // Prepare request data
      const requestData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        accepted_cryptos: formData.acceptedCryptos,
        expires_at: formData.expiresAt || undefined,
        max_uses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
        redirect_url: formData.redirectUrl.trim() || undefined
      };

      console.log('Sending request data:', requestData);

      // Make authenticated API request
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(requestData),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          setErrors({ general: 'Session expired. Please log in again.' });
          router.push('/login');
          return;
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Payment link created successfully:', result.payment_link?.id);

      if (result.success && result.payment_link) {
        // Construct the proper payment URL
        const paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pay/${result.payment_link.link_id}`;
        
        setCreatedLink({
          ...result.payment_link,
          payment_url: paymentUrl
        });
      } else {
        throw new Error('Invalid response format');
      }

    } catch (error) {
      console.error('Failed to create payment link:', error);
      setErrors({ 
        general: error instanceof Error ? error.message : 'Failed to create payment link' 
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleCryptoToggle = (crypto: string) => {
    setFormData(prev => ({
      ...prev,
      acceptedCryptos: prev.acceptedCryptos.includes(crypto)
        ? prev.acceptedCryptos.filter(c => c !== crypto)
        : [...prev.acceptedCryptos, crypto]
    }));
  };

  if (!user) {
    return (
      <DashboardLayout user={user}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  // Success state - show created payment link
  if (createdLink) {
    return (
      <DashboardLayout user={user}>
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="outline" 
              onClick={() => {
                setCreatedLink(null);
                setFormData({
                  title: '',
                  description: '',
                  amount: '',
                  currency: 'USD',
                  acceptedCryptos: ['BTC', 'ETH', 'USDT'],
                  expiresAt: '',
                  maxUses: '',
                  redirectUrl: ''
                });
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Another Link
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/merchant/dashboard/payments')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              View All Links
            </Button>
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Link Created!</h1>
            <p className="text-gray-600">
              Your payment link is ready to share with customers.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Payment Link Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="h-5 w-5" />
                  Payment Link Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Title</div>
                  <p className="text-lg font-semibold text-gray-900">{createdLink.title}</p>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Amount</div>
                  <p className="text-2xl font-bold text-gray-900">
                    ${createdLink.amount.toFixed(2)} {createdLink.currency}
                  </p>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Created</div>
                  <p className="text-gray-900 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(createdLink.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                {/* Fee Breakdown */}
                {createdLink.metadata && (
                  <div className="border-t pt-4">
                    <div className="text-sm font-medium text-gray-500 mb-3">Fee Breakdown</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Gross Amount</span>
                        <span className="font-medium">${createdLink.amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Processing Fee ({createdLink.metadata.fee_percentage}%)
                        </span>
                        <span className="font-medium">-${createdLink.metadata.fee_amount.toFixed(2)}</span>
                      </div>
                      <hr />
                      <div className="flex justify-between font-semibold">
                        <span>Net Amount</span>
                        <span className="text-green-600">${createdLink.metadata.net_amount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment URL */}
                <div className="border-t pt-4">
                  <div className="text-sm font-medium text-gray-500 mb-2">Payment URL</div>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <code className="flex-1 text-sm font-mono text-gray-800 break-all">
                      {createdLink.payment_url}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(createdLink.payment_url)}
                      className="flex-shrink-0"
                    >
                      <Copy className="h-4 w-4" />
                      {copiedUrl ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => window.open(createdLink.payment_url, '_blank')}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open Link
                  </Button>
                  <Button
                    onClick={() => router.push(`/merchant/dashboard/payments/${createdLink.link_id}`)}
                    className="flex items-center gap-2"
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* QR Code */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  QR Code
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                  <QRCode 
                    value={createdLink.payment_url} 
                    size={200}
                  />
                </div>
                <p className="text-sm text-gray-600 text-center">
                  Customers can scan this QR code to access the payment page
                </p>
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(createdLink.payment_url)}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy Payment URL
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Form state - show payment link creation form
  return (
    <DashboardLayout user={user}>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            onClick={() => router.push('/merchant/dashboard/payments')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Payment Links
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Payment Link</h1>
            <p className="text-gray-600">Generate a link to accept cryptocurrency payments</p>
          </div>
        </div>

        {/* Error Alert */}
        {errors.general && (
          <Card className="border-red-200 bg-red-50 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-900">Error</p>
                  <p className="text-sm text-red-700">{errors.general}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Set up the basic details for your payment link
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Title *</div>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Product Purchase, Service Payment"
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title}</p>}
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Description</div>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description for your customers"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Amount *</div>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1000000"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="0.00"
                      className={errors.amount ? 'border-red-500' : ''}
                    />
                    {errors.amount && <p className="text-sm text-red-600 mt-1">{errors.amount}</p>}
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Currency</div>
                    <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="CAD">CAD</SelectItem>
                        <SelectItem value="AUD">AUD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cryptocurrency Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Accepted Cryptocurrencies *</CardTitle>
                <CardDescription>
                  Select which cryptocurrencies you want to accept
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {availableCryptos.map((crypto) => (
                    <div key={crypto.code} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={crypto.code}
                        checked={formData.acceptedCryptos.includes(crypto.code)}
                        onChange={() => handleCryptoToggle(crypto.code)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={crypto.code} className="text-sm font-medium text-gray-700">
                        {crypto.code} - {crypto.name}
                      </label>
                    </div>
                  ))}
                </div>
                {errors.acceptedCryptos && <p className="text-sm text-red-600 mt-2">{errors.acceptedCryptos}</p>}
              </CardContent>
            </Card>
          </div>

          {/* Advanced Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Advanced Options
              </CardTitle>
              <CardDescription>
                Optional settings to customize your payment link
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Expires At</div>
                <Input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                />
              </div>

              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Max Uses</div>
                <Input
                  type="number"
                  min="1"
                  value={formData.maxUses}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxUses: e.target.value }))}
                  placeholder="Unlimited"
                  className={errors.maxUses ? 'border-red-500' : ''}
                />
                {errors.maxUses && <p className="text-sm text-red-600 mt-1">{errors.maxUses}</p>}
              </div>

              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Redirect URL</div>
                <Input
                  type="url"
                  value={formData.redirectUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, redirectUrl: e.target.value }))}
                  placeholder="https://yoursite.com/success"
                  className={errors.redirectUrl ? 'border-red-500' : ''}
                />
                {errors.redirectUrl && <p className="text-sm text-red-600 mt-1">{errors.redirectUrl}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={loading} className="min-w-[200px]">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Link...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Payment Link
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

