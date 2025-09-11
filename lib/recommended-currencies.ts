export type RecommendedCurrency = {
  code: string
  name: string
}

// Single source of truth for "Highly Recommended" currencies
export const RECOMMENDED_CURRENCIES: RecommendedCurrency[] = [
  { code: 'BTC', name: 'Bitcoin' },
  { code: 'ETH', name: 'Ethereum' },
  { code: 'ETHBASE', name: 'Ethereum' },
  { code: 'SOL', name: 'Solana' },
  { code: 'AVAX', name: 'Avalanche' },
  { code: 'BNBBSC', name: 'Binance Coin (BSC)' },
  { code: 'ADA', name: 'Cardano' },
  { code: 'LTC', name: 'Litecoin' },
  { code: 'DOT', name: 'Polkadot' },
  { code: 'XRP', name: 'Ripple' },
  { code: 'SUI', name: 'Sui' },
  { code: 'TON', name: 'Toncoin' },
  { code: 'TRX', name: 'Tron' },
  { code: 'XLM', name: 'Stellar' },
]

