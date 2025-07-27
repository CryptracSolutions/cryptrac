import { NextResponse } from 'next/server';
import { getSupportedCurrencies, getPopularCurrencies } from '@/lib/currency-service';
import { getNOWPaymentsClient } from '@/lib/nowpayments';
import { getCachedData, setCachedData, CacheKeys, CacheTTL } from '@/lib/cache';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const popular = searchParams.get('popular') === 'true';
    const forceRefresh = searchParams.get('refresh') === 'true';

    // Get currencies based on request type
    const currencies = popular 
      ? await getPopularCurrencies()
      : await getSupportedCurrencies(forceRefresh);

    if (currencies.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No supported currencies available',
        currencies: [],
        fallback: true
      });
    }

    // Get USD rates for currencies (with caching)
    const currenciesWithRates = await Promise.all(
      currencies.map(async (currency) => {
        let rateUsd = 1; // Default for stablecoins
        
        // Get USD rate for non-stablecoin currencies
        if (!['USDT', 'USDC', 'USDT_TRC20', 'USDT_BEP20', 'USDT_POLYGON', 'USDC_BEP20', 'USDC_POLYGON'].includes(currency.code)) {
          try {
            // Try cache first
            const cacheKey = CacheKeys.estimate('USD', currency.code, 1);
            const cachedRate = await getCachedData<number>(cacheKey);
            
            if (cachedRate) {
              rateUsd = cachedRate;
            } else {
              // Fetch from NOWPayments
              const nowPayments = getNOWPaymentsClient();
              const estimate = await nowPayments.getEstimate({
                amount: 1,
                currency_from: 'USD',
                currency_to: currency.nowpayments_code || currency.code.toLowerCase()
              });
              
              rateUsd = 1 / estimate.estimated_amount; // Convert to USD rate
              
              // Cache the rate
              await setCachedData(cacheKey, rateUsd, { ttl: CacheTTL.estimates });
            }
          } catch (error) {
            console.error(`Failed to get rate for ${currency.code}:`, error);
            // Use fallback mock rates if API fails
            const mockRates: { [key: string]: number } = {
              'BTC': 45000.00,
              'ETH': 2800.00,
              'LTC': 85.00,
              'SOL': 100.00,
              'BNB': 300.00,
              'MATIC': 0.80,
              'ADA': 0.50,
              'DOT': 7.00,
              'TRX': 0.10,
              'AVAX': 35.00
            };
            rateUsd = mockRates[currency.code] || 1;
          }
        }

        return {
          ...currency,
          rate_usd: rateUsd,
          last_updated: new Date().toISOString(),
          available: true
        };
      })
    );

    return NextResponse.json({
      success: true,
      currencies: currenciesWithRates,
      total_count: currenciesWithRates.length,
      popular_only: popular,
      last_updated: new Date().toISOString(),
      cache_info: {
        cached: !forceRefresh,
        ttl_seconds: popular ? CacheTTL.supportedCurrencies : CacheTTL.supportedCurrencies
      }
    });

  } catch (error) {
    console.error('Currencies fetch error:', error);
    
    // Return fallback data if everything fails
    const fallbackCurrencies = [
      {
        code: 'BTC',
        name: 'Bitcoin',
        symbol: '₿',
        network: 'bitcoin',
        rate_usd: 45000.00,
        min_amount: 0.00000001,
        max_amount: 1000000,
        decimals: 8,
        enabled: true,
        trust_wallet_compatible: true,
        last_updated: new Date().toISOString(),
        available: true,
        fallback: true
      },
      {
        code: 'ETH',
        name: 'Ethereum',
        symbol: 'Ξ',
        network: 'ethereum',
        rate_usd: 2800.00,
        min_amount: 0.000000001,
        max_amount: 1000000,
        decimals: 18,
        enabled: true,
        trust_wallet_compatible: true,
        last_updated: new Date().toISOString(),
        available: true,
        fallback: true
      },
      {
        code: 'USDT',
        name: 'Tether (ERC-20)',
        symbol: '₮',
        network: 'ethereum',
        rate_usd: 1.00,
        min_amount: 0.000001,
        max_amount: 1000000,
        decimals: 6,
        enabled: true,
        trust_wallet_compatible: true,
        last_updated: new Date().toISOString(),
        available: true,
        fallback: true
      },
      {
        code: 'USDC',
        name: 'USD Coin (ERC-20)',
        symbol: '$',
        network: 'ethereum',
        rate_usd: 1.00,
        min_amount: 0.000001,
        max_amount: 1000000,
        decimals: 6,
        enabled: true,
        trust_wallet_compatible: true,
        last_updated: new Date().toISOString(),
        available: true,
        fallback: true
      },
      {
        code: 'LTC',
        name: 'Litecoin',
        symbol: 'Ł',
        network: 'litecoin',
        rate_usd: 85.00,
        min_amount: 0.00000001,
        max_amount: 1000000,
        decimals: 8,
        enabled: true,
        trust_wallet_compatible: true,
        last_updated: new Date().toISOString(),
        available: true,
        fallback: true
      }
    ];

    return NextResponse.json({
      success: true,
      currencies: fallbackCurrencies,
      total_count: fallbackCurrencies.length,
      last_updated: new Date().toISOString(),
      fallback: true,
      error: 'Using fallback data due to API error',
      error_details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

