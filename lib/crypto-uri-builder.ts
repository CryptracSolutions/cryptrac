/**
 * Comprehensive cryptocurrency URI builder for QR code generation
 * 
 * This utility creates standardized payment URIs that can be embedded in QR codes
 * to allow wallets to auto-populate recipient address, amount, and other payment details.
 * 
 * Follows established standards for maximum wallet compatibility:
 * - BIP-21 for Bitcoin and Bitcoin-like currencies
 * - EIP-681 for Ethereum and ERC-20 tokens (compatible with MetaMask, Trust Wallet)
 * - SEP-0007 for Stellar payments (compatible with Trust Wallet, Stellar wallets)
 * - Algorand URI scheme with proper micro-algos conversion (compatible with Pera, Trust Wallet)
 * - Solana URI scheme (compatible with Phantom, Solflare, Trust Wallet)
 * - Address-only fallback for currencies without standardized URI schemes (Sui)
 * 
 * Recent improvements:
 * - Fixed ETH QR codes to use EIP-681 standard (fixes MetaMask compatibility)
 * - Fixed XLM QR codes to use simplified SEP-0007 format (fixes Trust Wallet compatibility) 
 * - Fixed ALGO decimal handling to use proper micro-algos conversion
 * - Fixed SUI to use address-only fallback (fixes Phantom wallet compatibility)
 * - Maintained SOL standard format for broad wallet support
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
  roundedAmount: number; // The 6-decimal rounded amount used in the URI
  formattedAmount: string; // The formatted amount string for UI display
}

// Utility: round a number UP to a fixed number of decimals
function roundUp(amount: number, decimals: number): number {
  const f = Math.pow(10, decimals);
  return Math.ceil((amount + Number.EPSILON) * f) / f;
}

// Utility: format with up to `maxDecimals` decimals, trimming trailing zeros (for URI schemes)
function formatAmount(amount: number, maxDecimals = 6): string {
  const rounded = roundUp(amount, maxDecimals);
  // Use toFixed to ensure we have at most maxDecimals, then trim trailing zeros
  const fixed = rounded.toFixed(maxDecimals);
  return fixed.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
}

// Utility: format amount for consistent UI display and NOWPayments compatibility
// Always rounds up to exactly 6 decimals to prevent partial payment issues
export function formatAmountForDisplay(amount: number): string {
  const rounded = roundUp(amount, 6);
  return rounded.toFixed(6);
}

// Utility: get the rounded amount as a number (for calculations)
export function getRoundedAmount(amount: number): number {
  return roundUp(amount, 6);
}

/**
 * Builds a comprehensive payment URI for the given cryptocurrency and parameters
 */
