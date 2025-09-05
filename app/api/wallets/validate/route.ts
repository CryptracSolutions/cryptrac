import { NextRequest, NextResponse } from 'next/server'
import { requiresExtraId, validateExtraId, getExtraIdLabel } from '@/lib/extra-id-validation';

// Comprehensive address validation patterns for all supported cryptocurrencies
// Updated to support multiple address formats for maximum compatibility
const ADDRESS_PATTERNS: Record<string, RegExp> = {
  // Bitcoin and variants - supports Legacy, SegWit, and Bech32
  BTC: /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,87}$/,
  
  // Ethereum and ERC-20 tokens - standard 40-character hex
  ETH: /^0x[a-fA-F0-9]{40}$/,
  ETHBASE: /^0x[a-fA-F0-9]{40}$/, // ETH on Base network
  USDT_ERC20: /^0x[a-fA-F0-9]{40}$/,
  USDC_ERC20: /^0x[a-fA-F0-9]{40}$/,
  USDT: /^0x[a-fA-F0-9]{40}$/, // Default USDT to ERC-20
  USDC: /^0x[a-fA-F0-9]{40}$/, // Default USDC to ERC-20
  DAI: /^0x[a-fA-F0-9]{40}$/, // Dai (Ethereum)
  PYUSD: /^0x[a-fA-F0-9]{40}$/, // PayPal USD (Ethereum)
  USDCBASE: /^0x[a-fA-F0-9]{40}$/, // USDC on Base network
  
  // BSC (BEP-20) tokens - same as Ethereum format
  BNB: /^0x[a-fA-F0-9]{40}$/,
  BNBBSC: /^0x[a-fA-F0-9]{40}$/,
  USDTBSC: /^0x[a-fA-F0-9]{40}$/,
  USDCBSC: /^0x[a-fA-F0-9]{40}$/,
  
  // Solana and SPL tokens - Base58 encoded, 32-44 characters
  SOL: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  USDTSOL: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  USDCSOL: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  
  // TRON and TRC-20 tokens - starts with T, 34 characters
  TRX: /^T[A-Za-z1-9]{33}$/,
  USDTTRC20: /^T[A-Za-z1-9]{33}$/,
  
  // TON ecosystem - supports multiple formats
  TON: /^(0:[a-fA-F0-9]{64}|[A-Za-z0-9\-_]{48}|UQ[A-Za-z0-9\-_]{46})$/,
  USDTTON: /^(0:[a-fA-F0-9]{64}|[A-Za-z0-9\-_]{48}|UQ[A-Za-z0-9\-_]{46})$/,
  
  // Avalanche ecosystem - same as Ethereum format
  AVAX: /^0x[a-fA-F0-9]{40}$/,
  AVAXC: /^0x[a-fA-F0-9]{40}$/,
  
  // Other major cryptocurrencies with comprehensive format support
  DOGE: /^D[5-9A-HJ-NP-U][1-9A-HJ-NP-Za-km-z]{32}$/,
  XRP: /^r[0-9a-zA-Z]{24,34}$/,
  SUI: /^0x[a-fA-F0-9]{64}$/,
  
  // Litecoin - supports Legacy and Bech32 formats
  LTC: /^(ltc1[a-z0-9]{39,59}|[LM3][a-km-zA-HJ-NP-Z1-9]{26,33})$/,
  
  // Cardano - supports multiple address formats
  ADA: /^(addr1[a-z0-9]{53,103}|DdzFF[a-zA-Z0-9]{93,108}|Ae2[a-zA-Z0-9]{93,108})$/,
  
  // Polkadot - supports SS58 format with various lengths
  DOT: /^1[0-9A-Za-z]{46,47}$/,
  
  // Polygon - same as Ethereum format
  MATIC: /^0x[a-fA-F0-9]{40}$/,
  USDCMATIC: /^0x[a-fA-F0-9]{40}$/,
  USDTMATIC: /^0x[a-fA-F0-9]{40}$/,
  
  // Aptos - 32-byte hex addresses
  APT: /^0x[a-fA-F0-9]{64}$/,
  
  // Ethereum ecosystem tokens
  LINK: /^0x[a-fA-F0-9]{40}$/,
  UNI: /^0x[a-fA-F0-9]{40}$/,
  AAVE: /^0x[a-fA-F0-9]{40}$/,
  
  // Algorand - supports multiple formats
  ALGO: /^[A-Z2-7]{58}$/,
  USDCALGO: /^[A-Z2-7]{58}$/,
  
  // Cosmos ecosystem
  ATOM: /^cosmos[0-9a-z]{39}$/,
  
  // Filecoin - supports multiple formats
  FIL: /^f[0-4][a-z0-9]{38,86}$/,
  
  // Internet Computer - supports principal format
  ICP: /^[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{3}$/,
  
  // NEAR Protocol - supports both hex and .near formats
  NEAR: /^([a-f0-9]{64}|[a-z0-9_\-\.]{2,64}\.near)$/,
  
  // VeChain - same as Ethereum format
  VET: /^0x[a-fA-F0-9]{40}$/,
  
  // Stellar - supports multiple formats
  XLM: /^G[A-Z2-7]{55}$/,
  
  // Tezos - supports multiple address types
  XTZ: /^tz[1-3][1-9A-HJ-NP-Za-km-z]{33}$/,
  
  // Theta - same as Ethereum format
  THETA: /^0x[a-fA-F0-9]{40}$/,
  
  // Flow - 16-character hex
  FLOW: /^0x[a-fA-F0-9]{16}$/,
  
  // Elrond/MultiversX - erd format
  EGLD: /^erd[0-9a-z]{59}$/,
  
  // Hedera - account ID format
  HBAR: /^0\.0\.[0-9]+$/,
  
  // Monero - supports multiple formats
  XMR: /^(4[0-9AB][1-9A-HJ-NP-Za-km-z]{93}|8[0-9AB][1-9A-HJ-NP-Za-km-z]{93})$/,
  
  // Zcash - supports multiple formats
  ZEC: /^(t[13][a-km-zA-HJ-NP-Z1-9]{33}|zs[0-9a-z]{76})$/,
  
  // Dash
  DASH: /^X[1-9A-HJ-NP-Za-km-z]{33}$/,
  
  // Bitcoin Cash - supports multiple formats
  BCH: /^([13][a-km-zA-HJ-NP-Z1-9]{25,34}|q[a-z0-9]{41}|bitcoincash:q[a-z0-9]{41})$/,
  
  // Bitcoin SV
  BSV: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/,
  
  // Ethereum Classic - same as Ethereum format
  ETC: /^0x[a-fA-F0-9]{40}$/,
  
  // Zilliqa - supports multiple formats
  ZIL: /^(zil[0-9a-z]{39}|0x[a-fA-F0-9]{40})$/,
  
  // Ontology
  ONT: /^A[0-9a-zA-Z]{33}$/,
  
  // Qtum
  QTUM: /^[MQ][a-km-zA-HJ-NP-Z1-9]{33}$/,
  
  // ICON
  ICX: /^hx[0-9a-f]{40}$/,
  
  // Waves
  WAVES: /^3P[0-9A-Za-z]{33}$/,
  
  // Lisk
  LSK: /^[0-9]{1,21}L$/,
  
  // Nano - supports multiple formats
  NANO: /^(nano_[13][13456789abcdefghijkmnopqrstuwxyz]{59}|xrb_[13][13456789abcdefghijkmnopqrstuwxyz]{59})$/,
  
  // IOTA - supports multiple formats
  IOTA: /^(iota1[a-z0-9]{59}|[A-Z9]{81,90})$/,
  
  // NEO
  NEO: /^A[0-9a-zA-Z]{33}$/,
  GAS: /^A[0-9a-zA-Z]{33}$/,
  
  // Komodo
  KMD: /^R[0-9a-zA-Z]{33}$/,
  
  // Decred
  DCR: /^D[ksecS][0-9a-zA-Z]{33}$/,
  
  // Stratis
  STRAT: /^S[0-9a-zA-Z]{33}$/,
  
  // Ark
  ARK: /^A[0-9a-zA-Z]{33}$/,
  
  // Additional ERC-20 tokens
  KCS: /^0x[a-fA-F0-9]{40}$/,
  BNT: /^0x[a-fA-F0-9]{40}$/,
  REP: /^0x[a-fA-F0-9]{40}$/,
  ZRX: /^0x[a-fA-F0-9]{40}$/,
  BAT: /^0x[a-fA-F0-9]{40}$/,
  ENJ: /^0x[a-fA-F0-9]{40}$/,
  MANA: /^0x[a-fA-F0-9]{40}$/,
  SNT: /^0x[a-fA-F0-9]{40}$/,
  KNC: /^0x[a-fA-F0-9]{40}$/,
  LOOM: /^0x[a-fA-F0-9]{40}$/,
  GNT: /^0x[a-fA-F0-9]{40}$/,
  STORJ: /^0x[a-fA-F0-9]{40}$/,
  CVC: /^0x[a-fA-F0-9]{40}$/,
  MCO: /^0x[a-fA-F0-9]{40}$/,
  MTL: /^0x[a-fA-F0-9]{40}$/,
  POLY: /^0x[a-fA-F0-9]{40}$/,
  LRC: /^0x[a-fA-F0-9]{40}$/,
  RLC: /^0x[a-fA-F0-9]{40}$/,
  
  // Legacy BNB format
  BNB_LEGACY: /^bnb[0-9a-z]{39}$/,
  
  // THORChain (RUNE) - bech32 (thor1...)
  RUNE: /^thor1[0-9a-z]{38,59}$/,
  
  // Additional popular cryptocurrencies with comprehensive patterns
  SHIB: /^0x[a-fA-F0-9]{40}$/,
  APE: /^0x[a-fA-F0-9]{40}$/,
  SAND: /^0x[a-fA-F0-9]{40}$/,
  CRO: /^0x[a-fA-F0-9]{40}$/,
  FTM: /^0x[a-fA-F0-9]{40}$/,
  CAKE: /^0x[a-fA-F0-9]{40}$/,
  
  // Cosmos ecosystem tokens
  OSMO: /^osmo[0-9a-z]{39}$/,
  JUNO: /^juno[0-9a-z]{39}$/,
  
  // Terra ecosystem
  LUNA: /^terra[0-9a-z]{39}$/,
  UST: /^terra[0-9a-z]{39}$/,
  
  // Fantom
  FTM_NATIVE: /^0x[a-fA-F0-9]{40}$/,
  
  // Arbitrum (same as Ethereum)
  ARB: /^0x[a-fA-F0-9]{40}$/,
  USDTARB: /^0x[a-fA-F0-9]{40}$/,
  USDCARB: /^0x[a-fA-F0-9]{40}$/,
  
  // Optimism (same as Ethereum)
  OP: /^0x[a-fA-F0-9]{40}$/,
  USDTOP: /^0x[a-fA-F0-9]{40}$/,
  USDCOP: /^0x[a-fA-F0-9]{40}$/,
  
  // zkSync Era (ETH on zkSync)
  ZKSYNC: /^0x[a-fA-F0-9]{40}$/,
  ZK: /^0x[a-fA-F0-9]{40}$/,
  
  // Network-based fallback patterns
  ethereum: /^0x[a-fA-F0-9]{40}$/,
  bsc: /^0x[a-fA-F0-9]{40}$/,
  polygon: /^0x[a-fA-F0-9]{40}$/,
  avalanche: /^0x[a-fA-F0-9]{40}$/,
  solana: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  tron: /^T[A-Za-z1-9]{33}$/,
  bitcoin: /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,87}$/,
  litecoin: /^(ltc1[a-z0-9]{39,59}|[LM3][a-km-zA-HJ-NP-Z1-9]{26,33})$/,
  dogecoin: /^D[5-9A-HJ-NP-U][1-9A-HJ-NP-Za-km-z]{32}$/,
  ripple: /^r[0-9a-zA-Z]{24,34}$/,
  cardano: /^(addr1[a-z0-9]{53,103}|DdzFF[a-zA-Z0-9]{93,108}|Ae2[a-zA-Z0-9]{93,108})$/,
  polkadot: /^1[0-9A-Za-z]{46,47}$/,
  chainlink: /^0x[a-fA-F0-9]{40}$/,
  uniswap: /^0x[a-fA-F0-9]{40}$/,
  aave: /^0x[a-fA-F0-9]{40}$/,
  algorand: /^[A-Z2-7]{58}$/,
  cosmos: /^cosmos[0-9a-z]{39}$/,
  filecoin: /^f[0-4][a-z0-9]{38,86}$/,
  'internet-computer': /^[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{3}$/,
  near: /^([a-f0-9]{64}|[a-z0-9_\-\.]{2,64}\.near)$/,
  vechain: /^0x[a-fA-F0-9]{40}$/,
  stellar: /^G[A-Z2-7]{55}$/,
  eos: /^[a-z1-5\.]{1,12}$/,
  tezos: /^tz[1-3][1-9A-HJ-NP-Za-km-z]{33}$/,
  theta: /^0x[a-fA-F0-9]{40}$/,
  flow: /^0x[a-fA-F0-9]{16}$/,
  elrond: /^erd[0-9a-z]{59}$/,
  hedera: /^0\.0\.[0-9]+$/,
  monero: /^(4[0-9AB][1-9A-HJ-NP-Za-km-z]{93}|8[0-9AB][1-9A-HJ-NP-Za-km-z]{93})$/,
  zcash: /^(t[13][a-km-zA-HJ-NP-Z1-9]{33}|zs[0-9a-z]{76})$/,
  dash: /^X[1-9A-HJ-NP-Za-km-z]{33}$/,
  'bitcoin-cash': /^([13][a-km-zA-HJ-NP-Z1-9]{25,34}|q[a-z0-9]{41}|bitcoincash:q[a-z0-9]{41})$/,
  'bitcoin-sv': /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/,
  'ethereum-classic': /^0x[a-fA-F0-9]{40}$/,
  zilliqa: /^(zil[0-9a-z]{39}|0x[a-fA-F0-9]{40})$/,
  ontology: /^A[0-9a-zA-Z]{33}$/,
  qtum: /^[MQ][a-km-zA-HJ-NP-Z1-9]{33}$/,
  icon: /^hx[0-9a-f]{40}$/,
  waves: /^3P[0-9A-Za-z]{33}$/,
  lisk: /^[0-9]{1,21}L$/,
  nano: /^(nano_[13][13456789abcdefghijkmnopqrstuwxyz]{59}|xrb_[13][13456789abcdefghijkmnopqrstuwxyz]{59})$/,
  iota: /^(iota1[a-z0-9]{59}|[A-Z9]{81,90})$/,
  neo: /^A[0-9a-zA-Z]{33}$/,
  'neo-gas': /^A[0-9a-zA-Z]{33}$/,
  komodo: /^R[0-9a-zA-Z]{33}$/,
  decred: /^D[ksecS][0-9a-zA-Z]{33}$/,
  stratis: /^S[0-9a-zA-Z]{33}$/,
  ark: /^A[0-9a-zA-Z]{33}$/
}

