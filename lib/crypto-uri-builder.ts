/**
 * Comprehensive cryptocurrency URI builder for QR code generation
 * 
 * This utility creates standardized payment URIs that can be embedded in QR codes
 * to allow wallets to auto-populate recipient address, amount, and other payment details.
 * 
 * Follows established standards:
 * - BIP-21 for Bitcoin and Bitcoin-like currencies
 * - EIP-831 for Ethereum and ERC-20 tokens
 * - SEP-0007 for Stellar payments
 * - Custom schemes for other networks following established patterns
 */

export interface CryptoPaymentRequest {
  currency: string;
  address: string;
  amount: number;
  extraId?: string; // Destination tag, memo, etc.
  label?: string; // Optional label for the payment
  message?: string; // Optional message/description
}

export interface URIResult {
  uri: string;
  includesAmount: boolean;
  includesExtraId: boolean;
  scheme: string;
  fallbackAddress: string;
}

// Utility: round a number UP to a fixed number of decimals
function roundUp(amount: number, decimals: number): number {
  const f = Math.pow(10, decimals);
  return Math.ceil((amount + Number.EPSILON) * f) / f;
}

// Utility: format with up to `maxDecimals` decimals, trimming trailing zeros
function formatAmount(amount: number, maxDecimals = 6): string {
  const rounded = roundUp(amount, maxDecimals);
  // Use toFixed to ensure we have at most maxDecimals, then trim trailing zeros
  const fixed = rounded.toFixed(maxDecimals);
  return fixed.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
}

/**
 * Builds a comprehensive payment URI for the given cryptocurrency and parameters
 */
export function buildCryptoPaymentURI(request: CryptoPaymentRequest): URIResult {
  const { currency, address, amount, extraId, label, message } = request;
  const upper = currency.toUpperCase();
  
  // Handle currencies with destination tags/memos first
  if (extraId && requiresExtraId(upper)) {
    return buildExtraIdURI(upper, address, amount, extraId, label, message);
  }
  
  // Handle standard currencies
  return buildStandardURI(upper, address, amount, label, message);
}

/**
 * Builds URI for currencies that require destination tags/memos
 */
function buildExtraIdURI(
  currency: string,
  address: string,
  amount: number,
  extraId: string,
  label?: string,
  message?: string
): URIResult {
  let uri = '';
  let scheme = '';
  const amt = formatAmount(amount, 6);
  
  switch (currency) {
    case 'XRP':
      // XRP URI scheme: xrp:address?dt=tag&amount=amount
      scheme = 'xrp';
      uri = `${scheme}:${address}?dt=${extraId}&amount=${amt}`;
      if (label) uri += `&label=${encodeURIComponent(label)}`;
      if (message) uri += `&message=${encodeURIComponent(message)}`;
      break;
      
    case 'XLM':
      // Stellar SEP-0007: Prefer web+stellar for broad wallet compatibility
      // web+stellar:pay?destination=address&amount=amount&memo=...&memo_type=MEMO_ID|MEMO_TEXT
      scheme = 'web+stellar';
      const memo = String(extraId);
      const memoType = /^\d+$/.test(memo) ? 'MEMO_ID' : 'MEMO_TEXT';
      uri = `${scheme}:pay?destination=${encodeURIComponent(address)}&amount=${encodeURIComponent(amt)}&memo=${encodeURIComponent(memo)}&memo_type=${memoType}`;
      if (label) uri += `&label=${encodeURIComponent(label)}`;
      if (message) uri += `&message=${encodeURIComponent(message)}`;
      break;
      
    case 'HBAR':
      // Hedera URI scheme: hbar:address?memo=memo&amount=amount
      scheme = 'hbar';
      uri = `${scheme}:${address}?memo=${extraId}&amount=${amt}`;
      if (label) uri += `&label=${encodeURIComponent(label)}`;
      if (message) uri += `&message=${encodeURIComponent(message)}`;
      break;
      
    case 'EOS':
      // EOS URI scheme: eosio:address?memo=memo&amount=amount
      scheme = 'eosio';
      uri = `${scheme}:${address}?memo=${extraId}&amount=${amt}`;
      if (label) uri += `&label=${encodeURIComponent(label)}`;
      if (message) uri += `&message=${encodeURIComponent(message)}`;
      break;
      
    default:
      // Fallback for unknown currencies with extra ID - just return address
      scheme = 'address';
      uri = address;
  }
  
  return {
    uri,
    includesAmount: uri !== address,
    includesExtraId: uri !== address && uri.includes(extraId),
    scheme,
    fallbackAddress: address
  };
}

