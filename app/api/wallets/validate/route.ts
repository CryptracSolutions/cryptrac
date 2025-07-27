import { NextRequest, NextResponse } from 'next/server';
import { 
  validateAddress,
  getCurrencyInfo
} from '@/lib/wallet-generation';

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
  address_format?: string;
  error?: string;
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
        network: currencyInfo.network,
        address_format: currencyInfo.addressFormat
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
          { error: 'Addresses array is required and cannot be empty' },
          { status: 400 }
        );
      }

      if (addresses.length > 50) {
        return NextResponse.json(
          { error: 'Maximum 50 addresses can be validated at once' },
          { status: 400 }
        );
      }

      const results = addresses.map(({ address, currency }) => {
        if (!address || !currency) {
          return {
            address,
            currency,
            valid: false,
            error: 'Address and currency are required'
          };
        }

        const isValid = validateAddress(address.trim(), currency.toUpperCase());
        const currencyInfo = getCurrencyInfo(currency.toUpperCase());
        
        const result: ValidationResult & { address: string } = {
          address: address.trim(),
          valid: isValid,
          currency: currency.toUpperCase(),
          network: currencyInfo.network,
          address_format: currencyInfo.addressFormat
        };

        if (!isValid) {
          result.error = `Invalid ${currency.toUpperCase()} address format`;
        }

        return result;
      });

      const validCount = results.filter(r => r.valid).length;
      const invalidCount = results.length - validCount;

      return NextResponse.json({
        success: true,
        batch_validation: {
          total: results.length,
          valid: validCount,
          invalid: invalidCount,
          results
        }
      });
    }

    return NextResponse.json(
      { error: 'Invalid request format. Expected either {address, currency} or {addresses: [...]}' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Address validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error during validation' },
      { status: 500 }
    );
  }
}

// GET endpoint for validation information
export async function GET() {
  try {
    const supportedCurrencies = [
      'BTC', 'ETH', 'LTC', 'SOL', 'BNB', 'MATIC', 'TRX', 'AVAX',
      'USDT', 'USDC', 'DAI', 'LINK', 'UNI'
    ];

    const validationInfo = supportedCurrencies.map(currency => {
      const info = getCurrencyInfo(currency);
      return {
        currency,
        name: info.name,
        symbol: info.symbol,
        network: info.network,
        address_format: info.addressFormat,
        derivation_path: info.derivationPath
      };
    });

    return NextResponse.json({
      success: true,
      supported_currencies: supportedCurrencies,
      validation_info: validationInfo,
      features: {
        single_validation: true,
        batch_validation: true,
        max_batch_size: 50,
        supported_formats: [
          'Bitcoin Bech32',
          'Ethereum Hex',
          'Solana Base58',
          'Tron Base58'
        ]
      }
    });

  } catch (error) {
    console.error('Validation info error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

