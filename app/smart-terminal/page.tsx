'use client';

import React, { useEffect, useState } from 'react';
import { supabase, makeAuthenticatedRequest } from '@/lib/supabase-browser';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { QRCode } from '@/app/components/ui/qr-code';
import { Card, CardContent, CardHeader } from '@/app/components/ui/card'
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { AlertCircle, Store, CreditCard, Receipt, CheckCircle2, Clock, Smartphone, Copy, ArrowLeft, Mail, Zap, ShoppingBag, DollarSign, TrendingUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TerminalDevice {
  id: string;
  tip_presets?: number[];
  accepted_cryptos?: string[];
  charge_customer_fee?: boolean;
  tax_enabled?: boolean;
  tax_rates?: Array<{ label: string; percentage: number }>;
}

interface MerchantSettings {
  charge_customer_fee: boolean;
  auto_convert_enabled: boolean;
  tax_enabled: boolean;
  tax_rates: Array<{ label: string; percentage: number }>;
  wallets: Record<string, string>;
}

const defaultTips = [10, 15, 20];

// Stablecoin mapping for expanding accepted currencies
const BASE_STABLE_MAP: Record<string, string[]> = {
  SOL: ['USDCSOL', 'USDTSOL'],
  ETH: ['USDT', 'USDC', 'DAI', 'PYUSD'],
  BNB: ['USDTBSC', 'USDCBSC'],
  MATIC: ['USDTMATIC', 'USDCMATIC'],
  TRX: ['USDTTRC20'],
  TON: ['USDTTON'],
  ARB: ['USDTARB', 'USDCARB'],
  OP: ['USDTOP', 'USDCOP'],
  ETHBASE: ['USDCBASE'],
  ALGO: ['USDCALGO']
};

function expandStableCoins(wallets: Record<string, string>): string[] {
  const bases = Object.keys(wallets);
  if (wallets['ETH'] && !bases.includes('ETHBASE')) bases.push('ETHBASE');
  const stable = new Set<string>();
  bases.forEach(base => {
    (BASE_STABLE_MAP[base] || []).forEach(sc => stable.add(sc));
  });
  return Array.from(stable);
}

function buildPaymentURI(currency: string, address: string, amount: number) {
  const upper = currency.toUpperCase();
  if (upper === 'BTC') return `bitcoin:${address}?amount=${amount}`;
  if (upper === 'LTC') return `litecoin:${address}?amount=${amount}`;
  if (upper === 'BCH') return `bitcoincash:${address}?amount=${amount}`;
  return address;
}

export default function SmartTerminalPage() {
  const [device, setDevice] = useState<TerminalDevice | null>(null);
  const [merchantSettings, setMerchantSettings] = useState<MerchantSettings | null>(null);
  const [amount, setAmount] = useState('');
  const [tipPercent, setTipPercent] = useState<number | null>(null);
  const [tipSelected, setTipSelected] = useState(false);
  const [tax, setTax] = useState<boolean | undefined>(undefined);
  const [chargeFee, setChargeFee] = useState<boolean | undefined>(undefined);
  const [crypto, setCrypto] = useState('BTC');
  const [step, setStep] = useState<'amount' | 'customer'>('amount');
  const [preview, setPreview] = useState({ tax_amount: 0, subtotal_with_tax: 0, gateway_fee: 0, pre_tip_total: 0 });
  const [invoiceBreakdown, setInvoiceBreakdown] = useState<null | { tax_amount: number; subtotal_with_tax: number; gateway_fee: number; pre_tip_total: number; tip_amount: number; final_total: number }>(null);
  const [loading, setLoading] = useState(false);
  interface PaymentLink { id: string; link_id: string; }
  const [paymentLink, setPaymentLink] = useState<PaymentLink | null>(null);
  const [paymentData, setPaymentData] = useState<
    { payment_id: string; payment_status: string; pay_address: string; pay_amount: number; pay_currency: string } | null
  >(null);
  const [status, setStatus] = useState('');
  const [receipt, setReceipt] = useState({ email: '', sent: false });
  const [availableCurrencies, setAvailableCurrencies] = useState<string[]>([]);
  const [error, setError] = useState<string>('');

  // Load merchant settings and device
  useEffect(() => {
    (async () => {
      try {
        setError(''); // Clear any previous errors
        
        // Load merchant settings first
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          setError('Please log in to use the Smart Terminal');
          return;
        }

        // Get merchant settings
        const { data: merchant, error: merchantError } = await supabase
          .from('merchants')
          .select('charge_customer_fee, auto_convert_enabled, tax_enabled, tax_rates, wallets')
          .eq('user_id', session.user.id)
          .single();

        if (merchantError) {
          console.error('Error loading merchant settings:', merchantError);
          setError('Merchant account not found. Please complete your merchant setup first.');
          return;
        }

        if (!merchant) {
          setError('Merchant account not found. Please complete your merchant setup first.');
          return;
        }

        setMerchantSettings(merchant);

        // Load or create terminal device
        const id = localStorage.getItem('terminal_device_id');
        const body: Record<string, unknown> = id ? { id } : { label: 'Device', tip_presets: defaultTips };
        
        try {
          const res = await makeAuthenticatedRequest('/api/terminal/devices', { method: 'POST', body: JSON.stringify(body) });
          
          if (!res.ok) {
            const errorData = await res.json();
            console.error('Terminal devices API error:', errorData);
            
            if (errorData.error && errorData.error.includes('Merchant account not found')) {
              setError('Merchant account not found. Please complete your merchant setup first.');
              return;
            }
            
            throw new Error(errorData.error || 'Failed to load terminal device');
          }
          
          const json = await res.json();
          
          if (!json.success || !json.data) {
            throw new Error('Invalid response from terminal devices API');
          }
          
          localStorage.setItem('terminal_device_id', json.data.id);
          setDevice(json.data);

          // Set default values based on merchant settings
          if (json.data?.accepted_cryptos?.length) setCrypto(json.data.accepted_cryptos[0]);
          setChargeFee(merchant.charge_customer_fee);
          setTax(merchant.tax_enabled);

          // Expand accepted cryptocurrencies to include stablecoins
          const deviceCryptos = json.data?.accepted_cryptos && json.data.accepted_cryptos.length
            ? json.data.accepted_cryptos
            : Object.keys(merchant.wallets || {});
          
          const stableCoins = expandStableCoins(merchant.wallets || {});
          const allCurrencies = Array.from(new Set([...deviceCryptos, ...stableCoins]));
          setAvailableCurrencies(allCurrencies);
          
          // Set default crypto to first available
          if (allCurrencies.length > 0) {
            setCrypto(allCurrencies[0]);
          }
        } catch (deviceError) {
          console.error('Error loading terminal device:', deviceError);
          // If device loading fails, try to create a new device
          try {
            const createBody = { label: 'Device', tip_presets: defaultTips };
            const createRes = await makeAuthenticatedRequest('/api/terminal/devices', { method: 'POST', body: JSON.stringify(createBody) });
            
            if (createRes.ok) {
              const createJson = await createRes.json();
              if (createJson.success && createJson.data) {
                localStorage.setItem('terminal_device_id', createJson.data.id);
                setDevice(createJson.data);
                setChargeFee(merchant.charge_customer_fee);
                setTax(merchant.tax_enabled);
                
                const stableCoins = expandStableCoins(merchant.wallets || {});
                const allCurrencies = Array.from(new Set([...Object.keys(merchant.wallets || {}), ...stableCoins]));
                setAvailableCurrencies(allCurrencies);
                
                if (allCurrencies.length > 0) {
                  setCrypto(allCurrencies[0]);
                }
                return; // Successfully created device
              }
            }
          } catch (createError) {
            console.error('Error creating terminal device:', createError);
          }
          
          // If all else fails, show error
          setError('Failed to initialize terminal device. Please refresh the page and try again.');
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        setError('Failed to load Smart Terminal settings. Please try again.');
      }
    })();
  }, []);

  useEffect(() => {
    const amt = parseFloat(amount || '0');
    if (!merchantSettings || !amt) {
      setPreview({ tax_amount: 0, subtotal_with_tax: amt, gateway_fee: 0, pre_tip_total: amt });
      return;
    }
    (async () => {
      const body: Record<string, unknown> = { amount: amt };
      if (typeof tax === 'boolean') body.tax_enabled = tax;
      if (typeof chargeFee === 'boolean') body.charge_customer_fee = chargeFee;
      const res = await makeAuthenticatedRequest('/api/terminal/preview', { method: 'POST', body: JSON.stringify(body) });
      const json = await res.json();
      if (!json.error) {
        setPreview({
          tax_amount: json.tax_amount,
          subtotal_with_tax: json.subtotal_with_tax,
          gateway_fee: json.gateway_fee,
          pre_tip_total: json.pre_tip_total
        });
      }
    })();
  }, [amount, tax, chargeFee, merchantSettings]);

  useEffect(() => {
    if (paymentLink && paymentData) {
      const channel = supabase
        .channel('pos-' + paymentLink.id)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'transactions', filter: `payment_link_id=eq.${paymentLink.id}` }, payload => {
          setStatus(prev => {
            if (payload.new.status !== prev) {
              if (payload.new.status === 'confirmed') {
                playBeep();
                if (navigator.vibrate) navigator.vibrate(200);
                supabase.removeChannel(channel);
                clearInterval(interval);
              }
              return payload.new.status;
            }
            return prev;
          });
        })
        .subscribe();
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/payments/${paymentData.payment_id}/status`);
          const json = await res.json();
          const newStatus = json.payment?.payment_status;
          if (newStatus) {
            setStatus(prev => {
              if (newStatus !== prev) {
                if (newStatus === 'confirmed') {
                  playBeep();
                  if (navigator.vibrate) navigator.vibrate(200);
                  supabase.removeChannel(channel);
                  clearInterval(interval);
                }
                return newStatus;
              }
              return prev;
            });
          }
        } catch (e) {
          console.error('status check failed', e);
        }
      }, 3000);
      return () => { supabase.removeChannel(channel); clearInterval(interval); };
    }
  }, [paymentLink, paymentData]);

  const appendDigit = (d: string) => {
    setAmount(prev => (prev + d).replace(/^0+(\d)/, '$1'));
  };
  const clearAmount = () => setAmount('');
  const backspace = () => setAmount(prev => prev.slice(0, -1));

  const baseAmount = parseFloat(amount || '0');
  const taxAmount = preview.tax_amount;
  const gatewayFee = preview.gateway_fee;
  const preTipTotal = preview.pre_tip_total;
  const tipAmount = tipPercent ? (preTipTotal * tipPercent) / 100 : 0;
  const finalTotal = preTipTotal + tipAmount;

  const readyForPayment = () => {
    if (!amount) return;
    setStep('customer');
    setTipPercent(null);
    setTipSelected(false);
  };

  const generate = async () => {
    if (!device || !tipSelected || !amount || loading) return;
    
    // Ensure we have a valid device ID
    if (!device.id || device.id === 'temp') {
      setError('Invalid terminal device. Please refresh the page and try again.');
      return;
    }
    
    setLoading(true);
    setError(''); // Clear any previous errors
    
    try {
      const body = {
        amount: baseAmount,
        tip_amount: tipAmount,
        pay_currency: crypto,
        pos_device_id: device.id,
        tax_enabled: tax,
        charge_customer_fee: chargeFee
      };
      
      const res = await makeAuthenticatedRequest('/api/terminal/invoice', { method: 'POST', body: JSON.stringify(body) });
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error('Terminal invoice API error:', errorData);
        
        if (errorData.error && errorData.error.includes('Merchant account not found')) {
          setError('Merchant account not found. Please complete your merchant setup first.');
          return;
        }
        
        if (errorData.error && errorData.error.includes('Terminal device not found')) {
          setError('Terminal device not found. Please refresh the page and try again.');
          return;
        }
        
        // Handle amount too small for auto-forwarding error
        if (errorData.code === 'AMOUNT_TOO_SMALL_FOR_AUTO_FORWARDING') {
          setError(`Amount too small for auto-forwarding. ${errorData.details || ''} Please try a larger amount.`);
          return;
        }
        
        // Handle general amount too small error
        if (errorData.code === 'AMOUNT_TOO_SMALL') {
          setError(`Payment amount too small. ${errorData.details || ''} Please try a larger amount.`);
          return;
        }
        
        throw new Error(errorData.error || errorData.details || 'Failed to create payment');
      }
      
      const json = await res.json();
      
      if (json?.payment_link && json?.now) {
        setPaymentLink(json.payment_link);
        setPaymentData(json.now);
        setInvoiceBreakdown(json.breakdown);
        setStatus(json.now.payment_status || 'pending');
      } else {
        throw new Error('Invalid response from payment creation API');
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      setError(error instanceof Error ? error.message : 'Failed to create payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendEmailReceipt = async () => {
    if (!paymentLink || !receipt.email.trim()) return;
    const data = { email: receipt.email, payment_link_id: paymentLink.id };
    await makeAuthenticatedRequest('/api/receipts/email', { method: 'POST', body: JSON.stringify(data) });
    setReceipt({ email: '', sent: true });
    // Reset success message after 3 seconds
    setTimeout(() => {
      setReceipt({ email: '', sent: false });
    }, 3000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-2 sm:p-4 bg-gradient-to-br from-purple-50 via-white to-purple-50">
      <div className="w-full max-w-2xl">
        {/* Main Card */}
        <Card className="w-full border-0 shadow-2xl bg-white/95 backdrop-blur-sm rounded-3xl overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-[#7f5efd] to-[#9b7cff]"></div>
          <CardHeader className="pb-0">
            {/* Status Bar */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "h-2 w-2 rounded-full",
                  merchantSettings ? "bg-green-500 animate-pulse" : "bg-gray-300"
                )} />
                <span className="text-xs text-gray-600">
                  {merchantSettings ? 'Terminal Active' : 'Loading...'}
                </span>
              </div>
              {device && (
                <div className="text-xs text-gray-500">
                  Device ID: {device.id.slice(0, 8)}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}
          {step === 'amount' && !paymentLink && (
            <div className="w-full space-y-4 sm:space-y-6">
              {/* Amount Display */}
              <div className="bg-gradient-to-br from-purple-50 to-white p-6 sm:p-8 rounded-2xl border border-purple-100">
                <div className="flex items-center justify-center mb-2">
                  <DollarSign className="h-5 w-5 text-[#7f5efd] mr-1" />
                  <span className="text-sm text-gray-500 uppercase tracking-wider">Amount</span>
                </div>
                <div className="text-center font-phonic text-4xl sm:text-5xl font-bold text-[#7f5efd]" aria-live="polite">
                  ${amount || '0.00'}
                </div>
              </div>
              {/* Price Breakdown */}
              {(baseAmount > 0 || tax || chargeFee) && (
                <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl border border-gray-200 text-sm space-y-2" aria-live="polite">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold text-gray-900">${baseAmount.toFixed(2)}</span>
                  </div>
                  {tax && merchantSettings?.tax_rates && merchantSettings.tax_rates.map((rate, index) => (
                    <div key={index} className="flex justify-between items-center text-emerald-600">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {rate.label} ({rate.percentage}%)
                      </span>
                      <span className="font-medium">+${((baseAmount * rate.percentage) / 100).toFixed(2)}</span>
                    </div>
                  ))}
                  {tax && (
                    <div className="flex justify-between items-center font-semibold text-emerald-600 border-t border-gray-200 pt-2">
                      <span>Total Tax</span>
                      <span>+${taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {tax && (
                    <div className="flex justify-between items-center font-semibold border-t border-gray-200 pt-2">
                      <span className="text-gray-600">Subtotal with Tax</span>
                      <span className="text-gray-900">${preview.subtotal_with_tax.toFixed(2)}</span>
                    </div>
                  )}
                  {chargeFee && (
                    <div className="flex justify-between items-center text-blue-600">
                      <span className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        Gateway fee ({merchantSettings?.auto_convert_enabled ? '1.0' : '0.5'}%)
                      </span>
                      <span className="font-medium">+${gatewayFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center font-bold text-lg border-t border-gray-200 pt-2">
                    <span className="text-gray-700">Total</span>
                    <span className="text-[#7f5efd]">${preTipTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}
              {/* Number Pad */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {[1,2,3,4,5,6,7,8,9,'0','.'].map((d: string | number)=> (
                  <Button 
                    key={d}
                    variant="outline"
                    className="h-14 sm:h-16 text-xl sm:text-2xl font-semibold bg-white hover:bg-purple-50 border-purple-200 hover:border-[#7f5efd] text-gray-700 hover:text-[#7f5efd] transition-all duration-200 rounded-xl shadow-sm hover:shadow-md"
                    aria-label={`digit ${d}`}
                    onClick={() => appendDigit(String(d))}
                  >
                    {d}
                  </Button>
                ))}
                <Button 
                  className="h-14 sm:h-16 text-xl font-semibold bg-orange-50 hover:bg-orange-100 border-orange-200 hover:border-orange-300 text-orange-600 transition-all duration-200 rounded-xl shadow-sm hover:shadow-md" 
                  onClick={backspace} 
                  aria-label="backspace"
                  variant="outline"
                >
                  ⌫
                </Button>
                <Button 
                  className="h-14 sm:h-16 text-xl font-semibold bg-red-50 hover:bg-red-100 border-red-200 hover:border-red-300 text-red-600 transition-all duration-200 rounded-xl shadow-sm hover:shadow-md" 
                  onClick={clearAmount} 
                  aria-label="clear"
                  variant="outline"
                >
                  C
                </Button>
              </div>

              {/* Options */}
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                <label className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg border border-gray-200 hover:border-[#7f5efd] cursor-pointer transition-all duration-200">
                  <input 
                    type="checkbox" 
                    className="h-4 w-4 text-[#7f5efd] rounded focus:ring-[#7f5efd] accent-[#7f5efd]" 
                    checked={tax ?? false} 
                    disabled={tax === undefined} 
                    onChange={e=>setTax(e.target.checked)} 
                    aria-label="Add tax"
                  />
                  <span className="text-sm font-medium text-gray-700">Add tax</span>
                </label>
                <label className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg border border-gray-200 hover:border-[#7f5efd] cursor-pointer transition-all duration-200">
                  <input 
                    type="checkbox" 
                    className="h-4 w-4 text-[#7f5efd] rounded focus:ring-[#7f5efd] accent-[#7f5efd]" 
                    checked={chargeFee ?? false} 
                    disabled={chargeFee === undefined} 
                    onChange={e=>setChargeFee(e.target.checked)} 
                    aria-label="Charge customer fee" 
                  />
                  <span className="text-sm font-medium text-gray-700">Customer pays fee</span>
                </label>
              </div>

              {/* Continue Button */}
              <Button 
                onClick={readyForPayment}
                variant="default"
                className="w-full h-14 sm:h-16 text-lg font-semibold bg-gradient-to-r from-[#7f5efd] to-[#9b7cff] hover:from-[#7c3aed] hover:to-[#8b6cef] text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                aria-label="ready"
                disabled={!amount}
              >
                <CreditCard className="h-5 w-5" />
                Ready for Payment
              </Button>
            </div>
          )}
          {step === 'customer' && !paymentLink && (
            <div className="w-full space-y-4 sm:space-y-6">
              {/* Order Summary */}
              <div className="bg-gradient-to-br from-purple-50 to-white p-4 sm:p-5 rounded-xl border border-purple-100" aria-live="polite">
                <div className="flex items-center gap-2 mb-3">
                  <ShoppingBag className="h-5 w-5 text-[#7f5efd]" />
                  <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Order Summary</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold text-gray-900">${baseAmount.toFixed(2)}</span>
                  </div>
                  {tax && merchantSettings?.tax_rates && merchantSettings.tax_rates.map((rate, index) => (
                    <div key={index} className="flex justify-between items-center text-emerald-600">
                      <span>{rate.label} ({rate.percentage}%)</span>
                      <span className="font-medium">+${((baseAmount * rate.percentage) / 100).toFixed(2)}</span>
                    </div>
                  ))}
                  {tax && (
                    <div className="flex justify-between items-center font-semibold text-emerald-600 border-t border-purple-100 pt-2">
                      <span>Total Tax</span>
                      <span>+${taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {tax && (
                    <div className="flex justify-between items-center font-semibold border-t border-purple-100 pt-2">
                      <span className="text-gray-600">Subtotal with Tax</span>
                      <span className="text-gray-900">${preview.subtotal_with_tax.toFixed(2)}</span>
                    </div>
                  )}
                  {chargeFee && (
                    <div className="flex justify-between items-center text-blue-600">
                      <span>Gateway fee ({merchantSettings?.auto_convert_enabled ? '1.0' : '0.5'}%)</span>
                      <span className="font-medium">+${gatewayFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center font-bold text-base border-t border-purple-100 pt-2">
                    <span className="text-gray-700">Total</span>
                    <span className="text-[#7f5efd]">${preTipTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              {/* Tip Selection */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200">
                <p className="text-sm font-semibold text-gray-700 mb-3 text-center">Add a tip?</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  {(device?.tip_presets || defaultTips).map((p: number) => (
                    <Button 
                      key={p} 
                      variant={tipPercent === p ? 'default' : 'outline'} 
                      className={cn(
                        "h-12 sm:h-14 font-semibold rounded-lg transition-all duration-200",
                        tipPercent === p 
                          ? "bg-gradient-to-r from-[#7f5efd] to-[#9b7cff] text-white shadow-lg" 
                          : "bg-white border-2 border-purple-200 text-[#7f5efd] hover:bg-purple-50 hover:border-[#7f5efd]"
                      )}
                      onClick={() => {setTipPercent(p); setTipSelected(true);}} 
                      aria-label={`tip ${p}%`}
                    >
                      {p}%
                    </Button>
                  ))}
                  <Button 
                    variant={tipPercent === 0 && tipSelected ? 'default' : 'outline'} 
                    className={cn(
                      "h-12 sm:h-14 font-semibold rounded-lg transition-all duration-200",
                      tipPercent === 0 && tipSelected
                        ? "bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg" 
                        : "bg-white border-2 border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400"
                    )}
                    onClick={() => {setTipPercent(0); setTipSelected(true);}} 
                    aria-label="no tip"
                  >
                    No Tip
                  </Button>
                </div>
              </div>
              {/* Currency Selection */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Payment Currency</label>
                <Select value={crypto} onValueChange={(value) => setCrypto(value)}>
                  <SelectTrigger className="w-full h-12 bg-white border-2 border-purple-200 hover:border-[#7f5efd] focus:border-[#7f5efd] rounded-lg transition-all duration-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCurrencies.map((c:string)=> (
                      <SelectItem key={c} value={c} className="hover:bg-purple-50">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Final Total Display */}
              {tipSelected && (
                <div className="bg-gradient-to-r from-[#7f5efd] to-[#9b7cff] p-4 rounded-xl text-white">
                  <div className="text-center">
                    <p className="text-sm opacity-90 mb-1">Final Total</p>
                    <p className="text-3xl font-bold">${finalTotal.toFixed(2)}</p>
                    {tipPercent !== null && tipPercent > 0 && (
                      <p className="text-sm opacity-90 mt-1">Includes ${tipAmount.toFixed(2)} tip</p>
                    )}
                  </div>
                </div>
              )}
              {/* Generate Payment Button */}
              <Button 
                onClick={generate}
                variant="default"
                className="w-full h-14 sm:h-16 text-lg font-semibold bg-gradient-to-r from-[#7f5efd] to-[#9b7cff] hover:from-[#7c3aed] hover:to-[#8b6cef] text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                aria-label="pay now"
                disabled={!tipSelected || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Generating Payment...
                  </>
                ) : (
                  <>
                    <Smartphone className="h-5 w-5" />
                    Pay Now
                  </>
                )}
              </Button>
            </div>
          )}
          {paymentLink && paymentData && (
            <div className="flex flex-col items-center space-y-4 sm:space-y-6" aria-live="polite">
              {(() => {
                const uri = buildPaymentURI(paymentData.pay_currency, paymentData.pay_address, paymentData.pay_amount);
                const showAmount = uri === paymentData.pay_address;
                return (
                  <>
                    {/* Payment Status */}
                    <div className="w-full bg-gradient-to-br from-purple-50 to-white p-4 rounded-xl border border-purple-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {status === 'confirmed' ? (
                            <CheckCircle2 className="h-6 w-6 text-green-500 animate-pulse" />
                          ) : (
                            <Clock className="h-6 w-6 text-[#7f5efd] animate-spin" />
                          )}
                          <span className="font-semibold text-gray-700">
                            {status === 'confirmed' ? 'Payment Confirmed!' : 'Awaiting Payment'}
                          </span>
                        </div>
                        <span className={cn(
                          "px-3 py-1 rounded-full text-xs font-semibold",
                          status === 'confirmed' 
                            ? "bg-green-100 text-green-700" 
                            : status === 'confirming' 
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-purple-100 text-[#7f5efd]"
                        )}>
                          {status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* QR Code */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
                      <QRCode value={uri} size={256} />
                    </div>
                    {/* Payment Details */}
                    <div className="w-full bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl border border-gray-200">
                      <div className="text-center space-y-2">
                        <p className="text-sm text-gray-600">Pay with</p>
                        <p className="text-2xl font-bold text-[#7f5efd]">{paymentData.pay_currency}</p>
                        {showAmount && (
                          <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Amount to send:</p>
                            <p className="text-xl font-bold text-[#7f5efd]">
                              {paymentData.pay_amount} {paymentData.pay_currency}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Address Display */}
                    <div className="w-full bg-white p-4 rounded-xl border border-gray-200">
                      <p className="text-xs text-gray-600 mb-2">Wallet Address:</p>
                      <p className="text-xs font-mono break-all text-gray-800 bg-gray-50 p-3 rounded-lg">
                        {paymentData.pay_address}
                      </p>
                    </div>

                    {/* Back Button */}
                    {status !== 'confirmed' && (
                      <div className="flex justify-center">
                        <Button 
                          variant="outline" 
                          onClick={() => { 
                            setPaymentLink(null); 
                            setPaymentData(null); 
                            setInvoiceBreakdown(null); 
                            setStatus(''); 
                            setTipSelected(false); 
                            setTipPercent(null); 
                          }}
                          className="bg-white border-2 border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 font-semibold rounded-lg transition-all duration-200"
                        >
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Back
                        </Button>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Invoice Breakdown */}
              <div className="w-full bg-white p-4 rounded-xl border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <Receipt className="h-5 w-5 text-[#7f5efd]" />
                  <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Invoice Details</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-900">${baseAmount.toFixed(2)}</span>
                  </div>
                  {invoiceBreakdown?.tax_amount ? (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Tax</span>
                      <span className="font-medium text-gray-900">${invoiceBreakdown.tax_amount.toFixed(2)}</span>
                    </div>
                  ) : null}
                  {invoiceBreakdown?.gateway_fee ? (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Gateway fee</span>
                      <span className="font-medium text-gray-900">${invoiceBreakdown.gateway_fee.toFixed(2)}</span>
                    </div>
                  ) : null}
                  {invoiceBreakdown?.tip_amount ? (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Tip</span>
                      <span className="font-medium text-gray-900">${invoiceBreakdown.tip_amount.toFixed(2)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between items-center font-bold text-base border-t border-gray-200 pt-2">
                    <span className="text-gray-700">Total</span>
                    <span className="text-[#7f5efd]">${(invoiceBreakdown?.final_total || finalTotal).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              {/* Success Actions */}
              {status === 'confirmed' && (
                <div className="space-y-4 w-full">
                  {/* Success Message */}
                  <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                      <div>
                        <p className="font-semibold text-green-800">Payment Successful!</p>
                        <p className="text-sm text-green-600">Transaction has been confirmed</p>
                      </div>
                    </div>
                  </div>

                  {/* Receipt Email */}
                  <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Send Receipt</label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Customer email address" 
                        value={receipt.email} 
                        onChange={e=>setReceipt({...receipt, email:e.target.value})} 
                        aria-label="receipt email"
                        className="flex-1 h-12 bg-white border-2 border-gray-200 hover:border-[#7f5efd] focus:border-[#7f5efd] rounded-lg transition-all duration-200"
                      />
                      <Button 
                        onClick={sendEmailReceipt} 
                        disabled={!receipt.email.trim() || receipt.sent}
                        className={cn(
                          "h-12 px-6 font-semibold rounded-lg transition-all duration-200",
                          receipt.sent 
                            ? "bg-green-600 hover:bg-green-700 text-white" 
                            : "bg-[#7f5efd] hover:bg-[#7c3aed] text-white"
                        )}
                      >
                        {receipt.sent ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Receipt Sent!
                          </>
                        ) : (
                          <>
                            <Mail className="h-4 w-4 mr-2" />
                            Send
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  {/* New Sale Button */}
                  <Button 
                    onClick={()=>{
                      setPaymentLink(null); 
                      setPaymentData(null); 
                      setInvoiceBreakdown(null); 
                      setAmount(''); 
                      setStatus(''); 
                      setTipPercent(null); 
                      setTipSelected(false); 
                      setStep('amount'); 
                      setTax(merchantSettings?.tax_enabled); 
                      setChargeFee(merchantSettings?.charge_customer_fee);
                      setReceipt({ email: '', sent: false });
                    }}
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-[#7f5efd] to-[#9b7cff] hover:from-[#7c3aed] hover:to-[#8b6cef] text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="h-5 w-5" />
                    Start New Sale
                  </Button>
                </div>
              )}
            </div>
          )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function playBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    osc.frequency.value = 440;
    osc.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch (e) {
    console.warn('audio failed', e);
  }
}