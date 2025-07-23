'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
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
  Trash2,
  DollarSign,
  CreditCard,
  TrendingUp,
  Link as LinkIcon
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PaymentLink {
  id: string;
  link_id: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  status: 'active' | 'expired' | 'completed';
  created_at: string;
  expires_at?: string;
  max_uses?: number;
  current_uses: number;
  qr_code_data?: string;
}

interface Statistics {
  total_links: number;
  active_links: number;
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

  const router = useRouter();

  const fetchPaymentLinks = async () => {
    try {
      console.log('Fetching payment links...');
      setLoading(true);
      setError(null);

      // Create Supabase client - same pattern as working payment creation
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Get user directly instead of session - matches working pattern
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('No user found:', userError);
        setError('Authentication required. Please log in.');
        router.push('/login');
        return;
      }

      console.log('User found, getting session...');

      // Get session for the token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('No session found:', sessionError);
        setError('Session expired. Please log in again.');
        router.push('/login');
        return;
      }

      console.log('Session found, making API call...');

      // Make API call with Authorization header - same as working payment creation
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      });

      const response = await fetch(`/api/payments?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication expired. Please log in again.');
          router.push('/login');
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ApiResponse = await response.json();
      console.log('API response:', data);

      if (data.success) {
        setPaymentLinks(data.data.payment_links || []);
        setStatistics(data.data.statistics || {
          total_links: 0,
          active_links: 0,
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
      setError(error instanceof Error ? error.message : 'Failed to load payment links');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentLinks();
  }, [currentPage, searchTerm, statusFilter]);

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

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      expired: 'secondary',
      completed: 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Links</CardTitle>
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total_links}</div>
            <p className="text-xs text-muted-foreground">
              All payment links created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Links</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.active_links}</div>
            <p className="text-xs text-muted-foreground">
              Currently accepting payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total_payments}</div>
            <p className="text-xs text-muted-foreground">
              Completed transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(statistics.total_revenue)}</div>
            <p className="text-xs text-muted-foreground">
              Total earnings received
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Links</CardTitle>
          <CardDescription>
            View and manage all your payment links
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
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
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
                        {getStatusBadge(link.status)}
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
                          <span>{link.current_uses}/{link.max_uses} uses</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
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

