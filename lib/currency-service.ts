// Dynamic Currency Service
// Replaces hardcoded SUPPORTED_CRYPTOS with NOWPayments API integration
// Implements caching and rate limiting for optimal performance

import { getNOWPaymentsClient } from './nowpayments-dynamic';
import { getCachedData, setCachedData, CacheKeys, CacheTTL } from './cache';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  network?: string;
  is_token?: boolean;
  parent_currency?: string;
  trust_wallet_compatible?: boolean;
  address_format?: string;
  derivation_path?: string;
  enabled: boolean;
  min_amount: number;
  max_amount?: number;
  decimals: number;
  icon_url?: string;
  nowpayments_code?: string;
  rate_usd?: number;
  contract_address?: string;
}

export interface NOWPaymentsCurrency {
  currency?: string;
  code?: string;
  name?: string;
  logo_url?: string | null;
  min_amount?: number;
  max_amount?: number | null;
}

// Create Supabase client
async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server component context
          }
        },
      },
    }
  );
}

/**
 * Get all supported currencies from database with caching
 */
export async function getSupportedCurrencies(forceRefresh = false): Promise<CurrencyInfo[]> {
  try {
    // Try cache first
    if (!forceRefresh) {
      const cached = await getCachedData<CurrencyInfo[]>(
        CacheKeys.supportedCurrencies(),
        { ttl: CacheTTL.supportedCurrencies }
      );
      if (cached) {
        return cached;
      }
    }

    // Fetch from database
    const supabase = await getSupabaseClient();
    const { data: currencies, error } = await supabase
      .from('supported_currencies')
      .select('*')
      .eq('enabled', true)
      .order('code');

    if (error) {
      console.error('Error fetching supported currencies:', error);
      return getFallbackCurrencies();
    }

    if (!currencies || currencies.length === 0) {
      console.warn('No supported currencies found in database');
      return getFallbackCurrencies();
    }

    const currencyList: CurrencyInfo[] = currencies.map(currency => ({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol || currency.code,
      network: currency.network,
      is_token: currency.is_token || false,
      parent_currency: currency.parent_currency,
      trust_wallet_compatible: currency.trust_wallet_compatible ?? true,
      address_format: currency.address_format,
      derivation_path: currency.derivation_path,
      enabled: currency.enabled,
      min_amount: currency.min_amount || 0.00000001,
      max_amount: currency.max_amount,
      decimals: currency.decimals || 8,
      icon_url: currency.icon_url,
      nowpayments_code: currency.nowpayments_code || currency.code.toLowerCase(),
      contract_address: currency.contract_address
    }));

    // Cache the result
    await setCachedData(
      CacheKeys.supportedCurrencies(),
      currencyList,
      { ttl: CacheTTL.supportedCurrencies }
    );

    return currencyList;

  } catch (error) {
    console.error('Error in getSupportedCurrencies:', error);
    return getFallbackCurrencies();
  }
}

/**
 * Get popular cryptocurrencies (top 10 most common)
 */
export async function getPopularCurrencies(): Promise<CurrencyInfo[]> {
  try {
    // Try cache first
    const cached = await getCachedData<CurrencyInfo[]>(
      CacheKeys.popularCurrencies(),
      { ttl: CacheTTL.supportedCurrencies }
    );
    if (cached) {
      return cached;
    }

    const allCurrencies = await getSupportedCurrencies();
    
    // Define popular currency order
    const popularOrder = [
      'BTC', 'ETH', 'USDT', 'USDC', 'LTC', 'SOL', 'BNB', 'MATIC', 'ADA', 'DOT'
    ];

    const popularCurrencies = popularOrder
      .map(code => allCurrencies.find(c => c.code === code))
      .filter((currency): currency is CurrencyInfo => currency !== undefined);

    // Cache the result
    await setCachedData(
      CacheKeys.popularCurrencies(),
      popularCurrencies,
      { ttl: CacheTTL.supportedCurrencies }
    );

    return popularCurrencies;

  } catch (error) {
    console.error('Error in getPopularCurrencies:', error);
    return getFallbackCurrencies().slice(0, 10);
  }
}

/**
 * Sync currencies from NOWPayments API to database
 */
