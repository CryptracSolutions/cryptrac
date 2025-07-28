import { NextRequest, NextResponse } from 'next/server';

interface ValidateAddressRequest {
  address: string;
  currency: string;
}

interface BatchValidateRequest {
  addresses: Array<{
    address: string;
    currency: string;
  }>;
}

interface ValidationResult {
  valid: boolean;
  currency: string;
  network?: string;
  address_type?: string;
  exact_match?: boolean;
  error?: string;
}

// Comprehensive address validation patterns for ALL supported currencies
const ADDRESS_PATTERNS: Record<string, RegExp> = {
  // Primary cryptocurrencies
  BTC: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/,
  ETH: /^0x[a-fA-F0-9]{40}$/,
  LTC: /^[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}$/,
  DOGE: /^D{1}[5-9A-HJ-NP-U]{1}[1-9A-HJ-NP-Za-km-z]{32}$/,
  XRP: /^r[0-9a-zA-Z]{24,34}$/,
  TRX: /^T[A-Za-z1-9]{33}$/,
  SOL: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  BNB: /^0x[a-fA-F0-9]{40}$|^bnb[0-9a-z]{39}$/,
  TON: /^[0-9a-zA-Z\-_]{48}$/,
  SUI: /^0x[a-fA-F0-9]{64}$/,
  AVAX: /^0x[a-fA-F0-9]{40}$/,
  
  // Ethereum ecosystem stablecoins (ERC-20)
  USDT_ERC20: /^0x[a-fA-F0-9]{40}$/,
  USDC_ERC20: /^0x[a-fA-F0-9]{40}$/,
  
  // BNB Smart Chain stablecoins (BEP-20)
  USDT_BEP20: /^0x[a-fA-F0-9]{40}$/,
  USDC_BEP20: /^0x[a-fA-F0-9]{40}$/,
  
  // Solana ecosystem stablecoins (SPL)
  USDT_SOL: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  USDC_SOL: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  
  // TRON ecosystem stablecoins (TRC-20)
  USDT_TRC20: /^T[A-Za-z1-9]{33}$/,
  USDC_TRC20: /^T[A-Za-z1-9]{33}$/,
  
  // TON ecosystem stablecoins
  USDT_TON: /^[0-9a-zA-Z\-_]{48}$/,
  
  // Avalanche ecosystem stablecoins (C-Chain)
  USDT_AVAX: /^0x[a-fA-F0-9]{40}$/,
  USDC_AVAX: /^0x[a-fA-F0-9]{40}$/,

  // Additional ERC-20 tokens (use Ethereum address pattern)
  AAVE: /^0x[a-fA-F0-9]{40}$/,
  MATIC: /^0x[a-fA-F0-9]{40}$/,
  LINK: /^0x[a-fA-F0-9]{40}$/,
  UNI: /^0x[a-fA-F0-9]{40}$/,
  CRV: /^0x[a-fA-F0-9]{40}$/,
  COMP: /^0x[a-fA-F0-9]{40}$/,
  MKR: /^0x[a-fA-F0-9]{40}$/,
  SNX: /^0x[a-fA-F0-9]{40}$/,
  SUSHI: /^0x[a-fA-F0-9]{40}$/,
  YFI: /^0x[a-fA-F0-9]{40}$/,
  BAL: /^0x[a-fA-F0-9]{40}$/,
  USDT: /^0x[a-fA-F0-9]{40}$/, // Default to ERC-20
  USDC: /^0x[a-fA-F0-9]{40}$/, // Default to ERC-20

  // Cardano ecosystem
  ADA: /^addr1[a-z0-9]{98}$|^[A-Za-z0-9]{59}$/,

  // Polkadot ecosystem
  DOT: /^1[0-9A-Za-z]{46}$/,

  // Additional native currencies
  BCH: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bitcoincash:[a-z0-9]{42}$/,
  ETC: /^0x[a-fA-F0-9]{40}$/,
  ZEC: /^t1[a-zA-Z0-9]{33}$|^t3[a-zA-Z0-9]{33}$/,
  DASH: /^X[1-9A-HJ-NP-Za-km-z]{33}$/,
  XMR: /^4[0-9AB][1-9A-HJ-NP-Za-km-z]{93}$/,

  // Polygon ecosystem (MATIC network)
  MATIC_POLYGON: /^0x[a-fA-F0-9]{40}$/,
  USDT_POLYGON: /^0x[a-fA-F0-9]{40}$/,
  USDC_POLYGON: /^0x[a-fA-F0-9]{40}$/,

  // Arbitrum ecosystem
  ARB: /^0x[a-fA-F0-9]{40}$/,
  USDT_ARBITRUM: /^0x[a-fA-F0-9]{40}$/,
  USDC_ARBITRUM: /^0x[a-fA-F0-9]{40}$/,

  // Optimism ecosystem
  OP: /^0x[a-fA-F0-9]{40}$/,
  USDT_OPTIMISM: /^0x[a-fA-F0-9]{40}$/,
  USDC_OPTIMISM: /^0x[a-fA-F0-9]{40}$/,
};

