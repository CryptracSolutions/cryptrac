import { NextResponse } from 'next/server';
import { getNOWPaymentsClient } from '@/lib/nowpayments';

export async function GET() {
  try {
    // Get NOWPayments client
    const nowPayments = getNOWPaymentsClient();

    // Fetch supported payout currencies from NOWPayments
    const payoutCurrencies = await nowPayments.getPayoutCurrencies();

    // Filter and format currencies for the frontend
    const formattedCurrencies = payoutCurrencies
      .filter(currency => currency.currency && currency.name)
      .map(currency => ({
        code: currency.currency.toLowerCase(),
        name: currency.name,
        symbol: currency.currency.toUpperCase(),
        min_amount: currency.min_amount || 0,
        max_amount: currency.max_amount || null,
        logo_url: currency.logo_url || null
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
      success: true,
      currencies: formattedCurrencies,
      count: formattedCurrencies.length
    });

  } catch (error) {
    console.error('Error fetching payout currencies:', error);
    
    // Fallback to common payout currencies if API fails
    const fallbackCurrencies = [
      { code: 'btc', name: 'Bitcoin', symbol: 'BTC', min_amount: 0.0001, max_amount: null, logo_url: null },
      { code: 'eth', name: 'Ethereum', symbol: 'ETH', min_amount: 0.001, max_amount: null, logo_url: null },
      { code: 'ltc', name: 'Litecoin', symbol: 'LTC', min_amount: 0.01, max_amount: null, logo_url: null },
      { code: 'usdt', name: 'Tether USD', symbol: 'USDT', min_amount: 1, max_amount: null, logo_url: null },
      { code: 'usdc', name: 'USD Coin', symbol: 'USDC', min_amount: 1, max_amount: null, logo_url: null },
      { code: 'usdttrc20', name: 'Tether USD (TRC20)', symbol: 'USDT', min_amount: 1, max_amount: null, logo_url: null },
      { code: 'usdcerc20', name: 'USD Coin (ERC20)', symbol: 'USDC', min_amount: 1, max_amount: null, logo_url: null }
    ];

    return NextResponse.json({
      success: true,
      currencies: fallbackCurrencies,
      count: fallbackCurrencies.length,
      fallback: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

