'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { 
  Search, 
  Plus, 
  ExternalLink, 
  Copy, 
  Eye,
  DollarSign,
  CreditCard,
  TrendingUp,
  Link as LinkIcon,
  Play,
  Pause,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase, makeAuthenticatedRequest } from '@/lib/supabase-browser';

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
  qr_code_data?: string;
  _status_info?: {
    stored_status: string;
    calculated_status: string;
    is_single_use: boolean;
    usage_vs_max: string;
    is_expired: boolean;
  };
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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState<string | null>(null);

  const router = useRouter();

  const fetchPaymentLinks = useCallback(async () => {
    try {
      console.log('Fetching payment links...');
      setLoading(true);
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
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter })
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
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, router]);

  useEffect(() => {
    fetchPaymentLinks();
  }, [fetchPaymentLinks]);

  const updatePaymentLinkStatus = async (linkId: string, newStatus: string, reason?: string) => {
    try {
      setStatusUpdateLoading(linkId);
      
      const response = await makeAuthenticatedRequest(`/api/payments/${linkId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus, reason })
      });

      if (!response.ok) {
        throw new Error('Failed to update payment link status');
      }

      const result = await response.json();
      console.log('Status updated:', result);

      // Refresh the payment links
      await fetchPaymentLinks();
      
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Failed to update payment link status');
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string, link?: PaymentLink) => {
    const variants = {
      active: { variant: 'default' as const, color: 'bg-green-100 text-green-800' },
      expired: { variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800' },
      completed: { variant: 'outline' as const, color: 'bg-blue-100 text-blue-800' },
      paused: { variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' }
    };

    const config = variants[status as keyof typeof variants] || variants.active;
    
    return (
      <div className="flex items-center gap-2">
        <Badge variant={config.variant} className={config.color}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
        {link?.max_uses === 1 && (
          <Badge variant="outline" className="text-xs">
            Single Use
          </Badge>
        )}
      </div>
    );
  };

  const getStatusActions = (link: PaymentLink) => {
    const actions = [];

    if (link.status === 'active') {
      actions.push(
        <Button
          key="pause"
          variant="outline"
          size="sm"
          onClick={() => updatePaymentLinkStatus(link.id, 'paused', 'Manually paused by merchant')}
          disabled={statusUpdateLoading === link.id}
          className="flex items-center gap-1"
        >
          <Pause className="h-3 w-3" />
          Pause
        </Button>
      );
      actions.push(
        <Button
          key="complete"
          variant="outline"
          size="sm"
          onClick={() => updatePaymentLinkStatus(link.id, 'completed', 'Manually completed by merchant')}
          disabled={statusUpdateLoading === link.id}
          className="flex items-center gap-1"
        >
          <CheckCircle className="h-3 w-3" />
          Complete
        </Button>
      );
    }

    if (link.status === 'paused') {
      actions.push(
        <Button
          key="resume"
          variant="outline"
          size="sm"
          onClick={() => updatePaymentLinkStatus(link.id, 'active', 'Resumed by merchant')}
          disabled={statusUpdateLoading === link.id}
          className="flex items-center gap-1"
        >
          <Play className="h-3 w-3" />
          Resume
        </Button>
      );
    }

    if (link.status === 'expired') {
      actions.push(
        <Button
          key="reactivate"
          variant="outline"
          size="sm"
          onClick={() => updatePaymentLinkStatus(link.id, 'active', 'Reactivated by merchant')}
          disabled={statusUpdateLoading === link.id}
          className="flex items-center gap-1"
        >
          <Play className="h-3 w-3" />
          Reactivate
        </Button>
      );
    }

    return actions;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading payment links...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">Error: {error}</p>
            <div className="space-x-2">
              <Button onClick={fetchPaymentLinks} variant="outline">
                Try Again
              </Button>
              <Button onClick={() => router.push('/login')} variant="default">
                Go to Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Links</h1>
          <p className="text-gray-600 mt-1">Manage your cryptocurrency payment links</p>
        </div>
        <Link href="/merchant/dashboard/payments/create">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Payment Link
          </Button>
        </Link>
      </div>

      {/* Enhanced Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Links</CardTitle>
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total_links}</div>
            <p className="text-xs text-muted-foreground">All payment links</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statistics.active_links}</div>
            <p className="text-xs text-muted-foreground">Accepting payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{statistics.completed_links}</div>
            <p className="text-xs text-muted-foreground">Finished or max uses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Single Use</CardTitle>
            <CreditCard className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{statistics.single_use_links}</div>
            <p className="text-xs text-muted-foreground">One-time payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total_payments}</div>
            <p className="text-xs text-muted-foreground">Completed transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(statistics.total_revenue)}</div>
            <p className="text-xs text-muted-foreground">Total earnings</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Links</CardTitle>
          <CardDescription>
            View and manage all your payment links with enhanced status controls
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search payment links..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Links List */}
          {paymentLinks.length === 0 ? (
            <div className="text-center py-12">
              <LinkIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payment links found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Create your first payment link to get started.'
                }
              </p>
              <Link href="/merchant/dashboard/payments/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Payment Link
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {paymentLinks.map((link) => (
                <div
                  key={link.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{link.title}</h3>
                        {getStatusBadge(link.status, link)}
                      </div>
                      
                      {link.description && (
                        <p className="text-gray-600 text-sm mb-2">{link.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="font-medium text-gray-900">
                          {formatCurrency(link.amount, link.currency)}
                        </span>
                        <span>Created {formatDate(link.created_at)}</span>
                        {link.expires_at && (
                          <span>Expires {formatDate(link.expires_at)}</span>
                        )}
                        {link.max_uses && (
                          <span>{link.usage_count}/{link.max_uses} uses</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {/* Status Action Buttons */}
                      {getStatusActions(link)}
                      
                      {/* Standard Action Buttons */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(getPaymentUrl(link.link_id), link.id)}
                        className="flex items-center gap-1"
                      >
                        <Copy className="h-3 w-3" />
                        {copiedId === link.id ? 'Copied!' : 'Copy'}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(getPaymentUrl(link.link_id), '_blank')}
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Open
                      </Button>
                      
                      <Link href={`/merchant/dashboard/payments/${link.id}`}>
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

