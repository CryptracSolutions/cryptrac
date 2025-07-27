import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { 
  generateWallets, 
  getTrustWalletCurrencies,
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

    // Get Trust Wallet compatible currencies
    const trustWalletCurrencies = getTrustWalletCurrencies();
    const supportedCurrencies = trustWalletCurrencies.map(c => c.code);

    // Validate currencies if provided, otherwise use all Trust Wallet currencies
    const currenciesToGenerate = currencies || supportedCurrencies;
    
    if (currencies) {
      const invalidCurrencies = currencies.filter(c => 
        !supportedCurrencies.includes(c.toUpperCase())
      );
      
      if (invalidCurrencies.length > 0) {
        return NextResponse.json(
          { 
            error: 'Unsupported currencies provided',
            invalid_currencies: invalidCurrencies,
            supported_currencies: supportedCurrencies,
            trust_wallet_currencies: trustWalletCurrencies
          },
          { status: 400 }
        );
      }
    }

    // Generate wallets
    console.log('Generating wallets for user:', user.id);
    const walletResult = await generateWallets({
      currencies: currenciesToGenerate.map(c => c.toUpperCase()),
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

// GET endpoint to retrieve Trust Wallet compatible currencies
export async function GET() {
  try {
    const trustWalletCurrencies = getTrustWalletCurrencies();
    
    // Group currencies by network for better UX
    const currenciesByNetwork = trustWalletCurrencies.reduce((acc, currency) => {
      const network = currency.network;
      if (!acc[network]) {
        acc[network] = [];
      }
      acc[network].push(currency);
      return acc;
    }, {} as Record<string, typeof trustWalletCurrencies>);

    // Popular currencies for Trust Wallet (all of them are popular since it's a curated list)
    const popularCurrencies = trustWalletCurrencies.map(c => c.code);

    return NextResponse.json({
      success: true,
      trust_wallet_currencies: trustWalletCurrencies,
      supported_currencies: popularCurrencies,
      currencies_by_network: currenciesByNetwork,
      popular_currencies: popularCurrencies,
      total_supported: trustWalletCurrencies.length,
      trust_wallet_compatible: true,
      generation_info: {
        method: 'client_side',
        security: 'Private keys never touch server',
        mnemonic_words: 12,
        derivation_standard: 'BIP44',
        networks_supported: Object.keys(currenciesByNetwork)
      }
    });

  } catch (error) {
    console.error('Error fetching Trust Wallet currencies:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch Trust Wallet currencies',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

