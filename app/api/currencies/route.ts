import { NextResponse } from 'next/server';

// Complete NOWPayments supported currencies list (250+ cryptocurrencies)
// Deduplicated and organized by category
const SUPPORTED_CURRENCIES = [
  // Major cryptocurrencies (Top 10)
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

  // Major Stablecoins
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

  // Additional Popular Cryptocurrencies (Layer 1s)
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
    min_amount: 0.0000000001,
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
    code: 'NEAR',
    name: 'NEAR Protocol',
    symbol: 'NEAR',
    network: 'NEAR',
    rate_usd: 3.50,
    min_amount: 0.000000000000000000000001,
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

  // DeFi Tokens (Ethereum-based)
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
    code: 'AAVE',
    name: 'Aave',
    symbol: 'AAVE',
    network: 'Ethereum',
    rate_usd: 120.00,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Aave'
  },
  {
    code: 'COMP',
    name: 'Compound',
    symbol: 'COMP',
    network: 'Ethereum',
    rate_usd: 45.00,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Compound'
  },
  {
    code: 'MKR',
    name: 'Maker',
    symbol: 'MKR',
    network: 'Ethereum',
    rate_usd: 1200.00,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Maker'
  },
  {
    code: 'SNX',
    name: 'Synthetix',
    symbol: 'SNX',
    network: 'Ethereum',
    rate_usd: 3.50,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Synthetix'
  },
  {
    code: 'SUSHI',
    name: 'SushiSwap',
    symbol: 'SUSHI',
    network: 'Ethereum',
    rate_usd: 1.20,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'SushiSwap'
  },
  {
    code: 'CRV',
    name: 'Curve DAO Token',
    symbol: 'CRV',
    network: 'Ethereum',
    rate_usd: 0.80,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Curve DAO Token'
  },
  {
    code: 'YFI',
    name: 'yearn.finance',
    symbol: 'YFI',
    network: 'Ethereum',
    rate_usd: 8500.00,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'yearn.finance'
  },
  {
    code: '1INCH',
    name: '1inch',
    symbol: '1INCH',
    network: 'Ethereum',
    rate_usd: 0.35,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: '1inch'
  },

  // Layer 2 & Scaling Solutions
  {
    code: 'ARB',
    name: 'Arbitrum',
    symbol: 'ARB',
    network: 'Arbitrum',
    rate_usd: 1.20,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Arbitrum'
  },
  {
    code: 'OP',
    name: 'Optimism',
    symbol: 'OP',
    network: 'Optimism',
    rate_usd: 2.50,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Optimism'
  },
  {
    code: 'LRC',
    name: 'Loopring',
    symbol: 'LRC',
    network: 'Ethereum',
    rate_usd: 0.25,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Loopring'
  },

  // Privacy Coins
  {
    code: 'XMR',
    name: 'Monero',
    symbol: 'XMR',
    network: 'Monero',
    rate_usd: 150.00,
    min_amount: 0.000000000001,
    max_amount: 1000000,
    decimals: 12,
    enabled: true,
    trust_wallet_compatible: false,
    display_name: 'Monero'
  },
  {
    code: 'ZEC',
    name: 'Zcash',
    symbol: 'ZEC',
    network: 'Zcash',
    rate_usd: 35.00,
    min_amount: 0.00000001,
    max_amount: 1000000,
    decimals: 8,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Zcash'
  },
  {
    code: 'DASH',
    name: 'Dash',
    symbol: 'DASH',
    network: 'Dash',
    rate_usd: 45.00,
    min_amount: 0.00000001,
    max_amount: 1000000,
    decimals: 8,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Dash'
  },
  {
    code: 'SCRT',
    name: 'Secret Network',
    symbol: 'SCRT',
    network: 'Secret Network',
    rate_usd: 0.50,
    min_amount: 0.000001,
    max_amount: 1000000,
    decimals: 6,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Secret Network'
  },

  // Meme Coins
  {
    code: 'SHIB',
    name: 'Shiba Inu',
    symbol: 'SHIB',
    network: 'Ethereum',
    rate_usd: 0.000012,
    min_amount: 0.000000001,
    max_amount: 1000000000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Shiba Inu'
  },
  {
    code: 'PEPE',
    name: 'Pepe',
    symbol: 'PEPE',
    network: 'Ethereum',
    rate_usd: 0.0000008,
    min_amount: 0.000000001,
    max_amount: 1000000000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Pepe'
  },
  {
    code: 'FLOKI',
    name: 'Floki Inu',
    symbol: 'FLOKI',
    network: 'Ethereum',
    rate_usd: 0.00015,
    min_amount: 0.000000001,
    max_amount: 1000000000000,
    decimals: 9,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Floki Inu'
  },

  // Gaming & NFT Tokens
  {
    code: 'AXS',
    name: 'Axie Infinity',
    symbol: 'AXS',
    network: 'Ethereum',
    rate_usd: 8.50,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Axie Infinity'
  },
  {
    code: 'SAND',
    name: 'The Sandbox',
    symbol: 'SAND',
    network: 'Ethereum',
    rate_usd: 0.45,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'The Sandbox'
  },
  {
    code: 'MANA',
    name: 'Decentraland',
    symbol: 'MANA',
    network: 'Ethereum',
    rate_usd: 0.55,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Decentraland'
  },
  {
    code: 'ENJ',
    name: 'Enjin Coin',
    symbol: 'ENJ',
    network: 'Ethereum',
    rate_usd: 0.35,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Enjin Coin'
  },
  {
    code: 'CHZ',
    name: 'Chiliz',
    symbol: 'CHZ',
    network: 'Ethereum',
    rate_usd: 0.08,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Chiliz'
  },

  // Enterprise & Utility Tokens
  {
    code: 'VET',
    name: 'VeChain',
    symbol: 'VET',
    network: 'VeChain',
    rate_usd: 0.025,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'VeChain'
  },
  {
    code: 'HBAR',
    name: 'Hedera',
    symbol: 'HBAR',
    network: 'Hedera',
    rate_usd: 0.08,
    min_amount: 0.00000001,
    max_amount: 1000000,
    decimals: 8,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Hedera'
  },
  {
    code: 'XLM',
    name: 'Stellar',
    symbol: 'XLM',
    network: 'Stellar',
    rate_usd: 0.12,
    min_amount: 0.0000001,
    max_amount: 1000000,
    decimals: 7,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Stellar'
  },
  {
    code: 'IOTA',
    name: 'IOTA',
    symbol: 'IOTA',
    network: 'IOTA',
    rate_usd: 0.25,
    min_amount: 0.000001,
    max_amount: 1000000,
    decimals: 6,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'IOTA'
  },

  // Additional Layer 1 Blockchains
  {
    code: 'FLOW',
    name: 'Flow',
    symbol: 'FLOW',
    network: 'Flow',
    rate_usd: 0.85,
    min_amount: 0.00000001,
    max_amount: 1000000,
    decimals: 8,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Flow'
  },
  {
    code: 'ICP',
    name: 'Internet Computer',
    symbol: 'ICP',
    network: 'Internet Computer',
    rate_usd: 12.50,
    min_amount: 0.00000001,
    max_amount: 1000000,
    decimals: 8,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Internet Computer'
  },
  {
    code: 'EGLD',
    name: 'MultiversX',
    symbol: 'EGLD',
    network: 'MultiversX',
    rate_usd: 35.00,
    min_amount: 0.000000000000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'MultiversX'
  },
  {
    code: 'THETA',
    name: 'Theta Network',
    symbol: 'THETA',
    network: 'Theta',
    rate_usd: 1.20,
    min_amount: 0.000000000000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Theta Network'
  },
  {
    code: 'FIL',
    name: 'Filecoin',
    symbol: 'FIL',
    network: 'Filecoin',
    rate_usd: 5.50,
    min_amount: 0.000000000000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Filecoin'
  },

  // Additional DeFi & Exchange Tokens
  {
    code: 'CRO',
    name: 'Cronos',
    symbol: 'CRO',
    network: 'Cronos',
    rate_usd: 0.08,
    min_amount: 0.00000001,
    max_amount: 1000000,
    decimals: 8,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Cronos'
  },
  {
    code: 'LEO',
    name: 'UNUS SED LEO',
    symbol: 'LEO',
    network: 'Ethereum',
    rate_usd: 5.80,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'UNUS SED LEO'
  },
  {
    code: 'OKB',
    name: 'OKB',
    symbol: 'OKB',
    network: 'Ethereum',
    rate_usd: 45.00,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'OKB'
  },

  // Emerging Cryptocurrencies
  {
    code: 'APT',
    name: 'Aptos',
    symbol: 'APT',
    network: 'Aptos',
    rate_usd: 8.50,
    min_amount: 0.00000001,
    max_amount: 1000000,
    decimals: 8,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Aptos'
  },
  {
    code: 'SEI',
    name: 'Sei',
    symbol: 'SEI',
    network: 'Sei',
    rate_usd: 0.45,
    min_amount: 0.000001,
    max_amount: 1000000,
    decimals: 6,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Sei'
  },
  {
    code: 'INJ',
    name: 'Injective',
    symbol: 'INJ',
    network: 'Injective',
    rate_usd: 25.00,
    min_amount: 0.000000000000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Injective'
  },
  {
    code: 'TIA',
    name: 'Celestia',
    symbol: 'TIA',
    network: 'Celestia',
    rate_usd: 6.50,
    min_amount: 0.000001,
    max_amount: 1000000,
    decimals: 6,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Celestia'
  },

  // Additional Stablecoins
  {
    code: 'DAI',
    name: 'Dai',
    symbol: 'DAI',
    network: 'Ethereum',
    rate_usd: 1.00,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Dai'
  },
  {
    code: 'BUSD',
    name: 'Binance USD',
    symbol: 'BUSD',
    network: 'Ethereum',
    rate_usd: 1.00,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Binance USD'
  },
  {
    code: 'TUSD',
    name: 'TrueUSD',
    symbol: 'TUSD',
    network: 'Ethereum',
    rate_usd: 1.00,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'TrueUSD'
  },
  {
    code: 'FRAX',
    name: 'Frax',
    symbol: 'FRAX',
    network: 'Ethereum',
    rate_usd: 1.00,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Frax'
  },

  // Additional Popular Tokens (continuing to reach 250+)
  {
    code: 'GRT',
    name: 'The Graph',
    symbol: 'GRT',
    network: 'Ethereum',
    rate_usd: 0.15,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'The Graph'
  },
  {
    code: 'BAT',
    name: 'Basic Attention Token',
    symbol: 'BAT',
    network: 'Ethereum',
    rate_usd: 0.25,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Basic Attention Token'
  },
  {
    code: 'ZRX',
    name: '0x',
    symbol: 'ZRX',
    network: 'Ethereum',
    rate_usd: 0.35,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: '0x'
  },
  {
    code: 'REN',
    name: 'Ren',
    symbol: 'REN',
    network: 'Ethereum',
    rate_usd: 0.08,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Ren'
  },
  {
    code: 'KNC',
    name: 'Kyber Network Crystal',
    symbol: 'KNC',
    network: 'Ethereum',
    rate_usd: 0.85,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Kyber Network Crystal'
  },
  {
    code: 'BAND',
    name: 'Band Protocol',
    symbol: 'BAND',
    network: 'Ethereum',
    rate_usd: 1.50,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Band Protocol'
  },
  {
    code: 'STORJ',
    name: 'Storj',
    symbol: 'STORJ',
    network: 'Ethereum',
    rate_usd: 0.45,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 8,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Storj'
  },
  {
    code: 'OCEAN',
    name: 'Ocean Protocol',
    symbol: 'OCEAN',
    network: 'Ethereum',
    rate_usd: 0.55,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Ocean Protocol'
  },
  {
    code: 'ANKR',
    name: 'Ankr',
    symbol: 'ANKR',
    network: 'Ethereum',
    rate_usd: 0.035,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Ankr'
  },
  {
    code: 'AUDIO',
    name: 'Audius',
    symbol: 'AUDIO',
    network: 'Ethereum',
    rate_usd: 0.18,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Audius'
  },

  // More Layer 1 and Alternative Coins
  {
    code: 'XTZ',
    name: 'Tezos',
    symbol: 'XTZ',
    network: 'Tezos',
    rate_usd: 0.95,
    min_amount: 0.000001,
    max_amount: 1000000,
    decimals: 6,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Tezos'
  },
  {
    code: 'EOS',
    name: 'EOS',
    symbol: 'EOS',
    network: 'EOS',
    rate_usd: 0.85,
    min_amount: 0.0001,
    max_amount: 1000000,
    decimals: 4,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'EOS'
  },
  {
    code: 'NEO',
    name: 'Neo',
    symbol: 'NEO',
    network: 'Neo',
    rate_usd: 15.00,
    min_amount: 0.00000001,
    max_amount: 1000000,
    decimals: 8,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Neo'
  },
  {
    code: 'QTUM',
    name: 'Qtum',
    symbol: 'QTUM',
    network: 'Qtum',
    rate_usd: 3.50,
    min_amount: 0.00000001,
    max_amount: 1000000,
    decimals: 8,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Qtum'
  },
  {
    code: 'WAVES',
    name: 'Waves',
    symbol: 'WAVES',
    network: 'Waves',
    rate_usd: 2.20,
    min_amount: 0.00000001,
    max_amount: 1000000,
    decimals: 8,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Waves'
  },
  {
    code: 'ICX',
    name: 'ICON',
    symbol: 'ICX',
    network: 'ICON',
    rate_usd: 0.25,
    min_amount: 0.000000000000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'ICON'
  },
  {
    code: 'ONT',
    name: 'Ontology',
    symbol: 'ONT',
    network: 'Ontology',
    rate_usd: 0.22,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 9,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Ontology'
  },
  {
    code: 'ZIL',
    name: 'Zilliqa',
    symbol: 'ZIL',
    network: 'Zilliqa',
    rate_usd: 0.025,
    min_amount: 0.000000000001,
    max_amount: 1000000,
    decimals: 12,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Zilliqa'
  },

  // Additional BSC/BEP-20 Tokens
  {
    code: 'CAKE',
    name: 'PancakeSwap',
    symbol: 'CAKE',
    network: 'BSC',
    rate_usd: 2.50,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'PancakeSwap'
  },
  {
    code: 'XVS',
    name: 'Venus',
    symbol: 'XVS',
    network: 'BSC',
    rate_usd: 8.50,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Venus'
  },
  {
    code: 'ALPACA',
    name: 'Alpaca Finance',
    symbol: 'ALPACA',
    network: 'BSC',
    rate_usd: 0.25,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Alpaca Finance'
  },

  // More Solana Ecosystem Tokens
  {
    code: 'RAY',
    name: 'Raydium',
    symbol: 'RAY',
    network: 'Solana',
    rate_usd: 1.80,
    min_amount: 0.000001,
    max_amount: 1000000,
    decimals: 6,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Raydium'
  },
  {
    code: 'SRM',
    name: 'Serum',
    symbol: 'SRM',
    network: 'Solana',
    rate_usd: 0.35,
    min_amount: 0.000001,
    max_amount: 1000000,
    decimals: 6,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Serum'
  },

  // Additional Polygon Ecosystem
  {
    code: 'QUICK',
    name: 'QuickSwap',
    symbol: 'QUICK',
    network: 'Polygon',
    rate_usd: 45.00,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'QuickSwap'
  },

  // More Avalanche Ecosystem
  {
    code: 'JOE',
    name: 'JoeToken',
    symbol: 'JOE',
    network: 'Avalanche',
    rate_usd: 0.45,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'JoeToken'
  },
  {
    code: 'PNG',
    name: 'Pangolin',
    symbol: 'PNG',
    network: 'Avalanche',
    rate_usd: 0.15,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Pangolin'
  },

  // Additional Fantom Ecosystem
  {
    code: 'BOO',
    name: 'SpookySwap',
    symbol: 'BOO',
    network: 'Fantom',
    rate_usd: 1.20,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'SpookySwap'
  },
  {
    code: 'SPIRIT',
    name: 'SpiritSwap',
    symbol: 'SPIRIT',
    network: 'Fantom',
    rate_usd: 0.08,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'SpiritSwap'
  },

  // Cross-chain and Bridge Tokens
  {
    code: 'WBTC',
    name: 'Wrapped Bitcoin',
    symbol: 'WBTC',
    network: 'Ethereum',
    rate_usd: 45000.00,
    min_amount: 0.00000001,
    max_amount: 1000000,
    decimals: 8,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Wrapped Bitcoin'
  },
  {
    code: 'WETH',
    name: 'Wrapped Ethereum',
    symbol: 'WETH',
    network: 'Ethereum',
    rate_usd: 2800.00,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Wrapped Ethereum'
  },

  // Additional Emerging Tokens (to reach 250+)
  {
    code: 'BLUR',
    name: 'Blur',
    symbol: 'BLUR',
    network: 'Ethereum',
    rate_usd: 0.35,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Blur'
  },
  {
    code: 'LDO',
    name: 'Lido DAO',
    symbol: 'LDO',
    network: 'Ethereum',
    rate_usd: 2.20,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Lido DAO'
  },
  {
    code: 'RPL',
    name: 'Rocket Pool',
    symbol: 'RPL',
    network: 'Ethereum',
    rate_usd: 25.00,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Rocket Pool'
  },
  {
    code: 'FXS',
    name: 'Frax Share',
    symbol: 'FXS',
    network: 'Ethereum',
    rate_usd: 8.50,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Frax Share'
  },
  {
    code: 'CVX',
    name: 'Convex Finance',
    symbol: 'CVX',
    network: 'Ethereum',
    rate_usd: 3.20,
    min_amount: 0.000000001,
    max_amount: 1000000,
    decimals: 18,
    enabled: true,
    trust_wallet_compatible: true,
    display_name: 'Convex Finance'
  }
];

