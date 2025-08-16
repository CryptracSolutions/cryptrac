'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, makeAuthenticatedRequest } from '@/lib/supabase-browser';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';

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
}

export default function MerchantSubscriptionsPage() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [filteredSubs, setFilteredSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    (async () => {
      try {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '✓';
      case 'paused': return '⏸';
      case 'completed': return '🏁';
      case 'canceled': return '✕';
      default: return '?';
    }
  };

  const formatInterval = (count: number, interval: string) => {
    if (count === 1) {
      return interval;
    }
    return `${count} ${interval}s`;
  };

  const getSubscriptionStats = () => {
    const stats = {
      total: subs.length,
      active: subs.filter(s => s.status === 'active').length,
      paused: subs.filter(s => s.status === 'paused').length,
      completed: subs.filter(s => s.status === 'completed').length,
      canceled: subs.filter(s => s.status === 'canceled').length,
    };
    return stats;
  };

  const stats = getSubscriptionStats();

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading subscriptions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Subscriptions</h1>
          <p className="text-gray-600">Manage your recurring payment subscriptions</p>
        </div>
        <Link href="/merchant/subscriptions/create">
          <Button size="lg">
            + Create Subscription
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-gray-600">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.paused}</div>
            <div className="text-sm text-gray-600">Paused</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.canceled}</div>
            <div className="text-sm text-gray-600">Canceled</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by title, customer name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="canceled">Canceled</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions List */}
      {filteredSubs.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold mb-2">
              {subs.length === 0 ? 'No subscriptions yet' : 'No subscriptions match your filters'}
            </h3>
            <p className="text-gray-600 mb-4">
              {subs.length === 0 
                ? 'Create your first subscription to start accepting recurring payments'
                : 'Try adjusting your search or filter criteria'
              }
            </p>
            {subs.length === 0 && (
              <Link href="/merchant/subscriptions/create">
                <Button>Create Your First Subscription</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSubs.map(s => (
            <Card key={s.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Link 
                        href={`/merchant/subscriptions/${s.id}`} 
                        className="text-xl font-semibold text-blue-600 hover:underline"
                      >
                        {s.title}
                      </Link>
                      <Badge variant={getStatusVariant(s.status)}>
                        {getStatusIcon(s.status)} {s.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Customer:</span>
                        <div className="font-medium">
                          {s.name || s.email || s.phone || 'No customer info'}
                        </div>
                        {s.name && s.email && (
                          <div className="text-gray-500">{s.email}</div>
                        )}
                      </div>
                      
                      <div>
                        <span className="text-gray-500">Amount:</span>
                        <div className="font-medium text-lg">
                          {s.amount} {s.currency}
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-gray-500">Frequency:</span>
                        <div className="font-medium">
                          Every {formatInterval(s.interval_count, s.interval)}
                        </div>
                        {s.max_cycles && (
                          <div className="text-gray-500">
                            Max: {s.max_cycles} cycles
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <span className="text-gray-500">Next Billing:</span>
                        <div className="font-medium">
                          {s.next_billing_at ? 
                            new Date(s.next_billing_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            }) : 
                            '—'
                          }
                        </div>
                        {s.next_billing_at && new Date(s.next_billing_at) < new Date() && s.status === 'active' && (
                          <div className="text-red-600 text-xs">Overdue</div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Link href={`/merchant/subscriptions/${s.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Results count */}
      {filteredSubs.length > 0 && (
        <div className="mt-6 text-center text-sm text-gray-600">
          Showing {filteredSubs.length} of {subs.length} subscriptions
        </div>
      )}
    </div>
  );
}

