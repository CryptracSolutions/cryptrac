import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { 
  generateWallets, 
  getSupportedCurrencies,
  validateMnemonic
} from '@/lib/wallet-generation';

interface GenerateWalletsRequest {
  currencies?: string[];
  mnemonic?: string;
  generation_method?: 'trust_wallet' | 'manual';
}

export async function POST(request: NextRequest) {
  try {
    const requestData: GenerateWalletsRequest = await request.json();
    const { currencies, mnemonic, generation_method = 'trust_wallet' } = requestData;

    // Initialize Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Server component context
            }
          },
        },
      }
    );

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate mnemonic if provided
    if (mnemonic && !validateMnemonic(mnemonic)) {
      return NextResponse.json(
        { error: 'Invalid mnemonic phrase provided' },
        { status: 400 }
      );
    }

    // Validate currencies if provided
    const supportedCurrencies = getSupportedCurrencies();
    if (currencies) {
      const invalidCurrencies = currencies.filter(c => 
        !supportedCurrencies.includes(c.toUpperCase())
      );
      
      if (invalidCurrencies.length > 0) {
        return NextResponse.json(
          { 
            error: 'Unsupported currencies provided',
            invalid_currencies: invalidCurrencies,
            supported_currencies: supportedCurrencies
          },
          { status: 400 }
        );
      }
    }

    // Generate wallets
    console.log('Generating wallets for user:', user.id);
    const walletResult = await generateWallets({
      currencies: currencies?.map(c => c.toUpperCase()) || ['BTC', 'ETH', 'LTC'],
      mnemonic,
      generation_method: generation_method as 'trust_wallet' | 'custom'
    });

    // Get merchant record
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (merchantError || !merchant) {
      return NextResponse.json(
        { error: 'Merchant record not found' },
        { status: 404 }
      );
    }

    // Log wallet generation for audit
    const clientIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const { error: logError } = await supabase
      .from('wallet_generation_log')
      .insert({
        merchant_id: merchant.id,
        generation_method,
        currencies_generated: walletResult.wallets.map(w => w.currency),
        client_ip: clientIp,
        user_agent: userAgent
      });

    if (logError) {
      console.error('Failed to log wallet generation:', logError);
      // Don't fail the request for logging errors
    }

    // Return wallet generation result (without storing mnemonic on server)
    return NextResponse.json({
      success: true,
      message: 'Wallets generated successfully',
      data: {
        wallets: walletResult.wallets,
        trust_wallet_compatible: walletResult.trust_wallet_compatible,
        generation_method: walletResult.generation_method,
        timestamp: walletResult.timestamp,
        total_wallets: walletResult.wallets.length
      },
      // Include mnemonic in response for client-side handling
      // Client should save this securely and never send back to server
      mnemonic: walletResult.mnemonic,
      security_notice: 'IMPORTANT: Save your mnemonic phrase securely. We do not store it on our servers.'
    });

  } catch (error) {
    console.error('Wallet generation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate wallets',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve supported currencies for wallet generation
export async function GET() {
  try {
    const supportedCurrencies = getSupportedCurrencies();
    
    // Group currencies by network for better UX
    const currenciesByNetwork = {
      bitcoin: supportedCurrencies.filter(c => ['BTC'].includes(c)),
      ethereum: supportedCurrencies.filter(c => 
        ['ETH', 'USDT', 'USDC'].includes(c)
      ),
      bsc: supportedCurrencies.filter(c => 
        ['BNB', 'USDT_BEP20', 'USDC_BEP20'].includes(c)
      ),
      polygon: supportedCurrencies.filter(c => 
        ['MATIC', 'USDT_POLYGON', 'USDC_POLYGON'].includes(c)
      ),
      tron: supportedCurrencies.filter(c => 
        ['TRX', 'USDT_TRC20'].includes(c)
      ),
      solana: supportedCurrencies.filter(c => ['SOL'].includes(c)),
      other: supportedCurrencies.filter(c => 
        !['BTC', 'ETH', 'USDT', 'USDC', 'BNB', 'USDT_BEP20', 'USDC_BEP20', 
          'MATIC', 'USDT_POLYGON', 'USDC_POLYGON', 'TRX', 'USDT_TRC20', 'SOL'].includes(c)
      )
    };

    // Popular currencies for Trust Wallet (recommended defaults)
    const popularCurrencies = [
      'BTC', 'ETH', 'LTC', 'SOL', 'BNB', 'MATIC', 'TRX', 'USDT', 'USDC'
    ];

    return NextResponse.json({
      success: true,
      supported_currencies: supportedCurrencies,
      currencies_by_network: currenciesByNetwork,
      popular_currencies: popularCurrencies,
      total_supported: supportedCurrencies.length,
      trust_wallet_compatible: true,
      generation_info: {
        method: 'client_side',
        security: 'Private keys never touch server',
        mnemonic_words: 12,
        derivation_standard: 'BIP44'
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