export function buildCryptoPaymentURI(request: CryptoPaymentRequest): URIResult {
  const { currency, address, amount, extraId, label, message } = request;
  const upper = currency.toUpperCase();
  
  // Calculate consistent rounded amount for all URIs and UI
  const roundedAmount = getRoundedAmount(amount);
  const formattedAmount = formatAmountForDisplay(amount);
  
  // Handle currencies with destination tags/memos first
  if (extraId && requiresExtraId(upper)) {
    const result = buildExtraIdURI(upper, address, roundedAmount, extraId, label, message);
    return { ...result, roundedAmount, formattedAmount };
  }
  
  // Handle standard currencies
  const result = buildStandardURI(upper, address, roundedAmount, label, message);
  return { ...result, roundedAmount, formattedAmount };
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
      // Stellar SEP-0007: Use simplified format for better wallet compatibility
      // stellar:address?amount=amount&memo=memo
      scheme = 'stellar';
      const memo = String(extraId);
      uri = `${scheme}:${address}?amount=${amt}&memo=${encodeURIComponent(memo)}`;
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
    fallbackAddress: address,
    roundedAmount: amount, // Already rounded when passed in
    formattedAmount: formatAmountForDisplay(amount)
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
  
  // Generic mapping for EVM‐native currencies so we don’t have to hard-code a gigantic switch-case for every single one.
  // The key is the Cryptrac currency code, the value is the EVM chainId.
  // If the currency is native to that chain we can build an EIP-681 URI with ?value= and chainId.
  const EVM_NATIVE_CHAIN_IDS: Record<string, number> = {
    // Ethereum family
    'ETH': 1,
    'ETC': 61,
    // Binance Smart Chain
    'BNB': 56,
    'BNBBSC': 56,
    // Polygon
    'MATIC': 137,
    'MATICMAINNET': 137,
    // Arbitrum One
    'ARB': 42161,
    'ETHARB': 42161,
    'ZROARB': 42161,
    // Optimism Mainnet
    'OP': 10,
    'ETHOP': 10,
    'USDTOP': 10,
    'USDCOP': 10,
    // Base Mainnet
    'ETHBASE': 8453,
    'BASEETH': 8453,
    // Fantom
    'FTM': 250,
    'FTMMAINNET': 250,
    // Avalanche C-Chain
    'AVAX': 43114,
    'AVAXC': 43114,
    // Cronos
    'CRO': 25,
    'CROMAINNET': 25,
    // zkSync Era
    'ZKSYNC': 324,
    // Bera (example of emerging EVM chains)
    'BERA': 80085
  };

  // Helper to build EIP-681 formatted URI for EVM natives
  function buildEvmNativeURI(address: string, amount: number, chainId: number): string {
    const wei = Math.floor(amount * 1e18);
    return `ethereum:${address}?value=${wei}&chainId=${chainId}`;
  }

  switch (currency) {
    // Bitcoin and Bitcoin forks
    case 'BTC':
      scheme = 'bitcoin';
      uri = buildBip21LikeURI(scheme, address, amount, 'amount', 'BTC');
      break;
      
    case 'LTC':
      scheme = 'litecoin';
      uri = buildBip21LikeURI(scheme, address, amount, 'amount', 'LTC');
      break;
      
    case 'BCH':
      scheme = 'bitcoincash';
      uri = buildBip21LikeURI(scheme, address, amount, 'amount', 'BCH');
      break;
      
    case 'DOGE':
      scheme = 'dogecoin';
      uri = buildBip21LikeURI(scheme, address, amount, 'amount', 'DOGE');
      break;
      
    // Ethereum and ERC-20 tokens
    case 'ETH':
      // EIP-681 standard for maximum wallet compatibility
      scheme = 'ethereum';
      const weiAmount = Math.floor(amount * Math.pow(10, 18)); // Convert ETH to wei
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
      
    case 'PYUSD':
      scheme = 'ethereum';
      // PayPal USD contract address on Ethereum mainnet
      const pyusdContract = '0x6c3ea9036406852006290770BEdFcAbA0e23A0e8';
      const pyusdAmount = Math.floor(amount * Math.pow(10, 6)); // PYUSD has 6 decimals
      uri = `${scheme}:${pyusdContract}/transfer?address=${address}&uint256=${pyusdAmount}`;
      break;
      
    // Binance Smart Chain
    case 'BNB':
    case 'BNBBSC':
      // Use EIP-681 style URI with BSC chainId 56 for broad wallet compatibility (MetaMask, Trust, Coinbase, etc.)
      // Fallback to plain Ethereum scheme without the optional "@" notation for maximum compatibility
      scheme = 'ethereum';
      const bnbWeiAmount = Math.floor(amount * Math.pow(10, 18));
      uri = `${scheme}:${address}?value=${bnbWeiAmount}&chainId=56`;
      break;
      
    case 'USDTBSC':
      scheme = 'ethereum';
      // USDT (BEP-20) contract on BSC mainnet
      const usdtBscContract = '0x55d398326f99059ff775485246999027b3197955';
      const usdtBscAmount = Math.floor(amount * Math.pow(10, 6));
      uri = `${scheme}:${usdtBscContract}/transfer?address=${address}&uint256=${usdtBscAmount}&chainId=56`;
      break;
      
    case 'USDCBSC':
      scheme = 'ethereum';
      // USDC (BEP-20) contract on BSC mainnet
      const usdcBscContract = '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d';
      const usdcBscAmount = Math.floor(amount * Math.pow(10, 6));
      uri = `${scheme}:${usdcBscContract}/transfer?address=${address}&uint256=${usdcBscAmount}&chainId=56`;
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
      // Some wallets (e.g., Phantom) reject unknown query params; omit chainId for broader support while still encoding correct wei amount
      const baseWeiAmountSimple = Math.floor(amount * Math.pow(10, 18));
      uri = `${scheme}:${address}?value=${baseWeiAmountSimple}`;
      break;
      
    case 'USDCBASE':
      scheme = 'ethereum';
      // USDC on Base
      const usdcBaseContract = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
      const usdcBaseAmount = Math.floor(amount * Math.pow(10, 6));
      uri = `${scheme}:${usdcBaseContract}/transfer?address=${address}&uint256=${usdcBaseAmount}&chainId=8453`;
      break;
      
    // Sui (address-only fallback for better compatibility)
    case 'SUI':
      // Since SUI URI scheme isn't standardized and Phantom doesn't support it,
      // use address-only fallback for better wallet compatibility
      scheme = 'address';
      uri = address;
      break;
      
    // TON
    case 'TON':
      scheme = 'ton';
      // Use precise integer of nano-TONs to avoid scientific notation issues that break wallet parsing
      const nanoTons = BigInt(Math.round(amount * 1_000_000_000));
      uri = `${scheme}://transfer/${address}?amount=${nanoTons.toString()}`;
      break;
    
    case 'USDTTON':
      scheme = 'ton';
      const usdtTonContract = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';
      // TON Jettons generally expect decimal amounts, but encode as int of 10^6 (per USDT spec)
      const jettonAmount = BigInt(Math.round(amount * 1_000_000));
      uri = `${scheme}://transfer/${usdtTonContract}?amount=${jettonAmount.toString()}&destination=${address}`;
      break;
      
    // Algorand
    case 'ALGO':
      scheme = 'algorand';
      // Convert ALGO to micro-algos (1 ALGO = 1,000,000 micro-algos)
      // Use Math.round to avoid floating point precision issues
      const microAlgos = Math.round(amount * 1000000);
      uri = `${scheme}:${address}?amount=${microAlgos}`;
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
      
    // Default fallback - before we give up, see if currency is an EVM native we know the chainId for
    default:
      if (currency in EVM_NATIVE_CHAIN_IDS) {
        scheme = 'ethereum';
        const cid = EVM_NATIVE_CHAIN_IDS[currency];
        uri = buildEvmNativeURI(address, amount, cid);
      } else if (currency in ERC20_TOKENS) {
        const info = ERC20_TOKENS[currency];
        scheme = 'ethereum';
        uri = buildErc20TransferURI(info, address, amount);
      } else {
        scheme = 'address';
        uri = address;
      }
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
    fallbackAddress: address,
    roundedAmount: amount, // Already rounded when passed in
    formattedAmount: formatAmountForDisplay(amount)
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
    'cardano', 'polkadot', 'https', 'address', 'eosio'
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

// -----------------------------------------------------------------------------
// Generic ERC-20 / EVM token support
// -----------------------------------------------------------------------------
interface TokenInfo {
  contract: string;
  decimals: number;
  chainId?: number; // omit for mainnet Ethereum (1)
}

const ERC20_TOKENS: Record<string, TokenInfo> = {
  // Stablecoins – existing chains already covered but we add for generic handling
  'USDTARC20': { contract: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6, chainId: 42161 }, // Arbitrum
  'USDCARC20': { contract: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6, chainId: 42161 }, // Arbitrum
  'USDTCELO':  { contract: '0x85F17Cf997934a597031b2E18a9aB6ebD4B9f6a4', decimals: 18, chainId: 42220 }, // Celo
  'BUSDBSC':   { contract: '0xe9e7cea3dedca5984780bafc599bd69add087d56', decimals: 18, chainId: 56 },   // BUSD on BSC
  // Example additional tokens from 142-currency list:
  'SHIB':      { contract: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE', decimals: 18, chainId: 1 },  // SHIB ETH
  'LINK':      { contract: '0x514910771AF9Ca656af840dff83E8264EcF986CA', decimals: 18, chainId: 1 },  // LINK ETH
  'UNI':       { contract: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', decimals: 18, chainId: 1 },  // UNI ETH
  // Add more as needed
};

function buildErc20TransferURI(token: TokenInfo, recipient: string, amount: number): string {
  const base = 'ethereum:';
  const scaled = BigInt(Math.floor(amount * Math.pow(10, token.decimals)));
  const chainPart = token.chainId ? `&chainId=${token.chainId}` : '';
  return `${base}${token.contract}/transfer?address=${recipient}&uint256=${scaled.toString()}${chainPart}`;
}

// -----------------------------------------------------------------------------
// BIP-21–like helper for UTXO coins that follow `scheme:address?amount=` pattern
// -----------------------------------------------------------------------------
// Coin-specific preferred decimal precision (mostly for UTXO coins)
const DECIMAL_PRECISION: Record<string, number> = {
  'BTC': 8,
  'LTC': 8,
  'BCH': 8,
  'DOGE': 8,
  'DASH': 8,
  'ZEC': 8,
  'RVN': 8,
  'KAS': 8,
};

function formatAmountCoin(amount: number, currency: string): string {
  const dec = DECIMAL_PRECISION[currency] ?? 6;
  return formatAmount(amount, dec);
}

function buildBip21LikeURI(scheme: string, address: string, amount: number, param: string = 'amount', currencyHint?: string): string {
  const amt = formatAmountCoin(amount, currencyHint || scheme.toUpperCase());
  return `${scheme}:${address}?${param}=${amt}`;
}