/**
 * Builds URI for standard currencies without destination tags/memos
 */
function buildStandardURI(
  currency: string,
  address: string,
  amount: number,
  label?: string,
  message?: string
): URIResult {
  let uri = '';
  let scheme = '';
  // All decimal-amount schemes should cap to 6 decimals to satisfy wallet limits
  const amt = formatAmount(amount, 6);
  
  switch (currency) {
    // Bitcoin and Bitcoin forks
    case 'BTC':
      scheme = 'bitcoin';
      uri = `${scheme}:${address}?amount=${amt}`;
      break;
      
    case 'LTC':
      scheme = 'litecoin';
      uri = `${scheme}:${address}?amount=${amt}`;
      break;
      
    case 'BCH':
      scheme = 'bitcoincash';
      uri = `${scheme}:${address}?amount=${amt}`;
      break;
      
    case 'DOGE':
      scheme = 'dogecoin';
      uri = `${scheme}:${address}?amount=${amt}`;
      break;
      
    // Ethereum and ERC-20 tokens
    case 'ETH':
      scheme = 'ethereum';
      // Convert amount to Wei for Ethereum URI
      const weiAmount = Math.floor(amount * Math.pow(10, 18));
      uri = `${scheme}:${address}?value=${weiAmount}`;
      break;
      
    // ERC-20 Stablecoins and tokens (use Ethereum scheme with contract address)
    case 'USDT':
    case 'USDTERC20':
      scheme = 'ethereum';
      // USDT contract address on Ethereum mainnet
      const usdtContract = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
      const usdtAmount = Math.floor(amount * Math.pow(10, 6)); // USDT has 6 decimals
      uri = `${scheme}:${usdtContract}/transfer?address=${address}&uint256=${usdtAmount}`;
      break;
      
    case 'USDC':
    case 'USDCERC20':
      scheme = 'ethereum';
      // USDC contract address on Ethereum mainnet  
      const usdcContract = '0xA0b86a33E6417a90ce6b8a82e7C2Ebd9f2F77F78';
      const usdcAmount = Math.floor(amount * Math.pow(10, 6)); // USDC has 6 decimals
      uri = `${scheme}:${usdcContract}/transfer?address=${address}&uint256=${usdcAmount}`;
      break;
      
    case 'DAI':
      scheme = 'ethereum';
      // DAI contract address on Ethereum mainnet
      const daiContract = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
      const daiAmount = Math.floor(amount * Math.pow(10, 18)); // DAI has 18 decimals
      uri = `${scheme}:${daiContract}/transfer?address=${address}&uint256=${daiAmount}`;
      break;
      
    // Binance Smart Chain
    case 'BNB':
    case 'BNBBSC':
      // Trust Wallet deep link format for BSC
      scheme = 'https';
      uri = `https://link.trustwallet.com/send?coin=20000714&address=${address}&amount=${amount}`;
      break;
      
    case 'USDTBSC':
      scheme = 'https';
      // USDT on BSC via Trust Wallet
      uri = `https://link.trustwallet.com/send?coin=20000714&address=${address}&amount=${amount}&token=0x55d398326f99059ff775485246999027b3197955`;
      break;
      
    case 'USDCBSC':
      scheme = 'https';
      // USDC on BSC via Trust Wallet  
      uri = `https://link.trustwallet.com/send?coin=20000714&address=${address}&amount=${amount}&token=0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d`;
      break;
      
    // Solana and SPL tokens
    case 'SOL':
      scheme = 'solana';
      uri = `${scheme}:${address}?amount=${amt}`;
      break;
      
    case 'USDCSOL':
      scheme = 'solana';
      // USDC SPL token mint address
      const usdcSplMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
      uri = `${scheme}:${address}?amount=${amt}&spl-token=${usdcSplMint}`;
      break;
      
    case 'USDTSOL':
      scheme = 'solana';
      // USDT SPL token mint address
      const usdtSplMint = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';
      uri = `${scheme}:${address}?amount=${amt}&spl-token=${usdtSplMint}`;
      break;
      
    // Polygon/Matic and Polygon tokens
    case 'MATIC':
    case 'MATICMATIC':
      scheme = 'ethereum'; // Polygon uses Ethereum-compatible addresses
      // Use generic Ethereum scheme since many wallets treat Polygon similarly
      const maticWeiAmount = Math.floor(amount * Math.pow(10, 18));
      uri = `${scheme}:${address}?value=${maticWeiAmount}&chainId=137`;
      break;
      
    case 'USDTMATIC':
      scheme = 'ethereum';
      // USDT on Polygon
      const usdtMaticContract = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';
      const usdtMaticAmount = Math.floor(amount * Math.pow(10, 6));
      uri = `${scheme}:${usdtMaticContract}/transfer?address=${address}&uint256=${usdtMaticAmount}&chainId=137`;
      break;
      
    case 'USDCMATIC':
      scheme = 'ethereum';
      // USDC on Polygon
      const usdcMaticContract = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
      const usdcMaticAmount = Math.floor(amount * Math.pow(10, 6));
      uri = `${scheme}:${usdcMaticContract}/transfer?address=${address}&uint256=${usdcMaticAmount}&chainId=137`;
      break;
      
    // Tron and TRC-20 tokens  
    case 'TRX':
      scheme = 'tron';
      uri = `${scheme}:${address}?amount=${amt}`;
      break;
      
    case 'USDTTRC20':
      scheme = 'tron';
      // USDT on Tron
      const usdtTronContract = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
      uri = `${scheme}:${usdtTronContract}?address=${address}&amount=${amt}`;
      break;
      
    // Avalanche
    case 'AVAX':
      scheme = 'avalanche';
      uri = `${scheme}:${address}?amount=${amt}`;
      break;
      
    // Arbitrum
    case 'ARB':
      scheme = 'ethereum';
      const arbWeiAmount = Math.floor(amount * Math.pow(10, 18));
      uri = `${scheme}:${address}?value=${arbWeiAmount}&chainId=42161`;
      break;
      
    case 'USDTARB':
      scheme = 'ethereum';
      // USDT on Arbitrum
      const usdtArbContract = '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9';
      const usdtArbAmount = Math.floor(amount * Math.pow(10, 6));
      uri = `${scheme}:${usdtArbContract}/transfer?address=${address}&uint256=${usdtArbAmount}&chainId=42161`;
      break;
      
    case 'USDCARB':
      scheme = 'ethereum';
      // USDC on Arbitrum
      const usdcArbContract = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';
      const usdcArbAmount = Math.floor(amount * Math.pow(10, 6));
      uri = `${scheme}:${usdcArbContract}/transfer?address=${address}&uint256=${usdcArbAmount}&chainId=42161`;
      break;
      
    // Optimism
    case 'OP':
      scheme = 'ethereum';
      const opWeiAmount = Math.floor(amount * Math.pow(10, 18));
      uri = `${scheme}:${address}?value=${opWeiAmount}&chainId=10`;
      break;
      
    case 'USDTOP':
      scheme = 'ethereum';
      // USDT on Optimism
      const usdtOpContract = '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58';
      const usdtOpAmount = Math.floor(amount * Math.pow(10, 6));
      uri = `${scheme}:${usdtOpContract}/transfer?address=${address}&uint256=${usdtOpAmount}&chainId=10`;
      break;
      
    case 'USDCOP':
      scheme = 'ethereum';
      // USDC on Optimism
      const usdcOpContract = '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85';
      const usdcOpAmount = Math.floor(amount * Math.pow(10, 6));
      uri = `${scheme}:${usdcOpContract}/transfer?address=${address}&uint256=${usdcOpAmount}&chainId=10`;
      break;
      
    // Base
    case 'ETHBASE':
    case 'ETH_BASE':
      scheme = 'ethereum';
      const baseWeiAmount = Math.floor(amount * Math.pow(10, 18));
      uri = `${scheme}:${address}?value=${baseWeiAmount}&chainId=8453`;
      break;
      
    case 'USDCBASE':
      scheme = 'ethereum';
      // USDC on Base
      const usdcBaseContract = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
      const usdcBaseAmount = Math.floor(amount * Math.pow(10, 6));
      uri = `${scheme}:${usdcBaseContract}/transfer?address=${address}&uint256=${usdcBaseAmount}&chainId=8453`;
      break;
      
    // Sui (experimental URI support)
    case 'SUI':
      // Several Sui wallets recognize the sui: scheme with amount in SUI
      // Fall back to address-only if a wallet doesn't support it
      scheme = 'sui';
      uri = `${scheme}:${address}?amount=${amt}`;
      break;
      
    // TON
    case 'TON':
      scheme = 'ton';
      uri = `${scheme}://transfer/${address}?amount=${amount * Math.pow(10, 9)}`; // TON uses nano-tons
      break;
      
    case 'USDTTON':
      scheme = 'ton';
      // USDT on TON
      const usdtTonContract = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';
      uri = `${scheme}://transfer/${usdtTonContract}?amount=${amount}&destination=${address}`;
      break;
      
    // Algorand
    case 'ALGO':
      scheme = 'algorand';
      uri = `${scheme}:${address}?amount=${Math.ceil((amount * Math.pow(10, 6)) + Number.EPSILON)}`; // round up to whole micro-algos
      break;
      
    case 'USDCALGO':
      scheme = 'algorand';
      // USDC on Algorand
      const usdcAlgoAssetId = '31566704';
      uri = `${scheme}:${address}?amount=${amount}&asset=${usdcAlgoAssetId}`;
      break;
      
    // NEAR Protocol
    case 'NEAR':
      scheme = 'near';
      uri = `${scheme}:${address}?amount=${amount}`;
      break;
      
    // Cardano
    case 'ADA':
      scheme = 'cardano';
      uri = `${scheme}:${address}?amount=${amount * Math.pow(10, 6)}`; // ADA uses lovelaces
      break;
      
    // Polkadot
    case 'DOT':
      scheme = 'polkadot';
      uri = `${scheme}:${address}?amount=${amount}`;
      break;
      
    // Default fallback - return address only
    default:
      scheme = 'address';
      uri = address;
  }
  
  // Add optional parameters for supported schemes
  if (scheme !== 'address' && scheme !== 'https') {
    if (label) {
      uri += uri.includes('?') ? '&' : '?';
      uri += `label=${encodeURIComponent(label)}`;
    }
    if (message) {
      uri += uri.includes('?') ? '&' : '?';
      uri += `message=${encodeURIComponent(message)}`;
    }
  }
  
  return {
    uri,
    includesAmount: uri !== address,
    includesExtraId: false,
    scheme,
    fallbackAddress: address
  };
}