// Network-based fallback patterns
const NETWORK_PATTERNS: Record<string, RegExp> = {
  'ethereum': /^0x[a-fA-F0-9]{40}$/,
  'bsc': /^0x[a-fA-F0-9]{40}$/,
  'polygon': /^0x[a-fA-F0-9]{40}$/,
  'arbitrum': /^0x[a-fA-F0-9]{40}$/,
  'optimism': /^0x[a-fA-F0-9]{40}$/,
  'avalanche': /^0x[a-fA-F0-9]{40}$/,
  'solana': /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  'tron': /^T[A-Za-z1-9]{33}$/,
  'ton': /^[0-9a-zA-Z\-_]{48}$/,
  'cardano': /^addr1[a-z0-9]{98}$|^[A-Za-z0-9]{59}$/,
  'polkadot': /^1[0-9A-Za-z]{46}$/,
  'bitcoin': /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/,
  'litecoin': /^[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}$/,
  'dogecoin': /^D{1}[5-9A-HJ-NP-U]{1}[1-9A-HJ-NP-Za-km-z]{32}$/,
  'ripple': /^r[0-9a-zA-Z]{24,34}$/,
  'sui': /^0x[a-fA-F0-9]{64}$/,
};

const CURRENCY_INFO: Record<string, { network: string; address_type: string; decimals: number }> = {
  // Primary cryptocurrencies
  BTC: { network: 'Bitcoin', address_type: 'P2PKH/P2SH/Bech32', decimals: 8 },
  ETH: { network: 'Ethereum', address_type: 'ERC20', decimals: 18 },
  LTC: { network: 'Litecoin', address_type: 'P2PKH/P2SH', decimals: 8 },
  DOGE: { network: 'Dogecoin', address_type: 'P2PKH', decimals: 8 },
  XRP: { network: 'XRP Ledger', address_type: 'Classic', decimals: 6 },
  TRX: { network: 'Tron', address_type: 'Base58', decimals: 6 },
  SOL: { network: 'Solana', address_type: 'Base58', decimals: 9 },
  BNB: { network: 'BSC', address_type: 'ERC20', decimals: 18 },
  TON: { network: 'TON', address_type: 'Base64', decimals: 9 },
  SUI: { network: 'Sui', address_type: 'Hex', decimals: 9 },
  AVAX: { network: 'Avalanche', address_type: 'ERC20', decimals: 18 },
  
  // Ethereum ecosystem stablecoins
  USDT_ERC20: { network: 'Ethereum', address_type: 'ERC20', decimals: 6 },
  USDC_ERC20: { network: 'Ethereum', address_type: 'ERC20', decimals: 6 },
  USDT: { network: 'Ethereum', address_type: 'ERC20', decimals: 6 },
  USDC: { network: 'Ethereum', address_type: 'ERC20', decimals: 6 },
  
  // BNB Smart Chain stablecoins
  USDT_BEP20: { network: 'BSC', address_type: 'BEP20', decimals: 6 },
  USDC_BEP20: { network: 'BSC', address_type: 'BEP20', decimals: 6 },
  
  // Solana ecosystem stablecoins
  USDT_SOL: { network: 'Solana', address_type: 'SPL', decimals: 6 },
  USDC_SOL: { network: 'Solana', address_type: 'SPL', decimals: 6 },
  
  // TRON ecosystem stablecoins
  USDT_TRC20: { network: 'Tron', address_type: 'TRC20', decimals: 6 },
  USDC_TRC20: { network: 'Tron', address_type: 'TRC20', decimals: 6 },
  
  // TON ecosystem stablecoins
  USDT_TON: { network: 'TON', address_type: 'TON', decimals: 6 },
  
  // Avalanche ecosystem stablecoins
  USDT_AVAX: { network: 'Avalanche', address_type: 'C-Chain', decimals: 6 },
  USDC_AVAX: { network: 'Avalanche', address_type: 'C-Chain', decimals: 6 },

  // Additional ERC-20 tokens
  AAVE: { network: 'Ethereum', address_type: 'ERC20', decimals: 18 },
  MATIC: { network: 'Ethereum', address_type: 'ERC20', decimals: 18 },
  LINK: { network: 'Ethereum', address_type: 'ERC20', decimals: 18 },
  UNI: { network: 'Ethereum', address_type: 'ERC20', decimals: 18 },
  CRV: { network: 'Ethereum', address_type: 'ERC20', decimals: 18 },
  COMP: { network: 'Ethereum', address_type: 'ERC20', decimals: 18 },
  MKR: { network: 'Ethereum', address_type: 'ERC20', decimals: 18 },
  SNX: { network: 'Ethereum', address_type: 'ERC20', decimals: 18 },
  SUSHI: { network: 'Ethereum', address_type: 'ERC20', decimals: 18 },
  YFI: { network: 'Ethereum', address_type: 'ERC20', decimals: 18 },
  BAL: { network: 'Ethereum', address_type: 'ERC20', decimals: 18 },

  // Other native currencies
  ADA: { network: 'Cardano', address_type: 'Bech32', decimals: 6 },
  DOT: { network: 'Polkadot', address_type: 'SS58', decimals: 10 },
  BCH: { network: 'Bitcoin Cash', address_type: 'P2PKH/P2SH', decimals: 8 },
  ETC: { network: 'Ethereum Classic', address_type: 'ERC20', decimals: 18 },
  ZEC: { network: 'Zcash', address_type: 'Transparent', decimals: 8 },
  DASH: { network: 'Dash', address_type: 'P2PKH', decimals: 8 },
  XMR: { network: 'Monero', address_type: 'CryptoNote', decimals: 12 },
};

