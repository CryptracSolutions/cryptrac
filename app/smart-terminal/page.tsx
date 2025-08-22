'use client';

import React, { useEffect, useState } from 'react';
import { supabase, makeAuthenticatedRequest } from '@/lib/supabase-browser';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { QRCode } from '@/app/components/ui/qr-code';

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
  const [receipt, setReceipt] = useState({ email: '' });
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
        
        throw new Error(errorData.error || 'Failed to create payment');
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
    setReceipt({ email: '' });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Smart Terminal</h1>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 max-w-sm">
          {error}
        </div>
      )}
      {step === 'amount' && !paymentLink && (
        <div className="w-full max-w-sm space-y-4">
          <div className="text-center text-3xl" aria-live="polite">{amount || '0.00'}</div>
          <div className="bg-gray-100 p-2 rounded text-sm space-y-1" aria-live="polite">
            <div className="flex justify-between"><span>Subtotal</span><span>{baseAmount.toFixed(2)}</span></div>
            {tax && merchantSettings?.tax_rates && merchantSettings.tax_rates.map((rate, index) => (
              <div key={index} className="flex justify-between text-green-700">
                <span>{rate.label} ({rate.percentage}%)</span>
                <span>+{((baseAmount * rate.percentage) / 100).toFixed(2)}</span>
              </div>
            ))}
            {tax && <div className="flex justify-between font-medium text-green-700 border-t pt-2">
              <span>Total Tax</span><span>+{taxAmount.toFixed(2)}</span>
            </div>}
            {tax && <div className="flex justify-between font-medium border-t pt-2">
              <span>Subtotal with Tax</span><span>{preview.subtotal_with_tax.toFixed(2)}</span>
            </div>}
            {chargeFee && <div className="flex justify-between text-blue-700">
              <span>Gateway fee ({merchantSettings?.auto_convert_enabled ? '1.0' : '0.5'}%)</span>
              <span>+{gatewayFee.toFixed(2)}</span>
            </div>}
            <div className="flex justify-between font-semibold"><span>Total (pre-tip)</span><span>{preTipTotal.toFixed(2)}</span></div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[1,2,3,4,5,6,7,8,9,'0','.'].map((d: string | number)=> (
              <Button key={d} className="h-16" aria-label={`digit ${d}`} onClick={()=>appendDigit(String(d))}>{d}</Button>
            ))}
            <Button className="h-16" onClick={backspace} aria-label="backspace">⌫</Button>
            <Button className="h-16" onClick={clearAmount} aria-label="clear">C</Button>
          </div>
          <div className="flex items-center gap-2">
            <label>
              <input type="checkbox" className="mr-2" checked={tax ?? false} disabled={tax === undefined} onChange={e=>setTax(e.target.checked)} aria-label="Add tax"/>Add tax
            </label>
            <label>
              <input type="checkbox" className="mr-2" checked={chargeFee ?? false} disabled={chargeFee === undefined} onChange={e=>setChargeFee(e.target.checked)} aria-label="Charge customer fee" />Charge customer fee
            </label>
          </div>
          <Button onClick={readyForPayment} className="w-full h-14" aria-label="ready" disabled={!amount}>Ready for payment</Button>
        </div>
      )}
      {step === 'customer' && !paymentLink && (
        <div className="w-full max-w-sm space-y-4">
          <div className="bg-gray-100 p-2 rounded text-sm space-y-1" aria-live="polite">
            <div className="flex justify-between"><span>Subtotal</span><span>{baseAmount.toFixed(2)}</span></div>
            {tax && merchantSettings?.tax_rates && merchantSettings.tax_rates.map((rate, index) => (
              <div key={index} className="flex justify-between text-green-700">
                <span>{rate.label} ({rate.percentage}%)</span>
                <span>+{((baseAmount * rate.percentage) / 100).toFixed(2)}</span>
              </div>
            ))}
            {tax && <div className="flex justify-between font-medium text-green-700 border-t pt-2">
              <span>Total Tax</span><span>+{taxAmount.toFixed(2)}</span>
            </div>}
            {tax && <div className="flex justify-between font-medium border-t pt-2">
              <span>Subtotal with Tax</span><span>{preview.subtotal_with_tax.toFixed(2)}</span>
            </div>}
            {chargeFee && <div className="flex justify-between text-blue-700">
              <span>Gateway fee ({merchantSettings?.auto_convert_enabled ? '1.0' : '0.5'}%)</span>
              <span>+{gatewayFee.toFixed(2)}</span>
            </div>}
            <div className="flex justify-between font-semibold"><span>Total (pre-tip)</span><span>{preTipTotal.toFixed(2)}</span></div>
          </div>
          <div className="flex gap-2 justify-center">
            {(device?.tip_presets || defaultTips).map((p:number)=> (
              <Button key={p} variant={tipPercent===p?'default':'outline'} className="h-12" onClick={()=>{setTipPercent(p); setTipSelected(true);}} aria-label={`tip ${p}%`}>{p}%</Button>
            ))}
            <Button variant={tipPercent===0 && tipSelected?'default':'outline'} className="h-12" onClick={()=>{setTipPercent(0); setTipSelected(true);}} aria-label="no tip">No Tip</Button>
          </div>
          <select value={crypto} onChange={e=>setCrypto(e.target.value)} className="border p-2 rounded w-full" aria-label="crypto">
            {availableCurrencies.map((c:string)=> <option key={c} value={c}>{c}</option>)}
          </select>
          {tipSelected && <div className="text-center text-xl">Final Total: {finalTotal.toFixed(2)}</div>}
          <Button onClick={generate} className="w-full h-14" aria-label="pay now" disabled={!tipSelected || loading}>Pay now</Button>
        </div>
      )}
      {paymentLink && paymentData && (
        <div className="flex flex-col items-center space-y-4" aria-live="polite">
          {(() => {
            const uri = buildPaymentURI(paymentData.pay_currency, paymentData.pay_address, paymentData.pay_amount);
            const showAmount = uri === paymentData.pay_address;
            return (
              <>
                <QRCode value={uri} size={256} />
                <div className="font-medium">{paymentData.pay_currency}</div>
                {showAmount && <div>Send amount: {paymentData.pay_amount} {paymentData.pay_currency}</div>}
                <div className="flex gap-2">
                  <Button onClick={() => navigator.clipboard.writeText(paymentData.pay_address)}>Copy address</Button>
                  {showAmount && <Button onClick={() => navigator.clipboard.writeText(String(paymentData.pay_amount))}>Copy amount</Button>}
                  <Button variant="outline" onClick={() => { setPaymentLink(null); setPaymentData(null); setInvoiceBreakdown(null); setStatus(''); setTipSelected(false); setTipPercent(null); }}>Back</Button>
                </div>
              </>
            );
          })()}
          <div className="text-sm text-center">
            <div className="flex justify-between"><span>Subtotal</span><span>{baseAmount.toFixed(2)}</span></div>
            {invoiceBreakdown?.tax_amount ? <div className="flex justify-between"><span>Tax</span><span>{invoiceBreakdown.tax_amount.toFixed(2)}</span></div> : null}
            {invoiceBreakdown?.gateway_fee ? <div className="flex justify-between"><span>Gateway fee</span><span>{invoiceBreakdown.gateway_fee.toFixed(2)}</span></div> : null}
            {invoiceBreakdown?.tip_amount ? <div className="flex justify-between"><span>Tip</span><span>{invoiceBreakdown.tip_amount.toFixed(2)}</span></div> : null}
            <div className="flex justify-between font-semibold"><span>Total</span><span>{(invoiceBreakdown?.final_total || finalTotal).toFixed(2)}</span></div>
          </div>
          <div>Status: {status}</div>
          {status === 'confirmed' && (
            <div className="space-y-2 w-full max-w-sm">
              <div className="flex gap-2">
                <Input placeholder="Email for receipt" value={receipt.email} onChange={e=>setReceipt({email:e.target.value})} aria-label="receipt email" />
                <Button onClick={sendEmailReceipt} disabled={!receipt.email.trim()}>Send Receipt</Button>
              </div>
              <Button onClick={()=>{setPaymentLink(null); setPaymentData(null); setInvoiceBreakdown(null); setAmount(''); setStatus(''); setTipPercent(null); setTipSelected(false); setStep('amount'); setTax(merchantSettings?.tax_enabled); setChargeFee(merchantSettings?.charge_customer_fee);}}>New Sale</Button>
            </div>
          )}
        </div>
      )}
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

