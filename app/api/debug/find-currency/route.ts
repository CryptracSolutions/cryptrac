import { NextResponse } from 'next/server';
import { getSupportedCurrencies } from '@/lib/currency-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    
    if (!search) {
      return NextResponse.json(
        { success: false, error: 'Missing search parameter' },
        { status: 400 }
      );
    }
    
    // Get all currencies from API
    const currencies = await getSupportedCurrencies();
    
    // Search by name or code (case insensitive)
    const searchLower = search.toLowerCase();
    const matches = currencies.filter(currency => 
      currency.code.toLowerCase().includes(searchLower) ||
      currency.name.toLowerCase().includes(searchLower) ||
      (currency.symbol && currency.symbol.toLowerCase().includes(searchLower))
    );
    
    return NextResponse.json({
      success: true,
      search_term: search,
      matches: matches,
      count: matches.length
    });

  } catch (error) {
    console.error('Error searching currencies:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to search currencies',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}