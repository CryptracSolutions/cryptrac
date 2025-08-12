import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

async function getServiceAndMerchant(request: NextRequest) {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return { error: 'Unauthorized' };
  const token = auth.substring(7);
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data: { user } } = await anon.auth.getUser(token);
  if (!user) return { error: 'Unauthorized' };
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
  const service = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: merchant } = await service.from('merchants').select('id').eq('user_id', user.id).single();
  if (!merchant) return { error: 'Merchant not found' };
  return { service, merchant };
}

export async function POST(request: NextRequest) {
  const auth = await getServiceAndMerchant(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }
  const { service, merchant } = auth;
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_FROM_NUMBER;
  const appOrigin = process.env.APP_ORIGIN;
  const body = await request.json();
  const { phone, payment_link_id } = body;
  if (!phone || !payment_link_id) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  const { data: link } = await service
    .from('payment_links')
    .select('link_id')
    .eq('id', payment_link_id)
    .eq('merchant_id', merchant.id)
    .single();
  if (!link) {
    return NextResponse.json({ error: 'Payment link not found' }, { status: 404 });
  }
  if (twilioSid && twilioToken && twilioFrom && appOrigin) {
    try {
      const message = `Receipt: ${appOrigin}/pay/${link.link_id}`;
      const creds = btoa(`${twilioSid}:${twilioToken}`);
      await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: 'POST',
        headers: { 'Authorization': `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ From: twilioFrom, To: phone, Body: message })
      });
      await service.from('sms_logs').insert({ merchant_id: merchant.id, phone, type: 'receipt', status: 'sent', payload: { message, link_id: payment_link_id } });
    } catch (err) {
      console.error('receipt sms error', err);
    }
  }
  return NextResponse.json({ success: true });
}