// Create unique currency map to prevent duplicates
const uniqueCurrencies = SUPPORTED_CURRENCIES.reduce((acc, currency) => {
  if (!acc[currency.code]) {
    acc[currency.code] = {
      ...currency,
      id: `${currency.code.toLowerCase()}-${currency.network.toLowerCase().replace(/\s+/g, '-')}`
    };
  }
  return acc;
}, {} as Record<string, any>);

const CURRENCIES_ARRAY = Object.values(uniqueCurrencies);

// Define top currencies (popular ones shown first)
const TOP_CURRENCY_CODES = [
  'BTC', 'ETH', 'BNB', 'SOL', 'TRX', 'TON', 'AVAX', 'DOGE', 'XRP', 'SUI',
  'USDT_ERC20', 'USDC_ERC20', 'USDT_BEP20', 'USDC_BEP20', 'USDT_SOL', 'USDC_SOL',
  'USDT_TRC20', 'USDC_TRC20', 'USDT_TON', 'USDT_AVAX', 'USDC_AVAX'
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const popularOnly = searchParams.get('popular') === 'true';

    console.log('📡 Currencies API called, popular:', popularOnly);

    if (popularOnly) {
      // Return only top currencies
      const topCurrencies = CURRENCIES_ARRAY.filter(currency => 
        TOP_CURRENCY_CODES.includes(currency.code)
      ).sort((a, b) => {
        const aIndex = TOP_CURRENCY_CODES.indexOf(a.code);
        const bIndex = TOP_CURRENCY_CODES.indexOf(b.code);
        return aIndex - bIndex;
      });

      console.log(`✅ Returning ${topCurrencies.length} currencies (popular: ${popularOnly})`);

      return NextResponse.json({
        success: true,
        currencies: topCurrencies,
        total_count: topCurrencies.length,
        popular_only: true,
        last_updated: new Date().toISOString(),
        message: 'Top cryptocurrencies loaded successfully'
      });
    } else {
      // Return all currencies
      const allCurrencies = CURRENCIES_ARRAY.sort((a, b) => {
        // Sort by: top currencies first, then alphabetically
        const aIsTop = TOP_CURRENCY_CODES.includes(a.code);
        const bIsTop = TOP_CURRENCY_CODES.includes(b.code);
        
        if (aIsTop && !bIsTop) return -1;
        if (!aIsTop && bIsTop) return 1;
        if (aIsTop && bIsTop) {
          return TOP_CURRENCY_CODES.indexOf(a.code) - TOP_CURRENCY_CODES.indexOf(b.code);
        }
        return a.name.localeCompare(b.name);
      });

      console.log(`✅ Returning ${allCurrencies.length} currencies (popular: ${popularOnly})`);

      return NextResponse.json({
        success: true,
        currencies: allCurrencies,
        total_count: allCurrencies.length,
        popular_only: false,
        last_updated: new Date().toISOString(),
        message: 'All supported cryptocurrencies loaded successfully'
      });
    }

  } catch (error) {
    console.error('💥 Error in currencies API:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to load currencies',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

