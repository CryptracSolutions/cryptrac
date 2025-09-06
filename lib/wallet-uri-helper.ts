import { WALLET_URI_OVERRIDES } from './wallet-uri-overrides';
import { getRoundedAmount, buildCryptoPaymentURI } from './crypto-uri-builder';
import { detectPlatform } from './platform';

// Advanced multi-wallet detection and best-URI selection
export interface WalletInfo {
  name: string;
  detected: boolean;
  priority: number;
  supportedChains: string[];
  preferredScheme: 'standard' | 'proprietary';
}

export interface URICandidate {
  uri: string;
  quality: number;
  source: 'wallet-specific' | 'standard' | 'address-only';
  guaranteesAmount: boolean;
  guaranteesExtraId: boolean;
}

interface EthereumProvider {
  isPhantom?: boolean;
  isMetaMask?: boolean;
  isTrust?: boolean;
  isCoinbaseWallet?: boolean;
  isOkxWallet?: boolean;
  isOKExWallet?: boolean;
}

interface WindowWithEthereum extends Window {
  ethereum?: EthereumProvider;
  phantom?: {
    solana?: {
      isPhantom?: boolean;
    };
  };
}

export function detectWalletHint(): string {
  if (typeof window === 'undefined') return '';
  
  // Provider inspection (more reliable than UA)
  const eth = (window as WindowWithEthereum).ethereum;
  if (eth) {
    // Check Phantom first (it can also set isMetaMask in some environments)
    if (eth.isPhantom) return 'Phantom';
    if (eth.isMetaMask && !eth.isPhantom) return 'MetaMask';
    if (eth.isTrust) return 'Trust Wallet';
    if (eth.isCoinbaseWallet) return 'Coinbase Wallet';
    if (eth.isOkxWallet || eth.isOKExWallet) return 'OKX Wallet';
  }
  
  // Check Phantom Solana provider
  const phantom = (window as WindowWithEthereum).phantom?.solana;
  if (phantom?.isPhantom) return 'Phantom';

  // User-agent fallback
  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('phantom')) return 'Phantom';
    if (ua.includes('metamask')) return 'MetaMask';
    if (ua.includes('trust')) return 'Trust Wallet';
    if (ua.includes('okx')) return 'OKX Wallet';
    if (ua.includes('coinbase') || ua.includes('base wallet')) return 'Coinbase Wallet';
    if (ua.includes('binance')) return 'Binance App';
    if (ua.includes('kraken')) return 'Kraken App';
    if (ua.includes('gemini')) return 'Gemini App';
    if (ua.includes('kucoin')) return 'KuCoin App';
    if (ua.includes('bybit')) return 'Bybit App';
    if (ua.includes('gate.io') || ua.includes('gateio')) return 'Gate.io App';
    if (ua.includes('bitget')) return 'Bitget App';
    if (ua.includes('ledgerlive') || ua.includes('ledger live')) return 'Ledger Live';
    if (ua.includes('trezor')) return 'Trezor Suite';
  }
  
  return '';
}

