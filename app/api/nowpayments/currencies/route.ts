import { NextResponse } from 'next/server';
import { syncCurrenciesFromNOWPayments, getSupportedCurrencies } from '@/lib/currency-service';

export async function GET() {
  try {
    console.log('🔄 Currencies API called - fetching supported currencies...');
    
    // First, try to get currencies from database/cache
    let currencies = await getSupportedCurrencies();
    
    // If no currencies found, sync from NOWPayments
    if (!currencies || currencies.length === 0) {
      console.log('📡 No cached currencies found, syncing from NOWPayments...');
      
      const syncResult = await syncCurrenciesFromNOWPayments();
      
      if (!syncResult.success) {
        console.error('❌ Failed to sync currencies:', syncResult.message);
        return NextResponse.json(
          { 
            success: false,
            error: 'Failed to sync currencies',
            message: syncResult.message,
            details: syncResult.error
          },
          { status: 500 }
        );
      }
      
      console.log(`✅ Synced ${syncResult.synced_count} currencies, now fetching...`);
      
      // Try to get currencies again after sync
      currencies = await getSupportedCurrencies();
    }
    
    if (!currencies || currencies.length === 0) {
      console.error('❌ Still no currencies available after sync');
      return NextResponse.json(
        { 
          success: false,
          error: 'No currencies available',
          message: 'Failed to load currencies from database'
        },
        { status: 500 }
      );
    }

    // Transform currencies to include display_name for frontend compatibility
    const transformedCurrencies = currencies.map(currency => ({
      ...currency,
      display_name: currency.name || currency.code,
      rate_usd: currency.rate_usd || 0
    }));

    console.log(`✅ Returning ${transformedCurrencies.length} currencies to frontend`);

    return NextResponse.json({
      success: true,
      currencies: transformedCurrencies,
      count: transformedCurrencies.length,
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in currencies API:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to get currencies',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// POST endpoint to manually trigger currency sync
export async function POST() {
  try {
    console.log('🔄 Manual currency sync triggered...');
    
    // Force refresh by calling the sync function
    const result = await syncCurrenciesFromNOWPayments();
    
    if (!result.success) {
      console.error('❌ Manual sync failed:', result.message);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to manually sync currencies',
          message: result.message,
          details: result.error
        },
        { status: 500 }
      );
    }

    console.log(`✅ Manual sync completed: ${result.synced_count} currencies`);

    // Get the updated currencies to return
    const currencies = await getSupportedCurrencies(true); // Force refresh
    
    // Transform currencies to include display_name for frontend compatibility
    const transformedCurrencies = currencies.map(currency => ({
      ...currency,
      display_name: currency.name || currency.code,
      rate_usd: currency.rate_usd || 0
    }));
    
    return NextResponse.json({
      success: true,
      message: `Manual sync completed: ${result.message}`,
      currencies: transformedCurrencies,
      synced_count: result.synced_count,
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in manual currency sync:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to manually sync currencies',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

