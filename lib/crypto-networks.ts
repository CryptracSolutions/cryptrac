export interface CurrencyNetwork {
  id: string
  name: string
  displayName: string
  icon?: string
  currencies: string[]
  nativeCurrency: string
}

export interface GroupedCurrency {
  code: string
  name: string
  network: string
  isNative: boolean
  isStablecoin: boolean
}

// Define blockchain networks and their associated currencies
export const NETWORKS: Record<string, CurrencyNetwork> = {
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum',
    displayName: 'Ethereum',
    nativeCurrency: 'ETH',
    currencies: ['ETH', 'USDTERC20', 'USDC', 'DAI', 'PYUSD']
  },
  bitcoin: {
    id: 'bitcoin',
    name: 'Bitcoin',
    displayName: 'Bitcoin',
    nativeCurrency: 'BTC',
    currencies: ['BTC']
  },
  binance: {
    id: 'binance',
    name: 'BNB Smart Chain',
    displayName: 'BNB Chain',
    nativeCurrency: 'BNB',
    currencies: ['BNB', 'BNBBSC', 'USDTBSC', 'BUSDBSC', 'USDCBSC']
  },
  solana: {
    id: 'solana',
    name: 'Solana',
    displayName: 'Solana',
    nativeCurrency: 'SOL',
    currencies: ['SOL', 'USDTSOL', 'USDCSOL']
  },
  polygon: {
    id: 'polygon',
    name: 'Polygon',
    displayName: 'Polygon',
    nativeCurrency: 'MATIC',
    currencies: ['MATIC', 'USDTMATIC', 'USDCMATIC']
  },
  tron: {
    id: 'tron',
    name: 'TRON',
    displayName: 'TRON',
    nativeCurrency: 'TRX',
    currencies: ['TRX', 'USDTTRC20', 'TUSDTRC20']
  },
  ton: {
    id: 'ton',
    name: 'TON',
    displayName: 'TON',
    nativeCurrency: 'TON',
    currencies: ['TON', 'USDTTON']
  },
  arbitrum: {
    id: 'arbitrum',
    name: 'Arbitrum',
    displayName: 'Arbitrum',
    nativeCurrency: 'ARB',
    currencies: ['ARB', 'USDTARB', 'USDCARB']
  },
  optimism: {
    id: 'optimism',
    name: 'Optimism',
    displayName: 'Optimism',
    nativeCurrency: 'OP',
    currencies: ['OP', 'USDTOP', 'USDCOP']
  },
  base: {
    id: 'base',
    name: 'Base',
    displayName: 'Base',
    nativeCurrency: 'ETHBASE',
    currencies: ['ETHBASE', 'USDCBASE']
  },
  avalanche: {
    id: 'avalanche',
    name: 'Avalanche',
    displayName: 'Avalanche',
    nativeCurrency: 'AVAX',
    currencies: ['AVAX', 'USDCARC20', 'USDTARC20']
  },
  algorand: {
    id: 'algorand',
    name: 'Algorand',
    displayName: 'Algorand',
    nativeCurrency: 'ALGO',
    currencies: ['ALGO', 'USDCALGO']
  },
  litecoin: {
    id: 'litecoin',
    name: 'Litecoin',
    displayName: 'Litecoin',
    nativeCurrency: 'LTC',
    currencies: ['LTC']
  },
  cardano: {
    id: 'cardano',
    name: 'Cardano',
    displayName: 'Cardano',
    nativeCurrency: 'ADA',
    currencies: ['ADA']
  },
  ripple: {
    id: 'ripple',
    name: 'XRP Ledger',
    displayName: 'XRP',
    nativeCurrency: 'XRP',
    currencies: ['XRP']
  },
  polkadot: {
    id: 'polkadot',
    name: 'Polkadot',
    displayName: 'Polkadot',
    nativeCurrency: 'DOT',
    currencies: ['DOT']
  },
  stellar: {
    id: 'stellar',
    name: 'Stellar',
    displayName: 'Stellar',
    nativeCurrency: 'XLM',
    currencies: ['XLM']
  },
  near: {
    id: 'near',
    name: 'NEAR',
    displayName: 'NEAR',
    nativeCurrency: 'NEAR',
    currencies: ['NEAR']
  },
  sui: {
    id: 'sui',
    name: 'Sui',
    displayName: 'Sui',
    nativeCurrency: 'SUI',
    currencies: ['SUI']
  }
}

// Map of currency codes to their network
export const CURRENCY_TO_NETWORK: Record<string, string> = {}

// Build the currency to network mapping
Object.entries(NETWORKS).forEach(([networkId, network]) => {
  network.currencies.forEach(currency => {
    CURRENCY_TO_NETWORK[currency.toUpperCase()] = networkId
  })
})

// Stablecoin identifiers
const STABLECOIN_IDENTIFIERS = ['USDT', 'USDC', 'DAI', 'PYUSD']

export function isStablecoin(currencyCode: string): boolean {
  const upper = currencyCode.toUpperCase()
  return STABLECOIN_IDENTIFIERS.some(stable => upper.includes(stable))
}

export function getNetworkForCurrency(currencyCode: string): string | null {
  return CURRENCY_TO_NETWORK[currencyCode.toUpperCase()] || null
}

export function getNetworkInfo(networkId: string): CurrencyNetwork | null {
  return NETWORKS[networkId] || null
}

