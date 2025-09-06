export interface URIValidationResult {
  isValid: boolean;
  walletCompatibility: Record<string, boolean>;
  amountDetected: boolean;
  addressDetected: boolean;
  extraIdDetected: boolean;
  issues: string[];
}

export async function validateURI(
  uri: string,
  expected: { currency: string; address: string; amount: number; extraId?: string }
): Promise<URIValidationResult> {
  const result: URIValidationResult = {
    isValid: true,
    walletCompatibility: {},
    amountDetected: false,
    addressDetected: false,
    extraIdDetected: false,
    issues: [],
  };

  try {
    // Basic parse to catch malformed URIs; fallback if it's address-only
    if (uri.includes(':')) {
      new URL(uri);
    }

    // Address detection (substring match for robustness across schemes)
    result.addressDetected = uri.toLowerCase().includes(expected.address.toLowerCase());
    if (!result.addressDetected) {
      result.issues.push('Address not found in URI');
    }

    // Amount detection
    const asDecimal = expected.amount.toString();
    const asWei = (() => {
      try { return BigInt(Math.floor(expected.amount * 1e18)).toString(); } catch { return ''; }
    })();
    result.amountDetected = uri.includes(asDecimal) || (!!asWei && uri.includes(asWei));
    if (!result.amountDetected) {
      result.issues.push('Amount not found in URI');
    }

    // Extra ID detection
    if (expected.extraId) {
      result.extraIdDetected = uri.includes(expected.extraId);
      if (!result.extraIdDetected) {
        result.issues.push('Extra ID not found in URI');
      }
    }

    // Wallet compatibility heuristic checks
    result.walletCompatibility = await testWalletCompatibility(uri);
  } catch (e: unknown) {
    result.isValid = false;
    result.issues.push(`Invalid URI format: ${e instanceof Error ? e.message : 'unknown error'}`);
  }

  if (result.issues.length > 0) result.isValid = false;
  return result;
}

async function testWalletCompatibility(uri: string): Promise<Record<string, boolean>> {
  const compatibility: Record<string, boolean> = {};
  compatibility['MetaMask'] = /^(ethereum:|metamask:|https:\/\/metamask\.app\.link)/.test(uri);
  compatibility['Trust Wallet'] = /^(https:\/\/link\.trustwallet\.com|trust:|bitcoin:|ethereum:|solana:|tron:)/.test(uri);
  compatibility['Phantom'] = /^(solana:|ethereum:)/.test(uri); // prefer standards; deprecated phantom:// excluded
  compatibility['Coinbase Wallet'] = /^(https:\/\/go\.cb-w\.com|ethereum:|bitcoin:)/.test(uri);
  compatibility['Ledger Live'] = /^(ledgerlive:|bitcoin:|ethereum:)/.test(uri);
  compatibility['Trezor Suite'] = /^(https:\/\/suite\.trezor\.io|bitcoin:|ethereum:)/.test(uri);
  compatibility['OKX Wallet'] = /^(okx:\/\/wallet\/dapp\/url|https:\/\/web3\.okx\.com\/download|bitcoin:|ethereum:|solana:)/.test(uri);
  compatibility['Binance App'] = /^(bitcoin:|ethereum:|solana:|tron:)/.test(uri);
  compatibility['Kraken App'] = /^(bitcoin:|ethereum:)/.test(uri);
  compatibility['Gemini App'] = /^(bitcoin:|ethereum:)/.test(uri);
  compatibility['KuCoin App'] = /^(bitcoin:|ethereum:)/.test(uri);
  compatibility['Bybit App'] = /^(bitcoin:|ethereum:)/.test(uri);
  compatibility['Gate.io App'] = /^(bitcoin:|ethereum:)/.test(uri);
  compatibility['Bitget App'] = /^(bitcoin:|ethereum:)/.test(uri);
  return compatibility;
}