// Detect all wallets present with a basic priority order and chain support
export function detectAllWallets(): WalletInfo[] {
  const wallets: WalletInfo[] = [];
  if (typeof window === 'undefined') return wallets;

  const eth = (window as WindowWithEthereum).ethereum;
  const phantom = (window as WindowWithEthereum).phantom?.solana || (window as WindowWithEthereum).phantom;
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';

  if (eth?.isPhantom) {
    wallets.push({
      name: 'Phantom',
      detected: true,
      priority: 1,
      supportedChains: ['ethereum', 'solana', 'polygon', 'base'],
      preferredScheme: 'proprietary'
    });
  }

  if ((phantom as Record<string, unknown>)?.isPhantom && !wallets.find(w => w.name === 'Phantom')) {
    wallets.push({
      name: 'Phantom',
      detected: true,
      priority: 1,
      supportedChains: ['solana', 'ethereum'],
      preferredScheme: 'proprietary'
    });
  }

  if (eth?.isMetaMask && !eth?.isPhantom) {
    wallets.push({
      name: 'MetaMask',
      detected: true,
      priority: 2,
      supportedChains: ['ethereum', 'bsc', 'polygon', 'arbitrum', 'optimism', 'base'],
      preferredScheme: 'proprietary'
    });
  }

  if (eth?.isTrust) {
    wallets.push({
      name: 'Trust Wallet',
      detected: true,
      priority: 3,
      supportedChains: ['bitcoin', 'ethereum', 'bsc', 'polygon', 'solana', 'tron', 'arbitrum', 'optimism', 'base'],
      preferredScheme: 'proprietary'
    });
  }

  if (eth?.isCoinbaseWallet) {
    wallets.push({
      name: 'Coinbase Wallet',
      detected: true,
      priority: 4,
      supportedChains: ['bitcoin', 'ethereum', 'base', 'polygon', 'arbitrum', 'optimism'],
      preferredScheme: 'proprietary'
    });
  }

  if (eth?.isOkxWallet || eth?.isOKExWallet) {
    wallets.push({
      name: 'OKX Wallet',
      detected: true,
      priority: 5,
      supportedChains: ['bitcoin', 'ethereum', 'bsc', 'polygon', 'arbitrum', 'optimism', 'tron'],
      preferredScheme: 'proprietary'
    });
  }

  // UA-based mobile wallet and exchange app detection (best-effort)
  if (ua.includes('coinbase')) {
    wallets.push({ name: 'Coinbase Wallet', detected: true, priority: 4, supportedChains: ['bitcoin', 'ethereum', 'base', 'polygon', 'arbitrum', 'optimism'], preferredScheme: 'proprietary' });
  }
  if (ua.includes('base wallet')) {
    wallets.push({ name: 'Coinbase Wallet', detected: true, priority: 4, supportedChains: ['bitcoin', 'ethereum', 'base', 'polygon', 'arbitrum', 'optimism'], preferredScheme: 'proprietary' });
  }
  if (ua.includes('binance')) {
    wallets.push({ name: 'Binance App', detected: true, priority: 6, supportedChains: ['bitcoin', 'ethereum', 'bsc', 'tron'], preferredScheme: 'proprietary' });
  }
  if (ua.includes('okx')) {
    wallets.push({ name: 'OKX Wallet', detected: true, priority: 5, supportedChains: ['ethereum', 'bsc', 'polygon', 'arbitrum', 'optimism', 'tron'], preferredScheme: 'proprietary' });
  }
  if (ua.includes('kraken')) {
    wallets.push({ name: 'Kraken App', detected: true, priority: 7, supportedChains: ['bitcoin', 'ethereum'], preferredScheme: 'standard' });
  }
  if (ua.includes('gemini')) {
    wallets.push({ name: 'Gemini App', detected: true, priority: 8, supportedChains: ['bitcoin', 'ethereum'], preferredScheme: 'standard' });
  }
  if (ua.includes('kucoin')) {
    wallets.push({ name: 'KuCoin App', detected: true, priority: 9, supportedChains: ['bitcoin', 'ethereum'], preferredScheme: 'standard' });
  }
  if (ua.includes('bybit')) {
    wallets.push({ name: 'Bybit App', detected: true, priority: 10, supportedChains: ['bitcoin', 'ethereum'], preferredScheme: 'standard' });
  }
  if (ua.includes('gate.io') || ua.includes('gateio')) {
    wallets.push({ name: 'Gate.io App', detected: true, priority: 11, supportedChains: ['bitcoin', 'ethereum'], preferredScheme: 'standard' });
  }
  if (ua.includes('bitget')) {
    wallets.push({ name: 'Bitget App', detected: true, priority: 12, supportedChains: ['bitcoin', 'ethereum'], preferredScheme: 'standard' });
  }
  if (ua.includes('ledgerlive') || ua.includes('ledger live')) {
    wallets.push({ name: 'Ledger Live', detected: true, priority: 13, supportedChains: ['bitcoin', 'ethereum'], preferredScheme: 'proprietary' });
  }
  if (ua.includes('trezor')) {
    wallets.push({ name: 'Trezor Suite', detected: true, priority: 14, supportedChains: ['bitcoin', 'ethereum'], preferredScheme: 'standard' });
  }

  return wallets.sort((a, b) => a.priority - b.priority);
}

