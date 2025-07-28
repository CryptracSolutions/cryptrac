import { NextRequest, NextResponse } from 'next/server';
import { generateWallets, getTrustWalletCurrencies } from '@/lib/wallet-generation-unified';

interface GenerateWalletsRequest {
  currencies?: string[];
  mnemonic?: string;
  generation_method?: 'trust_wallet' | 'custom';
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

// POST endpoint for wallet generation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currencies, mnemonic, generation_method = 'trust_wallet' }: GenerateWalletsRequest = body;
    
    // If no currencies specified, use all Trust Wallet compatible currencies
    const currenciesToGenerate = currencies || getTrustWalletCurrencies().map((c: TrustWalletCurrency) => c.code);
    
    if (!Array.isArray(currenciesToGenerate) || currenciesToGenerate.length === 0) {
      return NextResponse.json(
        { error: 'At least one currency must be specified' },
        { status: 400 }
      );
    }

    if (currenciesToGenerate.length > 20) {
      return NextResponse.json(
        { error: 'Maximum 20 currencies allowed per generation' },
        { status: 400 }
      );
    }

    // Validate mnemonic if provided
    if (mnemonic) {
      const { validateMnemonic } = await import('@/lib/wallet-generation-unified');
      if (!validateMnemonic(mnemonic)) {
        return NextResponse.json(
          { error: 'Invalid mnemonic phrase' },
          { status: 400 }
        );
      }
    }

    // Generate wallets
    const result = await generateWallets({
      currencies: currenciesToGenerate,
      mnemonic,
      generation_method
    });

    return NextResponse.json({
      success: true,
      ...result,
      generation_info: {
        total_currencies: result.wallets.length,
        exact_matches: result.exact_matches,
        manual_setup_required: result.manual_setup_required,
        trust_wallet_compatible: result.trust_wallet_compatible
      }
    });

  } catch (error) {
    console.error('Wallet generation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Wallet generation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve supported currencies
export async function GET() {
  try {
    const currencies = getTrustWalletCurrencies();
    
    const supportedCurrencies = currencies.map((currency: TrustWalletCurrency) => ({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      network: currency.network,
      address_type: currency.address_type,
      derivation_path: currency.derivation_path,
      trust_wallet_compatible: currency.trust_wallet_compatible,
      decimals: currency.decimals,
      min_amount: currency.min_amount,
      display_name: currency.display_name,
      is_token: currency.is_token,
      parent_currency: currency.parent_currency
    }));

    // Group by compatibility level
    const exactMatches = supportedCurrencies.filter((c: TrustWalletCurrency) => 
      ['ETH', 'BNB', 'MATIC', 'USDT_ERC20', 'USDC_ERC20', 'USDC_POLYGON', 'SOL', 'TRX', 'USDT_TRC20'].includes(c.code)
    );
    
    const manualSetup = supportedCurrencies.filter((c: TrustWalletCurrency) => 
      ['BTC', 'LTC', 'DOGE', 'XRP'].includes(c.code)
    );

    // Convert Set to Array using Array.from() to avoid iteration issues
    const networksSet = new Set(supportedCurrencies.map((c: TrustWalletCurrency) => c.network));
    const addressTypesSet = new Set(supportedCurrencies.map((c: TrustWalletCurrency) => c.address_type));
    
    const supportedNetworks = Array.from(networksSet);
    const addressTypes = Array.from(addressTypesSet);

    return NextResponse.json({
      success: true,
      currencies: supportedCurrencies,
      compatibility_info: {
        total_currencies: supportedCurrencies.length,
        exact_matches: exactMatches.length,
        manual_setup_required: manualSetup.length,
        exact_match_currencies: exactMatches.map((c: TrustWalletCurrency) => c.code),
        manual_setup_currencies: manualSetup.map((c: TrustWalletCurrency) => c.code)
      },
      generation_info: {
        supported_networks: supportedNetworks,
        supported_address_types: addressTypes,
        trust_wallet_compatible: true
      }
    });

  } catch (error) {
    console.error('Error fetching supported currencies:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch supported currencies',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

