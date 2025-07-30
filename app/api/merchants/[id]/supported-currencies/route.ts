import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Static currency data matching the main currencies API
const CURRENCY_DATA = [
  // Major cryptocurrencies (Top 10)
  { code: 'BTC', name: 'Bitcoin', symbol: '₿', network: 'Bitcoin', rate_usd: 45000.00, decimals: 8, enabled: true, trust_wallet_compatible: true, display_name: 'Bitcoin' },
  { code: 'ETH', name: 'Ethereum', symbol: 'Ξ', network: 'Ethereum', rate_usd: 2800.00, decimals: 18, enabled: true, trust_wallet_compatible: true, display_name: 'Ethereum' },
  { code: 'BNB', name: 'BNB', symbol: 'BNB', network: 'BSC', rate_usd: 300.00, decimals: 18, enabled: true, trust_wallet_compatible: true, display_name: 'BNB (Binance Smart Chain)' },
  { code: 'SOL', name: 'Solana', symbol: 'SOL', network: 'Solana', rate_usd: 100.00, decimals: 9, enabled: true, trust_wallet_compatible: true, display_name: 'Solana' },
  { code: 'TRX', name: 'TRON', symbol: 'TRX', network: 'TRON', rate_usd: 0.10, decimals: 6, enabled: true, trust_wallet_compatible: true, display_name: 'TRON' },
  { code: 'TON', name: 'Toncoin', symbol: 'TON', network: 'TON', rate_usd: 5.00, decimals: 9, enabled: true, trust_wallet_compatible: true, display_name: 'Toncoin' },
  { code: 'AVAX', name: 'Avalanche', symbol: 'AVAX', network: 'Avalanche', rate_usd: 35.00, decimals: 18, enabled: true, trust_wallet_compatible: true, display_name: 'Avalanche' },
  { code: 'DOGE', name: 'Dogecoin', symbol: 'DOGE', network: 'Dogecoin', rate_usd: 0.08, decimals: 8, enabled: true, trust_wallet_compatible: true, display_name: 'Dogecoin' },
  { code: 'XRP', name: 'XRP', symbol: 'XRP', network: 'XRP Ledger', rate_usd: 0.50, decimals: 6, enabled: true, trust_wallet_compatible: true, display_name: 'XRP' },
  { code: 'SUI', name: 'Sui', symbol: 'SUI', network: 'Sui', rate_usd: 2.00, decimals: 9, enabled: true, trust_wallet_compatible: true, display_name: 'Sui' },
  // Major Stablecoins
  { code: 'USDT_ERC20', name: 'Tether (Ethereum)', symbol: '₮', network: 'Ethereum', rate_usd: 1.00, decimals: 6, enabled: true, trust_wallet_compatible: true, display_name: 'Tether (ERC-20)' },
  { code: 'USDC_ERC20', name: 'USD Coin (Ethereum)', symbol: '$', network: 'Ethereum', rate_usd: 1.00, decimals: 6, enabled: true, trust_wallet_compatible: true, display_name: 'USD Coin (ERC-20)' },
  { code: 'USDT_BEP20', name: 'Tether (BSC)', symbol: '₮', network: 'BSC', rate_usd: 1.00, decimals: 18, enabled: true, trust_wallet_compatible: true, display_name: 'Tether (BEP-20)' },
  { code: 'USDC_BEP20', name: 'USD Coin (BSC)', symbol: '$', network: 'BSC', rate_usd: 1.00, decimals: 18, enabled: true, trust_wallet_compatible: true, display_name: 'USD Coin (BEP-20)' },
  { code: 'USDT_SOL', name: 'Tether (Solana)', symbol: '₮', network: 'Solana', rate_usd: 1.00, decimals: 6, enabled: true, trust_wallet_compatible: true, display_name: 'Tether (Solana)' },
  { code: 'USDC_SOL', name: 'USD Coin (Solana)', symbol: '$', network: 'Solana', rate_usd: 1.00, decimals: 6, enabled: true, trust_wallet_compatible: true, display_name: 'USD Coin (Solana)' },
  { code: 'USDT_TRC20', name: 'Tether (TRON)', symbol: '₮', network: 'TRON', rate_usd: 1.00, decimals: 6, enabled: true, trust_wallet_compatible: true, display_name: 'Tether (TRC-20)' },
  { code: 'USDC_TRC20', name: 'USD Coin (TRON)', symbol: '$', network: 'TRON', rate_usd: 1.00, decimals: 6, enabled: true, trust_wallet_compatible: true, display_name: 'USD Coin (TRC-20)' },
  { code: 'USDT_TON', name: 'Tether (TON)', symbol: '₮', network: 'TON', rate_usd: 1.00, decimals: 6, enabled: true, trust_wallet_compatible: true, display_name: 'Tether (TON)' },
  { code: 'USDT_AVAX', name: 'Tether (Avalanche)', symbol: '₮', network: 'Avalanche', rate_usd: 1.00, decimals: 6, enabled: true, trust_wallet_compatible: true, display_name: 'Tether (Avalanche)' },
  { code: 'USDC_AVAX', name: 'USD Coin (Avalanche)', symbol: '$', network: 'Avalanche', rate_usd: 1.00, decimals: 6, enabled: true, trust_wallet_compatible: true, display_name: 'USD Coin (Avalanche)' },
  // Additional popular cryptocurrencies
  { code: 'LTC', name: 'Litecoin', symbol: 'Ł', network: 'Litecoin', rate_usd: 85.00, decimals: 8, enabled: true, trust_wallet_compatible: true, display_name: 'Litecoin' },
  { code: 'ADA', name: 'Cardano', symbol: 'ADA', network: 'Cardano', rate_usd: 0.45, decimals: 6, enabled: true, trust_wallet_compatible: true, display_name: 'Cardano' },
  { code: 'DOT', name: 'Polkadot', symbol: 'DOT', network: 'Polkadot', rate_usd: 7.00, decimals: 10, enabled: true, trust_wallet_compatible: true, display_name: 'Polkadot' },
  { code: 'MATIC', name: 'Polygon', symbol: 'MATIC', network: 'Polygon', rate_usd: 0.80, decimals: 18, enabled: true, trust_wallet_compatible: true, display_name: 'Polygon' },
  { code: 'LINK', name: 'Chainlink', symbol: 'LINK', network: 'Ethereum', rate_usd: 15.00, decimals: 18, enabled: true, trust_wallet_compatible: true, display_name: 'Chainlink' },
  { code: 'UNI', name: 'Uniswap', symbol: 'UNI', network: 'Ethereum', rate_usd: 8.00, decimals: 18, enabled: true, trust_wallet_compatible: true, display_name: 'Uniswap' },
  { code: 'ATOM', name: 'Cosmos', symbol: 'ATOM', network: 'Cosmos', rate_usd: 10.00, decimals: 6, enabled: true, trust_wallet_compatible: true, display_name: 'Cosmos' },
  { code: 'FTM', name: 'Fantom', symbol: 'FTM', network: 'Fantom', rate_usd: 0.40, decimals: 18, enabled: true, trust_wallet_compatible: true, display_name: 'Fantom' },
  { code: 'NEAR', name: 'NEAR Protocol', symbol: 'NEAR', network: 'NEAR', rate_usd: 3.50, decimals: 24, enabled: true, trust_wallet_compatible: true, display_name: 'NEAR Protocol' },
  { code: 'ALGO', name: 'Algorand', symbol: 'ALGO', network: 'Algorand', rate_usd: 0.25, decimals: 6, enabled: true, trust_wallet_compatible: true, display_name: 'Algorand' },
];