// Currency information for better error messages
const CURRENCY_INFO: Record<string, { name: string; network: string; addressType: string }> = {
  BTC: { name: 'Bitcoin', network: 'Bitcoin', addressType: 'Legacy, SegWit, or Bech32 address' },
  ETH: { name: 'Ethereum', network: 'Ethereum', addressType: 'Ethereum address' },
  USDT: { name: 'Tether (Ethereum)', network: 'Ethereum', addressType: 'Ethereum address' },
  USDC: { name: 'USD Coin (Ethereum)', network: 'Ethereum', addressType: 'Ethereum address' },
  USDT_ERC20: { name: 'Tether (ERC-20)', network: 'Ethereum', addressType: 'Ethereum address' },
  USDC_ERC20: { name: 'USD Coin (ERC-20)', network: 'Ethereum', addressType: 'Ethereum address' },
  DAI: { name: 'Dai', network: 'Ethereum', addressType: 'Ethereum address' },
  PYUSD: { name: 'PayPal USD', network: 'Ethereum', addressType: 'Ethereum address' },
  ETHBASE: { name: 'Ethereum (Base)', network: 'Base', addressType: 'Base address' },
  USDCBASE: { name: 'USD Coin (Base)', network: 'Base', addressType: 'Base address' },
  BNB: { name: 'BNB', network: 'BSC', addressType: 'BSC address' },
  BNBBSC: { name: 'BNB (BSC)', network: 'BSC', addressType: 'BSC address' },
  USDTBSC: { name: 'Tether (BSC)', network: 'BSC', addressType: 'BSC address' },
  USDCBSC: { name: 'USD Coin (BSC)', network: 'BSC', addressType: 'BSC address' },
  SOL: { name: 'Solana', network: 'Solana', addressType: 'Solana address' },
  USDTSOL: { name: 'Tether (Solana)', network: 'Solana', addressType: 'Solana address' },
  USDCSOL: { name: 'USD Coin (Solana)', network: 'Solana', addressType: 'Solana address' },
  TRX: { name: 'TRON', network: 'TRON', addressType: 'TRON address' },
  USDTTRC20: { name: 'Tether (TRC-20)', network: 'TRON', addressType: 'TRON address' },
  TON: { name: 'Toncoin', network: 'TON', addressType: 'TON address (multiple formats)' },
  USDTTON: { name: 'Tether (TON)', network: 'TON', addressType: 'TON address' },
  AVAX: { name: 'Avalanche', network: 'Avalanche', addressType: 'Avalanche address' },
  AVAXC: { name: 'Avalanche (AVAXC)', network: 'Avalanche', addressType: 'Avalanche address' },
  DOGE: { name: 'Dogecoin', network: 'Dogecoin', addressType: 'Dogecoin address' },
  XRP: { name: 'XRP', network: 'XRP Ledger', addressType: 'XRP address' },
  SUI: { name: 'Sui', network: 'Sui', addressType: 'Sui address' },
  LTC: { name: 'Litecoin', network: 'Litecoin', addressType: 'Legacy or Bech32 address' },
  ADA: { name: 'Cardano', network: 'Cardano', addressType: 'Cardano address (multiple formats)' },
  DOT: { name: 'Polkadot', network: 'Polkadot', addressType: 'Polkadot SS58 address' },
  MATIC: { name: 'Polygon', network: 'Polygon', addressType: 'Polygon address' },
  USDCMATIC: { name: 'USD Coin (Polygon)', network: 'Polygon', addressType: 'Polygon address' },
  USDTMATIC: { name: 'Tether (Polygon)', network: 'Polygon', addressType: 'Polygon address' },
  APT: { name: 'Aptos', network: 'Aptos', addressType: 'Aptos account address (0x + 64 hex)' },
  LINK: { name: 'Chainlink', network: 'Ethereum', addressType: 'Ethereum address' },
  UNI: { name: 'Uniswap', network: 'Ethereum', addressType: 'Ethereum address' },
  AAVE: { name: 'Aave', network: 'Ethereum', addressType: 'Ethereum address' },
  ALGO: { name: 'Algorand', network: 'Algorand', addressType: 'Algorand address' },
  USDCALGO: { name: 'USD Coin (Algorand)', network: 'Algorand', addressType: 'Algorand address' },
  ARB: { name: 'Arbitrum', network: 'Arbitrum', addressType: 'Arbitrum address' },
  USDTARB: { name: 'Tether (Arbitrum)', network: 'Arbitrum', addressType: 'Arbitrum address' },
  USDCARB: { name: 'USD Coin (Arbitrum)', network: 'Arbitrum', addressType: 'Arbitrum address' },
  OP: { name: 'Optimism', network: 'Optimism', addressType: 'Optimism address' },
  USDTOP: { name: 'Tether (Optimism)', network: 'Optimism', addressType: 'Optimism address' },
  USDCOP: { name: 'USD Coin (Optimism)', network: 'Optimism', addressType: 'Optimism address' },
  ZKSYNC: { name: 'Ethereum (zkSync Era)', network: 'zkSync Era', addressType: 'Ethereum address' },
  ZK: { name: 'zkSync', network: 'zkSync Era', addressType: 'Ethereum address' },
  RUNE: { name: 'THORChain (RUNE)', network: 'THORChain', addressType: 'THORChain address (thor1...)' },
  ATOM: { name: 'Cosmos', network: 'Cosmos', addressType: 'Cosmos address' },
  FIL: { name: 'Filecoin', network: 'Filecoin', addressType: 'Filecoin address' },
  ICP: { name: 'Internet Computer', network: 'Internet Computer', addressType: 'ICP principal address' },
  NEAR: { name: 'NEAR Protocol', network: 'NEAR', addressType: 'NEAR address (hex or .near format)' },
  VET: { name: 'VeChain', network: 'VeChain', addressType: 'VeChain address' },
  XLM: { name: 'Stellar', network: 'Stellar', addressType: 'Stellar address' },
  XTZ: { name: 'Tezos', network: 'Tezos', addressType: 'Tezos address' },
  THETA: { name: 'Theta', network: 'Theta', addressType: 'Theta address' },
  FLOW: { name: 'Flow', network: 'Flow', addressType: 'Flow address' },
  EGLD: { name: 'Elrond', network: 'Elrond', addressType: 'Elrond address' },
  HBAR: { name: 'Hedera', network: 'Hedera', addressType: 'Hedera account ID' },
  XMR: { name: 'Monero', network: 'Monero', addressType: 'Monero address (multiple formats)' },
  ZEC: { name: 'Zcash', network: 'Zcash', addressType: 'Zcash address (transparent or shielded)' },
  DASH: { name: 'Dash', network: 'Dash', addressType: 'Dash address' },
  BCH: { name: 'Bitcoin Cash', network: 'Bitcoin Cash', addressType: 'Bitcoin Cash address (multiple formats)' },
  BSV: { name: 'Bitcoin SV', network: 'Bitcoin SV', addressType: 'Bitcoin SV address' },
  ETC: { name: 'Ethereum Classic', network: 'Ethereum Classic', addressType: 'Ethereum Classic address' },
  ZIL: { name: 'Zilliqa', network: 'Zilliqa', addressType: 'Zilliqa address (multiple formats)' },
  ONT: { name: 'Ontology', network: 'Ontology', addressType: 'Ontology address' },
  QTUM: { name: 'Qtum', network: 'Qtum', addressType: 'Qtum address' },
  ICX: { name: 'ICON', network: 'ICON', addressType: 'ICON address' },
  WAVES: { name: 'Waves', network: 'Waves', addressType: 'Waves address' },
  LSK: { name: 'Lisk', network: 'Lisk', addressType: 'Lisk address' },
  NANO: { name: 'Nano', network: 'Nano', addressType: 'Nano address (nano_ or xrb_ format)' },
  IOTA: { name: 'IOTA', network: 'IOTA', addressType: 'IOTA address (multiple formats)' },
  NEO: { name: 'NEO', network: 'NEO', addressType: 'NEO address' },
  GAS: { name: 'NEO Gas', network: 'NEO', addressType: 'NEO address' },
  KMD: { name: 'Komodo', network: 'Komodo', addressType: 'Komodo address' },
  DCR: { name: 'Decred', network: 'Decred', addressType: 'Decred address' },
  STRAT: { name: 'Stratis', network: 'Stratis', addressType: 'Stratis address' },
  ARK: { name: 'Ark', network: 'Ark', addressType: 'Ark address' }
}

