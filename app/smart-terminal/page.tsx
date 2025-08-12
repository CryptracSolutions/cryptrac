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
}

const defaultTips = [10, 15, 20];

export default function SmartTerminalPage() {
  const [device, setDevice] = useState<TerminalDevice | null>(null);
  const [amount, setAmount] = useState('');
  const [tipPercent, setTipPercent] = useState<number | null>(null);
  const [tax, setTax] = useState(false);
  const [chargeFee, setChargeFee] = useState(false);
  const [crypto, setCrypto] = useState('BTC');
  interface PaymentLink { id: string; link_id: string; }
  const [paymentLink, setPaymentLink] = useState<PaymentLink | null>(null);
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

  const tipAmount = () => {
    const base = parseFloat(amount || '0');
    return tipPercent ? (base * tipPercent) / 100 : 0;
  };

  const generate = async () => {
    if (!device) return;
    const base = parseFloat(amount || '0');
    const tip = tipAmount();
    const total = base + tip;
    const body: Record<string, unknown> = {
      title: 'POS Sale',
      amount: total,
      currency: 'USD',
      accepted_cryptos: [crypto],
      max_uses: 1,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      source: 'pos',
      pos_device_id: device.id,
      metadata: { pos: { device_id: device.id, tip_amount: tip } },
      charge_customer_fee: chargeFee,
      tax_enabled: tax,
    };
    const res = await makeAuthenticatedRequest('/api/payments/create', { method: 'POST', body: JSON.stringify(body) });
    const json = await res.json();
    setPaymentLink(json.payment_link);
    setStatus('pending');
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
          <div className="grid grid-cols-3 gap-2">
            {[1,2,3,4,5,6,7,8,9,'0','.'].map((d: string | number)=> (
              <Button key={d} className="h-16" aria-label={`digit ${d}`} onClick={()=>appendDigit(String(d))}>{d}</Button>
            ))}
            <Button className="h-16" onClick={backspace} aria-label="backspace">⌫</Button>
            <Button className="h-16" onClick={clearAmount} aria-label="clear">C</Button>
          </div>
          <div className="flex gap-2 justify-center">
            {(device?.tip_presets || defaultTips).map((p:number)=>(
              <Button key={p} variant={tipPercent===p?'default':'outline'} className="h-12" onClick={()=>setTipPercent(p)} aria-label={`tip ${p}%`}>{p}%</Button>
            ))}
            <Button variant={tipPercent===null?'default':'outline'} className="h-12" onClick={()=>setTipPercent(null)} aria-label="no tip">No Tip</Button>
          </div>
          <div className="flex items-center gap-2">
            <label>
              <input type="checkbox" className="mr-2" checked={tax} onChange={e=>setTax(e.target.checked)} aria-label="Add tax" />Add tax
            </label>
            <label>
              <input type="checkbox" className="mr-2" checked={chargeFee} onChange={e=>setChargeFee(e.target.checked)} aria-label="Charge customer fee" />Charge customer fee
            </label>
          </div>
          <select value={crypto} onChange={e=>setCrypto(e.target.value)} className="border p-2 rounded w-full" aria-label="crypto">
            {(device?.accepted_cryptos || ['BTC']).map((c:string)=> <option key={c} value={c}>{c}</option>)}
          </select>
          <Button onClick={generate} className="w-full h-14" aria-label="generate QR">Generate QR</Button>
        </div>
      )}
      {paymentLink && (
        <div className="flex flex-col items-center space-y-4" aria-live="polite">
          <QRCode value={`${process.env.NEXT_PUBLIC_APP_URL}/pay/${paymentLink.link_id}`} size={256} />
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
              <Button onClick={()=>{setPaymentLink(null); setAmount(''); setStatus('');}}>New Sale</Button>
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
