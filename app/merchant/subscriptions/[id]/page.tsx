"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTimezone } from '@/lib/contexts/TimezoneContext';
import { formatDateShort, formatDate } from '@/lib/utils/date-utils';
// import Link from 'next/link';
import { makeAuthenticatedRequest, supabase } from '@/lib/supabase-browser';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { toast } from 'react-hot-toast';
import { Breadcrumbs } from '@/app/components/ui/breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import {
  MobileDataCard,
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
  BottomSheetDescription,
} from '@/app/components/ui/bottom-sheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/app/components/ui/collapsible';
import { cn } from '@/lib/utils';
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  DollarSign,
  Clock,
  Info,
  Mail,
  Phone,
  User,
  Receipt,
  Settings,
  FileText,
  Send,
  Copy,
  CheckCircle
} from 'lucide-react';

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  cycle_start_at: string;
  due_date: string;
  invoice_number?: string; // Task 7: Add invoice number
}

interface AmountOverride {
  id: string;
  effective_from: string;
  effective_until?: string;
  amount: number;
  note?: string;
  created_at: string;
}

interface Subscription {
  id: string;
  title: string;
  amount: number;
  currency: string;
  interval: string;
  interval_count: number;
  status: string;
  next_billing_at?: string;
  max_cycles?: number;
  total_cycles?: number;
  missed_payments_count?: number;
  tax_enabled?: boolean;
  tax_rates?: Array<{ name: string; rate: number }>;
  charge_customer_fee?: boolean;
  auto_convert_enabled?: boolean;
  pause_after_missed_payments?: number;
  invoice_due_days?: number;
  generate_days_in_advance?: number;
  past_due_after_days?: number;
  auto_resume_on_payment?: boolean;
  created_at?: string;
  paused_at?: string;
  resumed_at?: string;
  completed_at?: string;
  canceled_at?: string;
  customer_id?: string;
}

interface Customer {
  id: string;
  email?: string;
  name?: string;
  phone?: string;
}

