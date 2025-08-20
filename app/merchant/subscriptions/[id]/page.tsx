"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { makeAuthenticatedRequest, supabase } from '@/lib/supabase-browser';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { toast } from 'react-hot-toast';

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
function formatDateOnly(dateString: string): string {
  // Parse as local date to avoid timezone conversion
  const [year, month, day] = dateString.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long', 
    day: 'numeric'
  });
}

// Helper function to calculate upcoming cycles
function calculateUpcomingCycles(subscription: Subscription, count: number = 5): Array<{date: string, amount: number, hasOverride: boolean, overrideNote?: string}> {
  if (!subscription.next_billing_at) return [];
  
  const cycles = [];
  let currentDate = new Date(subscription.next_billing_at);
  
  for (let i = 0; i < count; i++) {
    const cycleDate = new Date(currentDate);
    cycles.push({
      date: cycleDate.toISOString().split('T')[0],
      amount: subscription.amount,
      hasOverride: false
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
  const [sub, setSub] = useState<Subscription | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [amountOverrides, setAmountOverrides] = useState<AmountOverride[]>([]);
  const [override, setOverride] = useState({ effective_from: '', amount: '', note: '' });
  const [invoiceLink, setInvoiceLink] = useState<{ url: string; id: string } | null>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  
  // ENHANCED: Add state for future cycle targeting
  const [targetCycleDate, setTargetCycleDate] = useState('');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

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
      .select('id, effective_from, amount, note, created_at')
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
    const res = await makeAuthenticatedRequest(`/api/subscriptions/${id}/amount-overrides`, {
      method: 'POST',
      body: JSON.stringify({ effective_from: override.effective_from, amount: parseFloat(override.amount), note: override.note })
    });
    if (res.ok) {
      toast.success('Override scheduled');
      await fetchAmountOverrides(); // Task 6: Refresh overrides list
      setOverride({ effective_from: '', amount: '', note: '' });
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

  // ENHANCED: Calculate upcoming cycles with override information
  const upcomingCycles = sub ? calculateUpcomingCycles(sub, 5) : [];
  
  // Apply overrides to upcoming cycles
  const cyclesWithOverrides = upcomingCycles.map(cycle => {
    const applicableOverride = amountOverrides.find(override => 
      override.effective_from <= cycle.date
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
      override.effective_from <= targetCycleDate
    );
    
    return applicableOverride?.amount || sub?.amount || 0;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading subscription details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {sub && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">{sub.title}</h1>
          <p className="text-gray-600 mb-1">
            {sub.amount} {sub.currency} every {sub.interval_count} {sub.interval}
            {sub.interval_count > 1 ? 's' : ''}
            {sub.max_cycles && (
              <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {sub.max_cycles} cycles max
              </span>
            )}
          </p>
          {sub.next_billing_at && (
            <p className="text-gray-600 mb-1">
              Next billing: {sub.next_billing_at ? new Date(sub.next_billing_at).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : 'Not scheduled'}
            </p>
          )}
          <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
            {sub.status}
          </Badge>
          
          {/* Customer Information */}
          {customer && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Customer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {customer.name && (
                  <div>
                    <span className="font-medium">Name:</span> {customer.name}
                  </div>
                )}
                {customer.email && (
                  <div>
                    <span className="font-medium">Email:</span> {customer.email}
                  </div>
                )}
                {customer.phone && (
                  <div>
                    <span className="font-medium">Phone:</span> {customer.phone}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timing Configuration */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Timing Configuration</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Invoice Due Days:</span> {sub.invoice_due_days || 0}
              </div>
              <div>
                <span className="font-medium">Generate in Advance:</span> {sub.generate_days_in_advance || 0} days
              </div>
              <div>
                <span className="font-medium">Past Due After:</span> {sub.past_due_after_days || 2} days
              </div>
              <div>
                <span className="font-medium">Auto Resume:</span> {sub.auto_resume_on_payment ? 'Yes' : 'No'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ENHANCED: Upcoming Billing Cycles Preview */}
      {cyclesWithOverrides.length > 0 && (
        <div className="mb-6 p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-4">📅 Upcoming Billing Cycles</h2>
          <p className="text-sm text-gray-600 mb-4">
            This shows your next 5 scheduled billing cycles and how amount overrides will affect them.
            <strong> Automatic billing will use these amounts when each cycle date arrives.</strong>
          </p>
          
          <div className="space-y-2">
            {cyclesWithOverrides.map((cycle, index) => (
              <div key={cycle.date} className={`flex justify-between items-center p-3 rounded ${
                index === 0 ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
              }`}>
                <div>
                  <span className="font-medium">
                    {formatDateOnly(cycle.date)}
                    {index === 0 && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Next</span>}
                  </span>
                  {cycle.hasOverride && (
                    <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                      Override Active
                    </span>
                  )}
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
          
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <strong>💡 How it works:</strong> When each cycle date arrives, the system will automatically generate an invoice using the amount shown above (including any active overrides). You don't need to manually generate invoices unless you want to create them early for testing or special circumstances.
            </p>
          </div>
        </div>
      )}

      {/* ENHANCED: Generate Invoice Section with Better UX */}
      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-4">🧾 Manual Invoice Generation</h2>
        
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-800">
            <strong>ℹ️ When to use this:</strong> Manual invoice generation is typically used for testing, early billing, or special circumstances. 
            Your subscription will automatically generate invoices on the scheduled dates shown above.
          </p>
        </div>

        {/* Standard Generation */}
        <div className="mb-4">
          <h3 className="font-medium mb-2">Standard Generation</h3>
          <p className="text-sm text-gray-600 mb-3">
            Generate an invoice for the next scheduled billing cycle ({sub?.next_billing_at ? formatDateOnly(sub.next_billing_at.split('T')[0]) : 'Not scheduled'}).
            This will advance your subscription's billing schedule.
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
            {showAdvancedOptions ? '🔽 Hide' : '🔧 Show'} Advanced Options (Future Cycle Targeting)
          </button>
        </div>

        {/* Advanced Options */}
        {showAdvancedOptions && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded">
            <h4 className="font-medium mb-3 text-amber-800">🎯 Future Cycle Targeting</h4>
            
            <div className="mb-4 p-3 bg-white border border-amber-300 rounded">
              <p className="text-sm text-amber-800 mb-2">
                <strong>⚠️ Advanced Feature:</strong> This allows you to generate an invoice for any future cycle date, 
                primarily useful for testing amount overrides or special billing scenarios.
              </p>
              <ul className="text-xs text-amber-700 space-y-1">
                <li>• <strong>Does NOT advance</strong> your subscription's normal billing schedule</li>
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
                />
              </div>
              
              {targetCycleDate && (
                <div className="p-3 bg-white border border-amber-300 rounded">
                  <h5 className="font-medium text-amber-800 mb-2">📋 Preview for {formatDateOnly(targetCycleDate)}:</h5>
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
                  ? `Generate Invoice for ${formatDateOnly(targetCycleDate)} ($${getTargetCycleAmount()} ${sub?.currency})`
                  : 'Select a target date first'
                }
              </Button>
            </div>
          </div>
        )}
        
        {invoiceLink && (
          <div className="space-y-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-green-800 font-medium">✅ Invoice Generated Successfully!</p>
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
                />
              </div>
              <Button type="submit" disabled={!email}>
                Send Additional Notification
              </Button>
            </form>
          </div>
        )}
      </div>

      {/* ENHANCED: Amount Overrides Section with Better Explanation */}
      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-4">💰 Amount Overrides</h2>
        
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
          <p className="text-sm text-green-800">
            <strong>💡 How overrides work:</strong> When you schedule an override, it will automatically apply to all billing cycles on or after the effective date. 
            You can see how overrides affect upcoming cycles in the "Upcoming Billing Cycles" section above.
          </p>
        </div>
        
        {/* Schedule New Override */}
        <form onSubmit={scheduleOverride} className="space-y-3 mb-6">
          <h3 className="font-medium">Schedule New Override</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Effective Date</label>
              <Input
                type="date"
                value={override.effective_from}
                onChange={(e) => setOverride(prev => ({ ...prev, effective_from: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                required
              />
              <p className="text-xs text-gray-500 mt-1">Override will apply to this date and all future cycles</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">New Amount</label>
              <Input
                type="number"
                step="0.01"
                value={override.amount}
                onChange={(e) => setOverride(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="29.99"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Note (Optional)</label>
              <Input
                value={override.note}
                onChange={(e) => setOverride(prev => ({ ...prev, note: e.target.value }))}
                placeholder="Price increase"
              />
            </div>
          </div>
          <Button type="submit">Schedule Override</Button>
        </form>

        {/* Existing Overrides */}
        {amountOverrides.length > 0 && (
          <div>
            <h3 className="font-medium mb-3">Scheduled Overrides</h3>
            <div className="space-y-2">
              {amountOverrides.map(override => (
                <div key={override.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">${override.amount}</span>
                    {/* FIXED: Use proper date formatting without timezone conversion */}
                    <span className="text-gray-600 ml-2">effective {formatDateOnly(override.effective_from)}</span>
                    {override.note && (
                      <span className="text-sm text-gray-500 ml-2">({override.note})</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    Created {new Date(override.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Invoices Section */}
      <div className="p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-4">📄 Invoice History</h2>
        
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
                    Cycle: {new Date(invoice.cycle_start_at).toLocaleDateString()} | 
                    Due: {new Date(invoice.due_date).toLocaleDateString()}
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
                    {new Date(invoice.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

