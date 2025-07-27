import { NextResponse } from 'next/server';
import { getAllTrustWalletCurrencies, getTrustWalletCurrenciesByNetwork, getNetworkDisplayInfo } from '@/lib/trust-wallet-service';

export async function GET() {
  try {
    // Get all Trust Wallet compatible currencies
    const currencies = getAllTrustWalletCurrencies();
    
    // Group by network
    const currenciesByNetwork = getTrustWalletCurrenciesByNetwork();
    
    // Add network display information
    const networksWithDisplayInfo = Object.keys(currenciesByNetwork).map(network => ({
      network,
      displayInfo: getNetworkDisplayInfo(network),
      currencies: currenciesByNetwork[network]
    }));

    // Get summary statistics
    const stats = {
      total_currencies: currencies.length,
      total_networks: Object.keys(currenciesByNetwork).length,
      native_currencies: currencies.filter(c => !c.is_token).length,
      token_currencies: currencies.filter(c => c.is_token).length
    };

    return NextResponse.json({
      success: true,
      currencies,
      currencies_by_network: currenciesByNetwork,
      networks_with_display_info: networksWithDisplayInfo,
      stats,
      trust_wallet_compatible: true,
      generation_method: 'trust_wallet',
      last_updated: new Date().toISOString(),
      cache_info: {
        cached: false, // This is static data
        source: 'trust_wallet_service'
      }
    });

  } catch (error) {
    console.error('Trust Wallet currencies fetch error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch Trust Wallet currencies',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

