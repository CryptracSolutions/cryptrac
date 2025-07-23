import { NextResponse } from 'next/server';
import { getNOWPaymentsClient } from '@/lib/nowpayments';

// Supported cryptocurrencies as per Cryptrac Bible
const SUPPORTED_CURRENCIES = ['BTC', 'ETH', 'LTC', 'USDT', 'USDC'];

const CURRENCY_DETAILS = {
  'BTC': {
    name: 'Bitcoin',
    symbol: '₿',
    decimals: 8,
    network: 'bitcoin'
  },
  'ETH': {
    name: 'Ethereum',
    symbol: 'Ξ',
    decimals: 18,
    network: 'ethereum'
  },
  'LTC': {
    name: 'Litecoin',
    symbol: 'Ł',
    decimals: 8,
    network: 'litecoin'
  },
  'USDT': {
    name: 'Tether',
    symbol: '₮',
    decimals: 6,
    network: 'ethereum'
  },
  'USDC': {
    name: 'USD Coin',
    symbol: '$',
    decimals: 6,
    network: 'ethereum'
  }
};

export async function GET() {
  try {
    const nowPayments = getNOWPaymentsClient();
    
    // Get available currencies from NOWPayments
    const availableCurrencies = await nowPayments.getCurrencies();
    
    // Filter to only supported currencies
    const supportedCurrencies = availableCurrencies.filter(currency => 
      SUPPORTED_CURRENCIES.includes(currency.currency.toUpperCase())
    );

    // Enhance with our currency details and USD rates
    const currenciesWithRates = await Promise.all(
      supportedCurrencies.map(async (currency) => {
        const currencyCode = currency.currency.toUpperCase();
        const details = CURRENCY_DETAILS[currencyCode as keyof typeof CURRENCY_DETAILS];
        
        let rateUsd = 1; // Default for stablecoins
        
        // Get USD rate for non-stablecoin currencies
        if (!['USDT', 'USDC'].includes(currencyCode)) {
          try {
            const estimate = await nowPayments.getEstimate({
              amount: 1,
              currency_from: 'USD',
              currency_to: currencyCode
            });
            rateUsd = 1 / estimate.estimated_amount; // Convert to USD rate
          } catch (error) {
            console.error(`Failed to get rate for ${currencyCode}:`, error);
            // Use fallback mock rates if API fails
            const mockRates: { [key: string]: number } = {
              'BTC': 45000.00,
              'ETH': 2800.00,
              'LTC': 85.00,
            };
            rateUsd = mockRates[currencyCode] || 1;
          }
        }

        return {
          code: currencyCode,
          ...details,
          rate_usd: rateUsd,
          min_amount: currency.min_amount,
          max_amount: currency.max_amount,
          logo_url: currency.logo_url,
          last_updated: new Date().toISOString(),
          available: true
        };
      })
    );

    return NextResponse.json({
      success: true,
      currencies: currenciesWithRates,
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Currencies fetch error:', error);
    
    // Fallback to mock data if NOWPayments API fails
    const fallbackCurrencies = SUPPORTED_CURRENCIES.map(code => {
      const details = CURRENCY_DETAILS[code as keyof typeof CURRENCY_DETAILS];
      const mockRates: { [key: string]: number } = {
        'BTC': 45000.00,
        'ETH': 2800.00,
        'LTC': 85.00,
        'USDT': 1.00,
        'USDC': 1.00
      };
      
      return {
        code,
        ...details,
        rate_usd: mockRates[code] || 1.00,
        min_amount: 0.0001,
        max_amount: 1000000,
        logo_url: '',
        last_updated: new Date().toISOString(),
        available: true
      };
    });

    return NextResponse.json({
      success: true,
      currencies: fallbackCurrencies,
      last_updated: new Date().toISOString(),
      fallback: true,
      error: 'Using fallback data due to API error'
    });
  }
}

