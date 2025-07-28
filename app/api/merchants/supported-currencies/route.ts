import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// GET merchant's supported currencies (only those with wallet addresses)
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

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get merchant with wallet addresses
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id, business_name, wallets, charge_customer_fee')
      .eq('user_id', user.id)
      .single();

    if (merchantError || !merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    const merchantWallets = merchant.wallets || {};
    const walletCurrencies = Object.keys(merchantWallets).filter(
      currency => merchantWallets[currency] && merchantWallets[currency].trim()
    );

    if (walletCurrencies.length === 0) {
      return NextResponse.json({
        success: true,
        currencies: [],
        message: 'No wallet addresses configured. Please add wallet addresses in your settings.',
        merchant_id: merchant.id,
        charge_customer_fee: merchant.charge_customer_fee || false
      });
    }

    // Get full currency information for currencies with wallet addresses
    const { data: supportedCurrencies, error: currenciesError } = await supabase
      .from('supported_currencies')
      .select('*')
      .in('code', walletCurrencies)
      .eq('enabled', true);

    if (currenciesError) {
      console.error('Error fetching supported currencies:', currenciesError);
      return NextResponse.json(
        { error: 'Failed to fetch currency information' },
        { status: 500 }
      );
    }

    // Enhance currencies with wallet information and rates
    const enhancedCurrencies = supportedCurrencies.map(currency => ({
      ...currency,
      has_wallet: true,
      wallet_address: merchantWallets[currency.code],
      rate_usd: getMockRate(currency.code), // You can replace this with real rate fetching
      available: true,
      last_updated: new Date().toISOString()
    }));

    // Sort currencies by priority (BTC, ETH, stablecoins first)
    const priorityOrder = ['BTC', 'ETH', 'USDT_ERC20', 'USDC_ERC20', 'USDT_TRC20', 'USDC_SOL'];
    enhancedCurrencies.sort((a, b) => {
      const aIndex = priorityOrder.indexOf(a.code);
      const bIndex = priorityOrder.indexOf(b.code);
      
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      } else if (aIndex !== -1) {
        return -1;
      } else if (bIndex !== -1) {
        return 1;
      } else {
        return a.name.localeCompare(b.name);
      }
    });

    return NextResponse.json({
      success: true,
      currencies: enhancedCurrencies,
      total_count: enhancedCurrencies.length,
      merchant_id: merchant.id,
      charge_customer_fee: merchant.charge_customer_fee || false,
      wallet_currencies: walletCurrencies,
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching merchant supported currencies:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch supported currencies',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Mock rate function - replace with real rate fetching if needed
function getMockRate(currencyCode: string): number {
  const mockRates: { [key: string]: number } = {
    'BTC': 45000.00,
    'ETH': 2800.00,
    'BNB': 300.00,
    'SOL': 100.00,
    'TRX': 0.10,
    'TON': 2.50,
    'DOGE': 0.08,
    'XRP': 0.60,
    'SUI': 1.20,
    'AVAX': 35.00,
    'USDT_ERC20': 1.00,
    'USDC_ERC20': 1.00,
    'USDT_TRC20': 1.00,
    'USDC_SOL': 1.00,
    'LTC': 85.00,
    'MATIC': 0.80,
    'ADA': 0.50,
    'DOT': 7.00
  };
  
  return mockRates[currencyCode] || 1.00;
}

