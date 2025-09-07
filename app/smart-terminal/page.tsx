'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase, makeAuthenticatedRequest } from '@/lib/supabase-browser';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { QRCode } from '@/app/components/ui/qr-code';
import { Card, CardContent, CardHeader } from '@/app/components/ui/card'
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { AlertCircle, Store, CreditCard, Receipt, CheckCircle2, Clock, Smartphone, Copy, ArrowLeft, Mail, Zap, ShoppingBag, DollarSign, TrendingUp, Filter, Globe, ChevronDown, AlertTriangle, Bitcoin, Coins, Network } from 'lucide-react';
import { requiresExtraId, getExtraIdLabel, getExtraIdDescription } from '@/lib/extra-id-validation';
import { buildCryptoPaymentURI, formatAmountForDisplay } from '@/lib/crypto-uri-builder';
import { formatAddressForQR } from '@/lib/simple-address-formatter';
import { trackURIGeneration } from '@/lib/uri-analytics';
import { getOrCreateClientId } from '@/lib/ab-testing';
import { loadDynamicConfig } from '@/lib/wallet-uri-config';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { groupCurrenciesByNetwork, getNetworkInfo, getCurrencyDisplayName, sortNetworksByPriority } from '@/lib/crypto-networks';
import { buildCurrencyMapping } from '@/lib/currency-mapping';
import { Label } from '@/app/components/ui/label';
import { useRealTimePaymentStatus } from '@/lib/hooks/useRealTimePaymentStatus';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/app/components/ui/dropdown-menu';

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

interface CurrencyInfo {
  code: string;
  name: string;
  enabled: boolean;
  min_amount?: number;
  max_amount?: number;
}

const defaultTips = [10, 15, 20];

// Stablecoin mapping for expanding accepted currencies
const BASE_STABLE_MAP: Record<string, string[]> = {
  SOL: ['USDCSOL', 'USDTSOL'],
  ETH: ['USDT', 'USDC', 'DAI', 'PYUSD'],
  BNB: ['USDTBSC', 'BUSDBSC', 'USDCBSC'],
  BNBBSC: ['USDTBSC', 'BUSDBSC', 'USDCBSC'],
  MATIC: ['USDTMATIC', 'USDCMATIC'],
  TRX: ['USDTTRC20', 'TUSDTRC20'],
  TON: ['USDTTON'],
  ARB: ['USDTARB', 'USDCARB'],
  OP: ['USDTOP', 'USDCOP'],
  ETHBASE: ['USDCBASE'],
  ALGO: ['USDCALGO'],
  // Avalanche C-Chain support
  AVAX: ['USDTARC20', 'USDCARC20'],
  AVAXC: ['USDTARC20', 'USDCARC20']
};

function expandStableCoins(wallets: Record<string, string>): string[] {
  const bases = Object.keys(wallets);

  const stable = new Set<string>();
  bases.forEach(base => {
    (BASE_STABLE_MAP[base] || []).forEach(sc => stable.add(sc));
  });
  return Array.from(stable);
}

// Centralized wallet-specific URI builder (with fallback)
function buildPaymentURI(currency: string, address: string, amount: number, extraId?: string) {
  const { qrContent } = formatAddressForQR(currency, address, extraId);
  try {
    trackURIGeneration({ currency, walletDetected: '', uriType: 'address-only', uri: qrContent });
  } catch {}
  return qrContent;
}

