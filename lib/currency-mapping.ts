export interface NPCurrency {
  code: string
  name: string
  enabled: boolean
  min_amount?: number
  max_amount?: number
}

export interface CustomerCurrency {
  code: string
  name: string
  enabled: boolean
  min_amount?: number
  max_amount?: number
}

// Network-suffixed stablecoins supported per base currency
const DEFAULT_STABLE_MAP: Record<string, string[]> = {
  BNB: ['USDTBSC', 'USDCBSC'],
  ETH: ['USDTERC20', 'USDC', 'DAI', 'PYUSD'],
  SOL: ['USDTSOL', 'USDCSOL'],
  TRX: ['USDTTRC20'],
  TON: ['USDTTON'],
  MATIC: ['USDTMATIC', 'USDCMATIC'],
  ARB: ['USDTARB', 'USDCARB'],
  OP: ['USDTOP', 'USDCOP'],
  ETHBASE: ['USDCBASE'],
  ALGO: ['USDCALGO'],
  // Avalanche C-Chain support
  AVAX: ['USDTARC20', 'USDCARC20'],
  AVAXC: ['USDTARC20', 'USDCARC20'],
}

// Comprehensive alias mapping for display codes → NOWPayments codes
const CURRENCY_ALIASES: Record<string, string[]> = {
  // Major cryptocurrencies
  BTC: ['BTC', 'BITCOIN', 'BTCLN', 'BTCSEGWIT'],
  ETH: ['ETH', 'ETHEREUM', 'ETHBSC', 'ETHMATIC', 'ETHARB', 'ETHOP', 'ETHBASE', 'BASEETH', 'ETH_BASE'],
  BNB: ['BNB', 'BNBBSC', 'BSC', 'BNB_BSC', 'BINANCE', 'BNBCHAIN'],
  SOL: ['SOL', 'SOLANA', 'SOLSPL'],
  ADA: ['ADA', 'CARDANO'],
  DOT: ['DOT', 'POLKADOT'],
  MATIC: ['MATIC', 'POLYGON', 'MATICMATIC'],
  AVAX: ['AVAX', 'AVALANCHE', 'AVAXC'],
  TRX: ['TRX', 'TRON'],
  LTC: ['LTC', 'LITECOIN'],
  XRP: ['XRP', 'RIPPLE'],
  TON: ['TON', 'TONCOIN'],
  NEAR: ['NEAR', 'NEARPROTOCOL'],
  ALGO: ['ALGO', 'ALGORAND'],
  XLM: ['XLM', 'STELLAR'],
  ARB: ['ARB', 'ARBITRUM'],
  OP: ['OP', 'OPTIMISM'],
  ETHBASE: ['ETHBASE', 'BASE', 'BASECHAIN', 'BASEETH', 'ETH_BASE'],
  // zkSync
  ZK: ['ZK', 'ZKSYNC', 'ZKERC20'],
  // Additional networks
  FTM: ['FTM', 'FANTOM', 'FTMMAINNET'],
  RUNE: ['RUNE', 'THORCHAIN'],
  CFX: ['CFX', 'CFXMAINNET', 'CONFLUX'],
  CRO: ['CRO', 'CRONOS', 'CROMAINNET'],
  INJ: ['INJ', 'INJMAINNET', 'INJERC20'],
  // Common ERC-20 tokens
  OCEAN: ['OCEAN', 'OCEANERC20'],
  GALA: ['GALA', 'GALAERC20'],

  // Network-suffixed stablecoin variants and aliases
  // Avalanche C-Chain stablecoins (no alias to Arbitrum)
  USDTARC20: ['USDTARC20'],
  USDCARC20: ['USDCARC20'],
  OPUSDCE: ['USDCOP', 'OPUSDCE'],
  MATICUSDCE: ['USDCMATIC', 'MATICUSDCE'],
  MATICMAINNET: ['MATIC'],
  USDTCELO: ['USDTCELO'],
  ZROARB: ['ZROARB'],
  ZROERC20: ['ZROERC20'],
  AVAXC: ['AVAXC', 'AVAX'],
  BNBBSC: ['BNBBSC'],
  BUSDBSC: ['BUSDBSC'],
  ETHARB: ['ETHARB'],
  BRETTBASE: ['BRETTBASE'],
  WBTCMATIC: ['WBTCMATIC'],

  // Explicit identities for stablecoins
  USDTERC20: ['USDTERC20'],
  USDTBSC: ['USDTBSC'],
  USDTTRC20: ['USDTTRC20'],
  USDTMATIC: ['USDTMATIC'],
  USDTSOL: ['USDTSOL'],
  USDTTON: ['USDTTON'],
  USDTARB: ['USDTARB'],
  USDTOP: ['USDTOP'],
  USDCERC20: ['USDCERC20'],
  USDCBSC: ['USDCBSC'],
  USDCMATIC: ['USDCMATIC'],
  USDCSOL: ['USDCSOL'],
  USDCALGO: ['USDCALGO'],
  USDCARB: ['USDCARB'],
  USDCOP: ['USDCOP'],
  USDCBASE: ['USDCBASE'],
  FTMMAINNET: ['FTM'],
  CFXMAINNET: ['CFX'],
  CROMAINNET: ['CRO'],
  INJMAINNET: ['INJ'],
  INJERC20: ['INJ'],
}