// FIXED: Helper function to format date without timezone conversion issues
// Helper function to format date (will use timezone from the component that calls it)
function formatDateOnly(dateString: string, timezone: string): string {
  return formatDate(dateString, {
    timeZone: timezone,
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Helper function to calculate upcoming cycles dynamically
function calculateUpcomingCycles(subscription: Subscription, requestedCount?: number): Array<{date: string, amount: number, hasOverride: boolean, overrideNote?: string, cycleNumber: number}> {
  if (!subscription.next_billing_at) return [];
  
  // Determine how many cycles to show
  let maxCyclesToShow: number;
  if (requestedCount) {
    maxCyclesToShow = requestedCount;
  } else if (subscription.max_cycles) {
    // If max_cycles is set, show remaining cycles (up to 12)
    const remainingCycles = subscription.max_cycles - (subscription.total_cycles || 0);
    maxCyclesToShow = Math.min(remainingCycles, 12);
  } else {
    // If no max_cycles, show default 12
    maxCyclesToShow = 12;
  }
  
  const cycles = [];
  const currentDate = new Date(subscription.next_billing_at);
  const startingCycleNumber = (subscription.total_cycles || 0) + 1;
  
  for (let i = 0; i < maxCyclesToShow; i++) {
    const cycleDate = new Date(currentDate);
    cycles.push({
      date: cycleDate.toISOString().split('T')[0],
      amount: subscription.amount,
      hasOverride: false,
      cycleNumber: startingCycleNumber + i
    });
    
    // Calculate next cycle based on interval
    switch (subscription.interval) {
      case 'day':
        currentDate.setDate(currentDate.getDate() + subscription.interval_count);
        break;
      case 'week':
        currentDate.setDate(currentDate.getDate() + (subscription.interval_count * 7));
        break;
      case 'month':
        currentDate.setMonth(currentDate.getMonth() + subscription.interval_count);
        break;
      case 'year':
        currentDate.setFullYear(currentDate.getFullYear() + subscription.interval_count);
        break;
    }
  }
  
  return cycles;
}

export default function SubscriptionDetailPage() {
  const params = useParams();
  const id = String(params?.id);
  const { timezone } = useTimezone();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [amountOverrides, setAmountOverrides] = useState<AmountOverride[]>([]);
  const [override, setOverride] = useState({ effective_from: '', effective_until: '', amount: '', note: '' });
  const [invoiceLink, setInvoiceLink] = useState<{ url: string; id: string } | null>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);

  // Mobile-specific state
  const [isOverrideSheetOpen, setOverrideSheetOpen] = useState(false);
  const [isInvoiceSheetOpen, setInvoiceSheetOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    customer: false,
    timing: false,
    invoices: false,
    overrides: false,
    upcomingCycles: true,
  });
  
  // ENHANCED: Add state for future cycle targeting
  const [targetCycleDate, setTargetCycleDate] = useState('');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // ENHANCED: Add state for upcoming cycles display
  const [showAllCycles, setShowAllCycles] = useState(false);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const fetchInvoices = useCallback(async (): Promise<void> => {
    const { data: invs } = await supabase
      .from('subscription_invoices')
      .select('id, amount, currency, status, created_at, cycle_start_at, due_date, invoice_number')
      .eq('subscription_id', id)
      .order('cycle_start_at', { ascending: false });
    setInvoices(invs || []);
  }, [id]);

  // Task 6: Fetch amount overrides
  const fetchAmountOverrides = useCallback(async (): Promise<void> => {
    const { data: overrides } = await supabase
      .from('subscription_amount_overrides')
      .select('id, effective_from, effective_until, amount, note, created_at')
      .eq('subscription_id', id)
      .order('effective_from', { ascending: false });
    setAmountOverrides(overrides || []);
  }, [id]);

  const fetchCustomerData = useCallback(async (customerId: string): Promise<void> => {
    const { data: customerData } = await supabase
      .from('customers')
      .select('id, email, name, phone')
      .eq('id', customerId)
      .single();
      
    if (customerData) {
      setCustomer(customerData);
      if (customerData.email) {
        setEmail(customerData.email);
      }
    }
  }, []);

  useEffect(() => {
    const loadSubscriptionData = async (): Promise<void> => {
      try {
        setLoading(true);
        
        // Load subscription data
        const res = await makeAuthenticatedRequest(`/api/subscriptions/${id}`);
        const json = await res.json();
        const subscriptionData = json.data;
        setSub(subscriptionData);
        
        // Load related data in parallel
        const promises: Promise<void>[] = [
          fetchInvoices(),
          fetchAmountOverrides()
        ];
        
        if (subscriptionData?.customer_id) {
          promises.push(fetchCustomerData(subscriptionData.customer_id));
        }
        
        await Promise.all(promises);
      } catch (error) {
        console.error('Error loading subscription data:', error);
        toast.error('Failed to load subscription data');
      } finally {
        setLoading(false);
      }
    };

    loadSubscriptionData();
  }, [id, fetchInvoices, fetchAmountOverrides, fetchCustomerData]);

  const scheduleOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    const requestBody: Record<string, unknown> = { 
      effective_from: override.effective_from, 
      amount: parseFloat(override.amount), 
      note: override.note 
    };
    
    // Only include effective_until if it's provided
    if (override.effective_until) {
      requestBody.effective_until = override.effective_until;
    }
    
    const res = await makeAuthenticatedRequest(`/api/subscriptions/${id}/amount-overrides`, {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });
    if (res.ok) {
      toast.success('Override scheduled');
      await fetchAmountOverrides(); // Task 6: Refresh overrides list
      setOverride({ effective_from: '', effective_until: '', amount: '', note: '' });
    } else {
      const json = await res.json();
      toast.error(json.error || 'Failed to schedule override');
    }
  };

  // ENHANCED: Updated generateInvoice function with future cycle targeting
  const generateInvoice = async () => {
    const requestBody = targetCycleDate ? { target_cycle_date: targetCycleDate } : {};
    
    const res = await makeAuthenticatedRequest(`/api/subscriptions/${id}/generate-invoice`, { 
      method: 'POST',
      body: JSON.stringify(requestBody)
    });
    const json = await res.json();
    if (res.ok) {
      setInvoiceLink({ url: json.payment_url, id: json.payment_link_id });
      
      let successMessage = 'Invoice generated';
      if (json.target_cycle_used) {
        successMessage += ` for cycle ${targetCycleDate}`;
      }
      if (json.email_notification_sent) {
        successMessage += ' and notification email sent to customer';
      }
      
      toast.success(successMessage);
      await fetchInvoices();
      
      // Clear target cycle date after successful generation
      setTargetCycleDate('');
    } else {
      toast.error(json.error || 'Failed to generate invoice');
    }
  };

  const sendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceLink || !email) return;
    
    try {
      const response = await makeAuthenticatedRequest(`/api/subscriptions/${id}/send-invoice-notification`, {
        method: 'POST',
        body: JSON.stringify({
          email: email,
          payment_url: invoiceLink.url
        })
      });
      
      if (response.ok) {
        toast.success('Invoice notification sent');
        setEmail(''); // Clear email field after successful send
      } else {
        const errorData = await response.json();
        console.error('Failed to send invoice notification:', errorData);
        toast.error(errorData.error || 'Failed to send invoice notification');
      }
    } catch (error) {
      console.error('Error sending invoice notification:', error);
      toast.error('Failed to send invoice notification');
    }
  };

  // ENHANCED: Calculate upcoming cycles with override information (dynamic count)
  const upcomingCycles = sub ? calculateUpcomingCycles(sub, showAllCycles ? undefined : 5) : [];
  
  // Apply overrides to upcoming cycles
  const cyclesWithOverrides = upcomingCycles.map(cycle => {
    const applicableOverride = amountOverrides.find(override => 
      override.effective_from <= cycle.date && 
      (!override.effective_until || override.effective_until >= cycle.date)
    );
    
    return {
      ...cycle,
      amount: applicableOverride?.amount || cycle.amount,
      hasOverride: !!applicableOverride,
      overrideNote: applicableOverride?.note
    };
  });

  // Get the amount that would be used for the target cycle
  const getTargetCycleAmount = () => {
    if (!targetCycleDate || !sub) return sub?.amount || 0;
    
    const applicableOverride = amountOverrides.find(override => 
      override.effective_from <= targetCycleDate &&
      (!override.effective_until || override.effective_until >= targetCycleDate)
    );
    
    return applicableOverride?.amount || sub?.amount || 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#7f5efd]"></div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-6xl space-y-8 px-6 py-8",
        "max-md:space-y-6 max-md:px-4 max-md:py-6 max-md:pb-28"
      )}
    >
      <div className="hidden md:block mb-6">
        <Breadcrumbs
          items={[
            { name: 'Dashboard', href: '/merchant/dashboard' },
            { name: 'Subscriptions', href: '/merchant/subscriptions' },
            { name: sub?.title || 'Loading...', href: '#' }
          ]}
        />
      </div>

      {sub && (
        <div className="mb-6 max-md:mb-4">
          <h1 className="hidden md:block font-phonic text-3xl font-normal tracking-tight text-gray-900 mb-4">{sub.title}</h1>
          <div className="hidden md:block space-y-2">
            <p className="font-capsule text-base font-normal text-gray-600 max-md:text-sm">
              <span className="font-semibold text-[#7f5efd] text-lg max-md:text-base">
                ${sub.amount} {sub.currency}
              </span>
              <span className="ml-2">
                every {sub.interval_count} {sub.interval}
                {sub.interval_count > 1 ? 's' : ''}
              </span>
            </p>
            {sub.next_billing_at && (
              <p className="font-capsule text-base font-normal text-gray-600">
                <Clock className="inline h-4 w-4 mr-1 text-gray-500" />
                Next: {sub.next_billing_at ? formatDateShort(sub.next_billing_at, timezone) : 'Not scheduled'}
              </p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                {sub.status}
              </Badge>
              {sub.max_cycles && (
                <Badge variant="outline" className="text-xs">
                  {sub.total_cycles || 0}/{sub.max_cycles} cycles
                </Badge>
              )}
              {sub.missed_payments_count && sub.missed_payments_count > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {sub.missed_payments_count} missed
                </Badge>
              )}
            </div>
          </div>

          <MobileDataCard className="md:hidden space-y-4">
            <h1 className="sr-only">{sub.title}</h1>
            <MobileDataCardHeader className="gap-1">
              <MobileDataCardTitle className="text-base font-semibold text-gray-900">
                {sub.title}
              </MobileDataCardTitle>
                <MobileDataCardSubtitle>
                  every {sub.interval_count} {sub.interval}
                  {sub.interval_count > 1 ? 's' : ''}
                </MobileDataCardSubtitle>
              </MobileDataCardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                  {sub.status}
                </Badge>
                {sub.max_cycles ? (
                  <Badge variant="outline" className="text-xs">
                    {(sub.total_cycles || 0)}/{sub.max_cycles} cycles
                  </Badge>
                ) : null}
                {sub.missed_payments_count && sub.missed_payments_count > 0 ? (
                  <Badge variant="destructive" className="text-xs">
                    {sub.missed_payments_count} missed
                  </Badge>
                ) : null}
              </div>
              <MobileDataCardMeta className="grid grid-cols-2 gap-3">
                <MobileDataCardMetaItem
                  label="Amount"
                  value={`$${sub.amount} ${sub.currency}`}
                  accent
                />
                <MobileDataCardMetaItem
                  label="Next Billing"
                  value={sub.next_billing_at
                    ? formatDateShort(sub.next_billing_at, timezone)
                    : 'Not scheduled'}
                />
                {sub.max_cycles ? (
                  <MobileDataCardMetaItem
                    label="Cycles"
                    value={`${sub.total_cycles || 0} of ${sub.max_cycles}`}
                  />
                ) : null}
                {typeof sub.invoice_due_days === 'number' ? (
                  <MobileDataCardMetaItem
                    label="Invoice Due"
                    value={`${sub.invoice_due_days} days`}
                  />
                ) : null}
              </MobileDataCardMeta>
            </MobileDataCard>

          {/* Desktop Customer Information */}
          {customer && (
            <Card className="hidden md:block mt-4 border border-gray-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5 text-[#7f5efd]" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  {customer.name && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Name</p>
                        <p className="font-medium">{customer.name}</p>
                      </div>
                    </div>
                  )}
                  {customer.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="font-medium">{customer.email}</p>
                      </div>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="font-medium">{customer.phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mobile Customer Information Collapsible */}
          {customer && (
            <div className="md:hidden">
              <Collapsible open={expandedSections.customer} onOpenChange={() => toggleSection('customer')}>
                <CollapsibleTrigger asChild>
                  <MobileDataCard className="cursor-pointer">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#7f5efd]/10 text-[#7f5efd]">
                          <User className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900">Customer</p>
                          {!expandedSections.customer && (
                            <p className="truncate text-xs text-gray-600">
                              {customer.name || customer.email || 'No info'}
                            </p>
                          )}
                        </div>
                      </div>
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 text-gray-500 transition-transform',
                          expandedSections.customer && 'rotate-180 text-[#7f5efd]'
                        )}
                      />
                    </div>
                  </MobileDataCard>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <MobileDataCard className="mt-3">
                    <MobileDataCardMeta className="grid grid-cols-1 gap-3">
                      {customer.name && (
                        <MobileDataCardMetaItem label="Name" value={customer.name} />
                      )}
                      {customer.email && (
                        <MobileDataCardMetaItem
                          label="Email"
                          value={<span className="break-words text-sm">{customer.email}</span>}
                        />
                      )}
                      {customer.phone && (
                        <MobileDataCardMetaItem label="Phone" value={customer.phone} />
                      )}
                    </MobileDataCardMeta>
                  </MobileDataCard>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}

          {/* Desktop Timing Configuration */}
          <Card className="hidden md:block mt-4 border border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Settings className="h-5 w-5 text-[#7f5efd]" />
                Timing Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Invoice Due Days</p>
                  <p className="font-medium">{sub.invoice_due_days || 0} days</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Generate in Advance</p>
                  <p className="font-medium">{sub.generate_days_in_advance || 0} days</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Past Due After</p>
                  <p className="font-medium">{sub.past_due_after_days || 2} days</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Auto Resume</p>
                  <p className="font-medium">{sub.auto_resume_on_payment ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mobile Timing Configuration Collapsible */}
          <div className="md:hidden">
            <Collapsible open={expandedSections.timing} onOpenChange={() => toggleSection('timing')}>
              <CollapsibleTrigger asChild>
                <MobileDataCard className="cursor-pointer">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#7f5efd]/10 text-[#7f5efd]">
                        <Settings className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900">Timing</p>
                        {!expandedSections.timing && (
                          <p className="truncate text-xs text-gray-600">
                            Due: {sub.invoice_due_days || 0}d • Advance: {sub.generate_days_in_advance || 0}d
                          </p>
                        )}
                      </div>
                    </div>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 text-gray-500 transition-transform',
                        expandedSections.timing && 'rotate-180 text-[#7f5efd]'
                      )}
                    />
                  </div>
                </MobileDataCard>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <MobileDataCard className="mt-3">
                  <MobileDataCardMeta className="grid grid-cols-2 gap-3">
                    <MobileDataCardMetaItem
                      label="Invoice Due"
                      value={`${sub.invoice_due_days || 0} days`}
                    />
                    <MobileDataCardMetaItem
                      label="Generate Early"
                      value={`${sub.generate_days_in_advance || 0} days`}
                    />
                    <MobileDataCardMetaItem
                      label="Past Due"
                      value={`${sub.past_due_after_days || 2} days`}
                    />
                    <MobileDataCardMetaItem
                      label="Auto Resume"
                      value={sub.auto_resume_on_payment ? 'Yes' : 'No'}
                    />
                  </MobileDataCardMeta>
                </MobileDataCard>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      )}

      {/* ENHANCED: Upcoming Billing Cycles Preview with Dynamic Display */}
      {cyclesWithOverrides.length > 0 && (
        <Card className={cn(
          "mb-6 border border-gray-200 shadow-sm",
          "max-md:rounded-3xl"
        )}>
          <CardHeader className="pb-3 max-md:p-5 max-md:pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-semibold flex items-center gap-2 max-md:text-lg">
                <Calendar className="h-5 w-5 text-[#7f5efd] max-md:h-4 max-md:w-4" />
                Upcoming Cycles
              </CardTitle>
              <div className="flex items-center gap-2">
                {!showAllCycles && cyclesWithOverrides.length >= 5 && (
                  <button
                    onClick={() => setShowAllCycles(true)}
                    className="text-sm text-blue-600 hover:text-blue-800 underline max-md:text-xs"
                  >
                    Show All {sub?.max_cycles ? `(${Math.min((sub.max_cycles - (sub.total_cycles || 0)), 12)})` : '(12)'}
                  </button>
                )}
                {showAllCycles && (
                  <button
                    onClick={() => setShowAllCycles(false)}
                    className="text-sm text-gray-600 hover:text-gray-800 underline max-md:text-xs"
                  >
                    Show Less
                  </button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 max-md:p-5 max-md:pt-0">
          
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded max-md:text-xs max-md:p-2.5">
              <p className="text-sm text-blue-800 max-md:text-xs">
                {sub?.max_cycles ? (
                  <>
                    <Info className="inline h-3 w-3 mr-1" />
                    <strong>Progress:</strong> {cyclesWithOverrides.length} upcoming
                    <span className="hidden md:inline"> (cycles {((sub.total_cycles || 0) + 1)}-{((sub.total_cycles || 0) + cyclesWithOverrides.length)} of {sub.max_cycles})</span>
                  </>
                ) : (
                  <>
                    <Info className="inline h-3 w-3 mr-1" />
                    <strong>Ongoing:</strong> Next {cyclesWithOverrides.length} cycles
                    <span className="hidden md:inline"> • Continues indefinitely</span>
                  </>
                )}
                <span className="hidden md:inline">
                  <br />
                  <strong>Automatic billing</strong> will use these amounts when each cycle date arrives.
                </span>
              </p>
            </div>
          
            {/* Desktop cycles list */}
            <div className="hidden md:block space-y-2 max-h-96 overflow-y-auto">
              {cyclesWithOverrides.map((cycle, index) => (
                <div key={cycle.date} className={`flex justify-between items-center p-3 rounded ${
                  index === 0 ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                }`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {formatDateOnly(cycle.date, timezone)}
                      </span>
                      {index === 0 && <Badge variant="default" className="text-xs">Next</Badge>}
                      {cycle.hasOverride && (
                        <Badge variant="outline" className="text-xs bg-orange-50">
                          Override
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Cycle #{cycle.cycleNumber}
                      {sub?.max_cycles && ` of ${sub.max_cycles}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-medium ${cycle.hasOverride ? 'text-orange-600' : 'text-gray-900'}`}>
                      ${cycle.amount} {sub?.currency}
                    </span>
                    {cycle.hasOverride && cycle.overrideNote && (
                      <div className="text-xs text-gray-500">{cycle.overrideNote}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile cycles list - horizontal scroll */}
            <div className="md:hidden -mx-5 px-5 overflow-x-auto">
              <div className="flex gap-3 pb-2" style={{ minWidth: 'max-content' }}>
                {cyclesWithOverrides.map((cycle, index) => (
                  <div
                    key={cycle.date}
                    className={cn(
                      "flex-shrink-0 w-40 p-3 rounded-xl border",
                      index === 0
                        ? "bg-blue-50 border-blue-200"
                        : "bg-gray-50 border-gray-200"
                    )}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        {index === 0 && <Badge variant="default" className="text-[10px] px-1.5 py-0">Next</Badge>}
                        {cycle.hasOverride && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Override</Badge>}
                      </div>
                      <p className="font-medium text-sm">
                        {new Date(cycle.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        Cycle #{cycle.cycleNumber}
                      </p>
                      <p className={cn(
                        "font-semibold text-base",
                        cycle.hasOverride ? "text-orange-600" : "text-[#7f5efd]"
                      )}>
                        ${cycle.amount}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded max-md:text-xs max-md:p-2.5">
              <p className="text-sm text-green-800 max-md:text-xs">
                <CheckCircle className="inline h-3 w-3 mr-1" />
                <strong>Auto-billing:</strong> Active
                <span className="hidden md:inline"> • Runs every minute</span>
                <span className="md:hidden"> • 1min</span>
                <br className="hidden md:block" />
                <span className="hidden md:inline">
                  <strong>Manual:</strong> Generate invoices below for testing.
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Desktop Generate Invoice Section */}
      <Card className="hidden md:block mb-6 border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#7f5efd]" />
            Manual Invoice Generation
          </CardTitle>
        </CardHeader>
        <CardContent>
        
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-800">
            <strong>ℹ️ When to use this:</strong> Manual invoice generation is typically used for testing, early billing, or special circumstances. 
            Your subscription will automatically generate invoices on the scheduled dates shown above.
          </p>
        </div>

        {/* Standard Generation */}
        <div className="mb-4">
          <h3 className="font-phonic text-base font-normal mb-2">Standard Generation</h3>
          <p className="font-phonic text-sm font-normal text-gray-600 mb-3">
            Generate an invoice for the next scheduled billing cycle ({sub?.next_billing_at ? formatDateOnly(sub.next_billing_at.split('T')[0], timezone) : 'Not scheduled'}).
            This will advance your subscription&apos;s billing schedule.
          </p>
          <Button onClick={() => {setTargetCycleDate(''); generateInvoice();}} className="mb-4">
            Generate Next Invoice (${cyclesWithOverrides[0]?.amount || sub?.amount} {sub?.currency})
          </Button>
        </div>

        {/* Advanced Options Toggle */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            {showAdvancedOptions ? 'Hide' : 'Show'} Advanced Options (Future Cycle Targeting)
          </button>
        </div>

        {/* Advanced Options */}
        {showAdvancedOptions && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded">
            <h4 className="font-medium mb-3 text-amber-800">Future Cycle Targeting</h4>
            
            <div className="mb-4 p-3 bg-white border border-amber-300 rounded">
              <p className="text-sm text-amber-800 mb-2">
                <strong>⚠️ Advanced Feature:</strong> This allows you to generate an invoice for any future cycle date, 
                primarily useful for testing amount overrides or special billing scenarios.
              </p>
              <ul className="text-xs text-amber-700 space-y-1">
                <li>• <strong>Does NOT advance</strong> your subscription&apos;s normal billing schedule</li>
                <li>• <strong>Creates an additional invoice</strong> for the specified date</li>
                <li>• <strong>Useful for testing</strong> how overrides will work on future cycles</li>
                <li>• <strong>Customer will receive</strong> an email notification for the generated invoice</li>
              </ul>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Target Cycle Date</label>
                <Input
                  type="date"
                  value={targetCycleDate}
                  onChange={(e) => setTargetCycleDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="form-input-enhanced"
                />
              </div>
              
              {targetCycleDate && (
                <div className="p-3 bg-white border border-amber-300 rounded">
                  <h5 className="font-medium text-amber-800 mb-2">Preview for {formatDateOnly(targetCycleDate, timezone)}:</h5>
                  <div className="text-sm space-y-1">
                    <div>
                      <span className="font-medium">Invoice Amount:</span> 
                      <span className="ml-2 font-bold text-green-600">
                        ${getTargetCycleAmount()} {sub?.currency}
                      </span>
                      {getTargetCycleAmount() !== sub?.amount && (
                        <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                          Override Applied
                        </span>
                      )}
                    </div>
                    <div><span className="font-medium">Email Notification:</span> Will be sent to customer</div>
                    <div><span className="font-medium">Billing Schedule:</span> Will NOT be affected</div>
                  </div>
                </div>
              )}
              
              <Button 
                onClick={generateInvoice} 
                disabled={!targetCycleDate}
                className="w-full"
              >
                {targetCycleDate 
                  ? `Generate Invoice for ${formatDateOnly(targetCycleDate, timezone)} ($${getTargetCycleAmount()} ${sub?.currency})`
                  : 'Select a target date first'
                }
              </Button>
            </div>
          </div>
        )}
        
        {invoiceLink && (
          <div className="space-y-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-green-800 font-medium">Invoice Generated Successfully!</p>
              <p className="text-sm text-green-600 mt-1">
                Payment URL: <a href={invoiceLink.url} target="_blank" rel="noopener noreferrer" className="underline">
                  {invoiceLink.url}
                </a>
              </p>
            </div>
            
            <form onSubmit={sendEmail} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Send additional notification to:</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="customer@example.com"
                  required
                  className="form-input-enhanced"
                />
              </div>
              <Button type="submit" disabled={!email}>
                Send Additional Notification
              </Button>
            </form>
          </div>
        )}
        </CardContent>
      </Card>

      {/* Mobile Generate Invoice - Bottom Sheet Trigger */}
      <MobileDataCard
        className="md:hidden mb-6 cursor-pointer space-y-3"
        onClick={() => setInvoiceSheetOpen(true)}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#7f5efd]/10 text-[#7f5efd]">
              <FileText className="h-4 w-4" />
            </span>
            <div>
              <MobileDataCardTitle className="text-sm">Generate Invoice</MobileDataCardTitle>
              <MobileDataCardSubtitle>
                Next: ${cyclesWithOverrides[0]?.amount || sub?.amount} {sub?.currency}
                {sub?.next_billing_at && (
                  <span className="block text-[11px] text-gray-500">
                    {formatDateShort(sub.next_billing_at, timezone)}
                  </span>
                )}
              </MobileDataCardSubtitle>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-500" />
        </div>
        <p className="text-xs text-gray-500">
          Tap to open manual invoicing options
        </p>
      </MobileDataCard>

      {/* Desktop Amount Overrides Section */}
      <Card className="hidden md:block mb-6 border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-[#7f5efd]" />
            Amount Overrides
          </CardTitle>
        </CardHeader>
        <CardContent>
        
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-sm text-green-800">
              <Info className="inline h-4 w-4 mr-1" />
              <strong>How it works:</strong> Overrides apply to all cycles on/after the effective date.
              Check upcoming cycles above to see effects.
            </p>
          </div>
        
          {/* Schedule New Override */}
          <form onSubmit={scheduleOverride} className="space-y-4 mb-6">
            <h3 className="font-semibold">Schedule New Override</h3>
          
          {/* Date Range Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-phonic text-sm font-normal mb-1">Start Date (Effective From)</label>
              <Input
                type="date"
                value={override.effective_from}
                onChange={(e) => setOverride(prev => ({ ...prev, effective_from: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                required
                className="form-input-enhanced"
              />
              <p className="font-phonic text-xs font-normal text-gray-500 mt-1">When the override begins</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date (Optional)</label>
              <Input
                type="date"
                value={override.effective_until}
                onChange={(e) => setOverride(prev => ({ ...prev, effective_until: e.target.value }))}
                min={override.effective_from || new Date().toISOString().split('T')[0]}
                className="form-input-enhanced"
              />
              <p className="font-phonic text-xs font-normal text-gray-500 mt-1">Leave empty for permanent override</p>
            </div>
          </div>
          
          {/* Amount and Note Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-phonic text-sm font-normal mb-1">New Amount</label>
              <Input
                type="number"
                step="0.01"
                value={override.amount}
                onChange={(e) => setOverride(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="29.99"
                required
                className="form-input-enhanced"
              />
            </div>
            <div>
              <label className="block font-phonic text-sm font-normal mb-1">Note (Optional)</label>
              <Input
                value={override.note}
                onChange={(e) => setOverride(prev => ({ ...prev, note: e.target.value }))}
                placeholder="Annual maintenance fee"
                className="form-input-enhanced"
              />
            </div>
          </div>
          
          {/* Quick Preset Options */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm font-medium text-blue-800 mb-2">Quick Presets:</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
                  setOverride(prev => ({
                    ...prev,
                    effective_from: today.toISOString().split('T')[0],
                    effective_until: nextMonth.toISOString().split('T')[0]
                  }));
                }}
                className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200"
              >
                1 Month Override
              </button>
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  const nextYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
                  setOverride(prev => ({
                    ...prev,
                    effective_from: today.toISOString().split('T')[0],
                    effective_until: nextYear.toISOString().split('T')[0]
                  }));
                }}
                className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200"
              >
                1 Year Override
              </button>
              <button
                type="button"
                onClick={() => {
                  setOverride(prev => ({
                    ...prev,
                    effective_until: ''
                  }));
                }}
                className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded hover:bg-gray-200"
              >
                Permanent Override
              </button>
            </div>
            </div>

            <Button type="submit" className="h-11 bg-[#7f5efd] hover:bg-[#6b4fd8] text-white">
              Schedule Override
            </Button>
          </form>

          {/* Existing Overrides */}
          {amountOverrides.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Scheduled Overrides</h3>
              <div className="space-y-2">
                {amountOverrides.map(override => (
                  <div key={override.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">${override.amount}</span>
                        {override.effective_until ? (
                          <Badge variant="outline" className="text-xs">
                            Time-Limited
                          </Badge>
                        ) : (
                          <Badge variant="default" className="text-xs">
                            Permanent
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        <span>From {formatDateOnly(override.effective_from, timezone)}</span>
                        {override.effective_until && (
                          <span> to {formatDateOnly(override.effective_until, timezone)}</span>
                        )}
                      </div>
                      {override.note && (
                        <div className="text-sm text-gray-500 mt-1">{override.note}</div>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      Created {formatDateShort(override.created_at, timezone)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mobile Amount Overrides - Collapsible or Sheet Trigger */}
      <MobileDataCard
        className="md:hidden mb-6 cursor-pointer space-y-3"
        onClick={() => setOverrideSheetOpen(true)}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#7f5efd]/10 text-[#7f5efd]">
              <DollarSign className="h-4 w-4" />
            </span>
            <div>
              <MobileDataCardTitle className="text-sm">Amount Overrides</MobileDataCardTitle>
              <MobileDataCardSubtitle>
                {amountOverrides.length > 0
                  ? `${amountOverrides.length} active overrides`
                  : 'Set custom amounts for cycles'}
              </MobileDataCardSubtitle>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-500" />
        </div>
        <p className="text-xs text-gray-500">Tap to review, edit, or create overrides</p>
      </MobileDataCard>

      {/* Desktop Invoices Section */}
      <Card className="hidden md:block border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Receipt className="h-5 w-5 text-[#7f5efd]" />
            Invoice History
          </CardTitle>
        </CardHeader>
        <CardContent>
        
          {invoices.length === 0 ? (
            <p className="text-gray-600">No invoices generated yet.</p>
          ) : (
            <div className="space-y-3">
              {invoices.map(invoice => (
                <div key={invoice.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">
                      {invoice.invoice_number && (
                        <span className="text-sm text-gray-500 mr-2">{invoice.invoice_number}</span>
                      )}
                      ${invoice.amount} {invoice.currency}
                    </div>
                    <div className="text-sm text-gray-600">
                      Cycle: {formatDateShort(invoice.cycle_start_at, timezone)} |
                      Due: {formatDateShort(invoice.due_date, timezone)}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={
                      invoice.status === 'paid' ? 'default' :
                      invoice.status === 'pending' ? 'secondary' :
                      invoice.status === 'past_due' ? 'destructive' : 'secondary'
                    }>
                      {invoice.status}
                    </Badge>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDateShort(invoice.created_at, timezone)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mobile Invoices Section - Collapsible */}
      <div className="md:hidden">
        <Collapsible open={expandedSections.invoices} onOpenChange={() => toggleSection('invoices')}>
          <CollapsibleTrigger asChild>
            <MobileDataCard className="cursor-pointer">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#7f5efd]/10 text-[#7f5efd]">
                    <Receipt className="h-4 w-4" />
                  </span>
                  <div>
                    <MobileDataCardTitle className="text-sm">Invoices</MobileDataCardTitle>
                    <MobileDataCardSubtitle>
                      {invoices.length === 1 ? '1 invoice' : `${invoices.length} invoices`}
                    </MobileDataCardSubtitle>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {invoices.length}
                  </Badge>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 text-gray-500 transition-transform',
                      expandedSections.invoices && 'rotate-180 text-[#7f5efd]'
                    )}
                  />
                </div>
              </div>
            </MobileDataCard>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <MobileDataCard className="mt-3 space-y-2">
              {invoices.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-600">No invoices generated yet.</p>
              ) : (
                invoices.map(invoice => (
                  <div key={invoice.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">
                          ${invoice.amount} {invoice.currency}
                        </p>
                        {invoice.invoice_number && (
                          <p className="text-xs text-gray-500">{invoice.invoice_number}</p>
                        )}
                      </div>
                      <Badge
                        variant={
                          invoice.status === 'paid'
                            ? 'default'
                            : invoice.status === 'pending'
                              ? 'secondary'
                              : invoice.status === 'past_due'
                                ? 'destructive'
                                : 'secondary'
                        }
                        className="text-xs"
                      >
                        {invoice.status}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-gray-600">
                      Cycle: {formatDateShort(invoice.cycle_start_at, timezone)}
                    </p>
                    <p className="text-xs text-gray-600">
                      Due: {formatDateShort(invoice.due_date, timezone)}
                    </p>
                  </div>
                ))
              )}
            </MobileDataCard>
          </CollapsibleContent>
        </Collapsible>
      </div>
      {/* Mobile Bottom Sheets */}

      {/* Invoice Generation Bottom Sheet */}
      <BottomSheet open={isInvoiceSheetOpen} onOpenChange={setInvoiceSheetOpen}>
        <BottomSheetContent className="md:hidden max-h-[90vh] overflow-y-auto" onDismiss={() => setInvoiceSheetOpen(false)}>
          <BottomSheetHeader className="text-left">
            <BottomSheetTitle>Generate Invoice</BottomSheetTitle>
            <BottomSheetDescription>
              Create an invoice for this subscription
            </BottomSheetDescription>
          </BottomSheetHeader>
          <div className="space-y-4 py-4">
            {/* Standard Generation */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Next Scheduled Invoice</h3>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="font-semibold text-lg text-[#7f5efd]">
                  ${cyclesWithOverrides[0]?.amount || sub?.amount} {sub?.currency}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {sub?.next_billing_at ? formatDateShort(sub.next_billing_at, timezone) : 'Not scheduled'}
                </p>
              </div>
              <Button
                onClick={() => {
                  setTargetCycleDate('');
                  generateInvoice();
                  setInvoiceSheetOpen(false);
                }}
                className="w-full h-12 bg-[#7f5efd] hover:bg-[#6b4fd8]"
              >
                Generate Invoice
              </Button>
            </div>

            {/* Invoice Link Result */}
            {invoiceLink && (
              <div className="space-y-3 pt-3 border-t">
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-sm font-medium text-green-800">Invoice Generated!</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(invoiceLink.url);
                      toast.success('URL copied!');
                    }}
                    className="mt-2 w-full"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Payment URL
                  </Button>
                </div>
                <form onSubmit={(e) => {
                  sendEmail(e);
                  setInvoiceSheetOpen(false);
                }} className="space-y-3">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Send notification to..."
                    className="h-12"
                    required
                  />
                  <Button type="submit" className="w-full h-12">
                    <Send className="h-4 w-4 mr-2" />
                    Send Notification
                  </Button>
                </form>
              </div>
            )}
          </div>
        </BottomSheetContent>
      </BottomSheet>

      {/* Amount Override Bottom Sheet */}
      <BottomSheet open={isOverrideSheetOpen} onOpenChange={setOverrideSheetOpen}>
        <BottomSheetContent className="md:hidden max-h-[90vh] overflow-y-auto" onDismiss={() => setOverrideSheetOpen(false)}>
          <BottomSheetHeader className="text-left">
            <BottomSheetTitle>Amount Overrides</BottomSheetTitle>
            <BottomSheetDescription>
              Set custom amounts for billing cycles
            </BottomSheetDescription>
          </BottomSheetHeader>
          <div className="space-y-4 py-4">
            {/* Existing Overrides */}
            {amountOverrides.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Active Overrides</h3>
                {amountOverrides.map(override => (
                  <div key={override.id} className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">${override.amount}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          From {formatDateShort(override.effective_from, timezone)}
                          {override.effective_until && (
                            <> to {formatDateShort(override.effective_until, timezone)}</>
                          )}
                        </p>
                        {override.note && (
                          <p className="text-xs text-gray-500 mt-1">{override.note}</p>
                        )}
                      </div>
                      <Badge variant={override.effective_until ? "outline" : "default"} className="text-xs">
                        {override.effective_until ? "Limited" : "Permanent"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* New Override Form */}
            <form onSubmit={(e) => {
              scheduleOverride(e);
              setOverrideSheetOpen(false);
            }} className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-sm">Schedule New Override</h3>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-700">Start Date</label>
                  <Input
                    type="date"
                    value={override.effective_from}
                    onChange={(e) => setOverride(prev => ({ ...prev, effective_from: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="h-12 mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700">End Date (Optional)</label>
                  <Input
                    type="date"
                    value={override.effective_until}
                    onChange={(e) => setOverride(prev => ({ ...prev, effective_until: e.target.value }))}
                    min={override.effective_from || new Date().toISOString().split('T')[0]}
                    className="h-12 mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700">New Amount</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={override.amount}
                    onChange={(e) => setOverride(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="29.99"
                    required
                    className="h-12 mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700">Note (Optional)</label>
                  <Input
                    value={override.note}
                    onChange={(e) => setOverride(prev => ({ ...prev, note: e.target.value }))}
                    placeholder="Reason for override..."
                    className="h-12 mt-1"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-12 bg-[#7f5efd] hover:bg-[#6b4fd8]">
                Schedule Override
              </Button>
            </form>
          </div>
        </BottomSheetContent>
      </BottomSheet>
    </div>
  );
}
