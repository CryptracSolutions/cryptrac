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

const defaultTips = [10, 15, 20];

export default function SmartTerminalPage() {
  const [device, setDevice] = useState<TerminalDevice | null>(null);
  const [amount, setAmount] = useState('');
  const [tipPercent, setTipPercent] = useState<number | null>(null);
  const [tipSelected, setTipSelected] = useState(false);
  const [tax, setTax] = useState(false);
  const [chargeFee, setChargeFee] = useState(false);
  const [crypto, setCrypto] = useState('BTC');
  const [taxRates, setTaxRates] = useState<Array<{ label: string; percentage: number }>>([]);
  interface PaymentLink { id: string; link_id: string; }
  const [paymentLink, setPaymentLink] = useState<PaymentLink | null>(null);
  const [paymentData, setPaymentData] = useState<{ pay_address: string; pay_amount: number } | null>(null);
  const [status, setStatus] = useState('');
  const [receipt, setReceipt] = useState({ email: '', phone: '' });

  useEffect(() => {
    (async () => {
      const id = localStorage.getItem('terminal_device_id');
      const body: Record<string, unknown> = id ? { id } : { label: 'Device', tip_presets: defaultTips };
      const res = await makeAuthenticatedRequest('/api/terminal/devices', { method: 'POST', body: JSON.stringify(body) });
      const json = await res.json();
      localStorage.setItem('terminal_device_id', json.data.id);
      setDevice(json.data);
      if (json.data?.accepted_cryptos?.length) setCrypto(json.data.accepted_cryptos[0]);
      setChargeFee(json.data.charge_customer_fee ?? false);
      setTax(json.data.tax_enabled ?? false);
      setTaxRates(json.data.tax_rates || []);
    })();
  }, []);

  useEffect(() => {
    if (paymentLink) {
      const channel = supabase
        .channel('pos-' + paymentLink.id)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'transactions', filter: `payment_link_id=eq.${paymentLink.id}` }, payload => {
          if (payload.new.status === 'confirmed') {
            setStatus('confirmed');
            playBeep();
            if (navigator.vibrate) navigator.vibrate(200);
          }
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [paymentLink]);

  const appendDigit = (d: string) => {
    setAmount(prev => (prev + d).replace(/^0+(\d)/, '$1'));
  };
  const clearAmount = () => setAmount('');
  const backspace = () => setAmount(prev => prev.slice(0, -1));

  const totalTaxRate = taxRates.reduce((sum, r) => sum + (parseFloat(String(r.percentage)) || 0), 0);
  const baseAmount = parseFloat(amount || '0');
  const taxAmount = tax ? (baseAmount * totalTaxRate) / 100 : 0;
  const subtotalWithTax = baseAmount + taxAmount;
  const gatewayFee = chargeFee ? subtotalWithTax * 0.005 : 0;
  const preTipTotal = subtotalWithTax + gatewayFee;
  const tipAmount = tipPercent ? (preTipTotal * tipPercent) / 100 : 0;
  const finalTotal = preTipTotal + tipAmount;

  const generate = async () => {
    if (!device || !tipSelected || !amount) return;
    const body: Record<string, unknown> = {
      title: 'POS Sale',
      amount: baseAmount,
      currency: 'USD',
      accepted_cryptos: [crypto],
      max_uses: 1,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      source: 'pos',
      pos_device_id: device.id,
      metadata: { pos: { device_id: device.id, tip_amount: tipAmount, pre_tip_total: preTipTotal } },
      charge_customer_fee: chargeFee,
      tax_enabled: tax,
      tax_rates: tax ? taxRates : [],
    };
    const res = await makeAuthenticatedRequest('/api/payments/create', { method: 'POST', body: JSON.stringify(body) });
    const json = await res.json();
    setPaymentLink(json.payment_link);
    setStatus('pending');
    const invoiceBody = {
      price_amount: finalTotal,
      price_currency: 'USD',
      pay_currency: crypto,
      order_id: `pos_${json.payment_link.link_id}_${Date.now()}`,
      order_description: 'POS Sale',
      payment_link_id: json.payment_link.id,
      base_amount: baseAmount,
      tax_enabled: tax,
      tax_rates: tax ? taxRates : [],
      tax_amount: taxAmount,
      subtotal_with_tax: subtotalWithTax,
    };
    const paymentRes = await makeAuthenticatedRequest('/api/nowpayments/create-payment', { method: 'POST', body: JSON.stringify(invoiceBody) });
    const paymentJson = await paymentRes.json();
    if (paymentJson?.payment?.pay_address) {
      setPaymentData(paymentJson.payment);
    }
  };

  const sendReceipt = async (type: 'email' | 'sms') => {
    if (!paymentLink) return;
    const url = type === 'email' ? '/api/receipts/email' : '/api/receipts/sms';
    const data =
      type === 'email'
        ? { email: receipt.email, payment_link_id: paymentLink.id }
        : { phone: receipt.phone, payment_link_id: paymentLink.id };
    await makeAuthenticatedRequest(url, { method: 'POST', body: JSON.stringify(data) });
    setReceipt({ email: '', phone: '' });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Smart Terminal</h1>
      {!paymentLink && (
        <div className="w-full max-w-sm space-y-4">
          <div className="text-center text-3xl" aria-live="polite">{amount || '0.00'}</div>
          <div className="bg-gray-100 p-2 rounded text-sm space-y-1" aria-live="polite">
            <div className="flex justify-between"><span>Subtotal</span><span>{baseAmount.toFixed(2)}</span></div>
            {tax && <div className="flex justify-between"><span>Tax</span><span>{taxAmount.toFixed(2)}</span></div>}
            {chargeFee && <div className="flex justify-between"><span>Gateway fee</span><span>{gatewayFee.toFixed(2)}</span></div>}
            <div className="flex justify-between font-semibold"><span>Total (pre-tip)</span><span>{preTipTotal.toFixed(2)}</span></div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[1,2,3,4,5,6,7,8,9,'0','.'].map((d: string | number)=> (
              <Button key={d} className="h-16" aria-label={`digit ${d}`} onClick={()=>appendDigit(String(d))}>{d}</Button>
            ))}
            <Button className="h-16" onClick={backspace} aria-label="backspace">⌫</Button>
            <Button className="h-16" onClick={clearAmount} aria-label="clear">C</Button>
          </div>
          <div className="flex gap-2 justify-center">
            {(device?.tip_presets || defaultTips).map((p:number)=> (
              <Button key={p} variant={tipPercent===p?'default':'outline'} className="h-12" onClick={()=>{setTipPercent(p); setTipSelected(true);}} aria-label={`tip ${p}%`}>{p}%</Button>
            ))}
            <Button variant={tipPercent===0 && tipSelected?'default':'outline'} className="h-12" onClick={()=>{setTipPercent(0); setTipSelected(true);}} aria-label="no tip">No Tip</Button>
          </div>
          <div className="flex items-center gap-2">
            <label>
              <input type="checkbox" className="mr-2" checked={tax} onChange={e=>setTax(e.target.checked)} aria-label="Add tax"/>Add tax
            </label>
            <label>
              <input type="checkbox" className="mr-2" checked={chargeFee} onChange={e=>setChargeFee(e.target.checked)} aria-label="Charge customer fee" />Charge customer fee
            </label>
          </div>
          <select value={crypto} onChange={e=>setCrypto(e.target.value)} className="border p-2 rounded w-full" aria-label="crypto">
            {(device?.accepted_cryptos || ['BTC']).map((c:string)=> <option key={c} value={c}>{c}</option>)}
          </select>
          {tipSelected && <div className="text-center text-xl">Final Total: {finalTotal.toFixed(2)}</div>}
          <Button onClick={generate} className="w-full h-14" aria-label="generate QR" disabled={!tipSelected || !amount}>Generate QR</Button>
        </div>
      )}
      {paymentLink && paymentData && (
        <div className="flex flex-col items-center space-y-4" aria-live="polite">
          <QRCode value={`${paymentData.pay_address}?amount=${paymentData.pay_amount}`} size={256} />
          <div className="text-sm text-center">
            <div className="flex justify-between"><span>Subtotal</span><span>{baseAmount.toFixed(2)}</span></div>
            {tax && <div className="flex justify-between"><span>Tax</span><span>{taxAmount.toFixed(2)}</span></div>}
            {chargeFee && <div className="flex justify-between"><span>Gateway fee</span><span>{gatewayFee.toFixed(2)}</span></div>}
            {tipSelected && <div className="flex justify-between"><span>Tip</span><span>{tipAmount.toFixed(2)}</span></div>}
            <div className="flex justify-between font-semibold"><span>Total</span><span>{finalTotal.toFixed(2)}</span></div>
          </div>
          <div>Status: {status}</div>
          {status === 'confirmed' && (
            <div className="space-y-2 w-full max-w-sm">
              <div className="flex gap-2">
                <Input placeholder="Email" value={receipt.email} onChange={e=>setReceipt({...receipt,email:e.target.value})} aria-label="receipt email" />
                <Button onClick={()=>sendReceipt('email')}>Send</Button>
              </div>
              <div className="flex gap-2">
                <Input placeholder="Phone" value={receipt.phone} onChange={e=>setReceipt({...receipt,phone:e.target.value})} aria-label="receipt phone" />
                <Button onClick={()=>sendReceipt('sms')}>SMS</Button>
              </div>
              <Button onClick={()=>{setPaymentLink(null); setPaymentData(null); setAmount(''); setStatus(''); setTipPercent(null); setTipSelected(false);}}>New Sale</Button>
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
