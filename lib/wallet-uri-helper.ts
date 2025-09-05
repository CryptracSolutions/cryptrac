import { WALLET_URI_OVERRIDES } from './wallet-uri-overrides';
import { getRoundedAmount } from './crypto-uri-builder';

export function detectWalletHint(): string {
  if (typeof window === 'undefined') return '';
  // Provider inspection (more reliable than UA)
  const eth: any = (window as any).ethereum;
  if (eth) {
    if (eth.isMetaMask) return 'MetaMask';
    if (eth.isTrust) return 'Trust Wallet';
    if (eth.isCoinbaseWallet) return 'Coinbase Wallet';
    if (eth.isOkxWallet || eth.isOKExWallet) return 'OKX Wallet';
    if (eth.isPhantom) return 'Phantom';
  }
  const phantom = (window as any).phantom?.solana;
  if (phantom?.isPhantom) return 'Phantom';

  // User-agent fallback
  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('metamask')) return 'MetaMask';
    if (ua.includes('trust')) return 'Trust Wallet';
    if (ua.includes('phantom')) return 'Phantom';
    if (ua.includes('okx')) return 'OKX Wallet';
    if (ua.includes('coinbase')) return 'Coinbase Wallet';
  }
  return '';
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
  const entry = WALLET_URI_OVERRIDES[currency.toUpperCase() as keyof typeof WALLET_URI_OVERRIDES];
  if (!entry) return null;
  const override = entry.overrides.find(o => o.wallet === walletHint);
  if (!override) return null;

  const rounded = getRoundedAmount(amount);
  let uri = override.scheme;
  uri = uri.replace('{address}', address)
           .replace('{amount}', rounded.toString())
           .replace('{wei}', BigInt(Math.floor(amount * 1e18)).toString())
           .replace('{microalgos}', (amount * 1e6).toFixed(0))
           .replace('{nanoton}', (amount * 1e9).toFixed(0));
  if (extraId) uri = uri.replace(/\{extraId}/g, extraId);
  return uri;
}