function SmartTerminalPageContent() {
  const searchParams = useSearchParams();
  const [device, setDevice] = useState<TerminalDevice | null>(null);
  const [merchantSettings, setMerchantSettings] = useState<MerchantSettings | null>(null);
  const [amount, setAmount] = useState('');
  const [tipPercent, setTipPercent] = useState<number | null>(null);
  const [tipSelected, setTipSelected] = useState(false);
  const [tax, setTax] = useState<boolean>(false);
  const [chargeFee, setChargeFee] = useState<boolean>(false);
  const [crypto, setCrypto] = useState('BTC');
  const [step, setStep] = useState<'amount' | 'customer'>('amount');
  const [preview, setPreview] = useState({ tax_amount: 0, subtotal_with_tax: 0, gateway_fee: 0, pre_tip_total: 0 });
  const [invoiceBreakdown, setInvoiceBreakdown] = useState<null | { tax_amount: number; subtotal_with_tax: number; gateway_fee: number; pre_tip_total: number; tip_amount: number; final_total: number }>(null);
  const [loading, setLoading] = useState(false);
  interface PaymentLink { id: string; link_id: string; }
  const [paymentLink, setPaymentLink] = useState<PaymentLink | null>(null);
  const [paymentData, setPaymentData] = useState<
    { payment_id: string; payment_status: string; pay_address: string; payin_extra_id?: string; pay_amount: number; pay_currency: string } | null
  >(null);
  const [extraIdConfirmed, setExtraIdConfirmed] = useState<boolean>(false);
  const [status, setStatus] = useState('');
  const [receipt, setReceipt] = useState({ email: '', sent: false });
  const [availableCurrencies, setAvailableCurrencies] = useState<CurrencyInfo[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<string>('all');
  const [error, setError] = useState<string>('');
  const [validatedUri, setValidatedUri] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string>('anon');
  const [dynamicConfig, setDynamicConfig] = useState<any>(null);
  const [isLocked, setIsLocked] = useState(false);

  // Reset confirmation when a new payment is created/loaded
  useEffect(() => {
    setExtraIdConfirmed(false);
    setValidatedUri(null);
  }, [paymentData?.payment_id, paymentData?.pay_address, paymentData?.payin_extra_id]);

  // Load client ID only (kept for analytics uniqueness)
  useEffect(() => {
    try { setClientId(getOrCreateClientId()); } catch {}
  }, []);

  // Handle keyboard events to prevent escape from locked mode
  useEffect(() => {
    if (isLocked) {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Prevent escape key and function keys when locked
        if (e.key === 'Escape' || e.key.startsWith('F') || e.metaKey || e.ctrlKey) {
          e.preventDefault();
          e.stopPropagation();
        }
      };
      
      const handleFullscreenChange = () => {
        // If user exits fullscreen while locked, request it again
        if (isLocked && !document.fullscreenElement) {
          setTimeout(() => {
            if (document.documentElement.requestFullscreen) {
              document.documentElement.requestFullscreen().catch(console.warn);
            }
          }, 100);
        }
      };
      
      document.addEventListener('keydown', handleKeyDown, true);
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown, true);
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
      };
    }
  }, [isLocked]);

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
          setChargeFee(Boolean(merchant.charge_customer_fee));
          setTax(Boolean(merchant.tax_enabled));

          // Expand accepted cryptocurrencies to include stablecoins
          const deviceCryptos = json.data?.accepted_cryptos && json.data.accepted_cryptos.length
            ? json.data.accepted_cryptos
            : Object.keys(merchant.wallets || {});
          
          const stableCoins = expandStableCoins(merchant.wallets || {});
          const allCodes: string[] = Array.from(new Set([...(deviceCryptos as string[]), ...stableCoins]));

          // Fetch NOWPayments currencies and build rich mapping via shared helper
          try {
            const resNP = await fetch('/api/nowpayments/currencies');
            const np = await resNP.json();
            const npCurrencies: Array<{ code: string; name: string; enabled: boolean; min_amount?: number; max_amount?: number }>
              = Array.isArray(np?.currencies) ? np.currencies : [];

            const { customerCurrencies } = buildCurrencyMapping({
              acceptedCryptos: allCodes,
              npCurrencies,
            })

            setAvailableCurrencies(customerCurrencies);
            const firstEnabled = customerCurrencies.find(c => c.enabled)?.code;
            if (firstEnabled) setCrypto(firstEnabled);
            else if (customerCurrencies[0]) setCrypto(customerCurrencies[0].code);
          } catch {
            const fallbackList: CurrencyInfo[] = allCodes.map(c => ({ code: c.toUpperCase(), name: getCurrencyDisplayName(c), enabled: true }));
            setAvailableCurrencies(fallbackList);
            if (fallbackList[0]) setCrypto(fallbackList[0].code);
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
                setChargeFee(Boolean(merchant.charge_customer_fee));
                setTax(Boolean(merchant.tax_enabled));
                
                const stableCoins = expandStableCoins(merchant.wallets || {});
                const allCodes = Array.from(new Set([...Object.keys(merchant.wallets || {}), ...stableCoins]));
                const fallbackList: CurrencyInfo[] = allCodes.map(c => ({ code: c, name: getCurrencyDisplayName(c), enabled: true }));
                setAvailableCurrencies(fallbackList);
                if (fallbackList[0]) setCrypto(fallbackList[0].code);
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

    // Calculate preview instantly using local merchant settings
    if (merchantSettings && amt > 0) {
      let tax_amount = 0;
      let gateway_fee = 0;

      // Calculate tax if enabled
      if (tax && merchantSettings.tax_enabled && merchantSettings.tax_rates?.length > 0) {
        // Sum all tax rates
        const totalTaxRate = merchantSettings.tax_rates.reduce((sum, rate) => sum + rate.percentage, 0);
        tax_amount = (amt * totalTaxRate) / 100;
      }

      const subtotal_with_tax = amt + tax_amount;

      // Calculate gateway fee if customer pays fee (customer can override merchant setting)
      if (chargeFee) {
        // Use the same fee calculation as the API: 0.5% base + 0.5% for auto-convert = 1% max
        const baseFeePercentage = 0.005; // 0.5%
        const autoConvertFeePercentage = merchantSettings.auto_convert_enabled ? 0.005 : 0; // 0.5% if auto-convert enabled
        const totalFeePercentage = baseFeePercentage + autoConvertFeePercentage; // 0.5% or 1.0%
        gateway_fee = subtotal_with_tax * totalFeePercentage;
      }

      const pre_tip_total = subtotal_with_tax + gateway_fee;

      setPreview({
        tax_amount,
        subtotal_with_tax,
        gateway_fee,
        pre_tip_total
      });
    } else {
      // Default values when no amount or merchant settings
      setPreview({ tax_amount: 0, subtotal_with_tax: amt, gateway_fee: 0, pre_tip_total: amt });
    }
  }, [amount, tax, chargeFee, merchantSettings]);

  // Real-time payment status monitoring for smart terminal
  const { paymentStatus: realtimePaymentStatus, connectionStatus } = useRealTimePaymentStatus({
    paymentId: paymentData?.payment_id || null,
    enabled: !!paymentData?.payment_id,
    onStatusChange: (updatedStatus) => {
      console.log(`🔄 Smart terminal status update received:`, updatedStatus)
      console.log(`📱 Current status state:`, status)
      
      const newStatus = updatedStatus.payment_status
      console.log(`🎯 New status from real-time: ${newStatus}`)
      
      setStatus(prev => {
        console.log(`📊 Status state change: ${prev} → ${newStatus}`)
        if (newStatus !== prev) {
          console.log(`✅ Status actually changing: ${prev} → ${newStatus}`)
          if (newStatus === 'confirmed') {
            console.log('🎉 Payment confirmed in smart terminal!')
            playBeep();
            if (navigator.vibrate) navigator.vibrate(200);
          }
          return newStatus;
        } else {
          console.log(`⚠️ Status unchanged: ${prev}`)
          return prev;
        }
      });
    },
    fallbackToPolling: true,
    pollingInterval: 2000 // Faster polling for POS environment
  });

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
    setIsLocked(true);
    
    // Request fullscreen for kiosk mode
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(console.warn);
    }
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
        console.log(`🆕 Setting initial status from payment creation:`, json.now.payment_status || 'pending');
        console.log(`🔍 Full payment data:`, json.now);
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
    <>
      {/* Fullscreen CSS for kiosk mode */}
      {isLocked && (
        <style jsx global>{`
          ::-webkit-scrollbar { display: none; }
          html { -ms-overflow-style: none; scrollbar-width: none; }
          body { overflow: auto; } /* Allow scrolling for receipt entry and buttons */
          
          /* Hide browser UI in fullscreen */
          :fullscreen {
            background: linear-gradient(135deg, #faf5ff 0%, #ffffff 50%, #faf5ff 100%);
          }
          
          /* Rotation lock preference for tablets */
          @media screen and (orientation: landscape) and (max-height: 900px) {
            html {
              transform-origin: center;
              user-select: none;
              -webkit-user-select: none;
            }
          }
        `}</style>
      )}
      

      <div className="flex flex-col items-center justify-center min-h-screen p-2 sm:p-4 bg-gradient-to-br from-purple-50 via-white to-purple-50">
        <div className="w-full max-w-2xl landscape:max-w-6xl">
        {/* Main Card */}
        <Card className="w-full border-0 shadow-2xl bg-white/95 backdrop-blur-sm rounded-3xl overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-[#7f5efd] to-[#9b7cff]"></div>
          <CardHeader className="pb-0">
            {/* Dashboard Button - Top Left of Card (only on initial page) */}
            {step === 'amount' && !paymentLink && (
              <div className="flex justify-start -mt-4">
                <Link href="/merchant/dashboard">
                  <button className="text-[#7f5efd] hover:text-[#9b7cff] transition-colors duration-200 p-1.5 rounded-md hover:bg-purple-50">
                    <ArrowLeft className="h-5 w-11 stroke-[3]" />
                  </button>
                </Link>
              </div>
            )}

            {/* Status Bar */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "h-2 w-2 rounded-full",
                  merchantSettings ? "bg-green-500 animate-pulse" : "bg-gray-300"
                )} />
                <span className="text-xs text-gray-600">
                  {merchantSettings ? (isLocked ? 'Customer Mode - Locked' : 'Terminal Active') : 'Loading...'}
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
            <div className="w-full space-y-4 sm:space-y-6 landscape:grid landscape:grid-cols-3 landscape:gap-6 landscape:space-y-0">
              {/* Amount Display - spans 2 columns in landscape */}
              <div className="bg-gradient-to-br from-purple-50 to-white p-6 sm:p-8 rounded-2xl border border-purple-100 landscape:col-span-2 h-full flex flex-col justify-center min-h-[140px]">
                <div className="flex items-center justify-center mb-2">
                  <DollarSign className="h-5 w-5 text-[#7f5efd] mr-1" />
                  <span className="text-sm text-gray-500 uppercase tracking-wider">Amount</span>
                </div>
                <div className="text-center font-phonic text-4xl sm:text-5xl font-bold text-[#7f5efd]" aria-live="polite">
                  ${amount || '0.00'}
                </div>
              </div>
              {/* Price Breakdown - positioned in sidebar for landscape */}
              <div className="landscape:col-span-1 landscape:space-y-4">
                {baseAmount > 0 && (
                  <div className="bg-gradient-to-br from-gray-50 to-white p-6 sm:p-8 rounded-2xl border border-gray-200 text-sm space-y-2 h-full flex flex-col justify-center min-h-[140px]" aria-live="polite">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-semibold text-gray-900">${baseAmount.toFixed(2)}</span>
                    </div>
                    {tax && taxAmount > 0 && (
                      <div className="flex justify-between items-center text-[#7f5efd]">
                        <span>Tax</span>
                        <span className="font-medium">+${taxAmount.toFixed(2)}</span>
                      </div>
                    )}
                    {chargeFee && gatewayFee > 0 && (
                      <div className="flex justify-between items-center text-[#7f5efd]">
                        <span>Gateway fee</span>
                        <span className="font-medium">+${gatewayFee.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center font-bold border-t border-gray-200 pt-1">
                      <span className="text-gray-700">Total</span>
                      <span className="text-[#7f5efd]">${preTipTotal.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
              {/* Number Pad - spans full width in landscape */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 landscape:col-span-3">
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

              {/* Options - spans full width in landscape */}
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 landscape:col-span-3">
                <label className={cn(
                  "flex items-center space-x-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-all duration-200",
                  tax ? "bg-[#7f5efd] border-[#7f5efd] text-white" : "bg-white border-purple-200 hover:border-[#7f5efd] text-gray-700"
                )}>
                  <div className={cn(
                    "h-4 w-4 rounded-full border-2 flex items-center justify-center",
                    tax ? "border-white" : "border-[#7f5efd]"
                  )}>
                    {tax && <div className="h-2 w-2 rounded-full bg-white"></div>}
                  </div>
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={tax} 
                    disabled={false} 
                    onChange={e=>setTax(e.target.checked)} 
                    aria-label="Add tax"
                  />
                  <span className="text-sm font-medium">Add tax</span>
                </label>
                <label className={cn(
                  "flex items-center space-x-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-all duration-200",
                  chargeFee ? "bg-[#7f5efd] border-[#7f5efd] text-white" : "bg-white border-purple-200 hover:border-[#7f5efd] text-gray-700"
                )}>
                  <div className={cn(
                    "h-4 w-4 rounded-full border-2 flex items-center justify-center",
                    chargeFee ? "border-white" : "border-[#7f5efd]"
                  )}>
                    {chargeFee && <div className="h-2 w-2 rounded-full bg-white"></div>}
                  </div>
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={chargeFee ?? false} 
                    disabled={chargeFee === undefined} 
                    onChange={e=>setChargeFee(e.target.checked)} 
                    aria-label="Charge customer fee" 
                  />
                  <span className="text-sm font-medium">Customer pays fee</span>
                </label>
              </div>

              {/* Continue Button - spans full width in landscape */}
              <Button 
                onClick={readyForPayment}
                variant="default"
                className="w-full h-14 sm:h-16 text-lg font-semibold bg-gradient-to-r from-[#7f5efd] to-[#9b7cff] hover:from-[#7c3aed] hover:to-[#8b6cef] text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 landscape:col-span-3"
                aria-label="ready"
                disabled={!amount}
              >
                <DollarSign className="h-5 w-5" />
                Ready for Payment
              </Button>
            </div>
          )}
          {step === 'customer' && !paymentLink && (
            <div className="w-full space-y-3 landscape:grid landscape:grid-cols-2 landscape:gap-6 landscape:space-y-0">
              {/* Order Summary - left column in landscape */}
              <div className="bg-gradient-to-br from-purple-50 to-white p-3 rounded-xl border border-purple-100 landscape:col-span-1" aria-live="polite">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingBag className="h-4 w-4 text-[#7f5efd]" />
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Order Summary</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold text-gray-900">${baseAmount.toFixed(2)}</span>
                  </div>
                  {tax && taxAmount > 0 && (
                    <div className="flex justify-between items-center text-[#7f5efd]">
                      <span>Tax</span>
                      <span className="font-medium">+${taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {chargeFee && gatewayFee > 0 && (
                    <div className="flex justify-between items-center text-[#7f5efd]">
                      <span>Gateway fee</span>
                      <span className="font-medium">+${gatewayFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center font-bold border-t border-purple-100 pt-1">
                    <span className="text-gray-700">Total</span>
                    <span className="text-[#7f5efd]">${preTipTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              {/* Tip Selection - right column in landscape */}
              <div className="bg-white p-3 rounded-xl border border-gray-200 landscape:col-span-1 landscape:space-y-4">
                <p className="text-sm font-semibold text-gray-700 mb-2 text-center">Add a tip?</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(device?.tip_presets || defaultTips).map((p: number) => (
                    <Button 
                      key={p} 
                      variant={tipPercent === p ? 'default' : 'outline'} 
                      className={cn(
                        "h-10 font-semibold rounded-lg transition-all duration-200",
                        tipPercent === p 
                          ? "bg-gradient-to-r from-[#7f5efd] to-[#9b7cff] text-white shadow-lg" 
                          : "bg-white border border-purple-200 text-[#7f5efd] hover:bg-purple-50 hover:border-[#7f5efd]"
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
                      "h-10 font-semibold rounded-lg transition-all duration-200",
                      tipPercent === 0 && tipSelected
                        ? "bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg" 
                        : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400"
                    )}
                    onClick={() => {setTipPercent(0); setTipSelected(true);}} 
                    aria-label="no tip"
                  >
                    No Tip
                  </Button>
                </div>
              </div>
              {/* Currency Selection - right column continued */}
              <div className="space-y-2 landscape:col-span-1">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Network className="h-4 w-4 text-[#7f5efd]" />
                  Network
                </label>
                
                {/* Network Filter */}
                {availableCurrencies.length > 0 && (() => {
                  const groupedCurrencies = groupCurrenciesByNetwork(
                    availableCurrencies.map(c => ({ code: c.code, name: c.name })),
                    merchantSettings?.wallets ? Object.keys(merchantSettings.wallets) : []
                  )
                  const availableNetworks = sortNetworksByPriority(Array.from(groupedCurrencies.keys()))
                  
                  const getNetworkIcon = (networkId: string) => {
                    switch (networkId) {
                      case 'bitcoin': return <Bitcoin className="h-4 w-4 text-white" />
                      case 'ethereum': return <Zap className="h-4 w-4 text-white" />
                      case 'binance': return <TrendingUp className="h-4 w-4 text-white" />
                      case 'solana': return <Zap className="h-4 w-4 text-white" />
                      case 'polygon': return <Network className="h-4 w-4 text-white" />
                      case 'tron': return <Globe className="h-4 w-4 text-white" />
                      case 'ton': return <Smartphone className="h-4 w-4 text-white" />
                      case 'arbitrum': return <TrendingUp className="h-4 w-4 text-white" />
                      case 'optimism': return <CheckCircle2 className="h-4 w-4 text-white" />
                      case 'base': return <DollarSign className="h-4 w-4 text-white" />
                      case 'avalanche': return <Network className="h-4 w-4 text-white" />
                      case 'algorand': return <Coins className="h-4 w-4 text-white" />
                      case 'litecoin': return <Coins className="h-4 w-4 text-white" />
                      case 'cardano': return <Coins className="h-4 w-4 text-white" />
                      case 'polkadot': return <Network className="h-4 w-4 text-white" />
                      case 'chainlink': return <Globe className="h-4 w-4 text-white" />
                      default: return <Network className="h-4 w-4 text-white" />
                    }
                  }
                  
                  return (
                    <Select value={selectedNetwork} onValueChange={(v) => setSelectedNetwork(v)}>
                      <SelectTrigger className="w-full h-12 bg-gradient-to-r from-white to-purple-50 border-2 border-purple-200 hover:border-[#7f5efd] focus:border-[#7f5efd] rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:scale-[1.02]">
                        <SelectValue placeholder="All Networks" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-purple-200 shadow-xl bg-gradient-to-br from-[#7f5efd] to-[#9b7cff] backdrop-blur-sm">
                        <SelectItem value="all" className="hover:bg-white/10 rounded-lg transition-colors duration-200">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-white" />
                            <span className="font-medium text-white">All Networks</span>
                          </div>
                        </SelectItem>
                        {availableNetworks.map(networkId => {
                          const network = getNetworkInfo(networkId)
                          if (!network) return null
                          const currencyCount = groupedCurrencies.get(networkId)?.length || 0
                          return (
                            <SelectItem key={networkId} value={networkId} className="hover:bg-white/10 rounded-lg transition-colors duration-200">
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                  {getNetworkIcon(networkId)}
                                  <span className="font-medium text-white">{network.displayName}</span>
                                </div>
                                <span className="text-xs text-white/60 bg-white/10 px-1.5 py-0.5 rounded">
                                  {currencyCount}
                                </span>
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  )
                })()}
                
                {/* Currency Selection */}
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Coins className="h-4 w-4 text-[#7f5efd]" />
                  Currency
                </label>
                <Select value={crypto} onValueChange={(value) => setCrypto(value)}>
                  <SelectTrigger className="w-full h-12 bg-gradient-to-r from-white to-purple-50 border-2 border-purple-200 hover:border-[#7f5efd] focus:border-[#7f5efd] rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:scale-[1.02]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-purple-200 shadow-xl bg-gradient-to-br from-[#7f5efd] to-[#9b7cff] backdrop-blur-sm">
                    {(() => {
                      // Filter currencies based on selected network
                      let filteredCurrencies = availableCurrencies
                      
                      if (selectedNetwork !== 'all') {
                        const groupedCurrencies = groupCurrenciesByNetwork(
                          availableCurrencies.map(c => ({ code: c.code, name: c.name })),
                          merchantSettings?.wallets ? Object.keys(merchantSettings.wallets) : []
                        )
                        const networkCurrencies = groupedCurrencies.get(selectedNetwork) || []
                        const networkCurrencyCodes = new Set(networkCurrencies.map(c => c.code))
                        filteredCurrencies = availableCurrencies.filter(c => networkCurrencyCodes.has(c.code))
                      }
                      
                      const getCurrencyIcon = (currencyCode: string) => {
                        const code = currencyCode.toUpperCase()
                        // Bitcoin
                        if (code === 'BTC') return <Bitcoin className="h-4 w-4 text-white" />
                        // Stablecoins
                        if (code.includes('USDT')) return <DollarSign className="h-4 w-4 text-white" />
                        if (code.includes('USDC')) return <DollarSign className="h-4 w-4 text-white" />
                        if (code.includes('DAI')) return <DollarSign className="h-4 w-4 text-white" />
                        if (code.includes('PYUSD')) return <DollarSign className="h-4 w-4 text-white" />
                        if (code.includes('BUSD') || code.includes('TUSD')) return <DollarSign className="h-4 w-4 text-white" />
                        // Major cryptocurrencies
                        if (code === 'ETH' || code.includes('ETH')) return <Zap className="h-4 w-4 text-white" />
                        if (code === 'SOL' || code.includes('SOL')) return <Zap className="h-4 w-4 text-white" />
                        if (code === 'BNB' || code.includes('BNB')) return <TrendingUp className="h-4 w-4 text-white" />
                        if (code === 'MATIC') return <Network className="h-4 w-4 text-white" />
                        if (code === 'TRX') return <Globe className="h-4 w-4 text-white" />
                        if (code === 'TON') return <Smartphone className="h-4 w-4 text-white" />
                        if (code === 'ARB') return <TrendingUp className="h-4 w-4 text-white" />
                        if (code === 'OP') return <CheckCircle2 className="h-4 w-4 text-white" />
                        if (code === 'AVAX') return <Network className="h-4 w-4 text-white" />
                        if (code === 'ALGO') return <Coins className="h-4 w-4 text-white" />
                        if (code === 'LTC') return <Coins className="h-4 w-4 text-white" />
                        if (code === 'ADA') return <Coins className="h-4 w-4 text-white" />
                        if (code === 'DOT') return <Network className="h-4 w-4 text-white" />
                        if (code === 'LINK') return <Globe className="h-4 w-4 text-white" />
                        return <Coins className="h-4 w-4 text-white" />
                      }
                      
                      return filteredCurrencies.map((c) => {
                        const displayName = c.name || getCurrencyDisplayName(c.code)
                        const isAvailable = c.enabled
                        return (
                          <SelectItem
                            key={c.code}
                            value={c.code}
                            disabled={!isAvailable}
                            className={cn(
                              "hover:bg-white/10 rounded-lg transition-colors duration-200",
                              !isAvailable && "opacity-50 cursor-not-allowed"
                            )}
                            title={!isAvailable ? 'Temporarily unavailable' : undefined}
                          >
                            <div className="flex items-center gap-2">
                              {getCurrencyIcon(c.code)}
                              <span className="font-bold text-white">{c.code.toUpperCase()}</span>
                              <span className="text-sm text-white/80">{displayName}</span>
                            </div>
                          </SelectItem>
                        )
                      })
                    })()}
                  </SelectContent>
                </Select>
              </div>
              {/* Final Total Display - spans both columns in landscape */}
              {tipSelected && (
                <div className="bg-gradient-to-r from-[#7f5efd] to-[#9b7cff] p-3 rounded-xl text-white landscape:col-span-2">
                  <div className="text-center">
                    <p className="text-xs opacity-90 mb-1">Final Total</p>
                    <p className="text-2xl font-bold">${finalTotal.toFixed(2)}</p>
                    {tipPercent !== null && tipPercent > 0 && (
                      <p className="text-xs opacity-90 mt-1">Includes ${tipAmount.toFixed(2)} tip</p>
                    )}
                  </div>
                </div>
              )}
              {/* Generate Payment Button - spans both columns in landscape */}
              <Button 
                onClick={generate}
                variant="default"
                className="w-full h-14 sm:h-16 text-lg font-semibold bg-gradient-to-r from-[#7f5efd] to-[#9b7cff] hover:from-[#7c3aed] hover:to-[#8b6cef] text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 landscape:col-span-2"
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
                const baseUri = buildPaymentURI(paymentData.pay_currency, paymentData.pay_address, paymentData.pay_amount, paymentData.payin_extra_id);
                const uri = baseUri;
                const showAmount = uri === paymentData.pay_address;
                const needsExtra = !!(paymentData.payin_extra_id && requiresExtraId(paymentData.pay_currency));
                  return (
                    <>
                    {/* Payment Status */}
                    <div className="w-full bg-gradient-to-br from-purple-50 to-white p-4 rounded-xl border border-purple-100">
                      {status !== 'confirmed' ? (
                        <>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Clock className="h-6 w-6 text-[#7f5efd] animate-spin" />
                              <span className="font-semibold text-gray-700">Awaiting Payment</span>
                            </div>
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-[#7f5efd]">
                              {status.toUpperCase()}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Left: Payment Confirmed */}
                          <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                            <div className="flex items-center gap-2 justify-center md:justify-start">
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                              <div className="text-center md:text-left">
                                <p className="font-semibold text-green-800 leading-tight">Payment Confirmed</p>
                                <p className="text-xs text-green-600">Transaction has been confirmed</p>
                              </div>
                            </div>
                          </div>
                          {/* Right: Send Receipt */}
                          <div className="bg-white p-3 rounded-lg border border-gray-200">
                            <div className="flex gap-2 justify-center md:justify-end">
                              <Input 
                                placeholder="Customer email address" 
                                value={receipt.email} 
                                onChange={e=>setReceipt({...receipt, email:e.target.value})} 
                                aria-label="receipt email"
                                className="h-10 bg-white border-2 border-transparent hover:border-[#7f5efd] focus:border-[#7f5efd] rounded-lg transition-all duration-200 w-full max-w-xs"
                              />
                              <Button 
                                onClick={sendEmailReceipt} 
                                disabled={!receipt.email.trim() || receipt.sent}
                                className={cn(
                                  "h-10 px-4 font-semibold rounded-lg transition-all duration-200",
                                  receipt.sent 
                                    ? "bg-green-600 hover:bg-green-700 text-white" 
                                    : "bg-[#7f5efd] hover:bg-[#7c3aed] text-white"
                                )}
                              >
                                {receipt.sent ? (
                                  <>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Sent
                                  </>
                                ) : (
                                  <>
                                    <Mail className="h-4 w-4 mr-2" />
                                    Email Receipt
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Pre-send confirmation for tag/memo */}
                    {needsExtra && (
                      <div className="w-full bg-purple-50 border border-purple-200 rounded-lg p-2">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-[#7f5efd] mt-0.5 flex-shrink-0" />
                          <label className="text-xs text-purple-900 flex-1">
                            <input
                              type="checkbox"
                              className="mr-2 align-middle h-4 w-4 text-[#7f5efd] border-purple-300 rounded"
                              checked={extraIdConfirmed}
                              onChange={(e) => setExtraIdConfirmed(e.target.checked)}
                            />
                            I’ll include the {getExtraIdLabel(paymentData.pay_currency).toLowerCase()} before sending
                          </label>
                        </div>
                      </div>
                    )}

                    {/* QR Code (single) */}
                    {(!needsExtra || extraIdConfirmed) && (
                      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
                        <QRCode currency={paymentData.pay_currency} address={paymentData.pay_address} extraId={paymentData.payin_extra_id} size={256} hideDetails />
                        {needsExtra && (
                          <p className="text-xs text-center text-green-600 mt-3">
                            ✓ {getExtraIdLabel(paymentData.pay_currency)} included
                          </p>
                        )}
                      </div>
                    )}
                    {needsExtra && !extraIdConfirmed && (
                      <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 text-center">
                        <p className="text-sm font-medium text-purple-900">Please confirm you will include the {getExtraIdLabel(paymentData.pay_currency).toLowerCase()} to reveal the QR code.</p>
                      </div>
                    )}

                    {/* Change Currency button (compact) - positioned below QR code */}
                    {status !== 'confirmed' && (
                      <div className="flex justify-center">
                        <button
                          type="button"
                          className="h-8 px-3 text-xs font-semibold rounded-md bg-[#7f5efd] hover:bg-[#7c3aed] text-white shadow-sm transition-colors"
                          onClick={() => {
                            setPaymentLink(null);
                            setPaymentData(null);
                            setInvoiceBreakdown(null);
                            setStatus('');
                            setExtraIdConfirmed(false);
                          }}
                        >
                          Change Currency
                        </button>
                      </div>
                    )}
                    {/* Payment Details */}
                    <div className="w-full bg-gradient-to-r from-purple-50 to-purple-25 p-4 rounded-xl border border-purple-200">
                      <div className="text-center">
                        <p className="text-xs text-gray-600 mb-1">Send exactly</p>
                        <p className="text-3xl font-bold text-[#7f5efd] mb-1">
                          {formatAmountForDisplay(paymentData.pay_amount)}
                        </p>
                        <p className="text-xl font-semibold text-[#7f5efd] uppercase">
                          {paymentData.pay_currency}
                        </p>
                      </div>
                    </div>
                    {/* Address Display */
                    // Always show the amount below address as a manual fallback
                    }
                    <div className="w-full bg-gradient-to-br from-purple-50 to-white p-3 rounded-xl border border-purple-200">
                      <div className="mb-2 text-center">
                        <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Wallet Address</span>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm text-center">
                        <p className="text-xs text-gray-600 mb-1">Send to this address</p>
                        <p className="text-sm font-mono break-all text-[#7f5efd] leading-relaxed tracking-wide font-semibold">
                          {paymentData.pay_address}
                        </p>
                      </div>
                    </div>
                    
                    {/* Destination Tag/Memo Warning */}
                    {paymentData.payin_extra_id && requiresExtraId(paymentData.pay_currency) && (
                      <div className="w-full bg-purple-50 border border-purple-200 rounded-lg p-2">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-[#7f5efd] mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-purple-900 mb-1">
                              {getExtraIdLabel(paymentData.pay_currency)} Required
                            </p>
                            <div className="bg-white p-1.5 rounded-md border border-purple-200 mb-1">
                              <p className="text-xs font-mono text-gray-900">
                                {paymentData.payin_extra_id}
                              </p>
                            </div>
                            <p className="text-xs text-purple-900">Include this {getExtraIdLabel(paymentData.pay_currency).toLowerCase()} or the payment may be lost.</p>
                            <p className="text-[11px] text-purple-900 mt-1">In many wallets (e.g., Trust Wallet), paste under “{getExtraIdLabel(paymentData.pay_currency)}” or “Memo”.</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Back Button - Hidden when locked */}
                    {status !== 'confirmed' && !isLocked && (
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

              {/* Success Actions */}
              {status === 'confirmed' && (
                <div className="space-y-4 w-full">
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
                      setTax(Boolean(merchantSettings?.tax_enabled)); 
                      setChargeFee(Boolean(merchantSettings?.charge_customer_fee));
                      setReceipt({ email: '', sent: false });
                      setIsLocked(false);
                      
                      // Exit fullscreen
                      if (document.fullscreenElement && document.exitFullscreen) {
                        document.exitFullscreen().catch(console.warn);
                      }
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
    </>
  );
}

export default function SmartTerminalPage() {
  return (
    <Suspense fallback={null}>
      <SmartTerminalPageContent />
    </Suspense>
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
