import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
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
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if merchant already exists
    const { data: existingMerchant, error: checkError } = await supabase
      .from('merchants')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (existingMerchant) {
      return NextResponse.json({
        success: true,
        merchant: existingMerchant,
        message: 'Merchant already exists'
      });
    }

    // Only proceed with creation if no merchant exists and no error (or error is "not found")
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing merchant:', checkError);
      return NextResponse.json(
        { error: 'Failed to check merchant status' },
        { status: 500 }
      );
    }

    // Create merchant record
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .insert({
        user_id: user.id,
        business_name: user.user_metadata?.business_name || user.email?.split('@')[0] || 'My Business',
        country: user.user_metadata?.country || 'US',
        trial_end: user.user_metadata?.trial_end ? new Date(user.user_metadata.trial_end).toISOString() : null,
        onboarded: user.user_metadata?.onboarded || false,
        plan: 'cryptrac',
        usage_count: 0,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (merchantError) {
      // If it's a duplicate key error, fetch the existing merchant
      if (merchantError.code === '23505') {
        const { data: existingMerchant, error: fetchError } = await supabase
          .from('merchants')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (fetchError) {
          console.error('Failed to fetch existing merchant:', fetchError);
          return NextResponse.json(
            { error: 'Failed to retrieve merchant record' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          merchant: existingMerchant,
          message: 'Merchant already exists'
        });
      }

      console.error('Merchant creation error:', merchantError);
      return NextResponse.json(
        { error: 'Failed to create merchant record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      merchant,
      message: 'Merchant created successfully'
    });

  } catch (error) {
    console.error('Merchant creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

