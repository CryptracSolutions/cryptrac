import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Cleans up incomplete merchant onboarding data
 * This endpoint can be called to remove any orphaned merchant records
 * where onboarding was never completed
 */
export async function POST(request: NextRequest) {
  try {
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
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
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

    console.log('🧹 Starting cleanup for user:', user.id);

    // Find any incomplete merchant records for this user
    const { data: incompleteMerchants, error: findError } = await supabase
      .from('merchants')
      .select('id, business_name, onboarding_completed, created_at')
      .eq('user_id', user.id)
      .or('onboarding_completed.is.null,onboarding_completed.eq.false');

    if (findError) {
      console.error('❌ Error finding incomplete merchants:', findError);
      return NextResponse.json(
        { error: 'Failed to check merchant records' },
        { status: 500 }
      );
    }

    if (!incompleteMerchants || incompleteMerchants.length === 0) {
      console.log('✅ No incomplete merchant records found');
      return NextResponse.json({ 
        success: true, 
        message: 'No incomplete records to clean up',
        cleanedCount: 0 
      });
    }

    console.log(`🧹 Found ${incompleteMerchants.length} incomplete merchant records:`, incompleteMerchants);

    let cleanedCount = 0;

    for (const merchant of incompleteMerchants) {
      console.log(`🗑️ Cleaning up merchant record:`, merchant.id);

      // Delete related merchant settings first (if any)
      const { error: settingsError } = await supabase
        .from('merchant_settings')
        .delete()
        .eq('merchant_id', merchant.id);

      if (settingsError && settingsError.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('❌ Error deleting merchant settings:', settingsError);
        // Continue with merchant deletion even if settings deletion fails
      }

      // Delete any payment links associated with this merchant
      const { error: paymentLinksError } = await supabase
        .from('payment_links')
        .delete()
        .eq('merchant_id', merchant.id);

      if (paymentLinksError && paymentLinksError.code !== 'PGRST116') {
        console.error('❌ Error deleting payment links:', paymentLinksError);
        // Continue with cleanup
      }

      // Delete any subscriptions associated with this merchant
      const { error: subscriptionsError } = await supabase
        .from('subscriptions')
        .delete()
        .eq('merchant_id', merchant.id);

      if (subscriptionsError && subscriptionsError.code !== 'PGRST116') {
        console.error('❌ Error deleting subscriptions:', subscriptionsError);
        // Continue with cleanup
      }

      // Finally, delete the merchant record
      const { error: merchantError } = await supabase
        .from('merchants')
        .delete()
        .eq('id', merchant.id)
        .eq('user_id', user.id); // Extra safety check

      if (merchantError) {
        console.error('❌ Error deleting merchant:', merchantError);
        return NextResponse.json(
          { error: `Failed to delete merchant record: ${merchantError.message}` },
          { status: 500 }
        );
      }

      cleanedCount++;
      console.log(`✅ Successfully cleaned up merchant record:`, merchant.id);
    }

    console.log(`🧹 Cleanup completed. Removed ${cleanedCount} incomplete merchant records.`);

    return NextResponse.json({
      success: true,
      message: `Successfully cleaned up ${cleanedCount} incomplete merchant record(s)`,
      cleanedCount,
      cleanedRecords: incompleteMerchants.map(m => ({
        id: m.id,
        business_name: m.business_name,
        created_at: m.created_at
      }))
    });

  } catch (error) {
    console.error('💥 Cleanup API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}