import { NextResponse } from 'next/server';

// Static currency data to avoid slow external API calls during onboarding
const SUPPORTED_CURRENCIES = [
  // Major cryptocurrencies
  {
    code: 'BTC',
    name: 'Bitcoin',
    symbol: '₿',
    network: 'Bitcoin',
    rate_usd: 45000.00,
    min_amount: 0.00000001,
    max_amount: 1000000,
    decimals: 8,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Bitcoin'
  },
  {
    code: 'ETH',
    name: 'Ethereum',
    symbol: 'Ξ',
    network: 'Ethereum',
    rate_usd: 2800.00,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Ethereum'
  },
  {
    code: 'BNB',
    name: 'BNB',
    symbol: 'BNB',
    network: 'BSC',
    rate_usd: 300.00,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'BNB (Binance Smart Chain)'
  },
  {
    code: 'SOL',
    name: 'Solana',
    symbol: 'SOL',
    network: 'Solana',
    rate_usd: 100.00,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 9,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Solana'
  },
  {
    code: 'TRX',
    name: 'TRON',
    symbol: 'TRX',
    network: 'TRON',
    rate_usd: 0.10,
    min_amount: 0.000001,
    max_amount: 1000000,
    decimals: 6,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'TRON'
  },
  {
    code: 'TON',
    name: 'Toncoin',
    symbol: 'TON',
    network: 'TON',
    rate_usd: 5.00,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 9,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Toncoin'
  },
  {
    code: 'AVAX',
    name: 'Avalanche',
    symbol: 'AVAX',
    network: 'Avalanche',
    rate_usd: 35.00,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Avalanche'
  },
  {
    code: 'DOGE',
    name: 'Dogecoin',
    symbol: 'DOGE',
    network: 'Dogecoin',
    rate_usd: 0.08,
    min_amount: 0.00000001,
    max_amount: 1000000,
    decimals: 8,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Dogecoin'
  },
  {
    code: 'XRP',
    name: 'XRP',
    symbol: 'XRP',
    network: 'XRP Ledger',
    rate_usd: 0.50,
    min_amount: 0.000001,
    max_amount: 1000000,
    decimals: 6,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'XRP'
  },
  {
    code: 'SUI',
    name: 'Sui',
    symbol: 'SUI',
    network: 'Sui',
    rate_usd: 2.00,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 9,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Sui'
  },
  // Stablecoins
  {
    code: 'USDT_ERC20',
    name: 'Tether (Ethereum)',
    symbol: '₮',
    network: 'Ethereum',
    rate_usd: 1.00,
    min_amount: 0.000001,
    max_amount: 1000000,
    decimals: 6,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Tether (ERC-20)'
  },
  {
    code: 'USDC_ERC20',
    name: 'USD Coin (Ethereum)',
    symbol: '$',
    network: 'Ethereum',
    rate_usd: 1.00,
    min_amount: 0.000001,
    max_amount: 1000000,
    decimals: 6,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'USD Coin (ERC-20)'
  },
  {
    code: 'USDT_BEP20',
    name: 'Tether (BSC)',
    symbol: '₮',
    network: 'BSC',
    rate_usd: 1.00,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Tether (BEP-20)'
  },
  {
    code: 'USDC_BEP20',
    name: 'USD Coin (BSC)',
    symbol: '$',
    network: 'BSC',
    rate_usd: 1.00,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'USD Coin (BEP-20)'
  },
  {
    code: 'USDT_SOL',
    name: 'Tether (Solana)',
    symbol: '₮',
    network: 'Solana',
    rate_usd: 1.00,
    min_amount: 0.000001,
    max_amount: 1000000,
    decimals: 6,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Tether (Solana)'
  },
  {
    code: 'USDC_SOL',
    name: 'USD Coin (Solana)',
    symbol: '$',
    network: 'Solana',
    rate_usd: 1.00,
    min_amount: 0.000001,
    max_amount: 1000000,
    decimals: 6,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'USD Coin (Solana)'
  },
  {
    code: 'USDT_TRC20',
    name: 'Tether (TRON)',
    symbol: '₮',
    network: 'TRON',
    rate_usd: 1.00,
    min_amount: 0.000001,
    max_amount: 1000000,
    decimals: 6,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Tether (TRC-20)'
  },
  {
    code: 'USDC_TRC20',
    name: 'USD Coin (TRON)',
    symbol: '$',
    network: 'TRON',
    rate_usd: 1.00,
    min_amount: 0.000001,
    max_amount: 1000000,
    decimals: 6,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'USD Coin (TRC-20)'
  },
  {
    code: 'USDT_TON',
    name: 'Tether (TON)',
    symbol: '₮',
    network: 'TON',
    rate_usd: 1.00,
    min_amount: 0.000001,
    max_amount: 1000000,
    decimals: 6,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Tether (TON)'
  },
  {
    code: 'USDT_AVAX',
    name: 'Tether (Avalanche)',
    symbol: '₮',
    network: 'Avalanche',
    rate_usd: 1.00,
    min_amount: 0.000001,
    max_amount: 1000000,
    decimals: 6,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Tether (Avalanche)'
  },
  {
    code: 'USDC_AVAX',
    name: 'USD Coin (Avalanche)',
    symbol: '$',
    network: 'Avalanche',
    rate_usd: 1.00,
    min_amount: 0.000001,
    max_amount: 1000000,
    decimals: 6,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'USD Coin (Avalanche)'
  },
  // Additional popular cryptocurrencies
  {
    code: 'LTC',
    name: 'Litecoin',
    symbol: 'Ł',
    network: 'Litecoin',
    rate_usd: 85.00,
    min_amount: 0.00000001,
    max_amount: 1000000,
    decimals: 8,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Litecoin'
  },
  {
    code: 'ADA',
    name: 'Cardano',
    symbol: 'ADA',
    network: 'Cardano',
    rate_usd: 0.45,
    min_amount: 0.000001,
    max_amount: 1000000,
    decimals: 6,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Cardano'
  },
  {
    code: 'DOT',
    name: 'Polkadot',
    symbol: 'DOT',
    network: 'Polkadot',
    rate_usd: 7.00,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 10,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Polkadot'
  },
  {
    code: 'MATIC',
    name: 'Polygon',
    symbol: 'MATIC',
    network: 'Polygon',
    rate_usd: 0.80,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Polygon'
  },
  {
    code: 'LINK',
    name: 'Chainlink',
    symbol: 'LINK',
    network: 'Ethereum',
    rate_usd: 15.00,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Chainlink'
  },
  {
    code: 'UNI',
    name: 'Uniswap',
    symbol: 'UNI',
    network: 'Ethereum',
    rate_usd: 8.00,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Uniswap'
  },
  {
    code: 'ATOM',
    name: 'Cosmos',
    symbol: 'ATOM',
    network: 'Cosmos',
    rate_usd: 10.00,
    min_amount: 0.000001,
    max_amount: 1000000,
    decimals: 6,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Cosmos'
  },
  {
    code: 'FTM',
    name: 'Fantom',
    symbol: 'FTM',
    network: 'Fantom',
    rate_usd: 0.40,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Fantom'
  },
  {
    code: 'NEAR',
    name: 'NEAR Protocol',
    symbol: 'NEAR',
    network: 'NEAR',
    rate_usd: 3.50,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 24,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'NEAR Protocol'
  },
  {
    code: 'ALGO',
    name: 'Algorand',
    symbol: 'ALGO',
    network: 'Algorand',
    rate_usd: 0.25,
    min_amount: 0.000001,
    max_amount: 1000000,
    decimals: 6,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Algorand'
  }
];

