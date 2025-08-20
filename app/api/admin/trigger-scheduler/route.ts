import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

async function getServiceAndMerchant(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Missing or invalid Authorization header' };
  }
  const token = authHeader.substring(7);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return { error: 'Unauthorized' };
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
  }
  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const { data: merchant, error: merchantError } = await service
    .from('merchants')
    .select('id')
    .eq('user_id', user.id)
    .single();
  if (merchantError || !merchant) return { error: 'Merchant account not found' };
  return { service, merchant, user };
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getServiceAndMerchant(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    const { service } = auth;

    console.log('🔧 Manual scheduler trigger requested');

    // Call the subscription scheduler function
    const { data, error } = await service.functions.invoke('subscriptions-scheduler', {
      body: {}
    });

    if (error) {
      console.error('❌ Scheduler function error:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to trigger scheduler',
        details: error.message 
      }, { status: 500 });
    }

    console.log('✅ Scheduler triggered successfully:', data);

    return NextResponse.json({ 
      success: true, 
      message: 'Subscription scheduler triggered successfully',
      data: data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Manual scheduler trigger error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