/**
 * Checks if a currency requires an extra ID (destination tag, memo, etc.)
 * 
 * Note: This function duplicates logic from @/lib/extra-id-validation
 * but is kept here to avoid circular imports and maintain the utility's independence
 */
function requiresExtraId(currency: string): boolean {
  const upper = currency.toUpperCase();
  return ['XRP', 'XLM', 'HBAR', 'EOS', 'BNB_MEMO'].includes(upper);
}

/**
 * Gets the appropriate label for the extra ID field
 */
export function getExtraIdLabel(currency: string): string {
  const upper = currency.toUpperCase();
  switch (upper) {
    case 'XRP':
      return 'Destination Tag';
    case 'XLM':
      return 'Memo';
    case 'HBAR':
      return 'Memo';
    case 'EOS':
      return 'Memo';
    default:
      return 'Memo';
  }
}

/**
 * Validates if a cryptocurrency payment URI is properly formatted
 */
export function validateCryptoURI(uri: string): {
  isValid: boolean;
  scheme: string;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!uri) {
    errors.push('URI is empty');
    return { isValid: false, scheme: '', errors };
  }
  
  // Check if it's a valid URI format
  let scheme = '';
  if (uri.includes(':')) {
    scheme = uri.split(':')[0].toLowerCase();
  } else {
    // Assume it's just an address
    scheme = 'address';
  }
  
  // Validate common URI schemes
  const validSchemes = [
    'bitcoin', 'litecoin', 'dogecoin', 'bitcoincash', 
    'ethereum', 'solana', 'tron', 'avalanche',
    'xrp', 'stellar', 'web+stellar', 'hbar', 'ton', 'algorand', 'near',
    'cardano', 'polkadot', 'https', 'address', 'sui'
  ];
  
  if (!validSchemes.includes(scheme)) {
    errors.push(`Unknown scheme: ${scheme}`);
  }
  
  // Validate URI structure for known schemes
  if (scheme === 'stellar' || scheme === 'web+stellar') {
    if (!uri.includes('destination=')) {
      errors.push('Stellar URI missing destination parameter');
    }
  }
  
  if (scheme === 'ethereum') {
    // Basic Ethereum address validation
    const addressMatch = uri.match(/ethereum:([a-fA-F0-9x]{40,42})/);
    if (!addressMatch && !uri.includes('/transfer')) {
      errors.push('Invalid Ethereum address format');
    }
  }
  
  return {
    isValid: errors.length === 0,
    scheme,
    errors
  };
}

