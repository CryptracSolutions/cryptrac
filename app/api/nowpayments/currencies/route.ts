import { NextResponse } from 'next/server';
import { syncCurrenciesFromNOWPayments } from '@/lib/currency-service';

export async function GET() {
  try {
    // Sync currencies from NOWPayments to database
    const result = await syncCurrenciesFromNOWPayments();
    
    if (!result.success) {
      return NextResponse.json(
        { 
          error: 'Failed to sync currencies',
          message: result.message,
          details: result.error
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      synced_count: result.synced_count,
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error syncing currencies:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to sync currencies',
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
    // Force refresh by calling the sync function
    const result = await syncCurrenciesFromNOWPayments();
    
    if (!result.success) {
      return NextResponse.json(
        { 
          error: 'Failed to manually sync currencies',
          message: result.message,
          details: result.error
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Manual sync completed: ${result.message}`,
      synced_count: result.synced_count,
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in manual currency sync:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to manually sync currencies',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

