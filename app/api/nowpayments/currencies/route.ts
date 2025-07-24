import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getNOWPaymentsClient } from '@/lib/nowpayments';

interface NOWPaymentsCurrency {
  currency?: string;
  code?: string;
  name?: string;
  logo_url?: string | null;
  min_amount?: number;
  max_amount?: number | null;
}

interface NOWPaymentsCurrenciesResponse {
  currencies?: NOWPaymentsCurrency[] | string[];
  [key: string]: unknown;
}

export async function GET() {
  try {
    // Initialize Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
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

    // Get NOWPayments client
    const nowPayments = getNOWPaymentsClient();

    // Fetch currencies from NOWPayments
    console.log('Fetching currencies from NOWPayments...');
    const currenciesResponse = await nowPayments.getCurrencies();
    
    console.log('NOWPayments response:', currenciesResponse);

    // Handle different response formats
    let currencies: (string | NOWPaymentsCurrency)[] = [];
    
    if (currenciesResponse && typeof currenciesResponse === 'object') {
      if (Array.isArray(currenciesResponse)) {
        currencies = currenciesResponse;
      } else {
        const response = currenciesResponse as NOWPaymentsCurrenciesResponse;
        if (response.currencies && Array.isArray(response.currencies)) {
          currencies = response.currencies;
        } else if (typeof currenciesResponse === 'object') {
          // If it's an object with currency codes as keys
          currencies = Object.keys(currenciesResponse).map(code => ({
            currency: code,
            name: code.toUpperCase(),
            logo_url: null,
            min_amount: 0.00000001,
            max_amount: null
          } as NOWPaymentsCurrency));
        }
      }
    }
    
    console.log(`Processed ${currencies.length} currencies from NOWPayments`);

    if (currencies.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No currencies received from NOWPayments',
        raw_response: currenciesResponse
      });
    }

    // Map NOWPayments currencies to our database format
    const currencyData = currencies.map((currency: string | NOWPaymentsCurrency) => {
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

    // Update supported_currencies table
    console.log('Updating supported_currencies table...');
    
    // First, disable all currencies
    await supabase
      .from('supported_currencies')
      .update({ enabled: false })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all

    // Then upsert the current currencies
    const { data: upsertData, error: upsertError } = await supabase
      .from('supported_currencies')
      .upsert(currencyData, { 
        onConflict: 'code',
        ignoreDuplicates: false 
      })
      .select();

    if (upsertError) {
      console.error('Error upserting currencies:', upsertError);
      throw upsertError;
    }

    console.log(`Successfully updated ${upsertData?.length || 0} currencies`);

    // Get popular cryptocurrencies for response
    const popularCryptos = ['BTC', 'ETH', 'LTC', 'USDT', 'USDC', 'ADA', 'DOT', 'MATIC', 'SOL', 'AVAX'];
    const popularCurrencies = currencyData.filter((c: { code: string }) => 
      popularCryptos.includes(c.code)
    );

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${currencies.length} currencies`,
      total_currencies: currencies.length,
      popular_currencies: popularCurrencies,
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error syncing currencies:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to sync currencies',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// POST endpoint to manually trigger currency sync
export async function POST() {
  try {
    // This is the same as GET but can be called manually
    return await GET();
  } catch (error) {
    console.error('Error in manual currency sync:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to manually sync currencies',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