// Heuristic fallback to derive validation patterns for approved currencies
function derivePatternForCurrency(code: string): RegExp | null {
  const u = code.toUpperCase();
  const ETH_LIKE = /^0x[a-fA-F0-9]{40}$/;
  const SOLANA = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  const TRON = /^T[A-Za-z1-9]{33}$/;
  const TON = /^(0:[a-fA-F0-9]{64}|[A-Za-z0-9\-_]{48}|UQ[A-Za-z0-9\-_]{46})$/;
  const ALGO = /^[A-Z2-7]{58}$/;

  // Common suffix/prefix heuristics
  if (u.endsWith('BSC') || u.includes('ERC20') || u.includes('ARB') || u.includes('BASE') ||
      u.includes('OP') || u.includes('MATIC') || u.includes('ARC20') || u.includes('CELO')) {
    return ETH_LIKE;
  }
  if (u.includes('TRC20')) return TRON;
  if (u.includes('SOL')) return SOLANA;
  if (u.includes('TON')) return TON;
  if (u.includes('ALGO')) return ALGO;

  // Specific chains/tokens
  switch (u) {
    case 'XDC':
      return /^(0x|xdc)[a-fA-F0-9]{40}$/;
    case 'ONE':
      return /^one1[0-9a-z]{38}$/;
    case 'STX':
      return /^S[PM][A-Za-z0-9]{33,38}$/;
    case 'INJ':
    case 'INJMAINNET':
      return /^inj[0-9a-z]{39}$/;
    case 'INJERC20':
      return ETH_LIKE;
    case 'IOTX':
      return /^io1[0-9a-z]{38,59}$/;
    case 'KAS':
      return /^(kaspa:)?q[a-z0-9]{60,62}$/;
    case 'VLX':
      return ETH_LIKE;
    case 'CFX':
    case 'CFXMAINNET':
      return /^(cfx:[a-z0-9:]+|0x[a-fA-F0-9]{40})$/;
    case 'CRO':
    case 'CROMAINNET':
      return ETH_LIKE;
    case 'PLS':
      return ETH_LIKE;
    case 'OKB':
    case 'OMG':
    case 'AAVE':
    case 'LINK':
    case 'KNC':
    case 'BAT':
    case 'ENJ':
    case 'MANA':
    case 'SNT':
    case 'ZRX':
    case 'RLC':
    case 'LRC':
    case 'POLY':
    case 'CVC':
    case 'MCO':
    case 'MTL':
    case 'REP':
    case 'KCS':
    case 'BNT':
    case 'SHIB':
    case 'APE':
    case 'SAND':
    case 'CRO':
    case 'FTM':
    case 'GRT':
    case 'YFI':
    case 'OCEAN':
    case 'OKT':
    case 'ZROERC20':
    case 'ZROARB':
    case 'GALAERC20':
    case 'ETHARB':
    case 'BRETTBASE':
    case 'OPUSDCE':
    case 'MATICUSDCE':
    case 'USDTARC20':
    case 'USDTERC20':
    case 'USDTCELO':
    case 'USDCARC20':
    case 'USDCBASE':
    case 'USDTOP':
    case 'USDCOP':
    case 'USDTBSC':
    case 'USDCBSC':
    case 'USDTMATIC':
    case 'USDCMATIC':
    case 'WBTCMATIC':
    case 'VLX':
    case 'KAIA':
    case 'ZK':
    case 'ZKSYNC':
    case 'FTMMAINNET':
    case 'MATICMAINNET':
    case 'BUSDBSC':
    case 'FRONT':
    case 'FUN':
    case 'JASMY':
    case 'OKBMAINNET':
    case 'ZBCERC20':
      return ETH_LIKE;
    case 'SEI':
      return /^sei1[0-9a-z]{38}$/;
    case 'LUNC':
      return /^terra[0-9a-z]{39}$/;
    case 'XDCNETWORK':
      return /^(0x|xdc)[a-fA-F0-9]{40}$/;
    case 'TRUMP':
    case 'PEPE':
    case '1INCH':
    case 'AXS':
    case 'ARV':
    case 'BERA':
    case 'BAZED':
    case 'VERSE':
    case 'VELO':
    case 'XYO':
    case 'OKBCHAIN':
      return ETH_LIKE;
    case 'ZBC':
      return SOLANA;
    case 'LGCY':
      return TRON;
    case 'MYRO':
      return SOLANA;
    case 'WBTCMATIC':
      return ETH_LIKE;
    case 'JETTON':
    case 'NOT':
      return TON;
    default:
      // Last resort: assume EVM for unknown ERC-20 style tokens
      return ETH_LIKE;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { currency, address, extra_id } = await request.json()

    console.log(`🔍 Validating ${currency} - Address: ${address}, Extra ID: ${extra_id}`)

    if (!currency || !address) {
      console.log(`❌ Missing currency or address`)
      return NextResponse.json({
        success: false,
        validation: {
          valid: false,
          error: 'Currency and address are required'
        }
      })
    }

    const upperCurrency = currency.toUpperCase()
    const trimmedAddress = address.trim()

    // Check for a direct pattern first; otherwise derive heuristically
    let pattern = ADDRESS_PATTERNS[upperCurrency]
    if (!pattern) {
      pattern = derivePatternForCurrency(upperCurrency) || null
    }
    if (!pattern) {
      console.log(`❌ No validation pattern found for currency: ${upperCurrency}`)
      return NextResponse.json({
        success: true,
        validation: {
          valid: false,
          error: `Validation not supported for ${upperCurrency}`
        }
      })
    }

    // Validate the address against the pattern
    const addressValid = pattern.test(trimmedAddress)
    const currencyInfo = CURRENCY_INFO[upperCurrency]
    let addressError = null;
    
    if (!addressValid) {
      addressError = `Invalid ${currencyInfo?.addressType || upperCurrency + ' address'} format`;
    }

    // Validate extra_id format only if provided (optional per NOWPayments)
    let extraIdValid = true;
    let extraIdError = null;

    if (requiresExtraId(currency)) {
      if (extra_id && extra_id.trim()) {
        if (!validateExtraId(currency, extra_id.trim())) {
          extraIdValid = false;
          extraIdError = `Invalid ${getExtraIdLabel(currency)} format for ${currency}`;
        }
      }
      // If not provided, treat as optional and valid
    }

    const isValid = addressValid && extraIdValid;

    console.log(`✅ Validation result - Address: ${addressValid ? 'VALID' : 'INVALID'}, Extra ID: ${extraIdValid ? 'VALID' : 'INVALID'}`)

    return NextResponse.json({
      success: true,
      validation: {
        valid: isValid,
        currency: upperCurrency,
        address: trimmedAddress,
        extra_id: extra_id?.trim() || null,
        network: currencyInfo?.network || 'Unknown',
        addressType: currencyInfo?.addressType || 'Address',
        error: isValid ? null : (addressError || extraIdError)
      }
    })

  } catch (error) {
    console.error('💥 Address validation error:', error)
    return NextResponse.json({
      success: false,
      validation: {
        valid: false,
        error: 'Internal validation error'
      }
    }, { status: 500 })
  }
}