export async function syncCurrenciesFromNOWPayments(): Promise<{
  success: boolean;
  message: string;
  synced_count?: number;
  error?: string;
}> {
  try {
    console.log('Starting currency sync from NOWPayments...');

    // Get NOWPayments client
    const nowPayments = getNOWPaymentsClient();

    // Fetch currencies from NOWPayments with caching
    let nowPaymentsCurrencies: (string | NOWPaymentsCurrency)[] = [];
    
    const cached = await getCachedData<(string | NOWPaymentsCurrency)[]>(
      CacheKeys.currencies(),
      { ttl: CacheTTL.currencies }
    );

    if (cached) {
      nowPaymentsCurrencies = cached;
      console.log(`Using cached NOWPayments currencies: ${nowPaymentsCurrencies.length} currencies`);
    } else {
      console.log('Fetching fresh currencies from NOWPayments API...');
      const currenciesResponse = await nowPayments.getCurrencies();
      
      // Handle different response formats
      if (currenciesResponse && typeof currenciesResponse === 'object') {
        if (Array.isArray(currenciesResponse)) {
          nowPaymentsCurrencies = currenciesResponse;
        } else {
          const response = currenciesResponse as Record<string, unknown>;
          if (response.currencies && Array.isArray(response.currencies)) {
            nowPaymentsCurrencies = response.currencies;
          } else if (typeof currenciesResponse === 'object') {
            // If it's an object with currency codes as keys
            nowPaymentsCurrencies = Object.keys(currenciesResponse).map(code => ({
              currency: code,
              name: code.toUpperCase(),
              logo_url: null,
              min_amount: 0.00000001,
              max_amount: null
            } as NOWPaymentsCurrency));
          }
        }
      }

      if (nowPaymentsCurrencies.length === 0) {
        throw new Error('No currencies received from NOWPayments API');
      }

      // Cache the NOWPayments response
      await setCachedData(
        CacheKeys.currencies(),
        nowPaymentsCurrencies,
        { ttl: CacheTTL.currencies }
      );
    }

    // Get Supabase client
    const supabase = await getSupabaseClient();

    // Process and update currencies in database
    const currencyUpdates = nowPaymentsCurrencies.map((currency: string | NOWPaymentsCurrency) => {
      let currencyCode: string;
      let currencyName: string;
      let minAmount: number;
      let maxAmount: number | null;
      let logoUrl: string | null;

      if (typeof currency === 'string') {
        currencyCode = currency;
        currencyName = currency.toUpperCase();
        minAmount = 0.00000001;
        maxAmount = null;
        logoUrl = null;
      } else {
        currencyCode = currency.currency || currency.code || '';
        currencyName = currency.name || currencyCode.toUpperCase();
        minAmount = currency.min_amount || 0.00000001;
        maxAmount = currency.max_amount || null;
        logoUrl = currency.logo_url || null;
      }

      return {
        code: currencyCode.toUpperCase(),
        name: currencyName,
        symbol: currencyCode.toUpperCase(),
        enabled: true,
        min_amount: minAmount,
        max_amount: maxAmount,
        decimals: 8,
        icon_url: logoUrl,
        nowpayments_code: currencyCode.toLowerCase(),
        updated_at: new Date().toISOString()
      };
    });

    // First, mark all currencies as potentially disabled
    await supabase
      .from('supported_currencies')
      .update({ enabled: false })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all

    // Then upsert the current currencies from NOWPayments
    const { data: upsertData, error: upsertError } = await supabase
      .from('supported_currencies')
      .upsert(currencyUpdates, { 
        onConflict: 'code',
        ignoreDuplicates: false 
      })
      .select();

    if (upsertError) {
      console.error('Error upserting currencies:', upsertError);
      throw upsertError;
    }

    const syncedCount = upsertData?.length || 0;
    console.log(`Successfully synced ${syncedCount} currencies from NOWPayments`);

    // Clear cache to force refresh
    await setCachedData(
      CacheKeys.supportedCurrencies(),
      [],
      { ttl: 0 } // Expire immediately
    );

    return {
      success: true,
      message: `Successfully synced ${syncedCount} currencies from NOWPayments`,
      synced_count: syncedCount
    };

  } catch (error) {
    console.error('Error syncing currencies from NOWPayments:', error);
    return {
      success: false,
      message: 'Failed to sync currencies from NOWPayments',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get currencies supported by a specific merchant
 */
export async function getMerchantSupportedCurrencies(merchantId: string): Promise<CurrencyInfo[]> {
  try {
    // Try cache first
    const cached = await getCachedData<CurrencyInfo[]>(
      CacheKeys.merchantCurrencies(merchantId),
      { ttl: CacheTTL.merchantSettings }
    );
    if (cached) {
      return cached;
    }

    // Use the database function
    const supabase = await getSupabaseClient();
    const { data: currencies, error } = await supabase.rpc(
      'get_merchant_supported_currencies',
      { merchant_id: merchantId }
    );

    if (error) {
      console.error('Error fetching merchant currencies:', error);
      return getPopularCurrencies(); // Fallback to popular currencies
    }

    const currencyList: CurrencyInfo[] = (currencies || []).map((currency: Record<string, unknown>) => ({
      code: currency.code as string,
      name: currency.name as string,
      symbol: (currency.symbol as string) || (currency.code as string),
      network: currency.network as string,
      is_token: (currency.is_token as boolean) || false,
      parent_currency: currency.parent_currency as string,
      trust_wallet_compatible: (currency.trust_wallet_compatible as boolean) ?? true,
      address_format: currency.address_format as string,
      enabled: true,
      min_amount: 0.00000001,
      max_amount: null,
      decimals: 8,
      has_wallet: (currency.has_wallet as boolean) || false
    }));

    // Cache the result
    await setCachedData(
      CacheKeys.merchantCurrencies(merchantId),
      currencyList,
      { ttl: CacheTTL.merchantSettings }
    );

    return currencyList;

  } catch (error) {
    console.error('Error in getMerchantSupportedCurrencies:', error);
    return getPopularCurrencies(); // Fallback
  }
}

/**
 * Validate if a currency is supported
 */
export async function isCurrencySupported(currencyCode: string): Promise<boolean> {
  try {
    const supportedCurrencies = await getSupportedCurrencies();
    return supportedCurrencies.some(currency => 
      currency.code.toLowerCase() === currencyCode.toLowerCase() && currency.enabled
    );
  } catch (error) {
    console.error('Error checking currency support:', error);
    return false;
  }
}

/**
 * Get currency information by code
 */
export async function getCurrencyInfo(currencyCode: string): Promise<CurrencyInfo | null> {
  try {
    const supportedCurrencies = await getSupportedCurrencies();
    return supportedCurrencies.find(currency => 
      currency.code.toLowerCase() === currencyCode.toLowerCase()
    ) || null;
  } catch (error) {
    console.error('Error getting currency info:', error);
    return null;
  }
}

/**
 * Fallback currencies for when database/API is unavailable
 */
function getFallbackCurrencies(): CurrencyInfo[] {
  return [
    {
      code: 'BTC',
      name: 'Bitcoin',
      symbol: '₿',
      network: 'bitcoin',
      is_token: false,
      trust_wallet_compatible: true,
      address_format: 'bitcoin',
      derivation_path: "m/44'/0'/0'/0/0",
      enabled: true,
      min_amount: 0.00000001,
      decimals: 8,
      nowpayments_code: 'btc'
    },
    {
      code: 'ETH',
      name: 'Ethereum',
      symbol: 'Ξ',
      network: 'ethereum',
      is_token: false,
      trust_wallet_compatible: true,
      address_format: 'ethereum',
      derivation_path: "m/44'/60'/0'/0/0",
      enabled: true,
      min_amount: 0.000000001,
      decimals: 18,
      nowpayments_code: 'eth'
    },
    {
      code: 'USDT',
      name: 'Tether (ERC-20)',
      symbol: '₮',
      network: 'ethereum',
      is_token: true,
      parent_currency: 'ETH',
      trust_wallet_compatible: true,
      address_format: 'ethereum',
      derivation_path: "m/44'/60'/0'/0/0",
      enabled: true,
      min_amount: 0.000001,
      decimals: 6,
      nowpayments_code: 'usdt'
    },
    {
      code: 'USDC',
      name: 'USD Coin (ERC-20)',
      symbol: '$',
      network: 'ethereum',
      is_token: true,
      parent_currency: 'ETH',
      trust_wallet_compatible: true,
      address_format: 'ethereum',
      derivation_path: "m/44'/60'/0'/0/0",
      enabled: true,
      min_amount: 0.000001,
      decimals: 6,
      nowpayments_code: 'usdc'
    },
    {
      code: 'LTC',
      name: 'Litecoin',
      symbol: 'Ł',
      network: 'litecoin',
      is_token: false,
      trust_wallet_compatible: true,
      address_format: 'litecoin',
      derivation_path: "m/44'/2'/0'/0/0",
      enabled: true,
      min_amount: 0.00000001,
      decimals: 8,
      nowpayments_code: 'ltc'
    }
  ];
}