export function groupCurrenciesByNetwork(
  currencies: Array<{ code: string; name: string }>,
  acceptedCryptos: string[]
): Map<string, GroupedCurrency[]> {
  const grouped = new Map<string, GroupedCurrency[]>()

  // First, ensure all networks that have accepted cryptos are included
  acceptedCryptos.forEach(crypto => {
    const networkId = getNetworkForCurrency(crypto)
    if (networkId && !grouped.has(networkId)) {
      grouped.set(networkId, [])
    }
  })

  // Also ensure all networks that have available currencies are included
  // This is important for native networks like SUI that may not be in acceptedCryptos
  currencies.forEach(currency => {
    const networkId = getNetworkForCurrency(currency.code)
    if (networkId && !grouped.has(networkId)) {
      grouped.set(networkId, [])
    }
  })

  // Group all currencies by their network
  currencies.forEach(currency => {
    const networkId = getNetworkForCurrency(currency.code)
    if (!networkId) return

    const network = NETWORKS[networkId]
    if (!network) return

    const groupedCurrency: GroupedCurrency = {
      code: currency.code,
      name: currency.name,
      network: network.displayName,
      isNative: network.nativeCurrency === currency.code,
      isStablecoin: isStablecoin(currency.code)
    }

    if (!grouped.has(networkId)) {
      grouped.set(networkId, [])
    }

    grouped.get(networkId)!.push(groupedCurrency)
  })

  // Sort currencies within each network (native first, then stablecoins)
  grouped.forEach(currencies => {
    currencies.sort((a, b) => {
      if (a.isNative && !b.isNative) return -1
      if (!a.isNative && b.isNative) return 1
      if (a.isStablecoin && !b.isStablecoin) return 1
      if (!a.isStablecoin && b.isStablecoin) return -1
      return a.code.localeCompare(b.code)
    })
  })

  return grouped
}

// Get display name for a currency
export function getCurrencyDisplayName(code: string): string {
  const upper = code.toUpperCase()
  
  // Handle stablecoins with network suffixes
  if (upper.startsWith('USDT')) {
    if (upper === 'USDT' || upper === 'USDTERC20') return 'Tether (USDT)'
    if (upper === 'USDTBSC') return 'Tether (BSC)'
    if (upper === 'USDTTRC20') return 'Tether (TRC20)'
    if (upper === 'USDTSOL') return 'Tether (Solana)'
    if (upper === 'USDTMATIC') return 'Tether (Polygon)'
    if (upper === 'USDTTON') return 'Tether (TON)'
    if (upper === 'USDTARB') return 'Tether (Arbitrum)'
    if (upper === 'USDTOP') return 'Tether (Optimism)'
    return 'Tether'
  }
  
  if (upper.startsWith('USDC')) {
    if (upper === 'USDC') return 'USD Coin (USDC)'
    if (upper === 'USDCBSC') return 'USD Coin (BSC)'
    if (upper === 'USDCSOL') return 'USD Coin (Solana)'
    if (upper === 'USDCMATIC') return 'USD Coin (Polygon)'
    if (upper === 'USDCALGO') return 'USD Coin (Algorand)'
    if (upper === 'USDCARB') return 'USD Coin (Arbitrum)'
    if (upper === 'USDCOP') return 'USD Coin (Optimism)'
    if (upper === 'USDCBASE') return 'USD Coin (Base)'
    return 'USD Coin'
  }
  
  if (upper === 'DAI') return 'DAI Stablecoin'
  if (upper === 'PYUSD') return 'PayPal USD'
  
  // Handle native currencies
  if (upper === 'BTC') return 'Bitcoin'
  if (upper === 'ETH') return 'Ethereum'
  if (upper === 'BNB' || upper === 'BNBBSC') return 'BNB'
  if (upper === 'SOL') return 'Solana'
  if (upper === 'MATIC') return 'Polygon'
  if (upper === 'TRX') return 'TRON'
  if (upper === 'TON') return 'Toncoin'
  if (upper === 'AVAX') return 'Avalanche'
  if (upper === 'AVAXC') return 'Avalanche (C-Chain)'
  if (upper === 'ARB') return 'Arbitrum'
  if (upper === 'OP') return 'Optimism'
  if (upper === 'ETHBASE') return 'Ethereum (Base)'
  if (upper === 'ALGO') return 'Algorand'
  if (upper === 'LTC') return 'Litecoin'
  if (upper === 'ADA') return 'Cardano'
  if (upper === 'XRP') return 'XRP'
  if (upper === 'DOT') return 'Polkadot'
  if (upper === 'XLM') return 'Stellar'
  if (upper === 'NEAR') return 'NEAR Protocol'
  if (upper === 'SUI') return 'Sui'

  return code
}

// Sort networks by priority (most popular first)
export function sortNetworksByPriority(networkIds: string[]): string[] {
  const priority = [
    'ethereum',
    'bitcoin',
    'binance',
    'solana',
    'polygon',
    'base',
    'arbitrum',
    'optimism',
    'tron',
    'ton',
    'avalanche',
    'sui',
    'litecoin',
    'cardano',
    'ripple',
    'polkadot',
    'algorand',
    'stellar',
    'near'
  ]
  
  return networkIds.sort((a, b) => {
    const aIndex = priority.indexOf(a)
    const bIndex = priority.indexOf(b)
    
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b)
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    
    return aIndex - bIndex
  })
}