function getCurrencyChain(currency: string): string {
  const c = currency.toUpperCase();
  if (['ETH', 'USDT', 'USDC', 'DAI', 'PYUSD'].includes(c)) return 'ethereum';
  if (c.includes('BSC') || c === 'BNB') return 'bsc';
  if (c === 'MATIC' || c.includes('MATIC')) return 'polygon';
  if (c === 'ARB' || c.includes('ARB')) return 'arbitrum';
  if (c === 'OP' || c.includes('OP')) return 'optimism';
  if (c.includes('BASE')) return 'base';
  if (c === 'SOL' || c.includes('SOL')) return 'solana';
  if (c === 'TRX' || c.includes('TRC20')) return 'tron';
  if (['BTC','BCH','LTC','DOGE','DASH','ZEC','RVN','KAS'].includes(c)) return 'bitcoin';
  return c.toLowerCase();
}

export function getBestWalletForCurrency(currency: string): string {
  const wallets = detectAllWallets();
  const chain = getCurrencyChain(currency);
  const compatible = wallets.find(w => w.detected && w.supportedChains.includes(chain));
  return compatible?.name || detectWalletHint() || '';
}

export function buildWalletSpecificURI(params: {
  currency: string;
  address: string;
  amount: number;
  extraId?: string;
  walletHint?: string;
}): string | null {
  const { currency, address, amount, extraId } = params;
  const walletHint = params.walletHint || detectWalletHint();

  console.log('Building wallet-specific URI:', { currency, walletHint, amount });

  const entry = WALLET_URI_OVERRIDES[currency.toUpperCase() as keyof typeof WALLET_URI_OVERRIDES];
  if (!entry) {
    console.log('No wallet overrides found for currency:', currency);
    return null;
  }
  const override = entry.overrides.find(o => o.wallet === walletHint);
  if (!override) {
    console.log('No override found for wallet:', walletHint, 'Available:', entry.overrides.map(o => o.wallet));
    return null;
  }

  const rounded = getRoundedAmount(amount);
  const standard = buildCryptoPaymentURI({ currency, address, amount, extraId, label: undefined, message: undefined }).uri;
  // Build entry default URI (if provided) to support tokens needing ERC-20 paths
  let defaultUriFilled = '';
  try {
    if (entry.default_uri) {
      defaultUriFilled = (entry.default_uri as string)
        .replace('{address}', address)
        .replace('{amount}', rounded.toString())
        .replace('{wei}', BigInt(Math.floor(amount * 1e18)).toString())
        .replace('{microalgos}', (amount * 1e6).toFixed(0))
        .replace('{nanoton}', (amount * 1e9).toFixed(0));
      if (extraId) defaultUriFilled = defaultUriFilled.replace(/\{extraId}/g, extraId);
    }
  } catch {}
  let uri: string = override.scheme as string;

  // Special marker: BINANCE_PAY_API -> not a direct URI, requires API integration; skip returning
  if (/^BINANCE_PAY_API/i.test(uri)) {
    console.warn('Binance Pay requires API integration; skipping direct deeplink for', currency);
    return null;
  }

  // Placeholder replacement
  uri = uri.replace('{address}', address)
           .replace('{amount}', rounded.toString())
           .replace('{wei}', BigInt(Math.floor(amount * 1e18)).toString())
           .replace('{microalgos}', (amount * 1e6).toFixed(0))
           .replace('{nanoton}', (amount * 1e9).toFixed(0))
           .replace('{STANDARD_URI_ENCODED}', encodeURIComponent(standard))
           .replace('{STANDARD_URI}', standard)
           .replace('{DEFAULT_URI_ENCODED}', encodeURIComponent(defaultUriFilled || standard))
           .replace('{DEFAULT_URI}', defaultUriFilled || standard)
           .replace('{encodedPaymentUrl}', encodeURIComponent(defaultUriFilled || standard));
  if (extraId) uri = uri.replace(/\{extraId}/g, extraId);

  console.log('Generated wallet-specific URI:', uri);
  return uri;
}