const NETWORK_PATTERNS = ['BSC', 'ERC20', 'TRC20', 'SOL', 'MATIC', 'ARB', 'OP', 'BASE', 'AVAX', 'TON', 'ALGO', 'NEAR']

export function buildCurrencyMapping(params: {
  acceptedCryptos: string[]
  npCurrencies: NPCurrency[]
  stableMap?: Record<string, string[]>
}) {
  const stableMap = params.stableMap || DEFAULT_STABLE_MAP
  const upperAccepted = Array.from(new Set(params.acceptedCryptos.map(c => c.toUpperCase())))

  // Expand with network stables
  const expanded: string[] = []
  for (const code of upperAccepted) {
    expanded.push(code)
    const stables = stableMap[code] || []
    for (const s of stables) expanded.push(s.toUpperCase())
  }
  const allCodes = Array.from(new Set(expanded))

  // Build backend mappings via aliases/dynamic patterns/exact
  const backendMappings: Record<string, string> = {}
  for (const code of allCodes) {
    const upper = code.toUpperCase()
    const alts = CURRENCY_ALIASES[upper] || []
    let backend: string | null = null

    for (const alt of alts) {
      const found = params.npCurrencies.find(c => c.code.toUpperCase() === alt.toUpperCase() && c.enabled)
      if (found) { backend = found.code; break }
    }
    if (!backend) {
      for (const pat of NETWORK_PATTERNS) {
        const dyn = `${upper}${pat}`
        const found = params.npCurrencies.find(c => c.code.toUpperCase() === dyn && c.enabled)
        if (found) { backend = found.code; break }
      }
    }
    if (!backend) {
      const exact = params.npCurrencies.find(c => c.code.toUpperCase() === upper && c.enabled)
      if (exact) backend = exact.code
    }
    if (backend) backendMappings[upper] = backend
  }

  // Build customer-facing list with enabled flags
  const customerCurrencies: CustomerCurrency[] = []
  for (const code of allCodes) {
    const upper = code.toUpperCase()
    const backend = backendMappings[upper]
    const npInfo = backend ? params.npCurrencies.find(c => c.code === backend && c.enabled) : null
    const displayName = npInfo?.name || upper
    customerCurrencies.push({
      code: upper,
      name: displayName,
      enabled: !!npInfo,
      min_amount: npInfo?.min_amount,
      max_amount: npInfo?.max_amount,
    })
  }

  // Sort: primary (accepted) first, then others; inside group alphabetical
  customerCurrencies.sort((a, b) => {
    const aPrimary = upperAccepted.includes(a.code)
    const bPrimary = upperAccepted.includes(b.code)
    if (aPrimary && !bPrimary) return -1
    if (!aPrimary && bPrimary) return 1
    return a.code.localeCompare(b.code)
  })

  return { customerCurrencies, backendMappings }
}

