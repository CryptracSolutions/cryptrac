import { NextResponse } from 'next/server';
import { getSupportedCurrencies } from '@/lib/currency-service';

export async function GET() {
  try {
    console.log('🔄 Debug API called - fetching all currencies...');
    
    // Get all currencies from the database (which come from NOWPayments)
    const currencies = await getSupportedCurrencies(true); // Force refresh
    
    if (!currencies || currencies.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No currencies found in database',
        count: 0,
        currencies: []
      });
    }

    // Return all currencies with their original data
    const currencyList = currencies.map(currency => ({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      network: currency.network,
      is_token: currency.is_token,
      parent_currency: currency.parent_currency,
      enabled: currency.enabled,
      min_amount: currency.min_amount,
      max_amount: currency.max_amount,
      decimals: currency.decimals,
      icon_url: currency.icon_url,
      nowpayments_code: currency.nowpayments_code,
      contract_address: currency.contract_address,
      // Add a flag to identify stablecoins (you may need to adjust this logic)
      is_stablecoin: currency.is_stablecoin || false
    }));

    console.log(`✅ Returning ${currencyList.length} currencies for review`);

    return NextResponse.json({
      success: true,
      count: currencyList.length,
      currencies: currencyList,
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in debug currencies API:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to get currencies',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
