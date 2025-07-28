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

// Basic address validation patterns
const ADDRESS_PATTERNS: Record<string, RegExp> = {
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
  // Stablecoins (use parent network patterns)
  USDT_ERC20: /^0x[a-fA-F0-9]{40}$/,
  USDC_ERC20: /^0x[a-fA-F0-9]{40}$/,
  USDT_TRC20: /^T[A-Za-z1-9]{33}$/,
  USDC_SOL: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
};

const CURRENCY_INFO: Record<string, { network: string; address_type: string; decimals: number }> = {
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
  USDT_ERC20: { network: 'Ethereum', address_type: 'ERC20', decimals: 6 },
  USDC_ERC20: { network: 'Ethereum', address_type: 'ERC20', decimals: 6 },
  USDT_TRC20: { network: 'Tron', address_type: 'TRC20', decimals: 6 },
  USDC_SOL: { network: 'Solana', address_type: 'SPL', decimals: 6 },
};

function validateAddress(address: string, currency: string): boolean {
  const pattern = ADDRESS_PATTERNS[currency.toUpperCase()];
  if (!pattern) {
    return false;
  }
  return pattern.test(address);
}

function getCurrencyInfo(currency: string) {
  return CURRENCY_INFO[currency.toUpperCase()];
}

// POST endpoint for address validation (single and batch)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Single address validation
    if ('address' in body && 'currency' in body) {
      const { address, currency }: ValidateAddressRequest = body;
      
      if (!address || !currency) {
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
        exact_match: currencyInfo ? ['ETH', 'BNB', 'USDT_ERC20', 'USDC_ERC20', 'SOL', 'TRX', 'USDT_TRC20', 'USDC_SOL'].includes(currency.toUpperCase()) : false
      };

      if (!isValid) {
        result.error = `Invalid ${currency.toUpperCase()} address format`;
      }

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
            exact_match: currencyInfo ? ['ETH', 'BNB', 'USDT_ERC20', 'USDC_ERC20', 'SOL', 'TRX', 'USDT_TRC20', 'USDC_SOL'].includes(item.currency.toUpperCase()) : false
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
      exact_match: ['ETH', 'BNB', 'USDT_ERC20', 'USDC_ERC20', 'SOL', 'TRX', 'USDT_TRC20', 'USDC_SOL'].includes(code)
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