// Create a lookup map for faster access
const CURRENCY_MAP = CURRENCY_DATA.reduce((map, currency) => {
  map[currency.code] = currency;
  return map;
}, {} as Record<string, any>);

// GET merchant's supported currencies by merchant ID (public endpoint for checkout)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: merchantId } = await params;

    console.log('🔍 Fetching supported currencies for merchant:', merchantId);

    // Initialize Supabase client (no auth required for public checkout)
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

    // Get merchant with wallet addresses (public data for checkout)
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id, business_name, wallets, charge_customer_fee')
      .eq('id', merchantId)
      .single();

    if (merchantError || !merchant) {
      console.error('❌ Merchant not found:', merchantError);
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    console.log('✅ Merchant found:', merchant.business_name);
    console.log('📊 Merchant wallets:', merchant.wallets);

    const merchantWallets = merchant.wallets || {};
    const walletCurrencies = Object.keys(merchantWallets).filter(
      currency => merchantWallets[currency] && merchantWallets[currency].trim()
    );

    console.log('💰 Wallet currencies found:', walletCurrencies);

    if (walletCurrencies.length === 0) {
      return NextResponse.json({
        success: true,
        currencies: [],
        message: 'No wallet addresses configured for this merchant.',
        merchant_id: merchant.id,
        charge_customer_fee: merchant.charge_customer_fee || false
      });
    }

    // Get currency information from static data instead of database
    const supportedCurrencies = walletCurrencies
      .map(currencyCode => CURRENCY_MAP[currencyCode])
      .filter(currency => currency && currency.enabled); // Only include enabled currencies

    console.log('🔍 Supported currencies found:', supportedCurrencies.length);

    // Enhance currencies with wallet information and additional metadata
    const enhancedCurrencies = supportedCurrencies.map(currency => ({
      id: `${currency.code}-${merchantId}`, // Generate a unique ID
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      network: currency.network,
      decimals: currency.decimals,
      enabled: true,
      trust_wallet_compatible: currency.trust_wallet_compatible,
      display_name: currency.display_name,
      has_wallet: true,
      wallet_address: merchantWallets[currency.code],
      rate_usd: currency.rate_usd,
      available: true,
      last_updated: new Date().toISOString(),
      min_amount: 0.000001,
      max_amount: 1000000
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

    console.log('✅ Enhanced currencies prepared:', enhancedCurrencies.length);

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
    console.error('💥 Error fetching merchant supported currencies:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch supported currencies',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