function validateAddress(address: string, currency: string): boolean {
  const upperCurrency = currency.toUpperCase();
  console.log(`🔍 Validating ${upperCurrency} address: ${address}`);
  
  // Try exact pattern match first
  const pattern = ADDRESS_PATTERNS[upperCurrency];
  if (pattern) {
    const isValid = pattern.test(address);
    console.log(`✅ Pattern match for ${upperCurrency}: ${isValid}`);
    return isValid;
  }

  // Try network-based fallback
  const currencyInfo = CURRENCY_INFO[upperCurrency];
  if (currencyInfo) {
    const networkPattern = NETWORK_PATTERNS[currencyInfo.network.toLowerCase()];
    if (networkPattern) {
      const isValid = networkPattern.test(address);
      console.log(`🔄 Network fallback for ${upperCurrency} (${currencyInfo.network}): ${isValid}`);
      return isValid;
    }
  }

  // Default ERC-20 fallback for unknown tokens
  if (!pattern && !currencyInfo) {
    const ethPattern = /^0x[a-fA-F0-9]{40}$/;
    const isValid = ethPattern.test(address);
    console.log(`🔄 ERC-20 fallback for ${upperCurrency}: ${isValid}`);
    return isValid;
  }

  console.log(`❌ No validation pattern found for currency: ${upperCurrency}`);
  return false;
}

function getCurrencyInfo(currency: string) {
  return CURRENCY_INFO[currency.toUpperCase()];
}