// Top 10 + stablecoins that are shown in the main section
const TOP_CURRENCIES = [
  'BTC', 'ETH', 'BNB', 'SOL', 'TRX', 'TON', 'AVAX', 'DOGE', 'XRP', 'SUI',
  'USDT_ERC20', 'USDC_ERC20', 'USDT_BEP20', 'USDC_BEP20', 'USDT_SOL', 
  'USDC_SOL', 'USDT_TRC20', 'USDC_TRC20', 'USDT_TON', 'USDT_AVAX', 'USDC_AVAX'
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const popular = searchParams.get('popular') === 'true';

    console.log('📡 Currencies API called, popular:', popular);

    let currencies;

    if (popular) {
      // Return only top currencies
      currencies = SUPPORTED_CURRENCIES.filter(currency => 
        TOP_CURRENCIES.includes(currency.code)
      );
    } else {
      // Return all currencies except the top ones (for additional currencies section)
      currencies = SUPPORTED_CURRENCIES.filter(currency => 
        !TOP_CURRENCIES.includes(currency.code)
      );
    }

    // Add timestamp and availability info
    const currenciesWithMeta = currencies.map(currency => ({
      ...currency,
      last_updated: new Date().toISOString(),
      available: true
    }));

    console.log(`✅ Returning ${currenciesWithMeta.length} currencies (popular: ${popular})`);

    return NextResponse.json({
      success: true,
      currencies: currenciesWithMeta,
      total_count: currenciesWithMeta.length,
      popular_only: popular,
      last_updated: new Date().toISOString(),
      cache_info: {
        cached: true,
        static_data: true,
        ttl_seconds: 3600
      }
    });

  } catch (error) {
    console.error('💥 Currencies API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch currencies',
      currencies: [],
      error_details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

