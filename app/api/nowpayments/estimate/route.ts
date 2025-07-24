import { NextRequest, NextResponse } from 'next/server';
import { getNOWPaymentsClient } from '@/lib/nowpayments';

// Helper function to add delay between API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const amount = searchParams.get('amount');
    const currencyFrom = searchParams.get('currency_from');
    const currencyTo = searchParams.get('currency_to');

    // Validate required parameters
    if (!amount || !currencyFrom || !currencyTo) {
      return NextResponse.json(
        { 
          error: 'Missing required parameters',
          required: ['amount', 'currency_from', 'currency_to']
        },
        { status: 400 }
      );
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Must be a positive number.' },
        { status: 400 }
      );
    }

    // Get NOWPayments client
    const nowPayments = getNOWPaymentsClient();

    // Get estimate from NOWPayments
    const estimate = await nowPayments.getEstimate({
      amount: amountNum,
      currency_from: currencyFrom.toLowerCase(),
      currency_to: currencyTo.toLowerCase()
    });

    // Calculate fees for transparency
    const cryptracFeeRate = 0.019; // 1.9%
    const nowPaymentsFeeRate = 0.01; // 1% (estimated)
    
    const cryptracFee = amountNum * cryptracFeeRate;
    const nowPaymentsFee = amountNum * nowPaymentsFeeRate;
    const totalFees = cryptracFee + nowPaymentsFee;
    const merchantReceives = amountNum - totalFees;

    return NextResponse.json({
      success: true,
      estimate: {
        currency_from: estimate.currency_from.toUpperCase(),
        amount_from: estimate.amount_from,
        currency_to: estimate.currency_to.toUpperCase(),
        estimated_amount: estimate.estimated_amount,
        estimated_amount_formatted: parseFloat(estimate.estimated_amount.toString()).toFixed(8)
      },
      fees: {
        cryptrac_fee: cryptracFee,
        gateway_fee: nowPaymentsFee,
        total_fees: totalFees,
        merchant_receives: merchantReceives,
        fee_percentage: ((totalFees / amountNum) * 100).toFixed(2)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting estimate:', error);
    
    // Handle specific NOWPayments errors
    if (error instanceof Error && error.message.includes('NOWPayments API error')) {
      return NextResponse.json(
        { 
          error: 'Currency conversion unavailable',
          message: 'The requested currency pair is not supported or temporarily unavailable.'
        },
        { status: 422 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to get currency estimate',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST endpoint for batch estimates with rate limiting
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency_from, currencies_to } = body;

    // Validate required parameters
    if (!amount || !currency_from || !currencies_to || !Array.isArray(currencies_to)) {
      return NextResponse.json(
        { 
          error: 'Missing required parameters',
          required: {
            amount: 'number',
            currency_from: 'string',
            currencies_to: 'array of strings'
          }
        },
        { status: 400 }
      );
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Must be a positive number.' },
        { status: 400 }
      );
    }

    console.log('🔍 Batch estimates request:', { amount: amountNum, currency_from, currencies_to });

    // Get NOWPayments client
    const nowPayments = getNOWPaymentsClient();

    // Get estimates for all requested currencies with rate limiting
    const estimates = [];
    const failed = [];

    for (let i = 0; i < currencies_to.length; i++) {
      const currencyTo = currencies_to[i];
      
      try {
        console.log(`🔍 Getting estimate for ${currencyTo} (${i + 1}/${currencies_to.length})`);
        
        // Add delay between requests to avoid rate limiting (except for first request)
        if (i > 0) {
          console.log('⏱️ Adding 1 second delay to avoid rate limits...');
          await delay(1000); // 1 second delay between requests
        }

        const estimate = await nowPayments.getEstimate({
          amount: amountNum,
          currency_from: currency_from.toLowerCase(),
          currency_to: currencyTo.toLowerCase()
        });

        estimates.push({
          currency_to: currencyTo.toUpperCase(),
          estimated_amount: estimate.estimated_amount,
          estimated_amount_formatted: parseFloat(estimate.estimated_amount.toString()).toFixed(8),
          success: true
        });

        console.log(`✅ Success for ${currencyTo}: ${estimate.estimated_amount}`);

      } catch (error) {
        console.log(`❌ Failed for ${currencyTo}:`, error instanceof Error ? error.message : 'Unknown error');
        
        // Check if it's a rate limit error
        if (error instanceof Error && error.message.includes('429')) {
          console.log('⏱️ Rate limit detected, adding longer delay...');
          
          // For rate limit errors, try again after a longer delay
          try {
            await delay(3000); // 3 second delay for rate limit recovery
            
            const retryEstimate = await nowPayments.getEstimate({
              amount: amountNum,
              currency_from: currency_from.toLowerCase(),
              currency_to: currencyTo.toLowerCase()
            });

            estimates.push({
              currency_to: currencyTo.toUpperCase(),
              estimated_amount: retryEstimate.estimated_amount,
              estimated_amount_formatted: parseFloat(retryEstimate.estimated_amount.toString()).toFixed(8),
              success: true
            });

            console.log(`✅ Retry success for ${currencyTo}: ${retryEstimate.estimated_amount}`);

          } catch (retryError) {
            failed.push({
              currency_to: currencyTo.toUpperCase(),
              error: retryError instanceof Error ? retryError.message : 'Unknown error',
              success: false
            });
            console.log(`❌ Retry also failed for ${currencyTo}`);
          }
        } else {
          failed.push({
            currency_to: currencyTo.toUpperCase(),
            error: error instanceof Error ? error.message : 'Unknown error',
            success: false
          });
        }
      }
    }

    // Calculate fees
    const cryptracFeeRate = 0.019; // 1.9%
    const nowPaymentsFeeRate = 0.01; // 1% (estimated)
    
    const cryptracFee = amountNum * cryptracFeeRate;
    const nowPaymentsFee = amountNum * nowPaymentsFeeRate;
    const totalFees = cryptracFee + nowPaymentsFee;
    const merchantReceives = amountNum - totalFees;

    console.log(`🔍 Final results: ${estimates.length} successful, ${failed.length} failed`);

    return NextResponse.json({
      success: true,
      currency_from: currency_from.toUpperCase(),
      amount_from: amountNum,
      estimates: estimates,
      failed_estimates: failed,
      fees: {
        cryptrac_fee: cryptracFee,
        gateway_fee: nowPaymentsFee,
        total_fees: totalFees,
        merchant_receives: merchantReceives,
        fee_percentage: ((totalFees / amountNum) * 100).toFixed(2)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting batch estimates:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get batch estimates',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