// POST endpoint for address validation (single and batch)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log(`📨 Validation request received:`, body);
    
    // Single address validation
    if ('address' in body && 'currency' in body) {
      const { address, currency }: ValidateAddressRequest = body;
      
      if (!address || !currency) {
        console.log(`❌ Missing required fields: address=${!!address}, currency=${!!currency}`);
        return NextResponse.json(
          { error: 'Address and currency are required' },
          { status: 400 }
        );
      }

      const isValid = validateAddress(address.trim(), currency.toUpperCase());
      const currencyInfo = getCurrencyInfo(currency.toUpperCase());
      
      const result: ValidationResult = {
        valid: isValid,
        currency: currency.toUpperCase(),
        network: currencyInfo?.network,
        address_type: currencyInfo?.address_type,
        exact_match: currencyInfo ? true : false
      };

      if (!isValid) {
        result.error = `Invalid ${currency.toUpperCase()} address format`;
      }

      console.log(`📤 Validation result for ${currency.toUpperCase()}:`, result);

      return NextResponse.json({
        success: true,
        validation: result
      });
    }

    // Batch validation
    if ('addresses' in body) {
      const { addresses }: BatchValidateRequest = body;
      
      if (!Array.isArray(addresses) || addresses.length === 0) {
        return NextResponse.json(
          { error: 'Addresses array is required and must not be empty' },
          { status: 400 }
        );
      }

      if (addresses.length > 100) {
        return NextResponse.json(
          { error: 'Maximum 100 addresses allowed per batch' },
          { status: 400 }
        );
      }

      const results: ValidationResult[] = [];

      for (const item of addresses) {
        if (!item.address || !item.currency) {
          results.push({
            valid: false,
            currency: item.currency || 'UNKNOWN',
            error: 'Address and currency are required'
          });
          continue;
        }

        try {
          const isValid = validateAddress(item.address.trim(), item.currency.toUpperCase());
          const currencyInfo = getCurrencyInfo(item.currency.toUpperCase());
          
          const result: ValidationResult = {
            valid: isValid,
            currency: item.currency.toUpperCase(),
            network: currencyInfo?.network,
            address_type: currencyInfo?.address_type,
            exact_match: currencyInfo ? true : false
          };

          if (!isValid) {
            result.error = `Invalid ${item.currency.toUpperCase()} address format`;
          }

          results.push(result);
        } catch (error) {
          results.push({
            valid: false,
            currency: item.currency.toUpperCase(),
            error: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }
      }

      const validCount = results.filter((r: ValidationResult) => r.valid).length;
      const invalidCount = results.length - validCount;
      const exactMatchCount = results.filter((r: ValidationResult) => r.exact_match).length;

      return NextResponse.json({
        success: true,
        batch_validation: {
          total: results.length,
          valid: validCount,
          invalid: invalidCount,
          exact_matches: exactMatchCount,
          results
        }
      });
    }

    return NextResponse.json(
      { error: 'Invalid request format. Expected either single address validation or batch validation.' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Address validation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Address validation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve supported currencies for validation
export async function GET() {
  try {
    const supportedCurrencies = Object.keys(CURRENCY_INFO).map(code => ({
      code,
      name: code,
      network: CURRENCY_INFO[code].network,
      address_type: CURRENCY_INFO[code].address_type,
      decimals: CURRENCY_INFO[code].decimals,
      exact_match: true
    }));

    const supportedNetworks = Array.from(new Set(Object.values(CURRENCY_INFO).map(info => info.network)));
    const addressTypes = Array.from(new Set(Object.values(CURRENCY_INFO).map(info => info.address_type)));

    return NextResponse.json({
      success: true,
      supported_currencies: supportedCurrencies,
      validation_info: {
        supported_networks: supportedNetworks,
        address_types: addressTypes,
        total_currencies: supportedCurrencies.length,
        exact_match_count: supportedCurrencies.filter(c => c.exact_match).length,
        manual_setup_count: supportedCurrencies.filter(c => !c.exact_match).length
      }
    });

  } catch (error) {
    console.error('Error fetching validation currencies:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch validation currencies',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