// Multi-level candidate URI builder with simple scoring
export function buildBestURI(params: {
  currency: string;
  address: string;
  amount: number;
  extraId?: string;
}): URICandidate {
  const candidates: URICandidate[] = [];
  const platform = detectPlatform();

  // 1) Primary wallet-specific based on best wallet for the currency
  const walletHint = getBestWalletForCurrency(params.currency);
  const primaryWalletURI = buildWalletSpecificURI({ ...params, walletHint });
  if (primaryWalletURI) {
    candidates.push(scoreCandidate(primaryWalletURI, 'wallet-specific', params, platform));
  }

  // 2) Alternative wallet schemes for other detected wallets
  const allWallets = detectAllWallets();
  for (const w of allWallets) {
    const alt = buildWalletSpecificURI({ ...params, walletHint: w.name });
    if (alt && alt !== primaryWalletURI) {
      candidates.push(scoreCandidate(alt, 'wallet-specific', params, platform));
    }
  }

  // 3) Standard URI
  const standard = buildCryptoPaymentURI(params);
  candidates.push(scoreCandidate(standard.uri, 'standard', params, platform, {
    hasAmount: standard.includesAmount,
    hasExtraId: standard.includesExtraId,
  }));

  // 4) Address-only
  candidates.push(scoreCandidate(params.address, 'address-only', params, platform, { hasAmount: false, hasExtraId: false }));

  return candidates.sort((a, b) => b.quality - a.quality)[0];
}

function scoreCandidate(
  uri: string,
  source: URICandidate['source'],
  params: { currency: string; extraId?: string },
  platform: ReturnType<typeof detectPlatform>,
  flags?: { hasAmount?: boolean; hasExtraId?: boolean }
): URICandidate {
  const hasAmount = flags?.hasAmount ?? true;
  const hasExtraId = flags?.hasExtraId ?? !!params.extraId;

  let quality = 0;
  if (source === 'wallet-specific') quality = 80;
  else if (source === 'standard') quality = 60;
  else quality = 20;

  if (hasAmount) quality += 10; else quality -= 10;
  if (params.extraId) quality += hasExtraId ? 5 : -10;

  // EVM: chainId presence generally improves accuracy
  if (/chainId=\d+/.test(uri)) quality += 5;

  // Platform-specific tuning
  if (platform.isIOS) {
    // iOS prefers universal links over custom schemes
    if (/^https:/.test(uri)) quality += 10;
    if (/^[a-z]+:/.test(uri) && !/^https:/.test(uri)) quality -= 3;
  } else if (platform.isAndroid) {
    // Android is fine with custom schemes
    if (/^[a-z]+:/.test(uri) && !/^https:/.test(uri)) quality += 5;
  } else if (platform.isDesktop) {
    // Desktop browser extensions handle standard schemes well
    if (/^ethereum:/.test(uri)) quality += 5;
  }

  return {
    uri,
    quality,
    source,
    guaranteesAmount: hasAmount,
    guaranteesExtraId: params.extraId ? hasExtraId : false,
  };
}

// Optional helper for platform-optimized URIs when a specific strategy is desired
export function buildPlatformOptimizedURI(params: {
  currency: string;
  address: string;
  amount: number;
  extraId?: string;
}): string {
  const platform = detectPlatform();
  const walletHint = getBestWalletForCurrency(params.currency);
  // iOS: aim for universal links when available via overrides
  if (platform.isIOS) {
    const w = buildWalletSpecificURI({ ...params, walletHint });
    return w || buildCryptoPaymentURI(params).uri;
  }
  // Android: custom schemes acceptable
  if (platform.isAndroid) {
    const w = buildWalletSpecificURI({ ...params, walletHint });
    return w || buildCryptoPaymentURI(params).uri;
  }
  // Desktop: standard URIs play nice with extensions
  return buildCryptoPaymentURI(params).uri;
}