/**
 * Extracts payment information from a cryptocurrency URI
 */
export function parseCryptoURI(uri: string): {
  currency: string;
  address: string;
  amount?: number;
  extraId?: string;
  label?: string;
  message?: string;
} | null {
  if (!uri) return null;
  
  try {
    const url = new URL(uri);
    const scheme = url.protocol.replace(':', '').toLowerCase();
    
    switch (scheme) {
      case 'bitcoin':
      case 'litecoin':
      case 'dogecoin':
      case 'bitcoincash':
        return {
          currency: scheme.toUpperCase(),
          address: url.pathname,
          amount: url.searchParams.get('amount') ? parseFloat(url.searchParams.get('amount')!) : undefined,
          label: url.searchParams.get('label') || undefined,
          message: url.searchParams.get('message') || undefined
        };
        
      case 'ethereum':
        return {
          currency: 'ETH',
          address: url.pathname,
          amount: url.searchParams.get('value') ? parseFloat(url.searchParams.get('value')!) / Math.pow(10, 18) : undefined,
          label: url.searchParams.get('label') || undefined,
          message: url.searchParams.get('message') || undefined
        };
        
      case 'xrp':
        return {
          currency: 'XRP',
          address: url.pathname,
          amount: url.searchParams.get('amount') ? parseFloat(url.searchParams.get('amount')!) : undefined,
          extraId: url.searchParams.get('dt') || undefined,
          label: url.searchParams.get('label') || undefined,
          message: url.searchParams.get('message') || undefined
        };
        
      case 'stellar':
      case 'web+stellar':
        return {
          currency: 'XLM',
          address: url.searchParams.get('destination') || '',
          amount: url.searchParams.get('amount') ? parseFloat(url.searchParams.get('amount')!) : undefined,
          extraId: url.searchParams.get('memo') || undefined,
          label: url.searchParams.get('label') || undefined,
          message: url.searchParams.get('message') || undefined
        };
      
      case 'sui':
        return {
          currency: 'SUI',
          address: url.pathname,
          amount: url.searchParams.get('amount') ? parseFloat(url.searchParams.get('amount')!) : undefined,
          label: url.searchParams.get('label') || undefined,
          message: url.searchParams.get('message') || undefined
        };
        
      default:
        return null;
    }
  } catch {
    // If URL parsing fails, assume it's just an address
    return {
      currency: 'UNKNOWN',
      address: uri,
    };
  }
}
