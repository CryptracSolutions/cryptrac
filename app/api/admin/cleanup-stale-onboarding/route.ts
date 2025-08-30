import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Admin endpoint to cleanup stale incomplete onboarding records
 * This can be called by scheduled jobs to remove old incomplete merchant records
 * Records older than 7 days with incomplete onboarding will be removed
 */
export async function POST(request: NextRequest) {
  try {
    // Verify internal API key for security
    const apiKey = request.headers.get('x-internal-api-key');
    if (!apiKey || apiKey !== process.env.INTERNAL_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Use service role key for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log('🧹 Starting scheduled cleanup of stale incomplete onboarding records...');

    // Calculate cutoff date (7 days ago)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);
    const cutoffISO = cutoffDate.toISOString();

    console.log('📅 Cutoff date for cleanup:', cutoffISO);

    // Find incomplete merchant records older than 7 days
    const { data: staleMerchants, error: findError } = await supabase
      .from('merchants')
      .select('id, user_id, business_name, created_at')
      .or('onboarding_completed.is.null,onboarding_completed.eq.false')
      .lt('created_at', cutoffISO);

    if (findError) {
      console.error('❌ Error finding stale merchants:', findError);
      return NextResponse.json(
        { error: 'Failed to find stale merchant records' },
        { status: 500 }
      );
    }

    if (!staleMerchants || staleMerchants.length === 0) {
      console.log('✅ No stale incomplete merchant records found');
      return NextResponse.json({ 
        success: true, 
        message: 'No stale records to clean up',
        cleanedCount: 0 
      });
    }

    console.log(`🧹 Found ${staleMerchants.length} stale incomplete merchant records:`, staleMerchants);

    let cleanedCount = 0;
    const cleanedRecords = [];

    for (const merchant of staleMerchants) {
      console.log(`🗑️ Cleaning up stale merchant record:`, merchant.id);

      try {
        // Delete related records first
        
        // Delete merchant settings
        await supabase
          .from('merchant_settings')
          .delete()
          .eq('merchant_id', merchant.id);

        // Delete payment links
        await supabase
          .from('payment_links')
          .delete()
          .eq('merchant_id', merchant.id);

        // Delete subscriptions
        await supabase
          .from('subscriptions')
          .delete()
          .eq('merchant_id', merchant.id);

        // Delete the merchant record
        const { error: merchantError } = await supabase
          .from('merchants')
          .delete()
          .eq('id', merchant.id);

        if (merchantError) {
          console.error('❌ Error deleting stale merchant:', merchantError);
          continue; // Skip this one and continue with others
        }

        cleanedCount++;
        cleanedRecords.push({
          id: merchant.id,
          user_id: merchant.user_id,
          business_name: merchant.business_name,
          created_at: merchant.created_at
        });

        console.log(`✅ Successfully cleaned up stale merchant record:`, merchant.id);

      } catch (error) {
        console.error(`❌ Error cleaning up merchant ${merchant.id}:`, error);
        continue; // Continue with other records
      }
    }

    console.log(`🧹 Scheduled cleanup completed. Removed ${cleanedCount} stale incomplete merchant records.`);

    return NextResponse.json({
      success: true,
      message: `Successfully cleaned up ${cleanedCount} stale incomplete merchant record(s)`,
      cleanedCount,
      cutoffDate: cutoffISO,
      cleanedRecords
    });

  } catch (error) {
    console.error('💥 Scheduled cleanup API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check how many stale records exist without cleaning them
 */
export async function GET(request: NextRequest) {
  try {
    // Verify internal API key for security
    const apiKey = request.headers.get('x-internal-api-key');
    if (!apiKey || apiKey !== process.env.INTERNAL_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Calculate cutoff date (7 days ago)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);
    const cutoffISO = cutoffDate.toISOString();

    // Count incomplete merchant records older than 7 days
    const { data: staleMerchants, error: countError } = await supabase
      .from('merchants')
      .select('id, user_id, business_name, created_at')
      .or('onboarding_completed.is.null,onboarding_completed.eq.false')
      .lt('created_at', cutoffISO);

    if (countError) {
      return NextResponse.json(
        { error: 'Failed to count stale records' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      staleRecordsCount: staleMerchants?.length || 0,
      cutoffDate: cutoffISO,
      staleRecords: staleMerchants || []
    });

  } catch (error) {
    console.error('💥 Stale records check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}