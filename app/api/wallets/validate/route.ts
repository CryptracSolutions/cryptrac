import { NextRequest, NextResponse } from 'next/server';
import { 
  validateAddress,
  getCurrencyInfo,
  getTrustWalletCurrencies
} from '@/lib/wallet-generation-unified';

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

interface TrustWalletCurrency {
  code: string;
  name: string;
  symbol: string;
  network: string;
  address_type: string;
  derivation_path: string;
  trust_wallet_compatible: boolean;
  decimals: number;
  min_amount: number;
  display_name?: string;
  is_token?: boolean;
  parent_currency?: string;
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
        exact_match: currencyInfo ? ['ETH', 'BNB', 'MATIC', 'USDT_ERC20', 'USDC_ERC20', 'USDC_POLYGON', 'SOL', 'TRX', 'USDT_TRC20'].includes(currencyInfo.code) : false
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
            exact_match: currencyInfo ? ['ETH', 'BNB', 'MATIC', 'USDT_ERC20', 'USDC_ERC20', 'USDC_POLYGON', 'SOL', 'TRX', 'USDT_TRC20'].includes(currencyInfo.code) : false
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
    const currencies = getTrustWalletCurrencies();
    
    const supportedCurrencies = currencies.map((currency: TrustWalletCurrency) => ({
      code: currency.code,
      name: currency.name,
      network: currency.network,
      address_type: currency.address_type,
      derivation_path: currency.derivation_path,
      exact_match: ['ETH', 'BNB', 'MATIC', 'USDT_ERC20', 'USDC_ERC20', 'USDC_POLYGON', 'SOL', 'TRX', 'USDT_TRC20'].includes(currency.code)
    }));

    // Convert Set to Array using Array.from() to avoid iteration issues
    const networksSet = new Set(currencies.map((c: TrustWalletCurrency) => c.network));
    const addressTypesSet = new Set(currencies.map((c: TrustWalletCurrency) => c.address_type));
    
    const supportedNetworks = Array.from(networksSet);
    const addressTypes = Array.from(addressTypesSet);

    return NextResponse.json({
      success: true,
      supported_currencies: supportedCurrencies,
      validation_info: {
        supported_networks: supportedNetworks,
        address_types: addressTypes,
        total_currencies: currencies.length,
        exact_match_count: supportedCurrencies.filter((c: any) => c.exact_match).length,
        manual_setup_count: supportedCurrencies.filter((c: any) => !c.exact_match).length
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

