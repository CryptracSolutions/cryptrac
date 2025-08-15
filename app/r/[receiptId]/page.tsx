import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';
import React from 'react';

function PrintButton() {
  'use client';
  return (
    <button
      onClick={() => window.print()}
      className="mt-6 px-4 py-2 bg-blue-600 text-white rounded"
    >
      Print / Save PDF
    </button>
  );
}

function ReceiptNotAvailable() {
  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-semibold">Receipt not available</h1>
      <p className="mt-2 text-gray-600">This receipt could not be found.</p>
    </div>
  );
}

const explorers: Record<string, string> = {
  BTC: 'https://www.blockchain.com/btc/tx/',
  ETH: 'https://etherscan.io/tx/',
  TRX: 'https://tronscan.org/#/transaction/',
  LTC: 'https://blockchair.com/litecoin/transaction/',
  XLM: 'https://stellar.expert/explorer/public/tx/',
  XRP: 'https://livenet.xrpl.org/transactions/'
};

export default async function ReceiptPage({ params }: { params: Promise<{ receiptId: string }> }) {
  const { receiptId } = await params;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: tx } = await supabase
    .from('transactions')
    .select(`
      public_receipt_id,
      merchant_id,
      created_at,
      currency,
      settlement_currency,
      asset,
      network,
      tax_label,
      tax_amount,
      subtotal_with_tax,
      gateway_fee_amount,
      conversion_fee_amount,
      network_fee_amount,
      total_paid,
      tx_hash,
      nowpayments_payment_id,
      payment_links(title),
      merchants(business_name, logo_url)
    `)
    .eq('public_receipt_id', receiptId)
    .single();

  if (!tx) {
    return <ReceiptNotAvailable />;
  }

  const { data: settings } = await supabase
    .from('merchant_settings')
    .select('public_receipts_enabled')
    .eq('merchant_id', tx.merchant_id)
    .single();

  if (settings?.public_receipts_enabled === false) {
    return <ReceiptNotAvailable />;
  }

  const format = (amount: number | null | undefined, currency: string) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(amount || 0));

  const baseAmount = Number(tx.subtotal_with_tax || 0) - Number(tx.tax_amount || 0);
  const explorerBase = tx.network ? explorers[tx.network.toUpperCase()] : undefined;
  const txLink = explorerBase && tx.tx_hash ? `${explorerBase}${tx.tx_hash}` : null;

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-4 print:bg-white">
      <div className="text-center space-y-2">
        {tx.merchants?.logo_url && (
          <div className="flex justify-center">
            <Image src={tx.merchants.logo_url} alt={tx.merchants.business_name || 'Merchant'} width={80} height={80} />
          </div>
        )}
        <h1 className="text-2xl font-bold">{tx.merchants?.business_name}</h1>
        {tx.payment_links?.title && <p className="text-gray-600">{tx.payment_links.title}</p>}
      </div>

      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between"><span>Amount</span><span>{format(baseAmount, tx.currency)}</span></div>
        {Number(tx.tax_amount || 0) > 0 && (
          <div className="flex justify-between"><span>{tx.tax_label || 'Tax'}</span><span>{format(tx.tax_amount, tx.currency)}</span></div>
        )}
        <div className="flex justify-between font-medium"><span>Subtotal</span><span>{format(tx.subtotal_with_tax, tx.currency)}</span></div>
        {Number(tx.gateway_fee_amount || 0) > 0 && (
          <div className="flex justify-between"><span>Gateway fee</span><span>{format(tx.gateway_fee_amount, tx.currency)}</span></div>
        )}
        {Number(tx.conversion_fee_amount || 0) > 0 && (
          <div className="flex justify-between"><span>Conversion fee</span><span>{format(tx.conversion_fee_amount, tx.currency)}</span></div>
        )}
        {Number(tx.network_fee_amount || 0) > 0 && (
          <div className="flex justify-between"><span>Network fee</span><span>{format(tx.network_fee_amount, tx.currency)}</span></div>
        )}
        <div className="flex justify-between font-bold border-t pt-2"><span>Total paid</span><span>{format(tx.total_paid, tx.currency)}</span></div>
      </div>

      <div className="text-sm space-y-1">
        <div>Paid at: {new Date(tx.created_at).toLocaleString()}</div>
        {tx.nowpayments_payment_id && <div>Payment ID: {tx.nowpayments_payment_id}</div>}
        {tx.asset && tx.network && (
          <div>Method: {tx.asset} on {tx.network}</div>
        )}
        {tx.tx_hash && (
          <div>
            Tx Hash:{' '}
            {txLink ? (
              <a href={txLink} className="text-blue-600" target="_blank" rel="noopener noreferrer">
                {tx.tx_hash}
              </a>
            ) : (
              tx.tx_hash
            )}
          </div>
        )}
      </div>

      <PrintButton />
    </div>
  );
}

