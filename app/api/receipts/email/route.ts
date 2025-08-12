import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

async function logEmail(supabase: SupabaseClient, data: Record<string, unknown>) {
  let { error } = await supabase.from('email_logs').insert({ ...data, status: 'sent' });
  if (error) {
    if (error.message && error.message.includes('column')) {
      const minimal = { email: data.to_email, type: data.type, status: 'sent' };
      ({ error } = await supabase.from('email_logs').insert(minimal));
      if (error) console.error('email log error', error);
    } else {
      console.error('email log error', error);
    }
  }
}

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
  const sendgridKey = process.env.SENDGRID_API_KEY;
  const appOrigin = process.env.APP_ORIGIN;
  const body = await request.json();
  const { email, payment_link_id } = body;
  if (!email || !payment_link_id) {
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
  if (sendgridKey && appOrigin) {
    try {
      await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${sendgridKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalizations: [{ to: [{ email }], subject: 'Your receipt' }],
          from: { email: 'no-reply@cryptrac.com' },
          content: [{ type: 'text/html', value: `<p>Thank you for your payment.</p><p><a href="${appOrigin}/pay/${link.link_id}">View payment</a></p>` }]
        })
      });
      await logEmail(service, { merchant_id: merchant.id, type: 'receipt', to_email: email, subject: 'Your receipt' });
    } catch (err) {
      console.error('receipt email error', err);
    }
  }
  return NextResponse.json({ success: true });
}

